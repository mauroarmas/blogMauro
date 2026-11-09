# CV Studio local

El portafolio y el CV leen los mismos datos. Este módulo usa HTML/CSS de impresión y Chromium para producir PDFs A4 con texto seleccionable, enlaces activos, foto opcional y las tipografías Newsreader, Hanken Grotesk y JetBrains Mono. La paleta proviene de `src/styles/tokens.css`, compartida con la web. El HTML de referencia se conserva intacto como inspiración; no se usa como base de datos.

## Abrir el panel

Desde la raíz del repositorio:

```bash
npm install
npm run cv:install  # solo la primera vez, o tras actualizar Playwright
npm run cv:dev
```

Abrir **http://127.0.0.1:4317**. El sitio Next.js no necesita estar abierto. Para usar otro puerto: `CV_PORT=4318 npm run cv:dev`.

Elegí idioma, proyectos y fotografía. La URL opcional de tu portafolio agrega enlaces a los casos de estudio y a los informes públicos. Debe ser la dirección base, sin `/es`, `/en`, parámetros ni fragmentos. Sin esa URL, se mantienen los enlaces externos disponibles (contacto y demos), y se omiten los enlaces relativos que un lector del PDF no podría abrir.

**Actualizar desde el portafolio** relee los archivos y añade proyectos nuevos a la selección. **Descargar PDF** también relee el contenido antes de exportar, incluso si editaste un archivo después de abrir la vista previa. El navegador guarda el resultado en su carpeta de descargas.

No hace falta reiniciar el módulo al editar el contenido. Los cambios en su propio código de servidor sí requieren reiniciarlo. La selección y las opciones duran mientras la pestaña esté abierta; no se guardan versiones paralelas de la biografía.

## Una sola fuente de contenido

| Archivo | Información usada en el CV |
|---|---|
| `src/content/perfil.js` | Nombre, rol, introducción, biografía, contacto, idiomas y ruta de la fotografía |
| `src/content/proyectos.js` | Proyectos, prioridad, resumen (`i18n.*.problem`), contexto, fechas, equipo, tecnologías, reconocimiento y enlaces |
| `src/content/formacion.js` | Estudios y certificaciones |
| `src/content/stack.js` | Competencias y sus grupos |
| `src/styles/tokens.css` | Colores compartidos con la web |
| `public/mauro.png` | Foto original, indicada por el perfil |

Al actualizar una ficha o sumar un proyecto en `proyectos.js`, el generador lo incorpora automáticamente. Editá ambas traducciones si querés el cambio en español e inglés. Los casos largos y sus documentos siguen en `src/content/casos/` y `public/assets/`; el CV usa la síntesis de la ficha, y puede enlazar al caso completo. Cambiar solo el cuerpo de un caso no reescribe automáticamente su resumen.

La plantilla no recorta los textos ni reduce la letra para forzar una sola página: mide el contenido con las fuentes reales y agrega páginas según sea necesario. Mantiene los proyectos juntos siempre que entren en una página; divide bloques excepcionalmente largos por párrafos o palabras. Si un elemento no se puede paginar, muestra un error en vez de exportarlo cortado.

Los módulos de `src/content/` consumidos son exports de datos puros, sin imports relativos. Se cargan por contenido para evitar datos obsoletos por el caché de Node.

## Generar desde la terminal

```bash
npm run cv:pdf
npm run cv:pdf -- --locale en --no-photo
npm run cv:pdf -- --projects nube-privada,trimia --portfolio-url https://tu-portafolio.com
npm run cv:pdf -- --output output/pdf/CV-postulacion.pdf
```

Se guardan un PDF y un HTML autónomo en `output/pdf/`. El HTML lleva fuentes y foto embebidas; puede abrirse para revisar la composición. Ambos se regeneran cada vez y sus archivos están excluidos de Git. La exportación funciona sin red después de instalar las dependencias y Chromium.

La función reutilizable es `generatePdf(options)` en `generador/lib/pdf.mjs`: devuelve `{ pdf, html, pages, revision }`. Opciones: `locale`, `projects` (slugs; omitido incluye todos, `[]` no incluye ninguno), `photo` y `portfolioUrl`.

## Privacidad y publicación

El servidor escucha **solo en 127.0.0.1**. Valida Host y Origin y exige un token del panel para exportar. Solo sirve rutas definidas del módulo; no expone el sistema de archivos. No hay ruta del generador en Next.js ni enlaces desde la web pública. Al desplegar el portafolio, se publica únicamente `out/`.

No exponer este servidor mediante túneles, proxies públicos ni un servidor que publique la raíz del repositorio. Es una herramienta local, sin autenticación multiusuario.

Generar un PDF no reemplaza el CV descargable del sitio. Después de revisar una versión, podés copiarla deliberadamente a la ruta indicada por `getCvPath()` en `perfil.js` (actualmente `public/cv/CV-Armas_Maurov2.pdf`) y volver a compilar/desplegar. Así una prueba del generador no se publica por accidente.

## Verificación

```bash
npm run cv:test
npm run lint
npm run build -- --webpack
```

Las pruebas cubren actualización de archivos sin reinicio, proyectos nuevos, traducciones, selección, escape de contenido, paginación extensa, límites A4, privacidad del servidor y el flujo de vista previa/descarga. Para revisar el resultado impreso, renderizar el PDF con `pdftoppm` y comprobar todas las páginas.

`assets/cv.css` define la composición impresa; `assets/paginate.js`, la distribución de contenido; `assets/studio.*`, el panel local. Las fuentes están instaladas localmente vía Fontsource.

El diseño de la ampliación de CV Studio está en [el plan](../specs/002-cv-job-studio/plan.md). La [constitución 2.0.0](../.specify/memory/constitution.md) permite SQLite y Node/HTML/CSS para este módulo local de un propietario; esta autorización no implica que la ampliación ya esté implementada.
