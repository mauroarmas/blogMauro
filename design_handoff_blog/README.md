# Handoff: Blog personal — Mauro Armas

## Visión general
Diseño completo de un blog personal en modo oscuro premium, escalable a portfolio.
Tres pantallas: **Home**, **Detalle de post** y **Admin CRUD**.
El objetivo es que sirva cómodo en un contenedor de 128 MB de RAM.

## Sobre los archivos de diseño
Los archivos en `design/` son **prototipos de referencia en HTML** — no código de producción para copiar directamente.
Tu tarea es **recrear estos diseños dentro de tu proyecto Next.js existente** (App Router, JS, SQLite) usando los patrones y librerías que ya tienes establecidos.
Fidelidad: **Alta (hifi)** — colores, tipografía, espaciado e interacciones son definitivos. Recréalos pixel-perfect.

---

## 1 · Sistema de diseño

### 1.1 Fuentes (cargar con `next/font/google`)

```js
// src/app/layout.js
import { Newsreader, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'

const newsreader = Newsreader({
  subsets: ['latin'],
  axes: ['opsz'],
  weight: ['300','400','500','600'],
  style: ['normal','italic'],
  variable: '--font-serif',
  display: 'swap',
})
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400','500','600','700'],
  variable: '--font-sans',
  display: 'swap',
})
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400','500','600'],
  variable: '--font-mono',
  display: 'swap',
})

// Aplicar en <html>:
// className={`${newsreader.variable} ${hanken.variable} ${jetbrains.variable}`}
```

| Rol | Familia | Usos |
|-----|---------|------|
| Serif | Newsreader | Nombre hero, títulos de post, prosa, blockquote |
| Sans | Hanken Grotesk | UI labels, nav links, párrafos de extracto |
| Mono | JetBrains Mono | Metadata, tags, código, formularios, nav |

### 1.2 Tokens de color (pegar en `globals.css`)

```css
:root {
  --bg:          oklch(0.148 0.006 262);   /* fondo base profundo */
  --panel:       oklch(0.178 0.007 262);   /* panel/card */
  --panel2:      oklch(0.205 0.008 262);   /* panel elevado */
  --fg:          oklch(0.93  0.005 262);   /* texto principal */
  --fg-2:        oklch(0.80  0.008 262);   /* texto secundario */
  --mut:         oklch(0.62  0.010 262);   /* texto muted */
  --faint:       oklch(0.50  0.010 262);   /* texto muy sutil */
  --line:        oklch(1 0 0 / 0.08);      /* borde/divisor normal */
  --line-2:      oklch(1 0 0 / 0.045);     /* borde muy sutil */
  --accent:      oklch(0.82  0.075  80);   /* arena/dorado — acento principal */
  --accent-deep: oklch(0.70  0.085  70);   /* acento profundo (hover) */
  --accent-soft: oklch(0.82  0.075  80 / 0.10); /* fondo acento tenue */
  --ok:          oklch(0.80  0.13  158);   /* verde — indicador online */

  /* código — tokens de sintaxis */
  --t-com: oklch(0.50 0.010 262);   /* comentario */
  --t-kw:  oklch(0.82 0.075  80);   /* keyword — arena */
  --t-str: oklch(0.78 0.075 150);   /* string — verde suave */
  --t-num: oklch(0.80 0.090  45);   /* número — cálido */
  --t-fn:  oklch(0.83 0.045 235);   /* función — frío */
  --t-pun: oklch(0.62 0.010 262);   /* puntuación */

  --maxw: 1080px;
  --font-serif: var(--font-serif, 'Newsreader', Georgia, serif);
  --font-sans:  var(--font-sans,  'Hanken Grotesk', system-ui, sans-serif);
  --font-mono:  var(--font-mono,  'JetBrains Mono', ui-monospace, monospace);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-mono);
  -webkit-font-smoothing: antialiased;
}
body::before {
  content: "";
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(900px 360px at 50% -140px,
    oklch(0.82 0.075 80 / 0.06), transparent 70%);
}
```

### 1.3 Espaciado y layout

| Token | Valor |
|-------|-------|
| Container max-width | `1080px` |
| Container padding | `0 40px` |
| Nav height | `66px` |
| Border radius — panel | `12px` |
| Border radius — card pequeño | `6–8px` |
| Border radius — botón | `5–7px` |
| Gap — form grid | `14px` |
| Gap — admin shell | `32px` |

---

## 2 · Estructura de archivos sugerida

```
src/
├── app/
│   ├── layout.js            ← carga fuentes, Nav, globals
│   ├── page.js              ← Home (hero + índice de posts)
│   ├── posts/
│   │   └── [slug]/
│   │       └── page.js      ← Detalle de post
│   ├── admin/
│   │   └── page.js          ← Gestor CRUD
│   └── api/
│       └── posts/
│           ├── route.js     ← GET /api/posts · POST /api/posts  (ya existe)
│           └── [id]/
│               └── route.js ← GET · PUT · DELETE /api/posts/:id
├── components/
│   ├── Nav.js
│   ├── PostRow.js
│   ├── CodeBlock.js         ← usa shiki (ver §5)
│   └── AdminEditor.js       ← formulario create/edit (client component)
└── lib/
    └── db.js                ← ya existe
```

---

## 3 · Pantallas

### 3.1 Home — `src/app/page.js`

**Layout general:**
```
<body>
  <Nav />
  <main class="wrap">          ← max-width 1080px, margin auto, padding 0 40px
    <header class="hero">      ← display: grid, 2 cols: 190px | 1fr, gap 52px
      <aside class="ledger">   ← foto + datos técnicos
      <div class="hero-main">  ← nombre, rol, statement, newsletter
    <section>                  ← índice de posts
  <footer>
```

**Ledger (columna izquierda del hero):**
- `<img>` o `<Image>` (next/image) para foto de perfil: `width 100%, height 192px, border-radius 6px, object-fit cover`
- Bajo la foto: columna de metadatos con `border-left: 2px solid var(--accent)`, `padding-left 16px`
- Cada fila: label uppercase 11px `var(--faint)` + valor 12px `var(--fg-2)`
- Contenido: Rol / Estudia / Stack / Host / Posts

**Nombre (h1):**
- `font-family: var(--font-serif)`, `font-weight 430`, `font-size clamp(56px, 9vw, 104px)`, `line-height 0.94`, `letter-spacing -0.028em`
- "Mauro" en `var(--fg)`, "Armas" en `var(--accent)` + `font-style: italic`

**Rol:**
- `font-size 14px`, `color var(--mut)`, `letter-spacing 0.02em`
- Línea decorativa antes: `width 26px, height 1px, background var(--accent)`

**Statement (h2-like):**
- `font-family serif`, `font-size 30px`, `line-height 1.22`, `letter-spacing -0.01em`
- "aprendí" en `color var(--accent)` + `font-style italic`

**Lead (párrafo):**
- `font-family sans`, `font-size 17px`, `line-height 1.62`, `color var(--mut)`, `max-width 560px`

**Newsletter / RSS:**
- Flex row: `border 1px solid var(--line)`, `border-radius 3px`, `overflow hidden`
- Input: `background oklch(1 0 0 / 0.02)`, `font-family mono`, `font-size 13px`, `padding 14px 16px`, `flex 1`
- Botón: `background var(--accent)`, `color oklch(0.20 0.03 80)`, `font-weight 700`, `font-size 12px`, `padding 0 22px`
- Link RSS: `border-left 1px solid var(--line)`, `padding 0 16px`, `color var(--mut)`

**Índice de posts (tabla):**
- Grid: `50px 104px 1fr 116px 66px`, gap `20px`
- Header: `font-size 11px`, uppercase, `letter-spacing 0.1em`, `color var(--faint)`, `border-bottom 1px solid var(--line)`
- Cada fila: `padding 27px 0`, `border-bottom 1px solid var(--line)`, es `<a href>` con `text-decoration none`
- Hover: `background oklch(1 0 0 / 0.018)`, `padding-left 10px` (transition 0.16s), título cambia a `var(--accent)`
- Nº: `font-size 13px`, `color var(--accent)`, mono
- Tag: `font-size 12px`, `color var(--mut)`, mono
- Título: `font-family serif`, `font-size 23px`, `font-weight 400`, `letter-spacing -0.005em`
- Extracto: `font-family sans`, `font-size 14px`, `line-height 1.55`, `color var(--mut)`
- Fecha/Lectura: `font-size 12.5px`, `color var(--mut)`, mono

### 3.2 Detalle de post — `src/app/posts/[slug]/page.js`

**Layout:**
```
<Nav />
<article class="wrap">        ← max-width 1080px
  <div class="art-topbar">    ← flex, space-between: "← Volver" | "⬇ PDF"
  <header class="art-head">   ← max-width 720px, margin auto
  <div class="prose">         ← max-width 720px, margin auto
<div class="art-end">         ← siguiente artículo
<div class="art-sub">         ← newsletter
```

**Topbar:**
- Flex `justify-content space-between`, `padding-top 40px`
- Link volver: `display inline-flex`, `gap 8px`, `color var(--mut)`, hover → `var(--accent)`, con flecha ←
- Botón PDF: `border 1px solid var(--line)`, `border-radius 5px`, `font-family mono`, `font-size 12px`, `color var(--mut)`, hover → arena, con ícono ⬇. `onclick="window.print()"` (lógica real te la encargas tú)

**Cabecera del artículo:**
- Meta row: tag (`border 1px solid oklch(0.82 0.075 80 / 0.32)`, `padding 4px 10px`, `border-radius 4px`, `color var(--accent)`) · fecha · tiempo de lectura con ícono reloj · `#01`
- H1: `font-family serif`, `font-size clamp(38px, 5.4vw, 56px)`, `line-height 1.06`, `letter-spacing -0.022em`
- Deck/bajada: `font-family sans`, `font-size 19px`, `line-height 1.6`, `color var(--fg-2)`
- Autor: avatar `34×34px circle`, `background linear-gradient(145deg, var(--accent), var(--accent-deep))`, iniciales "MA" en bold

**Prosa:**
- `font-family serif`, `font-size 19.5px`, `line-height 1.72`, `color var(--fg-2)`
- `<h2>`: `font-family sans`, `font-size 15px`, uppercase, `letter-spacing 0.06em`, línea decorativa de `14px` antes
- `<h3>`: `font-family serif`, `font-size 26px`
- `<a>`: `color var(--accent)`, `border-bottom 1px solid`
- `<strong>`: `color var(--fg)`
- `<ul li>`: custom bullet — línea horizontal `7×1px` en `var(--accent)`, `padding-left 26px`
- `<blockquote>`: `border-left 2px solid var(--accent)`, `font-style italic`, `font-size 23px`, `color var(--fg)`
- `code` inline: `background var(--panel2)`, `color var(--accent)`, `padding 2px 7px`, `border-radius 4px`, `border 1px solid var(--line)`

**Bloque de código:**
- Container: `border 1px solid var(--line)`, `border-radius 8px`, `background var(--panel)`
- Barra superior: `height ~44px`, `padding 11px 16px`, `border-bottom 1px solid var(--line)`, muestra: tres puntos · nombre de archivo (var(--fg-2)) · lenguaje (var(--faint), uppercase, 10.5px)
- `<pre>`: `padding 20px 22px`, `font-size 13.5px`, `line-height 1.7`
- Tokens de color: ver §1.2 → `--t-com / --t-kw / --t-str / --t-num / --t-fn / --t-pun`
- **Recomendación**: usa [Shiki](https://shiki.style/) en server component con el tema `'vesper'` o crea uno custom con los tokens de arriba. Es zero-bundle-size en el cliente.

**Callout:**
- `border 1px solid var(--line)`, `border-left 2px solid var(--accent)`, `background var(--accent-soft)`, `border-radius 6px`, `padding 18px 20px`
- Etiqueta "nota" en `color var(--accent)`, mono, bold

### 3.3 Admin CRUD — `src/app/admin/page.js`

> Proteger con middleware de autenticación (Next-Auth, Lucia, o sesión simple con cookie HttpOnly). El diseño no incluye pantalla de login.

**Layout:**
```
<Nav />                          ← btn-admin con estado activo (border + color acento)
<div class="admin-shell">        ← display grid, 2 cols: 1fr 380px, gap 32px, padding 44px 0
  <section>                      ← tabla de publicaciones
  <aside class="editor-panel">   ← formulario sticky (top: 24px)
```

**Tabla de publicaciones:**
- Encabezado: botón "+ Nuevo post" a la derecha — `background var(--accent)`, `color oklch(0.20 0.03 80)`, `border-radius 6px`, `font-weight 700`, `font-size 12px`, mono
- Columnas: `40px | 80px | 1fr | 90px | 96px | 76px`  →  Nº · Tema · Artículo · Fecha · Estado · Acciones
- Badge Publicado: `color var(--accent)`, `background oklch(0.82 0.075 80 / 0.10)`, `border 1px solid oklch(0.82 0.075 80 / 0.28)`, punto de color
- Badge Borrador: `color var(--mut)`, `background oklch(1 0 0 / 0.03)`, `border 1px solid var(--line)`
- Botón editar: `30×30px`, hover → arena. Botón eliminar: hover → `oklch(0.65 0.18 22)` (rojo)

**Panel editor (sticky):**
- `border 1px solid var(--line)`, `border-radius 12px`, `background var(--panel)`, `padding 28px`
- Campos: Título (input), Categoría (select), Fecha (date), Extracto (textarea), Contenido (textarea grande — recibe Markdown/MDX)
- Toggle de estado: dos radio buttons estilizados como pestañas `flex 1fr 1fr`
- CTA: Publicar (fondo acento) · Guardar borrador (ghost) · Cancelar (link)
- Inputs: `background oklch(1 0 0 / 0.03)`, `border 1px solid var(--line)`, `border-radius 6px`, `font-family mono`, `font-size 13.5px`
- Focus: `border-color oklch(0.82 0.075 80 / 0.55)`, `box-shadow 0 0 0 3px oklch(0.82 0.075 80 / 0.08)`

---

## 4 · Nav — componente compartido

```
<nav>                            ← height 66px, border-bottom 1px solid var(--line)
  <div class="brand">            ← [mauroarmas.dev] — "[ ]" en var(--accent)
  <div class="nav-links">        ← ~/escritos · ~/rss.xml — font-size 12.5px sans
  <div class="nav-right">        ← flex, gap 18px
    <div class="status">         ← led verde + "online · 128 MB"
    <a href="/admin" btn-admin>  ← ícono lápiz + "admin"
                                   border 1px solid var(--line), hover → arena
                                   activo (current page): border + bg accent-soft + color accent
```

---

## 5 · API de posts — integración con el esquema existente

### Schema SQL sugerido (si no lo tienes ya en `init.sql`)

```sql
CREATE TABLE IF NOT EXISTS posts (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  slug      TEXT    NOT NULL UNIQUE,
  title     TEXT    NOT NULL,
  excerpt   TEXT,
  content   TEXT,           -- Markdown / MDX
  tag       TEXT,
  status    TEXT    NOT NULL DEFAULT 'draft',  -- 'published' | 'draft'
  read_time INTEGER,        -- minutos estimados
  published_at TEXT,        -- ISO 8601
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Endpoints sugeridos

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/api/posts` | lista todos (admin) o solo `status='published'` (público) |
| POST | `/api/posts` | crear post |
| GET | `/api/posts/[id]` | obtener uno |
| PUT | `/api/posts/[id]` | actualizar |
| DELETE | `/api/posts/[id]` | eliminar |

```js
// src/app/api/posts/[id]/route.js
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(_, { params }) {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(params.id)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}
export async function PUT(req, { params }) {
  const body = await req.json()
  db.prepare(`UPDATE posts SET title=?,excerpt=?,content=?,tag=?,status=?,
    published_at=?,updated_at=datetime('now') WHERE id=?`)
    .run(body.title,body.excerpt,body.content,body.tag,body.status,body.published_at,params.id)
  return NextResponse.json({ ok: true })
}
export async function DELETE(_, { params }) {
  db.prepare('DELETE FROM posts WHERE id = ?').run(params.id)
  return NextResponse.json({ ok: true })
}
```

---

## 6 · Notas de implementación

### Foto de perfil
Reemplaza el `<image-slot>` del prototipo por `<Image>` de `next/image`:
```jsx
import Image from 'next/image'
// ...
<Image src="/foto.jpg" width={190} height={192} alt="Mauro Armas"
  style={{ width:'100%', height:'192px', objectFit:'cover', borderRadius:'6px' }} />
```
Coloca tu foto en `public/foto.jpg`.

### Syntax highlighting (bloques de código)
Usa **Shiki** en server components — cero JavaScript al cliente:
```bash
npm install shiki
```
```jsx
// components/CodeBlock.js  (Server Component)
import { codeToHtml } from 'shiki'
export default async function CodeBlock({ code, lang, filename }) {
  const html = await codeToHtml(code, { lang, theme: 'vesper' })
  // Wrappear con la barra de archivo (filename, lang label, tres puntos)
  return (
    <div className="code">
      <div className="code-bar">...</div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
```
Ajusta los colores del tema `vesper` a los tokens de §1.2 si quieres coherencia exacta, o usa los tokens tal cual desde el CSS.

### PDF / Descarga del post
La forma más simple y ligera (0 deps extra): `window.print()` + CSS de impresión.
```css
@media print {
  .nav, .back, .btn-pdf, .art-end, .art-sub, footer { display: none; }
  body { background: white; color: black; }
  .prose { font-size: 12pt; }
}
```
Para un PDF con más control considera `puppeteer` en una ruta API o un servicio externo.

### `next.config.mjs` — standalone
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  experimental: { serverMinification: true },
}
export default nextConfig
```

### Estimación de tiempo de lectura
```js
// lib/readTime.js
export function readTime(content = '') {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))   // ~200 palabras/min
}
```

### Admin — componente cliente
El formulario del admin necesita estado de React → `'use client'`:
```jsx
// src/app/admin/page.js  o  components/AdminEditor.js
'use client'
import { useState } from 'react'
```

---

## 7 · Archivos de referencia

| Archivo | Descripción |
|---------|-------------|
| `design/index.html` | Home completo — referencia visual principal |
| `design/post.html` | Detalle de post con lectura y código |
| `design/admin.html` | Gestor CRUD (tabla + editor) |
| `design/styles.css` | Sistema completo de estilos — copiar tokens a globals.css |

> Abre los archivos `.html` directamente en el navegador para ver el diseño con fuentes e interacciones.
