import { StudioError } from '../errors.mjs';
export function getProvider(id, providers) {
  if (id!=='gemini'||!providers?.gemini) throw new StudioError('AI_CONFIGURATION_REQUIRED','El proveedor no está configurado.',{status:409});
  return providers.gemini;
}
