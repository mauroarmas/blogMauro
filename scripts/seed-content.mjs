// Carga los dos casos de estudio iniciales (T028) en la base de datos local de
// desarrollo. El cuerpo deja marcadores [TODO] explícitos donde falta la justificación
// técnica real que solo el dueño puede dar (Principio II de la constitución: nada no
// verificado se publica como si fuera un hecho). Correr con: node scripts/seed-content.mjs
//
// Para producción (Postgres), aplicar el mismo contenido a través del panel de admin
// una vez desplegado, o adaptar este script para usar `pg` con DATABASE_URL.

import Database from 'better-sqlite3';

function readTime(content = '') {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const db = new Database('local_blog.db');
db.pragma('journal_mode = WAL');

const trimiaBody = `## El problema

La atención comercial por WhatsApp de Credimisión S.R.L. dependía de personas leyendo,
clasificando y derivando cada consulta a mano — sin capacidad de absorber los picos de
tráfico y sin memoria de las conversaciones previas de cada cliente.

## Arquitectura

Un asistente conversacional expuesto sobre WhatsApp: una cola de espera (BullMQ sobre
Redis) ordena los mensajes entrantes, un conjunto de agentes especializados (LangChain)
resuelve cada tipo de consulta apoyándose en una base de conocimiento propia vía RAG
(Gemini API), y el sistema se integra con el CRM, Paljet y RiesgoOnline que la empresa ya
usaba.

## Decisiones técnicas

### Por qué RAG en vez de fine-tuning

[TODO: el dueño completa la justificación real — costo de reentrenar el modelo frente a
actualizar la base de conocimiento, latencia, frecuencia con la que cambia la información
del negocio, etc.]

### Por qué una cola de espera (BullMQ/Redis) en vez de procesar cada mensaje al vuelo

[TODO: el dueño completa — control de concurrencia, comportamiento en picos de tráfico,
reintentos ante fallos de un agente.]

### Por qué NestJS como backend

[TODO: el dueño completa — qué pesó en la decisión frente a alternativas como Express o
FastAPI para este proyecto en particular.]

## Resultado

[TODO: el dueño completa con una métrica o resultado concreto — tiempo de respuesta
promedio, volumen de consultas atendidas, reducción de carga manual, etc.]

## Aprendizajes

[TODO: el dueño completa.]
`;

const nubePrivadaBody = `## El problema

Las cátedras de la UTN-FRT necesitaban cómputo y almacenamiento propios sobre el clúster
Proxmox VE de la facultad, sin tener que pedirle a alguien de sistemas que lo hiciera por
ellas cada vez, y sin exponerlas directamente a la administración de la infraestructura.

## Arquitectura

Un middleware PaaS/SaaS entre las cátedras y el clúster Proxmox VE de 5 nodos: un sistema
de pedidos con flujo de estados, autenticación con roles y 2FA, cuotas de recursos por
cátedra, un catálogo de templates estandarizados, y monitoreo en tiempo real de lo
aprovisionado. Desarrollado en equipo de tres integrantes.

## Decisiones técnicas

### Por qué un middleware propio en vez de dar acceso directo a Proxmox

[TODO: el dueño completa — riesgos de exponer la consola de Proxmox directamente a
usuarios no administradores, necesidad de cuotas y aislamiento por cátedra.]

### Por qué FastAPI para esta capa

[TODO: el dueño completa — qué pesó frente a otras alternativas para hablar con la API de
Proxmox (proxmoxer) y exponer el propio backend del middleware.]

### Por qué cuotas de recursos por cátedra desde el diseño

[TODO: el dueño completa — qué problema concreto de uso descontrolado del clúster
motivó modelar esto desde el principio en vez de agregarlo después.]

## Resultado

[TODO: el dueño completa con una métrica o resultado concreto — cantidad de cátedras
usando el sistema, tiempo de aprovisionamiento antes/después, incidentes evitados, etc.]

## Aprendizajes

[TODO: el dueño completa.]
`;

const rows = [
  {
    type: 'caso_estudio',
    locale: 'es',
    slug: 'trimia',
    project_slug: 'trimia',
    title: 'TrimIA — Asistente multi-agente de IA',
    excerpt:
      'Cómo diseñé un asistente de WhatsApp con RAG, colas de espera y múltiples agentes especializados para Credimisión S.R.L.',
    body: trimiaBody,
    images: JSON.stringify([]),
    status: 'published',
  },
  {
    type: 'caso_estudio',
    locale: 'es',
    slug: 'nube-privada',
    project_slug: 'nube-privada',
    title: 'Gestión y orquestación de nube privada',
    excerpt:
      'El middleware que construimos en equipo para que las cátedras de la UTN-FRT administren su propio cómputo sobre Proxmox VE, sin tocar el clúster.',
    body: nubePrivadaBody,
    images: JSON.stringify([]),
    status: 'published',
  },
];

const insert = db.prepare(`
  INSERT INTO content (type, locale, slug, project_slug, title, excerpt, body, images, status, source, read_time, published_at)
  VALUES (@type, @locale, @slug, @project_slug, @title, @excerpt, @body, @images, @status, 'site', @read_time, datetime('now'))
  ON CONFLICT (slug, locale) DO UPDATE SET
    title=excluded.title, excerpt=excluded.excerpt, body=excluded.body,
    images=excluded.images, status=excluded.status, read_time=excluded.read_time,
    updated_at=datetime('now')
`);

for (const row of rows) {
  insert.run({ ...row, read_time: readTime(row.body) });
  console.log(`✓ ${row.slug} (${row.locale})`);
}

db.close();
