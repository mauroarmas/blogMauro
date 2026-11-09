import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { InputError, loadContent } from './lib/content.mjs';
import { renderCv } from './lib/template.mjs';
import { generatePdf } from './lib/pdf.mjs';

const assets = new Map([
  ['/assets/studio.css', ['studio.css', 'text/css']],
  ['/assets/studio.js', ['studio.js', 'text/javascript']],
]);
const asset = name => readFile(new URL(`./assets/${name}`, import.meta.url), 'utf8');

function queryOptions(url) {
  return {
    locale: url.searchParams.get('locale') || 'es',
    photo: url.searchParams.get('photo') !== 'false',
    portfolioUrl: url.searchParams.get('portfolioUrl') || '',
    ...(url.searchParams.has('projects') ? { projects: url.searchParams.get('projects').split(',').filter(Boolean) } : {}),
  };
}
async function readJson(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new InputError('Se requiere JSON.');
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw new InputError('La solicitud es demasiado grande.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
  catch { throw new InputError('El JSON no es válido.'); }
}

export async function startServer({ port = 4317 } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Puerto inválido.');
  const token = randomBytes(32).toString('hex');
  let busy = false;
  let actualPort;
  const server = http.createServer(async (req, res) => {
    const hosts = [`127.0.0.1:${actualPort}`, `localhost:${actualPort}`];
    const origins = hosts.map(host => `http://${host}`);
    const send = (status, type, body) => { res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8` }); res.end(body); };
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src data:; connect-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'none'");
    if (!hosts.includes(req.headers.host) || (req.headers.origin && !origins.includes(req.headers.origin)) || req.headers['sec-fetch-site'] === 'cross-site') {
      send(403, 'text/plain', 'Este módulo solo admite acceso local desde su propio panel.'); return;
    }
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (req.method === 'GET' && url.pathname === '/') {
        send(200, 'text/html', (await asset('studio.html')).replace('__TOKEN__', token));
      } else if (req.method === 'GET' && assets.has(url.pathname)) {
        const [name, type] = assets.get(url.pathname); send(200, type, await asset(name));
      } else if (req.method === 'GET' && url.pathname === '/api/content') {
        const model = await loadContent({ locale: url.searchParams.get('locale') || 'es', photo: false });
        send(200, 'application/json', JSON.stringify({ name: model.profile.name, revision: model.revision, projects: model.allProjects.map(p => ({ slug: p.slug, name: (p.i18n[model.options.locale] || p.i18n.es).name })) }));
      } else if (req.method === 'GET' && url.pathname === '/preview') {
        send(200, 'text/html', await renderCv(await loadContent(queryOptions(url))));
      } else if (req.method === 'POST' && url.pathname === '/api/pdf') {
        const supplied = Buffer.from(String(req.headers['x-cv-token'] || ''));
        if (supplied.length !== token.length || !timingSafeEqual(supplied, Buffer.from(token))) {
          send(403, 'application/json', JSON.stringify({ error: 'Abrí el panel local para generar el PDF.' })); return;
        }
        const options = await readJson(req);
        if (busy) { send(409, 'application/json', JSON.stringify({ error: 'Hay un PDF en preparación. Esperá a que termine.' })); return; }
        busy = true;
        try {
          const result = await generatePdf(options);
          res.setHeader('Content-Disposition', `attachment; filename="CV-Mauro-Armas-${options.locale || 'es'}.pdf"`);
          res.setHeader('X-CV-Pages', result.pages);
          res.setHeader('X-CV-Revision', result.revision);
          res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Length': result.pdf.length }); res.end(result.pdf);
        } finally { busy = false; }
      } else { send(404, 'text/plain', 'No encontrado.'); }
    } catch (error) {
      if (!(error instanceof InputError)) console.error('[CV]', error);
      if (!res.headersSent) send(error instanceof InputError ? 400 : 500, 'application/json', JSON.stringify({ error: error.message }));
      else res.end();
    }
  });
  server.requestTimeout = 30000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  actualPort = server.address().port;
  return { server, url: `http://127.0.0.1:${actualPort}`, close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = await startServer({ port: Number(process.env.CV_PORT || 4317) });
  console.log(`\nCV Studio · privado y local\n${app.url}\n\nLee los datos del portafolio en cada vista previa y exportación.\nCtrl+C para cerrar.\n`);
}
