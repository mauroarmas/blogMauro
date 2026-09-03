// Competencias técnicas agrupadas por capa (data-model.md §3). Sin nivel de dominio
// numérico ni porcentual — RF-005.

export const stack = [
  // Backend — Desarrollo
  { name: 'Node.js · NestJS · Express', layer: 'backend', areas: ['desarrollo'] },
  { name: 'Python · FastAPI', layer: 'backend', areas: ['desarrollo'] },
  { name: 'TypeScript', layer: 'backend', areas: ['desarrollo'] },
  { name: 'Java · Spring', layer: 'backend', areas: ['desarrollo'] },

  // Frontend — Desarrollo
  { name: 'React', layer: 'frontend', areas: ['desarrollo'] },
  { name: 'Next.js', layer: 'frontend', areas: ['desarrollo'] },
  { name: 'Vite', layer: 'frontend', areas: ['desarrollo'] },
  { name: 'HTML5 · CSS3', layer: 'frontend', areas: ['desarrollo'] },

  // Datos — Ambas áreas
  { name: 'PostgreSQL', layer: 'datos', areas: ['desarrollo', 'infraestructura'] },
  { name: 'MySQL', layer: 'datos', areas: ['desarrollo', 'infraestructura'] },
  { name: 'Redis', layer: 'datos', areas: ['desarrollo'] },
  { name: 'NoSQL', layer: 'datos', areas: ['desarrollo'] },

  // Infra & Cloud — Infraestructura
  { name: 'Proxmox VE', layer: 'infra_cloud', areas: ['infraestructura'] },
  { name: 'Linux (admin)', layer: 'infra_cloud', areas: ['infraestructura'] },
  { name: 'Docker', layer: 'infra_cloud', areas: ['infraestructura', 'desarrollo'] },
  { name: 'AWS', layer: 'infra_cloud', areas: ['infraestructura'] },
  { name: 'Redes TCP/IP · MikroTik', layer: 'infra_cloud', areas: ['infraestructura'] },
  { name: 'GitHub Actions', layer: 'infra_cloud', areas: ['infraestructura', 'desarrollo'] },

  // IA — Desarrollo
  { name: 'LangChain', layer: 'ia', areas: ['desarrollo'] },
  { name: 'RAG · LLM', layer: 'ia', areas: ['desarrollo'] },
  { name: 'Gemini API', layer: 'ia', areas: ['desarrollo'] },
  { name: 'TensorFlow', layer: 'ia', areas: ['desarrollo'] },
  { name: 'n8n', layer: 'ia', areas: ['desarrollo'] },
];

export const STACK_LAYERS = [
  { key: 'backend', es: 'Backend', en: 'Backend' },
  { key: 'frontend', es: 'Frontend', en: 'Frontend' },
  { key: 'datos', es: 'Datos', en: 'Data' },
  { key: 'infra_cloud', es: 'Infra & Cloud', en: 'Infra & Cloud' },
  { key: 'ia', es: 'IA', en: 'AI' },
];
