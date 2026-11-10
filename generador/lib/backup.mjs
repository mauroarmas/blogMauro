import { backup } from 'node:sqlite';
import { execFile } from 'node:child_process';
import { chmod, link, rm, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { restrictedEnvironment } from './config.mjs';
import { StudioError } from './errors.mjs';

export function inspectBackup(path){
  return new Promise((resolve,reject)=>{
    execFile(process.execPath,[fileURLToPath(new URL('./backup-worker.mjs',import.meta.url)),'--inspect',path],{env:restrictedEnvironment(),timeout:60000,maxBuffer:1024*1024,encoding:'utf8'},(error,stdout)=>{
      if(error)return reject(new StudioError('INVALID_BACKUP','La copia no es válida, compatible o está incompleta.',{status:422}));
      try{resolve(JSON.parse(stdout));}catch{reject(new StudioError('INVALID_BACKUP','No se pudo validar la copia.',{status:422}));}
    });
  });
}
export async function exportBackup(db,path){
  if(db.isTransaction)throw new StudioError('INVALID_STATE','No se puede copiar durante una transacción.',{status:409});
  const active=db.prepare("SELECT count(*) n FROM operations WHERE state='running' AND kind NOT IN ('backup.export','backup.restore')").get().n;
  if(active)throw new StudioError('INVALID_STATE','Esperá a que termine la operación activa antes de copiar.',{status:409});
  const temporary=`${path}.${randomUUID()}.tmp`;
  try {
    await backup(db,temporary);await chmod(temporary,0o600);
    if((await stat(temporary)).size>512*1024*1024)throw new StudioError('BACKUP_TOO_LARGE','La copia supera 512 MiB.',{status:422});
    const inspected=await inspectBackup(temporary);
    try{await link(temporary,path);}catch(error){if(error.code==='EEXIST')throw new StudioError('BACKUP_EXISTS','Ya existe un archivo con ese nombre.',{status:409});throw error;}
    return inspected;
  } finally {await rm(temporary,{force:true});}
}

/** Copia datos de tablas verificadas a un esquema creado por la aplicación. */
export async function prepareRestore({storage,sourcePath,expectedHash,expectedDatasetId,operationId}){
  const { DatabaseSync }=await import('node:sqlite');
  const { copyFile, constants }=await import('node:fs/promises');
  const { join }=await import('node:path');
  const { canonicalJson }=await import('./schemas.mjs');
  const { currentPeriod,usage }=await import('./providers/budget.mjs');
  const { recordActivity }=await import('./activity.mjs');
  const initial=await import('./migrations/001-studio.mjs'),guard=await import('./migrations/002-restore-guard.mjs');
  const current=storage.db.prepare('SELECT dataset_id FROM schema_metadata').get();
  if(!current||current.dataset_id!==expectedDatasetId)throw new StudioError('REVISION_CONFLICT','El conjunto local cambió desde la inspección.',{status:409});
  if(storage.db.prepare('SELECT required FROM restore_reconciliation WHERE id=1').get()?.required)throw new StudioError('RECONCILIATION_REQUIRED','Conciliá la restauración anterior antes de reemplazar nuevamente los datos.',{status:409});
  const op=storage.db.prepare('SELECT * FROM operations WHERE id=?').get(operationId);
  if(!op||op.state!=='running')throw new StudioError('INVALID_STATE','La restauración no está activa.',{status:409});
  const period=currentPeriod(),previousUsage=usage(storage.db,period),copied=join(storage.directory,`validate-${randomUUID()}.sqlite`),prepared=join(storage.directory,`restore-${randomUUID()}.sqlite`);
  let source,dest;
  try {
    await copyFile(sourcePath,copied,constants.COPYFILE_EXCL);await chmod(copied,0o600);
    const checked=await inspectBackup(copied);if(checked.sha256!==expectedHash)throw new StudioError('REVISION_CONFLICT','La copia cambió después de inspeccionarla.',{status:409});
    source=new DatabaseSync(copied,{readOnly:true,allowExtension:false,defensive:true,timeout:5000});source.exec('PRAGMA trusted_schema=OFF; PRAGMA query_only=ON;');source.enableLoadExtension(false);source.enableDefensive(true);
    dest=new DatabaseSync(prepared);await chmod(prepared,0o600);dest.exec('PRAGMA foreign_keys=OFF;');dest.exec(initial.sql);dest.exec(guard.sql);
    const tables=dest.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row=>row.name);
    const quote=name=>'"'+name.replaceAll('"','""')+'"';
    dest.exec('BEGIN IMMEDIATE');
    try {
      for(const table of tables){
        const columns=dest.prepare(`PRAGMA table_info(${quote(table)})`).all().map(column=>column.name);
        const insert=dest.prepare(`INSERT INTO ${quote(table)} (${columns.map(quote).join(',')}) VALUES (${columns.map(()=>'?').join(',')})`);
        for(const row of source.prepare(`SELECT ${columns.map(quote).join(',')} FROM ${quote(table)}`).iterate())insert.run(...columns.map(name=>row[name]));
      }
      dest.exec("UPDATE operations SET state='interrupted',error_code='RESTORED_INTERRUPTED',finished_at=datetime('now') WHERE state IN ('running','queued')");
      dest.exec("UPDATE budget_reservations SET state='uncertain' WHERE state='reserved'");
      dest.exec('UPDATE ai_settings SET enabled=0,validated_revision_id=NULL,validation_operation_id=NULL,revision=revision+1');
      dest.exec('DELETE FROM restore_reconciliation');
      const now=new Date().toISOString();
      dest.prepare('INSERT INTO restore_reconciliation(id,required,period_key,prior_dataset_id,prior_known_microusd,prior_uncertain_microusd,created_at) VALUES(1,1,?,?,?,?,?)').run(period,current.dataset_id,previousUsage.accounted+previousUsage.adjustment,previousUsage.reserved+previousUsage.uncertain,now);
      // Mantener la operación que el cliente está consultando tras el reemplazo.
      if(dest.prepare('SELECT 1 FROM operations WHERE id=? OR request_key=?').get(op.id,op.request_key))throw new StudioError('REVISION_CONFLICT','La operación de restauración colisiona con el backup.',{status:409});
      const result={restored:true,datasetId:checked.datasetId,requiresReconciliation:true};
      dest.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,attempt,retry_of_id,result_refs,error_code,started_at,finished_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(op.id,op.kind,op.request_key,op.request_sha256,op.input_manifest,'succeeded',op.progress,op.attempt,null,canonicalJson(result),null,op.started_at,now,op.created_at);
      recordActivity(dest,{entityType:'restore',entityId:op.id,kind:'restored',actor:'owner',details:{previousDatasetId:current.dataset_id,restoredDatasetId:checked.datasetId,backupSha256:checked.sha256}});
      dest.exec(`PRAGMA user_version=${guard.version}; COMMIT`);
    }catch(error){dest.exec('ROLLBACK');throw error;}
    dest.exec('PRAGMA foreign_keys=ON; PRAGMA trusted_schema=OFF;');
    if(!dest.prepare('PRAGMA foreign_key_check').iterate().next().done)throw new StudioError('INVALID_BACKUP','La copia tiene relaciones inválidas.',{status:422});
    if(dest.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new StudioError('INVALID_BACKUP','La copia restaurada no superó la verificación.',{status:422});
    source.close();source=null;dest.close();dest=null;
    const finalCheck=await inspectBackup(copied);if(finalCheck.sha256!==checked.sha256)throw new StudioError('REVISION_CONFLICT','La copia cambió durante la restauración.',{status:409});
    return {preparedPath:prepared,inspection:checked,previousDatasetId:current.dataset_id};
  }catch(error){if(source)source.close();if(dest)dest.close();await rm(prepared,{force:true});throw error;}
  finally{await rm(copied,{force:true});}
}
