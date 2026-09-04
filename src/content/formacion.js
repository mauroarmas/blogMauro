// Formación (data-model.md §4). `type` distingue el ícono a mostrar
// ('carrera' | 'bootcamp' | 'curso'); `certificate` es la ruta pública a la imagen del
// certificado (null mientras no se haya cargado uno).
//
// Las certificaciones del CV no traen fecha de emisión, así que `period` queda en null
// en vez de inventarse una (Principio II de la constitución). La formación en redes y
// sistemas de control (PLC/SCADA) todavía no tiene institución declarada: se menciona
// en "Sobre mí" y en el stack como nociones, no como una fila de formación.

export const formacion = [
  {
    type: 'carrera',
    period: { start: '2021-04', end: null },
    status: 'en_curso',
    verification: null,
    certificate: null,
    i18n: {
      es: { title: 'Ingeniería en Sistemas de Información', institution: 'UTN — Facultad Regional Tucumán', statusLabel: '5.º año' },
      en: { title: 'Information Systems Engineering', institution: 'UTN — Tucumán Regional Faculty', statusLabel: '5th year' },
    },
  },
  {
    type: 'bootcamp',
    period: { start: '2023-08', end: '2024-05' },
    status: 'finalizado',
    verification: null,
    certificate: '/certificados/RC.jpeg',
    i18n: {
      es: { title: 'Desarrollo Full-Stack (MERN)', institution: 'Rolling Code School', statusLabel: null },
      en: { title: 'Full-Stack Development (MERN)', institution: 'Rolling Code School', statusLabel: null },
    },
  },
  {
    type: 'curso',
    period: { start: null, end: null },
    status: 'finalizado',
    verification: null,
    certificate: null,
    i18n: {
      es: { title: 'NestJS Backend Developer', institution: 'Xetro AI (ex Vortex)', statusLabel: null },
      en: { title: 'NestJS Backend Developer', institution: 'Xetro AI (formerly Vortex)', statusLabel: null },
    },
  },
  {
    type: 'curso',
    period: { start: null, end: null },
    status: 'finalizado',
    verification: null,
    certificate: null,
    i18n: {
      es: { title: 'Spec Driven Development (SDD) y agentes de IA', institution: 'Udemy', statusLabel: null },
      en: { title: 'Spec Driven Development (SDD) and AI agents', institution: 'Udemy', statusLabel: null },
    },
  },
];
