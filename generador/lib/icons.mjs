// El mismo lenguaje de trazos y motivos que los iconos del portafolio.
const paths = {
  mail: '<rect x="2.8" y="5" width="18.4" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z"/>',
  pin: '<path d="M12 21s-7-7.58-7-12a7 7 0 1 1 14 0c0 4.42-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  cap: '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  book: '<path d="M4 5.5c0-1 .8-1.5 2-1.5h4.5a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H4V5.5Z"/><path d="M20 5.5c0-1-.8-1.5-2-1.5h-4.5a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5H20V5.5Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  link: '<path d="M10 14a3.5 3.5 0 0 0 5 0l3.5-3.5a3.54 3.54 0 0 0-5-5L11.5 7M14 10a3.5 3.5 0 0 0-5 0L5.5 13.5a3.54 3.54 0 0 0 5 5L12.5 17"/>',
  linkedin: '<circle cx="9" cy="7" r="3.5"/><path d="M3 19.5c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5"/><circle cx="18" cy="8.5" r="2.5"/><path d="M16.5 14.2c2.5.4 4.5 2.3 4.5 4.8"/>',
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
  const solid = ['github'].includes(name);
  return `<svg class="side-icon" width="12" height="12" viewBox="0 0 24 24" fill="${solid ? 'currentColor' : 'none'}" stroke="${solid ? 'none' : 'currentColor'}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

const digitPaths = {
  '0': 'M2.5 2h3a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 5.5 10h-3A1.5 1.5 0 0 1 1 8.5v-5A1.5 1.5 0 0 1 2.5 2Zm1.5 2.5v3',
  '1': 'M2 3.5 4 2v8M2 10h4',
  '2': 'M1.5 3.8A1.8 1.8 0 0 1 3.3 2h1.4a1.8 1.8 0 0 1 1.8 1.8c0 1-.5 1.7-1.4 2.4L1.5 9.2V10h5',
  '3': 'M1.5 2.5h4.5L3.5 5.5h1.2a1.8 1.8 0 0 1 1.8 1.8v.9A1.8 1.8 0 0 1 4.7 10H1.8',
  '4': 'M4.8 10V2L1.2 7.2h5.3',
  '5': 'M6 2H1.8v3.5h2.7a1.8 1.8 0 0 1 1.8 1.8v.9A1.8 1.8 0 0 1 4.5 10H1.5',
  '6': 'M5.5 2H3a1.8 1.8 0 0 0-1.8 1.8v4.4A1.8 1.8 0 0 0 3 10h1.7a1.8 1.8 0 0 0 1.8-1.8v-.7a1.8 1.8 0 0 0-1.8-1.8H1.2',
  '7': 'M1.2 2h5.2L2.8 10',
  '8': 'M2.8 2h2.4a1.4 1.4 0 0 1 0 2.8H2.8a1.4 1.4 0 0 1 0-2.8Zm0 3.8h2.4a1.6 1.6 0 0 1 0 3.2H2.8a1.6 1.6 0 0 1 0-3.2Z',
  '9': 'M6.2 6.2H3a1.8 1.8 0 0 1-1.8-1.8v-.6A1.8 1.8 0 0 1 3 2h1.4a1.8 1.8 0 0 1 1.8 1.8v4.4A1.8 1.8 0 0 1 4.4 10H2',
};

export function numberIcon(n) {
  const digits = String(n).padStart(2, '0').split('');
  const content = digits.map((d, i) => `<g transform="translate(${i * 8}, 0)"><path d="${digitPaths[d] || digitPaths['0']}"/></g>`).join('');
  return `<svg class="project-number" width="16" height="11" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;
}
