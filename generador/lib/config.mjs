import { chmod, mkdir, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { PROJECT_ROOT } from './content.mjs';

const within = (parent, child) => { const part = relative(parent, child); return part === '' || (!part.startsWith('..') && !isAbsolute(part)); };

/** Datos privados: no se aceptan destinos debajo de public ni de la exportación. */
export async function privateDirectory({ root = PROJECT_ROOT, dataDirectory = resolve(root, '.cv-studio') } = {}) {
  const target = resolve(dataDirectory);
  for (const blocked of ['public', 'out', '.next']) {
    if (within(resolve(root, blocked), target)) throw new Error('La carpeta privada no puede estar dentro del sitio público.');
  }
  await mkdir(target, { recursive: true, mode: 0o700 });
  const actual = await realpath(target);
  for (const blocked of ['public', 'out', '.next']) {
    let actualBlocked;
    try { actualBlocked = await realpath(resolve(root, blocked)); } catch { continue; }
    if (within(actualBlocked, actual)) throw new Error('La carpeta privada apunta al sitio público.');
  }
  await chmod(actual, 0o700);
  return actual;
}

/** No heredar la clave del proveedor en procesos de extracción/render. */
export function restrictedEnvironment(env = process.env) {
  const allowed = ['PATH', 'LANG', 'LC_ALL', 'TMPDIR', 'SYSTEMROOT', 'WINDIR'];
  return Object.fromEntries(allowed.filter(key => env[key] !== undefined).map(key => [key, env[key]]));
}
