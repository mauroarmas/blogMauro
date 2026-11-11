const element=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const elRestoreHeading=()=>element('h2','Conciliar consumo tras restauración');
const money=value=>Number.isInteger(value)?(value/1000000).toFixed(6):'—';
function fromUsd(value){if(!value.trim())return null;const amount=Number(value);if(!Number.isFinite(amount)||amount<0||amount>1000000)throw new Error('Ingresá un importe válido en USD.');return Math.round(amount*1000000);}

export async function showSettings(host,{api,runOperation}) {
  host.replaceChildren();
  const heading=element('h1','Configuración de IA');host.append(heading);
  const notice=element('p','Gemini es el proveedor disponible. La clave se configura en el entorno local como GEMINI_API_KEY; nunca se ingresa en este panel.');notice.className='studio-note';host.append(notice);
  const status=element('p','Cargando…');status.setAttribute('role','status');host.append(status);
  const form=element('form');form.className='studio-form';
  form.innerHTML=`<label>Modelo<input name="model" required placeholder="gemini-3.6-flash"></label>
  <label>Modalidad<select name="billing"><option value="free">Gratuita declarada</option><option value="paid">Pago</option></select></label>
  <label>Límite mensual en USD <input name="monthly" type="number" min="0.000001" step="0.000001" inputmode="decimal"></label>
  <label>Límite por operación en USD <input name="operation" type="number" min="0.000001" step="0.000001" inputmode="decimal"></label>
  <label>Tarifa de entrada en USD por millón de tokens <input name="inputPrice" type="number" min="0" step="0.000001" inputmode="decimal"></label>
  <label>Tarifa de salida y razonamiento en USD por millón de tokens <input name="outputPrice" type="number" min="0" step="0.000001" inputmode="decimal"></label>
  <label class="check"><input name="freeConfirmed" type="checkbox"> Confirmo que el modelo y la cuota gratuita están disponibles en mi cuenta.</label>
  <label class="check"><input name="sharing" type="checkbox" required> Acepto enviar a Gemini la oferta, preferencias necesarias y fragmentos profesionales seleccionados.</label>
  <p class="studio-note">Foto y datos de contacto se mantienen en el render local. El uso gratuito puede emplearse para mejorar productos; revisá las condiciones vigentes antes de activar.</p>
  <p><a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer">Precios y tratamiento de datos de Gemini ↗</a></p>
  <div class="studio-actions"><button type="submit">Guardar configuración</button><button type="button" data-action="validate">Validar conexión</button><button type="button" data-action="toggle">Habilitar IA</button></div>`;
  host.append(form);const usage=element('p');usage.className='studio-note';host.append(usage);
  const reconciliation=element('section');host.append(reconciliation);
  let state=await api('/ai/settings');
  function render(){
    const config=state.config;form.elements.model.value=config?.model||'gemini-3.6-flash';form.elements.billing.value=config?.billingMode||'free';
    form.elements.monthly.value=config?.monthlyLimitMicrousd?money(config.monthlyLimitMicrousd):'';form.elements.operation.value=config?.perOperationLimitMicrousd?money(config.perOperationLimitMicrousd):'';
    form.elements.inputPrice.value=config?.priceSnapshot?money(config.priceSnapshot.inputMicrousdPerMillion):'';form.elements.outputPrice.value=config?.priceSnapshot?money(config.priceSnapshot.outputMicrousdPerMillion):'';
    form.elements.freeConfirmed.checked=Boolean(config?.outputLimits?.freeQuotaConfirmed);form.elements.sharing.checked=Boolean(config?.sharingConfirmedAt);
    status.textContent=`Clave ${state.keyAvailable?'configurada':'no configurada'} · IA ${state.enabled?'habilitada':'deshabilitada'} · ${state.validated?'conexión validada':'sin validar'}`;
    form.querySelector('[data-action=toggle]').textContent=state.enabled?'Deshabilitar IA':'Habilitar IA';
  }
  async function refreshUsage(){
    const result=await api('/ai/usage');usage.textContent=`Este mes: USD ${money(result.accounted)} contabilizados · ${money(result.reserved)} reservados · ${money(result.uncertain)} inciertos. El control no incluye usos de la clave fuera de CV Studio.`;
    reconciliation.replaceChildren();
    if(result.restoreReconciliation?.required){
      const pending=result.restoreReconciliation,item=element('form');item.className='studio-form';item.append(elRestoreHeading());
      item.append(element('p',pending.priorUsageAvailable?`Antes de restaurar había USD ${money(pending.priorKnown)} conocidos y ${money(pending.priorUncertain)} inciertos en ${pending.period}. Consultá el proveedor y conciliá primero las llamadas inciertas de la copia.`:`No se pudo recuperar el consumo anterior. Consultá el total de ${pending.period} en el proveedor y conciliá primero las llamadas inciertas de la copia.`));
      const amountLabel=element('label','Consumo total comprobado del período en USD');const amount=element('input');amount.type='number';amount.min='0';amount.step='0.000001';amount.required=true;amountLabel.append(amount);
      const reasonLabel=element('label','Fuente o nota de la comprobación');const reason=element('input');reason.required=true;reason.minLength=3;reasonLabel.append(reason);const confirm=element('label');confirm.className='check';const checkbox=element('input');checkbox.type='checkbox';checkbox.required=true;confirm.append(checkbox,document.createTextNode('Confirmo que revisé el consumo del proveedor para este período.'));const button=element('button','Conciliar restauración');button.type='submit';item.append(amountLabel,reasonLabel,confirm,button);
      item.addEventListener('submit',async event=>{event.preventDefault();try{const observedTotalMicrousd=fromUsd(amount.value);if(observedTotalMicrousd===null)throw new Error('Ingresá el consumo comprobado.');await api('/ai/usage/reconcile',{method:'POST',json:{completeRestore:true,period:pending.period,observedTotalMicrousd,reason:reason.value,confirmation:checkbox.checked}});status.textContent='Restauración conciliada. Volvé a validar la configuración antes de habilitar IA.';await refreshUsage();}catch(error){status.textContent=error.message;}});reconciliation.append(item);
    }
    for(const call of result.uncertainCalls||[]){
      const item=element('form');item.className='studio-form';const title=element('h2','Conciliar consumo incierto');const detail=element('p',`Reserva estimada: USD ${money(call.reservedMicrousd)} · ${call.startedAt||''}`);
      const amountLabel=element('label','Importe comprobado en USD');const amount=element('input');amount.type='number';amount.min='0';amount.step='0.000001';amount.required=true;amountLabel.append(amount);
      const reasonLabel=element('label','Motivo o referencia de la comprobación');const reason=element('input');reason.required=true;reason.minLength=3;reasonLabel.append(reason);
      const button=element('button','Registrar conciliación');button.type='submit';item.append(title,detail,amountLabel,reasonLabel,button);
      item.addEventListener('submit',async event=>{event.preventDefault();try{const costMicrousd=fromUsd(amount.value);if(costMicrousd===null)throw new Error('Ingresá el importe comprobado.');await api('/ai/usage/reconcile',{method:'POST',json:{callId:call.callId,costMicrousd,reason:reason.value}});status.textContent='Consumo conciliado.';await refreshUsage();}catch(error){status.textContent=error.message;}});
      reconciliation.append(item);
    }
  }
  form.addEventListener('submit',async event=>{event.preventDefault();try{
    const paid=form.elements.billing.value==='paid';const monthly=paid?fromUsd(form.elements.monthly.value):null,operation=paid?fromUsd(form.elements.operation.value):null;
    const inputPrice=paid?fromUsd(form.elements.inputPrice.value):0,outputPrice=paid?fromUsd(form.elements.outputPrice.value):0;
    if(paid&&(monthly===null||operation===null||inputPrice===null||outputPrice===null))throw new Error('Completá límites y tarifas antes de guardar la modalidad de pago.');
    state=await api('/ai/settings',{method:'PUT',json:{expectedRevision:state.revision,provider:'gemini',model:form.elements.model.value.trim(),billingMode:form.elements.billing.value,sharingCategories:['offer','preferences','professional_fragments'],sharingAccepted:form.elements.sharing.checked,monthlyLimitMicrousd:monthly,perOperationLimitMicrousd:operation,priceSnapshot:{inputMicrousdPerMillion:inputPrice,outputMicrousdPerMillion:outputPrice,verifiedAt:new Date().toISOString(),source:'https://ai.google.dev/gemini-api/docs/pricing'},freeQuotaConfirmed:form.elements.freeConfirmed.checked}});render();status.textContent+=' · Configuración guardada.';await refreshUsage();
  }catch(error){status.textContent=error.message;}});
  form.querySelector('[data-action=validate]').addEventListener('click',async()=>{try{status.textContent='Validando conexión…';await runOperation('/ai/settings/validate',{});state=await api('/ai/settings');render();await refreshUsage();}catch(error){status.textContent=error.message;await refreshUsage();}});
  form.querySelector('[data-action=toggle]').addEventListener('click',async()=>{try{state=await api('/ai/settings/enable',{method:'POST',json:{expectedRevision:state.revision,enabled:!state.enabled}});render();}catch(error){status.textContent=error.message;}});
  render();await refreshUsage();
}
