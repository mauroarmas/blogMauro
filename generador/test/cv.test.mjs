import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { loadContent, normalizeOptions, PROJECT_ROOT } from '../lib/content.mjs';
import { renderCv } from '../lib/template.mjs';
import { startServer } from '../server.mjs';

const compact = value => value.replace(/[–—‑]/g, '-').replace(/\s+/g, ' ').trim();

// No se toca ningún archivo real del perfil durante la prueba de actualización.
test('Las ediciones y los proyectos nuevos se leen sin reiniciar ni invalidar imports', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cv-content-'));
  try {
    await mkdir(join(root, 'src/styles'), { recursive: true });
    await cp(join(PROJECT_ROOT, 'src/content'), join(root, 'src/content'), { recursive: true });
    await cp(join(PROJECT_ROOT, 'src/styles/tokens.css'), join(root, 'src/styles/tokens.css'));
    const before = await loadContent({ photo: false }, { root });
    const profilePath = join(root, 'src/content/perfil.js');
    await writeFile(profilePath, (await readFile(profilePath, 'utf8')).replace('Estudiante de 5.º año', 'BIOGRAFIA ACTUALIZADA: Estudiante de 5.º año'));
    const projectsPath = join(root, 'src/content/proyectos.js');
    await writeFile(projectsPath, (await readFile(projectsPath, 'utf8')) + '\nproyectos.push({ ...proyectos[0], slug: "nuevo-proyecto", priority: 0 });\n');
    const after = await loadContent({ photo: false }, { root });
    assert.match(after.profile.about, /BIOGRAFIA ACTUALIZADA/);
    assert.equal(after.projects.length, before.projects.length + 1);
    assert.equal(after.projects[0].slug, 'nuevo-proyecto');
    assert.notEqual(after.revision, before.revision);
    assert.match(await renderCv(after), /BIOGRAFIA ACTUALIZADA/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('Opciones, selección vacía y protocolos inseguros', async () => {
  for (const options of [null, [], { locale: 'fr' }, { photo: 'yes' }, { projects: 'trimia' }, { portfolioUrl: 'javascript:alert(1)' }, { portfolioUrl: 'https://user:pass@example.com' }]) {
    assert.throws(() => normalizeOptions(options));
  }
  await assert.rejects(loadContent({ projects: ['no-existe'] }));
  assert.equal((await loadContent({ projects: [], photo: false })).projects.length, 0);
  const selected = await loadContent({ locale: 'en', projects: ['trimia'], photo: false, portfolioUrl: 'https://example.com/' });
  assert.equal(selected.projects.length, 1);
  assert.equal(selected.options.portfolioUrl, 'https://example.com');
  assert.match(await renderCv(selected), /https:\/\/example.com\/en\/proyectos\/trimia/);
});

test('El contenido se escapa como texto, no se ejecuta como HTML', async () => {
  const model = await loadContent({ projects: [], photo: false });
  model.profile.about = '</p><script>window.injected = true</script><p>';
  model.profile.name = '</script><script>window.injected = true</script>';
  const html = await renderCv(model);
  assert.ok(!html.includes('<script>window.injected = true</script>'));
  assert.match(html, /&lt;script&gt;window.injected/);
});

async function inspectLayout(page, model) {
  await page.setContent(await renderCv(model));
  await page.waitForFunction(() => window.__CV_READY || window.__CV_ERROR);
  const result = await page.evaluate(() => {
    const violations = [];
    for (const sheet of document.querySelectorAll('.sheet')) {
      const rect = sheet.getBoundingClientRect();
      // Incluye cabeceras, pies y párrafos: detecta filas de grid que crecen más que el A4.
      for (const element of sheet.querySelectorAll('p, h1, h2, h3, footer, .side-footer, .project-heading, .cv-side, .cv-main')) {
        const box = element.getBoundingClientRect();
        if (box.bottom > rect.bottom + 1 || box.top < rect.top - 1 || box.right > rect.right + 1) violations.push(element.className || element.tagName);
      }
    }
    return { error: window.__CV_ERROR, pages: window.__CV_RESULT?.pages, text: document.getElementById('pages').textContent, biography: [...document.querySelectorAll('.biography p')].map(p => p.textContent).join(' '), violations };
  });
  assert.equal(result.error, undefined);
  assert.deepEqual(result.violations, []);
  assert.ok(compact(result.biography) === compact(model.profile.about), 'La biografía no se debe truncar');
  for (const p of model.projects) assert.ok(compact(result.text).includes(compact(p.text.problem)), `Falta contenido de ${p.slug}`);
  return result;
}

test('A4 conserva todo el contenido en español, inglés y con textos largos', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.emulateMedia({ media: 'print' });
    for (const locale of ['es', 'en']) {
      const model = await loadContent({ locale });
      const result = await inspectLayout(page, model);
      assert.equal(result.pages, 2);
      const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true });
      assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
    }
    const long = await loadContent({ photo: false });
    long.profile.about = Array.from({ length: 70 }, (_, i) => `Párrafo ${i}: arquitectura, infraestructura y desarrollo de aplicaciones con texto que debe conservarse completo.`).join(' ');
    long.projects = [...long.projects, ...long.projects.map(p => ({ ...p, slug: p.slug + '-extra' }))];
    const result = await inspectLayout(page, long);
    assert.ok(result.pages > 3);
    const empty = await loadContent({ projects: [], photo: false });
    await inspectLayout(page, empty);
  } finally { await browser.close(); }
});

test('Servidor local: rutas acotadas, origen y token obligatorios para exportar', async () => {
  const app = await startServer({ port: 0 });
  try {
    assert.equal(app.server.address().address, '127.0.0.1');
    const response = await fetch(app.url);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
    const html = await response.text();
    const token = html.match(/name="cv-token" content="([^"]+)"/)[1];
    assert.equal((await fetch(app.url + '/api/content')).status, 200);
    assert.equal((await fetch(app.url + '/generador/lib/content.mjs')).status, 404);
    assert.equal((await fetch(app.url + '/public/cv/CV-Armas_Maurov2.pdf')).status, 404);
    const badHost = await new Promise((resolve, reject) => { const req = http.get(app.url, { headers: { Host: 'evil.example' } }, response => { response.resume(); resolve(response.statusCode); }); req.on('error', reject); });
    assert.equal(badHost, 403);
    assert.equal((await fetch(app.url, { headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal((await fetch(app.url + '/api/pdf', { method: 'POST' })).status, 403);
    const invalid = await fetch(app.url + '/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CV-Token': token }, body: 'null' });
    assert.equal(invalid.status, 400);
    const pdf = await fetch(app.url + '/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CV-Token': token }, body: JSON.stringify({ projects: ['nube-privada', 'trimia'], photo: false }) });
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString(), '%PDF');
  } finally { await app.close(); }
});

test('Panel: vista previa, opciones y descarga funcionan en conjunto', async () => {
  const app = await startServer({ port: 0 });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    await page.goto(app.url);
    await page.locator('#download:not([disabled])').waitFor();
    assert.match(await page.locator('#page-count').textContent(), /2 páginas/);
    const first = page.locator('#projects input').first();
    await first.uncheck();
    await page.locator('#download:not([disabled])').waitFor();
    assert.match(await page.locator('#selection-count').textContent(), /3 \/ 4/);
    const slug = await first.inputValue();
    await page.selectOption('#locale', 'en');
    await page.locator('#download:not([disabled])').waitFor();
    assert.equal(await page.locator(`#projects input[value="${slug}"]`).isChecked(), false);
    assert.equal(await page.frameLocator('#preview').locator('.recognition').count(), 0);
    await page.check('#photo');
    const [file] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
    assert.equal(file.suggestedFilename(), 'CV-Mauro-Armas-en.pdf');
    assert.equal(await file.failure(), null);
  } finally { await browser.close(); await app.close(); }
});
