// Módulo plano (sin 'use client') para que tanto Server Components (page.js) como
// Client Components (ProjectFilter) compartan la misma normalización de área sin
// cruzar el boundary cliente/servidor — un export de un archivo 'use client' no puede
// invocarse directamente desde el servidor. Las etiquetas visibles viven en los
// diccionarios de idioma (dict.filters), no acá.
export const AREA_KEYS = ['todos', 'desarrollo', 'infraestructura'];

export function normalizeArea(value) {
  return AREA_KEYS.includes(value) ? value : 'todos';
}
