import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, open, readFile, rename, rm, access, stat } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { acquireRecoveryLock, openStudioDatabase } from './db.mjs';
import { inspectBackup, prepareRestore } from './backup.mjs';
import { currentPeriod, usage } from './providers/budget.mjs';
import { StudioError } from './errors.mjs';

/** Recuperación offline: lock exclusivo y copia recibida validada antes de reemplazar. */
export async function recoverOffline({file,expectedDatasetId,confirmation,dataDirectory,root}){
  if(confirmation!==true||typeof expectedDatasetId!=='string'||typeof file!=='string')throw new StudioError('INVALID_INPUT','Indicá copia, identidad esperada y confirmación.');
  const lock=await acquireRecoveryLock({dataDirectory,root}),dir=lock.directory,active=join(dir,'studio.sqlite'),receiptPath=join(dir,'restore-receipt.json');let work,workStore,prepared,receiptCreated=false,moved=[];
  try{
    const receipt=await readFile(receiptPath,'utf8').then(text=>JSON.parse(text)).catch(error=>{if(error.code==='ENOENT')return null;throw new StudioError('RECOVERY_REQUIRED','El recibo de restauración no se puede leer.',{status:409});});
    let datasetId=receipt?.previousDatasetId||null,priorUsage=null;
    if(await access(active).then(()=>true,()=>false)){
      try{const db=new DatabaseSync(active,{readOnly:true,allowExtension:false,defensive:true});try{const meta=db.prepare('SELECT dataset_id FROM schema_metadata').get();datasetId ||= meta?.dataset_id;if(meta?.dataset_id===expectedDatasetId)priorUsage=usage(db,currentPeriod());}finally{db.close();}}catch{/* La copia podría estar dañada; el recibo es la referencia alternativa. */}
    }
    if(!datasetId||datasetId!==expectedDatasetId)throw new StudioError('REVISION_CONFLICT','No coincide la identidad del conjunto que se recuperará.',{status:409});
    if(!priorUsage && typeof receipt?.previousPath==='string' && dirname(receipt.previousPath)===dir && /^previous-[0-9a-f-]{36}\.sqlite$/i.test(basename(receipt.previousPath))){
      try{const db=new DatabaseSync(receipt.previousPath,{readOnly:true,allowExtension:false,defensive:true});try{if(db.prepare('SELECT dataset_id FROM schema_metadata').get()?.dataset_id===expectedDatasetId)priorUsage=usage(db,currentPeriod());}finally{db.close();}}catch{/* Se pedirá verificar consumo al propietario. */}
    }
    await inspectBackup(file);work=await mkdtemp(join(dir,'.recovery-work-'));workStore=await openStudioDatabase({dataDirectory:work,root});
    const workDataset=workStore.db.prepare('SELECT dataset_id FROM schema_metadata').get().dataset_id,operationId=randomUUID(),now=new Date().toISOString();
    workStore.db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)').run(operationId,'backup.restore',randomUUID(),'a'.repeat(64),'{}','running','{}',now);
    const checked=await inspectBackup(file),result=await prepareRestore({storage:workStore,sourcePath:file,expectedHash:checked.sha256,expectedDatasetId:workDataset,operationId});prepared=result.preparedPath;
    const staged=new DatabaseSync(prepared);try{
      staged.prepare('UPDATE restore_reconciliation SET prior_dataset_id=?,prior_known_microusd=?,prior_uncertain_microusd=?,prior_usage_available=? WHERE id=1').run(expectedDatasetId,priorUsage?priorUsage.accounted+priorUsage.adjustment:0,priorUsage?priorUsage.reserved+priorUsage.uncertain:0,priorUsage?1:0);
      staged.prepare('UPDATE activity_events SET details=? WHERE entity_type=? AND entity_id=? AND kind=?').run(JSON.stringify({previousDatasetId:expectedDatasetId,restoredDatasetId:checked.datasetId,backupSha256:checked.sha256,offlineRecovery:true,priorUsageAvailable:Boolean(priorUsage)}),'restore',operationId,'restored');
    }finally{staged.close();}
    await workStore.close();workStore=null;await inspectBackup(prepared);
    const localPrepared=join(dir,`restore-${randomUUID()}.sqlite`);await rename(prepared,localPrepared);prepared=localPrepared;
    if(!receipt){const handle=await open(receiptPath,'wx',0o600);try{await handle.writeFile(JSON.stringify({schemaVersion:1,previousDatasetId:expectedDatasetId,createdAt:now,offlineRecovery:true}));await handle.sync();receiptCreated=true;}finally{await handle.close();}}
    const previous=join(dir,`failed-${randomUUID()}.sqlite`);
    try{
      for(const suffix of ['', '-wal','-shm'])if(await access(active+suffix).then(()=>true,()=>false)){await rename(active+suffix,previous+suffix);moved.push(suffix);}
      await rename(prepared,active);prepared=null;await inspectBackup(active);await rm(receiptPath,{force:true});
    }catch(error){
      try{if(await access(active).then(()=>true,()=>false))await rename(active,join(dir,`failed-${randomUUID()}.sqlite`));for(const suffix of moved)await rename(previous+suffix,active+suffix);if(receiptCreated)await rm(receiptPath,{force:true});}
      catch{throw new StudioError('RECOVERY_REQUIRED','No se pudo completar la recuperación; conservá el recibo y las copias.',{status:409});}
      throw error;
    }
    return {restored:true,datasetId:checked.datasetId,requiresReconciliation:true,priorUsageAvailable:Boolean(priorUsage)};
  }finally{if(workStore)await workStore.close();if(prepared)await rm(prepared,{force:true});if(work)await rm(work,{recursive:true,force:true});await lock.release();}
}
