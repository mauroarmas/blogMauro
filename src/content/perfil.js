// Perfil Profesional (data-model.md §5).
//
// Solo se ofrece el CV de Desarrollo: para roles de infraestructura/redes el dueño
// postula directo por email o LinkedIn, no vía este sitio (decisión explícita del dueño).
const CV_PATH = '/cv/cv-mauro-armas-desarrollo.pdf';

const perfil = {
  es: {
    name: 'Mauro Armas',
    role: 'Desarrollador Full-Stack e Infraestructura Cloud',
    location: 'Tucumán, Argentina',
    mode: 'Remoto o híbrido · Disponible',
    thesis: 'Escribo el software y administro la infraestructura donde corre.',
    lead:
      'No son dos carreras separadas: los mismos proyectos que diseñé en NestJS y React son los que desplegué sobre un clúster Proxmox de cinco nodos. Backend, datos, redes y nube, de punta a punta.',
    about:
      'Estudio Ingeniería en Sistemas en la UTN-FRT. Diseño arquitecturas de backend y sistemas con IA generativa, y administro la virtualización, Linux y las redes donde eso corre. Aprendí las dos porque en los proyectos reales nadie las tenía separadas.',
    email: 'mauro.armas14@gmail.com',
    github: 'https://github.com/mauroarmas',
    linkedin: 'https://www.linkedin.com/in/mauro-armas/',
    contactNote:
      'Sin formularios. Escribime directo y respondo. Para roles de infraestructura y redes, escribime por acá o por LinkedIn.',
  },
  en: {
    name: 'Mauro Armas',
    role: 'Full-Stack Developer & Cloud Infrastructure',
    location: 'Tucumán, Argentina',
    mode: 'Remote or hybrid · Available',
    thesis: 'I write the software and run the infrastructure it lives on.',
    lead:
      "They aren't two separate careers: the same projects I designed in NestJS and React are the ones I deployed on a five-node Proxmox cluster. Backend, data, networking and cloud, end to end.",
    about:
      "I'm studying Information Systems Engineering at UTN-FRT. I design backend architectures and generative-AI systems, and I run the virtualization, Linux and networking they run on. I learned both because on real projects nobody kept them separate.",
    email: 'mauro.armas14@gmail.com',
    github: 'https://github.com/mauroarmas',
    linkedin: 'https://www.linkedin.com/in/mauro-armas/',
    contactNote:
      "No forms. Write to me directly and I'll answer. For infrastructure & networking roles, reach out here or on LinkedIn.",
  },
};

export function getPerfil(locale) {
  return perfil[locale] || perfil.es;
}

export function getCvPath() {
  return CV_PATH;
}
