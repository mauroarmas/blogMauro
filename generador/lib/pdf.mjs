import { chromium } from 'playwright';
import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { loadContent } from './content.mjs';
import { renderCv } from './template.mjs';

export async function generatePdf(options = {}) {
  return generatePdfFromModel(await loadContent(options));
}

/** Renderiza un modelo ya capturado, sin volver a leer el contenido del perfil. */
export async function generatePdfFromModel(model) {
  const html = await renderCv(model);
  const digest=value=>createHash('sha256').update(value).digest('hex');
  const style=/<style>([\s\S]*?)<\/style>/.exec(html)?.[1];
  const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(match=>!match[1].includes('cv-metadata'));
  if(!style||scripts.length!==1)throw new Error('No se pudo capturar la presentación del CV.');
  const presentationManifest={schemaVersion:1,htmlSha256:digest(html),stylesSha256:digest(style),paginationSha256:digest(scripts[0][2]),photoSha256:model.photo?digest(model.photo):null};
  let browser;
  const launchArgs = process.env.CHROMIUM_FLAGS
    ? process.env.CHROMIUM_FLAGS.split(' ')
    : ['--no-sandbox', '--disable-setuid-sandbox'];
  try { browser = await chromium.launch({ headless: true, args: launchArgs }); }
  catch (error) {
    if (error.message.includes('Executable doesn\'t exist')) throw new Error('Falta Chromium. Ejecutá npm run cv:install y volvé a generar.');
    throw error;
  }
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
    // El documento lleva foto y fuentes embebidas. Generar no necesita red.
    await page.route('**/*', route => route.abort());
    await page.emulateMedia({ media: 'print' });
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__CV_READY || window.__CV_ERROR, undefined, { timeout: 30000 });
    const result = await page.evaluate(() => ({ ...window.__CV_RESULT, error: window.__CV_ERROR }));
    if (result.error) throw new Error(result.error);
    const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
    return { pdf, html, presentationManifest, ...result, revision: model.revision };
  } finally { await browser.close(); }
}

export async function writeAtomic(path, bytes) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  try { await writeFile(temp, bytes); await rename(temp, path); }
  finally { await rm(temp, { force: true }); }
}
