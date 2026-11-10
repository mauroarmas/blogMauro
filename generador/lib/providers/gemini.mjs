import { GoogleGenAI } from '@google/genai';
import { setTimeout as sleep } from 'node:timers/promises';
import { StudioError } from '../errors.mjs';
import { canonicalJson, validate } from '../schemas.mjs';
import { getAiSettings, reserveModelCall, settleModelCall, usage } from './budget.mjs';

/** El SDK no recibe herramientas ni mantiene conversación remota. */
export function createGeminiProvider({apiKey=process.env.GEMINI_API_KEY,client}={}) {
  if(!client&&!apiKey)throw new StudioError('AI_CONFIGURATION_REQUIRED','La clave de Gemini no está configurada.',{status:409});
  const ai=client||new GoogleGenAI({apiKey,httpOptions:{timeout:60000,retryOptions:{attempts:1}}});
  return {
    async countTokens({model,input,systemInstruction,jsonSchema,signal}){
      const content=input+'\n'+canonicalJson(jsonSchema);
      const response=await ai.models.countTokens({model,contents:content,config:{systemInstruction,abortSignal:signal,httpOptions:{timeout:60000,retryOptions:{attempts:1}}}});
      if(!Number.isSafeInteger(response.totalTokens)||response.totalTokens<0)throw new StudioError('MODEL_NOT_VALIDATED','El proveedor no devolvió un conteo de tokens válido.',{status:422});
      return response.totalTokens;
    },
    async generate({model,input,systemInstruction,jsonSchema,maxOutputTokens,signal}){
      const response=await ai.interactions.create({model,input,system_instruction:systemInstruction,store:false,stream:false,automatic_continuation:false,response_format:{type:'text',mime_type:'application/json',schema:jsonSchema},generation_config:{max_output_tokens:maxOutputTokens}},{retries:{strategy:'none'},timeout_ms:60000,signal});
      return response;
    },
  };
}

/** Un intento remoto solo ocurre después de verificar consentimiento y reservar presupuesto. */
export async function executeGeminiStep({db,provider,operationId,input,systemInstruction,jsonSchema,outputSchema,signal,deadline=Date.now()+240000,retryState={used:false},allowValidation=false,keyAvailable}) {
  const settings=getAiSettings(db,{keyAvailable}),config=settings.config;
  if(!config||!settings.keyAvailable||(!settings.enabled&&!allowValidation))throw new StudioError('AI_CONFIGURATION_REQUIRED','Configurá y habilitá la IA antes de continuar.',{status:409});
  if(Date.now()>=deadline||signal?.aborted)throw new StudioError('DEADLINE_EXCEEDED','La operación fue cancelada o superó su tiempo.',{status:422});
  if(usage(db).restoreReconciliation?.required)throw new StudioError('RECONCILIATION_REQUIRED','Conciliá el consumo de la restauración antes de llamar a IA.',{status:409});
  if(config.billingMode==='paid' && usage(db).total>=config.monthlyLimitMicrousd)throw new StudioError('BUDGET_EXCEEDED','Se alcanzó el límite mensual configurado.',{status:429});
  const inputText=typeof input==='string'?input:canonicalJson(input);
  const tokenCount=await provider.countTokens({model:config.model,input:inputText,systemInstruction,jsonSchema,signal});
  // Reserva para el formato de transporte; el esquema también se incluye en el conteo.
  const reservedInput=tokenCount+1024;
  if(reservedInput>24000)throw new StudioError('INPUT_LIMIT','La oferta y sus fuentes superan el límite de contexto.',{status:422});
  for(;;){
    if(Date.now()>=deadline||signal?.aborted)throw new StudioError('DEADLINE_EXCEEDED','La operación fue cancelada o superó su tiempo.',{status:422});
    const reservation=reserveModelCall(db,{operationId,configId:config.id,inputTokens:reservedInput,maxOutputTokens:6000,request:{model:config.model,input:inputText,systemInstruction,jsonSchema},allowValidation,keyAvailable});
    let response;
    try {
      const timeout=AbortSignal.timeout(Math.max(1,Math.min(60000,deadline-Date.now())));
      response=await provider.generate({model:config.model,input:inputText,systemInstruction,jsonSchema,maxOutputTokens:6000,signal:signal?AbortSignal.any([signal,timeout]):timeout});
    } catch(error) {
      const status=Number(error?.status||error?.statusCode);
      // Reintentar solo si el adaptador tiene evidencia explícita de que no hubo cargo.
      // Un estado HTTP por sí solo no demuestra que el consumo sea cero.
      const rejectedWithoutCharge=(status===429||status===503) && error?.definitelyNoCharge===true && error?.receivedContent!==true;
      settleModelCall(db,reservation.callId,{state:rejectedWithoutCharge?'rejected_no_charge':'uncertain'});
      const delay=Math.max(0,Math.min(Number(error?.retryAfterMs)||1000,60000));
      if(rejectedWithoutCharge && !retryState.used && !signal?.aborted && Date.now()+delay<deadline){
        retryState.used=true;
        try {await sleep(delay,undefined,signal?{signal}:undefined);} catch {throw new StudioError('DEADLINE_EXCEEDED','Operación cancelada.',{status:422});}
        continue;
      }
      throw new StudioError('PROVIDER_UNAVAILABLE',rejectedWithoutCharge?'Gemini rechazó la solicitud.':'No se pudo completar la solicitud a Gemini; el consumo podría ser incierto.',{status:503,retryable:false});
    }
    const u=response.usage||{},inputTokens=u.total_input_tokens,outputTokens=u.total_output_tokens,thoughtTokens=u.total_thought_tokens;
    const known=[inputTokens,outputTokens,thoughtTokens].every(n=>Number.isSafeInteger(n)&&n>=0);
    const cost=known?(config.billingMode==='free'?0:Math.ceil((inputTokens*config.priceSnapshot.inputMicrousdPerMillion+(outputTokens+thoughtTokens)*config.priceSnapshot.outputMicrousdPerMillion)/1000000)):null;
    settleModelCall(db,reservation.callId,{state:known?'confirmed':'uncertain',costMicrousd:cost,inputTokens:Number.isSafeInteger(inputTokens)?inputTokens:null,outputTokens:Number.isSafeInteger(outputTokens)?outputTokens:null,otherUsage:{thoughtTokens:Number.isSafeInteger(thoughtTokens)?thoughtTokens:null}});
    if(response.status!=='completed')throw new StudioError('INVALID_RESPONSE','Gemini no completó la respuesta estructurada.',{status:422});
    let result;
    try {result=JSON.parse(response.output_text);} catch {throw new StudioError('INVALID_RESPONSE','Gemini devolvió una respuesta que no se pudo interpretar.',{status:422});}
    try {return {data:validate(outputSchema,result),callId:reservation.callId,usageKnown:known};}
    catch {throw new StudioError('INVALID_RESPONSE','La respuesta de Gemini no cumple el formato esperado.',{status:422});}
  }
}
