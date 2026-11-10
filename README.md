# Portafolio — Mauro Armas

Portafolio profesional bilingüe (ES/EN) sobre desarrollo de software, redes, cloud e IA. Next.js 16 con App Router y exportación estática.

## Desarrollo

```bash
npm install
npm run dev
```

Abrir la dirección que indique Next.js (normalmente http://localhost:3000/es). El contenido se mantiene en archivos versionados; esta versión no requiere base de datos ni un panel de administración público.

## Inicio con Docker Compose

Para iniciar y apagar el entorno completo (Portafolio web + CV Studio) en contenedores sin instalar dependencias globales:

```bash
# Iniciar todos los servicios en segundo plano
npm run docker:up     # o: docker compose up -d

# Ver registros en tiempo real
npm run docker:logs   # o: docker compose logs -f

# Apagar todos los servicios
npm run docker:down   # o: docker compose down
```

* **Web (Next.js):** [http://localhost:3001/es](http://localhost:3001/es) (o puerto 3000 si está libre).
* **CV Studio:** [http://127.0.0.1:4317](http://127.0.0.1:4317).
* Los cambios en `src/` o `generador/` se reflejan en caliente gracias a los volúmenes montados. Los PDFs exportados se guardan directamente en `output/pdf/`.


## Contenido y estructura

```text
src/app/[lang]/     Páginas públicas en español e inglés
src/content/        Perfil, proyectos, formación y competencias
src/content/casos/  Casos de estudio y su índice
src/styles/         Paleta compartida por la web y el CV
src/components/     Componentes del portafolio
public/             Fotos, capturas, documentos y CV público
generador/         Panel privado de CV (servidor local independiente)
```

Editar los datos en `src/content/`. Para sumar un caso, agregar su archivo y registrarlo en `src/content/casos/index.js`. Los cambios públicos requieren volver a compilar y desplegar.

## Generador privado de CV

```bash
npm run cv:install
npm run cv:dev
```

Abrir **http://127.0.0.1:4317** para generar un PDF, guardar versiones, registrar ofertas y candidaturas manuales, revisar fuentes y configurar preferencias. La adaptación asistida requiere configurar y habilitar Gemini explícitamente. También se puede generar por terminal con `npm run cv:pdf`.

El módulo no se incluye en las rutas públicas. Los archivos generados se guardan fuera de `public/`, y el CV público se conserva hasta reemplazarlo deliberadamente. Instrucciones y fuentes compartidas en [generador/README.md](generador/README.md).

## Verificación y despliegue

```bash
npm run lint
npm run cv:test
npm run build -- --webpack
```

El build genera `out/`, listo para un hosting de archivos estáticos. Publicar únicamente esa carpeta. `next start` no corresponde al modo `output: 'export'` configurado. Se usa Webpack en el comando anterior porque en este entorno Turbopack presenta un problema con la resolución de `next/font/google`.

La especificación y las decisiones originales están en [specs/001-portafolio-profesional/](specs/001-portafolio-profesional/); algunas describen una arquitectura anterior a la exportación estática.

El diseño de la ampliación de CV Studio está en [el plan](specs/002-cv-job-studio/plan.md). La [constitución 2.0.0](.specify/memory/constitution.md) permite SQLite y Node/HTML/CSS para este módulo local de un propietario; el módulo es privado y local. La conexión a portales y las postulaciones quedan para una etapa posterior.
