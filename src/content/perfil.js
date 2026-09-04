// Perfil Profesional (data-model.md §5).
//
// Un único CV cubre los tres ejes del perfil (desarrollo, redes y cloud), así que el
// mismo archivo se sirve desde la nav y desde la sección de contacto. `CV_FILE_NAME`
// es el nombre con el que se descarga, independiente del nombre del archivo en /public.
const CV_PATH = '/cv/CV-Armas_Maurov2.pdf';
const CV_FILE_NAME = 'CV-Mauro-Armas.pdf';

const perfil = {
  es: {
    name: 'Mauro Armas',
    role: 'Desarrollador Full-Stack · Redes y Cloud',
    location: 'Tucumán, Argentina',
    mode: 'Remoto o híbrido',
    thesis: 'Diseño, desarrollo e infraestructura de sistemas de información.',
    lead:'',
        about:
      'Estudiante de 5.º año de Ingeniería en Sistemas con experiencia práctica en infraestructura (virtualización, servidores, redes y despliegue) y desarrollo full-stack, incluyendo sistemas con IA generativa que automatizan procesos de negocio. Actualmente formandome en redes, desarrollo de software y sistemas de control (PLC, SCADA). Trabajo con metodologías ágiles como Scrum, con enfoque en la entrega de software de calidad y la mejora continua del equipo y sistema. Me destaco por mi alta capacidad de aprendizaje autodidacta, resiliencia en contextos exigentes, liderazgo y adaptabilidad en entornos colaborativos y nuevas tecnologías.',
    email: 'mauro.armas14@gmail.com',
    github: 'https://github.com/mauroarmas',
    linkedin: 'https://www.linkedin.com/in/mauro-armas/',
    contactNote:
      'Sin formularios. Escribime directo y respondo. Para roles de desarrollo, redes o infraestructura cloud, por acá o por LinkedIn.',
  },
  en: {
    name: 'Mauro Armas',
    role: 'Full-Stack Developer · Networking & Cloud',
    location: 'Tucumán, Argentina',
    mode: 'Remote or hybrid',
    thesis: 'The software I design runs on infrastructure I maintain myself.',
    lead: ' ',
    about:
      "A fifth-year Systems Engineering student with hands-on experience in infrastructure (virtualization, servers, networks, and deployment) and full-stack development, including systems with generative AI that automate business processes. Currently training in networking, software development, and control systems (PLC, SCADA). I work with agile methodologies such as Scrum, with a focus on delivering high-quality software and continuously improving the team and the system. I excel in my ability to be a self-directed learner, my resilience in demanding situations, my leadership, and my adaptability in collaborative environments and with new technologies.",
    email: 'mauro.armas14@gmail.com',
    github: 'https://github.com/mauroarmas',
    linkedin: 'https://www.linkedin.com/in/mauro-armas/',
    contactNote:
      "No forms. Write to me directly and I'll answer. For development, networking or cloud infrastructure roles, reach out here or on LinkedIn.",
  },
};

export function getPerfil(locale) {
  return perfil[locale] || perfil.es;
}

export function getCvPath() {
  return CV_PATH;
}

export function getCvFileName() {
  return CV_FILE_NAME;
}