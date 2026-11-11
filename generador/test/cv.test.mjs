import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { loadContent, normalizeOptions, PROJECT_ROOT } from '../lib/content.mjs';
import { renderCv } from '../lib/template.mjs';
import { extractDocument } from '../lib/documents.mjs';
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
  assert.equal(normalizeOptions({ locale: 'en', portfolioUrl: 'https://mauroarmas.netlify.app/es' }).portfolioUrl, 'https://mauroarmas.netlify.app');
  assert.match(await renderCv(selected), /https:\/\/example\.com\/en/);
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
      const extracted = (await extractDocument(pdf, { type: 'application/pdf' })).text;
      assert.match(extracted, /www\.linkedin\.com\/in\/mauro-armas/);
      assert.doesNotMatch(extracted, /\bin www\.linkedin\.com/);
      assert.match(extracted, new RegExp(`mauroarmas\\.netlify\\.app/${locale}`));
      if (locale === 'en') {
        const p1 = extracted.split('\f')[0];
        const p2 = extracted.split('\f')[1] || '';
        assert.ok(p1.indexOf('CONTACT') < p1.indexOf('PROFESSIONAL SUMMARY'));
        assert.ok(p1.indexOf('PROFESSIONAL SUMMARY') < p1.indexOf('EXPERIENCE & ENGINEERING PROJECTS'));
        assert.ok(extracted.indexOf('TECHNICAL SKILLS') !== -1);
        assert.ok(extracted.indexOf('EDUCATION') !== -1);
        const projects = ['NAP - Academic Private Cloud Platform', 'TrimIA - Multi-Agent AI Platform', 'Guardia Médica - ER Clinical Triage System', 'Portal de Oficios Concepción', 'Multi-Tenant Gym Management SaaS Platform'];
        let cursor = -1;
        for (const project of projects) {
          const idx = extracted.indexOf(project);
          assert.ok(idx > cursor, `Orden de proyecto inválido para ${project}`);
          cursor = idx;
        }
        assert.match(extracted, /Full-Stack Development \| Infrastructure \| Automations & AI/);
        assert.match(extracted, /5th year \| Apr 2021 - Present/);
        assert.match(extracted, /UTN-FRT \(Supervised Practicum\) \| Sep 2026 - Nov 2026 \| Team of 3 \| Paper Accepted at CONAIISI 2026/);
        assert.match(extracted, /Credimisión S\.R\.L\. \(Degree Thesis, UTN-FRT\) \| Apr 2026 - Present \| Individual Development/);
        assert.match(extracted, /UTN-FRT \(Software Engineering\) \| Oct 2025 - Dec 2025 \| Team of 3/);
        assert.match(extracted, /Municipality of Concepción & Rolling Code School \| Nov 2023 - Mar 2024 \| Team of 4/);
        assert.match(extracted, /Personal Project \(Commercial Client Spec\) \| Nov 2026 - Present \| Individual Development/);
        assert.match(extracted, /Flyway, Thymeleaf, HTMX,[\s\S]*JUnit 5/);
        assert.match(extracted, /RAG, LLMs, Spec-Driven/);
        assert.match(extracted, /Technologies: Python, FastAPI, React, Vite, PostgreSQL, Proxmox VE, LXC, Docker, OCI, TrueNAS,\s+SDN, HTTPS,\s+SSH, TLS/);
        assert.match(extracted, /Data & Databases:\s+PostgreSQL, MySQL, MongoDB, Redis,\s+ChromaDB \(Vector DB\), Prisma,\s+Hibernate\/JPA, Flyway/);
        assert.doesNotMatch(extracted, /Case study|Experience and skills|Lab validated|Bases de datos relacionales|Gestión de proyectos|\b01\b|\b02\b/);
      } else {
        assert.match(extracted, /Desarrollo Full-Stack \| Infraestructura \| Automatizaciones e IA/);
        assert.match(extracted, /5\.º año \| Abr 2021 - Actualidad/);
        assert.match(extracted, /UTN-FRT \(Práctica Supervisada\) \| Sep 2026 - Nov 2026 \| Equipo de 3 \| Aprobado en CONAIISI 2026/);
        assert.match(extracted, /Credimisión S\.R\.L\. \(Tesis de Grado, UTN-FRT\) \| Abr 2026 - Actualidad \| Desarrollo individual/);
        assert.match(extracted, /UTN-FRT \(Ingeniería de Software\) \| Oct 2025 - Dic 2025 \| Equipo de 3/);
        assert.match(extracted, /Municipalidad de Concepción y Rolling Code School \| Nov 2023 - Mar 2024 \| Equipo de 4/);
        assert.match(extracted, /Proyecto Personal \(Especificación Comercial Real\) \| Nov 2026 - Actualidad \| Desarrollo individual/);
        assert.match(extracted, /Flyway, Thymeleaf, HTMX,[\s\S]*JUnit 5/);
      }
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
  const dataDirectory = await mkdtemp(join(tmpdir(), 'cv-server-test-'));
  const app = await startServer({ port: 0, dataDirectory });
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
  } finally { await app.close(); await rm(dataDirectory, { recursive: true, force: true }); }
});

test('Panel: vista previa, opciones y descarga funcionan en conjunto', async () => {
  const dataDirectory = await mkdtemp(join(tmpdir(), 'cv-panel-test-'));
  const app = await startServer({ port: 0, dataDirectory });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    await page.goto(app.url);
    await page.locator('#download:not([disabled])').waitFor();
    assert.match(await page.locator('#page-count').textContent(), /2 páginas/);
    const first = page.locator('#projects input').first();
    await first.uncheck();
    await page.locator('#download:not([disabled])').waitFor();
    assert.match(await page.locator('#selection-count').textContent(), /4 \/ 5/);
    const slug = await first.inputValue();
    await page.selectOption('#locale', 'en');
    await page.locator('#download:not([disabled])').waitFor();
    assert.equal(await page.locator(`#projects input[value="${slug}"]`).isChecked(), false);
    assert.equal(await page.frameLocator('#preview').locator('.recognition').count(), 0);
    await page.check('#photo');
    const [file] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
    assert.equal(file.suggestedFilename(), 'CV-Mauro-Armas-en.pdf');
    assert.equal(await file.failure(), null);
  } finally { await browser.close(); await app.close(); await rm(dataDirectory, { recursive: true, force: true }); }
});
