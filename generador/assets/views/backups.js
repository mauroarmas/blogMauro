const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export async function showBackups(host,{runOperation}){
  host.replaceChildren();host.append(el('h1','Copias de seguridad'));
  const intro=el('p','La copia contiene tus ofertas, versiones y seguimiento privados. Guardala en un lugar seguro; no incluye tu clave de IA.');intro.className='studio-note';host.append(intro);
  const feedback=el('p','');feedback.setAttribute('role','status');host.append(feedback);
  const exportButton=el('button','Crear copia');exportButton.type='button';host.append(exportButton);
  exportButton.addEventListener('click',async()=>{try{feedback.textContent='Creando copia…';const result=await runOperation('/backups',{});const link=el('a','Descargar copia');link.href=`/api/v1/backups/${result.backupId}/download`;link.className='studio-download';host.append(link);feedback.textContent='Copia lista. El enlace está disponible durante 24 horas.';}catch(error){feedback.textContent=error.message;}});
  host.append(el('h2','Restaurar una copia'));const form=el('form');form.className='studio-form';const label=el('label','Archivo SQLite de CV Studio');const file=el('input');file.type='file';file.required=true;label.append(file);const inspect=el('button','Inspeccionar copia');inspect.type='submit';form.append(label,inspect);host.append(form);const scope=el('section');host.append(scope);
  form.addEventListener('submit',async event=>{event.preventDefault();scope.replaceChildren();try{
    if(!file.files[0])throw new Error('Elegí una copia.');feedback.textContent='Inspeccionando copia…';const info=await runOperation('/backups/restore-preview',file.files[0]);feedback.textContent='Copia validada.';
    scope.append(el('h3','Alcance del reemplazo'),el('p',`El conjunto actual será reemplazado por la copia ${info.datasetId}. Versiones: ${info.counts.cv_versions}; oportunidades: ${info.counts.opportunities}. Se conservará una copia recuperable del estado anterior.`),el('p','Después de restaurar será necesario conciliar el consumo de IA y volver a validar la configuración.'));
    const confirm=el('button','Confirmar restauración');confirm.type='button';confirm.addEventListener('click',async()=>{try{confirm.disabled=true;feedback.textContent='Restaurando…';await runOperation('/backups/restore',{validationOperationId:info.validationOperationId,expectedDatasetId:info.expectedDatasetId,confirmation:true});scope.replaceChildren();feedback.textContent='Copia restaurada. Conciliá el consumo en Configuración antes de habilitar IA.';}catch(error){feedback.textContent=error.message;confirm.disabled=false;}});scope.append(confirm);
  }catch(error){feedback.textContent=error.message;}});
}
