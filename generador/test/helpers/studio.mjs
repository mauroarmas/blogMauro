import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/** Cada prueba obtiene datos aislados; nunca se toma el directorio de uso diario. */
export async function temporaryStudio(t) {
  const directory = await mkdtemp(join(tmpdir(), 'cv-studio-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { directory, databasePath: join(directory, 'studio.sqlite') };
}

/** Proveedor inyectable: sin clave y sin posibilidad de hacer una llamada de red. */
export function fixtureProvider(responses = []) {
  let index = 0;
  return {
    calls: [],
    async generate(request) {
      this.calls.push(structuredClone(request));
      if (index >= responses.length) throw new Error('No hay respuesta de prueba disponible.');
      const response = responses[index++];
      if (response instanceof Error) throw response;
      return structuredClone(response);
    },
  };
}

/** Bloquea fetch global durante pruebas que usan transporte simulado. */
export function denyExternalFetch(t) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('La prueba intentó acceder a la red.'); };
  t.after(() => { globalThis.fetch = original; });
}
