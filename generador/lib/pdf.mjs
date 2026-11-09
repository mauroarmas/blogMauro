import { chromium } from 'playwright';
import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadContent } from './content.mjs';
import { renderCv } from './template.mjs';

export async function generatePdf(options = {}) {
  const model = await loadContent(options);
  const html = await renderCv(model);
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
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
    return { pdf, html, ...result, revision: model.revision };
  } finally { await browser.close(); }
}

export async function writeAtomic(path, bytes) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  try { await writeFile(temp, bytes); await rename(temp, path); }
  finally { await rm(temp, { force: true }); }
}
