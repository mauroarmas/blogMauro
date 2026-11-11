import { randomUUID } from 'node:crypto';
import { canonicalJson } from './schemas.mjs';
export function recordActivity(db,{entityType,entityId,kind,beforeState=null,afterState=null,details={},actor='system',occurredAt=new Date().toISOString()}) {
  const id=randomUUID(),now=new Date().toISOString();
  db.prepare('INSERT INTO activity_events(id,entity_type,entity_id,kind,before_state,after_state,details,actor,occurred_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,entityType,entityId,kind,beforeState,afterState,canonicalJson(details),actor,occurredAt,now);
  return id;
}
