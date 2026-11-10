import { DatabaseSync } from 'node:sqlite';
import { open, readFile, unlink, chmod, rename, access } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { privateDirectory } from './config.mjs';
import * as initial from './migrations/001-studio.mjs';
import * as restoreGuard from './migrations/002-restore-guard.mjs';

async function acquireLock(directory) {
  const path = join(directory, 'studio.lock');
  const contents = JSON.stringify({ pid: process.pid, token: randomUUID() });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const file = await open(path, 'wx', 0o600);
      try { await file.writeFile(contents); } finally { await file.close(); }
      return async () => { if (await readFile(path, 'utf8').catch(() => '') === contents) await unlink(path); };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      // Un lock ilegible o un proceso en ejecución no se elimina por precaución.
      let lock;
      try { lock = JSON.parse(await readFile(path, 'utf8')); } catch { throw new Error('No se puede verificar el bloqueo de CV Studio.'); }
      if (!Number.isInteger(lock.pid) || lock.pid <= 0) throw new Error('Bloqueo de CV Studio inválido.');
      try { process.kill(lock.pid, 0); throw new Error('Ya hay una instancia de CV Studio usando estos datos.'); }
      catch (check) { if (check.code !== 'ESRCH') throw check; }
      await unlink(path);
    }
  }
  throw new Error('No se pudo obtener el bloqueo de CV Studio.');
}

export async function openStudioDatabase(options = {}) {
  const directory = await privateDirectory(options);
  const release = await acquireLock(directory);
  let db;
  try {
    const path = join(directory, 'studio.sqlite');
    const receiptPath=join(directory,'restore-receipt.json');
    if(await access(receiptPath).then(()=>true,()=>false))throw new Error('RECOVERY_REQUIRED: una restauración interrumpida necesita recuperación offline.');
    db = new DatabaseSync(path);
    await chmod(path, 0o600);
    db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    let current = db.prepare('PRAGMA user_version').get().user_version;
    if (current > restoreGuard.version) throw new Error('La base fue creada por una versión más reciente de CV Studio.');
    if (current === 0) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.exec(initial.sql);
        db.prepare('INSERT INTO schema_metadata(dataset_id,schema_version,created_at) VALUES(?,?,?)').run(randomUUID(), initial.version, new Date().toISOString());
        db.exec(`PRAGMA user_version=${initial.version}; COMMIT`);
        current = initial.version;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    if(current===initial.version){
      db.exec('BEGIN IMMEDIATE');
      try{db.exec(restoreGuard.sql);db.prepare('UPDATE schema_metadata SET schema_version=?').run(restoreGuard.version);db.exec(`PRAGMA user_version=${restoreGuard.version}; COMMIT`);}
      catch(error){db.exec('ROLLBACK');throw error;}
    }
    const meta = db.prepare('SELECT schema_version FROM schema_metadata').get();
    if (!meta || meta.schema_version !== restoreGuard.version) throw new Error('La versión del esquema no coincide.');
    return {
      get db(){return db;},directory,path,
      async replaceWith(preparedPath){
        if(!preparedPath.startsWith(directory+'/')||!/^restore-[0-9a-f-]{36}\.sqlite$/i.test(preparedPath.slice(directory.length+1)))throw new Error('Ruta de restauración inválida.');
        const previousPath=join(directory,`previous-${randomUUID()}.sqlite`),failedPath=join(directory,`failed-${randomUUID()}.sqlite`),previousDatasetId=db.prepare('SELECT dataset_id FROM schema_metadata').get().dataset_id;
        const receipt=await open(receiptPath,'wx',0o600);
        try{await receipt.writeFile(JSON.stringify({schemaVersion:1,previousDatasetId,previousPath,preparedPath,activePath:path,createdAt:new Date().toISOString()}));await receipt.sync();}finally{await receipt.close();}
        let oldMoved=false,newMoved=false;
        try{
          db.exec('PRAGMA wal_checkpoint(TRUNCATE)');db.close();db=null;
          await rename(path,previousPath);oldMoved=true;
          await rename(preparedPath,path);newMoved=true;
          db=new DatabaseSync(path);await chmod(path,0o600);db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
          if(db.prepare('PRAGMA user_version').get().user_version!==restoreGuard.version||db.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw new Error('La base restaurada no superó la verificación.');
          await unlink(receiptPath);
          return {previousPath};
        } catch(error){
          try{
            if(db){db.close();db=null;}if(newMoved)await rename(path,failedPath);if(oldMoved)await rename(previousPath,path);
            db=new DatabaseSync(path);db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');await unlink(receiptPath);
          }catch{throw new Error('RECOVERY_REQUIRED: restauración interrumpida; se conservó el recibo de recuperación.');}
          throw error;
        }
      },
      async close(){if(db){db.close();db=null;}await release();}
    };
  } catch (error) { if (db) db.close(); await release(); throw error; }
}

export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = fn(); if (result && typeof result.then === 'function') throw new Error('No se permiten transacciones asíncronas.'); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}

export async function acquireRecoveryLock(options={}) {
  const directory=await privateDirectory(options);const release=await acquireLock(directory);return {directory,release};
}
