// Formación (data-model.md §4). `type` distingue el ícono a mostrar
// ('carrera' | 'bootcamp' | 'curso'); `certificate` es la ruta pública a la imagen del
// certificado (null mientras no se haya cargado uno).

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
    status: 'en_curso',
    verification: null,
    certificate: null,
    i18n: {
      // TODO(dueño): completar institución, fechas y certificado cuando estén disponibles.
      es: { title: 'Desarrollo con IA', institution: 'Por definir', statusLabel: null },
      en: { title: 'AI-Assisted Development', institution: 'To be defined', statusLabel: null },
    },
  },
];
