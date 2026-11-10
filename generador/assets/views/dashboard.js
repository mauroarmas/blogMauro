const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const labels={high:'Alto',medium:'Medio',low:'Bajo',insufficient_information:'Información insuficiente'};
export async function showDashboard(host,{api,state,openView}){
  host.replaceChildren();host.append(el('h1','Tu búsqueda'));
  const status=el('p','');status.setAttribute('role','status');host.append(status);
  const form=el('form');form.className='studio-form';form.innerHTML=`<label>Empresa<input name="company"></label><label>Puesto<input name="role"></label><label>Estado<select name="status"><option value="">Todos</option><option value="new">Nueva</option><option value="analyzed">Analizada</option><option value="selected">Seleccionada</option><option value="discarded">Descartada</option><option value="closed">Cerrada</option></select></label><label>Modalidad<select name="workMode"><option value="">Todas</option><option value="remote">Remoto</option><option value="onsite">Presencial</option><option value="hybrid">Híbrido</option><option value="unknown">Desconocida</option></select></label><label>Ajuste<select name="matchLevel"><option value="">Todos</option><option value="high">Alto</option><option value="medium">Medio</option><option value="low">Bajo</option><option value="insufficient_information">Información insuficiente</option></select></label><label>Desde<input name="from" type="date"></label><label>Hasta<input name="to" type="date"></label><button type="submit">Aplicar filtros</button>`;host.append(form);
  const summary=el('section'),list=el('section'),moreBox=el('div');list.className='studio-list';host.append(summary,list,moreBox);let cursor=null;
  function params(next){const p=new URLSearchParams();for(const key of ['company','role','status','workMode','matchLevel','from','to'])if(form.elements[key].value)p.set(key,form.elements[key].value);if(next)p.set('cursor',next);return p.toString();}
  function renderItem(item){
    const card=el('article');card.className='studio-card';const title=el('h3',`${item.fields.title||'Oferta sin analizar'} · ${item.fields.company||'Empresa sin informar'}`);card.append(title,el('p',`${item.fields.workMode||'Modalidad desconocida'} · ${item.fields.location||'Ubicación desconocida'} · Ajuste: ${labels[item.matchLevel]||'Sin análisis'} · ${item.status}`));
    if(item.matchReasons?.exclusions?.length){const reasons=item.matchReasons.exclusions.map(x=>`${x.status}: ${x.reason}`).join(' · ');card.append(el('p',reasons));}
    card.append(el('p',`Última actividad: ${new Date(item.lastActivity).toLocaleString()}${item.nextAction?' · Próxima acción: '+item.nextAction:''}`));
    const button=el('button','Abrir oportunidad');button.type='button';button.addEventListener('click',()=>{state.opportunityId=item.id;state.analysisId=item.analysisId;state.draftId=null;openView('offers');});card.append(button);list.append(card);
  }
  async function refresh(reset=true){
    if(reset){const total=await api('/dashboard?'+params());summary.replaceChildren(el('p',`${total.opportunities} oportunidades · ${total.applications} candidaturas`));const states=Object.entries(total.applicationStates).map(([name,count])=>`${name}: ${count}`).join(' · ');if(states)summary.append(el('p',states));list.replaceChildren(el('h2','Oportunidades'));cursor=null;}
    const data=await api('/opportunities?'+params(reset?null:cursor));if(reset&&!data.items.length)list.append(el('p','No hay oportunidades para estos filtros.'));for(const item of data.items)renderItem(item);cursor=data.nextCursor;moreBox.replaceChildren();if(cursor){const button=el('button','Ver más');button.type='button';button.addEventListener('click',()=>refresh(false).catch(error=>status.textContent=error.message));moreBox.append(button);}
  }
  form.addEventListener('submit',event=>{event.preventDefault();refresh().catch(error=>status.textContent=error.message);});await refresh();
}
