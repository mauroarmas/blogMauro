import test from 'node:test';
import assert from 'node:assert/strict';
import { temporaryStudio } from './helpers/studio.mjs';
import { openStudioDatabase } from '../lib/db.mjs';
import { saveOfferRevision } from '../lib/opportunities.mjs';

async function fixture(t){
  const {directory}=await temporaryStudio(t),store=await openStudioDatabase({dataDirectory:directory});t.after(()=>store.close());
  const make=(text,fields)=>saveOfferRevision(store.db,{identity:{sourceKind:'manual',sourceCountry:'global'},originalBytes:Buffer.from(text),text,fields});
  return {db:store.db,one:make('React junior',{title:'Junior React',company:'Empresa A',workMode:'remote'}),two:make('Linux junior',{title:'Junior Linux',company:'Empresa B',workMode:'onsite'})};
}

test('un envío manual requiere fecha, canal y documento real o declarado externo',async t=>{
  const {db,one}=await fixture(t),{createApplication,updateApplication}=await import('../lib/applications.mjs');
  let item=createApplication(db,{opportunityId:one.opportunityId,channel:'manual'});assert.equal(item.state,'preparing');
  assert.throws(()=>updateApplication(db,item.id,item.revision,{state:'ready'}),error=>error.code==='INVALID_STATE');
  assert.throws(()=>updateApplication(db,item.id,item.revision,{state:'sent_confirmed'}),error=>error.code==='INVALID_INPUT'||error.code==='INVALID_STATE');
  assert.throws(()=>updateApplication(db,item.id,item.revision,{state:'sent_declared'}),error=>error.code==='INVALID_INPUT'||error.code==='INVALID_STATE');
  item=updateApplication(db,item.id,item.revision,{state:'sent_declared',sentAt:'2026-11-08T12:00:00.000Z',externalDocumentUnknown:true});assert.equal(item.state,'sent_declared');assert.equal(item.cvVersionId,null);
  assert.throws(()=>updateApplication(db,item.id,1,{note:'obsoleta'}),error=>error.code==='REVISION_CONFLICT');
  item=updateApplication(db,item.id,item.revision,{state:'interview',note:'Entrevista programada'});assert.equal(item.state,'interview');assert.ok(item.history.some(event=>event.details.note==='Entrevista programada'));
});

test('lista y dashboard aplican filtros y cuentan candidaturas, no CV',async t=>{
  const {db,one,two}=await fixture(t),{createApplication,updateApplication}=await import('../lib/applications.mjs'),{listOpportunities}=await import('../lib/opportunities.mjs'),{getDashboard}=await import('../lib/dashboard.mjs');
  let app=createApplication(db,{opportunityId:one.opportunityId,channel:'manual'});app=updateApplication(db,app.id,app.revision,{state:'sent_declared',sentAt:'2026-11-08T12:00:00.000Z',externalDocumentUnknown:true});createApplication(db,{opportunityId:two.opportunityId,channel:'manual'});
  const list=listOpportunities(db,{company:'Empresa A'});assert.equal(list.total,1);assert.equal(list.items[0].id,one.opportunityId);
  const dashboard=getDashboard(db,{company:'Empresa A'});assert.equal(dashboard.opportunities,1);assert.equal(dashboard.applications,1);assert.equal(dashboard.applicationStates.sent_declared,1);assert.equal(dashboard.applicationStates.preparing||0,0);
});

test('lista para presentar exige versión revisada y disponible',async t=>{
  const {db,one}=await fixture(t),{createApplication,updateApplication}=await import('../lib/applications.mjs'),{createGeneralDraft,reviewDraft}=await import('../lib/adaptation.mjs'),{createVersion}=await import('../lib/versions.mjs'),{randomUUID}=await import('node:crypto');
  const draft=await createGeneralDraft(db,{locale:'es',photo:false,projects:[]});const claims=draft.claims.map(claim=>({claimId:claim.id,decision:'confirm'})),links=draft.linkChecks.filter(link=>link.classification==='needs_check').map(link=>({id:link.id,url:link.url,decision:'confirm_access',note:'Acceso verificado en prueba'}));
  const reviewed=await reviewDraft(db,draft.id,{expectedRevision:draft.revision,decision:'reviewed',claimDecisions:claims,linkDecisions:links});const op=randomUUID(),now=new Date().toISOString();db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,created_at) VALUES(?,?,?,?,?,?,?,?)').run(op,'fixture',randomUUID(),'a'.repeat(64),'{}','running','{}',now);
  const version=await createVersion(db,{operationId:op,draftId:reviewed.id,expectedDraftRevision:reviewed.revision});assert.equal(version.reviewed,true);
  let app=createApplication(db,{opportunityId:one.opportunityId,channel:'manual'});app=updateApplication(db,app.id,app.revision,{state:'ready',cvVersionId:version.versionId});assert.equal(app.state,'ready');
});
