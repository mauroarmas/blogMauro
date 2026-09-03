// Datos estructurados de Proyecto (data-model.md §2). Editar este archivo y desplegar
// es la vía prevista para sumar o actualizar un proyecto (research.md §4).
//
// NOTA: las URLs de "repositorio" apuntan al perfil público de GitHub del dueño porque
// no se dispone todavía del slug exacto del repo de cada proyecto. Reemplazar por la URL
// directa de cada repositorio (https://github.com/mauroarmas/<repo>) en cuanto se confirme
// — no se fabrica una ruta específica sin verificarla (Principio II de la constitución).

export const proyectos = [
  {
    slug: 'trimia',
    areas: ['desarrollo'],
    priority: 1,
    status: 'en_curso',
    period: { start: '2026-04', end: null },
    role: { mode: 'individual', teamSize: null },
    hasCaseStudy: true,
    thumbnail: null, // ruta en /public cuando el dueño cargue una captura real
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
      { type: 'informe', url: null, available: false },
      { type: 'demo', url: null, available: false },
    ],
    stack: ['Gemini API', 'NestJS', 'LangChain', 'RAG', 'BullMQ (Redis)'],
    i18n: {
      es: {
        name: 'TrimIA — Asistente multi-agente de IA',
        context: 'Credimisión S.R.L. · Tesis de grado, UTN-FRT',
        problem:
          'La atención comercial por WhatsApp dependía de personas leyendo, clasificando y derivando cada consulta a mano.',
      },
      en: {
        name: 'TrimIA — Multi-agent AI assistant',
        context: 'Credimisión S.R.L. · Degree thesis, UTN-FRT',
        problem:
          'Commercial support over WhatsApp relied on people reading, classifying and routing every inquiry by hand.',
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
    thumbnail: null, // ruta en /public cuando el dueño cargue una captura real
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
      { type: 'informe', url: null, available: false },
      { type: 'demo', url: null, available: false },
    ],
    stack: ['FastAPI', 'React', 'PostgreSQL', 'Proxmox VE API', 'Docker', 'Linux'],
    i18n: {
      es: {
        name: 'Gestión y orquestación de nube privada',
        context: 'UTN-FRT · Práctica supervisada',
        problem:
          'Las cátedras necesitaban cómputo y almacenamiento propios sin tocar el clúster ni depender de que alguien de sistemas lo hiciera por ellas.',
      },
      en: {
        name: 'Private cloud management and orchestration',
        context: 'UTN-FRT · Supervised practicum',
        problem:
          'Academic departments needed their own compute and storage without touching the cluster or depending on the systems team to provision it for them.',
      },
    },
  },
  {
    slug: 'guardia-medica',
    areas: ['desarrollo'],
    priority: 3,
    status: 'finalizado',
    period: { start: '2025-09', end: '2025-12' },
    role: { mode: 'individual', teamSize: null },
    hasCaseStudy: false,
    thumbnail: null,
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
    ],
    stack: ['NestJS', 'ReactJS', 'MySQL'],
    i18n: {
      es: {
        name: 'Gestión de colas de pacientes para guardia médica',
        context: 'UTN-FRT · Prácticas profesionalizantes',
        problem:
          'El triaje y el registro de ingresos se llevaban a mano, en el momento en que menos tiempo hay para hacerlo.',
      },
      en: {
        name: 'Patient queue management for medical emergency rooms',
        context: 'UTN-FRT · Professional practicum',
        problem:
          'Triage and intake records were kept by hand, precisely when there is the least time to do it.',
      },
    },
  },
  {
    slug: 'red-social-trabajos',
    areas: ['desarrollo'],
    priority: 4,
    status: 'finalizado',
    period: { start: '2023-11', end: '2024-03' },
    role: { mode: 'equipo', teamSize: null },
    hasCaseStudy: false,
    thumbnail: null,
    verification: [
      { type: 'repositorio', url: 'https://github.com/mauroarmas', available: true },
    ],
    stack: ['ExpressJS', 'ReactJS', 'MySQL'],
    i18n: {
      es: {
        name: 'Red social de trabajos',
        context: 'Municipalidad de Concepción · Rolling Code School',
        problem:
          'Los oficios informales de Concepción no tenían un lugar donde ofrecerse ni donde encontrarse.',
      },
      en: {
        name: 'Informal jobs social network',
        context: 'Municipality of Concepción · Rolling Code School',
        problem:
          "Concepción's informal trades had no place to be offered or found.",
      },
    },
  },
];

export function getProyectoBySlug(slug) {
  return proyectos.find((p) => p.slug === slug) || null;
}
