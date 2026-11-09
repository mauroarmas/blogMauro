import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const LOCALES = ['es', 'en'];

export class InputError extends Error {}

export function normalizeOptions(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('Las opciones deben ser un objeto.');
  const locale = input.locale ?? 'es';
  if (!LOCALES.includes(locale)) throw new InputError('El idioma debe ser es o en.');
  if (input.projects !== undefined && (!Array.isArray(input.projects) || input.projects.some(s => typeof s !== 'string'))) {
    throw new InputError('La selección de proyectos no es válida.');
  }
  if (input.photo !== undefined && typeof input.photo !== 'boolean') throw new InputError('La opción de foto debe ser booleana.');
  let portfolioUrl = '';
  if (input.portfolioUrl) {
    let url;
    try { url = new URL(input.portfolioUrl); } catch { throw new InputError('Ingresá una URL completa del portafolio (https://...).'); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new InputError('La URL del portafolio debe ser HTTP(S), sin credenciales, parámetros ni fragmentos.');
    }
    portfolioUrl = url.href.replace(/\/$/, '');
  }
  return { locale, projects: input.projects, photo: input.photo ?? true, portfolioUrl };
}

// Los módulos de contenido son exports puros. La URL depende de sus bytes, no del
// caché de imports: editar el portafolio se refleja en la siguiente generación.
async function sourceModule(root, name, sources) {
  const content = await readFile(resolve(root, 'src/content', name), 'utf8');
  sources.push(content);
  return import(`data:text/javascript;base64,${Buffer.from(content).toString('base64')}`);
}

export async function loadContent(input = {}, { root = PROJECT_ROOT } = {}) {
  const options = normalizeOptions(input);
  const sources = [];
  const [profileModule, projectsModule, educationModule, skillsModule] = await Promise.all([
    sourceModule(root, 'perfil.js', sources), sourceModule(root, 'proyectos.js', sources),
    sourceModule(root, 'formacion.js', sources), sourceModule(root, 'stack.js', sources),
  ]);
  const profile = profileModule.getPerfil(options.locale);
  const allProjects = [...projectsModule.proyectos].sort((a, b) => a.priority - b.priority);
  const selected = options.projects ? new Set(options.projects) : null;
  if (selected && [...selected].some(slug => !allProjects.some(p => p.slug === slug))) {
    throw new InputError('Un proyecto seleccionado ya no existe. Actualizá la lista.');
  }
  const projects = allProjects.filter(p => !selected || selected.has(p.slug)).map(p => ({
    ...p, text: p.i18n[options.locale] || p.i18n.es,
  }));
  const education = educationModule.formacion.map(item => ({
    ...item, text: item.i18n[options.locale] || item.i18n.es,
  }));
  const skills = skillsModule.STACK_LAYERS.map(layer => ({
    key: layer.key,
    label: layer[options.locale] || layer.es,
    items: skillsModule.stack.filter(skill => skill.layer === layer.key).map(skill => skill.name),
  })).filter(group => group.items.length);
  const tokens = await readFile(resolve(root, 'src/styles/tokens.css'), 'utf8');
  sources.push(tokens);
  let photo = '';
  if (options.photo && profile.photo) {
    const publicRoot = resolve(root, 'public');
    const photoPath = resolve(publicRoot, '.' + profile.photo);
    if (!photoPath.startsWith(publicRoot + sep)) throw new InputError('La fotografía debe estar dentro de public.');
    const bytes = await readFile(photoPath);
    const ext = photoPath.split('.').pop().toLowerCase();
    const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext];
    if (!mime) throw new InputError('La foto debe ser JPG, PNG o WebP.');
    photo = `data:${mime};base64,${bytes.toString('base64')}`;
    sources.push(photo);
  }
  const revision = createHash('sha256').update([...sources].sort().join('\n')).digest('hex').slice(0, 12);
  return { options, profile, projects, allProjects, education, skills, tokens, photo, revision };
}
