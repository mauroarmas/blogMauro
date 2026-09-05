import { Suspense } from 'react';
import Image from 'next/image';
import Nav from '@/components/Nav';
import ProjectCard from '@/components/ProjectCard';
import ProjectFilter from '@/components/ProjectFilter';
import CopyButton from '@/components/CopyButton';
import { getPerfil, getCvPath, getCvFileName } from '@/content/perfil';
import { stack, STACK_LAYERS, featuredStack } from '@/content/stack';
import { formacion } from '@/content/formacion';
import { proyectos } from '@/content/proyectos';
import { hasPublishedCaseStudy, getContentBySlug } from '@/lib/content';
import { getDictionary, SUPPORTED_LOCALES } from './dictionaries';

function IconPin() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-7.58-7-12a7 7 0 1 1 14 0c0 4.42-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function IconCap() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 10.5v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M10 14a3.5 3.5 0 0 0 5 0l3.5-3.5a3.54 3.54 0 0 0-5-5L11.5 7" />
      <path d="M14 10a3.5 3.5 0 0 0-5 0L5.5 13.5a3.54 3.54 0 0 0 5 5L12.5 17" />
    </svg>
  );
}

function IconGh() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.4 9.4 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function IconIn() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.83v1.57h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21h-4V9.5Z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

function IconServer() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="6.5" rx="1.6" /><rect x="3" y="13.5" width="18" height="6.5" rx="1.6" />
      <path d="M6.5 7.25h.01M6.5 16.75h.01" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 2 5 13.5h5l-1.5 8.5L17 10.5h-5L13.5 2Z" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6 3.5 12 9 18M15 6l5.5 6L15 18" />
    </svg>
  );
}

function IconHex() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.6l8 4.7v9.4l-8 4.7-8-4.7V7.3l8-4.7Z" />
    </svg>
  );
}

function IconOrbit() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="2.2" /><ellipse cx="12" cy="12" rx="10" ry="4.3" />
      <ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(60 12 12)" />
    </svg>
  );
}

function IconWindow() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 20V9" />
    </svg>
  );
}

function IconDb() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <ellipse cx="12" cy="5.6" rx="7.5" ry="3" />
      <path d="M4.5 5.6v12.8c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V5.6" />
      <path d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" />
    </svg>
  );
}

function IconBraces() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 3.5C6 3.5 6.5 8 5 10.5c-.6 1-1 1.2-1.5 1.5.5.3.9.5 1.5 1.5 1.5 2.5 1 7 3.5 7M15.5 3.5c2.5 0 2 4.5 3.5 7 .6 1 1 1.2 1.5 1.5-.5.3-.9.5-1.5 1.5-1.5 2.5-1 7-3.5 7" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.8 21 7.4l-9 4.6-9-4.6 9-4.6Z" />
      <path d="m3 12.3 9 4.6 9-4.6M3 16.9l9 4.6 9-4.6" />
    </svg>
  );
}

function IconTerminal() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 7 4 4-4 4M12 15h7" />
    </svg>
  );
}

function IconCube() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.6 20.5 7v10L12 21.4 3.5 17V7L12 2.6Z" />
      <path d="M3.5 7 12 11.6 20.5 7M12 21.4V11.6" />
    </svg>
  );
}

function IconCloud() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 18.5h10.2a3.8 3.8 0 0 0 .4-7.58A5.7 5.7 0 0 0 6.7 9.6 4.45 4.45 0 0 0 7 18.5Z" />
    </svg>
  );
}

function IconNetwork() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="9" y="2.6" width="6" height="5" rx="1.2" /><rect x="2.6" y="16.4" width="6" height="5" rx="1.2" /><rect x="15.4" y="16.4" width="6" height="5" rx="1.2" />
      <path d="M12 7.6V12m0 0H5.6v4.4M12 12h6.4v4.4" />
    </svg>
  );
}

function IconLoop() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9M3.5 12a8.5 8.5 0 0 1 14.6-5.9" />
      <path d="M3.5 17.5V12H9M20.5 6.5V12H15" />
    </svg>
  );
}

function IconChip() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.8" />
      <path d="M10 2.8v3.7M14 2.8v3.7M10 17.5v3.7M14 17.5v3.7M2.8 10h3.7M2.8 14h3.7M17.5 10h3.7M17.5 14h3.7" />
    </svg>
  );
}

function IconPlug() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.5v5M15 2.5v5M6.5 7.5h11v3.5a5.5 5.5 0 0 1-11 0V7.5ZM12 16.5v5" />
    </svg>
  );
}

function IconNodes() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="5" cy="12" r="2.4" /><circle cx="19" cy="6.5" r="2.4" /><circle cx="19" cy="17.5" r="2.4" />
      <path d="m7.3 11 9.4-3.4M7.3 13l9.4 3.4" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5c0-1 .8-1.5 2-1.5h4.5a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H4V5.5Z" />
      <path d="M20 5.5c0-1-.8-1.5-2-1.5h-4.5a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5H20V5.5Z" />
    </svg>
  );
}

function IconCheckSquare() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

const FORMACION_ICON = {
  carrera: IconCap,
  bootcamp: IconBolt,
  curso: IconBook,
};

// Un ícono por tecnología (se reusa en los chips del Hero y en la sección Stack).
const TECH_ICON = {
  'Node.js · NestJS · Express': IconServer,
  'Python · FastAPI': IconBolt,
  'TypeScript': IconCode,
  'Java · Spring': IconHex,
  'React': IconOrbit,
  'Next.js': IconWindow,
  'Vite': IconBolt,
  'HTML5 · CSS3': IconCode,
  'PostgreSQL': IconDb,
  'MySQL': IconDb,
  'MongoDB': IconDb,
  'Redis': IconBolt,
  'ChromaDB (vectorial)': IconBraces,
  'Redes TCP/IP': IconNetwork,
  'Cisco Packet Tracer': IconNodes,
  'Linux (admin)': IconTerminal,
  'nginx · systemd': IconServer,
  'PLC · SCADA (nociones)': IconChip,
  'Proxmox VE · LXC': IconLayers,
  'Docker': IconCube,
  'AWS': IconCloud,
  'CI/CD · GitHub Actions': IconLoop,
  'n8n': IconNodes,
  'LangGraph · LangChain': IconLink,
  'RAG · LLM': IconBook,
  'Gemini API': IconPlug,
  'TensorFlow · Keras': IconChip,
  'Spec-Driven Development (SDD)': IconCode,
  'TOGAF ADM': IconLayers,
  'Gestión del conocimiento (modelo SECI)': IconBook,
  'Gestión de proyectos (PMBok)': IconCheckSquare,
  'Scrum · Jira': IconLoop,
  'Mejora continua (Kaizen)': IconBolt,
  'Testing automatizado': IconTerminal,
  'Git · GitHub': IconGh,
  'ERP / SAP (nociones)': IconCube,
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return {
    alternates: {
      canonical: `/${lang}`,
      languages: { es: '/es', en: '/en' },
    },
  };
}

export default async function Home({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const perfil = getPerfil(lang);
  const proyectosOrdenados = [...proyectos].sort((a, b) => a.priority - b.priority);

  // RF-017: el link "Caso de estudio" solo debe existir si de verdad hay contenido
  // publicado detrás. hasPublishedCaseStudy es síncrona (lee de archivos estáticos).
  const caseStudyFlags = proyectosOrdenados.map((p) =>
    p.hasCaseStudy ? hasPublishedCaseStudy(p.slug) : false
  );

  const proyectosConThumbnail = proyectosOrdenados.map((p, i) => {
    let thumb = p.thumbnail;
    if (caseStudyFlags[i] && !thumb) {
      const result = getContentBySlug(p.slug, { locale: lang, type: 'caso_estudio' });
      if (result.found && result.content.images && result.content.images.length > 0) {
        const firstImg = result.content.images.find(img => !img.url.includes('loom.com'));
        if (firstImg) {
          thumb = firstImg.url;
        }
      }
    }
    return { ...p, thumbnail: thumb };
  });

  const formacionPrincipal = formacion[0];
  const fpText = formacionPrincipal.i18n[lang] || formacionPrincipal.i18n.es;

  return (
    <div className="wrap">
      <Nav lang={lang} dict={dict} basePath="" search="" />

      <header className="p-hero">
        <aside className="ledger">
          <Image className="avatar" src="/profilePhoto.jpg" alt={perfil.name} width={190} height={230} />
          <div>
            <span className="k"><IconPin />{dict.ledger.ubicacion}</span>
            <span className="v">{perfil.location}</span>
          </div>
          <div>
            <span className="k"><IconCap />{dict.ledger.formacion}</span>
            <span className="v">{fpText.title}<br />{fpText.institution} · {fpText.statusLabel}</span>
          </div>
          <div>
            <span className="k"><IconLink />{dict.ledger.redes}</span>
            <span className="ledger-net">
              <a href={perfil.github} target="_blank" rel="noopener noreferrer"><IconGh />GitHub</a>
              <a href={perfil.linkedin} target="_blank" rel="noopener noreferrer"><IconIn />LinkedIn</a>
              <a href={`mailto:${perfil.email}`}><IconMail />Email</a>
            </span>
          </div>
        </aside>

        <div>
          <h1 className="p-name">{perfil.name.split(' ')[0]} <span className="last">{perfil.name.split(' ').slice(1).join(' ')}</span></h1>
          <p className="p-role">{perfil.role}</p>
          <p className="p-where">{perfil.location} · {perfil.mode}</p>

          <p className="thesis">{perfil.thesis}</p>
          <p className="p-lead">{perfil.lead}</p>

          <ul className="chips">
            {featuredStack.map((s) => {
              const ChipIcon = TECH_ICON[s.name];
              return (
                <li key={s.name}>
                  {ChipIcon && <ChipIcon />}
                  {s.name}
                </li>
              );
            })}
          </ul>

          <div className="cta">
            <a className="btn-a" href="#proyectos">{dict.hero.verProyectos}</a>
          </div>
        </div>
      </header>

      <section id="sobre-mi">
        <div className="section-head">
          <h2>{dict.sections.sobreMiTitle}</h2>
          <span className="l"></span>
        </div>
        <div className="about">
          <span className="aside-note" aria-hidden="true"></span>
          <p>{perfil.about}</p>
        </div>
      </section>

      <section id="formacion">
        <div className="section-head">
          <h2>{dict.sections.formacionTitle}</h2>
          <span className="l"></span>
        </div>
        <div className="edu">
          {formacion.map((f) => {
            const t = f.i18n[lang] || f.i18n.es;
            const TypeIcon = FORMACION_ICON[f.type];
            return (
              <div className="edu-row" key={t.title}>
                <div className="edu-main">
                  {TypeIcon && <TypeIcon />}
                  <h3 className="et">{t.title}</h3>
                  {t.statusLabel && <span className="edu-badge">{t.statusLabel}</span>}
                </div>
                <span className="ei">{t.institution}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section id="stack">
        <div className="section-head">
          <h2>{dict.sections.stackTitle}</h2>
          <span className="l"></span>
          <span className="c mono">{dict.sections.stackNote}</span>
        </div>
        <div className="stack-grid">
          {STACK_LAYERS.map((layer) => {
            const items = stack.filter((s) => s.layer === layer.key);
            if (items.length === 0) return null;
            return (
              <div className={`layer ${layer.key === 'metodo' ? 'layer-wide' : ''}`} key={layer.key}>
                <h3>{layer[lang] || layer.es}</h3>
                <ul>
                  {items.map((s) => {
                    const LayerIcon = TECH_ICON[s.name];
                    return (
                      <li key={s.name}>
                        {LayerIcon && <LayerIcon />}
                        {s.name}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section id="proyectos">
        <div className="section-head">
          <h2>{dict.sections.proyectosTitle}</h2>
          <span className="l"></span>
          <span className="c mono">{dict.sections.proyectosNote}</span>
        </div>

        <Suspense>
          <ProjectFilter projects={proyectosConThumbnail} initialArea={undefined} dict={dict}>
            {proyectosConThumbnail.map((project, i) => (
              <ProjectCard
                key={project.slug}
                project={project}
                lang={lang}
                index={i}
                hasCaseStudyContent={caseStudyFlags[i]}
                hidden={false}
                dict={dict}
              />
            ))}
          </ProjectFilter>
        </Suspense>
      </section>

      <section id="contacto">
        <div className="section-head">
          <h2>{dict.sections.contactoTitle}</h2>
          <span className="l"></span>
          <span className="c mono">{perfil.location}</span>
        </div>
        <div className="contact">
          <div>
            <div className="mailrow">
              <a className="mail" href={`mailto:${perfil.email}`}>{perfil.email}</a>
              <CopyButton text={perfil.email} labelIdle={dict.contact.copiar} labelDone={dict.contact.copiado} />
            </div>
            <p className="contact-note">{perfil.contactNote}</p>
          </div>
          <div className="links-list">
            <a href={perfil.linkedin} target="_blank" rel="noopener noreferrer"><span>LinkedIn</span><span className="lh">in/mauro-armas</span></a>
            <a href={perfil.github} target="_blank" rel="noopener noreferrer"><span>GitHub</span><span className="lh">mauroarmas</span></a>
            <a href={getCvPath()} download={getCvFileName()}><span>{dict.nav.cv}</span><span className="lh">PDF</span></a>
          </div>
        </div>
      </section>

      <footer className="foot">
        <span>© 2026 Mauro Armas</span>
        <span className="seg">
          <a href={`mailto:${perfil.email}`}>Email</a>
          <a href={perfil.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={perfil.github} target="_blank" rel="noopener noreferrer">GitHub</a>
        </span>
      </footer>
    </div>
  );
}
