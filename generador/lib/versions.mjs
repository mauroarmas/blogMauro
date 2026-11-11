import { randomUUID } from 'node:crypto';
import { transaction } from './db.mjs';
import { putArtifact, getArtifact } from './artifacts.mjs';
import { generatePdfFromModel } from './pdf.mjs';
import { captureKnowledgeSnapshot } from './sources.mjs';
import { canonicalJson, sha256, dateBoundary } from './schemas.mjs';
import { StudioError } from './errors.mjs';
import { validateEvidenceRefs } from './evidence.mjs';
import { linksReady } from './links.mjs';
import { recordActivity } from './activity.mjs';

/** Publicación atómica de los bytes, modelo y vínculos ya congelados. */
export async function createVersion(db,{operationId,draftId,expectedDraftRevision,root,signal}){
  const prior=db.prepare('SELECT id FROM cv_versions WHERE operation_id=?').get(operationId);
  if(prior)return {versionId:prior.id};
  const draft=db.prepare('SELECT * FROM adaptation_drafts WHERE id=?').get(draftId);
  if(!draft)throw new StudioError('NOT_FOUND','No se encontró el borrador.',{status:404});
  if(draft.revision!==expectedDraftRevision)throw new StudioError('REVISION_CONFLICT','El borrador cambió antes de generar.',{status:409});
  const frozen=JSON.parse(draft.content),claims=JSON.parse(draft.claims);
  const rendered=await generatePdfFromModel(frozen.model);
  if(!rendered.pdf.subarray(0,4).equals(Buffer.from('%PDF'))||rendered.presentationManifest.htmlSha256!==sha256(rendered.html))throw new StudioError('RENDER_ERROR','El PDF no se generó correctamente.',{status:422});
  const current=await captureKnowledgeSnapshot(db,{root});
  if(signal?.aborted)throw new StudioError('CANCELLED','La generación fue cancelada.',{status:409});
  return transaction(db,()=>{
    const existing=db.prepare('SELECT id FROM cv_versions WHERE operation_id=?').get(operationId);if(existing)return {versionId:existing.id};
    const latest=db.prepare('SELECT * FROM adaptation_drafts WHERE id=?').get(draftId);
    if(!latest||latest.revision!==expectedDraftRevision)throw new StudioError('REVISION_CONFLICT','El borrador cambió durante la generación.',{status:409});
    const operation=db.prepare('SELECT state FROM operations WHERE id=?').get(operationId);
    if(!operation||operation.state!=='running')throw new StudioError('INVALID_STATE','La generación ya no está activa.',{status:409});
    const now=new Date().toISOString(),versionId=randomUUID(),manifestBytes=Buffer.from(canonicalJson(rendered.presentationManifest));
    const manifestSha=sha256(manifestBytes);let presentation=db.prepare('SELECT id FROM presentation_snapshots WHERE snapshot_sha256=?').get(manifestSha);
    if(!presentation){presentation={id:randomUUID()};const manifest=putArtifact(db,manifestBytes,'application/json');db.prepare('INSERT INTO presentation_snapshots(id,snapshot_sha256,manifest_artifact_sha256,schema_version,created_at) VALUES(?,?,?,?,?)').run(presentation.id,manifestSha,manifest.sha256,1,now);}
    const pdf=putArtifact(db,rendered.pdf,'application/pdf'),html=putArtifact(db,Buffer.from(rendered.html),'text/html'),model=putArtifact(db,Buffer.from(canonicalJson({...frozen.model,_studio:{linkChecks:JSON.parse(draft.link_checks)}})),'application/json'),claimArtifact=putArtifact(db,Buffer.from(canonicalJson(claims)),'application/json');
    const analysis=draft.analysis_id?db.prepare('SELECT offer_revision_id FROM analyses WHERE id=?').get(draft.analysis_id):null;
    db.prepare('INSERT INTO cv_versions(id,opportunity_id,parent_version_id,operation_id,created_at) VALUES(?,?,?,?,?)').run(versionId,draft.opportunity_id,draft.parent_version_id,operationId,now);
    db.prepare('INSERT INTO cv_version_contents(version_id,offer_revision_id,analysis_id,draft_id,draft_revision,knowledge_snapshot_id,search_profile_revision_id,presentation_snapshot_id,pdf_artifact_sha256,html_artifact_sha256,model_artifact_sha256,claims_artifact_sha256,adaptation_reasons,language,page_count) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(versionId,analysis?.offer_revision_id||null,draft.analysis_id,draft.id,draft.revision,draft.knowledge_snapshot_id,draft.search_profile_revision_id,presentation.id,pdf.sha256,html.sha256,model.sha256,claimArtifact.sha256,canonicalJson(frozen.reasons||[]),frozen.model.options.locale,rendered.pages);
    db.prepare('INSERT INTO cv_version_lifecycle(version_id) VALUES(?)').run(versionId);
    const review=db.prepare('SELECT * FROM review_events WHERE draft_id=? AND draft_revision=? ORDER BY created_at DESC,rowid DESC LIMIT 1').get(draft.id,draft.revision);
    const reviewed=review?.state==='reviewed'&&current.snapshotId===draft.knowledge_snapshot_id;
    db.prepare('INSERT INTO review_events(id,cv_version_id,state,findings,source_comparison_sha256,actor,created_at) VALUES(?,?,?,?,?,?,?)').run(randomUUID(),versionId,reviewed?'reviewed':'needs_review',reviewed?review.findings:'{}',reviewed?current.snapshotSha256:null,reviewed?'owner':'system',now);
    recordActivity(db,{entityType:'version',entityId:versionId,kind:'created',actor:'owner',details:{draftId,opportunityId:draft.opportunity_id,reviewed}});
    db.prepare("UPDATE operations SET state='succeeded',result_refs=?,finished_at=? WHERE id=? AND state='running'").run(canonicalJson({versionId}),now,operationId);
    return {versionId,pages:rendered.pages,reviewed};
  });
}
export function versionDocument(db,id,format='pdf'){
  if(!['pdf','html'].includes(format))throw new StudioError('INVALID_INPUT','Formato no válido.');
  const row=db.prepare('SELECT v.id,l.deleted_at,c.pdf_artifact_sha256,c.html_artifact_sha256 FROM cv_versions v JOIN cv_version_lifecycle l ON l.version_id=v.id LEFT JOIN cv_version_contents c ON c.version_id=v.id WHERE v.id=?').get(id);
  if(!row)throw new StudioError('NOT_FOUND','No se encontró la versión.',{status:404});
  if(row.deleted_at)throw new StudioError('VERSION_DELETED','El documento fue eliminado.',{status:410});
  return getArtifact(db,format==='pdf'?row.pdf_artifact_sha256:row.html_artifact_sha256);
}

function decodeCursor(cursor){
  if(!cursor)return null;
  try{const v=JSON.parse(Buffer.from(cursor,'base64url').toString());if(!v||typeof v.date!=='string'||typeof v.id!=='string')throw Error();return v;}catch{throw new StudioError('INVALID_INPUT','El cursor no es válido.');}
}
export function listVersions(db,{opportunityId,company,role,locale,from,to,archived=false,limit=25,cursor}={}){
  if(!Number.isInteger(limit)||limit<1||limit>100)throw new StudioError('INVALID_INPUT','El límite debe estar entre 1 y 100.');
  if(from)from=dateBoundary(from);if(to)to=dateBoundary(to,{end:true});
  if(from&&to&&from>to)throw new StudioError('INVALID_INPUT','El período no es válido.');
  const where=['l.deleted_at IS NULL'],args=[];
  if(archived!==null){where.push(archived?'l.archived_at IS NOT NULL':'l.archived_at IS NULL');}
  for(const [value,sql] of [[opportunityId,'v.opportunity_id = ?'],[locale,'c.language = ?'],[from,'v.created_at >= ?'],[to,'v.created_at <= ?']])if(value){where.push(sql);args.push(value);}
  for(const [value,field] of [[company,'company'],[role,'title']])if(value){where.push(`lower(coalesce(json_extract(r.fields,'$.${field}'),'')) LIKE ? ESCAPE '\\'`);args.push('%'+value.toLowerCase().replace(/[\\%_]/g,'\\$&')+'%');}
  const base=`FROM cv_versions v JOIN cv_version_lifecycle l ON l.version_id=v.id JOIN cv_version_contents c ON c.version_id=v.id LEFT JOIN offer_revisions r ON r.id=c.offer_revision_id WHERE ${where.join(' AND ')}`;
  const total=db.prepare(`SELECT COUNT(*) n ${base}`).get(...args).n;
  const point=decodeCursor(cursor),cursorClause=point?' AND (v.created_at < ? OR (v.created_at = ? AND v.id < ?))':'';
  const cursorArgs=point?[point.date,point.date,point.id]:[];
  const rows=db.prepare(`SELECT v.id,v.opportunity_id,v.created_at,l.archived_at,c.language,c.page_count,r.fields ${base}${cursorClause} ORDER BY v.created_at DESC,v.id DESC LIMIT ?`).all(...args,...cursorArgs,limit+1);
  const hasMore=rows.length>limit;if(hasMore)rows.pop();const last=rows.at(-1);
  return {items:rows.map(row=>({id:row.id,opportunityId:row.opportunity_id,createdAt:row.created_at,archivedAt:row.archived_at,language:row.language,pageCount:row.page_count,offer:row.fields?JSON.parse(row.fields):null})),nextCursor:hasMore?Buffer.from(JSON.stringify({date:last.created_at,id:last.id})).toString('base64url'):null,total};
}
export function getVersion(db,id){
  const row=db.prepare('SELECT v.*,l.archived_at,l.deleted_at,c.* FROM cv_versions v JOIN cv_version_lifecycle l ON l.version_id=v.id LEFT JOIN cv_version_contents c ON c.version_id=v.id WHERE v.id=?').get(id);
  if(!row)throw new StudioError('NOT_FOUND','No se encontró la versión.',{status:404});
  if(row.deleted_at)return {id:row.id,deletedAt:row.deleted_at,opportunityId:row.opportunity_id};
  const review=db.prepare('SELECT state,findings,created_at FROM review_events WHERE cv_version_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1').get(id);
  return {id:row.id,opportunityId:row.opportunity_id,parentVersionId:row.parent_version_id,createdAt:row.created_at,archivedAt:row.archived_at,language:row.language,pageCount:row.page_count,snapshotId:row.knowledge_snapshot_id,analysisId:row.analysis_id,offerRevisionId:row.offer_revision_id,reasons:JSON.parse(row.adaptation_reasons),model:JSON.parse(getArtifact(db,row.model_artifact_sha256).bytes.toString()),claims:JSON.parse(getArtifact(db,row.claims_artifact_sha256).bytes.toString()),review:review?{state:review.state,createdAt:review.created_at,findings:JSON.parse(review.findings)}:null};
}
export function compareVersions(db,leftId,rightId){
  const left=getVersion(db,leftId),right=getVersion(db,rightId);
  if(left.deletedAt||right.deletedAt)throw new StudioError('VERSION_DELETED','Una de las versiones fue eliminada.',{status:410});
  const changes=[];
  const add=(field,a,b)=>{if(canonicalJson(a)!==canonicalJson(b))changes.push({field,before:a,after:b});};
  add('biography',left.model.profile.about,right.model.profile.about);
  add('projects',left.model.projects.map(p=>({slug:p.slug,summary:p.text.problem})),right.model.projects.map(p=>({slug:p.slug,summary:p.text.problem})));
  add('skills',left.model.skills,right.model.skills);add('claims',left.claims.map(c=>({location:c.location,text:c.text})),right.claims.map(c=>({location:c.location,text:c.text})));
  return {leftId,rightId,changes};
}
export function createDescendantDraft(db,versionId){
  const version=getVersion(db,versionId);if(version.deletedAt)throw new StudioError('VERSION_DELETED','La versión fue eliminada.',{status:410});
  const model=version.model,claims=version.claims.map(c=>({...c,reviewStatus:'pending'})),checks=(model._studio?.linkChecks||[]).map(c=>({...c,recipientAccessConfirmed:false,confirmedAt:null}));delete model._studio;
  const editable={biography:model.profile.about,projectSummaries:model.projects.map(p=>({slug:p.slug,text:p.text.problem})),projectIds:model.projects.map(p=>p.slug),skills:model.skills.flatMap(g=>g.items)};
  const previous=db.prepare('SELECT search_profile_revision_id FROM cv_version_contents WHERE version_id=?').get(versionId),id=randomUUID(),now=new Date().toISOString();
  db.prepare('INSERT INTO adaptation_drafts(id,opportunity_id,analysis_id,knowledge_snapshot_id,search_profile_revision_id,parent_version_id,content,claims,presentation_options,link_checks,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,version.opportunityId,version.analysisId,version.snapshotId,previous.search_profile_revision_id,versionId,canonicalJson({editable,model,reasons:version.reasons}),canonicalJson(claims),canonicalJson(model.options),canonicalJson(checks),1,now,now);
  return {draftId:id};
}

export function archiveVersion(db,id,archived){
  if(typeof archived!=='boolean')throw new StudioError('INVALID_INPUT','El estado de archivo no es válido.');
  return transaction(db,()=>{
    const row=db.prepare('SELECT * FROM cv_version_lifecycle WHERE version_id=?').get(id);
    if(!row)throw new StudioError('NOT_FOUND','No se encontró la versión.',{status:404});
    if(row.deleted_at)throw new StudioError('VERSION_DELETED','La versión fue eliminada.',{status:410});
    const now=new Date().toISOString();db.prepare('UPDATE cv_version_lifecycle SET archived_at=? WHERE version_id=?').run(archived?now:null,id);
    recordActivity(db,{entityType:'version',entityId:id,kind:archived?'archived':'unarchived',actor:'owner'});return {id,archived};
  });
}
export function previewDeleteVersion(db,id){
  const version=getVersion(db,id);if(version.deletedAt)throw new StudioError('VERSION_DELETED','La versión fue eliminada.',{status:410});
  const applications=db.prepare('SELECT id,state,revision FROM applications WHERE cv_version_id=? ORDER BY id').all(id);
  const descendants=db.prepare('SELECT id FROM cv_versions WHERE parent_version_id=? ORDER BY id').all(id).map(row=>row.id);
  const content=db.prepare('SELECT pdf_artifact_sha256,html_artifact_sha256,model_artifact_sha256,claims_artifact_sha256 FROM cv_version_contents WHERE version_id=?').get(id);
  const scope={id,applications,descendants,content,archivedAt:version.archivedAt};
  return {versionId:id,applications,descendants,scopeHash:sha256(canonicalJson(scope))};
}
export function deleteVersion(db,id,{scopeHash,confirmation}){
  if(confirmation!==true||typeof scopeHash!=='string')throw new StudioError('INVALID_INPUT','Confirmá el alcance de eliminación.');
  return transaction(db,()=>{
    const scope=previewDeleteVersion(db,id);if(scope.scopeHash!==scopeHash)throw new StudioError('REVISION_CONFLICT','Las asociaciones cambiaron. Revisá el alcance nuevamente.',{status:409});
    const content=db.prepare('SELECT * FROM cv_version_contents WHERE version_id=?').get(id),now=new Date().toISOString();
    const event=recordActivity(db,{entityType:'version',entityId:id,kind:'deleted',actor:'owner',details:{pdfSha256:content.pdf_artifact_sha256,applications:scope.applications.map(a=>a.id)}});
    db.prepare('DELETE FROM cv_version_contents WHERE version_id=?').run(id);
    db.prepare('UPDATE cv_version_lifecycle SET deleted_at=?,deletion_event_id=? WHERE version_id=?').run(now,event,id);
    for(const digest of new Set([content.pdf_artifact_sha256,content.html_artifact_sha256,content.model_artifact_sha256,content.claims_artifact_sha256])){
      try{db.prepare('DELETE FROM artifacts WHERE sha256=?').run(digest);}catch(error){if(error.code!=='ERR_SQLITE_ERROR'||!String(error.message).includes('FOREIGN KEY'))throw error;}
    }
    return {id,deletedAt:now};
  });
}

export async function reviewVersion(db,id,{decision,claimDecisions=[],linkDecisions=[]},{root}={}){
  if(!['needs_review','changes_requested','reviewed'].includes(decision)||!Array.isArray(claimDecisions)||!Array.isArray(linkDecisions))throw new StudioError('INVALID_INPUT','La revisión no es válida.');
  const version=getVersion(db,id);if(version.deletedAt)throw new StudioError('VERSION_DELETED','La versión fue eliminada.',{status:410});
  let current=null;if(decision==='reviewed'){current=await captureKnowledgeSnapshot(db,{root});if(current.snapshotId!==version.snapshotId)throw new StudioError('SOURCE_CHANGED','Las fuentes cambiaron; creá una nueva versión.',{status:409});}
  return transaction(db,()=>{
    const lifecycle=db.prepare('SELECT deleted_at FROM cv_version_lifecycle WHERE version_id=?').get(id);if(!lifecycle||lifecycle.deleted_at)throw new StudioError('VERSION_DELETED','La versión fue eliminada.',{status:410});
    const latest=db.prepare('SELECT findings FROM review_events WHERE cv_version_id=? ORDER BY created_at DESC,rowid DESC LIMIT 1').get(id),prior=latest?JSON.parse(latest.findings):{};
    const claims=prior.claims||structuredClone(version.claims),checks=prior.linkChecks||structuredClone(version.model._studio?.linkChecks||[]);
    const refs=db.prepare('SELECT e.id,e.text FROM evidence_fragments e JOIN snapshot_sources ss ON ss.source_revision_id=e.source_revision_id WHERE ss.snapshot_id=?').all(version.snapshotId);
    const seenClaims=new Set(),seenLinks=new Set();
    for(const item of claimDecisions){const claim=claims.find(c=>c.id===item.claimId);if(!claim||seenClaims.has(item.claimId)||!['confirm','conflict','pending'].includes(item.decision))throw new StudioError('INVALID_INPUT','La decisión de la afirmación no es válida.');seenClaims.add(item.claimId);if(item.decision==='confirm'){if(claim.validation!=='source_located'||!claim.evidenceRefs.length)throw new StudioError('INVALID_EVIDENCE','La afirmación necesita evidencia.',{status:422});validateEvidenceRefs(claim.evidenceRefs,refs);claim.reviewStatus='owner_confirmed';}else{claim.reviewStatus='pending';if(item.decision==='conflict')claim.validation='conflict';}}
    for(const item of linkDecisions){const check=checks.find(c=>c.id===item.id);if(!check||seenLinks.has(item.id)||check.url!==item.url||check.classification!=='needs_check'||!['confirm_access','restricted'].includes(item.decision)||typeof item.note!=='string'||item.note.trim().length<3)throw new StudioError('INVALID_INPUT','La decisión del enlace no es válida.');seenLinks.add(item.id);if(item.decision==='restricted'){check.classification='restricted';check.recipientAccessConfirmed=false;}else{check.recipientAccessConfirmed=true;check.confirmedAt=new Date().toISOString();check.note=item.note.trim();}}
    if(decision==='reviewed'&&(claims.some(c=>c.reviewStatus!=='owner_confirmed'||c.validation!=='source_located')||!linksReady(checks)))throw new StudioError('REVIEW_INCOMPLETE','Resolvé las afirmaciones y enlaces pendientes.',{status:422});
    const now=new Date().toISOString();db.prepare('INSERT INTO review_events(id,cv_version_id,state,findings,source_comparison_sha256,actor,created_at) VALUES(?,?,?,?,?,?,?)').run(randomUUID(),id,decision,canonicalJson({claims,linkChecks:checks}),current?.snapshotSha256||null,'owner',now);recordActivity(db,{entityType:'version',entityId:id,kind:'reviewed',actor:'owner',details:{decision}});return {id,state:decision};
  });
}
