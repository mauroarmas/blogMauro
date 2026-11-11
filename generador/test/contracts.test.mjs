import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server.mjs';
import { temporaryStudio } from './helpers/studio.mjs';

async function studio(t) {
  const { directory }=await temporaryStudio(t);
  const app=await startServer({port:0,dataDirectory:directory});
  t.after(()=>app.close());
  const session=await(await fetch(app.url+'/api/v1/session')).json();
  const request=(path,options={})=>fetch(app.url+'/api/v1'+path,{...options,headers:{'X-CV-Token':session.token,...options.headers}});
  return {app,request};
}

test('una oferta se incorpora sin IA y repetición de clave devuelve la misma operación',async t=>{
  const {request}=await studio(t),form=()=>{const x=new FormData();x.set('text','Puesto: Junior\nRequisito: React');return x;};
  const options=()=>({method:'POST',headers:{'Idempotency-Key':'test-import-offer-0001'},body:form()});
  const a=await request('/opportunities/import',options());assert.equal(a.status,202);const one=await a.json();
  const b=await request('/opportunities/import',options());assert.equal(b.status,202);assert.equal((await b.json()).operationId,one.operationId);
});

test('configurar IA nunca expone la clave ni llama automáticamente',async t=>{
  const {request}=await studio(t);const response=await request('/ai/settings');assert.equal(response.status,200);
  const text=await response.text();assert.doesNotMatch(text,/GEMINI_API_KEY|AIza[\w-]+/);
  const data=JSON.parse(text);assert.equal(typeof data.keyAvailable,'boolean');
});

test('borrador con revisión obsoleta devuelve conflicto sin perder el texto',async t=>{
  const {request}=await studio(t);
  const create=await request('/drafts',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':'test-draft-general-001'},body:JSON.stringify({general:true,locale:'es',photo:false})});
  assert.equal(create.status,202);const {operationId}=await create.json();
  let operation;for(let i=0;i<200;i++){operation=await(await request('/operations/'+operationId)).json();if(!['queued','running'].includes(operation.state))break;await new Promise(r=>setTimeout(r,20));}
  assert.equal(operation.state,'succeeded');const id=operation.result.draftId;
  const response=await request('/drafts/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:0,content:{biography:'texto que no debe perderse'}})});
  assert.equal(response.status,409);assert.equal((await response.json()).error.code,'REVISION_CONFLICT');
});

test('no se admiten mutaciones desde otro origen ni sin token',async t=>{
  const {app,request}=await studio(t);
  assert.equal((await fetch(app.url+'/api/v1/drafts',{method:'POST'})).status,403);
  assert.equal((await request('/drafts',{method:'POST',headers:{Origin:'https://example.invalid'}})).status,403);
});

test('presupuesto reserva en forma conservadora y conserva consumo incierto',async t=>{
  const {openStudioDatabase}=await import('../lib/db.mjs');
  const {saveAiSettings,reserveModelCall,settleModelCall,usage}=await import('../lib/providers/budget.mjs');
  const {randomUUID}=await import('node:crypto');
  const {directory}=await temporaryStudio(t),store=await openStudioDatabase({dataDirectory:directory});t.after(()=>store.close());
  const db=store.db,id=randomUUID(),now=new Date().toISOString();
  db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)').run(id,'fixture','budget-contract-0001','a'.repeat(64),'{}','running','{}',now);
  const config=saveAiSettings(db,0,{provider:'gemini',model:'fixture',billingMode:'paid',sharingCategories:['offer','preferences','professional_fragments'],sharingAccepted:true,monthlyLimitMicrousd:100,perOperationLimitMicrousd:100,priceSnapshot:{inputMicrousdPerMillion:1000000,outputMicrousdPerMillion:1000000,verifiedAt:now,source:'https://example.com'},freeQuotaConfirmed:false});
  const reserve=()=>reserveModelCall(db,{operationId:id,configId:config.config.id,inputTokens:30,maxOutputTokens:30,request:{},allowValidation:true,keyAvailable:true});
  const first=reserve();assert.throws(reserve,error=>error.code==='BUDGET_EXCEEDED');
  settleModelCall(db,first.callId,{state:'uncertain'});assert.equal(usage(db).uncertain,60);assert.throws(reserve,error=>error.code==='BUDGET_EXCEEDED');
});

test('429, 503 y timeout sin prueba de consumo cero no provocan reintento oculto',async t=>{
  const {openStudioDatabase}=await import('../lib/db.mjs');const {saveAiSettings,usage}=await import('../lib/providers/budget.mjs');const {executeGeminiStep}=await import('../lib/providers/gemini.mjs');const {randomUUID}=await import('node:crypto');const {z}=await import('zod');
  const {directory}=await temporaryStudio(t),store=await openStudioDatabase({dataDirectory:directory});t.after(()=>store.close());const db=store.db,id=randomUUID(),now=new Date().toISOString();
  db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)').run(id,'fixture','retry-contract-00001','a'.repeat(64),'{}','running','{}',now);
  saveAiSettings(db,0,{provider:'gemini',model:'fixture',billingMode:'paid',sharingCategories:['offer','preferences','professional_fragments'],sharingAccepted:true,monthlyLimitMicrousd:99999,perOperationLimitMicrousd:99999,priceSnapshot:{inputMicrousdPerMillion:1000000,outputMicrousdPerMillion:1000000,verifiedAt:now,source:'https://example.com'},freeQuotaConfirmed:false});
  for(const status of [429,503,null]){
    let calls=0;const provider={countTokens:async()=>10,generate:async()=>{calls++;throw Object.assign(new Error('fallo simulado'),{status});}};
    await assert.rejects(executeGeminiStep({db,provider,operationId:id,input:{offer:'prueba'},systemInstruction:'Solo datos',jsonSchema:{type:'object'},outputSchema:z.object({}),allowValidation:true,keyAvailable:true}),error=>error.code==='PROVIDER_UNAVAILABLE');
    assert.equal(calls,1);
  }
  assert.ok(usage(db).uncertain>0);
});

test('crear y descargar una versión recupera exactamente el PDF guardado',async t=>{
  const {request}=await studio(t);const run=async(path,json,key)=>{const res=await request(path,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(json)});assert.equal(res.status,202);const {operationId}=await res.json();let result;for(let i=0;i<400;i++){result=await(await request('/operations/'+operationId)).json();if(!['queued','running'].includes(result.state))break;await new Promise(resolve=>setTimeout(resolve,20));}assert.equal(result.state,'succeeded');return result.result;};
  const draft=await run('/drafts',{general:true,locale:'es',photo:false,projects:[]},'contract-general-draft-1');const saved=await run('/versions',{draftId:draft.draftId,expectedDraftRevision:1},'contract-save-version-1');
  const a=await request(`/versions/${saved.versionId}/pdf`),b=await request(`/versions/${saved.versionId}/pdf`);assert.equal(a.status,200);assert.equal(a.headers.get('x-cv-sha256'),b.headers.get('x-cv-sha256'));assert.deepEqual(Buffer.from(await a.arrayBuffer()),Buffer.from(await b.arrayBuffer()));
});

test('una clave canaria no se persiste en versiones ni copias',async t=>{
  const {openStudioDatabase}=await import('../lib/db.mjs'),{createGeneralDraft}=await import('../lib/adaptation.mjs'),{createVersion,versionDocument}=await import('../lib/versions.mjs'),{exportBackup}=await import('../lib/backup.mjs'),{randomUUID}=await import('node:crypto'),{readFile}=await import('node:fs/promises'),{join}=await import('node:path');
  const {directory}=await temporaryStudio(t),old=process.env.GEMINI_API_KEY,canary='AI_CANARY_never_persist_762345913';process.env.GEMINI_API_KEY=canary;t.after(()=>{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;});
  const store=await openStudioDatabase({dataDirectory:join(directory,'db')});t.after(()=>store.close());const db=store.db,draft=await createGeneralDraft(db,{locale:'es',photo:false,projects:[]}),id=randomUUID(),now=new Date().toISOString();
  db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)').run(id,'fixture',randomUUID(),'a'.repeat(64),'{}','running','{}',now);
  const version=await createVersion(db,{operationId:id,draftId:draft.id,expectedDraftRevision:1});for(const type of ['pdf','html'])assert.equal(versionDocument(db,version.versionId,type).bytes.includes(Buffer.from(canary)),false);
  db.prepare("UPDATE operations SET state='succeeded' WHERE id=?").run(id);const file=join(directory,'backup.sqlite');await exportBackup(db,file);assert.equal((await readFile(file)).includes(Buffer.from(canary)),false);db.exec('PRAGMA wal_checkpoint(FULL)');assert.equal((await readFile(store.path)).includes(Buffer.from(canary)),false);
  const {execFileSync}=await import('node:child_process');const output=execFileSync(process.execPath,['generador/studio-cli.mjs','doctor','--json'],{env:{...process.env,CV_STUDIO_DATA_DIR:join(directory,'db'),CV_PORT:'59994'},encoding:'utf8'});assert.doesNotMatch(output,new RegExp(canary));
});

test('el período de presupuesto cambia según medianoche de Tucumán',async()=>{const {currentPeriod}=await import('../lib/providers/budget.mjs');assert.equal(currentPeriod(new Date('2026-02-01T02:59:59Z')),'2026-01');assert.equal(currentPeriod(new Date('2026-02-01T03:00:00Z')),'2026-02');});

test('reiniciar convierte una reserva de operación interrumpida en consumo incierto conciliable',async t=>{
  const {openStudioDatabase}=await import('../lib/db.mjs'),{Operations}=await import('../lib/operations.mjs'),{saveAiSettings,reserveModelCall,usage,reconcileUncertain}=await import('../lib/providers/budget.mjs'),{randomUUID}=await import('node:crypto');const {directory}=await temporaryStudio(t),store=await openStudioDatabase({dataDirectory:directory});t.after(()=>store.close());const db=store.db,id=randomUUID(),now=new Date().toISOString();
  db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)').run(id,'fixture',randomUUID(),'a'.repeat(64),'{}','running','{}',now);
  const cfg=saveAiSettings(db,0,{provider:'gemini',model:'fixture',billingMode:'paid',sharingCategories:['offer','preferences','professional_fragments'],sharingAccepted:true,monthlyLimitMicrousd:100,perOperationLimitMicrousd:100,priceSnapshot:{inputMicrousdPerMillion:1000000,outputMicrousdPerMillion:1000000,verifiedAt:now,source:'https://example.com'},freeQuotaConfirmed:false});const call=reserveModelCall(db,{operationId:id,configId:cfg.config.id,inputTokens:5,maxOutputTokens:5,request:{},allowValidation:true,keyAvailable:true});
  const operations=new Operations(db);t.after(()=>operations.close());assert.equal(operations.get(id).state,'interrupted');assert.equal(usage(db).reserved,0);assert.equal(usage(db).uncertain,10);assert.equal(reconcileUncertain(db,{callId:call.callId,costMicrousd:3,reason:'Importe revisado'}).total,3);
});

test('la cola limita solicitudes y respeta cancelación activa y pendiente',async t=>{
  const {openStudioDatabase}=await import('../lib/db.mjs'),{Operations}=await import('../lib/operations.mjs'),{randomUUID}=await import('node:crypto');const {directory}=await temporaryStudio(t),store=await openStudioDatabase({dataDirectory:directory});t.after(()=>store.close());
  const operations=new Operations(store.db,{handlers:{slow:(_,{signal})=>new Promise((resolve,reject)=>{if(signal.aborted)reject(Error('cancelled'));else signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});})}});t.after(()=>operations.close());const first=operations.start('slow',randomUUID(),{});await new Promise(resolve=>setImmediate(resolve));assert.equal(operations.get(first.id).state,'running');const queued=Array.from({length:10},()=>operations.start('slow',randomUUID(),{}));assert.throws(()=>operations.start('slow',randomUUID(),{}),{code:'QUEUE_FULL'});assert.equal(operations.cancel(queued[0].id).state,'cancelled');operations.cancel(first.id);for(const item of queued.slice(1))operations.cancel(item.id);for(let i=0;i<50&&operations.get(first.id).state==='running';i++)await new Promise(r=>setTimeout(r,10));assert.equal(operations.get(first.id).state,'cancelled');
});

test('cancelar durante una llamada conserva consumo incierto',async t=>{
  const {openStudioDatabase}=await import('../lib/db.mjs'),{saveAiSettings,usage}=await import('../lib/providers/budget.mjs'),{executeGeminiStep}=await import('../lib/providers/gemini.mjs'),{randomUUID}=await import('node:crypto'),{z}=await import('zod');const {directory}=await temporaryStudio(t),store=await openStudioDatabase({dataDirectory:directory});t.after(()=>store.close());const db=store.db,id=randomUUID(),now=new Date().toISOString();db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)').run(id,'fixture',randomUUID(),'a'.repeat(64),'{}','running','{}',now);
  saveAiSettings(db,0,{provider:'gemini',model:'fixture',billingMode:'paid',sharingCategories:['offer','preferences','professional_fragments'],sharingAccepted:true,monthlyLimitMicrousd:99999,perOperationLimitMicrousd:99999,priceSnapshot:{inputMicrousdPerMillion:1000000,outputMicrousdPerMillion:1000000,verifiedAt:now,source:'https://example.com'},freeQuotaConfirmed:false});const controller=new AbortController();let called;const started=new Promise(resolve=>{called=resolve;});const provider={countTokens:async()=>10,generate:({signal})=>new Promise((resolve,reject)=>{called();signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});})};
  const request=executeGeminiStep({db,provider,operationId:id,input:{offer:'prueba'},systemInstruction:'Datos',jsonSchema:{type:'object'},outputSchema:z.object({}),signal:controller.signal,allowValidation:true,keyAvailable:true});await started;controller.abort();await assert.rejects(request,{code:'PROVIDER_UNAVAILABLE'});assert.ok(usage(db).uncertain>0);assert.equal(usage(db).reserved,0);
});
