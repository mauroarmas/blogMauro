// Datos estructurados de Proyecto (data-model.md §2). Editar este archivo y desplegar
// es la vía prevista para sumar o actualizar un proyecto (research.md §4).
//
// El CV (public/cv) fue la referencia inicial. Las fichas web se actualizan con las
// fuentes de cada proyecto; el PDF descargable conserva su propia edición.
//
// NOTA: las URLs de "repositorio" apuntan al perfil público de GitHub del dueño porque
// no se dispone todavía del slug exacto del repo de cada proyecto. Reemplazar por la URL
// directa de cada repositorio (https://github.com/mauroarmas/<repo>) en cuanto se confirme
// — no se fabrica una ruta específica sin verificarla (Principio II de la constitución).

export const proyectos = [
  {
    slug: 'trimia',
    areas: ['ia', 'desarrollo'],
    priority: 2,
    status: 'en_curso',
    period: { start: '2026-04', end: null },
    role: { mode: 'individual', teamSize: null },
    hasCaseStudy: true,
    thumbnail: '/assets/trimIA/trimia-supervision.webp',
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
      { type: 'informe', url: null, available: false },
      { type: 'demo', url: 'https://trimia-demo.tail9126e1.ts.net/', available: true },
    ],
    stack: ['NestJS · TypeScript', 'React', 'LangGraph · LLM', 'ChromaDB · RAG', 'PostgreSQL · Prisma', 'BullMQ · Redis', 'n8n · WhatsApp', 'Docker · Tailscale'],
    i18n: {
      es: {
        name: 'TrimIA — Plataforma multiagente de IA para procesos de negocio',
        context: 'Credimisión S.R.L. · Tesis de grado, UTN-FRT',
        problem:
          'Diseñé y desarrollé un ecosistema multiagente con IA generativa y RAG para centralizar la atención por WhatsApp, la venta financiada y la capacitación interna. Orquesta cinco agentes especializados en LangGraph junto a un panel web de supervisión en tiempo real, escalamiento humano y validación comercial automatizada.',
      },
      en: {
        name: 'TrimIA — Multi-agent AI platform for business processes',
        context: 'Credimisión S.R.L. · Degree thesis, UTN-FRT',
        problem:
          'Designed and built a generative AI and RAG multi-agent ecosystem to centralize WhatsApp customer support, financed sales, and internal training. Orchestrates five specialized LangGraph agents alongside a real-time web supervision dashboard, human-in-the-loop escalation, and automated commercial validation.',
      },
    },
  },
  {
    slug: 'nube-privada',
    areas: ['infraestructura', 'desarrollo'],
    priority: 1,
    status: 'finalizado',
    period: { start: '2026-09', end: '2026-11' },
    role: { mode: 'equipo', teamSize: 3 },
    hasCaseStudy: true,
    thumbnail: '/assets/NAP/NAP-1.png',
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
      { type: 'informe', url: encodeURI('/assets/NAP/PPS NAP — Informe Final _ Versión equilibrada — Mauro Armas.pdf'), available: true },
      { type: 'demo', url: null, available: false },
    ],
    stack: ['Python · FastAPI', 'React · Vite', 'PostgreSQL', 'Proxmox VE · LXC', 'Docker · OCI', 'TrueNAS · SDN', 'HTTPS · SSH · TLS'],
    i18n: {
      es: {
        name: 'NAP — Nube Académica Práctica para la UTN-FRT',
        context: 'UTN-FRT · Práctica supervisada',
        recognition: 'Trabajo aceptado en CONAIISI 2026',
        deliveryStatus: 'Validado en laboratorio · despliegue institucional pendiente',
        problem:
          'Diseñé y desarrollé una plataforma de nube privada que transforma un clúster Proxmox VE en servicios IaaS, PaaS y SaaS bajo demanda para las cátedras universitarias. Automatiza el ciclo completo de solicitud, aprobación, reserva de recursos, aprovisionamiento aislado (LXC/OCI) y acceso seguro, respaldado por más de 900 pruebas automatizadas.',
      },
      en: {
        name: 'NAP — Academic private cloud for UTN-FRT',
        context: 'UTN-FRT · Supervised practicum',
        recognition: 'Paper accepted at CONAIISI 2026',
        deliveryStatus: 'Lab validated · institutional deployment pending',
        problem:
          'Designed and built a private cloud platform that turns a Proxmox VE cluster into on-demand IaaS, PaaS, and SaaS services for university courses. Automates the full lifecycle of requests, approval, resource reservation, isolated provisioning (LXC/OCI), and secure access, backed by over 900 automated tests.',
      },
    },
  },
  {
    slug: 'guardia-medica',
    areas: ['desarrollo'],
    priority: 3,
    status: 'finalizado',
    period: { start: '2025-10', end: '2025-12' },
    role: { mode: 'equipo', teamSize: 3 },
    hasCaseStudy: true,
    thumbnail: '/assets/guardia/guardia-2.png',
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
    ],
    stack: ['NestJS · TypeScript', 'React · Vite', 'MySQL 8', 'Docker', 'Cucumber BDD'],
    i18n: {
      es: {
        name: 'Guardia Médica — Sistema de triaje para urgencias',
        context: 'UTN-FRT · Ingeniería de Software',
        problem:
          'Desarrollé el sistema de admisión y triaje hospitalario que prioriza pacientes por criticidad clínica y tiempo de espera (5 niveles) con desempate FIFO. Implementé arquitectura limpia en 4 capas con NestJS, validación estricta de signos vitales en el dominio, autenticación JWT/Argon2 y pruebas BDD automatizadas con Cucumber en CI.',
      },
      en: {
        name: 'Guardia Médica — ER triage system',
        context: 'UTN-FRT · Software Engineering',
        problem:
          'Built a hospital admission and triage system that prioritizes patients by clinical severity and wait time (5 levels) with FIFO tie-breaking. Implemented a 4-layer clean architecture in NestJS, strict domain validation of vital signs, JWT/Argon2 authentication, and automated Cucumber BDD tests in CI.',
      },
    },
  },
  {
    slug: 'portal-oficios-concepcion',
    areas: ['desarrollo'],
    priority: 4,
    status: 'finalizado',
    period: { start: '2023-11', end: '2024-03' },
    role: { mode: 'equipo', teamSize: 4 },
    hasCaseStudy: true,
    thumbnail: '/assets/portalOficios/portal-1.png',
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
    ],
    stack: ['React · Vite', 'Express', 'MongoDB · Mongoose', 'Cloudinary', 'JWT'],
    i18n: {
      es: {
        name: 'Portal de Oficios Concepción',
        context: 'Municipalidad de Concepción · Rolling Code School',
        problem:
          'Desarrollé la plataforma web municipal para conectar vecinos con trabajadores de oficios verificados. Implementé el flujo de moderación y alta administrativa, autenticación JWT, gestión de perfiles profesionales en Express y React, almacenamiento de legajos en Cloudinary y sistema de reputación por reseñas.',
      },
      en: {
        name: 'Portal de Oficios Concepción',
        context: 'Municipality of Concepción · Rolling Code School',
        problem:
          'Built the municipal web platform connecting residents with verified skilled tradespeople. Implemented the administrative moderation and onboarding workflow, JWT authentication, professional profile management in Express and React, document storage in Cloudinary, and a community review rating system.',
      },
    },
  },
];

export function getProyectoBySlug(slug) {
  return proyectos.find((p) => p.slug === slug) || null;
}
