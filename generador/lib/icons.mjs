// El mismo lenguaje de trazos y motivos que los iconos del portafolio.
const paths = {
  mail: '<rect x="2.8" y="5" width="18.4" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z"/>',
  pin: '<path d="M12 21s-7-7.58-7-12a7 7 0 1 1 14 0c0 4.42-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  cap: '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  book: '<path d="M4 5.5c0-1 .8-1.5 2-1.5h4.5a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H4V5.5Z"/><path d="M20 5.5c0-1-.8-1.5-2-1.5h-4.5a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5H20V5.5Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  link: '<path d="M10 14a3.5 3.5 0 0 0 5 0l3.5-3.5a3.54 3.54 0 0 0-5-5L11.5 7M14 10a3.5 3.5 0 0 0-5 0L5.5 13.5a3.54 3.54 0 0 0 5 5L12.5 17"/>',
  linkedin: '<path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.83v1.57h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21h-4V9.5Z"/>',
  github: '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.4 9.4 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>',
  backend: '<rect x="3" y="4" width="18" height="6.5" rx="1.6"/><rect x="3" y="13.5" width="18" height="6.5" rx="1.6"/><path d="M6.5 7.25h.01M6.5 16.75h.01"/>',
  frontend: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 20V9"/>',
  datos: '<ellipse cx="12" cy="5.6" rx="7.5" ry="3"/><path d="M4.5 5.6v12.8c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V5.6M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3"/>',
  redes: '<rect x="9" y="2.6" width="6" height="5" rx="1.2"/><rect x="2.6" y="16.4" width="6" height="5" rx="1.2"/><rect x="15.4" y="16.4" width="6" height="5" rx="1.2"/><path d="M12 7.6V12m0 0H5.6v4.4M12 12h6.4v4.4"/>',
  cloud: '<path d="M7 18.5h10.2a3.8 3.8 0 0 0 .4-7.58A5.7 5.7 0 0 0 6.7 9.6 4.45 4.45 0 0 0 7 18.5Z"/>',
  ia: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.8"/><path d="M10 2.8v3.7M14 2.8v3.7M10 17.5v3.7M14 17.5v3.7M2.8 10h3.7M2.8 14h3.7M17.5 10h3.7M17.5 14h3.7"/>',
  metodo: '<path d="M12 2.8 21 7.4l-9 4.6-9-4.6 9-4.6Zm-9 9.5 9 4.6 9-4.6M3 16.9l9 4.6 9-4.6"/>',
};

export function icon(name) {
  if (!paths[name]) return '';
  const solid = ['github', 'linkedin'].includes(name);
  return `<svg class="side-icon" width="12" height="12" viewBox="0 0 24 24" fill="${solid ? 'currentColor' : 'none'}" stroke="${solid ? 'none' : 'currentColor'}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}
