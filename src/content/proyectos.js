// Datos estructurados de Proyecto (data-model.md §2). Editar este archivo y desplegar
// es la vía prevista para sumar o actualizar un proyecto (research.md §4).
//
// El CV (public/cv) fue la referencia inicial. Las fichas web se actualizan con las
// fuentes de cada proyecto; el PDF descargable conserva su propia edición.
//
// NOTA: algunas URLs de "repositorio" apuntan al perfil público de GitHub del dueño porque
// no se dispone todavía del slug exacto de esos repositorios. Reemplazar por la URL
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
    stack: ['NestJS', 'TypeScript', 'React', 'LangGraph', 'LLMs', 'ChromaDB', 'RAG', 'PostgreSQL', 'Prisma', 'BullMQ', 'Redis', 'n8n', 'WhatsApp API', 'Docker', 'Tailscale'],
    i18n: {
      es: {
        name: 'TrimIA - Plataforma Multiagente de IA para Procesos de Negocio | Ingeniero de IA y Full-Stack',
        context: 'Credimisión S.R.L. (Tesis de Grado, UTN-FRT)',
        bullets: [
          'Diseñé y orquesté un ecosistema multiagente con IA generativa y RAG utilizando LangGraph, NestJS y ChromaDB para centralizar la atención por WhatsApp, el asesoramiento de venta financiada y la capacitación interna.',
          'Construí un panel de supervisión en React en tiempo real con escalamiento humano (human-in-the-loop), validación comercial automatizada y colas de tareas asíncronas con BullMQ, Redis y n8n.',
        ],
        problem:
          'Diseñé y orquesté un ecosistema multiagente con IA generativa y RAG utilizando LangGraph, NestJS y ChromaDB para centralizar la atención por WhatsApp, el asesoramiento de venta financiada y la capacitación interna. Construí un panel de supervisión en React en tiempo real con escalamiento humano (human-in-the-loop), validación comercial automatizada y colas de tareas asíncronas con BullMQ, Redis y n8n.',
      },
      en: {
        name: 'TrimIA - Multi-Agent AI Platform for Business Processes | AI & Full-Stack Engineer',
        context: 'Credimisión S.R.L. (Degree Thesis, UTN-FRT)',
        bullets: [
          'Designed and orchestrated a generative AI and RAG multi-agent ecosystem using LangGraph, NestJS, and ChromaDB to centralize WhatsApp customer support, financed sales advising, and internal training.',
          'Built a real-time React supervision dashboard featuring human-in-the-loop escalation, automated commercial validation, and asynchronous task queues with BullMQ, Redis, and n8n.',
        ],
        problem:
          'Designed and orchestrated a generative AI and RAG multi-agent ecosystem using LangGraph, NestJS, and ChromaDB to centralize WhatsApp customer support, financed sales advising, and internal training. Built a real-time React supervision dashboard featuring human-in-the-loop escalation, automated commercial validation, and asynchronous task queues with BullMQ, Redis, and n8n.',
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
    stack: ['Python', 'FastAPI', 'React', 'Vite', 'PostgreSQL', 'Proxmox VE', 'LXC', 'Docker', 'OCI', 'TrueNAS', 'SDN', 'HTTPS', 'SSH', 'TLS'],
    i18n: {
      es: {
        name: 'NAP - Plataforma de Nube Privada Académica | Ingeniero de Infraestructura Cloud y Backend',
        context: 'UTN-FRT (Práctica Supervisada)',
        recognition: 'Aprobado en CONAIISI 2026',
        deliveryStatus: 'Validado en laboratorio · despliegue institucional pendiente',
        bullets: [
          'Diseñé la arquitectura de una plataforma de nube privada bajo demanda que transforma un clúster Proxmox VE y TrueNAS en servicios IaaS, PaaS y SaaS automatizados para cátedras universitarias.',
          'Desarrollé el ciclo completo de aprobación de solicitudes, reserva de recursos y aprovisionamiento aislado de contenedores (LXC/Docker/OCI) con Python, FastAPI y React, asegurado mediante SDN/TLS y validado por más de 900 pruebas automatizadas.',
        ],
        problem:
          'Diseñé la arquitectura de una plataforma de nube privada bajo demanda que transforma un clúster Proxmox VE y TrueNAS en servicios IaaS, PaaS y SaaS automatizados para cátedras universitarias. Desarrollé el ciclo completo de aprobación de solicitudes, reserva de recursos y aprovisionamiento aislado de contenedores (LXC/Docker/OCI) con Python, FastAPI y React, asegurado mediante SDN/TLS y validado por más de 900 pruebas automatizadas.',
      },
      en: {
        name: 'NAP - Academic Private Cloud Platform | Cloud Infrastructure & Backend Engineer',
        context: 'UTN-FRT (Supervised Practicum)',
        recognition: 'Paper Accepted at CONAIISI 2026',
        deliveryStatus: 'Lab validated · institutional deployment pending',
        bullets: [
          'Architected an on-demand private cloud platform turning a Proxmox VE and TrueNAS cluster into automated IaaS, PaaS, and SaaS services for university courses.',
          'Engineered the full lifecycle of request approval, resource reservation, and isolated container provisioning (LXC/Docker/OCI) using Python, FastAPI, and React, secured via SDN/TLS and validated by 900+ automated tests.',
        ],
        problem:
          'Architected an on-demand private cloud platform turning a Proxmox VE and TrueNAS cluster into automated IaaS, PaaS, and SaaS services for university courses. Engineered the full lifecycle of request approval, resource reservation, and isolated container provisioning (LXC/Docker/OCI) using Python, FastAPI, and React, secured via SDN/TLS and validated by 900+ automated tests.',
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
    stack: ['NestJS', 'TypeScript', 'React', 'Vite', 'MySQL 8', 'Docker', 'Cucumber BDD', 'JWT', 'Argon2'],
    i18n: {
      es: {
        name: 'Guardia Médica - Sistema de Triaje Clínico de Urgencias | Desarrollador Backend y QA Automation',
        context: 'UTN-FRT (Ingeniería de Software)',
        bullets: [
          'Construí una plataforma de admisión y triaje hospitalario que prioriza dinámicamente a los pacientes según 5 niveles de criticidad clínica y tiempo de espera con desempate FIFO determinista.',
          'Implementé una Arquitectura Limpia en 4 capas con NestJS, validación estricta de signos vitales en el dominio, autenticación JWT/Argon2 y suites de pruebas BDD automatizadas con Cucumber en CI.',
        ],
        problem:
          'Construí una plataforma de admisión y triaje hospitalario que prioriza dinámicamente a los pacientes según 5 niveles de criticidad clínica y tiempo de espera con desempate FIFO determinista. Implementé una Arquitectura Limpia en 4 capas con NestJS, validación estricta de signos vitales en el dominio, autenticación JWT/Argon2 y suites de pruebas BDD automatizadas con Cucumber en CI.',
      },
      en: {
        name: 'Guardia Médica - ER Clinical Triage System | Backend & QA Automation Developer',
        context: 'UTN-FRT (Software Engineering)',
        bullets: [
          'Built a hospital admission and triage platform that dynamically prioritizes patients across 5 clinical severity levels and wait times with deterministic FIFO tie-breaking.',
          'Implemented a 4-layer Clean Architecture in NestJS with strict vital-sign domain validation, JWT/Argon2 authentication, and automated Cucumber BDD test suites in CI.',
        ],
        problem:
          'Built a hospital admission and triage platform that dynamically prioritizes patients across 5 clinical severity levels and wait times with deterministic FIFO tie-breaking. Implemented a 4-layer Clean Architecture in NestJS with strict vital-sign domain validation, JWT/Argon2 authentication, and automated Cucumber BDD test suites in CI.',
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
    stack: ['React', 'Vite', 'Express', 'Node.js', 'MongoDB', 'Mongoose', 'Cloudinary', 'JWT'],
    i18n: {
      es: {
        name: 'Portal de Oficios Concepción | Desarrollador Full-Stack',
        context: 'Municipalidad de Concepción y Rolling Code School',
        bullets: [
          'Desarrollé un portal web municipal para conectar vecinos con trabajadores de oficios verificados mediante un flujo administrativo de moderación y alta.',
          'Implementé APIs RESTful en Express y MongoDB junto a un frontend en React, con autenticación JWT sin estado, almacenamiento de legajos en Cloudinary y sistema de reseñas comunitarias.',
        ],
        problem:
          'Desarrollé un portal web municipal para conectar vecinos con trabajadores de oficios verificados mediante un flujo administrativo de moderación y alta. Implementé APIs RESTful en Express y MongoDB junto a un frontend en React, con autenticación JWT sin estado, almacenamiento de legajos en Cloudinary y sistema de reseñas comunitarias.',
      },
      en: {
        name: 'Portal de Oficios Concepción | Full-Stack Developer',
        context: 'Municipality of Concepción & Rolling Code School',
        bullets: [
          'Developed a municipal web marketplace connecting local residents with verified skilled tradespeople through an administrative moderation and onboarding workflow.',
          'Implemented RESTful APIs in Express and MongoDB paired with a React frontend, featuring stateless JWT authentication, Cloudinary document storage, and a community review system.',
        ],
        problem:
          'Developed a municipal web marketplace connecting local residents with verified skilled tradespeople through an administrative moderation and onboarding workflow. Implemented RESTful APIs in Express and MongoDB paired with a React frontend, featuring stateless JWT authentication, Cloudinary document storage, and a community review system.',
      },
    },
  },
  {
    slug: 'gestion-multi-gimnasio',
    areas: ['desarrollo'],
    priority: 5,
    status: 'en_curso',
    period: { start: '2026-11', end: null },
    role: { mode: 'individual', teamSize: null },
    hasCaseStudy: false,
    thumbnail: null,
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas/polyGim', available: true },
    ],
    stack: ['Java 21', 'Spring Boot 3', 'Spring Security', 'JPA', 'Hibernate', 'PostgreSQL', 'Flyway', 'Thymeleaf', 'HTMX', 'JUnit 5', 'Testcontainers', 'Docker', 'GitHub Actions'],
    i18n: {
      es: {
        name: 'Plataforma SaaS Multi-Gimnasio | Ingeniero de Software (Java / Spring Boot)',
        context: 'Proyecto Personal (Especificación Comercial Real)',
        bullets: [
          'Transformé una aplicación de escritorio heredada en una plataforma web multi-tenant con aislamiento de datos por cliente, control de acceso basado en roles (RBAC), reglas de negocio configurables e identidad visual propia por gimnasio.',
          'Desarrollé el backend con Java 21, Spring Boot 3 y PostgreSQL (Flyway) para gestionar membresías, pagos parciales y reservas de clases con cupo, respaldado por JUnit 5 y Testcontainers en GitHub Actions CI.',
        ],
        problem:
          'Transformé una aplicación de escritorio heredada en una plataforma web multi-tenant con aislamiento de datos por cliente, control de acceso basado en roles (RBAC), reglas de negocio configurables e identidad visual propia por gimnasio. Desarrollé el backend con Java 21, Spring Boot 3 y PostgreSQL (Flyway) para gestionar membresías, pagos parciales y reservas de clases con cupo, respaldado por JUnit 5 y Testcontainers en GitHub Actions CI.',
      },
      en: {
        name: 'Multi-Tenant Gym Management SaaS Platform | Software Engineer (Java / Spring Boot)',
        context: 'Personal Project (Commercial Client Spec)',
        bullets: [
          'Transformed a legacy desktop application into a multi-tenant web platform supporting isolated client data, role-based access control (RBAC), configurable business rules, and custom branding per gym.',
          'Engineered the backend with Java 21, Spring Boot 3, and PostgreSQL (Flyway) to manage memberships, partial payments, and capacity-limited class bookings, backed by JUnit 5 and Testcontainers in GitHub Actions CI.',
        ],
        problem:
          'Transformed a legacy desktop application into a multi-tenant web platform supporting isolated client data, role-based access control (RBAC), configurable business rules, and custom branding per gym. Engineered the backend with Java 21, Spring Boot 3, and PostgreSQL (Flyway) to manage memberships, partial payments, and capacity-limited class bookings, backed by JUnit 5 and Testcontainers in GitHub Actions CI.',
      },
    },
  },
];

export function getProyectoBySlug(slug) {
  return proyectos.find((p) => p.slug === slug) || null;
}
