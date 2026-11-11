// Competencias técnicas agrupadas por capa (data-model.md §3). Sin nivel de dominio
// numérico ni porcentual — RF-005.
//
// `featured: true` marca lo que se muestra como chips en el Hero: la síntesis de los
// tres ejes del CV — desarrollo, redes y cloud — no las primeras N del array.

export const stack = [
  // Backend — Desarrollo
  { name: 'Node.js, NestJS, Express', en: 'Node.js, NestJS, Express', layer: 'backend', areas: ['desarrollo'], featured: true },
  { name: 'Python, FastAPI', en: 'Python, FastAPI', layer: 'backend', areas: ['desarrollo'], featured: true },
  { name: 'TypeScript', en: 'TypeScript', layer: 'backend', areas: ['desarrollo'], featured: true },
  { name: 'Java, Spring Boot', en: 'Java, Spring Boot', layer: 'backend', areas: ['desarrollo'] },

  // Frontend — Desarrollo
  { name: 'React', en: 'React', layer: 'frontend', areas: ['desarrollo'], featured: true },
  { name: 'Next.js', en: 'Next.js', layer: 'frontend', areas: ['desarrollo'], featured: true },
  { name: 'Vite', en: 'Vite', layer: 'frontend', areas: ['desarrollo'] },
  { name: 'HTML5, CSS3, Thymeleaf, HTMX', en: 'HTML5, CSS3, Thymeleaf, HTMX', layer: 'frontend', areas: ['desarrollo'] },

  // Datos — Ambas áreas
  { name: 'PostgreSQL, MySQL', en: 'PostgreSQL, MySQL', layer: 'datos', areas: ['desarrollo', 'infraestructura'], featured: true },
  { name: 'MongoDB, Redis', en: 'MongoDB, Redis', layer: 'datos', areas: ['desarrollo'] },
  { name: 'ChromaDB (Vector DB)', en: 'ChromaDB (Vector DB)', layer: 'datos', areas: ['desarrollo', 'ia'] },
  { name: 'Prisma, Hibernate/JPA, Flyway', en: 'Prisma, Hibernate/JPA, Flyway', layer: 'datos', areas: ['desarrollo'] },

  // Cloud & DevOps — Infraestructura
  { name: 'Proxmox VE, LXC', en: 'Proxmox VE, LXC', layer: 'cloud', areas: ['infraestructura'] },
  { name: 'Docker, OCI', en: 'Docker, OCI', layer: 'cloud', areas: ['infraestructura', 'desarrollo'] },
  { name: 'AWS', en: 'AWS', layer: 'cloud', areas: ['infraestructura'] },
  { name: 'CI/CD, GitHub Actions, TrueNAS', en: 'CI/CD, GitHub Actions, TrueNAS', layer: 'cloud', areas: ['infraestructura', 'desarrollo'] },

  // Redes & Sistemas — Infraestructura
  { name: 'Redes TCP/IP, SDN', en: 'TCP/IP Networking, SDN', layer: 'redes', areas: ['infraestructura'] },
  { name: 'Administración de Sistemas Linux', en: 'Linux System Administration', layer: 'redes', areas: ['infraestructura'] },
  { name: 'Nginx, systemd, Tailscale, SSH/TLS', en: 'Nginx, systemd, Tailscale, SSH/TLS', layer: 'redes', areas: ['infraestructura'] },
  { name: 'Cisco Packet Tracer', en: 'Cisco Packet Tracer', layer: 'redes', areas: ['infraestructura'] },

  // IA y automatización
  { name: 'LangGraph, LangChain, Sistemas Multiagente', en: 'LangGraph, LangChain, Multi-Agent Systems', layer: 'ia', areas: ['desarrollo', 'ia'] },
  { name: 'RAG, LLMs', en: 'RAG, LLMs', layer: 'ia', areas: ['desarrollo', 'ia'] },
  { name: 'Spec-Driven Development (SDD)', en: 'Spec-Driven Development (SDD)', layer: 'ia', areas: ['desarrollo', 'ia'] },
  { name: 'n8n, BullMQ', en: 'n8n, BullMQ', layer: 'ia', areas: ['desarrollo', 'ia'] },

  // Gestión & Calidad (QA) — Gestión de proyectos, agilidad y testing
  { name: 'Gestión de Proyectos (PMBOK)', en: 'Project Management (PMBOK)', layer: 'metodo', areas: ['desarrollo'] },
  { name: 'Scrum, Jira', en: 'Scrum, Jira', layer: 'metodo', areas: ['desarrollo'] },
  { name: 'Pruebas Automatizadas, Cypress, Postman', en: 'Automated Testing, Cypress, Postman', layer: 'metodo', areas: ['desarrollo'] },
  { name: 'Cucumber (BDD), JUnit 5, Testcontainers', en: 'Cucumber (BDD), JUnit 5, Testcontainers', layer: 'metodo', areas: ['desarrollo'] },
];

export const STACK_LAYERS = [
  { key: 'backend', es: 'Backend', en: 'Backend' },
  { key: 'frontend', es: 'Frontend', en: 'Frontend' },
  { key: 'datos', es: 'Datos y Bases de Datos', en: 'Data & Databases' },
  { key: 'cloud', es: 'Cloud & DevOps', en: 'Cloud & DevOps' },
  { key: 'redes', es: 'Redes & Sistemas', en: 'Networking & Systems' },
  { key: 'ia', es: 'IA y Automatización', en: 'AI & Automation' },
  { key: 'metodo', es: 'Gestión & Calidad (QA)', en: 'Management & QA' },
];

// Chips del Hero (RF-003): selección curada, no un slice del array.
export const featuredStack = stack.filter((s) => s.featured);
