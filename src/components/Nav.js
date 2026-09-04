'use client';

import Link from 'next/link';
import { getCvPath, getCvFileName } from '@/content/perfil';

// El ícono visible (sol/luna) lo decide el CSS a partir de html[data-theme], no de
// estado de React — así no hay mismatch de hidratación entre server y el tema ya
// aplicado por el script inline de layout.js antes del primer paint.
function ThemeSwitch({ label }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try {
      localStorage.setItem('ma-theme', next);
    } catch {
      // localStorage puede no estar disponible (modo privado, cuota llena); el toggle sigue funcionando en memoria.
    }
  }

  return (
    <button className="theme-sw" type="button" onClick={toggle} aria-label={label} title={label}>
      <svg className="moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7Z" />
      </svg>
      <svg className="sun" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
      </svg>
    </button>
  );
}

// Nav pública del portafolio (Home y casos de estudio). El panel de administración
// usa su propio header simple, no este componente (ver plan.md — evita acoplar US5 a US1).
//
// `basePath` y `search` llegan resueltos desde el Server Component padre (pathname,
// searchParams) en vez de leerse acá con hooks de navegación — evita forzar un boundary
// de Suspense en cada página que use <Nav> solo para preservar la query string al
// cambiar de idioma (RF-024).
export default function Nav({ lang, dict, basePath = '', search = '' }) {
  return (
    <nav className="p-nav wrap">
      <Link href={`/${lang}`} className="p-brand">Mauro Armas</Link>
      <div className="p-links">
        <a href="#sobre-mi">{dict.nav.sobreMi}</a>
        <a href="#formacion">{dict.nav.formacion}</a>
        <a href="#stack">{dict.nav.stack}</a>
        <a href="#proyectos">{dict.nav.proyectos}</a>
        <a href="#contacto">{dict.nav.contacto}</a>
      </div>
      <div className="lang">
        <Link href={`/es${basePath}${search}`} aria-current={lang === 'es' ? 'page' : undefined}>ES</Link>
        <span className="sep">/</span>
        <Link href={`/en${basePath}${search}`} aria-current={lang === 'en' ? 'page' : undefined}>EN</Link>
      </div>
      <ThemeSwitch label={dict.nav.cambiarTema} />
      <a className="btn-cv" href={getCvPath()} download={getCvFileName()}>
        <svg className="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
        </svg>
        {dict.nav.cv}
      </a>
    </nav>
  );
}
