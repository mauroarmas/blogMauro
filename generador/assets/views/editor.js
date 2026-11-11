const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export async function showEditor(host,{api,runOperation,state,openView}) {
  host.replaceChildren();host.append(el('h1','Editor de CV'));
  const status=el('p','');status.setAttribute('role','status');host.append(status);
  if(!state.draftId){
    if(!state.analysisId){host.append(el('p','Analizá una oferta para preparar un CV adaptado. El CV general sigue disponible en la pantalla principal.'));return;}
    status.textContent='Preparando propuesta con las fuentes seleccionadas…';
    try{const result=await runOperation('/drafts',{analysisId:state.analysisId,locale:'es',photo:true});state.draftId=result.draftId;}catch(error){status.textContent=error.message;return;}
  }
  let draft=await api('/drafts/'+state.draftId);
  const surface=el('div');host.append(surface);
  function render(){
    surface.replaceChildren();
    const note=el('p','Revisá cada afirmación y su fuente. Una referencia localizada no confirma por sí sola que la frase sea correcta.');note.className='studio-note';surface.append(note);
    if(state.lastEvidence || (state.analysisId && draft.analysisId!==state.analysisId)){const update=el('button','Actualizar fuentes conservando el texto');update.type='button';update.addEventListener('click',async()=>{try{draft=await api('/drafts/'+draft.id+'/rebase',{method:'POST',json:{expectedRevision:draft.revision,analysisId:state.analysisId}});state.draftId=draft.id;status.textContent='Fuentes actualizadas. Revisá nuevamente cada afirmación.';render();}catch(error){status.textContent=error.message;}});surface.append(update);}
    if(draft.reasons?.length){surface.append(el('h2','Cambios propuestos'));const list=el('ul');for(const reason of draft.reasons)list.append(el('li',reason));surface.append(list);}
    const form=el('form');form.className='studio-form';
    const bioLabel=el('label','Biografía');const bio=el('textarea');bio.rows=7;bio.maxLength=6000;bio.value=draft.content.biography;bioLabel.append(bio);form.append(bioLabel);
    form.append(el('h2','Proyectos'));const projectControls=[];
    for(const project of draft.availableProjects){
      const block=el('section');block.className='studio-card';const label=el('label');label.className='check';const checkbox=el('input');checkbox.type='checkbox';checkbox.checked=draft.content.projectIds.includes(project.slug);label.append(checkbox,document.createTextNode(project.name));block.append(label);
      const summary=draft.content.projectSummaries.find(item=>item.slug===project.slug);let textarea=null;if(summary){const textLabel=el('label','Resumen');textarea=el('textarea');textarea.rows=4;textarea.maxLength=5000;textarea.value=summary.text;textLabel.append(textarea);block.append(textLabel);}
      const order=el('input');order.type='number';order.min='1';order.max=String(draft.availableProjects.length);order.value=String(Math.max(0,draft.content.projectIds.indexOf(project.slug))+1);const orderLabel=el('label','Orden');orderLabel.append(order);block.append(orderLabel);projectControls.push({project,checkbox,textarea,order});form.append(block);
    }
    form.append(el('h2','Competencias'));const skills=el('div');skills.className='studio-checks';const skillControls=[];
    for(const skill of draft.availableSkills){const label=el('label');label.className='check';const checkbox=el('input');checkbox.type='checkbox';checkbox.checked=draft.content.skills.includes(skill);label.append(checkbox,document.createTextNode(skill));skills.append(label);skillControls.push({skill,checkbox});}form.append(skills);
    const localeLabel=el('label','Idioma');const locale=el('select');for(const [value,name] of [['es','Español'],['en','English']]){const option=el('option',name);option.value=value;locale.append(option);}locale.value=draft.presentationOptions.locale;localeLabel.append(locale);form.append(localeLabel);
    const photoLabel=el('label');photoLabel.className='check';const photo=el('input');photo.type='checkbox';photo.checked=draft.presentationOptions.photo;photoLabel.append(photo,document.createTextNode('Incluir fotografía'));form.append(photoLabel);
    const portfolioLabel=el('label','URL del portafolio (opcional)');const portfolio=el('input');portfolio.type='url';portfolio.value=draft.presentationOptions.portfolioUrl||'';portfolioLabel.append(portfolio);form.append(portfolioLabel);
    const warning=el('p','Cambiar el idioma recupera el contenido general de ese idioma y conserva la redacción anterior para consultarla. Las afirmaciones y enlaces deben revisarse otra vez.');warning.className='studio-note';form.append(warning);
    if(draft.previousLocales&&Object.keys(draft.previousLocales).length){const details=el('details'),summary=el('summary','Ver redacción anterior');details.append(summary);for(const [lang,previous] of Object.entries(draft.previousLocales)){details.append(el('h3',lang),el('p',previous.editable.biography));for(const item of previous.editable.projectSummaries)details.append(el('p',`${item.slug}: ${item.text}`));}form.append(details);}
    const save=el('button','Guardar cambios');save.type='submit';form.append(save);surface.append(form);
    form.addEventListener('submit',async event=>{event.preventDefault();try{
      const projectIds=projectControls.filter(item=>item.checkbox.checked).sort((a,b)=>Number(a.order.value)-Number(b.order.value)).map(item=>item.project.slug);
      const projectSummaries=projectControls.filter(item=>item.checkbox.checked&&item.textarea).map(item=>({slug:item.project.slug,text:item.textarea.value}));
      draft=await api('/drafts/'+draft.id,{method:'PATCH',json:{expectedRevision:draft.revision,content:{biography:bio.value,projectIds,projectSummaries,skills:skillControls.filter(item=>item.checkbox.checked).map(item=>item.skill)}}});
      const changed=locale.value!==draft.presentationOptions.locale||photo.checked!==draft.presentationOptions.photo||portfolio.value.trim()!==(draft.presentationOptions.portfolioUrl||'');
      if(changed)draft=await api('/drafts/'+draft.id,{method:'PATCH',json:{expectedRevision:draft.revision,presentationOptions:{locale:locale.value,photo:photo.checked,portfolioUrl:portfolio.value.trim()}}});
      status.textContent='Cambios guardados; revisá de nuevo las afirmaciones.';render();
    }catch(error){status.textContent=error.message;}});
    const review=el('section');review.append(el('h2','Revisión de afirmaciones'));const claimControls=[];
    for(const claim of draft.claims){const card=el('article');card.className='studio-card';card.id='claim-'+claim.id;card.append(el('p',claim.text),el('p',`Estado: ${claim.validation} · ${claim.reviewStatus}`));
      for(const ref of claim.evidenceRefs){const button=el('button','Ver fuente');button.type='button';button.addEventListener('click',async()=>{try{const fragment=await api('/evidence/'+ref.fragmentId);card.append(el('blockquote',fragment.text));const browse=el('button','Abrir en fuentes');browse.type='button';browse.addEventListener('click',()=>{state.focusSourceRevisionId=fragment.sourceRevisionId;state.focusClaimId=claim.id;openView('sources');});card.append(browse);button.disabled=true;}catch(error){status.textContent=error.message;}});card.append(button);}
      if(state.lastEvidence){const attach=el('button','Vincular última aportación');attach.type='button';attach.addEventListener('click',async()=>{try{draft=await api('/drafts/'+draft.id+'/evidence',{method:'POST',json:{expectedRevision:draft.revision,claimId:claim.id,evidenceRefs:[{fragmentId:state.lastEvidence.id,quote:state.lastEvidence.text}]}});status.textContent='Evidencia vinculada. Revisá el significado antes de confirmar.';render();}catch(error){status.textContent=error.message+' Puede ser necesario actualizar las fuentes del borrador.';}});card.append(attach);}
      const label=el('label');label.className='check';const checkbox=el('input');checkbox.type='checkbox';checkbox.checked=claim.reviewStatus==='owner_confirmed';checkbox.disabled=claim.validation!=='source_located';label.append(checkbox,document.createTextNode('Revisé esta afirmación y su fuente'));card.append(label);claimControls.push({claim,checkbox});review.append(card);
    }
    review.append(el('h2','Enlaces'));const linkControls=[];
    for(const link of draft.linkChecks){const card=el('article');card.className='studio-card';card.append(el('p',`${link.url||'URL inválida'} · ${link.classification}`));if(link.reason)card.append(el('p',link.reason));
      if(link.classification==='needs_check'){const label=el('label');label.className='check';const checkbox=el('input');checkbox.type='checkbox';checkbox.checked=link.recipientAccessConfirmed;label.append(checkbox,document.createTextNode('Comprobé que el destinatario puede acceder'));card.append(label);const note=el('input');note.placeholder='Cómo comprobaste el acceso';note.value=link.note||'';note.setAttribute('aria-label','Nota de comprobación');card.append(note);linkControls.push({link,checkbox,note});}
      else if(['local','invalid','restricted'].includes(link.classification))card.append(el('p','Actualizá la fuente o retirala antes de marcar revisado.'));
      review.append(card);
    }
    const actions=el('div');actions.className='studio-actions';const saveReview=el('button','Guardar avance de revisión'),reviewed=el('button','Marcar revisado');saveReview.type=reviewed.type='button';actions.append(saveReview,reviewed);review.append(actions);surface.append(review);
    async function submitReview(decision){try{
      const claimDecisions=claimControls.filter(item=>item.checkbox.checked&&item.claim.reviewStatus!=='owner_confirmed').map(item=>({claimId:item.claim.id,decision:'confirm'}));
      const linkDecisions=linkControls.filter(item=>item.checkbox.checked&&!item.link.recipientAccessConfirmed).map(item=>({id:item.link.id,url:item.link.url,decision:'confirm_access',note:item.note.value}));
      draft=await api('/drafts/'+draft.id+'/reviews',{method:'POST',json:{expectedRevision:draft.revision,decision,claimDecisions,linkDecisions}});status.textContent=decision==='reviewed'?'CV marcado como revisado.':'Avance de revisión guardado.';render();
    }catch(error){status.textContent=error.message;}}
    saveReview.addEventListener('click',()=>submitReview('needs_review'));reviewed.addEventListener('click',()=>submitReview('reviewed'));
    const previewTitle=el('h2','Vista previa A4');surface.append(previewTitle);const iframe=el('iframe');iframe.title='Vista previa del CV adaptado';iframe.className='studio-preview';iframe.setAttribute('sandbox','allow-scripts');iframe.src='/api/v1/drafts/'+draft.id+'/preview';surface.append(iframe);
    const generate=el('button','Guardar versión PDF');generate.type='button';generate.addEventListener('click',async()=>{try{status.textContent='Generando versión…';const result=await runOperation('/versions',{draftId:draft.id,expectedDraftRevision:draft.revision});const link=el('a','Descargar PDF guardado');link.href='/api/v1/versions/'+result.versionId+'/pdf';link.className='studio-download';surface.append(link);status.textContent=result.reviewed?'Versión revisada guardada.':'Versión guardada; todavía no está marcada como revisada.';}catch(error){status.textContent=error.message;}});surface.append(generate);
  }
  status.textContent='Propuesta lista para revisar.';render();if(state.focusClaimId){document.getElementById('claim-'+state.focusClaimId)?.scrollIntoView();state.focusClaimId=null;}
}
