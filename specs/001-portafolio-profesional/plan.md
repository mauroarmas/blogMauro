# Implementation Plan: Portafolio Profesional con Perfil Dual

**Branch**: `001-portafolio-profesional` | **Fecha**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de funcionalidad desde `/specs/001-portafolio-profesional/spec.md`

## Resumen

Reorientar el portafolio de un blog académico (materia de virtualización, alojado en
Proxmox) a un portafolio profesional bilingüe que representa el perfil dual del dueño
(Desarrollo + Infraestructura/Redes) mediante una Home unificada con filtro por área, dos
casos de estudio en profundidad, y un motor de contenido reorientado a publicar esos casos
sin necesidad de redeploy.

Enfoque técnico: reusar la maqueta hifi ya provista en
`nuevasPantallas/blogportfolio/site/portafolio.html` + `portafolio.css` como referencia
visual exacta de la Home (construida sobre los mismos tokens OKLCH que ya viven en
`src/app/globals.css`); introducir enrutamiento `app/[lang]/` para el bilingüe (patrón
oficial de Next.js 16, ver `research.md` §1); reemplazar la tabla `posts` por una tabla
`content` con discriminador de tipo y locale (ver `data-model.md`); modelar Proyectos,
Stack, Formación y Perfil como datos estructurados versionados en el repo en lugar de
tablas nuevas (decisión de simplicidad, `research.md` §4); y retirar los workarounds de
hosting específicos de Proxmox/UTN (`basePath`, imágenes base64, CSS inyectado a mano) que
ya no se justifican bajo la constitución.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022+), Next.js 16.2.7 (App Router), React 19.2.4

**Dependencias principales**: `better-sqlite3` (dev), `pg` (prod), `react-markdown` +
`remark-gfm` (render de casos de estudio), `shiki` (resaltado de código en casos de
estudio con bloques técnicos), `next/font/google` (Newsreader, Hanken Grotesk, JetBrains
Mono — ya en uso, se completa la migración desde la inyección manual actual)

**Almacenamiento**: PostgreSQL en producción / SQLite en desarrollo, vía el adaptador dual
ya existente en `src/lib/db.js` (sin cambios en esa capa); una tabla nueva `content`
reemplaza a `posts`. Proyectos/Stack/Formación/Perfil como módulos JS versionados en
`src/content/` (no DB) — ver `research.md` §4 y `data-model.md`.

**Testing**: `eslint` (ya configurado) para calidad estática; validación manual guiada por
`quickstart.md` para los escenarios de aceptación (no hay framework de tests automatizados
en el proyecto actual — introducir uno queda fuera de alcance de esta feature, ya que la
spec no lo exige y el Principio III desalienta agregar infraestructura no solicitada).

**Plataforma objetivo**: Navegador (SSR/RSC de Next.js) en un host Node.js estándar
(`next start`), ya no atado al clúster Proxmox de la UTN — ver `research.md` §7.

**Tipo de proyecto**: Aplicación web (Next.js App Router, monolito frontend+backend en el
mismo proyecto, patrón "single project" ya establecido en el repo).

**Objetivos de rendimiento**: CE-004 (contenido esencial visible en <2,5s en conexión
móvil de gama media); Core Web Vitals sin regresión (Principio IV de la constitución).

**Restricciones**: CE-007 (operable 100% por teclado, contraste AA); CE-006 (cero mezcla
de idiomas sin aviso); CE-010 (sin scroll horizontal a 360px); sin JavaScript de cliente
no esencial (RF-036).

**Escala/Alcance**: Sitio personal de bajo tráfico, un solo administrador de contenido, 4
proyectos, 2 casos de estudio iniciales, 2 locales. 6 secciones de Home + 1 plantilla de
caso de estudio + panel de administración con login.

## Constitution Check

*GATE: Debe pasar antes de la Fase 0. Re-chequeado después del diseño de la Fase 1.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Señal Profesional Dual | La Home unificada con filtro por área (RF-013) y la maqueta ya construida representan ambos perfiles sin subordinar uno a otro. RF-033 retira el contenido académico de la vista pública. | ✅ PASA |
| II. Integridad de Proyectos y Credenciales | `data-model.md` embebe `verification[]` por proyecto con `available: false` para medios aún no producidos (RF-010b) — nunca se anuncia lo que no existe. Los 4 proyectos usan repos reales del dueño. | ✅ PASA |
| III. Simplicidad y Ajuste al Framework (NO NEGOCIABLE) | Se consultó `node_modules/next/dist/docs/` para i18n, fonts, proxy y self-hosting antes de decidir (research.md). Se evitó una librería de i18n externa y una librería de auth externa a favor de los patrones nativos de Next.js. Proyectos/Stack/Formación como archivos versionados en vez de tablas CRUD nuevas — menos superficie, no más. | ✅ PASA |
| IV. Rendimiento y Accesibilidad | `quickstart.md` §7 valida teclado, contraste y legibilidad sin JS. `next/image` reemplaza el workaround de base64. | ✅ PASA |
| V. Propiedad y Vigencia del Contenido | El flujo borrador→publicado (RF-027/028) y el fallback de traducción sin mezcla silenciosa (RF-025) sostienen esto en el tiempo. | ✅ PASA |

**Hallazgo importante para el dueño (no es una violación, pero cambia expectativas)**:
`research.md` §4 decide que Proyecto/Stack/Formación/Perfil **no** tendrán CRUD en el
admin — se editan como código versionado. Esto significa que sumar un proyecto nuevo
requiere un commit + deploy, no un formulario. Se decidió así por el Principio III (esos
datos cambian pocas veces al año; un CRUD completo para eso es complejidad no pedida por
ninguna historia de usuario de la spec, que solo exige el flujo de publicación para
Contenido Editorial). Si el dueño prefiere poder editar proyectos sin tocar código, es una
ampliación de alcance a discutir antes de `/speckit-tasks`, no un defecto de este plan.

No hay violaciones que requieran la tabla de Complexity Tracking.

## Estructura del Proyecto

### Documentación (esta feature)

```text
specs/001-portafolio-profesional/
├── plan.md              # Este archivo
├── research.md          # Fase 0 — decisiones técnicas y su rationale
├── data-model.md         # Fase 1 — esquema de `content` + datos estructurados
├── contracts/
│   ├── content-api.md    # /api/content y funciones de lectura server-side
│   └── i18n-and-auth.md  # Mapa de rutas [lang], sesión de admin, diccionarios
├── quickstart.md         # Fase 1 — escenarios de validación end-to-end
└── checklists/
    └── requirements.md   # Ya generado por /speckit-specify
```

### Código fuente (raíz del repositorio)

**Decisión de estructura**: proyecto único (Next.js App Router), sin separación
frontend/backend — ya es el patrón establecido en `src/`. Se reorganiza `src/app/` para
anidar todo bajo `[lang]/` (requerido por el patrón de i18n oficial, `research.md` §1) y
se agrega `src/content/` para los datos estructurados versionados.

```text
src/
├── proxy.js                          # NUEVO — reemplaza el rol de middleware.js (research.md §2)
├── content/                          # NUEVO — datos estructurados versionados (no DB)
│   ├── proyectos.js
│   ├── stack.js
│   ├── formacion.js
│   └── perfil.js
├── lib/
│   ├── db.js                         # SIN CAMBIOS — adaptador dual ya funcional
│   ├── content.js                    # NUEVO — getPublishedContent, getContentBySlug (fallback RF-025)
│   ├── auth.js                       # NUEVO — verificación/firma de cookie de sesión (RF-032)
│   └── readTime.js                   # NUEVO — estimación de tiempo de lectura (ya sugerido en handoff original)
├── components/
│   ├── Nav.js                        # ADAPTADO — agrega selector ES/EN y CTA de CV dinámico
│   ├── CodeBlock.js                  # SIN CAMBIOS
│   ├── PrintButton.js                # SIN CAMBIOS
│   ├── ProjectFilter.js              # NUEVO — Client Component, filtro por área (RF-013/014)
│   ├── ProjectCard.js                # NUEVO
│   └── CaseStudyImage.js             # NUEVO — wrapper de next/image con alt obligatorio (RF-016a)
└── app/
    ├── globals.css                   # SIN CAMBIOS estructurales — portafolio.css se integra aquí
    └── [lang]/
        ├── layout.js                 # NUEVO — único layout raíz, <html lang>, next/font, generateStaticParams
        ├── dictionaries/
        │   ├── es.json
        │   └── en.json
        ├── page.js                   # Home — reemplaza a src/app/page.js actual
        ├── proyectos/
        │   └── [slug]/
        │       └── page.js           # Caso de estudio — reemplaza a posts/[slug]/page.js
        └── admin/
            ├── layout.js             # NUEVO — valida sesión, redirige a /login
            ├── page.js                # ADAPTADO desde admin/page.js actual (nuevos campos: type, locale, projectSlug, images)
            └── login/
                └── page.js           # NUEVO
└── app/api/
    ├── auth/
    │   ├── login/route.js            # NUEVO
    │   └── logout/route.js           # NUEVO
    └── content/
        ├── route.js                   # RENOMBRADO desde api/posts/route.js, columnas nuevas
        └── [id]/route.js              # RENOMBRADO desde api/posts/[id]/route.js

public/
├── cv/
│   └── cv-mauro-armas-desarrollo.pdf  # MOVIDO desde public/CVS/CV-Desarrollo/ — único CV
│                                        # que el sitio distribuye (decisión posterior del
│                                        # dueño); el de infraestructura/redes no se publica
└── img/proyectos/                     # NUEVO — capturas y diagramas de los casos de estudio
```

**Archivos retirados**: `src/app/page.js`, `src/app/posts/[slug]/page.js`,
`src/app/admin/page.js` (todos reemplazados por sus equivalentes bajo `[lang]/`);
`public/informe-tpf.pdf` (ya eliminado en la ronda de clarificación de la spec);
`public/CVS/` (una vez movidos los PDFs a `public/cv/`).

**Cambios en `next.config.mjs`**: retirar `basePath`/`assetPrefix` (research.md §7).

## Complexity Tracking

*Sin violaciones de la constitución que requieran justificación en esta tabla.*
