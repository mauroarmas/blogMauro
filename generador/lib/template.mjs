import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PROJECT_ROOT } from './content.mjs';
import { icon } from './icons.mjs';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const text = escapeHtml;
const printText = value => text(String(value ?? '').replace(/[–—‑]/g, '-'));
function href(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? text(url.href) : '';
  } catch { return ''; }
}
const link = (url, label) => href(url) ? `<a href="${href(url)}">${text(label)}</a>` : text(label);

const COPY = {
  es: { about: 'Perfil', projects: 'Proyectos de ingeniería', contact: 'Contacto', education: 'Formación', courses: 'Certificaciones', skills: 'Competencias técnicas', languages: 'Idiomas', now: 'Actualidad', role: 'Rol', solo: 'Desarrollo individual', team: 'Equipo de {n}', report: 'Informe', demo: 'Demo', case: 'Caso de estudio', page: 'Página', continued: 'Trayectoria y competencias', stack: 'Tecnologías' },
  en: { about: 'Profile', projects: 'Engineering projects', contact: 'Contact', education: 'Education', courses: 'Certifications', skills: 'Technical skills', languages: 'Languages', now: 'Present', role: 'Role', solo: 'Individual development', team: 'Team of {n}', report: 'Report', demo: 'Demo', case: 'Case study', page: 'Page', continued: 'Experience and skills', stack: 'Technologies' },
};

function period(value, locale, copy) {
  if (!value?.start) return '';
  const format = date => new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}-01T12:00:00Z`));
  return `${format(value.start)} - ${value.end ? format(value.end) : copy.now}`;
}

let fontCss;
async function fonts() {
  if (!fontCss) {
    const families = [
      ['Newsreader', 'newsreader', '200 800'], ['Hanken Grotesk', 'hanken-grotesk', '100 900'], ['JetBrains Mono', 'jetbrains-mono', '100 800'],
    ];
    fontCss = (await Promise.all(families.map(async ([family, slug, weight]) => {
      const bytes = await readFile(resolve(PROJECT_ROOT, `node_modules/@fontsource-variable/${slug}/files/${slug}-latin-wght-normal.woff2`));
      return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2')}`;
    }))).join('\n');
  }
  return fontCss;
}

function projectBlock(project, model, copy, index) {
  const { options } = model;
  const p = project.text;
  const team = project.role.mode === 'individual' ? copy.solo : copy.team.replace('{n}', project.role.teamSize || '');
  const links = project.verification.filter(item => item.available && ['demo', 'informe'].includes(item.type)).flatMap(item => {
    const url = item.url?.startsWith('/') ? (options.portfolioUrl ? options.portfolioUrl + item.url : '') : item.url;
    return url ? [link(url, item.type === 'demo' ? copy.demo : copy.report)] : [];
  });
  if (options.portfolioUrl && project.hasCaseStudy) links.push(link(`${options.portfolioUrl}/${options.locale}/proyectos/${project.slug}`, copy.case));
  return `<article class="cv-block project" data-label="${text(p.name)}">
    ${index === 0 ? `<h2 class="section-label">${copy.projects}</h2>` : ''}
    <div class="project-heading"><span class="project-number">${String(index + 1).padStart(2, '0')}</span><h3>${printText(p.name)}</h3></div>
    ${p.recognition ? `<p class="recognition">${text(p.recognition)}</p>` : ''}
    <p class="project-context">${printText(p.context)}</p>
    <p class="project-meta">${printText(period(project.period, options.locale, copy))} <span>· ${text(team)}</span></p>
    <p class="project-description">${text(p.problem)}</p>
    <p class="project-stack"><strong>${copy.stack}</strong> ${printText(project.stack.join(' · '))}</p>
    ${p.deliveryStatus ? `<p class="project-status">${text(p.deliveryStatus)}</p>` : ''}
    ${links.length ? `<p class="project-links">${links.join('<span aria-hidden="true"> · </span>')}</p>` : ''}
  </article>`;
}

export async function renderCv(model) {
  const { profile, options } = model;
  const copy = COPY[options.locale];
  const [css, pagination, embeddedFonts] = await Promise.all([
    readFile(new URL('../assets/cv.css', import.meta.url), 'utf8'),
    readFile(new URL('../assets/paginate.js', import.meta.url), 'utf8'), fonts(),
  ]);
  const education = model.education.filter(item => item.type !== 'curso');
  const courses = model.education.filter(item => item.type === 'curso');
  const educationBlock = (item, index, label, symbol) => `<section class="cv-block side-entry" data-label="${text(item.text.title)}">
    ${index === 0 ? `<h2 class="side-label with-icon">${icon(symbol)}<span>${label}</span></h2>` : ''}
    <h3>${text(item.text.title)}</h3><p>${printText(item.text.institution)}</p>
    ${item.text.statusLabel ? `<p class="side-detail">${text(item.text.statusLabel)}</p>` : ''}
    ${item.period?.start ? `<p class="side-detail">${printText(period(item.period, options.locale, copy))}</p>` : ''}
  </section>`;
  const contacts = [
    ['mail', link(`mailto:${profile.email}`, profile.email)],
    ...(profile.phone ? [['phone', link(`tel:${profile.phone.replace(/[^+\d]/g, '')}`, profile.phone)]] : []),
    ['pin', text(profile.location)], ['frontend', text(profile.mode)],
    ['linkedin', link(profile.linkedin, profile.linkedin.replace(/^https?:\/\//, '').replace(/\/$/, ''))],
    ['github', link(profile.github, profile.github.replace(/^https?:\/\//, ''))],
    ...(options.portfolioUrl ? [['link', link(options.portfolioUrl, options.portfolioUrl.replace(/^https?:\/\//, ''))]] : []),
  ];
  const metadata = JSON.stringify({ name: profile.name, role: profile.role, page: copy.page, continued: copy.continued, revision: model.revision }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="${options.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${text(profile.name)} - CV</title>
  <style>${embeddedFonts}\n${model.tokens}\n${css}</style></head><body>
  <template id="main-source">
    <section class="cv-block biography" data-label="${copy.about}"><h2 class="section-label">${copy.about}</h2><p>${text(profile.about)}</p></section>
    ${model.projects.map((p, i) => projectBlock(p, model, copy, i)).join('')}
  </template>
  <template id="side-source">
    ${model.photo ? `<div class="cv-block portrait-block" data-label="Foto"><img class="portrait" src="${model.photo}" alt="${text(profile.name)}" width="300" height="300"></div>` : ''}
    <section class="cv-block contact-block" data-label="${copy.contact}"><h2 class="side-label">${copy.contact}</h2>${contacts.map(([symbol, content]) => `<p class="contact-row">${icon(symbol)}<span>${content}</span></p>`).join('')}</section>
    ${education.map((item, i) => educationBlock(item, i, copy.education, 'cap')).join('')}
    ${model.skills.map((group, i) => `<section class="cv-block skill-group" data-label="${text(group.label)}">${i === 0 ? `<h2 class="side-label">${copy.skills}</h2>` : ''}<h3 class="with-icon">${icon(group.key)}<span>${text(group.label)}</span></h3><p>${printText(group.items.join(' · '))}</p></section>`).join('')}
    ${courses.map((item, i) => educationBlock(item, i, copy.courses, 'book')).join('')}
    ${profile.languages?.length ? `<section class="cv-block" data-label="${copy.languages}"><h2 class="side-label with-icon">${icon('globe')}<span>${copy.languages}</span></h2>${profile.languages.map(item => `<p>${text(item)}</p>`).join('')}</section>` : ''}
  </template>
  <template id="first-header"><header class="cv-header"><p class="eyebrow">${text(profile.location)} <span>· ${text(profile.mode)}</span></p><h1>${text(profile.fullName || profile.name)}</h1><p class="cv-role">${text(profile.role)}</p><p class="cv-lead">${text(profile.lead)}</p></header></template>
  <div id="pages" class="pages"></div><p id="layout-error" role="alert" hidden></p>
  <script id="cv-metadata" type="application/json">${metadata}</script><script>${pagination}</script></body></html>`;
}
