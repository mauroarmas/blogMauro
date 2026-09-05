// Datos estructurados de Proyecto (data-model.md §2). Editar este archivo y desplegar
// es la vía prevista para sumar o actualizar un proyecto (research.md §4).
//
// El contenido sigue al CV (public/cv): mismos proyectos, mismas cifras, mismo stack —
// un reclutador que compare los dos documentos no debería encontrar diferencias.
//
// NOTA: las URLs de "repositorio" apuntan al perfil público de GitHub del dueño porque
// no se dispone todavía del slug exacto del repo de cada proyecto. Reemplazar por la URL
// directa de cada repositorio (https://github.com/mauroarmas/<repo>) en cuanto se confirme
// — no se fabrica una ruta específica sin verificarla (Principio II de la constitución).

export const proyectos = [
  {
    slug: 'trimia',
    areas: ['ia', 'desarrollo'],
    priority: 1,
    status: 'en_curso',
    period: { start: '2026-04', end: null },
    role: { mode: 'individual', teamSize: null },
    hasCaseStudy: true,
    thumbnail: '/assets/trimIA/trimia-1.png',
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
      { type: 'informe', url: null, available: false },
      { type: 'demo', url: null, available: false },
    ],
    stack: ['NestJS · TypeScript', 'LangGraph', 'ChromaDB · RAG', 'Gemini', 'PostgreSQL · Prisma', 'BullMQ · Redis'],
    i18n: {
      es: {
        name: 'TrimIA — Sistema multiagente de IA para atención al cliente y capacitación interna',
        context: 'Credimisión S.R.L. · Tesis de grado, UTN-FRT',
        problem:
          'Casi toda la operación pasa por WhatsApp y casi todo el conocimiento para contestar vive en la cabeza de alguien: cada consulta de un cliente dispara dos o tres consultas internas.',
      },
      en: {
        name: 'TrimIA — Multi-agent AI system for customer service and internal training',
        context: 'Credimisión S.R.L. · Degree thesis, UTN-FRT',
        problem:
          'Almost the whole operation runs on WhatsApp and almost all the knowledge needed to answer lives in someone\'s head: every customer question triggers two or three internal ones.',
      },
    },
  },
  {
    slug: 'nube-privada',
    areas: ['infraestructura', 'desarrollo'],
    priority: 2,
    status: 'en_curso',
    period: { start: '2026-05', end: null },
    role: { mode: 'equipo', teamSize: 3 },
    hasCaseStudy: true,
    thumbnail: '/assets/NAP/NAP-1.png',
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
      { type: 'informe', url: null, available: false },
      { type: 'demo', url: null, available: false },
    ],
    stack: ['Python · FastAPI', 'React · Vite', 'PostgreSQL', 'API de Proxmox VE', 'Docker', 'Linux'],
    i18n: {
      es: {
        name: 'NAP — Orquestación de nube privada sobre Proxmox VE',
        context: 'UTN-FRT · Práctica supervisada',
        problem:
          'Ocho cátedras necesitaban cómputo y almacenamiento propios sobre un clúster de cinco nodos, sin tocar el hipervisor ni depender de que alguien de TIC lo aprovisionara a mano.',
      },
      en: {
        name: 'NAP — Private cloud orchestration on Proxmox VE',
        context: 'UTN-FRT · Supervised practicum',
        problem:
          'Eight academic departments needed their own compute and storage on a five-node cluster, without touching the hypervisor or waiting for IT to provision it by hand.',
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
          'En una guardia, el que llega primero no es el que se atiende primero: sostener ese orden a mano depende de que alguien lo recalcule mentalmente cada vez que entra un paciente.',
      },
      en: {
        name: 'Guardia Médica — ER triage system',
        context: 'UTN-FRT · Software Engineering',
        problem:
          'In an ER, first in is not first seen: keeping that order by hand depends on someone recalculating it mentally every time a new patient walks in.',
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
          'Conseguir un gasista matriculado o un electricista de confianza en Concepción pasaba por el boca en boca, sin forma de distinguir a un trabajador verificado de un número de teléfono suelto.',
      },
      en: {
        name: 'Portal de Oficios Concepción',
        context: 'Municipality of Concepción · Rolling Code School',
        problem:
          'Finding a licensed gas fitter or a trustworthy electrician in Concepción went by word of mouth, with no way to tell a vetted worker from a loose phone number.',
      },
    },
  },
  {
    slug: 'clasificacion-aves-cnn',
    areas: ['ia', 'desarrollo'],
    priority: 5,
    status: 'finalizado',
    period: { start: '2026-05', end: '2026-06' },
    role: { mode: 'individual', teamSize: null },
    hasCaseStudy: true,
    thumbnail: '/assets/IA-project/curvas-aprendizaje.png',
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
      { type: 'informe', url: '/assets/IA-project/tp3.pdf', available: true },
    ],
    stack: ['Python', 'TensorFlow · Keras', 'CNN', 'Transfer Learning'],
    i18n: {
      es: {
        name: 'Clasificación de especies de aves con CNN',
        context: 'Cátedra de Inteligencia Artificial, UTN-FRT · Trabajo práctico',
        problem:
          'Medir cuánto aporta realmente el Transfer Learning: tres arquitecturas (Custom, VGG16, ResNet50) sobre el mismo dataset de 7.500 imágenes, auditadas con curvas ROC y matriz de confusión.',
      },
      en: {
        name: 'Bird species classification with CNNs',
        context: 'Artificial Intelligence course, UTN-FRT · Coursework',
        problem:
          'Measuring what transfer learning actually buys you: three architectures (Custom, VGG16, ResNet50) over the same 7,500-image dataset, audited with ROC curves and a confusion matrix.',
      },
    },
  },
];

export function getProyectoBySlug(slug) {
  return proyectos.find((p) => p.slug === slug) || null;
}
