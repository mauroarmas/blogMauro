import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { temporaryStudio } from './helpers/studio.mjs';
import { openStudioDatabase, transaction } from '../lib/db.mjs';
import { createGeneralDraft } from '../lib/adaptation.mjs';
import { createVersion, versionDocument } from '../lib/versions.mjs';
import { putArtifact } from '../lib/artifacts.mjs';

async function fixture(t){
  const {directory}=await temporaryStudio(t),store=await openStudioDatabase({dataDirectory:join(directory,'data')});t.after(()=>store.close());
  const db=store.db,draft=await createGeneralDraft(db,{locale:'es',photo:false,projects:[]}),now=new Date().toISOString();
  const newOp=()=>{const id=randomUUID();db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)').run(id,'fixture',randomUUID(),'a'.repeat(64),'{}','running','{}',now);return id;};
  const first=await createVersion(db,{operationId:newOp(),draftId:draft.id,expectedDraftRevision:draft.revision});const pdf=versionDocument(db,first.versionId).bytes;
  const ids=[first.versionId];
  for(let i=1;i<20;i++)transaction(db,()=>{
    const id=randomUUID(),op=newOp(),bytes=Buffer.concat([pdf,Buffer.from(`\n% fixture ${i}\n`)]),artifact=putArtifact(db,bytes,'application/pdf');
    db.prepare('INSERT INTO cv_versions(id,opportunity_id,parent_version_id,operation_id,created_at) SELECT ?,opportunity_id,id,?,? FROM cv_versions WHERE id=?').run(id,op,now,first.versionId);
    db.prepare('INSERT INTO cv_version_contents(version_id,offer_revision_id,analysis_id,draft_id,draft_revision,knowledge_snapshot_id,search_profile_revision_id,presentation_snapshot_id,pdf_artifact_sha256,html_artifact_sha256,model_artifact_sha256,claims_artifact_sha256,adaptation_reasons,language,page_count) SELECT ?,offer_revision_id,analysis_id,draft_id,draft_revision,knowledge_snapshot_id,search_profile_revision_id,presentation_snapshot_id,?,html_artifact_sha256,model_artifact_sha256,claims_artifact_sha256,adaptation_reasons,language,page_count FROM cv_version_contents WHERE version_id=?').run(id,artifact.sha256,first.versionId);
    db.prepare('INSERT INTO cv_version_lifecycle(version_id) VALUES(?)').run(id);db.prepare("UPDATE operations SET state='succeeded' WHERE id=?").run(op);ids.push(id);
  });
  return {directory,store,ids};
}

test('historial y archivo conservan los bytes exactos de veinte versiones',async t=>{
  const {store,ids}=await fixture(t),versions=await import('../lib/versions.mjs');
  const before=ids.map(id=>versionDocument(store.db,id).sha256);assert.equal(new Set(before).size,20);
  const listed=versions.listVersions(store.db,{});assert.equal(listed.items.length,20);
  versions.archiveVersion(store.db,ids[0],true);assert.equal(versionDocument(store.db,ids[0]).sha256,before[0]);
  assert.deepEqual(ids.map(id=>versionDocument(store.db,id).sha256),before);
});

test('backup rechaza archivos alterados y preserva datos originales',async t=>{
  const {directory,store,ids}=await fixture(t),backup=await import('../lib/backup.mjs'),path=join(directory,'backup.sqlite');
  const original=ids.map(id=>versionDocument(store.db,id).sha256);await backup.exportBackup(store.db,path);const inspected=await backup.inspectBackup(path);assert.equal(inspected.counts.cv_versions,20);
  const bytes=await readFile(path),corrupt=join(directory,'corrupt.sqlite');await writeFile(corrupt,bytes.subarray(0,Math.floor(bytes.length/2)));
  await assert.rejects(backup.inspectBackup(corrupt));assert.deepEqual(ids.map(id=>versionDocument(store.db,id).sha256),original);
});

test('borrar versión exige alcance vigente y conserva asociaciones históricas',async t=>{
  const {store,ids}=await fixture(t),versions=await import('../lib/versions.mjs'),db=store.db,id=ids[0],now=new Date().toISOString();
  const opportunity=randomUUID(),application=randomUUID();db.prepare('INSERT INTO opportunities(id,source_kind,source_country,status,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(opportunity,'manual','global','selected',1,now,now);
  db.prepare('INSERT INTO applications(id,opportunity_id,cv_version_id,state,channel,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(application,opportunity,id,'sent_declared','manual',1,now,now);
  const old=versions.previewDeleteVersion(db,id);db.prepare('UPDATE applications SET revision=2 WHERE id=?').run(application);
  assert.throws(()=>versions.deleteVersion(db,id,{scopeHash:old.scopeHash,confirmation:true}),error=>error.code==='REVISION_CONFLICT');
  const fresh=versions.previewDeleteVersion(db,id);versions.deleteVersion(db,id,{scopeHash:fresh.scopeHash,confirmation:true});
  assert.throws(()=>versionDocument(db,id),error=>error.code==='VERSION_DELETED');assert.equal(db.prepare('SELECT cv_version_id FROM applications WHERE id=?').get(application).cv_version_id,id);assert.equal(versionDocument(db,ids[1]).bytes.subarray(0,4).toString(),'%PDF');
});

test('comparar y derivar versiones usa el modelo congelado',async t=>{
  const {store,ids}=await fixture(t),versions=await import('../lib/versions.mjs'),db=store.db;
  const changed=versions.getVersion(db,ids[1]).model;changed.profile.about='Un perfil diferente';
  transaction(db,()=>{const artifact=putArtifact(db,Buffer.from(JSON.stringify(changed)),'application/json');db.prepare('UPDATE cv_version_contents SET model_artifact_sha256=? WHERE version_id=?').run(artifact.sha256,ids[1]);});
  assert.ok(versions.compareVersions(db,ids[0],ids[1]).changes.some(c=>c.field==='biography'));
  const {draftId}=versions.createDescendantDraft(db,ids[0]);const row=db.prepare('SELECT parent_version_id FROM adaptation_drafts WHERE id=?').get(draftId);assert.equal(row.parent_version_id,ids[0]);
});

test('restauración conserva veinte versiones y bloquea IA hasta conciliar',async t=>{
  const {directory,store,ids}=await fixture(t),{exportBackup,prepareRestore}=await import('../lib/backup.mjs'),{usage,reconcileRestore}=await import('../lib/providers/budget.mjs');
  const original=ids.map(id=>versionDocument(store.db,id).sha256),path=join(directory,'restore-source.sqlite'),backup=await exportBackup(store.db,path);
  const datasetId=store.db.prepare('SELECT dataset_id FROM schema_metadata').get().dataset_id,op=randomUUID(),now=new Date().toISOString();
  store.db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)').run(op,'backup.restore',randomUUID(),'a'.repeat(64),'{}','running','{}',now);
  const prepared=await prepareRestore({storage:store,sourcePath:path,expectedHash:backup.sha256,expectedDatasetId:datasetId,operationId:op});await store.replaceWith(prepared.preparedPath);
  assert.deepEqual(ids.map(id=>versionDocument(store.db,id).sha256),original);assert.equal(store.db.prepare('SELECT state FROM operations WHERE id=?').get(op).state,'succeeded');
  const u=usage(store.db);assert.equal(u.restoreReconciliation.required,true);
  assert.throws(()=>reconcileRestore(store.db,{period:u.restoreReconciliation.period,observedTotalMicrousd:0,reason:'sin confirmar',confirmation:false}));
  assert.equal(reconcileRestore(store.db,{period:u.restoreReconciliation.period,observedTotalMicrousd:0,reason:'Verificado en prueba',confirmation:true}).restoreReconciliation,null);
});

test('inspección rechaza vistas y artefactos manipulados',async t=>{
  const {directory,store}=await fixture(t),{exportBackup,inspectBackup}=await import('../lib/backup.mjs'),{copyFile}=await import('node:fs/promises'),{DatabaseSync}=await import('node:sqlite');
  const path=join(directory,'clean.sqlite');await exportBackup(store.db,path);
  const withView=join(directory,'view.sqlite');await copyFile(path,withView);let db=new DatabaseSync(withView);db.exec('CREATE VIEW injected AS SELECT 1');db.close();await assert.rejects(inspectBackup(withView));
  const tampered=join(directory,'tampered.sqlite');await copyFile(path,tampered);db=new DatabaseSync(tampered);db.exec("UPDATE artifacts SET bytes=x'00' WHERE sha256=(SELECT sha256 FROM artifacts LIMIT 1)");db.close();await assert.rejects(inspectBackup(tampered));
});

test('recuperación offline reabre una restauración interrumpida sin IA',async t=>{
  const {directory,store,ids}=await fixture(t),{exportBackup}=await import('../lib/backup.mjs'),{recoverOffline}=await import('../lib/recovery.mjs'),{rename,writeFile}=await import('node:fs/promises');
  const expected=ids.map(id=>versionDocument(store.db,id).sha256),dataset=store.db.prepare('SELECT dataset_id FROM schema_metadata').get().dataset_id,path=join(directory,'recovery.sqlite');await exportBackup(store.db,path);const dataDirectory=store.directory;await store.close();
  const previousPath=join(dataDirectory,`previous-${randomUUID()}.sqlite`);await rename(join(dataDirectory,'studio.sqlite'),previousPath);await writeFile(join(dataDirectory,'restore-receipt.json'),JSON.stringify({previousDatasetId:dataset,previousPath}));
  const result=await recoverOffline({file:path,expectedDatasetId:dataset,confirmation:true,dataDirectory});assert.equal(result.restored,true);assert.equal(result.priorUsageAvailable,true);
  const reopened=await openStudioDatabase({dataDirectory});t.after(()=>reopened.close());assert.deepEqual(ids.map(id=>versionDocument(reopened.db,id).sha256),expected);assert.equal(reopened.db.prepare('SELECT required FROM restore_reconciliation').get().required,1);
});

test('una copia antigua no devuelve presupuesto ya consumido',async t=>{
  const {directory,store}=await fixture(t),{exportBackup,prepareRestore}=await import('../lib/backup.mjs'),{saveAiSettings,reserveModelCall,settleModelCall,usage,reconcileRestore}=await import('../lib/providers/budget.mjs');
  const path=join(directory,'older.sqlite'),backup=await exportBackup(store.db,path),db=store.db,now=new Date().toISOString(),modelOperation=randomUUID(),restoreOperation=randomUUID();
  const insert=db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)');insert.run(modelOperation,'fixture',randomUUID(),'a'.repeat(64),'{}','running','{}',now);
  const settings=saveAiSettings(db,0,{provider:'gemini',model:'fixture',billingMode:'paid',sharingCategories:['offer','preferences','professional_fragments'],sharingAccepted:true,monthlyLimitMicrousd:100,perOperationLimitMicrousd:100,priceSnapshot:{inputMicrousdPerMillion:1000000,outputMicrousdPerMillion:1000000,verifiedAt:now,source:'https://example.com'},freeQuotaConfirmed:false});
  const call=reserveModelCall(db,{operationId:modelOperation,configId:settings.config.id,inputTokens:5,maxOutputTokens:10,request:{},allowValidation:true,keyAvailable:true});settleModelCall(db,call.callId,{state:'confirmed',costMicrousd:8});db.prepare("UPDATE operations SET state='succeeded' WHERE id=?").run(modelOperation);
  insert.run(restoreOperation,'backup.restore',randomUUID(),'b'.repeat(64),'{}','running','{}',now);const dataset=db.prepare('SELECT dataset_id FROM schema_metadata').get().dataset_id;
  const staged=await prepareRestore({storage:store,sourcePath:path,expectedHash:backup.sha256,expectedDatasetId:dataset,operationId:restoreOperation});await store.replaceWith(staged.preparedPath);
  const pending=usage(store.db);assert.equal(pending.restoreReconciliation.priorKnown,8);
  assert.throws(()=>reconcileRestore(store.db,{period:pending.period,observedTotalMicrousd:0,reason:'No corresponde',confirmation:true}),/menor/);
  const final=reconcileRestore(store.db,{period:pending.period,observedTotalMicrousd:8,reason:'Uso verificado',confirmation:true});assert.equal(final.total,8);
});

test('cambio concurrente durante el render no publica una versión incompleta',async t=>{
  const {directory}=await temporaryStudio(t),store=await openStudioDatabase({dataDirectory:join(directory,'data')});t.after(()=>store.close());const {updateDraft}=await import('../lib/adaptation.mjs');
  const draft=await createGeneralDraft(store.db,{locale:'es',photo:false,projects:[]}),id=randomUUID(),now=new Date().toISOString();store.db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)').run(id,'fixture',randomUUID(),'a'.repeat(64),'{}','running','{}',now);
  const pending=createVersion(store.db,{operationId:id,draftId:draft.id,expectedDraftRevision:draft.revision});updateDraft(store.db,draft.id,draft.revision,{biography:'Redacción cambiada durante el render.'});
  await assert.rejects(pending,error=>error.code==='REVISION_CONFLICT');assert.equal(store.db.prepare('SELECT count(*) n FROM cv_versions WHERE operation_id=?').get(id).n,0);
});

test('respuesta perdida tras el commit recupera la misma versión sin duplicarla',async t=>{
  const {store,ids}=await fixture(t),row=store.db.prepare('SELECT operation_id FROM cv_versions WHERE id=?').get(ids[0]);
  const result=await createVersion(store.db,{operationId:row.operation_id,draftId:'no-se-relee-en-reintento',expectedDraftRevision:0});assert.equal(result.versionId,ids[0]);assert.equal(store.db.prepare('SELECT count(*) n FROM cv_versions').get().n,20);
});
