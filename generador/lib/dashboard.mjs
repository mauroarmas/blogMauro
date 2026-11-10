import { listOpportunities } from './opportunities.mjs';

/** Todos los conteos se derivan de las oportunidades filtradas, nunca de PDFs. */
export function getDashboard(db,filters={}){
  const opportunities=[];let cursor=null;
  do{const page=listOpportunities(db,{...filters,limit:100,cursor});opportunities.push(...page.items);cursor=page.nextCursor;}while(cursor);
  const opportunityStates={},applicationStates={},applications=[],activity=[];
  for(const opportunity of opportunities){
    opportunityStates[opportunity.status]=(opportunityStates[opportunity.status]||0)+1;
    const rows=db.prepare('SELECT id,opportunity_id,state,channel,sent_at,next_action,next_action_at,updated_at FROM applications WHERE opportunity_id=? ORDER BY updated_at DESC,id DESC').all(opportunity.id);
    for(const row of rows){applications.push({id:row.id,opportunityId:row.opportunity_id,state:row.state,channel:row.channel,sentAt:row.sent_at,nextAction:row.next_action,nextActionAt:row.next_action_at,updatedAt:row.updated_at});applicationStates[row.state]=(applicationStates[row.state]||0)+1;}
    const events=db.prepare("SELECT entity_type,entity_id,kind,occurred_at FROM activity_events WHERE (entity_type='opportunity' AND entity_id=?) OR (entity_type='application' AND entity_id IN (SELECT id FROM applications WHERE opportunity_id=?)) ORDER BY occurred_at DESC,id DESC LIMIT 20").all(opportunity.id,opportunity.id);
    activity.push(...events.map(event=>({entityType:event.entity_type,entityId:event.entity_id,kind:event.kind,occurredAt:event.occurred_at,opportunityId:opportunity.id})));
  }
  activity.sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)||b.entityId.localeCompare(a.entityId));
  const pending=applications.filter(item=>item.nextAction||item.nextActionAt).sort((a,b)=>(a.nextActionAt||'9999').localeCompare(b.nextActionAt||'9999'));
  return {opportunities:opportunities.length,applications:applications.length,opportunityStates,applicationStates,recentActivity:activity.slice(0,20),pending:pending.slice(0,20)};
}
