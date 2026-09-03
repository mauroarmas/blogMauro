---

description: "Task list for Portafolio Profesional con Perfil Dual"
---

# Tasks: Portafolio Profesional con Perfil Dual

**Input**: Documentos de diseño desde `/specs/001-portafolio-profesional/`

**Prerequisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (todos presentes)

**Tests**: No solicitados explícitamente en la spec ni por el usuario. No hay framework de
tests automatizados en el proyecto (ver plan.md, Contexto Técnico). La validación es
manual, guiada por `quickstart.md` — se referencia como tarea final de cada historia en
vez de tareas de test formales.

**Organización**: Tareas agrupadas por historia de usuario (spec.md), en orden de
prioridad P1→P5, para poder implementar y validar cada una de forma independiente.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencia de una tarea sin terminar)
- **[Story]**: Historia de usuario a la que pertenece (US1..US5)
- Cada tarea incluye la ruta de archivo exacta

## Convención de rutas

Proyecto único (Next.js App Router) en la raíz del repo — ver "Estructura del Proyecto" en
`plan.md`. Todas las rutas son relativas a `/home/mauro/Proyectos/Portafolio`.

---

## Phase 1: Setup

**Propósito**: preparar el terreno sin tocar aún rutas ni datos de contenido.

- [X] T001 Crear el directorio `src/content/` (vacío, para los módulos de datos estructurados de Foundational)
- [X] T002 [P] Crear `.env.example` con `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` documentados (contracts/i18n-and-auth.md)
- [X] T003 [P] Mover `public/CVS/CV-Desarrollo/*.pdf` → `public/cv/cv-mauro-armas-desarrollo.pdf` y `public/CVS/CV-Redes/*.pdf` → `public/cv/cv-mauro-armas-infraestructura.pdf`; eliminar `public/CVS/` (research.md §8)

**Checkpoint**: estructura base lista, sin romper el sitio actual (que sigue sirviendo desde `src/app/page.js` sin cambios).

---

## Phase 2: Foundational (Prerrequisitos Bloqueantes)

**Propósito**: infraestructura compartida por las 5 historias — enrutamiento `[lang]`, datos
estructurados y esquema de base de datos. Ninguna historia puede empezar antes de que esto
esté completo.

**⚠️ CRÍTICO**: no iniciar ninguna Phase 3+ hasta cerrar esta fase.

- [X] T004 [P] Retirar `basePath`/`assetPrefix` de `next.config.mjs` (research.md §7 — deuda de Proxmox/UTN que ya no aplica)
- [X] T005 [P] Crear `src/proxy.js` (reemplaza al rol de `middleware.js`, renombrado en Next.js 16 — research.md §2): detecta locale preferido para `/` → redirect a `/es` o `/en`; reescribe `/admin*` → `/es/admin*`
- [X] T006 [P] Crear `src/content/proyectos.js` con los 4 proyectos (TrimIA, Nube Privada, Guardia Médica, Red Social de Trabajos) siguiendo la forma de data-model.md §2 — incluye `areas`, `priority`, `role`, `verification[]` (con `available:false` donde no exista aún el medio), `stack`, `i18n.es`
- [X] T007 [P] Crear `src/content/stack.js` con las competencias agrupadas por `layer` (backend/frontend/datos/infra_cloud/ia) y `areas`, sin campo de nivel de dominio (data-model.md §3, RF-005)
- [X] T008 [P] Crear `src/content/formacion.js` con UTN-FRT y Rolling Code School (data-model.md §4)
- [X] T009 [P] Crear `src/content/perfil.js` con el objeto `es` (nombre, posicionamiento, ubicación, modalidad, descripción ≤4 líneas, contacto, rutas de CV) — el objeto `en` se completa en T040 (US4)
- [X] T010 [P] Crear `src/app/[lang]/dictionaries/es.json` con las claves de UI: nav, hero, secciones, filtros, contacto, admin-login (contracts/i18n-and-auth.md)
- [X] T011 [P] Crear `src/app/[lang]/dictionaries/en.json` con las mismas claves que T010, en inglés
- [X] T012 `src/app/[lang]/layout.js`: layout raíz único (reemplaza a `src/app/layout.js`) — `next/font/google` para Newsreader/Hanken Grotesk/JetBrains Mono, `<html lang={lang}>`, `generateStaticParams` para `es`/`en`, `import './globals.css'` estándar (retira el `fs.readFileSync` + `dangerouslySetInnerHTML` actual, research.md §6). No renderiza `<Nav/>` global — cada ruta pública decide su propio header (ver T014, T049) (depende de T010, T011)
- [X] T013 Actualizar `init.sql` para crear la tabla `content` en vez de `posts` (data-model.md §1, columnas `type`/`locale`/`project_slug`/`images`/`source`/`source_ref`) y agregar el `CREATE TABLE IF NOT EXISTS content (...)` equivalente en el bootstrap SQLite de `src/lib/db.js` para que `npm run dev` funcione en un clon nuevo sin migración manual

**Checkpoint**: rutas `[lang]` resolubles, datos estructurados disponibles, esquema de base
de datos listo. Las historias de usuario pueden empezar.

---

## Phase 3: User Story 1 — Evaluación rápida del reclutador (Priority: P1) 🎯 MVP

**Goal**: Home completa (Hero, Proyectos sin filtro interactivo, Stack, Formación, Sobre
mí, Contacto) legible y verificable en 60 segundos, responsive, sin rastro académico.

**Independent Test**: entregar la URL de `/es` a alguien que no conoce al dueño; en 60
segundos debe poder indicar rol, tres tecnologías, un proyecto y un medio de contacto
(quickstart.md §1–2).

### Implementación de la Historia 1

- [X] T014 [P] [US1] Adaptar `src/components/Nav.js` para la Home pública: marca, links de sección, botón de CV (sin selector de idioma todavía — eso es T036/US4) — referencia visual `nuevasPantallas/blogportfolio/site/portafolio.html` líneas 48–61
- [X] T015 [P] [US1] Crear `src/components/ProjectCard.js`: renderiza nombre, contexto, problema, rol (individual/equipo de N), stack como tags, y solo los `verification[]` con `available:true` (RF-010b) — usa `next/image` para la miniatura, no base64 (research.md §7)
- [X] T016 [US1] Implementar sección Hero en `src/app/[lang]/page.js` desde `src/content/perfil.js` + `src/content/stack.js`: nombre, posicionamiento de una línea, ubicación/modalidad, chips de stack como texto seleccionable, CTAs (RF-001 a RF-003, RF-007)
- [X] T017 [US1] Agregar sección Proyectos a `src/app/[lang]/page.js` (sin filtro interactivo aún): lista ordenada por `priority` desde `proyectos.js`, usando `ProjectCard` (RF-008 a RF-012)
- [X] T018 [US1] Agregar sección Stack por capa a `src/app/[lang]/page.js` desde `stack.js`, sin barras de porcentaje (RF-004, RF-005)
- [X] T019 [US1] Agregar sección Formación a `src/app/[lang]/page.js` desde `formacion.js`
- [X] T020 [US1] Agregar sección Sobre mí a `src/app/[lang]/page.js` desde `perfil.js` (máx. 4 líneas, RF-006)
- [X] T021 [US1] Agregar sección Contacto a `src/app/[lang]/page.js`: email como texto copiable, enlaces a perfiles públicos, descarga de CV en ≤2 interacciones con la versión por defecto (RF-019 a RF-022 — CV por área específica queda para T035/US3)
- [X] T022 [P] [US1] Integrar los estilos de `nuevasPantallas/blogportfolio/site/portafolio.css` en `src/app/globals.css` (mismos tokens OKLCH ya existentes — extender, no reemplazar) incluyendo los breakpoints responsive de 900px/620px (CE-010)
- [X] T023 [US1] Auditar la Home nueva contra RF-007: sin edad, sin foto tipo carnet destacada, sin ninguna referencia al origen académico del sitio

**Checkpoint**: Home funcional y testeable de forma independiente (quickstart.md §1–2).
Puede demostrarse/desplegarse aquí como MVP.

---

## Phase 4: User Story 2 — Validación técnica en profundidad (Priority: P2)

**Goal**: página de caso de estudio dedicada para TrimIA y Nube Privada, con problema,
arquitectura, ≥3 decisiones justificadas, resultado, aprendizajes y material visual.

**Independent Test**: entregar la URL de un caso de estudio a un desarrollador senior;
debe poder enumerar las decisiones de arquitectura y su justificación (quickstart.md §3).

### Implementación de la Historia 2

- [X] T024 [P] [US2] Implementar `src/lib/content.js`: `getPublishedContent({locale, type})` y `getContentBySlug(slug, {locale, type})` con la lógica de fallback de contracts/content-api.md (busca el locale pedido; si no hay fila publicada, trae la de cualquier locale y marca `isFallback:true`)
- [X] T025 [P] [US2] Crear `src/components/CaseStudyImage.js`: wrapper de `next/image` con `alt` obligatorio y posicionamiento dentro del cuerpo (RF-016a)
- [X] T026 [US2] Implementar `src/app/[lang]/proyectos/[slug]/page.js`: `notFound()` si el proyecto no tiene `hasCaseStudy` o no hay contenido publicado en ningún locale (RF-017); renderiza el cuerpo Markdown (react-markdown + remark-gfm + `CodeBlock` existente con shiki) con problema/arquitectura/decisiones/resultado/aprendizajes, imágenes vía `CaseStudyImage`, link de retorno y contacto (RF-016, RF-018) (depende de T024, T025)
- [X] T027 [US2] Actualizar `src/components/ProjectCard.js` (de US1) para mostrar el link "Caso de estudio" solo cuando `hasCaseStudy && content publicado` exista (RF-017) (depende de T015, T026)
- [X] T028 [US2] Insertar en la base de datos (vía script SQL directo o inserción manual temporal) las dos filas iniciales de `content` (`type='caso_estudio'`, `locale='es'`, `status='published'`) para `trimia` y la Nube Privada, con la estructura problema/arquitectura/≥3 decisiones/resultado/aprendizajes, para que quickstart.md §3 sea ejecutable — el texto final de cada caso lo redacta el dueño; esta tarea deja el andamiaje y placeholders claramente marcados
- [X] T029 [US2] Revisar el material visual y el texto cargado en T028 contra RF-016b (sin datos reales de clientes, credenciales ni información sensible de los sistemas en producción)

**Checkpoint**: casos de estudio funcionales e independientes (quickstart.md §3).

---

## Phase 5: User Story 3 — Filtrado por área profesional (Priority: P3)

**Goal**: filtro Todos/Desarrollo/Infraestructura sobre la sección de Proyectos, con estado
reflejado en la URL y CV descargable acorde al área activa.

**Independent Test**: seleccionar cada área y verificar que el conjunto de proyectos
corresponde a la clasificación; copiar la URL con filtro aplicado y confirmar que persiste
al recargar (quickstart.md §2, §4).

### Implementación de la Historia 3

- [X] T030 [US3] Crear `src/components/ProjectFilter.js` (Client Component): botones con `aria-pressed`, operables por teclado, que actualizan el query param `area` sin recargar la página (RF-013, RF-014, RF-035)
- [X] T031 [US3] Integrar `ProjectFilter` en la sección Proyectos de `src/app/[lang]/page.js`: lee `searchParams.area` en el Server Component para el filtrado inicial server-side y sincroniza con el filtro cliente (depende de T017, T030)
- [X] T032 [US3] Implementar el estado vacío ("No hay proyectos publicados en esta área todavía") cuando el filtro no deja resultados (caso límite de spec.md)
- [X] T033 [US3] Conectar el botón de CV de `Nav.js`/Contacto al área activa: `area=desarrollo` → CV de desarrollo, `area=infraestructura` → CV de infraestructura, sin área → versión por defecto (RF-022) (depende de T014, T021, T030)

**Checkpoint**: filtrado funcional e independiente (quickstart.md §2, §4).

---

## Phase 6: User Story 4 — Lectura en inglés (Priority: P4)

**Goal**: selector de idioma, `hreflang` correcto, contenido traducido con aviso explícito
cuando falta traducción (nunca mezcla silenciosa).

**Independent Test**: acceder a la variante en inglés de cada página; el contenido sin
traducir muestra un aviso explícito, no una página vacía ni una mezcla sin avisar
(quickstart.md §5).

### Implementación de la Historia 4

- [X] T034 [P] [US4] Agregar el selector ES/EN a `src/components/Nav.js`: enlaza a la misma ruta bajo el otro prefijo de locale, preservando el resto del path (RF-023, RF-024) (depende de T014)
- [X] T035 [P] [US4] Agregar `generateMetadata` con `alternates.languages` (hreflang) a `src/app/[lang]/page.js` y `src/app/[lang]/proyectos/[slug]/page.js` (RF-026)
- [X] T036 [US4] Reemplazar los textos de UI hardcodeados en `src/app/[lang]/page.js` y `Nav.js` por `getDictionary(lang)` (T010/T011) (RF-023) (depende de T034)
- [X] T037 [US4] Implementar el aviso de fallback en `src/app/[lang]/proyectos/[slug]/page.js` usando `isFallback`/`availableLocale` de `getContentBySlug` (T024): "Este contenido está disponible en español" en vez de 404 o mezcla (RF-025) (depende de T024, T026)
- [X] T038 [US4] Completar el objeto `en` en `src/content/perfil.js` y los campos `i18n.en` de `src/content/proyectos.js` (name/context/problem) — traducción del contenido estático (RF-023)
- [X] T039 [US4] Verificar paridad de claves entre `dictionaries/es.json` y `dictionaries/en.json` (mismo conjunto de keys) antes de dar la historia por cerrada

**Checkpoint**: sitio bilingüe funcional e independiente (quickstart.md §5).

---

## Phase 7: User Story 5 — Mantenimiento del contenido por el dueño (Priority: P5)

**Goal**: el dueño puede crear/editar/publicar/despublicar Contenido Editorial desde un
panel autenticado, sin tocar código ni redesplegar.

**Independent Test**: crear, editar y despublicar un contenido desde el admin y verificar
que el cambio se refleja en el sitio público sin reiniciar el servidor (quickstart.md §6).

### Implementación de la Historia 5

- [X] T040 [P] [US5] Implementar `src/lib/auth.js`: verificación de contraseña contra hash (`ADMIN_PASSWORD_HASH`) y firma/verificación de cookie de sesión HMAC (`ADMIN_SESSION_SECRET`) — contracts/i18n-and-auth.md
- [X] T041 [US5] Implementar `src/app/api/auth/login/route.js` (POST, setea cookie `portfolio_session` HttpOnly) y `src/app/api/auth/logout/route.js` (depende de T040)
- [X] T042 [P] [US5] Implementar `src/app/api/content/route.js` (GET lista con auth, POST crear con validaciones de data-model.md §1: `type`∈{caso_estudio,articulo}, `locale`∈{es,en}, `project_slug` existente si `caso_estudio`, `source_ref` requerido si `source≠site`) — reemplaza a `src/app/api/posts/route.js` (depende de T013, T040)
- [X] T043 [P] [US5] Implementar `src/app/api/content/[id]/route.js` (GET/PUT/DELETE con auth) — reemplaza a `src/app/api/posts/[id]/route.js` (depende de T013, T040)
- [X] T044 [US5] Implementar `src/app/[lang]/admin/layout.js`: valida la cookie de sesión, redirige a `/es/admin/login` si falta o es inválida (RF-032) (depende de T040)
- [X] T045 [US5] Implementar `src/app/[lang]/admin/login/page.js`: formulario que llama a `POST /api/auth/login` (depende de T041)
- [X] T046 [US5] Implementar `src/app/[lang]/admin/page.js`: tabla de contenidos + panel editor adaptado de `nuevasPantallas/blogportfolio/site/admin.html`, con los campos nuevos (`type`, `locale`, `projectSlug` — select poblado desde `proyectos.js`, `images[]`, `source` de solo lectura) — header propio, no reutiliza `Nav.js` público (RF-027, RF-029, RF-030, RF-031) (depende de T042, T043, T006)
- [X] T047 [US5] Conectar el toggle borrador/publicado y el botón eliminar con confirmación en el editor (RF-028) (depende de T046)

**Checkpoint**: administración funcional e independiente (quickstart.md §6).

---

## Phase 8: Polish & Cross-Cutting Concerns

**Propósito**: retirar el sitio académico legado y verificar la calidad transversal una
vez que todas las historias deseadas están completas.

- [X] T048 Eliminar `src/app/page.js`, `src/app/posts/[slug]/page.js`, `src/app/admin/page.js`, `src/app/api/posts/route.js`, `src/app/api/posts/[id]/route.js`, `src/app/layout.js` — ya superados por sus equivalentes bajo `src/app/[lang]/` (RF-033) (depende de que todas las historias deseadas estén cerradas)
- [X] T049 [P] Ejecutar `npx eslint src/` y corregir cualquier hallazgo introducido por el código nuevo (quickstart.md §7)
- [X] T050 [P] Auditoría de navegación por teclado y contraste AA en Home, caso de estudio y admin (RF-035, CE-007, quickstart.md §7)
- [X] T051 [P] Verificar legibilidad del contenido principal con JavaScript deshabilitado en Home y caso de estudio (RF-036, quickstart.md §7)
- [X] T052 Ejecutar la validación completa de `quickstart.md` (§1 a §8) de punta a punta y registrar resultados
- [X] T053 [P] Actualizar `README.md` para describir el portafolio profesional (marcado como pendiente en el Sync Impact Report de la constitución v1.1.0)

---

## Dependencies & Execution Order

### Dependencias entre fases

- **Setup (Phase 1)**: sin dependencias — puede arrancar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA a las 5 historias
- **Historias de usuario (Phase 3–7)**: todas dependen de Foundational; entre ellas:
  - US1 no depende de ninguna otra historia
  - US2 depende de datos de US1 (`ProjectCard.js`, T015) solo para el link condicional (T027); el resto de US2 es independiente
  - US3 depende de la sección Proyectos de US1 (T017) para integrarse, pero es un incremento aislado
  - US4 depende de `Nav.js` (T014, US1) y de `getContentBySlug` (T024, US2) para el aviso de fallback
  - US5 es la más independiente: solo comparte el esquema de `content` (Foundational) y `proyectos.js` (Foundational) con US2
- **Polish (Phase 8)**: depende de que las historias que se vayan a entregar estén completas; T048 en particular debe ser la última tarea (retira el sitio legado)

### Oportunidades de paralelismo

- Todas las tareas [P] de Foundational (T004–T011, T013) pueden correr en paralelo entre sí
- Dentro de US1: T014 y T015 en paralelo; T022 en paralelo con el resto (archivo distinto)
- Dentro de US2: T024 y T025 en paralelo
- Dentro de US4: T034 y T035 en paralelo
- Dentro de US5: T040 en paralelo con nada (bloquea a T041–T044); T042 y T043 en paralelo entre sí
- Con más de una persona: US1 y (una vez cerrada Foundational) preparar en paralelo el andamiaje de US5 (T040–T043, que no toca `page.js`) mientras otra persona hace US1

---

## Implementation Strategy

### MVP primero (Historia 1 únicamente)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (crítico — bloquea todo lo demás)
3. Completar Phase 3: Historia 1
4. **Parar y validar**: correr quickstart.md §1–2 de forma independiente
5. Desplegar/demostrar el MVP aquí si se desea

### Entrega incremental

1. Setup + Foundational → base lista
2. + US1 → validar → MVP demostrable (Home completa)
3. + US2 → validar → los dos casos de estudio en profundidad quedan online
4. + US3 → validar → filtrado por área
5. + US4 → validar → sitio bilingüe
6. + US5 → validar → el dueño ya no depende de un deploy para publicar contenido editorial
7. Phase 8 → se retira el sitio académico legado y el portafolio profesional queda como
   único sitio público

Cada historia suma valor sin romper la anterior — el sitio académico legado (`src/app/page.js`
actual) sigue funcionando en paralelo hasta T048, así que no hay ventana sin sitio público.

---

## Notes

- [P] = archivos distintos, sin dependencia de una tarea sin terminar
- El sitio académico actual permanece intacto y sirviendo hasta T048 (última tarea) — no
  hay riesgo de dejar el portafolio sin contenido público durante la implementación
- T028 deja placeholders de contenido claramente marcados para que quickstart.md sea
  ejecutable antes de que el dueño termine de redactar los casos de estudio reales
- El texto final de los casos de estudio, las traducciones al inglés de contenido largo, y
  el material visual (diagramas/capturas) son responsabilidad del dueño — las tareas de
  código dejan la estructura lista para recibirlos, no los redactan
