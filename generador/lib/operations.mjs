import { randomUUID } from 'node:crypto';
import { canonicalJson, idempotencyKey, sha256, validate } from './schemas.mjs';
import { StudioError } from './errors.mjs';
import { transaction } from './db.mjs';
import { recordActivity } from './activity.mjs';

const parse=row=>row && ({id:row.id,kind:row.kind,state:row.state,progress:JSON.parse(row.progress),result:row.result_refs?JSON.parse(row.result_refs):null,errorCode:row.error_code,createdAt:row.created_at,startedAt:row.started_at,finishedAt:row.finished_at});
export class Operations {
  constructor(db,{handlers={}}={}) {
    this.db=db;this.handlers=handlers;this.active=null;this.controllers=new Map();this.closed=false;
    const now=new Date().toISOString();
    transaction(db,()=>{
      // Si el proceso cayó durante una llamada, no hay prueba de consumo cero.
      // Mantener el importe reservado como incierto y permitir su conciliación.
      db.prepare("UPDATE budget_reservations SET state='uncertain',updated_at=? WHERE state='reserved' AND llm_call_id IN (SELECT c.id FROM llm_calls c JOIN operations o ON o.id=c.operation_id WHERE o.state='running')").run(now);
      db.prepare("UPDATE llm_calls SET state='uncertain',usage_status='unknown',finished_at=? WHERE id IN (SELECT llm_call_id FROM budget_reservations WHERE state='uncertain') AND operation_id IN (SELECT id FROM operations WHERE state='running')").run(now);
      db.prepare("UPDATE operations SET state='interrupted',error_code='PROCESS_INTERRUPTED',finished_at=? WHERE state='running'").run(now);
    });
    queueMicrotask(()=>this.drain());
  }
  get(id) {const row=this.db.prepare('SELECT * FROM operations WHERE id=?').get(id);if(!row) throw new StudioError('NOT_FOUND','No se encontró la operación.',{status:404});return parse(row);}
  start(kind,key,input,{retryOfId=null}={}) {
    validate(idempotencyKey,key);
    if(typeof kind!=='string'||!Object.hasOwn(this.handlers,kind)) throw new StudioError('INVALID_INPUT','Operación no disponible.');
    const json=canonicalJson(input),digest=sha256(canonicalJson({kind,input}));
    const result=transaction(this.db,()=>{
      const old=this.db.prepare('SELECT * FROM operations WHERE request_key=?').get(key);
      if(old){if(old.request_sha256!==digest)throw new StudioError('IDEMPOTENCY_CONFLICT','La clave ya se usó para otra solicitud.',{status:409});return parse(old);}
      const queued=this.db.prepare("SELECT count(*) AS n FROM operations WHERE state='queued'").get().n;
      if(queued>=10) throw new StudioError('QUEUE_FULL','Hay demasiadas operaciones pendientes.',{status:429,retryable:true});
      const id=randomUUID(),now=new Date().toISOString();
      this.db.prepare('INSERT INTO operations(id,kind,request_key,request_sha256,input_manifest,state,progress,retry_of_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,kind,key,digest,json,'queued','{}',retryOfId,now);
      recordActivity(this.db,{entityType:'operation',entityId:id,kind:'created',afterState:'queued'});
      return this.get(id);
    });
    queueMicrotask(()=>this.drain());return result;
  }
  cancel(id) {
    const row=this.db.prepare('SELECT state FROM operations WHERE id=?').get(id);
    if(!row) throw new StudioError('NOT_FOUND','No se encontró la operación.',{status:404});
    if(row.state==='queued'){
      transaction(this.db,()=>{this.db.prepare("UPDATE operations SET state='cancelled',finished_at=? WHERE id=? AND state='queued'").run(new Date().toISOString(),id);recordActivity(this.db,{entityType:'operation',entityId:id,kind:'cancelled',beforeState:'queued',afterState:'cancelled',actor:'owner'});});
    } else if(row.state==='running') this.controllers.get(id)?.abort();
    return this.get(id);
  }
  retry(id,key) {
    const row=this.db.prepare('SELECT * FROM operations WHERE id=?').get(id);
    if(!row) throw new StudioError('NOT_FOUND','No se encontró la operación.',{status:404});
    if(!['failed','interrupted','cancelled'].includes(row.state)) throw new StudioError('INVALID_STATE','Solo se reintenta una operación interrumpida, cancelada o fallida.',{status:409});
    return this.start(row.kind,key,JSON.parse(row.input_manifest),{retryOfId:id});
  }
  async drain() {
    if(this.active||this.closed)return;
    const row=this.db.prepare("SELECT * FROM operations WHERE state='queued' ORDER BY created_at,id LIMIT 1").get();
    if(!row)return;
    const handler=this.handlers[row.kind];
    if(!handler){this.db.prepare("UPDATE operations SET state='interrupted',error_code='HANDLER_UNAVAILABLE',finished_at=? WHERE id=?").run(new Date().toISOString(),row.id);queueMicrotask(()=>this.drain());return;}
    const controller=new AbortController();this.controllers.set(row.id,controller);this.active=row.id;
    this.db.prepare("UPDATE operations SET state='running',started_at=? WHERE id=? AND state='queued'").run(new Date().toISOString(),row.id);
    const progress=value=>{this.db.prepare("UPDATE operations SET progress=? WHERE id=? AND state='running'").run(canonicalJson(value),row.id);};
    try {
      const result=await handler(JSON.parse(row.input_manifest),{id:row.id,signal:controller.signal,progress});
      // Un handler que ya hizo commit atómico puede haber marcado la operación como exitosa.
      this.db.prepare("UPDATE operations SET state='succeeded',result_refs=?,finished_at=? WHERE id=? AND state='running'").run(canonicalJson(result??{}),new Date().toISOString(),row.id);
    } catch(error) {
      const cancelled=controller.signal.aborted;
      this.db.prepare("UPDATE operations SET state=?,error_code=?,finished_at=? WHERE id=? AND state='running'").run(cancelled?'cancelled':'failed',cancelled?'CANCELLED':error instanceof StudioError?error.code:'INTERNAL_ERROR',new Date().toISOString(),row.id);
    } finally {this.controllers.delete(row.id);this.active=null;queueMicrotask(()=>this.drain());}
  }
  async close(){this.closed=true;if(this.active)this.controllers.get(this.active)?.abort();while(this.active)await new Promise(resolve=>setTimeout(resolve,10));}
}
