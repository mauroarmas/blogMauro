// Índice de casos de estudio estáticos.
// Reemplaza lib/content.js + lib/db.js para un build completamente estático.
// Para agregar un caso: crear el archivo .js en esta carpeta y registrarlo aquí.

import trimia from './trimia.js';
import nubePrivada from './nube-privada.js';
import portalOficiosConcepcion from './portal-oficios-concepcion.js';
import guardiaMedica from './guardia-medica.js';
import clasificacionAvesCnn from './clasificacion-aves-cnn.js';

const casos = [
  trimia,
  nubePrivada,
  portalOficiosConcepcion,
  guardiaMedica,
  clasificacionAvesCnn,
];

// Misma firma que lib/content.js getContentBySlug — los callers no cambian.
export function getContentBySlug(slug, { locale } = {}) {
  const exact = casos.find((c) => c.slug === slug && c.locale === locale);
  if (exact) {
    return { found: true, isFallback: false, locale, content: exact };
  }
  // Fallback: cualquier locale disponible para ese slug
  const fallback = casos.find((c) => c.slug === slug);
  if (fallback) {
    return {
      found: true,
      isFallback: true,
      requestedLocale: locale,
      availableLocale: fallback.locale,
      content: fallback,
    };
  }
  return { found: false };
}

// Misma firma que lib/content.js hasPublishedCaseStudy — síncrona ahora.
export function hasPublishedCaseStudy(slug) {
  return casos.some((c) => c.project_slug === slug);
}

// Lista completa publicada, sin body (payload liviano, igual que la API anterior).
export function getPublishedContent({ locale, type } = {}) {
  return casos
    .filter((c) => !locale || c.locale === locale)
    .map(({ body: _body, ...rest }) => rest);
}
