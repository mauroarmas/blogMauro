// Perfil Profesional (data-model.md §5).
//
// Un único CV cubre los tres ejes del perfil (desarrollo, redes y cloud), así que el
// mismo archivo se sirve desde la nav y desde la sección de contacto. `CV_FILE_NAME`
// es el nombre con el que se descarga, independiente del nombre del archivo en /public.
const CV_PATHS = {
  es: '/cv/CV-Mauro-Armas-es.pdf',
  en: '/cv/CV-Mauro-Armas-en.pdf',
};
const CV_FILE_NAMES = {
  es: 'CV-Mauro-Armas-es.pdf',
  en: 'CV-Mauro-Armas-en.pdf',
};

// Identidad compartida por la web y el CV; la foto siempre usa el mismo original.
const identidad = {
  fullName: 'Mauro Nahuel Armas',
  photo: '/mauro.png',
  phone: '+54 3865 505362',
};

const perfil = {
  es: {
    name: 'Mauro Armas',
    role: 'Desarrollo Full-Stack | Infraestructura | Automatizaciones e IA',
    location: 'Tucumán, Argentina',
    mode: '',
    languages: ['Español · nativo', 'Inglés · intermedio'],
    thesis: 'Diseño, desarrollo e infraestructura de sistemas de información.',
    lead: 'Enfoque en desarrollo y arquitectura de software, infraestructura y automatización de procesos de negocio.',
    about:
      'Estudiante de 5.º año de Ingeniería en Sistemas de Información e Ingeniero Full-Stack & Cloud especializado en arquitecturas backend distribuidas, infraestructura de nube privada y sistemas multiagente de IA generativa. Trayectoria comprobada entregando plataformas de nivel productivo respaldadas por más de 900 pruebas automatizadas, pipelines RAG y microservicios contenedorizados. Aplica prácticas de PMBOK, Scrum y Spec-Driven Development (SDD) para alinear arquitecturas técnicas complejas con la automatización de procesos de negocio.',
    email: 'mauro.armas14@gmail.com',
    github: 'https://github.com/mauroarmas',
    linkedin: 'https://www.linkedin.com/in/mauro-armas/',
    contactNote:
      'Sin formularios. Escribime directo y respondo. Para roles de desarrollo, redes o infraestructura cloud, por acá o por LinkedIn.',
  },
  en: {
    name: 'Mauro Armas',
    role: 'Full-Stack Development | Infrastructure | Automations & AI',
    location: 'Tucumán, Argentina',
    mode: '',
    languages: ['Spanish · native', 'English · intermediate'],
    thesis: 'Design, development, and infrastructure of information systems.',
    lead: 'Focus on software development and architecture, infrastructure, and business process automation.',
    about:
      'Fifth-year Information Systems Engineering student and Full-Stack & Cloud Engineer specializing in distributed backend architectures, private cloud infrastructure, and multi-agent generative AI systems. Proven track record of delivering production-grade platforms backed by 900+ automated tests, RAG pipelines, and containerized microservices. Applies PMBOK, Scrum, and Spec-Driven Development (SDD) practices to align complex technical architectures with business process automation.',
    email: 'mauro.armas14@gmail.com',
    github: 'https://github.com/mauroarmas',
    linkedin: 'https://www.linkedin.com/in/mauro-armas/',
    contactNote:
      "No forms. Write to me directly and I'll answer. For development, networking or cloud infrastructure roles, reach out here or on LinkedIn.",
  },
};

export function getPerfil(locale) {
  return { ...identidad, ...(perfil[locale] || perfil.es) };
}

export function getCvPath(locale = 'es') {
  return CV_PATHS[locale] || CV_PATHS.es;
}

export function getCvFileName(locale = 'es') {
  return CV_FILE_NAMES[locale] || CV_FILE_NAMES.es;
}
