import { execFile } from 'node:child_process';
import { TextDecoder } from 'node:util';
import { restrictedEnvironment } from './config.mjs';
import { StudioError } from './errors.mjs';

const MAX_OUTPUT = 2 * 1024 * 1024;
function execute(program, args, input, timeout) {
  return new Promise((resolve, reject) => {
    const child = execFile(program, args, { encoding: 'buffer', timeout, maxBuffer: MAX_OUTPUT, env: restrictedEnvironment(), windowsHide: true }, (error, stdout) => {
      if (error) return reject(new StudioError('UNREADABLE_SOURCE', 'No se pudo leer el PDF. Podés pegar el texto de la oferta.', { status: 422 }));
      resolve(stdout);
    });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}
function decode(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new StudioError('UNREADABLE_SOURCE', 'El texto debe estar codificado en UTF-8.', { status: 422 }); }
}

export async function extractDocument(input, { type, kind = 'offer', timeoutMs = 30000 } = {}) {
  if (!(input instanceof Uint8Array) || !['offer','professional'].includes(kind)) throw new StudioError('INVALID_INPUT', 'Documento inválido.');
  const bytes = Buffer.from(input), maxBytes = (kind === 'offer' ? 10 : 25) * 1024 * 1024, maxPages = kind === 'offer' ? 50 : 100;
  if (bytes.length > maxBytes) throw new StudioError('INPUT_LIMIT', `El documento supera ${maxBytes / 1024 / 1024} MiB.`, { status: 413 });
  if (type === 'text/plain') {
    const original = decode(bytes);
    if (bytes.length > MAX_OUTPUT || (kind === 'offer' && original.length > 100000)) throw new StudioError('INPUT_LIMIT', 'El texto supera el límite permitido.', { status: 413 });
    if (!original.trim()) throw new StudioError('UNREADABLE_SOURCE', 'El texto está vacío.', { status: 422 });
    return { original, text: original.replace(/\r\n?/g,'\n'), pages: null, extractorVersion: 'utf8-v1' };
  }
  if (type !== 'application/pdf') throw new StudioError('INVALID_MEDIA_TYPE', 'Solo se admite texto UTF-8 o PDF.');
  const started = Date.now();
  const info = decode(await execute('pdfinfo',['-'],bytes,timeoutMs));
  const match = /^Pages:\s*(\d+)\s*$/mi.exec(info);
  if (!match || Number(match[1]) < 1) throw new StudioError('UNREADABLE_SOURCE','No se pudo determinar la cantidad de páginas.',{status:422});
  const pages = Number(match[1]);
  if (pages > maxPages) throw new StudioError('INPUT_LIMIT',`El PDF supera ${maxPages} páginas.`,{status:413});
  const remaining = timeoutMs - (Date.now() - started);
  if (remaining <= 0) throw new StudioError('UNREADABLE_SOURCE','La lectura del PDF superó el tiempo permitido.',{status:422});
  const text = decode(await execute('pdftotext',['-enc','UTF-8','-','-'],bytes,remaining)).replace(/\r\n?/g,'\n');
  if (!text.replace(/\f/g,'').trim()) throw new StudioError('UNREADABLE_SOURCE','El PDF no contiene texto legible; podés pegarlo manualmente.',{status:422});
  return { original: null, text, pages, extractorVersion: 'poppler-pdftotext-utf8' };
}
