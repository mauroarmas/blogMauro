# Modelo de Datos: Portafolio Profesional con Perfil Dual

**Feature**: `001-portafolio-profesional` | **Fecha**: 2026-08-07

Ver `research.md` §4 para el razonamiento detrás de la división entre lo que vive en base
de datos (una sola entidad, con flujo de publicación) y lo que vive como datos
estructurados versionados en el repositorio.

## Resumen de dónde vive cada entidad de la spec

| Entidad de la spec (spec.md) | Dónde vive | Por qué |
|---|---|---|
| Contenido Editorial | Tabla `content` (Postgres/SQLite vía `query()`) | Única entidad con flujo borrador→publicado (RF-027, RF-028) |
| Proyecto | `src/content/proyectos.js` | Cambia pocas veces al año; sin flujo de borrador propio |
| Medio de Verificación | Campo embebido en `proyectos.js` (array por proyecto) | Sub-dato de Proyecto, no tiene ciclo de vida propio |
| Recurso Visual | Campo `images` (JSON) en `content` para casos de estudio | Vinculado 1:1 al contenido editorial que ilustra |
| Competencia Técnica | `src/content/stack.js` | Cambia solo cuando el dueño aprende algo nuevo |
| Formación | `src/content/formacion.js` | Cambia una o dos veces al año |
| Perfil Profesional | `src/content/perfil.js` (uno por locale) | Texto de posicionamiento, editado a mano ocasionalmente |
| Área Profesional | Enum compartido `'desarrollo' \| 'infraestructura'` | Usado como tag en Proyecto y Competencia Técnica |

---

## 1. Tabla `content` (base de datos, reemplaza a `posts`)

```sql
CREATE TABLE IF NOT EXISTS content (
  id            SERIAL PRIMARY KEY,              -- INTEGER PRIMARY KEY AUTOINCREMENT en SQLite
  type          VARCHAR(20)  NOT NULL,            -- 'caso_estudio' | 'articulo'
  locale        VARCHAR(5)   NOT NULL,            -- 'es' | 'en'
  slug          VARCHAR(255) NOT NULL,
  project_slug  VARCHAR(255),                     -- referencia lógica a proyectos.js; NULL si type='articulo'
  title         VARCHAR(255) NOT NULL,
  excerpt       TEXT,
  body          TEXT,                             -- Markdown
  images        TEXT,                             -- JSON: [{ url, alt, position }]
  status        VARCHAR(20)  NOT NULL DEFAULT 'draft',   -- 'draft' | 'published'
  source        VARCHAR(20)  NOT NULL DEFAULT 'site',    -- 'site' | 'linkedin' (reservado, fuera de alcance)
  source_ref    VARCHAR(255),                     -- id externo cuando source != 'site'
  read_time     INTEGER,
  published_at  TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (slug, locale)
);
```

**Validaciones de aplicación** (no todas expresables en SQL con el adaptador dual):
- `type` ∈ {`caso_estudio`, `articulo`} — RF-030.
- `locale` ∈ {`es`, `en`} — RF-023/RF-029.
- `status` ∈ {`draft`, `published`} — RF-028.
- Si `type = 'caso_estudio'`, `project_slug` DEBE existir en `src/content/proyectos.js` — RF-015/RF-018.
- Si `type = 'articulo'`, `project_slug` DEBE ser `NULL`.
- `source = 'site'` ⟹ `source_ref` DEBE ser `NULL`; `source != 'site'` ⟹ `source_ref` DEBE existir — RF-031.
- Un mismo `slug` puede repetirse entre locales distintos (es la forma en que dos filas
  representan traducciones del mismo contenido), pero no dos veces en el mismo locale.

**Relación con RF-025 (fallback de traducción)**: la consulta de un caso de estudio busca
primero `(slug, locale_pedido)`; si no hay fila publicada, busca `(slug, cualquier_locale)`
y la devuelve marcada como fallback. Ver `contracts/content.md`.

**Migración desde `posts`**: se crea `content` desde cero; las filas de `posts` (contenido
académico) no se copian, por RF-033. `init.sql` se actualiza para crear `content` en lugar
de `posts`; el archivo `local_blog.db` de desarrollo se recrea.

---

## 2. `src/content/proyectos.js` (datos estructurados, no DB)

```js
// Forma de cada elemento del array exportado
{
  slug: 'trimia',
  areas: ['desarrollo'],                 // ⊆ ['desarrollo', 'infraestructura']
  priority: 1,                           // orden de exhibición, menor = primero (RF-008)
  status: 'en_curso',                    // 'en_curso' | 'finalizado' (RF-012)
  period: { start: '2026-04', end: null },
  role: { mode: 'individual', teamSize: null },   // 'individual' | 'equipo' (RF-009)
  hasCaseStudy: true,                    // controla si se renderiza el link de detalle (RF-017)
  verification: [                        // Medio de Verificación embebido (RF-010, RF-010b)
    { type: 'repositorio', url: 'https://github.com/mauroarmas/trimia', available: true },
    { type: 'informe', url: '/docs/informe-trimia.pdf', available: true },
    { type: 'demo', url: null, available: false }   // no se renderiza mientras available=false
  ],
  stack: ['Gemini API', 'NestJS', 'LangChain', 'RAG', 'BullMQ (Redis)'],
  i18n: {
    es: { name: '...', context: '...', problem: '...' },
    en: { name: '...', context: '...', problem: '...' }
  }
}
```

**Validaciones de aplicación**:
- `areas` no puede estar vacío — RF-011.
- `hasCaseStudy = true` ⟹ debe existir una fila `content` con `type='caso_estudio'` y
  `project_slug` igual a este `slug` para al menos un locale — si no, el link no se
  muestra (evita el caso límite de "página de detalle vacía").
- Cada entrada de `verification` con `available: false` no se renderiza (RF-010b); se
  agrega dejando `available: true` cuando el dueño produzca el medio, sin tocar el resto.

## 3. `src/content/stack.js`

```js
{ name: 'NestJS', layer: 'backend', areas: ['desarrollo'] }
```
`layer` ∈ {`backend`, `frontend`, `datos`, `infra_cloud`, `ia`} — RF-004. Sin campo de
nivel de dominio, por RF-005.

## 4. `src/content/formacion.js`

```js
{ title: 'Ingeniería en Sistemas de Información', institution: 'UTN — FRT',
  period: { start: '2021-04', end: null }, status: 'en_curso', verification: null }
```

## 5. `src/content/perfil.js`

Un objeto por locale: nombre, posicionamiento de una línea, ubicación, modalidad,
descripción breve (máx. 4 líneas — RF-006), correo, enlaces a perfiles públicos, y la ruta
al único CV que el sitio distribuye (`/cv/cv-mauro-armas-desarrollo.pdf` — RF-022; el CV de
infraestructura/redes existe como documento del dueño pero no se sirve desde el sitio).

## 6. Diagrama de relaciones (lógicas, no FK de base de datos)

```
content (DB)  ──project_slug (lógico, sin FK)──>  proyectos.js
   │
   └─ images[] (embebido)

proyectos.js
   ├─ verification[] (embebido)
   └─ stack[] (referencia por nombre a stack.js, sin validación estricta)
```

No hay claves foráneas reales entre `content` y `proyectos.js` porque viven en sistemas de
almacenamiento distintos (DB vs. archivo versionado); la validación de integridad
(`project_slug` debe existir) se hace en tiempo de build/request en la capa de acceso a
datos, no en el motor de base de datos.
