import { randomUUID } from 'node:crypto';
import { transaction } from './db.mjs';
import { putArtifact } from './artifacts.mjs';
import { canonicalJson, sha256, dateBoundary } from './schemas.mjs';
import { StudioError } from './errors.mjs';
import { recordActivity } from './activity.mjs';

export function saveOfferRevision(db,{opportunityId=null,identity,originalBytes,text,mediaType='text/plain',fields={},fieldProvenance={},origin='import',expectedRevision=null}) {
  if(!identity||!['manual','linkedin','computrabajo','other'].includes(identity.sourceKind)||!identity.sourceCountry)throw new StudioError('INVALID_INPUT','El origen de la oferta no es válido.');
  if(!(originalBytes instanceof Uint8Array)||typeof text!=='string'||!text.trim())throw new StudioError('INVALID_INPUT','La oferta no contiene texto legible.');
  if(!['import','extraction','owner_correction'].includes(origin))throw new StudioError('INVALID_INPUT','La revisión de oferta no es válida.');
  const textBytes=Buffer.from(text),contentSha256=sha256(textBytes),now=new Date().toISOString();
  return transaction(db,()=>{
    let opportunity=opportunityId?db.prepare('SELECT * FROM opportunities WHERE id=?').get(opportunityId):null;
    if(opportunityId&&!opportunity)throw new StudioError('NOT_FOUND','No se encontró la oferta.',{status:404});
    if(!opportunity&&identity.externalId) opportunity=db.prepare('SELECT * FROM opportunities WHERE source_kind=? AND source_country=? AND external_id=?').get(identity.sourceKind,identity.sourceCountry,identity.externalId);
    if(!opportunity&&identity.canonicalUrl) opportunity=db.prepare('SELECT * FROM opportunities WHERE canonical_url=?').get(identity.canonicalUrl);
    if(opportunity && expectedRevision!==null && opportunity.revision!==expectedRevision)throw new StudioError('REVISION_CONFLICT','La oferta cambió. Volvé a revisarla.',{status:409,details:{currentRevision:opportunity.revision}});
    if(opportunity && origin==='extraction' && expectedRevision===null)throw new StudioError('INVALID_INPUT','La extracción requiere la revisión esperada.');
    if(opportunity && origin==='import'){
      const current=db.prepare('SELECT content_sha256 FROM offer_revisions WHERE id=?').get(opportunity.current_revision_id);
      if(current?.content_sha256===contentSha256)return {opportunityId:opportunity.id,revisionId:opportunity.current_revision_id,revision:opportunity.revision,duplicateOf:opportunity.id,updated:false};
    }
    const created=!opportunity;
    if(created){
      const id=randomUUID();
      db.prepare('INSERT INTO opportunities(id,source_kind,source_country,external_id,canonical_url,status,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,identity.sourceKind,identity.sourceCountry,identity.externalId||null,identity.canonicalUrl||null,'new',1,now,now);
      opportunity={id,revision:1};
    }
    const original=putArtifact(db,originalBytes,mediaType),normalized=putArtifact(db,textBytes,'text/plain'),revisionId=randomUUID();
    db.prepare('INSERT INTO offer_revisions(id,opportunity_id,original_artifact_sha256,normalized_text_artifact_sha256,content_sha256,captured_at,original_url,fields,field_provenance,revision_origin,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(revisionId,opportunity.id,original.sha256,normalized.sha256,contentSha256,now,identity.originalUrl||null,canonicalJson(fields),canonicalJson(fieldProvenance),origin,now);
    const nextRevision=created?1:opportunity.revision+1;
    db.prepare('UPDATE opportunities SET current_revision_id=?,revision=?,updated_at=? WHERE id=?').run(revisionId,nextRevision,now,opportunity.id);
    recordActivity(db,{entityType:'opportunity',entityId:opportunity.id,kind:created?'created':'revision',details:{revisionId,origin},actor:origin==='extraction'?'system':'owner'});
    return {opportunityId:opportunity.id,revisionId,revision:nextRevision,duplicateOf:created?null:opportunity.id,updated:!created};
  });
}
export function getOpportunity(db,id){
  const o=db.prepare('SELECT * FROM opportunities WHERE id=?').get(id);if(!o)throw new StudioError('NOT_FOUND','No se encontró la oferta.',{status:404});
  const r=db.prepare('SELECT * FROM offer_revisions WHERE id=?').get(o.current_revision_id);
  const analysis=db.prepare('SELECT id,match_level FROM analyses WHERE opportunity_id=? AND offer_revision_id=? ORDER BY created_at DESC,id DESC LIMIT 1').get(id,o.current_revision_id);
  const versions=db.prepare('SELECT v.id,v.created_at,l.deleted_at FROM cv_versions v JOIN cv_version_lifecycle l ON l.version_id=v.id WHERE v.opportunity_id=? ORDER BY v.created_at DESC,v.id DESC').all(id).map(item=>({id:item.id,createdAt:item.created_at,deletedAt:item.deleted_at}));
  const applications=db.prepare('SELECT id,state,revision,updated_at FROM applications WHERE opportunity_id=? ORDER BY updated_at DESC,id DESC').all(id).map(item=>({id:item.id,state:item.state,revision:item.revision,updatedAt:item.updated_at}));
  return {id:o.id,sourceKind:o.source_kind,sourceCountry:o.source_country,externalId:o.external_id,canonicalUrl:o.canonical_url,status:o.status,revision:o.revision,revisionId:o.current_revision_id,fields:r?JSON.parse(r.fields):{},originalUrl:r?.original_url||null,analysisId:analysis?.id||null,matchLevel:analysis?.match_level||null,versions,applications,createdAt:o.created_at,updatedAt:o.updated_at,archivedAt:o.archived_at};
}

const opportunityStates=['new','analyzed','selected','discarded','closed'];
export function updateOpportunity(db,id,expectedRevision,{status,archived,reason}={}){
  if(status!==undefined&&!opportunityStates.includes(status))throw new StudioError('INVALID_INPUT','El estado de oportunidad no es válido.');
  if(archived!==undefined&&typeof archived!=='boolean')throw new StudioError('INVALID_INPUT','El archivo debe indicarse como verdadero o falso.');
  return transaction(db,()=>{
    const old=db.prepare('SELECT * FROM opportunities WHERE id=?').get(id);if(!old)throw new StudioError('NOT_FOUND','No se encontró la oportunidad.',{status:404});
    if(old.revision!==expectedRevision)throw new StudioError('REVISION_CONFLICT','La oportunidad cambió.',{status:409,details:{currentRevision:old.revision}});
    const next=status||old.status;if(['discarded','closed'].includes(old.status)&&next!==old.status&&!reason?.trim())throw new StudioError('INVALID_INPUT','Indicá un motivo para reabrir la oportunidad.');
    const now=new Date().toISOString(),archivedAt=archived===undefined?old.archived_at:archived?now:null;
    db.prepare('UPDATE opportunities SET status=?,archived_at=?,revision=revision+1,updated_at=? WHERE id=?').run(next,archivedAt,now,id);
    recordActivity(db,{entityType:'opportunity',entityId:id,kind:'updated',beforeState:old.status,afterState:next,actor:'owner',details:{...(reason?{reason}:{}),...(archived!==undefined?{archived}:{})}});
    return getOpportunity(db,id);
  });
}
export function opportunityHistory(db,id){
  getOpportunity(db,id);
  const revisions=db.prepare('SELECT id,revision_origin,captured_at,fields,field_provenance FROM offer_revisions WHERE opportunity_id=? ORDER BY created_at,id').all(id).map(row=>({id:row.id,origin:row.revision_origin,capturedAt:row.captured_at,fields:JSON.parse(row.fields),fieldProvenance:JSON.parse(row.field_provenance)}));
  const events=db.prepare("SELECT kind,before_state,after_state,details,actor,occurred_at FROM activity_events WHERE entity_type='opportunity' AND entity_id=? ORDER BY occurred_at,created_at,rowid").all(id).map(row=>({kind:row.kind,beforeState:row.before_state,afterState:row.after_state,details:JSON.parse(row.details),actor:row.actor,occurredAt:row.occurred_at}));
  return {revisions,events};
}
function parseCursor(value){try{const cursor=JSON.parse(Buffer.from(value,'base64url').toString());if(typeof cursor.date!=='string'||typeof cursor.id!=='string')throw Error();return cursor;}catch{throw new StudioError('INVALID_INPUT','El cursor no es válido.');}}
export function listOpportunities(db,{status,company,role,workMode,matchLevel,sourceKind,from,to,archived=false,limit=25,cursor}={}){
  if(!Number.isInteger(limit)||limit<1||limit>100)throw new StudioError('INVALID_INPUT','El límite debe estar entre 1 y 100.');
  if(status&&!opportunityStates.includes(status))throw new StudioError('INVALID_INPUT','El estado no es válido.');
  if(workMode&&!['remote','onsite','hybrid','unknown'].includes(workMode))throw new StudioError('INVALID_INPUT','La modalidad no es válida.');
  if(matchLevel&&!['high','medium','low','insufficient_information'].includes(matchLevel))throw new StudioError('INVALID_INPUT','El nivel de ajuste no es válido.');
  if(sourceKind&&!['manual','linkedin','computrabajo','other'].includes(sourceKind))throw new StudioError('INVALID_INPUT','El origen no es válido.');
  for(const value of [company,role])if(value!==undefined&&(typeof value!=='string'||value.length>200))throw new StudioError('INVALID_INPUT','El filtro es demasiado largo.');
  if(from)from=dateBoundary(from);if(to)to=dateBoundary(to,{end:true});
  if(from&&to&&from>to)throw new StudioError('INVALID_INPUT','El período no es válido.');
  const where=[],args=[];if(archived!==null)where.push(archived?'o.archived_at IS NOT NULL':'o.archived_at IS NULL');
  for(const [value,expression] of [[status,'o.status=?'],[sourceKind,'o.source_kind=?'],[workMode,"json_extract(r.fields,'$.workMode')=?"],[matchLevel,'a.match_level=?'],[from,'o.created_at>=?'],[to,'o.created_at<=?']])if(value){where.push(expression);args.push(value);}
  for(const [value,field] of [[company,'company'],[role,'title']])if(value){where.push(`lower(coalesce(json_extract(r.fields,'$.${field}'),'')) LIKE ? ESCAPE '\\'`);args.push('%'+value.toLowerCase().replace(/[\\%_]/g,'\\$&')+'%');}
  const base=`FROM opportunities o LEFT JOIN offer_revisions r ON r.id=o.current_revision_id LEFT JOIN analyses a ON a.id=(SELECT id FROM analyses x WHERE x.opportunity_id=o.id AND x.offer_revision_id=o.current_revision_id ORDER BY x.created_at DESC,x.id DESC LIMIT 1) WHERE ${where.length?where.join(' AND '):'1=1'}`;
  const total=db.prepare(`SELECT count(*) n ${base}`).get(...args).n,point=cursor?parseCursor(cursor):null;
  const cursorSql=point?' AND (o.created_at<? OR (o.created_at=? AND o.id<?))':'',cursorArgs=point?[point.date,point.date,point.id]:[];
  const rows=db.prepare(`SELECT o.id,o.source_kind,o.status,o.revision,o.created_at,o.updated_at,o.archived_at,r.fields,a.id AS analysis_id,a.match_level,a.reasons AS analysis_reasons ${base}${cursorSql} ORDER BY o.created_at DESC,o.id DESC LIMIT ?`).all(...args,...cursorArgs,limit+1);
  const hasMore=rows.length>limit;if(hasMore)rows.pop();const last=rows.at(-1);
  const nextAction=db.prepare('SELECT next_action,next_action_at,updated_at FROM applications WHERE opportunity_id=? AND (next_action IS NOT NULL OR next_action_at IS NOT NULL) ORDER BY updated_at DESC,id DESC LIMIT 1');
  const latestApplication=db.prepare('SELECT MAX(updated_at) AS last FROM applications WHERE opportunity_id=?');
  return {items:rows.map(row=>{const action=nextAction.get(row.id),lastApplication=latestApplication.get(row.id)?.last;return {id:row.id,sourceKind:row.source_kind,status:row.status,revision:row.revision,createdAt:row.created_at,updatedAt:row.updated_at,archivedAt:row.archived_at,fields:row.fields?JSON.parse(row.fields):{},analysisId:row.analysis_id,matchLevel:row.match_level,matchReasons:row.analysis_reasons?JSON.parse(row.analysis_reasons):null,lastActivity:lastApplication&&lastApplication>row.updated_at?lastApplication:row.updated_at,nextAction:action?.next_action||null,nextActionAt:action?.next_action_at||null};}),nextCursor:hasMore?Buffer.from(JSON.stringify({date:last.created_at,id:last.id})).toString('base64url'):null,total};
}
