const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const show=value=>value===null||value===undefined||value===''?'Sin informar':String(value);
export async function showOffers(host,{api,runOperation,state,openView}){
  host.replaceChildren();host.append(el('h1','Ofertas'));
  const notice=el('p','Pegá una oferta o adjuntá un TXT/PDF legible. La URL se guarda como referencia y no se visita automáticamente.');notice.className='studio-note';host.append(notice);
  const feedback=el('p','');feedback.setAttribute('role','status');host.append(feedback);
  const form=el('form');form.className='studio-form';
  form.innerHTML=`<label>Descripción<textarea name="text" rows="7" maxlength="100000" placeholder="Pegá el texto de la oferta"></textarea></label><label>O adjuntar archivo TXT/PDF<input name="file" type="file" accept=".txt,.pdf,text/plain,application/pdf"></label><label>URL de origen (opcional)<input name="url" type="url" placeholder="https://..."></label><button type="submit">Guardar oferta</button>`;
  host.append(form);const list=el('section'),detail=el('section');list.className='studio-list';detail.className='studio-detail';host.append(list,detail);
  async function refreshList(){
    const data=await api('/opportunities');list.replaceChildren(el('h2','Ofertas guardadas'));
    if(!data.items.length){list.append(el('p','Todavía no agregaste ofertas.'));return;}
    for(const item of data.items){const button=el('button',`${show(item.fields.title)==='Sin informar'?'Oferta sin analizar':item.fields.title} · ${item.sourceKind}`);button.type='button';button.addEventListener('click',()=>open(item.id).catch(error=>{feedback.textContent=error.message;}));list.append(button);}
  }
  async function open(id){
    if(state.opportunityId!==id){state.draftId=null;state.analysisId=null;state.applicationId=null;}state.opportunityId=id;const item=await api('/opportunities/'+id);detail.replaceChildren(el('h2',show(item.fields.title)==='Sin informar'?'Oferta guardada':item.fields.title));
    detail.append(el('p',`Origen: ${item.sourceKind} · Estado: ${item.status}`));
    const original=await api('/opportunities/'+id+'/original');const disclosure=el('details');disclosure.append(el('summary','Ver descripción original'));const text=el('pre',original.text);text.className='studio-original';disclosure.append(text);detail.append(disclosure);
    if(item.originalUrl){const link=el('a','Abrir oferta original ↗');link.href=item.originalUrl;link.target='_blank';link.rel='noreferrer';detail.append(link);}
    const tracking=el('section');tracking.className='studio-card';tracking.append(el('h3','Seguimiento'));
    const statusForm=el('form');statusForm.className='studio-form';statusForm.innerHTML=`<label>Estado de oportunidad<select name="status"><option value="new">Nueva</option><option value="analyzed">Analizada</option><option value="selected">Seleccionada</option><option value="discarded">Descartada</option><option value="closed">Cerrada</option></select></label><label>Motivo (para reabrir)<input name="reason"></label><button type="submit">Actualizar estado</button>`;statusForm.elements.status.value=item.status;
    statusForm.addEventListener('submit',async event=>{event.preventDefault();try{await api('/opportunities/'+id,{method:'PATCH',json:{expectedRevision:item.revision,status:statusForm.elements.status.value,reason:statusForm.elements.reason.value}});feedback.textContent='Estado actualizado.';await refreshList();await open(id);}catch(error){feedback.textContent=error.message;}});tracking.append(statusForm);
    if(item.applications.length)for(const application of item.applications){const button=el('button',`Candidatura · ${application.state}`);button.type='button';button.addEventListener('click',()=>{state.applicationId=application.id;openView('applications');});tracking.append(button);}
    const follow=el('button','Registrar o consultar seguimiento');follow.type='button';follow.addEventListener('click',()=>{state.applicationId=null;openView('applications');});tracking.append(follow);
    for(const version of item.versions){const link=el('a',version.deletedAt?'Versión eliminada':'Descargar CV asociado');if(!version.deletedAt){link.href='/api/v1/versions/'+version.id+'/pdf';link.className='studio-download';}tracking.append(link);}detail.append(tracking);
    const edit=el('form');edit.className='studio-form';edit.innerHTML=`<label>Puesto<input name="title"></label><label>Empresa<input name="company"></label><label>Ubicación<input name="location"></label><label>Modalidad<select name="mode"><option value="unknown">Sin informar</option><option value="remote">Remoto</option><option value="onsite">Presencial</option><option value="hybrid">Híbrido</option></select></label><div class="studio-actions"><button type="submit">Guardar correcciones</button><button type="button" data-action="analyze">Analizar oferta</button></div>`;
    edit.elements.title.value=item.fields.title||'';edit.elements.company.value=item.fields.company||'';edit.elements.location.value=item.fields.location||'';edit.elements.mode.value=item.fields.workMode||'unknown';detail.append(edit);
    edit.addEventListener('submit',async event=>{event.preventDefault();try{await api('/opportunities/'+id+'/revisions',{method:'POST',json:{expectedRevision:item.revision,correctedFields:{title:edit.elements.title.value||null,company:edit.elements.company.value||null,location:edit.elements.location.value||null,workMode:edit.elements.mode.value}}});feedback.textContent='Corrección guardada. Volvé a analizar para actualizar el resultado.';state.analysisId=null;await refreshList();await open(id);}catch(error){feedback.textContent=error.message;}});
    edit.querySelector('[data-action=analyze]').addEventListener('click',async()=>{try{
      feedback.textContent='Analizando oferta y fuentes…';const prefs=await api('/preferences');const result=await runOperation('/opportunities/'+id+'/analyses',{offerRevisionId:item.revisionId,preferencesRevisionId:prefs.revisionId});state.analysisId=result.analysisId;feedback.textContent='Análisis listo.';await refreshList();await open(id);await showAnalysis(result.analysisId);
    }catch(error){feedback.textContent=error.message;}});
    const latest=item.analysisId;
    if(latest){state.analysisId=latest;await showAnalysis(latest);}
  }
  async function showAnalysis(id){
    const previous=detail.querySelector('[data-analysis]');if(previous)previous.remove();
    const analysis=await api('/analyses/'+id),section=el('section');section.dataset.analysis='true';section.className='studio-analysis';section.append(el('h2',`Ajuste: ${analysis.matchLevel}`));
    if(analysis.reasons?.exclusions?.length)for(const reason of analysis.reasons.exclusions)section.append(el('p',`${reason.status}: ${reason.reason}`));
    for(const match of analysis.matches){const block=el('article');block.append(el('h3',match.status),el('p',match.explanation));for(const ref of match.evidenceRefs){const button=el('button','Ver evidencia');button.type='button';button.addEventListener('click',async()=>{try{const fragment=await api('/evidence/'+ref.fragmentId);const quote=el('blockquote',fragment.text);block.append(quote);button.disabled=true;}catch(error){feedback.textContent=error.message;}});block.append(button);}section.append(block);}
    const adapt=el('button','Adaptar CV para esta oferta');adapt.type='button';adapt.addEventListener('click',()=>{state.analysisId=id;openView('editor');});section.append(adapt);detail.append(section);
  }
  form.addEventListener('submit',async event=>{event.preventDefault();try{
    const file=form.elements.file.files[0],text=form.elements.text.value.trim();if(Boolean(file)===Boolean(text))throw new Error('Elegí texto o archivo, no ambos.');
    const payload=new FormData();if(file)payload.set('file',file);else payload.set('text',text);if(form.elements.url.value.trim())payload.set('sourceUrl',form.elements.url.value.trim());
    feedback.textContent='Leyendo oferta…';const result=await runOperation('/opportunities/import',payload);feedback.textContent=result.duplicateOf?'Se reutilizó la oferta existente.':'Oferta guardada.';form.reset();await refreshList();await open(result.opportunityId);
  }catch(error){feedback.textContent=error.message;}});
  await refreshList();if(state.opportunityId)await open(state.opportunityId);
}
