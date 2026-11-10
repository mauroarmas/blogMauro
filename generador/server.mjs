import http from 'node:http';
import { readFile, stat, rm } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { InputError, loadContent } from './lib/content.mjs';
import { renderCv } from './lib/template.mjs';
import { assertLocalContext, assertToken, readJson, readOfferForm, receiveBackup, sendError } from './lib/http.mjs';
import { StudioError } from './lib/errors.mjs';
import { createStudio } from './lib/app.mjs';
import { getAiSettings, saveAiSettings, enableAi, usage, reconcileUncertain, addBudgetAdjustment, reconcileRestore } from './lib/providers/budget.mjs';
import { getOpportunity, saveOfferRevision, listOpportunities, updateOpportunity, opportunityHistory } from './lib/opportunities.mjs';
import { getPreferences, updatePreferences } from './lib/preferences.mjs';
import { listSources, sourceRevisions, getSourceRevision, addOwnerEvidence } from './lib/sources.mjs';
import { getDashboard } from './lib/dashboard.mjs';
import { createApplication, updateApplication, getApplication } from './lib/applications.mjs';
import { getDraft, updateDraft, reviewDraft, rebaseDraft, attachClaimEvidence } from './lib/adaptation.mjs';
import { versionDocument, listVersions, getVersion, compareVersions, createDescendantDraft, archiveVersion, previewDeleteVersion, deleteVersion, reviewVersion } from './lib/versions.mjs';
import { getArtifact } from './lib/artifacts.mjs';
import { normalizeOptions } from './lib/content.mjs';

const assets = new Map([
  ['/assets/studio.css', ['studio.css', 'text/css']],
  ['/assets/studio.js', ['studio.js', 'text/javascript']],
  ...['settings','offers','editor','versions','backups','dashboard','applications','sources','preferences'].map(name=>[`/assets/views/${name}.js`, [`views/${name}.js`,'text/javascript']]),
]);
const asset = name => readFile(new URL(`./assets/${name}`, import.meta.url), 'utf8');

function queryOptions(url) {
  return {
    locale: url.searchParams.get('locale') || 'es',
    photo: url.searchParams.get('photo') !== 'false',
    portfolioUrl: url.searchParams.get('portfolioUrl') || '',
    ...(url.searchParams.has('projects') ? { projects: url.searchParams.get('projects').split(',').filter(Boolean) } : {}),
  };
}

export async function startServer({ port = 4317, dataDirectory = process.env.CV_STUDIO_DATA_DIR, root, provider } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Puerto inválido.');
  const token = randomBytes(32).toString('hex');
  let studioPromise;
  const studio = () => studioPromise ??= createStudio({ dataDirectory, root, provider }).catch(error => { studioPromise = undefined; throw error; });
  let actualPort;
  const server = http.createServer(async (req, res) => {
    const send = (status, type, body) => { res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8` }); res.end(body); };
    const json = (status, body) => send(status, 'application/json', JSON.stringify(body));
    const operation = (app,kind,input) => { const op=app.operations.start(kind,String(req.headers['idempotency-key']||''),input);return {operationId:op.id,state:op.state,statusUrl:`/api/v1/operations/${op.id}`}; };
    const requireObject = body => {if(!body||typeof body!=='object'||Array.isArray(body))throw new StudioError('INVALID_INPUT','La solicitud debe ser un objeto.');return body;};
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src data:; connect-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'none'");
    try {
      assertLocalContext(req, actualPort);
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) assertToken(req, token);
      const url = new URL(req.url, `http://${req.headers.host}`);
      if(studioPromise && (await studioPromise).maintenance){res.setHeader('Retry-After','1');throw new StudioError('MAINTENANCE','CV Studio está restaurando o guardando una copia.',{status:503,retryable:true});}
      if (req.method === 'GET' && url.pathname === '/api/v1/session') {
        send(200, 'application/json', JSON.stringify({ token, capabilities: ['general-cv','operations','sources-refresh'] }));
      } else if (req.method === 'GET' && url.pathname === '/api/v1/health') {
        send(200, 'application/json', JSON.stringify(await studio().then(app => app.health())));
      } else if (req.method === 'GET' && /^\/api\/v1\/operations\/[a-f0-9-]+$/.test(url.pathname)) {
        send(200, 'application/json', JSON.stringify((await studio()).operations.get(url.pathname.split('/').at(-1))));
      } else if (req.method === 'POST' && /^\/api\/v1\/operations\/[a-f0-9-]+\/(cancel|retry)$/.test(url.pathname)) {
        const [, , , id, action] = url.pathname.split('/');
        const operations = (await studio()).operations;
        const result = action === 'cancel' ? operations.cancel(id) : operations.retry(id, String(req.headers['idempotency-key'] || ''));
        send(action === 'cancel' ? 200 : 202, 'application/json', JSON.stringify(result));
      } else if (req.method === 'POST' && url.pathname === '/api/v1/sources/refresh') {
        const result = (await studio()).operations.start('sources.refresh', String(req.headers['idempotency-key'] || ''), {});
        send(202, 'application/json', JSON.stringify({ operationId:result.id, state:result.state, statusUrl:`/api/v1/operations/${result.id}` }));
      } else if (req.method === 'GET' && url.pathname === '/api/v1/sources') {
        json(200,{sources:listSources((await studio()).db)});
      } else if (req.method === 'POST' && url.pathname === '/api/v1/owner-evidence') {
        json(201,addOwnerEvidence((await studio()).db,requireObject(await readJson(req))));
      } else if (req.method === 'GET' && /^\/api\/v1\/sources\/[a-f0-9-]+\/revisions$/.test(url.pathname)) {
        json(200,{revisions:sourceRevisions((await studio()).db,url.pathname.split('/')[4])});
      } else if (req.method === 'GET' && /^\/api\/v1\/source-revisions\/[a-f0-9-]+$/.test(url.pathname)) {
        json(200,getSourceRevision((await studio()).db,url.pathname.split('/')[4]));
      } else if (req.method === 'POST' && url.pathname === '/api/v1/backups') {
        json(202,operation(await studio(),'backup.export',{}));
      } else if (req.method === 'GET' && /^\/api\/v1\/backups\/[a-f0-9-]{36}\/download$/i.test(url.pathname)) {
        const app=await studio(),id=url.pathname.split('/')[4],path=join(app.backupDir,id+'.sqlite');let info;
        try{info=await stat(path);}catch{throw new StudioError('NOT_FOUND','La copia ya no está disponible.',{status:404});}
        if(!info.isFile()||Date.now()-info.mtimeMs>24*60*60*1000){await rm(path,{force:true});throw new StudioError('NOT_FOUND','La copia ya no está disponible.',{status:404});}
        res.writeHead(200,{'Content-Type':'application/vnd.sqlite3','Content-Length':info.size,'Content-Disposition':'attachment; filename="cv-studio-backup.sqlite"'});createReadStream(path).on('error',()=>res.destroy()).pipe(res);
      } else if (req.method === 'POST' && url.pathname === '/api/v1/backups/restore-preview') {
        const app=await studio(),staged=await receiveBackup(req,app.stagingDir);
        try{json(202,operation(app,'backup.inspect',{stagingId:staged.id}));}catch(error){await rm(staged.path,{force:true});throw error;}
      } else if (req.method === 'POST' && url.pathname === '/api/v1/backups/restore') {
        const body=requireObject(await readJson(req));
        if(body.confirmation!==true||typeof body.validationOperationId!=='string'||typeof body.expectedDatasetId!=='string')throw new StudioError('INVALID_INPUT','Confirmá el conjunto a reemplazar.');
        json(202,operation(await studio(),'backup.restore',{validationOperationId:body.validationOperationId,expectedDatasetId:body.expectedDatasetId,confirmation:true}));
      } else if (req.method === 'POST' && url.pathname === '/api/v1/opportunities/import') {
        const input=await readOfferForm(req);json(202,operation(await studio(),'offer.import',input));
      } else if (req.method === 'GET' && (url.pathname === '/api/v1/opportunities' || url.pathname === '/api/v1/dashboard')) {
        const allowed=new Set(['status','company','role','workMode','matchLevel','sourceKind','from','to','archived','limit','cursor']);
        for(const key of url.searchParams.keys())if(!allowed.has(key))throw new StudioError('INVALID_INPUT','Hay un filtro desconocido.');
        const filters=Object.fromEntries(url.searchParams);if(filters.limit!==undefined){if(!/^\d+$/.test(filters.limit))throw new StudioError('INVALID_INPUT','El límite no es válido.');filters.limit=Number(filters.limit);}
        if(filters.archived!==undefined){if(!['true','false','all'].includes(filters.archived))throw new StudioError('INVALID_INPUT','El filtro de archivo no es válido.');filters.archived=filters.archived==='all'?null:filters.archived==='true';}
        json(200,url.pathname.endsWith('/dashboard')?getDashboard((await studio()).db,filters):listOpportunities((await studio()).db,filters));
      } else if (req.method === 'POST' && url.pathname === '/api/v1/applications') {
        const body=requireObject(await readJson(req));if(Object.keys(body).some(key=>!['opportunityId','cvVersionId','channel'].includes(key)))throw new StudioError('INVALID_INPUT','La candidatura contiene campos desconocidos.');json(201,createApplication((await studio()).db,body));
      } else if (req.method === 'GET' && /^\/api\/v1\/applications\/[a-f0-9-]+$/.test(url.pathname)) {
        json(200,getApplication((await studio()).db,url.pathname.split('/').at(-1)));
      } else if (req.method === 'PATCH' && /^\/api\/v1\/applications\/[a-f0-9-]+$/.test(url.pathname)) {
        const body=requireObject(await readJson(req)),{expectedRevision,...patch}=body;json(200,updateApplication((await studio()).db,url.pathname.split('/').at(-1),expectedRevision,patch));
      } else if (req.method === 'GET' && /^\/api\/v1\/opportunities\/[a-f0-9-]+\/history$/.test(url.pathname)) {
        json(200,opportunityHistory((await studio()).db,url.pathname.split('/')[4]));
      } else if (req.method === 'PATCH' && /^\/api\/v1\/opportunities\/[a-f0-9-]+$/.test(url.pathname)) {
        const body=requireObject(await readJson(req)),{expectedRevision,...patch}=body;if(Object.keys(patch).some(key=>!['status','archived','reason'].includes(key)))throw new StudioError('INVALID_INPUT','La oportunidad contiene campos desconocidos.');json(200,updateOpportunity((await studio()).db,url.pathname.split('/').at(-1),expectedRevision,patch));
      } else if (req.method === 'GET' && /^\/api\/v1\/opportunities\/[a-f0-9-]+$/.test(url.pathname)) {
        json(200,getOpportunity((await studio()).db,url.pathname.split('/').at(-1)));
      } else if (req.method === 'GET' && url.pathname === '/api/v1/preferences') {
        json(200,getPreferences((await studio()).db));
      } else if (req.method === 'PATCH' && url.pathname === '/api/v1/preferences') {
        const body=requireObject(await readJson(req));json(200,updatePreferences((await studio()).db,body.expectedRevision,body.preferences));
      } else if (req.method === 'GET' && /^\/api\/v1\/opportunities\/[a-f0-9-]+\/original$/.test(url.pathname)) {
        const db=(await studio()).db,opp=getOpportunity(db,url.pathname.split('/')[4]),row=db.prepare('SELECT normalized_text_artifact_sha256 FROM offer_revisions WHERE id=?').get(opp.revisionId);
        json(200,{text:getArtifact(db,row.normalized_text_artifact_sha256).bytes.toString('utf8')});
      } else if (req.method === 'POST' && /^\/api\/v1\/opportunities\/[a-f0-9-]+\/revisions$/.test(url.pathname)) {
        const body=requireObject(await readJson(req)),db=(await studio()).db,id=url.pathname.split('/')[4],opp=getOpportunity(db,id);
        if(!Number.isSafeInteger(body.expectedRevision))throw new StudioError('INVALID_INPUT','Se requiere la revisión esperada.');
        if(opp.revision!==body.expectedRevision)throw new StudioError('REVISION_CONFLICT','La oferta cambió.',{status:409,details:{currentRevision:opp.revision}});
        const row=db.prepare('SELECT * FROM offer_revisions WHERE id=?').get(opp.revisionId),original=getArtifact(db,row.original_artifact_sha256),oldText=getArtifact(db,row.normalized_text_artifact_sha256).bytes.toString('utf8');
        const text=body.text===undefined?oldText:body.text;if(typeof text!=='string'||!text.trim()||text.length>100000)throw new StudioError('INVALID_INPUT','El texto corregido no es válido.');
        const corrected=body.correctedFields||{};if(!corrected||typeof corrected!=='object'||Array.isArray(corrected)||Object.keys(corrected).some(k=>!['title','company','location','workMode','seniority','languages','requirements','conditions'].includes(k)))throw new StudioError('INVALID_INPUT','Los campos corregidos no son válidos.');
        json(200,saveOfferRevision(db,{opportunityId:id,identity:{sourceKind:opp.sourceKind,sourceCountry:opp.sourceCountry,originalUrl:row.original_url},originalBytes:original.bytes,mediaType:original.mediaType,text,fields:{...JSON.parse(row.fields),...corrected},fieldProvenance:{origin:'owner_correction',correctedKeys:Object.keys(corrected)},origin:'owner_correction',expectedRevision:body.expectedRevision}));
      } else if (req.method === 'POST' && /^\/api\/v1\/opportunities\/[a-f0-9-]+\/analyses$/.test(url.pathname)) {
        const body=requireObject(await readJson(req));json(202,operation(await studio(),'offer.analyze',{opportunityId:url.pathname.split('/')[4],offerRevisionId:body.offerRevisionId,preferencesRevisionId:body.preferencesRevisionId}));
      } else if (req.method === 'GET' && /^\/api\/v1\/analyses\/[a-f0-9-]+$/.test(url.pathname)) {
        const row=(await studio()).db.prepare('SELECT * FROM analyses WHERE id=?').get(url.pathname.split('/').at(-1));if(!row)throw new StudioError('NOT_FOUND','No se encontró el análisis.',{status:404});
        json(200,{id:row.id,opportunityId:row.opportunity_id,offerRevisionId:row.offer_revision_id,snapshotId:row.knowledge_snapshot_id,matchLevel:row.match_level,matches:JSON.parse(row.requirement_matches),reasons:JSON.parse(row.reasons)});
      } else if (req.method === 'GET' && url.pathname === '/api/v1/ai/settings') {
        json(200,getAiSettings((await studio()).db,{keyAvailable:provider?true:undefined}));
      } else if (req.method === 'PUT' && url.pathname === '/api/v1/ai/settings') {
        const body=requireObject(await readJson(req)),{expectedRevision,...config}=body;json(200,saveAiSettings((await studio()).db,expectedRevision,config));
      } else if (req.method === 'POST' && url.pathname === '/api/v1/ai/settings/validate') {
        json(202,operation(await studio(),'ai.validate',{}));
      } else if (req.method === 'POST' && url.pathname === '/api/v1/ai/settings/enable') {
        const body=requireObject(await readJson(req));json(200,enableAi((await studio()).db,body.expectedRevision,body.enabled));
      } else if (req.method === 'GET' && url.pathname === '/api/v1/ai/usage') {
        json(200,usage((await studio()).db,url.searchParams.get('period')||undefined));
      } else if (req.method === 'POST' && url.pathname === '/api/v1/ai/usage/reconcile') {
        const body=requireObject(await readJson(req)),db=(await studio()).db;json(200,body.completeRestore?reconcileRestore(db,body):body.callId?reconcileUncertain(db,body):addBudgetAdjustment(db,body));
      } else if (req.method === 'POST' && url.pathname === '/api/v1/drafts') {
        const body=requireObject(await readJson(req));
        if((body.general===true)===(typeof body.analysisId==='string'))throw new StudioError('INVALID_INPUT','Elegí un CV general o un análisis.');
        const options=normalizeOptions({locale:body.locale||'es',photo:body.photo!==false,portfolioUrl:body.portfolioUrl||'',...(body.projects?{projects:body.projects}:{})});
        // JSON canónico no admite propiedades undefined.
        const safeOptions=JSON.parse(JSON.stringify(options));
        json(202,operation(await studio(),'draft.create',{general:body.general===true,...(body.analysisId?{analysisId:body.analysisId}:{}),options:safeOptions}));
      } else if (req.method === 'GET' && /^\/api\/v1\/drafts\/[a-f0-9-]+$/.test(url.pathname)) {
        json(200,getDraft((await studio()).db,url.pathname.split('/').at(-1)));
      } else if (req.method === 'PATCH' && /^\/api\/v1\/drafts\/[a-f0-9-]+$/.test(url.pathname)) {
        const body=requireObject(await readJson(req));json(200,updateDraft((await studio()).db,url.pathname.split('/').at(-1),body.expectedRevision,body.content||{},body.presentationOptions||{}));
      } else if (req.method === 'POST' && /^\/api\/v1\/drafts\/[a-f0-9-]+\/rebase$/.test(url.pathname)) {
        const body=requireObject(await readJson(req));json(201,await rebaseDraft((await studio()).db,url.pathname.split('/')[4],body,{root}));
      } else if (req.method === 'POST' && /^\/api\/v1\/drafts\/[a-f0-9-]+\/evidence$/.test(url.pathname)) {
        const body=requireObject(await readJson(req));json(200,attachClaimEvidence((await studio()).db,url.pathname.split('/')[4],body));
      } else if (req.method === 'POST' && /^\/api\/v1\/drafts\/[a-f0-9-]+\/reviews$/.test(url.pathname)) {
        const body=requireObject(await readJson(req));json(200,await reviewDraft((await studio()).db,url.pathname.split('/')[4],body,{root}));
      } else if (req.method === 'GET' && /^\/api\/v1\/drafts\/[a-f0-9-]+\/preview$/.test(url.pathname)) {
        const app=await studio(),id=url.pathname.split('/')[4],row=app.db.prepare('SELECT content FROM adaptation_drafts WHERE id=?').get(id);if(!row)throw new StudioError('NOT_FOUND','No se encontró el borrador.',{status:404});
        send(200,'text/html',await renderCv(JSON.parse(row.content).model));
      } else if (req.method === 'GET' && url.pathname === '/api/v1/versions') {
        const allowed=new Set(['opportunityId','company','role','locale','from','to','archived','limit','cursor']);for(const key of url.searchParams.keys())if(!allowed.has(key))throw new StudioError('INVALID_INPUT','Hay un filtro desconocido.');
        const params=Object.fromEntries(url.searchParams);if(params.limit!==undefined){if(!/^\d+$/.test(params.limit))throw new StudioError('INVALID_INPUT','El límite no es válido.');params.limit=Number(params.limit);}
        if(params.archived!==undefined){if(!['true','false','all'].includes(params.archived))throw new StudioError('INVALID_INPUT','El filtro de archivo no es válido.');params.archived=params.archived==='all'?null:params.archived==='true';}
        json(200,listVersions((await studio()).db,params));
      } else if (req.method === 'GET' && url.pathname === '/api/v1/versions/compare') {
        json(200,compareVersions((await studio()).db,url.searchParams.get('leftId'),url.searchParams.get('rightId')));
      } else if (req.method === 'GET' && /^\/api\/v1\/versions\/[a-f0-9-]+$/.test(url.pathname)) {
        json(200,getVersion((await studio()).db,url.pathname.split('/').at(-1)));
      } else if (req.method === 'POST' && /^\/api\/v1\/versions\/[a-f0-9-]+\/drafts$/.test(url.pathname)) {
        json(201,createDescendantDraft((await studio()).db,url.pathname.split('/')[4]));
      } else if (req.method === 'POST' && /^\/api\/v1\/versions\/[a-f0-9-]+\/reviews$/.test(url.pathname)) {
        const body=requireObject(await readJson(req));json(200,await reviewVersion((await studio()).db,url.pathname.split('/')[4],body,{root}));
      } else if (req.method === 'POST' && /^\/api\/v1\/versions\/[a-f0-9-]+\/archive$/.test(url.pathname)) {
        const body=requireObject(await readJson(req));json(200,archiveVersion((await studio()).db,url.pathname.split('/')[4],body.archived));
      } else if (req.method === 'GET' && /^\/api\/v1\/versions\/[a-f0-9-]+\/delete-preview$/.test(url.pathname)) {
        json(200,previewDeleteVersion((await studio()).db,url.pathname.split('/')[4]));
      } else if (req.method === 'DELETE' && /^\/api\/v1\/versions\/[a-f0-9-]+$/.test(url.pathname)) {
        const body=requireObject(await readJson(req));json(200,deleteVersion((await studio()).db,url.pathname.split('/').at(-1),body));
      } else if (req.method === 'POST' && url.pathname === '/api/v1/versions') {
        const body=requireObject(await readJson(req));json(202,operation(await studio(),'version.create',{draftId:body.draftId,expectedDraftRevision:body.expectedDraftRevision}));
      } else if (req.method === 'GET' && /^\/api\/v1\/versions\/[a-f0-9-]+\/(?:pdf|html)$/.test(url.pathname)) {
        const parts=url.pathname.split('/'),doc=versionDocument((await studio()).db,parts[4],parts[5]);res.setHeader('X-CV-SHA256',doc.sha256);res.setHeader('Content-Disposition',`attachment; filename="CV-${parts[4]}.${parts[5]}"`);res.writeHead(200,{'Content-Type':doc.mediaType,'Content-Length':doc.byteLength});res.end(doc.bytes);
      } else if (req.method === 'GET' && /^\/api\/v1\/evidence\/[a-f0-9-]+$/.test(url.pathname)) {
        const row=(await studio()).db.prepare('SELECT id,source_revision_id,text,locator,classification FROM evidence_fragments WHERE id=?').get(url.pathname.split('/').at(-1));if(!row)throw new StudioError('NOT_FOUND','No se encontró la evidencia.',{status:404});json(200,{id:row.id,sourceRevisionId:row.source_revision_id,text:row.text,locator:JSON.parse(row.locator),classification:row.classification});
      } else if (req.method === 'GET' && /^\/api\/v1\/source-revisions\/[a-f0-9-]+\/document$/.test(url.pathname)) {
        const app=await studio(),row=app.db.prepare('SELECT original_artifact_sha256 FROM source_revisions WHERE id=?').get(url.pathname.split('/')[4]);if(!row?.original_artifact_sha256)throw new StudioError('NOT_FOUND','No se encontró el documento.',{status:404});const doc=getArtifact(app.db,row.original_artifact_sha256);res.setHeader('Content-Disposition','attachment');res.writeHead(200,{'Content-Type':doc.mediaType,'Content-Length':doc.byteLength});res.end(doc.bytes);
      } else if (req.method === 'GET' && url.pathname === '/') {
        send(200, 'text/html', (await asset('studio.html')).replace('__TOKEN__', token));
      } else if (req.method === 'GET' && assets.has(url.pathname)) {
        const [name, type] = assets.get(url.pathname); send(200, type, await asset(name));
      } else if (req.method === 'GET' && url.pathname === '/api/content') {
        const model = await loadContent({ locale: url.searchParams.get('locale') || 'es', photo: false });
        send(200, 'application/json', JSON.stringify({ name: model.profile.name, revision: model.revision, projects: model.allProjects.map(p => ({ slug: p.slug, name: (p.i18n[model.options.locale] || p.i18n.es).name })) }));
      } else if (req.method === 'GET' && url.pathname === '/preview') {
        send(200, 'text/html', await renderCv(await loadContent(queryOptions(url))));
      } else if (req.method === 'POST' && url.pathname === '/api/pdf') {
        const options = await readJson(req);
        {
          const clean=JSON.parse(JSON.stringify(normalizeOptions(options))),app=await studio();
          const key=String(req.headers['idempotency-key']||randomUUID());
          const started=app.operations.start('pdf.general',key,{options:clean});
          let result=started;
          while(['queued','running'].includes(result.state)){await new Promise(resolve=>setTimeout(resolve,50));result=app.operations.get(started.id);}
          if(result.state!=='succeeded')throw new StudioError(result.errorCode||'RENDER_ERROR','No se pudo generar el CV.',{status:422});
          const doc=versionDocument(app.db,result.result.versionId,'pdf');
          res.setHeader('Content-Disposition', `attachment; filename="CV-Mauro-Armas-${clean.locale}.pdf"`);
          const saved=app.db.prepare('SELECT page_count FROM cv_version_contents WHERE version_id=?').get(result.result.versionId);
          res.setHeader('X-CV-Version-Id',result.result.versionId);res.setHeader('X-CV-SHA256',doc.sha256);res.setHeader('X-CV-Pages',String(saved.page_count));
          res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Length': doc.byteLength }); res.end(doc.bytes);
        }
      } else { send(404, 'text/plain', 'No encontrado.'); }
    } catch (error) {
      if (!res.headersSent) {
        const safeError = error instanceof InputError ? new StudioError('INVALID_INPUT', error.message) : error;
        sendError(res, safeError, randomUUID());
      } else res.end();
    }
  });
  server.requestTimeout = 30000;
  const host = process.env.CV_HOST || '127.0.0.1';
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
  actualPort = server.address().port;
  return { server, url: `http://${host}:${actualPort}`, close: async () => { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); if (studioPromise) await (await studioPromise).close(); } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = await startServer({ port: Number(process.env.CV_PORT || 4317) });
  console.log(`\nCV Studio · privado y local\n${app.url}\n\nLee los datos del portafolio en cada vista previa y exportación.\nCtrl+C para cerrar.\n`);
}
