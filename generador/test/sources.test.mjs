import test from 'node:test';
import assert from 'node:assert/strict';
import { openStudioDatabase } from '../lib/db.mjs';
import { captureKnowledgeSnapshot, addOwnerEvidence, listSources, getSourceRevision } from '../lib/sources.mjs';
import { getPreferences, updatePreferences, checkOnsiteLocation } from '../lib/preferences.mjs';
import { createGeneralDraft, updateDraft, rebaseDraft, attachClaimEvidence } from '../lib/adaptation.mjs';
import { temporaryStudio } from './helpers/studio.mjs';
import { cp, mkdir, readFile, writeFile, symlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';

test('aportaciones confirmadas conservan categoría y snapshots históricos', async t => {
  const {directory}=await temporaryStudio(t), store=await openStudioDatabase({dataDirectory:directory}); t.after(()=>store.close());
  const before=await captureKnowledgeSnapshot(store.db);
  assert.throws(()=>addOwnerEvidence(store.db,{text:'Aprendo Rust',classification:'learning',entityType:'skill',entityId:'rust'}));
  const added=addOwnerEvidence(store.db,{text:'Aprendo Rust',classification:'learning',entityType:'skill',entityId:'rust',confirmation:true});
  const after=await captureKnowledgeSnapshot(store.db);
  assert.notEqual(before.snapshotId,after.snapshotId);
  assert.equal(getSourceRevision(store.db,added.revisionId).fragments[0].classification,'learning');
  assert.ok(listSources(store.db).some(source=>source.id===added.sourceId));
  assert.equal(store.db.prepare('SELECT count(*) n FROM snapshot_sources WHERE snapshot_id=? AND source_revision_id=?').get(before.snapshotId,added.revisionId).n,0);
});

test('evidencia nueva exige snapshot nuevo y no confirma la afirmación',async t=>{
  const {directory}=await temporaryStudio(t),store=await openStudioDatabase({dataDirectory:directory});t.after(()=>store.close());
  let draft=await createGeneralDraft(store.db,{locale:'es',photo:false});
  draft=updateDraft(store.db,draft.id,draft.revision,{biography:'Tengo experiencia profesional con Rust.'});
  const claim=draft.claims.find(c=>c.location==='biography'),added=addOwnerEvidence(store.db,{text:'Me interesa Rust',classification:'interest',entityType:'skill',entityId:'rust',confirmation:true});
  assert.throws(()=>attachClaimEvidence(store.db,draft.id,{expectedRevision:draft.revision,claimId:claim.id,evidenceRefs:[{fragmentId:added.fragments[0].id,quote:'Me interesa Rust'}]}),{code:'INVALID_EVIDENCE'});
  const next=await rebaseDraft(store.db,draft.id,{expectedRevision:draft.revision});
  const attached=attachClaimEvidence(store.db,next.id,{expectedRevision:next.revision,claimId:claim.id,evidenceRefs:[{fragmentId:added.fragments[0].id,quote:'Me interesa Rust'}]});
  assert.equal(attached.claims.find(c=>c.id===claim.id).validation,'conflict');assert.equal(attached.claims.find(c=>c.id===claim.id).reviewStatus,'pending');
});

test('preferencias conservan desconocidos y protegen cambios concurrentes',async t=>{
  const {directory}=await temporaryStudio(t),store=await openStudioDatabase({dataDirectory:directory});t.after(()=>store.close());
  const p=getPreferences(store.db);assert.equal(checkOnsiteLocation('onsite','Córdoba',p.preferences).status,'fail');assert.equal(checkOnsiteLocation('onsite','Tucumán',p.preferences).status,'pass');assert.equal(checkOnsiteLocation('onsite','Sin aclarar',p.preferences).status,'unknown');assert.equal(checkOnsiteLocation('onsite','Córdoba',{...p.preferences,onsiteProvince:{...p.preferences.onsiteProvince,priority:'preference'}}).status,'pass');assert.equal(checkOnsiteLocation('remote','Córdoba',p.preferences).status,'pass');assert.equal(checkOnsiteLocation('hybrid','Tucumán',p.preferences).status,'unknown');
  updatePreferences(store.db,p.revision,{...p.preferences,hybrid:null});assert.throws(()=>updatePreferences(store.db,p.revision,p.preferences),{code:'REVISION_CONFLICT'});
});

test('documentos faltantes se registran y un symlink que escapa se rechaza',async t=>{
  const {directory}=await temporaryStudio(t),root=join(directory,'project');await mkdir(join(root,'src'),{recursive:true});await cp('src/content',join(root,'src/content'),{recursive:true});await mkdir(join(root,'public'),{recursive:true});
  const store=await openStudioDatabase({dataDirectory:join(directory,'data')});t.after(()=>store.close());
  const project=join(root,'src/content/proyectos.js'),bytes=await readFile(project,'utf8');await writeFile(project,"import { stack as importedStack } from './stack.js';\n"+bytes+'\nvoid importedStack;\n');
  const snapshot=await captureKnowledgeSnapshot(store.db,{root});assert.ok(snapshot.warnings.some(s=>s.availability==='missing'));
  const missing=snapshot.warnings.find(s=>s.key.startsWith('/assets/'));assert.ok(missing);const path=join(root,'public',decodeURIComponent(missing.key));await mkdir(dirname(path),{recursive:true});await symlink(join(process.cwd(),'package.json'),path);
  await assert.rejects(captureKnowledgeSnapshot(store.db,{root}),{code:'SOURCE_INVALID'});
});
