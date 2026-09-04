# Portafolio — Mauro Armas

Portafolio profesional bilingüe (ES/EN) orientado a empleabilidad, sobre los tres ejes
del CV: **desarrollo de software**, **redes** y **cloud**. Construido con Next.js 16 (App
Router), reemplazando el blog académico original de la materia de Virtualización.

Ver la especificación completa, el modelo de datos y las decisiones técnicas en
[`specs/001-portafolio-profesional/`](specs/001-portafolio-profesional/).

## Empezar

```bash
npm install
cp .env.example .env.local   # ver variables abajo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) — redirige a `/es` o `/en` según el
idioma del navegador.

Sin `DATABASE_URL` en `.env.local`, el proyecto usa SQLite local
(`local_blog.db`, creado automáticamente). Con `DATABASE_URL`, usa PostgreSQL.

### Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Opcional. Con valor → Postgres; sin valor → SQLite local. |
| `ADMIN_PASSWORD_HASH` | Hash (scrypt) de la contraseña del panel `/admin`. Generar con: `node -e "console.log(require('crypto').scryptSync(process.argv[1], 'portfolio-salt', 64).toString('hex'))" "tu-contraseña"` |
| `ADMIN_SESSION_SECRET` | Secreto para firmar la cookie de sesión del admin. Cualquier cadena larga y aleatoria. |

### Cargar los casos de estudio iniciales (solo desarrollo local)

```bash
node scripts/seed-content.mjs
```

Carga TrimIA y la Nube Privada en la base local. El cuerpo tiene marcadores `[TODO]` en
las secciones de justificación técnica — están pendientes de que el dueño las complete
con las decisiones reales (ver `specs/001-portafolio-profesional/tasks.md`, T028).

## Estructura

```text
src/
├── app/[lang]/            # Rutas públicas (es/en) + admin
├── content/                # Proyectos, stack, formación, perfil — datos versionados
├── components/             # Nav, ProjectCard, ProjectFilter, CaseStudyImage, etc.
├── lib/                    # db.js (adaptador Postgres/SQLite), content.js, auth.js
└── proxy.js                 # Detección de locale + reescritura de /admin
```

## Administración de contenido

`/admin` (redirige a `/es/admin`) permite crear, editar, publicar y despublicar casos de
estudio sin redeploy. Proyectos, stack y formación se editan en `src/content/` y sí
requieren un commit + deploy (decisión documentada en
`specs/001-portafolio-profesional/research.md`, §4).

## Despliegue

El destino de hosting ya no está atado a Proxmox/UTN (ver constitución del proyecto,
`.specify/memory/constitution.md`). Cualquier host Node.js estándar sirve con:

```bash
npm run build
npm start
```

## Aprender más sobre Next.js

- [Documentación de Next.js](https://nextjs.org/docs)
- [Next.js Learn](https://nextjs.org/learn)
