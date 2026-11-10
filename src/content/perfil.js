// Perfil Profesional (data-model.md §5).
//
// Un único CV cubre los tres ejes del perfil (desarrollo, redes y cloud), así que el
// mismo archivo se sirve desde la nav y desde la sección de contacto. `CV_FILE_NAME`
// es el nombre con el que se descarga, independiente del nombre del archivo en /public.
const CV_PATH = '/cv/CV-Armas_Maurov2.pdf';
const CV_FILE_NAME = 'CV-Mauro-Armas.pdf';

// Identidad compartida por la web y el CV; la foto siempre usa el mismo original.
const identidad = {
  fullName: 'Mauro Nahuel Armas',
  photo: '/mauro.png',
  phone: '+54 3865 505362',
};

const perfil = {
  es: {
    name: 'Mauro Armas',
    role: 'Desarrollo Full-Stack · Infraestructura · Automatizaciones e IA',
    location: 'Tucumán, Argentina',
    mode: '',
    languages: ['Español · nativo', 'Inglés · intermedio'],
    thesis: 'Diseño, desarrollo e infraestructura de sistemas de información.',
    lead: 'Enfoque en desarrollo y arquitectura de software, infraestructura y automatización de procesos de negocio.',
    about:
      'Estudiante de 5.º año de Ingeniería en Sistemas de Información con experiencia práctica en desarrollo full-stack, infraestructura cloud y redes (virtualización, contenedores, servidores Linux y despliegue seguro), así como en sistemas multiagente con IA generativa que automatizan procesos de negocio. Aplico gestión de proyectos (PMBok, Scrum y Jira) y aseguramiento de calidad mediante pruebas automatizadas (Cypress, Postman) orientadas a entregar software robusto y mantenible. Me destaco por mi liderazgo técnico, capacidad de aprendizaje autodidacta, resiliencia en contextos exigentes y rápida adaptación en equipos colaborativos.',
    email: 'mauro.armas14@gmail.com',
    github: 'https://github.com/mauroarmas',
    linkedin: 'https://www.linkedin.com/in/mauro-armas/',
    contactNote:
      'Sin formularios. Escribime directo y respondo. Para roles de desarrollo, redes o infraestructura cloud, por acá o por LinkedIn.',
  },
  en: {
    name: 'Mauro Armas',
    role: 'Full-Stack Development · Infrastructure · Automations & AI',
    location: 'Tucumán, Argentina',
    mode: '',
    languages: ['Spanish · native', 'English · intermediate'],
    thesis: 'Design, development, and infrastructure of information systems.',
    lead: 'Focus on software development and architecture, infrastructure, and business process automation.',
    about:
      'Fifth-year Information Systems Engineering student with hands-on experience in full-stack development, cloud infrastructure, and networking (virtualization, containers, Linux servers, and secure deployment), as well as multi-agent generative AI systems that automate business processes. I apply project management practices (PMBok, Scrum, and Jira) and quality assurance through automated testing (Cypress, Postman) to deliver robust, maintainable software. Known for technical leadership, self-directed learning, resilience in demanding environments, and fast adaptation within collaborative teams.',
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

export function getCvPath() {
  return CV_PATH;
}

export function getCvFileName() {
  return CV_FILE_NAME;
}
