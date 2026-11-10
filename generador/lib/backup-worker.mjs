import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { canonicalJson, sha256 } from './schemas.mjs';
import * as initial from './migrations/001-studio.mjs';
import * as restoreGuard from './migrations/002-restore-guard.mjs';

const maxBytes=512*1024*1024;
const jsonColumns={
  evidence_fragments:{locator:'object'},search_profile_revisions:{preferences:'object'},offer_revisions:{fields:'object',field_provenance:'object'},
  operations:{input_manifest:'object',progress:'object',result_refs:'object'},analyses:{requirement_matches:'array',reasons:'object'},
  adaptation_drafts:{content:'object',claims:'array',presentation_options:'object',link_checks:'array'},cv_version_contents:{adaptation_reasons:'array'},
  review_events:{findings:'object'},activity_events:{details:'object'},ai_config_revisions:{sharing_categories:'array',price_snapshot:'object',output_limits:'object'},llm_calls:{other_usage:'object'},source_revisions:{owner_confirmation:'object'},
};
const safeName=name=>`"${name.replaceAll('"','""')}"`;
const entries=db=>db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' OR sql IS NOT NULL ORDER BY type,name").all();
async function fileHash(path){const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);return hash.digest('hex');}

/** La base recibida se consulta solo después de comprobar el esquema exacto. */
export async function inspectFile(path){
  const info=await stat(path);if(!info.isFile()||info.size>maxBytes||info.size<100)throw Error('INVALID_BACKUP');
  const file=await open(path,'r');try{const header=Buffer.alloc(16);await file.read(header,0,16,0);if(!header.equals(Buffer.from('SQLite format 3\0')))throw Error('INVALID_BACKUP');}finally{await file.close();}
  const reference=new DatabaseSync(':memory:');let db;
  try {
    reference.exec(initial.sql);reference.exec(restoreGuard.sql);
    db=new DatabaseSync(path,{readOnly:true,allowExtension:false,defensive:true,timeout:5000});
    db.exec('PRAGMA trusted_schema=OFF; PRAGMA query_only=ON; PRAGMA foreign_keys=ON;');db.enableLoadExtension(false);db.enableDefensive(true);
    if(db.prepare('PRAGMA user_version').get().user_version!==restoreGuard.version)throw Error('INVALID_BACKUP');
    if(canonicalJson(entries(db))!==canonicalJson(entries(reference)))throw Error('INVALID_BACKUP');
    const integrity=db.prepare('PRAGMA integrity_check').all();if(integrity.length!==1||Object.values(integrity[0])[0]!=='ok')throw Error('INVALID_BACKUP');
    if(!db.prepare('PRAGMA foreign_key_check').iterate().next().done)throw Error('INVALID_BACKUP');
    const metadata=db.prepare('SELECT dataset_id,schema_version FROM schema_metadata').all();
    if(metadata.length!==1||metadata[0].schema_version!==restoreGuard.version||!/^[a-f0-9-]{36}$/i.test(metadata[0].dataset_id))throw Error('INVALID_BACKUP');
    const tables=entries(reference).filter(entry=>entry.type==='table').map(entry=>entry.name),counts={};
    for(const name of tables)counts[name]=db.prepare(`SELECT count(*) n FROM ${safeName(name)}`).get().n;
    const idTables=['professional_sources','source_revisions','evidence_fragments','knowledge_snapshots','presentation_snapshots','search_profiles','search_profile_revisions','opportunities','offer_revisions','operations','analyses','adaptation_drafts','cv_versions','review_events','applications','activity_events','ai_config_revisions','llm_calls','budget_reservations','budget_adjustments'];
    const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for(const table of idTables)for(const row of db.prepare(`SELECT id FROM ${safeName(table)}`).iterate())if(typeof row.id!=='string'||!uuid.test(row.id))throw Error('INVALID_BACKUP');
    const enums={professional_sources:{availability:['available','missing','unreadable']},source_revisions:{extraction_status:['ready','unsupported','failed']},opportunities:{status:['new','analyzed','selected','discarded','closed']},applications:{state:['preparing','pending_review','ready','sent_declared','interview','offer','rejected','withdrawn']},review_events:{state:['needs_review','changes_requested','reviewed','stale_sources']}};
    for(const [table,columns] of Object.entries(enums))for(const [column,values] of Object.entries(columns))for(const row of db.prepare(`SELECT ${safeName(column)} AS value FROM ${safeName(table)}`).iterate())if(!values.includes(row.value))throw Error('INVALID_BACKUP');
    for(const [table,columns] of Object.entries(jsonColumns))for(const [column,type] of Object.entries(columns)){
      const query=`SELECT ${safeName(column)} AS value FROM ${safeName(table)} WHERE ${safeName(column)} IS NOT NULL`;
      for(const row of db.prepare(query).iterate()){
        if(typeof row.value!=='string')throw Error('INVALID_BACKUP');
        let value;try{value=JSON.parse(row.value);}catch{throw Error('INVALID_BACKUP');}
        if(type==='array'?!Array.isArray(value):!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_BACKUP');
      }
    }
    for(const row of db.prepare('SELECT sha256,byte_length,bytes FROM artifacts').iterate()){
      if(!/^[0-9a-f]{64}$/.test(row.sha256)||!(row.bytes instanceof Uint8Array)||row.byte_length!==row.bytes.length||sha256(row.bytes)!==row.sha256)throw Error('INVALID_BACKUP');
    }
    return {datasetId:metadata[0].dataset_id,schemaVersion:restoreGuard.version,byteLength:info.size,sha256:await fileHash(path),counts};
  } finally {db?.close();reference.close();}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href && process.argv[2]==='--inspect'){
  try{const result=await inspectFile(process.argv[3]);process.stdout.write(JSON.stringify(result));}
  catch{process.stderr.write('INVALID_BACKUP\n');process.exitCode=1;}
}
