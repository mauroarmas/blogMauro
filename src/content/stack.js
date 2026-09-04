// Competencias técnicas agrupadas por capa (data-model.md §3). Sin nivel de dominio
// numérico ni porcentual — RF-005.
//
// `featured: true` marca lo que se muestra como chips en el Hero: la síntesis de los
// tres ejes del CV — desarrollo, redes y cloud — no las primeras N del array.

export const stack = [
  // Backend — Desarrollo
  { name: 'Node.js · NestJS · Express', layer: 'backend', areas: ['desarrollo'], featured: true },
  { name: 'Python · FastAPI', layer: 'backend', areas: ['desarrollo'], featured: true },
  { name: 'TypeScript', layer: 'backend', areas: ['desarrollo'], featured: true },
  { name: 'Java · Spring', layer: 'backend', areas: ['desarrollo'] },

  // Frontend — Desarrollo
  { name: 'React', layer: 'frontend', areas: ['desarrollo'], featured: true },
  { name: 'Next.js', layer: 'frontend', areas: ['desarrollo'], featured: true },
  { name: 'Vite', layer: 'frontend', areas: ['desarrollo'] },
  { name: 'HTML5 · CSS3', layer: 'frontend', areas: ['desarrollo'] },

  // Datos — Ambas áreas
  { name: 'PostgreSQL', layer: 'datos', areas: ['desarrollo', 'infraestructura'], featured: true },
  { name: 'MySQL', layer: 'datos', areas: ['desarrollo'] },
  { name: 'Redis', layer: 'datos', areas: ['desarrollo'] },
  { name: 'ChromaDB (vectorial)', layer: 'datos', areas: ['desarrollo'] },

  // Redes & Sistemas — Infraestructura
  { name: 'Redes TCP/IP', layer: 'redes', areas: ['infraestructura'], featured: true },
  { name: 'Cisco Packet Tracer', layer: 'redes', areas: ['infraestructura'] },
  { name: 'Linux (admin)', layer: 'redes', areas: ['infraestructura'], featured: true },
  { name: 'nginx · systemd', layer: 'redes', areas: ['infraestructura'] },
  // Declarado como nociones también en el CV: formación en curso, no experiencia de proyecto.
  { name: 'PLC · SCADA (nociones)', layer: 'redes', areas: ['infraestructura'] },

  // Cloud & DevOps — Infraestructura
  { name: 'Proxmox VE · LXC', layer: 'cloud', areas: ['infraestructura'], featured: true },
  { name: 'Docker', layer: 'cloud', areas: ['infraestructura', 'desarrollo'], featured: true },
  { name: 'AWS', layer: 'cloud', areas: ['infraestructura'], featured: true },
  { name: 'CI/CD · GitHub Actions', layer: 'cloud', areas: ['infraestructura', 'desarrollo'] },
  { name: 'n8n', layer: 'cloud', areas: ['desarrollo'] },

  // IA — Desarrollo
  { name: 'LangGraph · LangChain', layer: 'ia', areas: ['desarrollo'] },
  { name: 'RAG · LLM', layer: 'ia', areas: ['desarrollo'] },
  { name: 'Gemini API', layer: 'ia', areas: ['desarrollo'] },
  { name: 'TensorFlow · Keras', layer: 'ia', areas: ['desarrollo'] },
];

export const STACK_LAYERS = [
  { key: 'backend', es: 'Backend', en: 'Backend' },
  { key: 'frontend', es: 'Frontend', en: 'Frontend' },
  { key: 'datos', es: 'Datos', en: 'Data' },
  { key: 'redes', es: 'Redes & Sistemas', en: 'Networking & Systems' },
  { key: 'cloud', es: 'Cloud & DevOps', en: 'Cloud & DevOps' },
  { key: 'ia', es: 'IA', en: 'AI' },
];

// Chips del Hero (RF-003): selección curada, no un slice del array.
export const featuredStack = stack.filter((s) => s.featured);
