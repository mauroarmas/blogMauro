const form = document.getElementById('options');
const locale = document.getElementById('locale');
const projects = document.getElementById('projects');
const preview = document.getElementById('preview');
const status = document.getElementById('status');
const errorBox = document.getElementById('error');
const download = document.getElementById('download');
let initialized = false;
let exporting = false;
let previewReady = false;
let timer;
function showError(message = '') { errorBox.hidden = !message; errorBox.textContent = message; }
function options() {
  return { locale: locale.value, projects: [...projects.querySelectorAll('input:checked')].map(input => input.value), photo: document.getElementById('photo').checked, portfolioUrl: document.getElementById('portfolio-url').value.trim() };
}
async function refreshContent() {
  const previous = new Map([...projects.querySelectorAll('input')].map(input => [input.value, input.checked]));
  const response = await fetch(`/api/content?locale=${locale.value}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || data.error || 'No se pudo cargar el contenido.');
  projects.replaceChildren();
  for (const project of data.projects) {
    const label = document.createElement('label'); label.className = 'project-option';
    const input = document.createElement('input'); input.type = 'checkbox'; input.value = project.slug;
    input.checked = !initialized || !previous.has(project.slug) || previous.get(project.slug);
    const name = document.createElement('span'); name.textContent = project.name;
    label.append(input, name); projects.append(label);
  }
  initialized = true;
}
function refreshPreview() {
  if (!form.reportValidity()) return;
  showError(); previewReady = false; download.disabled = true;
  status.textContent = 'Actualizando vista previa…';
  const config = options();
  document.getElementById('selection-count').textContent = `${config.projects.length} / ${projects.children.length}`;
  preview.src = '/preview?' + new URLSearchParams({ ...config, projects: config.projects.join(','), t: Date.now() });
}
async function refresh() {
  try { await refreshContent(); refreshPreview(); }
  catch (error) { showError(error.message); status.textContent = 'No se pudo actualizar'; }
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== preview.contentWindow) return;
  if (event.data.type === 'cv-ready') {
    previewReady = true; download.disabled = exporting;
    document.getElementById('page-count').textContent = `${event.data.pages} ${event.data.pages === 1 ? 'página' : 'páginas'}`;
    status.textContent = 'Contenido actualizado';
  } else if (event.data.type === 'cv-error') {
    showError(event.data.message); status.textContent = 'Revisá el contenido';
  }
});
// Los errores de validación del servidor también deben ser visibles en el panel.
preview.addEventListener('load', () => {
  const body = preview.contentDocument?.body;
  if (body && !preview.contentDocument.getElementById('pages') && preview.src !== 'about:blank') {
    try { showError(JSON.parse(body.textContent).error); } catch { showError('No se pudo cargar la vista previa.'); }
    status.textContent = 'Revisá las opciones';
  }
});
form.addEventListener('change', event => { if (event.target === locale) refresh(); else refreshPreview(); });
document.getElementById('portfolio-url').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(refreshPreview, 650); });
document.getElementById('refresh').addEventListener('click', refresh);
form.addEventListener('submit', async event => {
  event.preventDefault(); if (exporting || !form.reportValidity()) return;
  exporting = true; download.disabled = true; showError(); status.textContent = 'Generando PDF…';
  try {
    const config = options();
    const response = await fetch('/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CV-Token': document.querySelector('meta[name=cv-token]').content }, body: JSON.stringify(config) });
    if (!response.ok) { const problem = await response.json(); throw new Error(problem.error?.message || problem.error || 'No se pudo generar el PDF.'); }
    const url = URL.createObjectURL(await response.blob());
    const a = document.createElement('a'); a.href = url; a.download = `CV-Mauro-Armas-${config.locale}.pdf`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    status.textContent = 'PDF descargado';
    // Reflejar también las ediciones de archivos hechas desde la última vista previa.
    await refreshContent(); refreshPreview();
  } catch (error) { showError(error.message); status.textContent = 'No se pudo generar'; }
  finally { exporting = false; download.disabled = !previewReady; }
});
refresh();


const studioState = { opportunityId: null, analysisId: null, draftId: null, applicationId: null };
const featureWorkspace = document.getElementById('feature-workspace');
const featureContent = document.getElementById('feature-content');
const generalWorkspace = document.getElementById('general-workspace');
const studioControls = document.querySelector('.controls');
const pendingForms = new Map();
let activeFormKey = null, activeView = null, formsDirty = false;
const formKey = view => `${view}:${studioState.opportunityId||''}:${studioState.draftId||''}:${studioState.applicationId||''}`;
function keepPendingForms(){
  if(!activeFormKey||!formsDirty)return;
  const forms=[...featureContent.querySelectorAll('form')].map(form=>[...form.querySelectorAll('input,textarea,select')].map(input=>({tag:input.tagName,type:input.type,name:input.name,value:input.value,checked:input.checked,files:input.type==='file'?[...input.files]:null})));
  pendingForms.set(activeFormKey,forms);
}
function restorePendingForms(key){
  const saved=pendingForms.get(key);if(!saved)return false;
  [...featureContent.querySelectorAll('form')].forEach((form,index)=>{const fields=[...form.querySelectorAll('input,textarea,select')];for(const [i,old] of (saved[index]||[]).entries()){const field=fields[i];if(!field||field.tagName!==old.tag||field.type!==old.type||field.name!==old.name)continue;if(field.type==='file'){const data=new DataTransfer();for(const file of old.files||[])data.items.add(file);field.files=data.files;}else if(['checkbox','radio'].includes(field.type))field.checked=old.checked;else field.value=old.value;}});
  pendingForms.delete(key);return true;
}
for(const event of ['input','change'])featureContent.addEventListener(event,()=>{formsDirty=true;if(activeView)activeFormKey=formKey(activeView);});
async function studioApi(path, { method = 'GET', json, body, headers = {} } = {}) {
  const requestHeaders = { 'X-CV-Token': document.querySelector('meta[name=cv-token]').content, ...headers };
  if (json !== undefined) { requestHeaders['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  const response = await fetch('/api/v1' + path, { method, headers: requestHeaders, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error?.message || 'No se pudo completar la operación.'),{status:response.status});
  return data;
}
async function runOperation(path, input) {
  const key = crypto.randomUUID();
  const params = input instanceof FormData || input instanceof Blob ? { method:'POST', body:input } : { method:'POST', json:input };
  const started = await studioApi(path, { ...params, headers: { 'Idempotency-Key':key } });
  let result;
  do {
    await new Promise(resolve => setTimeout(resolve, 250));
    try { result = await studioApi('/operations/' + started.operationId); } catch(error) { if(error.status===503){result={state:'running'};continue;} throw error; }
  } while (result.state === 'queued' || result.state === 'running');
  if (result.state !== 'succeeded') {
    const messages = { AI_CONFIGURATION_REQUIRED:'Configurá y habilitá Gemini antes de analizar o adaptar.', BUDGET_EXCEEDED:'La operación supera el límite configurado.', RECONCILIATION_REQUIRED:'Conciliá el consumo de la restauración antes de usar IA.', SOURCE_CHANGED:'Las fuentes cambiaron. Volvé a analizar la oferta.', REVISION_CONFLICT:'La oferta, el borrador o las preferencias cambiaron. Actualizá la vista.', UNREADABLE_SOURCE:'No se pudo leer el archivo. Podés pegar el texto.', INVALID_RESPONSE:'No se pudo validar la respuesta de la IA.', PROVIDER_UNAVAILABLE:'Gemini no respondió; revisá el consumo incierto en Configuración.' };
    throw new Error(messages[result.errorCode] || `No se completó la operación (${result.errorCode || result.state}).`);
  }
  return result.result;
}
async function openStudioView(view) {
  keepPendingForms();activeFormKey=null;activeView=null;formsDirty=false;
  const general = view === 'general';
  generalWorkspace.hidden = !general; featureWorkspace.hidden = general;
  studioControls.classList.toggle('feature-active', !general);
  for (const button of document.querySelectorAll('.studio-nav [data-view]')) {
    if (button.dataset.view === view) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  }
  if (general) return;
  featureContent.replaceChildren(); const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Cargando…';featureContent.append(status);
  try {
    const allowed={ offers:'showOffers', editor:'showEditor', settings:'showSettings', versions:'showVersions', backups:'showBackups', dashboard:'showDashboard', applications:'showApplications', sources:'showSources', preferences:'showPreferences' };
    if(!allowed[view])throw new Error('Esta sección todavía no está disponible.');
    const viewModule=await import(`/assets/views/${view}.js`);
    await viewModule[allowed[view]](featureContent,{api:studioApi,runOperation,state:studioState,openView:openStudioView});
    activeView=view;activeFormKey=formKey(view);formsDirty=restorePendingForms(activeFormKey);
    featureWorkspace.focus({preventScroll:true});
  } catch (error) { featureContent.replaceChildren(); const message=document.createElement('p');message.setAttribute('role','alert');message.textContent=error.message;featureContent.append(message); }
}
for(const button of document.querySelectorAll('.studio-nav [data-view]'))button.addEventListener('click',()=>openStudioView(button.dataset.view));
