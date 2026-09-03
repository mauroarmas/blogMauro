# Guía de Validación: Portafolio Profesional con Perfil Dual

**Feature**: `001-portafolio-profesional`

Escenarios ejecutables que prueban la feature de punta a punta, mapeados a los
Escenarios de Aceptación de `spec.md`. No sustituye a `tasks.md` (que detalla la
implementación) — esto es lo que se corre para comprobar que quedó bien hecho.

## Prerrequisitos

```bash
npm install
cp .env.example .env.local   # ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET
npm run dev
```

Sin `DATABASE_URL` en `.env.local`, `src/lib/db.js` usa SQLite local — suficiente para
todos los escenarios de esta guía.

## 1. Lectura rápida del reclutador (Historia 1 / RF-001 a RF-007)

```bash
curl -s http://localhost:3000/es | grep -o 'Desarrollador Full-Stack e Infraestructura Cloud'
curl -s http://localhost:3000/es | grep -oE 'NestJS|React|Proxmox VE'   # texto plano, no imagen
```
**Esperado**: ambos comandos devuelven coincidencias — el posicionamiento y el stack están
en el HTML como texto, no solo en un `<canvas>` o SVG rasterizado.

Abrir `http://localhost:3000/es` en un viewport de 360px de ancho (DevTools →
responsive) y confirmar visualmente: sin scroll horizontal (CE-010), CTAs de "Ver
proyectos / GitHub / CV" visibles sin scroll vertical en desktop ≥1280px.

## 2. Tarjetas de proyecto (RF-008 a RF-014)

```bash
curl -s http://localhost:3000/es | grep -c 'class="proj'
```
**Esperado**: `4` (los cuatro proyectos de `src/content/proyectos.js`).

En el navegador: aplicar el filtro "Infraestructura" → la URL cambia a
`/es?area=infraestructura` (RF-014); recargar esa URL directamente y confirmar que el
filtro sigue aplicado (prueba de que el estado es recuperable por enlace, no solo por
estado de React en memoria).

## 3. Caso de estudio (Historia 2 / RF-015 a RF-018)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/es/proyectos/trimia
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/es/proyectos/red-social-trabajos
```
**Esperado**: `200` para `trimia` (tiene caso de estudio); `404` para
`red-social-trabajos` (no lo tiene — RF-017: no debe existir una página vacía).

En el HTML de `/es/proyectos/trimia`, confirmar presencia de al menos 3 bloques con
justificación técnica (buscar el patrón de encabezado "Por qué" o equivalente usado en el
contenido real) y de un enlace de retorno a proyectos.

## 4. Filtro por área y CV único (Historia 3 / RF-019 a RF-022)

En el navegador, con el filtro "Infraestructura" activo, el botón de descarga de CV en la
nav debe seguir apuntando al único CV que el sitio distribuye (RF-022):
```bash
curl -s "http://localhost:3000/es?area=infraestructura" | grep -o 'cv-mauro-armas-desarrollo.pdf'
curl -s "http://localhost:3000/es?area=infraestructura" | grep -c 'cv-mauro-armas-infraestructura.pdf'   # debe dar 0
```

## 5. Bilingüe sin mezcla silenciosa (Historia 4 / RF-023 a RF-026)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en
curl -s http://localhost:3000/es/proyectos/trimia | grep -o 'hreflang="en"'
```
**Esperado**: `200`; y el `link rel=alternate hreflang` presente en la respuesta española
(RF-026).

Para probar RF-025 (fallback), crear un caso de estudio en el admin solo en español,
visitar `/en/proyectos/<ese-slug>` y confirmar que la página **no** da 404 y muestra el
aviso de "disponible en español" en vez de mezclar textos en inglés y español sin avisar.

## 6. Publicar contenido sin redeploy (Historia 5 / RF-027 a RF-033)

1. Ir a `http://localhost:3000/es/admin/login`, autenticarse con la contraseña de
   `.env.local`.
2. Crear un contenido nuevo con `type=caso_estudio`, `projectSlug=trimia`, `status=draft`.
3. Confirmar que **no** aparece en `http://localhost:3000/es/proyectos/trimia` (RF-028: un
   borrador no es público) — si `trimia` ya tenía un caso de estudio publicado, ese sigue
   siendo el que se muestra.
4. Cambiar `status` a `published` desde el editor, sin reiniciar `npm run dev`.
5. Recargar `/es/proyectos/trimia` y confirmar que el contenido nuevo ya se sirve —
   prueba CE-009 (publicar en menos de 15 minutos, sin redeploy).

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/es/admin
# sin cookie de sesión:
```
**Esperado**: redirección a `/es/admin/login` (RF-032).

## 7. Calidad transversal (RF-034 a RF-037)

```bash
npx eslint src/
```
**Esperado**: `0 errors` (warnings preexistentes de `<img>` son aceptables si no se tocó
ese archivo; cualquier página nueva debe usar `next/image` y no generar ese warning).

Con JavaScript deshabilitado en el navegador (DevTools → "Disable JavaScript"), recargar
`/es` y `/es/proyectos/trimia`: el texto principal (nombre, proyectos, casos de estudio)
debe seguir siendo legible (RF-036).

Navegación solo con teclado (Tab) en `/es`: el foco debe ser visible en cada CTA, cada
botón de filtro y cada enlace de proyecto, en orden lógico (RF-035, CE-007).

## 8. Verificación de la constitución

```bash
grep -n "44581626" next.config.mjs   # debe no encontrar nada tras retirar basePath (research.md §7)
grep -rn "readFileSync.*globals.css" src/app/layout.js   # debe no encontrar nada (research.md §6)
```
