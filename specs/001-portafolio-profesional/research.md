# Investigación Técnica: Portafolio Profesional con Perfil Dual

**Feature**: `001-portafolio-profesional` | **Fecha**: 2026-08-07

Este documento resuelve las incógnitas técnicas de la spec antes del diseño de datos.
Cada decisión se tomó consultando `node_modules/next/dist/docs/` (Next.js 16.2.7) por
mandato del Principio III de la constitución y de `AGENTS.md`, dado que esta versión se
aparta de convenciones conocidas por el modelo de entrenamiento.

## 1. Enrutamiento i18n (RF-023 a RF-026)

**Decisión**: Segmento dinámico `app/[lang]/` como raíz efectiva de la app, con
diccionarios de servidor (`app/[lang]/dictionaries/{es,en}.json`), siguiendo el patrón
oficial documentado en `node_modules/next/dist/docs/01-app/02-guides/internationalization.md`.

- `DEFAULT_LOCALE = 'es'`, `SUPPORTED_LOCALES = ['es', 'en']`.
- `app/[lang]/layout.js` es el **único** layout raíz (declara `<html lang={lang}>`) — no
  existe un `app/layout.js` separado por encima. Esto es lo que exige el patrón oficial:
  `generateStaticParams` en el layout genera `{lang:'es'}` y `{lang:'en'}`.
- `/admin` vive en `app/[lang]/admin/page.js` para compartir ese único layout raíz;
  como es una herramienta de un solo idioma (el dueño), el `proxy.js` normaliza
  `/admin` → `/es/admin` con una reescritura, sin exponerlo como ruta pública bilingüe.
- Un `proxy.js` en la raíz (ver §2) detecta el locale preferido solo para `/` (redirección
  a `/es` o `/en` según `Accept-Language`) y para la reescritura de `/admin`.
- Metadata por página usa `alternates.languages` (API de Next.js Metadata) para emitir los
  `<link rel="alternate" hreflang>` que exige RF-026 — es la señal que los motores de
  búsqueda usan para variantes de idioma, más confiable que solo el atributo `lang`.

**Alternativas consideradas**: librerías `next-intl` / `next-i18n-router`. Descartadas por
el Principio III (simplicidad): el sitio tiene un volumen de textos de UI pequeño y fijo;
una función `getDictionary(lang)` que hace `import()` de un JSON server-only (patrón
documentado oficialmente) cubre el 100% del caso sin dependencia nueva.

**Fallback de contenido editorial no traducido (RF-025)**: separado de los diccionarios de
UI. La función de acceso a datos `getContent(slug, lang)` intenta la fila del locale
pedido; si no existe, trae la fila del locale disponible y devuelve
`{ content, isFallback: true, availableLocale }`. La página renderiza un aviso visible
("Este contenido está disponible en español") en vez de 404 o mezcla silenciosa. Esto es
lógica de aplicación, no de Next.js — no hay patrón del framework que lo resuelva por
defecto.

## 2. Middleware → Proxy (hallazgo de breaking change)

**Decisión**: Next.js 16 renombró el archivo de convención `middleware.js` a `proxy.js`
(`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` y
`.../03-api-reference/03-file-conventions/proxy.md`). El proyecto usará `src/proxy.js`
(no `middleware.js`) para: detección de locale en `/` y reescritura de `/admin`.

**Por qué importa documentarlo**: es exactamente el tipo de desviación que `AGENTS.md`
advierte — el conocimiento de entrenamiento del modelo asume `middleware.js`, que en esta
versión ya no es la convención activa.

## 3. Autenticación de `/admin` (RF-032)

**Decisión**: sesión simple con cookie `HttpOnly` firmada, sin librería de autenticación
externa. Un formulario de login compara la contraseña contra un hash (`bcrypt` o
`scrypt` nativo de Node) guardado en variable de entorno, y en éxito setea una cookie
firmada (`crypto.createHmac`) con expiración corta. `app/[lang]/admin/layout.js` valida la
cookie en cada request y redirige a `/login` si falta o es inválida.

**Rationale**: el propio `design_handoff_blog/README.md` ya sugería esta opción
("Next-Auth, Lucia, o sesión simple con cookie HttpOnly"). Con un único usuario dueño del
sitio, una librería de auth completa (Next-Auth/Lucia) es complejidad no justificada bajo
el Principio III — sin roles, sin múltiples usuarios, sin proveedores OAuth que gestionar.

**Alternativas consideradas**: Next-Auth (rechazado: trae proveedores OAuth, adaptadores de
sesión y superficie de configuración que este caso de un solo usuario no necesita).

## 4. Alcance real de "gestión de contenido" (RF-027 a RF-031)

**Decisión**: solo la entidad **Contenido Editorial** (casos de estudio y, más adelante,
artículos) pasa por la interfaz de administración y la base de datos. **Proyecto**,
**Competencia Técnica**, **Formación** y **Perfil Profesional** se modelan como datos
estructurados versionados en el repositorio (`src/content/proyectos.js`,
`src/content/stack.js`, `src/content/formacion.js`, `src/content/perfil.js`, uno por
locale donde aplique), no como tablas con CRUD propio.

**Rationale**: RF-027 dice literalmente "el dueño DEBE poder crear, editar, publicar y
despublicar **contenidos**", y la sección de Entidades Clave define "Contenido Editorial"
como la pieza de texto extensa publicable — es la única entidad para la que la spec pide
explícitamente un flujo de publicación con estados de borrador. Los proyectos cambian un
puñado de veces al año (cuando el dueño termina uno nuevo); forzar un CRUD completo con
tablas, migraciones y pantallas de admin para datos que se editan a mano un par de veces al
año viola el Principio III (simplicidad: "no diseñar para requisitos hipotéticos futuros").
Un archivo de datos versionado en git da además historial de cambios gratis, algo que un
CRUD de base de datos no ofrece sin construirlo aparte.

**Consecuencia para RF-010a** ("incorporar medios de verificación adicionales sin
redesplegar"): dado que Proyecto es un archivo de datos y no una tabla, agregar una demo
grabada requiere una edición de código y un deploy. Esto es aceptable porque RF-010a exige
"sin *rehacer el contenido ya publicado*", no "sin deploy" — el requisito protege contra
tener que reescribir el caso de estudio entero, no contra un commit. Se documenta como
supuesto de implementación en `data-model.md`.

**Alternativas consideradas**: una tabla por entidad (Proyecto, Competencia, Formación).
Descartada por sobre-ingeniería frente a la cadencia real de cambio de esos datos.

## 5. Esquema de datos y capa `query()` existente

**Decisión**: reusar `src/lib/db.js` (adaptador dual Postgres/SQLite ya probado) para una
única tabla nueva, `content`, que reemplaza a `posts`. Se agrega una migración que crea
`content` con las columnas nuevas (ver `data-model.md`) y no migra las filas existentes de
`posts` — por RF-033 el contenido académico no debe ser visible en el sitio público
reorientado, así que no hay valor en preservarlo en la tabla nueva.

**Rationale**: `query()` ya resuelve la doble compatibilidad Postgres ($1) / SQLite (?) que
motivó su diseño original; no hay razón para tocar esa capa.

## 6. Fuentes: `next/font` vs. inyección manual de CSS

**Decisión**: migrar a `next/font/google` (`Newsreader`, `Hanken Grotesk`, `JetBrains
Mono`) tal como recomendaba el `design_handoff_blog/README.md` original, reemplazando el
`fs.readFileSync(globals.css)` + `dangerouslySetInnerHTML` actual de
`src/app/layout.js` por un `import './globals.css'` estándar.

**Rationale**: `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`
confirma que `next/font` auto-hospeda las fuentes (cero requests externos a Google Fonts) y
es zero-config con `next start`. El `fs.readFileSync` manual es un workaround (ver commits
`d7a3896`, `60a1a25`) para un problema de carga de chunks bajo el nginx específico de la
UTN — no un patrón de Next.js. Bajo Principio III, una vez que el hosting deja de estar
atado a ese nginx (ver §7), el workaround no tiene motivo para persistir.

## 7. Decisión de hosting (ya no atada a Proxmox)

**Decisión**: el target de despliegue pasa a ser cualquier host Node.js estándar servido
con `next start` detrás de un reverse proxy convencional (nginx genérico o el propio
Vercel), **sin** `basePath`/`assetPrefix` fijos y **sin** los workarounds de imagen en
base64. Esto es una decisión de infraestructura, no de código de features — se registra
aquí porque condiciona qué deuda técnica se retira en este plan.

**Deuda técnica que se retira** (ya no se justifica bajo el nuevo hosting):
- `basePath: '/44581626'` / `assetPrefix` en `next.config.mjs` — era la ruta asignada por
  la cátedra en el clúster Proxmox; un dominio o subdominio propio no la necesita.
- Imágenes convertidas a base64 inline (workaround de nginx del profesor, commit
  `d7a3896`) — con `next/image` y una ruta de assets normal, se sirven como archivos
  estáticos comunes.
- El "Server Component para bypasear bloqueo de chunks JS" (commit `60a1a25`) — era
  específico del nginx de la cátedra bloqueando ciertos chunks; no se reproduce en un
  hosting estándar.
- El forzado de IPv4 en la conexión a Postgres (commit `76d9cc7`) puede conservarse si el
  nuevo host de base de datos tiene el mismo comportamiento de resolución DNS — se marca
  para revalidar en el entorno de destino real, no se retira a ciegas.

**Rationale**: la propia constitución (Restricciones de Contenido y Tecnología) ya
establece que "el auto-hospedaje previo en Proxmox era una restricción de la materia, no
un requisito del producto" y que las decisiones de hosting deben guiarse por
confiabilidad, costo y mantenimiento. Cada workaround retirado aquí tiene un commit que
documenta que existía específicamente por el nginx/clúster de la UTN, no por una necesidad
de Next.js en sí.

**Nota para el dueño**: esta investigación recomienda el cambio de hosting pero no elige el
proveedor final (Vercel, VPS propio, etc.) — es una decisión de costo/preferencia personal
fuera del alcance técnico de este plan. El código queda escrito para funcionar en
cualquiera de las dos opciones estándar.

## 8. Ubicación final del CV

**Decisión**: `public/cv/cv-mauro-armas-desarrollo.pdf`, sirviendo como archivo estático. Se
elimina la carpeta `public/CVS/` (nombre inconsistente en mayúsculas/estructura anidada por
CV) una vez migrado el PDF.

**Actualización posterior a la implementación inicial**: el dueño decidió que el sitio
distribuya únicamente el CV orientado a desarrollo — para roles de infraestructura/redes
prefiere ser contactado directo por correo o LinkedIn. `public/cv/cv-mauro-armas-infraestructura.pdf`
se removió del repositorio; el archivo sigue existiendo como documento propio del dueño
fuera del sitio. Esto reemplaza al RF-022 original (CV según el filtro de área activo).

**Rationale**: es un archivo estático descargable (RF-021/RF-022), no contenido
editorial — no necesita pasar por la base de datos ni por `next/image`.
