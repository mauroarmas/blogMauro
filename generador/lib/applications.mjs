import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { transaction } from './db.mjs';
import { recordActivity } from './activity.mjs';
import { validate } from './schemas.mjs';
import { StudioError } from './errors.mjs';

const states=['preparing','pending_review','ready','sent_declared','interview','offer','rejected','withdrawn'];
const patchSchema=z.strictObject({state:z.enum(states).optional(),cvVersionId:z.uuid().nullable().optional(),externalDocumentUnknown:z.boolean().optional(),sentAt:z.iso.datetime().nullable().optional(),note:z.string().max(10000).optional(),nextAction:z.string().max(1000).nullable().optional(),nextActionAt:z.iso.datetime().nullable().optional(),reason:z.string().max(1000).optional(),channel:z.string().min(1).max(200).optional()});
const transitions={preparing:['pending_review','ready','sent_declared'],pending_review:['preparing','ready','sent_declared'],ready:['pending_review','sent_declared'],sent_declared:['interview','offer','rejected','withdrawn'],interview:['offer','rejected','withdrawn'],offer:['withdrawn'],rejected:[],withdrawn:[]};
function availableVersion(db,id,opportunityId,{reviewed=false}={}){
  const row=db.prepare(`SELECT v.opportunity_id,l.deleted_at,(SELECT state FROM review_events WHERE cv_version_id=v.id ORDER BY created_at DESC,rowid DESC LIMIT 1) AS review FROM cv_versions v JOIN cv_version_lifecycle l ON l.version_id=v.id WHERE v.id=?`).get(id);
  if(!row||row.deleted_at||(row.opportunity_id&&row.opportunity_id!==opportunityId))throw new StudioError('INVALID_INPUT','La versión no está disponible para esta oportunidad.');
  if(reviewed&&row.review!=='reviewed')throw new StudioError('INVALID_STATE','La candidatura lista necesita una versión revisada.',{status:409});
}
export function getApplication(db,id){
  const row=db.prepare('SELECT * FROM applications WHERE id=?').get(id);if(!row)throw new StudioError('NOT_FOUND','No se encontró la candidatura.',{status:404});
  const history=db.prepare("SELECT kind,before_state,after_state,details,actor,occurred_at FROM activity_events WHERE entity_type='application' AND entity_id=? ORDER BY occurred_at,created_at,rowid").all(id).map(event=>({kind:event.kind,beforeState:event.before_state,afterState:event.after_state,details:JSON.parse(event.details),actor:event.actor,occurredAt:event.occurred_at}));
  return {id:row.id,opportunityId:row.opportunity_id,cvVersionId:row.cv_version_id,state:row.state,channel:row.channel,sentAt:row.sent_at,externalDocumentUnknown:row.confirmation_origin==='owner_external_document_unknown',nextAction:row.next_action,nextActionAt:row.next_action_at,revision:row.revision,createdAt:row.created_at,updatedAt:row.updated_at,history};
}
export function createApplication(db,{opportunityId,cvVersionId=null,channel}){
  if(typeof opportunityId!=='string'||typeof channel!=='string'||!channel.trim()||channel.length>200)throw new StudioError('INVALID_INPUT','Indicá la oportunidad y el canal.');
  return transaction(db,()=>{
    if(!db.prepare('SELECT id FROM opportunities WHERE id=?').get(opportunityId))throw new StudioError('NOT_FOUND','No se encontró la oportunidad.',{status:404});
    if(cvVersionId)availableVersion(db,cvVersionId,opportunityId);
    const id=randomUUID(),now=new Date().toISOString();db.prepare('INSERT INTO applications(id,opportunity_id,cv_version_id,state,channel,revision,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(id,opportunityId,cvVersionId,'preparing',channel.trim(),1,now,now);
    recordActivity(db,{entityType:'application',entityId:id,kind:'created',afterState:'preparing',actor:'owner',details:{channel:channel.trim()}});return getApplication(db,id);
  });
}
export function updateApplication(db,id,expectedRevision,patch){
  const input=validate(patchSchema,patch);
  return transaction(db,()=>{
    const row=db.prepare('SELECT * FROM applications WHERE id=?').get(id);if(!row)throw new StudioError('NOT_FOUND','No se encontró la candidatura.',{status:404});
    if(row.revision!==expectedRevision)throw new StudioError('REVISION_CONFLICT','La candidatura cambió. Recuperá tus cambios.',{status:409,details:{currentRevision:row.revision}});
    const nextState=input.state||row.state,version=Object.hasOwn(input,'cvVersionId')?input.cvVersionId:row.cv_version_id,sentAt=Object.hasOwn(input,'sentAt')?input.sentAt:row.sent_at,channel=input.channel?.trim()||row.channel;
    if(nextState!==row.state&&!transitions[row.state]?.includes(nextState)&&!input.reason?.trim())throw new StudioError('INVALID_STATE','Para corregir o reabrir el estado indicá un motivo.',{status:409});
    if(version&&(Object.hasOwn(input,'cvVersionId')||nextState==='ready'||(nextState==='sent_declared'&&row.state!=='sent_declared')))availableVersion(db,version,row.opportunity_id,{reviewed:nextState==='ready'});
    if(nextState==='ready'&&!version)throw new StudioError('INVALID_STATE','La candidatura lista necesita una versión revisada.',{status:409});
    const unknown=input.externalDocumentUnknown===true||(input.externalDocumentUnknown===undefined&&row.confirmation_origin==='owner_external_document_unknown');
    if(nextState==='sent_declared'&&(!sentAt||!channel||(!version&&!unknown)))throw new StudioError('INVALID_INPUT','Indicá fecha, canal y versión enviada o documento externo desconocido.');
    if(unknown&&version)throw new StudioError('INVALID_INPUT','Elegí una versión guardada o documento externo desconocido, no ambos.');
    const confirmation=nextState==='sent_declared'?(unknown?'owner_external_document_unknown':'owner_version'):row.confirmation_origin,now=new Date().toISOString();
    db.prepare('UPDATE applications SET cv_version_id=?,state=?,channel=?,sent_at=?,confirmation_origin=?,next_action=?,next_action_at=?,revision=revision+1,updated_at=? WHERE id=?').run(version,nextState,channel,sentAt,confirmation,Object.hasOwn(input,'nextAction')?input.nextAction:row.next_action,Object.hasOwn(input,'nextActionAt')?input.nextActionAt:row.next_action_at,now,id);
    recordActivity(db,{entityType:'application',entityId:id,kind:'updated',beforeState:row.state,afterState:nextState,actor:'owner',details:{...(input.note?{note:input.note}:{}),...(input.reason?{reason:input.reason}:{}),...(Object.hasOwn(input,'nextAction')?{nextAction:input.nextAction}:{}),...(Object.hasOwn(input,'nextActionAt')?{nextActionAt:input.nextActionAt}:{}),...(nextState==='sent_declared'?{sentAt,channel,externalDocumentUnknown:unknown,cvVersionId:version}:{})}});
    return getApplication(db,id);
  });
}
