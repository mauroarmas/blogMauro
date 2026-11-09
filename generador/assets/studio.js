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
  if (!response.ok) throw new Error(data.error);
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
    if (!response.ok) throw new Error((await response.json()).error);
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
