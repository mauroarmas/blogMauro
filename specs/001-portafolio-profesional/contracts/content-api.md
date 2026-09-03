# Contrato: API de Contenido Editorial (`/api/content`)

Reemplaza a `/api/posts` y `/api/posts/[id]`. Usada exclusivamente por
`app/[lang]/admin/` (cliente autenticado); no es una API pública. Sigue el mismo formato
de `src/app/api/posts/route.js` actual (JSON, `NextResponse`).

## `GET /api/content`

Query params opcionales: `status` (`draft` | `published`), `locale`, `type`.

Sin autenticación válida (RF-032) → `401`. Con autenticación:

```json
// 200 OK
[
  {
    "id": 1, "type": "caso_estudio", "locale": "es", "slug": "trimia",
    "projectSlug": "trimia", "title": "...", "excerpt": "...",
    "status": "published", "source": "site", "sourceRef": null,
    "readTime": 6, "publishedAt": "2026-08-01T00:00:00Z",
    "updatedAt": "2026-08-01T00:00:00Z"
  }
]
```
`body` e `images` se omiten en la respuesta de lista (solo en el detalle) para no inflar
el payload de la tabla del admin.

## `POST /api/content`

Requiere autenticación (RF-032). Body:

```json
{
  "type": "caso_estudio", "locale": "es", "slug": "trimia", "projectSlug": "trimia",
  "title": "...", "excerpt": "...", "body": "## Markdown...",
  "images": [{ "url": "/img/trimia-arch.png", "alt": "Arquitectura de TrimIA", "position": 1 }],
  "status": "draft"
}
```

Validaciones (RF-030/RF-031, ver `data-model.md` §1) antes de insertar:
- `type` inválido → `400 { "error": "type debe ser caso_estudio o articulo" }`
- `type='caso_estudio'` sin `projectSlug`, o `projectSlug` que no existe en
  `src/content/proyectos.js` → `400`
- `locale` fuera de `['es','en']` → `400`
- `(slug, locale)` ya existente → `409`

`201` con el registro creado en éxito.

## `GET /api/content/[id]`, `PUT /api/content/[id]`, `DELETE /api/content/[id]`

Mismo contrato que hoy `src/app/api/posts/[id]/route.js`, extendido a las columnas nuevas.
`DELETE` es la vía para "despublicar" definitivamente (RF-027); despublicar sin borrar es
`PUT` con `status: 'draft'`.

Todas requieren autenticación; `404` si el `id` no existe.

---

# Contrato: Lectura pública de contenido (uso interno, Server Components)

No es HTTP — son funciones de `src/lib/content.js` que los Server Components llaman
directamente (sin round-trip HTTP, por RF-036: el contenido debe ser legible sin JS).

## `getPublishedContent({ locale, type })`

Devuelve solo filas `status='published'` del locale pedido, ordenadas por
`published_at DESC`. Usada por el listado de casos de estudio si se necesitara en el
futuro; hoy los casos de estudio se acceden por slug directo desde `proyectos.js`.

## `getContentBySlug(slug, { locale, type })`

Implementa el fallback de RF-025 descrito en `research.md` §1:

```ts
type Result =
  | { found: true, isFallback: false, locale: string, content: Content }
  | { found: true, isFallback: true, requestedLocale: string, availableLocale: string, content: Content }
  | { found: false }
```

`found: false` → la página llama `notFound()` de Next.js (caso genuino: el slug no existe
en ningún locale, no un caso de traducción faltante).
