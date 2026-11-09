# Research: CV Studio — primera etapa

Fecha: 2026-11-08. Alcance: FR-001–FR-025. Decisiones de producto confirmadas en [spec.md](spec.md), D-001–D-007. Investigación realizada con lectura del proyecto, documentación primaria y comprobaciones locales sin invocar proveedores de IA ni cuentas de empleo.

## R-01. Extender el módulo local existente

**Decision:** conservar el servidor HTTP de `generador/server.mjs`, sus páginas privadas y el render HTML/CSS/Chromium. Separar servicios de aplicación del transporte para que panel y CLI compartan las mismas reglas. Interfaz local modular con HTML semántico, CSS y JavaScript; no migrar esta entrega a las rutas públicas de Next.

**Rationale:** el sitio usa exportación estática, mientras CV Studio ya funciona en loopback. Mantener esa frontera permite historial y datos privados sin cambiar el despliegue del portafolio. Se consultó `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` antes de diseñar la frontera.

**Alternatives considered:** convertir el sitio público completo a servidor dinámico agrega despliegue y autenticación remota que no se solicitaron; crear una segunda aplicación Next o un frontend con compilación independiente agrega otro ciclo de mantenimiento. La estructura local puede modularizarse sin introducirlos.

## R-02. Persistencia local con SQLite y artefactos dentro de la misma base

**Decision:** `.cv-studio/studio.sqlite`, excluido de Git y de `public/`/`out/`, con metadatos relacionales y BLOB deduplicados por SHA-256. Usar `node:sqlite` del runtime Node 24.16.x, con migraciones versionadas, claves foráneas y transacciones breves.

**Rationale:** un propietario, 100 oportunidades/200 versiones como volumen de aceptación y PDFs actuales de cientos de KB permiten guardar documentos y asociaciones de forma atómica. En el entorno se verificaron Node 24.16.0, SQLite 3.53.0, `DatabaseSync` y `backup()`. El módulo está clasificado release candidate en esa versión: se registra el riesgo, se fija la versión probada y se aísla en persistencia. [Node SQLite 24.16.0](https://nodejs.org/download/release/v24.16.0/docs/api/sqlite.html)

**Alternatives considered:** PostgreSQL impone servicio y credenciales adicionales; JSON suelto dificulta asociaciones, consistencia e historial; base más directorio de blobs obliga a coordinar dos almacenes; `better-sqlite3` agrega dependencia nativa cuando el runtime ya ofrece lo necesario.

**Constitution consequence:** la auditoría detectó el conflicto con la restricción 1.1.0. La enmienda explícita 2.0.0 permite este uso cotidiano local y monousuario; ya no depende de una dispensa en Complexity Tracking. Revisar de nuevo antes de acceso remoto/multiusuario.

## R-03. Versiones inmutables y render desde datos congelados

**Decision:** guardar PDF exacto, HTML autónomo, modelo de render, opciones, oferta, preferencias, evidencia y revisión de presentación. Una nueva edición produce otra versión con referencia a su antecesora. La descarga devuelve bytes guardados.

**Rationale:** `generatePdf()` hoy relee las fuentes y la CLI sobrescribe nombres estables; esas funciones necesitan un límite nuevo de render desde snapshot. El hash visual actual de 12 caracteres no sustituye un manifiesto con rutas, versiones de extractores y SHA-256 completos.

**Alternatives considered:** regenerar al descargar pierde fidelidad histórica; usar únicamente el hash de Git omite archivos sin commit, documentos adjuntos y opciones de presentación. Mantener las descargas actuales de `output/pdf/` es válido como copia de conveniencia, no como almacén histórico.

## R-04. Corpus explícito de evidencia

**Decision:** incorporar los cuatro módulos profesionales, cinco casos publicados y PDFs profesionales enlazados por esos casos o por verificaciones de tipo informe. El corpus observado incluye cuatro PDFs, aproximadamente 3,5 MB. Agregar las aportaciones privadas confirmadas por el propietario como evidencia diferenciada.

**Rationale:** el usuario quiere reutilizar este proyecto, no importar automáticamente todo su equipo. El lector actual solo usa cuatro módulos y no alcanza todavía la documentación de proyectos.

**Alternatives considered:** indexar todo el repositorio mezcla fuentes profesionales con dependencias, CV derivados, ofertas y configuración. Se excluyen expresamente secretos, históricos de CV, `output/`, `.cv-studio/` como corpus indiscriminado y el HTML de referencia.

**Consistency:** crear una copia congelada de los módulos confiables permitidos, evaluar esa copia en un proceso de ingestión nuevo y conservar sus bytes junto al resultado estructurado. El proceso resuelve imports relativos de los casos; nunca importa adjuntos. Verificar rutas reales y escapes por enlaces simbólicos antes de copiar. Si cambia el conjunto durante la captura, reintentar una vez o informar `SOURCE_CHANGED`.

## R-05. Extracción PDF y texto local

**Decision:** Poppler (`pdfinfo`, `pdftotext`) con UTF-8 y páginas preservadas, invocado con argumentos sin shell. TXT y texto pegado se normalizan conservando original y offsets. Sin OCR inicial.

**Rationale:** Poppler 24.02.0 está instalado y sirve tanto para documentos profesionales como para ofertas. Registrar versión del extractor y hash de texto. La extracción no garantiza interpretación semántica de columnas/tablas; las referencias permiten volver a la página original. [Poppler](https://poppler.freedesktop.org/)

**Limits:** oferta adjunta ≤10 MiB y 50 páginas; documento profesional ≤25 MiB y 100 páginas; extracción ≤30 segundos y salida ≤2 MiB por documento. Oferta textual ≤100.000 caracteres. Si se exceden, mostrar el límite y permitir aportar una descripción acotada. Los límites se validan antes de llamar a IA; no truncar silenciosamente.

**Alternatives considered:** enviar PDFs enteros al proveedor aumenta exposición y costo; incorporar OCR o formatos de oficina amplía la superficie de parsing sin ser requisito inicial. Un PDF ilegible conserva su original y pide texto.

## R-06. Recuperación local sencilla y comprobable

**Decision:** hechos estructurados y catálogo de proyectos como base; búsqueda léxica ponderada por requisito sobre fragmentos de casos/PDF, con alias explícitos ES/EN y tecnológicos. Implementación inicial en JavaScript, sin embeddings ni base vectorial.

**Rationale:** el corpus es pequeño; es posible mostrar qué se recuperó, de dónde y por qué. Los fragmentos conservan entidad, campo o página, offsets y texto exacto. Los alias sirven para recuperar evidencia, nunca para acreditar una competencia por equivalencia automática.

**Alternatives considered:** búsquedas exclusivamente literales fallan con traducciones; enviar el corpus completo desperdicia contexto; una base vectorial agrega indexación/costo sin evidencia de necesidad. Evaluar recuperación con las 10 ofertas de aceptación antes de reconsiderar embeddings.

## R-07. Asistencia desde el panel; Gemini primero

**Decision:** pipeline explícito de tres pasos: extracción de oferta, análisis de compatibilidad y propuesta de adaptación. Proveedor inicial `gemini`, SDK oficial `@google/genai` 3.0.0 y validación local con Zod 4.6.7; versiones observadas en el registro oficial y a fijar en el lockfile de implementación. Node ≥22 es requisito del SDK observado.

**Rationale:** el propietario eligió botón en CV Studio, proveedor configurable y clave propia, y ya utilizó Google AI Studio. Un contrato de proveedor desacopla reglas de negocio sin introducir agentes autónomos ni herramientas de navegación/sistema. Solo los proveedores implementados aparecen como disponibles; OpenAI queda como alternativa de extensión, no como una opción ficticia que falle al usarla.

**Model configuration:** `gemini-3.6-flash` es el candidato inicial estable verificado en el catálogo; el modelo exacto es configuración versionada y debe superar la prueba de acceso/esquema antes de activarse. No se cambia automáticamente a otro modelo. [Catálogo oficial](https://ai.google.dev/gemini-api/docs/models)

**Transport:** usar Interactions con respuesta JSON estructurada, `store:false`, sin conversación remota persistente, sin herramientas ni ejecución en background del proveedor. La generación local asíncrona se administra en CV Studio. El proveedor documenta tanto Interactions como el soporte de GenerateContent; se elige la primera para esta integración nueva. [Interactions](https://ai.google.dev/gemini-api/docs/interactions)

**Alternatives considered:** ejecutar Codex mediante órdenes no fue la modalidad elegida; un modelo local requiere instalación y capacidad de cómputo no solicitadas; frameworks multiagente agregan decisiones difíciles de controlar a un flujo de tres pasos.

## R-08. Salida estructurada y revisión de afirmaciones

**Decision:** esquemas cerrados, IDs de evidencia existentes y citas localizables; validación local de forma, límites, referencias y campos protegidos antes de renderizar. No aceptar HTML del modelo. El usuario revisa el apoyo semántico de cada bloque antes de marcarlo revisado.

**Rationale:** la salida estructurada no prueba veracidad y algunas restricciones del esquema no se fuerzan en el proveedor. Una cita existente tampoco demuestra que respalde una afirmación. [Structured outputs de Gemini](https://ai.google.dev/gemini-api/docs/structured-output)

**Alternatives considered:** aceptar texto libre dificulta trazabilidad; usar una segunda IA como autoridad final de verdad no elimina las invenciones. Las verificaciones automáticas reducen errores comprobables y la revisión humana resuelve significado, rol y alcance.

**Important fixture:** NAP debe distinguir laboratorio de producción, pruebas simuladas de infraestructura real, contribución individual de equipo y trabajo aceptado de presentación ya realizada. Conflictos conservan ambas fuentes y resolución explícita.

## R-09. Privacidad, claves y límites de consumo

**Decision:** `GEMINI_API_KEY` solo en el entorno del servidor. El panel muestra si está configurada, nunca su valor. Configuración no secreta versionada: proveedor, modelo, modalidad de consumo, perfil tarifario, presupuesto mensual y aceptación informada de categorías transmitidas. Sin configuración completa no se hacen llamadas reales.

**Rationale:** las claves no deben aparecer en cliente, DB exportable, logs o historial. Se enviarán oferta, preferencias profesionales pertinentes y fragmentos necesarios; foto y datos de contacto se incorporan al render local y no al contexto de adaptación. [Claves de Gemini](https://ai.google.dev/gemini-api/docs/api-key)

**Cost model:** modalidad `free` solo tras declarar el nivel de cuenta y verificar que modelo/cuota admiten ese uso; no se supone gratuidad por haber usado AI Studio. Modalidad `paid` exige presupuesto explícito y precios configurados/verificados. Se reservan costos máximos antes de cada llamada y se concilia uso reportado, incluyendo tokens de razonamiento. No hay incremento de límite ni cambio a pago automático. El contador local no controla uso de la clave por otras aplicaciones ni sustituye la facturación del proveedor.

**Data treatment:** el nivel gratuito puede utilizar contenido para mejorar productos; el nivel Standard de pago tiene otro tratamiento. La UI debe enlazar las condiciones vigentes y mostrar la modalidad seleccionada. `store:false` evita el almacenamiento de interacciones documentado por esa opción, pero no equivale por sí solo a exclusión de todo tratamiento de datos. [Precios y tratamiento por nivel](https://ai.google.dev/gemini-api/docs/pricing)

**Alternatives considered:** dejar gasto ilimitado, detectar el nivel por el formato de una clave o prometer un costo cero sin conocer la cuenta son supuestos inválidos. El presupuesto concreto se elige en configuración, no queda como una incógnita de arquitectura.

## R-10. Qué aporta ChatGPT Plus

**Decision:** no tratar Plus como saldo de una clave de API ni reutilizar credenciales de la sesión de Codex para una integración distinta. Mantener Gemini como vía inicial elegida.

**Rationale:** la documentación actual de créditos de API excluye Plus de ese beneficio. A la vez, Sign in with ChatGPT contempla uso del plan Plus/Pro en aplicaciones elegibles, mediante registro, permisos y condiciones propias. Por ello tampoco corresponde afirmar que Plus nunca puede usarse en una aplicación: es una integración distinta cuya elegibilidad no se comprobó para este proyecto. [Créditos de API](https://developers.openai.com/api/docs/guides/chatgpt-api-credits), [Sign in with ChatGPT](https://developers.openai.com/siwc/quickstart)

**Alternatives considered:** implementar ambas vías ahora duplicaría autenticación y pruebas; evaluar la integración con el plan podrá hacerse como mejora posterior sin cambiar el contrato de adaptación.

## R-11. Operaciones e historial coherentes

**Decision:** operaciones persistidas, una operación pesada activa y cola local acotada; polling desde el panel. Extracción, IA y Chromium fuera de transacciones; resultado final guardado en una transacción breve. Idempotencia por intento, concurrencia optimista en borradores y eventos para revisiones/estados.

**Rationale:** permite progreso, cancelación y recuperación sin Redis. Tras reiniciar, operaciones activas quedan `interrupted`; no se reenvían solicitudes externas con resultado incierto. Los intentos con consumo desconocido conservan su reserva hasta conciliación.

**Alternatives considered:** cola distribuida no responde a la escala; mantener todo en memoria pierde historial al cerrar; transacciones abiertas durante la IA bloquean la base.

## R-12. Copias y restauración

**Decision:** backup coherente mediante `node:sqlite.backup()`, con nuevas escrituras pausadas y sin operaciones activas. Validar tamaño/formato/integridad/relaciones/hashes al restaurar; importar solo datos de tablas permitidas a una base creada con nuestro esquema, sin ejecutar SQL del archivo aportado. Reemplazo en mantenimiento y copia anterior recuperable.

**Rationale:** copiar únicamente el archivo abierto puede omitir estado del WAL. [SQLite Backup](https://www.sqlite.org/backup.html), [WAL](https://www.sqlite.org/wal.html). Tener artefactos dentro de la misma base hace coherentes la copia y las asociaciones.

**Alternatives considered:** copiar directorios mientras hay escrituras no asegura consistencia; ejecutar un dump arbitrario como SQL da autoridad al archivo importado. La restauración nunca incorpora credenciales ni reactiva llamadas externas automáticamente.

## R-13. LinkedIn y Computrabajo desde el origen de la oferta

**Decision:** primera etapa: `sourceKind = manual | linkedin | computrabajo | other`, URL original/canónica, país e ID externo reconocido. No hacer fetch de esas URLs al incorporar una oferta. Un patrón desconocido conserva URL y no inventa ID.

**Rationale:** la oferta adjunta y su historial tienen valor sin conexión al portal. Identidad exacta permite deduplicar dentro de una fuente; coincidencias de empresa/puesto entre portales solo sugieren vínculos revisables.

**Second stage:** verificar capacidades de cada portal antes de habilitar búsqueda/envíos. LinkedIn documenta Apply Connect para integraciones de selección de personal, no como confirmación de acceso del postulante personal. Computrabajo mostró verificación de acceso en la lectura realizada y no se encontró documentación oficial que confirme una API pública para ese flujo. No se prescribe scraping ni automatización de la cuenta como supuesto del plan. [LinkedIn Apply Connect](https://learn.microsoft.com/en-us/linkedin/talent/apply-connect/apply-connect-overview), [Computrabajo Argentina](https://ar.computrabajo.com/)

**Alternatives considered:** depender de una integración no verificada bloquearía la primera etapa. Abrir el anuncio, postular manualmente y registrar el envío declarado ofrece continuidad sin simular confirmación externa.

## R-14. Resolución del workflow

**Decision:** utilizar el setup Bash equivalente instalado porque `pwsh` no está disponible. Se intentó el comando PowerShell indicado por la skill y luego se ejecutó `setup-plan.sh --json` con éxito.

**Result:** FEATURE_SPEC, IMPL_PLAN y SPECS_DIR corresponden a esta feature. El script devolvió `BRANCH=002-cv-job-studio` como identificador de contexto; `git branch --show-current` confirmó que la rama real es `dev`. No se creó ni cambió una rama. No existe `.specify/extensions.yml`, por lo que no hay hooks previos/posteriores configurados.

Todas las incógnitas de diseño de esta fase quedan resueltas mediante las decisiones anteriores. Clave, modelo disponible en la cuenta, nivel de consumo y presupuesto son entradas de configuración al implementar/usar el módulo, sin autorización de llamadas ni gastos en esta planificación.
