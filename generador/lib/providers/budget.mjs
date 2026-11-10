import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { transaction } from '../db.mjs';
import { canonicalJson, sha256, validate } from '../schemas.mjs';
import { StudioError } from '../errors.mjs';
import { recordActivity } from '../activity.mjs';

const priceSchema=z.strictObject({inputMicrousdPerMillion:z.number().int().nonnegative(),outputMicrousdPerMillion:z.number().int().nonnegative(),verifiedAt:z.iso.datetime(),source:z.url()});
const configSchema=z.strictObject({provider:z.literal('gemini'),model:z.string().min(1).max(200),billingMode:z.enum(['free','paid']),sharingCategories:z.array(z.enum(['offer','preferences','professional_fragments'])).min(1),sharingAccepted:z.literal(true),monthlyLimitMicrousd:z.number().int().positive().nullable(),perOperationLimitMicrousd:z.number().int().positive().nullable(),priceSnapshot:priceSchema,freeQuotaConfirmed:z.boolean()}).superRefine((v,ctx)=>{
  if(v.billingMode==='paid'&&(!v.monthlyLimitMicrousd||!v.perOperationLimitMicrousd))ctx.addIssue({code:'custom',message:'La modalidad de pago necesita límites mensual y por operación.'});
  if(v.billingMode==='free'&&!v.freeQuotaConfirmed)ctx.addIssue({code:'custom',message:'Confirmá la modalidad gratuita y cuota de la cuenta.'});
  if(!['offer','preferences','professional_fragments'].every(category=>v.sharingCategories.includes(category)))ctx.addIssue({code:'custom',message:'Confirmá las categorías necesarias para la adaptación.'});
});
export function currentPeriod(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Tucuman',year:'numeric',month:'2-digit'}).formatToParts(now);
  return `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}`;
}
export function getAiSettings(db,{keyAvailable=Boolean(process.env.GEMINI_API_KEY)}={}) {
  const row=db.prepare('SELECT * FROM ai_settings WHERE id=1').get();
  if(!row||!row.current_revision_id)return {revision:row?.revision||0,enabled:false,keyAvailable,config:null,validated:false};
  const config=db.prepare('SELECT * FROM ai_config_revisions WHERE id=?').get(row.current_revision_id);
  return {revision:row.revision,enabled:Boolean(row.enabled),keyAvailable,validated:row.validated_revision_id===config.id,config:{id:config.id,provider:config.provider,model:config.model,billingMode:config.billing_mode,sharingCategories:JSON.parse(config.sharing_categories),sharingConfirmedAt:config.sharing_confirmed_at,monthlyLimitMicrousd:config.monthly_limit_microusd,perOperationLimitMicrousd:config.per_operation_limit_microusd,priceSnapshot:JSON.parse(config.price_snapshot),outputLimits:JSON.parse(config.output_limits)}};
}
export function saveAiSettings(db,expectedRevision,input) {
  const data=validate(configSchema,input);
  return transaction(db,()=>{
    let state=db.prepare('SELECT * FROM ai_settings WHERE id=1').get();
    if(!state){if(expectedRevision!==0)throw new StudioError('REVISION_CONFLICT','La configuración cambió.',{status:409});db.prepare('INSERT INTO ai_settings(id,revision,updated_at) VALUES(1,0,?)').run(new Date().toISOString());state={revision:0};}
    if(state.revision!==expectedRevision)throw new StudioError('REVISION_CONFLICT','La configuración cambió.',{status:409,details:{currentRevision:state.revision}});
    const id=randomUUID(),now=new Date().toISOString();
    db.prepare('INSERT INTO ai_config_revisions(id,provider,model,billing_mode,sharing_categories,sharing_confirmed_at,monthly_limit_microusd,per_operation_limit_microusd,budget_timezone,price_snapshot,output_limits,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,data.provider,data.model,data.billingMode,canonicalJson(data.sharingCategories),now,data.monthlyLimitMicrousd,data.perOperationLimitMicrousd,'America/Argentina/Tucuman',canonicalJson(data.priceSnapshot),canonicalJson({input:24000,output:6000,freeQuotaConfirmed:data.freeQuotaConfirmed}),now);
    db.prepare('UPDATE ai_settings SET current_revision_id=?,enabled=0,revision=revision+1,validated_revision_id=NULL,validation_operation_id=NULL,updated_at=? WHERE id=1').run(id,now);
    return getAiSettings(db);
  });
}
export function markAiValidated(db,configId,operationId) {
  const state=db.prepare('SELECT * FROM ai_settings WHERE id=1').get();
  if(!state||state.current_revision_id!==configId)throw new StudioError('REVISION_CONFLICT','La configuración cambió durante la validación.',{status:409});
  db.prepare('UPDATE ai_settings SET validated_revision_id=?,validation_operation_id=?,updated_at=? WHERE id=1').run(configId,operationId,new Date().toISOString());
}
export function enableAi(db,expectedRevision,enabled) {
  if(typeof enabled!=='boolean')throw new StudioError('INVALID_INPUT','El estado debe ser verdadero o falso.');
  const state=db.prepare('SELECT * FROM ai_settings WHERE id=1').get();
  if(!state||state.revision!==expectedRevision)throw new StudioError('REVISION_CONFLICT','La configuración cambió.',{status:409});
  if(enabled&&db.prepare('SELECT required FROM restore_reconciliation WHERE id=1').get()?.required)throw new StudioError('RECONCILIATION_REQUIRED','Conciliá el consumo posterior a la copia antes de habilitar IA.',{status:409});
  if(enabled&&(!state.current_revision_id||state.current_revision_id!==state.validated_revision_id))throw new StudioError('AI_CONFIGURATION_REQUIRED','Validá la configuración antes de habilitarla.',{status:409});
  db.prepare('UPDATE ai_settings SET enabled=?,revision=revision+1,updated_at=? WHERE id=1').run(enabled?1:0,new Date().toISOString());return getAiSettings(db);
}
export function usage(db,period=currentPeriod()) {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))throw new StudioError('INVALID_INPUT','El período no es válido.');
  const result=db.prepare(`SELECT COALESCE(SUM(CASE WHEN b.state='settled' THEN COALESCE(c.accounted_cost_microusd,b.amount_microusd) ELSE 0 END),0) accounted,COALESCE(SUM(CASE WHEN b.state='reserved' THEN b.amount_microusd ELSE 0 END),0) reserved,COALESCE(SUM(CASE WHEN b.state='uncertain' THEN b.amount_microusd ELSE 0 END),0) uncertain FROM budget_reservations b JOIN llm_calls c ON c.id=b.llm_call_id WHERE b.period_key=?`).get(period);
  const adjustment=db.prepare('SELECT COALESCE(SUM(amount_microusd),0) total FROM budget_adjustments WHERE period_key=?').get(period).total;
  const uncertainCalls=db.prepare("SELECT c.id AS callId,c.operation_id AS operationId,b.amount_microusd AS reservedMicrousd,c.started_at AS startedAt FROM budget_reservations b JOIN llm_calls c ON c.id=b.llm_call_id WHERE b.period_key=? AND b.state='uncertain' ORDER BY c.started_at,c.id").all(period);
  const guard=db.prepare('SELECT required,period_key,prior_known_microusd,prior_uncertain_microusd,prior_usage_available FROM restore_reconciliation WHERE id=1').get();
  const restoreReconciliation=guard?.required?{required:true,period:guard.period_key,priorKnown:guard.prior_known_microusd,priorUncertain:guard.prior_uncertain_microusd,priorUsageAvailable:Boolean(guard.prior_usage_available)}:null;
  return {period,accounted:result.accounted,reserved:result.reserved,uncertain:result.uncertain,adjustment,total:result.accounted+result.reserved+result.uncertain+adjustment,uncertainCalls,restoreReconciliation};
}
export function reserveModelCall(db,{operationId,configId,inputTokens,maxOutputTokens=6000,request,allowValidation=false,keyAvailable=Boolean(process.env.GEMINI_API_KEY),now=new Date()}) {
  if(!Number.isSafeInteger(inputTokens)||inputTokens<0||inputTokens>24000||!Number.isSafeInteger(maxOutputTokens)||maxOutputTokens<1||maxOutputTokens>6000)throw new StudioError('INPUT_LIMIT','La solicitud supera el límite de tokens.',{status:422});
  return transaction(db,()=>{
    if(db.prepare('SELECT required FROM restore_reconciliation WHERE id=1').get()?.required)throw new StudioError('RECONCILIATION_REQUIRED','Conciliá el consumo posterior a la copia antes de llamar a IA.',{status:409});
    const settings=getAiSettings(db,{keyAvailable}),config=settings.config;
    if(!config||config.id!==configId||!settings.keyAvailable||(!settings.enabled&&!allowValidation))throw new StudioError('AI_CONFIGURATION_REQUIRED','Configurá y habilitá la IA antes de continuar.',{status:409});
    const price=config.priceSnapshot;
    const max=config.billingMode==='free'?0:Math.ceil((inputTokens*price.inputMicrousdPerMillion+maxOutputTokens*price.outputMicrousdPerMillion)/1_000_000);
    if(!Number.isSafeInteger(max))throw new StudioError('AI_CONFIGURATION_REQUIRED','La tarifa configurada no es válida.',{status:409});
    const period=currentPeriod(now),totals=usage(db,period);
    const opTotal=db.prepare(`SELECT COALESCE(SUM(CASE WHEN b.state='settled' THEN COALESCE(c.accounted_cost_microusd,b.amount_microusd) WHEN b.state IN ('reserved','uncertain') THEN b.amount_microusd ELSE 0 END),0) total FROM budget_reservations b JOIN llm_calls c ON c.id=b.llm_call_id WHERE c.operation_id=?`).get(operationId).total;
    if(config.billingMode==='paid'&&(totals.total+max>config.monthlyLimitMicrousd||opTotal+max>config.perOperationLimitMicrousd))throw new StudioError('BUDGET_EXCEEDED','La solicitud supera el límite configurado.',{status:429});
    const callId=randomUUID(),reservationId=randomUUID(),timestamp=now.toISOString();
    db.prepare('INSERT INTO llm_calls(id,operation_id,ai_config_revision_id,request_sha256,state,other_usage,estimated_cost_microusd,usage_status,started_at) VALUES(?,?,?,?,?,?,?,?,?)').run(callId,operationId,config.id,sha256(canonicalJson(request)),'reserved','{}',max,'pending',timestamp);
    db.prepare('INSERT INTO budget_reservations(id,llm_call_id,period_key,amount_microusd,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(reservationId,callId,period,max,'reserved',timestamp,timestamp);
    return {callId,reservationId,reservedMicrousd:max,period};
  });
}
export function settleModelCall(db,callId,{state,costMicrousd=null,inputTokens=null,outputTokens=null,otherUsage={}}) {
  if(!['confirmed','not_sent','rejected_no_charge','uncertain'].includes(state)|| (costMicrousd!==null&&(!Number.isSafeInteger(costMicrousd)||costMicrousd<0)))throw new StudioError('INVALID_INPUT','El resultado de consumo no es válido.');
  return transaction(db,()=>{
    const row=db.prepare('SELECT * FROM budget_reservations WHERE llm_call_id=?').get(callId);
    if(!row||row.state!=='reserved')throw new StudioError('INVALID_STATE','La reserva ya fue cerrada.',{status:409});
    const settled=state==='confirmed'&&costMicrousd!==null;
    const reservationState=['not_sent','rejected_no_charge'].includes(state)?'released':settled?'settled':'uncertain',now=new Date().toISOString();
    db.prepare('UPDATE budget_reservations SET state=?,updated_at=? WHERE id=?').run(reservationState,now,row.id);
    db.prepare('UPDATE llm_calls SET state=?,usage_status=?,accounted_cost_microusd=?,input_tokens=?,output_tokens=?,other_usage=?,finished_at=? WHERE id=?').run(state,settled?'known':['not_sent','rejected_no_charge'].includes(state)?'none':'unknown',settled?costMicrousd:null,inputTokens,outputTokens,canonicalJson(otherUsage),now,callId);
    return {state:reservationState,reservedMicrousd:row.amount_microusd,accountedMicrousd:settled?costMicrousd:null};
  });
}

/** Una conciliación es explícita y queda registrada; no borra consumo conocido. */
export function reconcileUncertain(db,{callId,costMicrousd,reason}) {
  if(!Number.isSafeInteger(costMicrousd)||costMicrousd<0||typeof reason!=='string'||reason.trim().length<3)throw new StudioError('INVALID_INPUT','Indicá el importe comprobado y el motivo.');
  return transaction(db,()=>{
    const reservation=db.prepare('SELECT * FROM budget_reservations WHERE llm_call_id=?').get(callId);
    if(!reservation||reservation.state!=='uncertain')throw new StudioError('INVALID_STATE','No hay consumo incierto para conciliar.',{status:409});
    const now=new Date().toISOString();
    db.prepare("UPDATE budget_reservations SET state='settled',updated_at=? WHERE id=?").run(now,reservation.id);
    db.prepare("UPDATE llm_calls SET state='confirmed',usage_status='reconciled',accounted_cost_microusd=?,finished_at=? WHERE id=?").run(costMicrousd,now,callId);
    recordActivity(db,{entityType:'llm_call',entityId:callId,kind:'usage_reconciled',actor:'owner',details:{reason:reason.trim(),costMicrousd}});
    return usage(db,reservation.period_key);
  });
}
export function addBudgetAdjustment(db,{period,amountMicrousd,reason,sourceDatasetId=null}) {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)||!Number.isSafeInteger(amountMicrousd)||amountMicrousd<0||typeof reason!=='string'||reason.trim().length<3)throw new StudioError('INVALID_INPUT','El ajuste necesita período, importe y motivo válidos.');
  return transaction(db,()=>{
    const id=randomUUID(),now=new Date().toISOString();
    db.prepare('INSERT INTO budget_adjustments(id,period_key,amount_microusd,reason,source_dataset_id,confirmed_at,created_at) VALUES(?,?,?,?,?,?,?)').run(id,period,amountMicrousd,reason.trim(),sourceDatasetId,now,now);
    recordActivity(db,{entityType:'budget_adjustment',entityId:id,kind:'created',actor:'owner',details:{period,amountMicrousd}});
    return usage(db,period);
  });
}

export function reconcileRestore(db,{period,observedTotalMicrousd,reason,confirmation}){
  if(confirmation!==true||!Number.isSafeInteger(observedTotalMicrousd)||observedTotalMicrousd<0||typeof reason!=='string'||reason.trim().length<3)throw new StudioError('INVALID_INPUT','Confirmá el consumo comprobado y su motivo.');
  return transaction(db,()=>{
    const guard=db.prepare('SELECT * FROM restore_reconciliation WHERE id=1').get();
    if(!guard?.required||guard.period_key!==period)throw new StudioError('INVALID_STATE','No hay una conciliación pendiente para ese período.',{status:409});
    const current=usage(db,period);
    if(current.reserved||current.uncertain)throw new StudioError('RECONCILIATION_REQUIRED','Conciliá primero cada llamada incierta de la copia.',{status:409});
    if(observedTotalMicrousd<guard.prior_known_microusd)throw new StudioError('INVALID_INPUT','El importe comprobado no puede ser menor al consumo conocido antes de restaurar.');
    const adjustment=Math.max(0,observedTotalMicrousd-current.total),now=new Date().toISOString();
    if(adjustment)db.prepare('INSERT INTO budget_adjustments(id,period_key,amount_microusd,reason,source_dataset_id,confirmed_at,created_at) VALUES(?,?,?,?,?,?,?)').run(randomUUID(),period,adjustment,reason.trim(),guard.prior_dataset_id,now,now);
    db.prepare('UPDATE restore_reconciliation SET required=0,resolved_at=?,reason=? WHERE id=1').run(now,reason.trim());
    recordActivity(db,{entityType:'restore',entityId:guard.prior_dataset_id,kind:'usage_reconciled',actor:'owner',details:{period,observedTotalMicrousd,adjustment}});
    return usage(db,period);
  });
}
