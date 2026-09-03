# Contrato: Rutas y sesión

## Mapa de rutas públicas

| Ruta | Página | Fuente de datos |
|---|---|---|
| `/[lang]` | Home (Hero, Stack, Proyectos+filtro, Formación, Sobre mí, Contacto) | `src/content/*.js` |
| `/[lang]?area=desarrollo\|infraestructura` | Home con filtro aplicado (RF-013/RF-014) | idem, filtrado client-side sobre el mismo payload |
| `/[lang]/proyectos/[slug]` | Caso de estudio | `getContentBySlug` + `proyectos.js` |
| `/[lang]/admin` | Listado + editor de contenido | `/api/content` |
| `/[lang]/admin/login` | Formulario de acceso | cookie de sesión |

`/` (sin locale) y `/admin` (sin locale) son reescritos por `src/proxy.js`:
- `/` → `/{locale_detectado}` según `Accept-Language`, con `es` como default si no matchea.
- `/admin*` → `/es/admin*` siempre (herramienta de un solo idioma).

## Contrato de sesión de administración (RF-032)

- Cookie `portfolio_session`, `HttpOnly`, `Secure` (en producción), `SameSite=Lax`,
  valor = HMAC-SHA256 firmado de `{ exp }` con secreto en `process.env.ADMIN_SESSION_SECRET`.
- `POST /api/auth/login` con `{ password }` → compara contra hash en
  `process.env.ADMIN_PASSWORD_HASH`; éxito setea la cookie (expiración 7 días); fallo →
  `401`, sin distinguir "usuario" de "contraseña" (no hay usuario, es un solo dueño).
- `POST /api/auth/logout` limpia la cookie.
- Cualquier ruta bajo `/[lang]/admin` (excepto `/login`) y cualquier método no-`GET` bajo
  `/api/content` validan la cookie en un layout de servidor (`app/[lang]/admin/layout.js`)
  o al inicio del handler de ruta; inválida o ausente → redirect a `/es/admin/login` (para
  páginas) o `401` (para la API).

## Contrato de diccionario de UI (RF-023, RF-024)

`app/[lang]/dictionaries/{es,en}.json` — mismas claves en ambos archivos (invariante
verificado por un test de paridad de claves, ver `quickstart.md`). `getDictionary(lang)`
es `server-only`; nunca se importa desde un Client Component completo, solo los textos
resueltos se pasan como props.

El selector de idioma (RF-023) enlaza a la misma ruta bajo el otro prefijo de locale
(`/en/proyectos/trimia` ↔ `/es/proyectos/trimia`), preservando el resto del path — RF-024.
