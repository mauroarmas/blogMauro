# HTTP Contract — CV Studio privado

**Estado:** contrato propuesto para implementación; las rutas nuevas aún no existen. Base local `http://127.0.0.1:4317/api/v1`. [Modelo](../data-model.md) · [Persistencia](storage.md) · [IA y evidencia](ai-and-evidence.md).

## Reglas comunes

- El servidor escucha únicamente en loopback. Host permitido: `127.0.0.1:puerto` o `localhost:puerto`. Rechazar Origin ajeno y `Sec-Fetch-Site: cross-site`; no habilitar CORS para sitios externos.
- Todas las mutaciones exigen `X-CV-Token` de la instancia actual. `GET /session` entrega el token bajo las mismas reglas locales; es protección del contexto local, no autenticación multiusuario.
- Respuestas privadas: `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `nosniff`, `frame-ancestors 'self'`. No servir directorios del equipo ni rutas suministradas por usuario/modelo.
- Nombres de campos HTTP en camelCase; el servicio los mapea al modelo de persistencia. UUID para entidades, SHA-256 hex completo para hashes, ISO UTC para instantes, micro-USD enteros para costos.
- Listas: `limit` por defecto 25 y máximo 100, cursor opaco, orden estable por fecha + ID. Respuesta `{items, nextCursor, total}`. Filtros desconocidos o inválidos se rechazan.
- JSON normal ≤256 KiB. Importación de oferta: multipart con un archivo ≤10 MiB o texto ≤100.000 caracteres, metadatos ≤8 KiB y cuerpo total ≤11 MiB. Restauración usa carga binaria en streaming ≤512 MiB; no cargarla completa en memoria.
- Crear operaciones exige `Idempotency-Key` de 16–128 caracteres. Igual clave y cuerpo canónico devuelve el mismo resultado; misma clave y otra entrada devuelve 409. Un reintento deliberado usa otra clave y `retryOfId`.
- Editar registros mutables requiere `expectedRevision`; edición obsoleta devuelve 409 y la revisión actual. El servidor asigna fecha, IDs, actor, hashes y auditoría.
- Una operación devuelve 202 `{operationId, state, statusUrl}`. `GET /operations/:id` entrega progreso, fase, referencias de resultados y errores, nunca claves ni respuesta cruda secreta del proveedor.
- Cola de trabajo pesada: una activa y hasta diez esperando. Más solicitudes reciben 429 `QUEUE_FULL`; la navegación de lectura permanece disponible.

### Errores

Formato `{error:{code,message,details?,retryable}, requestId}`; `details` solo incluye datos útiles para corregir la entrada. 400: esquema; 403: contexto/token; 404: entidad; 409: revisión/idempotencia/estado; 410: documento eliminado; 413: tamaño; 422: fuente ilegible, evidencia o contenido no utilizable; 429: cola/cuota; 503: mantenimiento/proveedor temporalmente no disponible.

Códigos del servicio se conservan entre HTTP/CLI. Un error remoto de IA no convierte una versión parcial en disponible. Los códigos `AI_CONFIGURATION_REQUIRED` de persistencia y `PROVIDER_NOT_CONFIGURED` del adaptador se normalizan a `AI_CONFIGURATION_REQUIRED` en la interfaz pública; el motivo detalla clave/modelo/presupuesto/categorías faltantes.

## Estado, fuentes y preferencias

| Método y ruta | Entrada / resultado |
|---|---|
| `GET /health` | Versión de aplicación/esquema, datasetId, estado listo/mantenimiento. Sin rutas privadas o secretos. |
| `GET /session` | Token antifalsificación de instancia y capacidades disponibles. |
| `GET /sources` | Lista de fuentes, revisión actual, disponibilidad y último error. |
| `POST /sources/refresh` | Operación de captura/lectura del corpus permitido; devuelve snapshot y advertencias. |
| `GET /sources/:id/revisions` | Revisiones conservadas, tipos y fechas. |
| `GET /source-revisions/:id` | Metadatos, extracción y localizadores conservados. |
| `GET /source-revisions/:id/document` | Original relacionado, en modo descarga o visor controlado; no acepta una ruta. |
| `GET /evidence/:fragmentId` | Fragmento exacto, localizador y documento/revisión de origen. |
| `POST /owner-evidence` | `{entityType,entityId,classification,text,confirmation:true}`; fuente privada confirmada, nunca escritura automática en contenido público. |
| `GET /preferences` | Perfil vigente y revisión; condiciones desconocidas explícitas. |
| `PATCH /preferences` | `{expectedRevision,preferences}`; agrega revisión, conserva anteriores. |

Aportar evidencia no confirma automáticamente otros textos que la citan. El refresco produce un snapshot nuevo, sin reemplazar fuentes de CV anteriores. Antes de empezar un análisis/adaptación se comprueba vigencia aunque el usuario no haya pulsado refrescar.

## Ofertas y duplicados

| Método y ruta | Entrada / resultado |
|---|---|
| `GET /opportunities` | Filtros `status,company,role,workMode,matchLevel,sourceKind,from,to,archived`. Lista resumida y paginada. |
| `POST /opportunities/import` | Multipart: `text` o `file` (exactamente uno), `sourceUrl?`, `sourceKind?`. Operación local de extracción/registro; no necesita IA ni navega al enlace. |
| `GET /opportunities/:id` | Revisión vigente, análisis, versiones, candidaturas y posibles duplicados. |
| `POST /opportunities/:id/revisions` | `{expectedRevision,correctedFields?,text?}`; conserva original y crea revisión por corrección del propietario. |
| `PATCH /opportunities/:id` | `{expectedRevision,status?,archived?,reason?}`; actividad registrada. |
| `GET /opportunities/:id/history` | Revisiones y eventos con actor, fecha y origen. |
| `POST /opportunities/:id/analyses` | `{offerRevisionId,preferencesRevisionId}`; operación de extracción estructurada + relación con evidencia; congela fuentes actuales. |
| `GET /analyses/:id` | Análisis inmutable con requisitos, evidencias, razones, conflictos, nivel y revisiones usadas. |

La importación no llama a IA por sí sola. Archivo legible y registro de origen son utilizables aun sin configurar proveedor. La extracción estructurada de campos genera una revisión de oferta de origen `extraction`, vinculada al texto original; una corrección humana queda diferenciada. Un análisis sobre campos ya corregidos respeta esas correcciones y no las sobrescribe con una nueva extracción. Publicar una revisión extraída requiere que la revisión de entrada siga vigente; si cambió, devuelve conflicto y conserva el intento para revisión.

**Identidad de fuentes:**

- `sourceKind = manual | linkedin | computrabajo | other`; `sourceCountry = ar` para Computrabajo Argentina y `global` para LinkedIn; otras fuentes usan país conocido o `global`, nunca NULL en la clave de identidad.
- Conservar `originalUrl`; canónica: host/esquema normalizados, sin fragmento y solo sin parámetros de tracking reconocidos (`utm_*`, `trk`, `trackingId`, `refId`). No quitar parámetros desconocidos que puedan identificar un anuncio. No resolver redirects.
- LinkedIn: reconocer ID numérico en `/jobs/view/<id>` o sufijo de `/jobs/view/<slug>-<id>` de un host oficial validado por límite de dominio.
- Computrabajo Argentina: host exacto `ar.computrabajo.com`; reconocer identificador hexadecimal terminal en una ruta individual `/ofertas-de-trabajo/oferta-de-trabajo-de-...`. El patrón se basa en URLs observadas, no en una garantía estable del portal; si no encaja, usar URL y no fabricar ID.
- Clave fuerte: `(sourceKind,sourceCountry,externalId)`; fallback: URL canónica de anuncio individual. Una página de búsqueda no constituye identidad de una vacante; conservar como referencia sin usarla para fusionar todas sus ofertas.
- Mismo ID y texto: reutilizar y devolver `duplicateOf`; mismo ID y texto distinto: nueva revisión de la oportunidad, con aviso de actualización. Coincidencias empresa/puesto entre portales solo generan sugerencias; el usuario puede conservar ambas o descartar una con motivo y referencia a la otra.
- HTTP(S) únicamente, sin credenciales embebidas. Un dominio parecido no se clasifica como portal oficial. El origen no se presupone igual al destino final de postulación.

## Adaptación y versiones

| Método y ruta | Entrada / resultado |
|---|---|
| `POST /drafts` | `{analysisId,locale,photo,portfolioUrl?}` o `{general:true,locale,photo,projects?}`. Adaptación con IA para análisis; borrador general local sin IA. Resultado con draftId. |
| `GET /drafts/:id` | Contenido editable, claims, fuentes, revisión y señales de desactualización. |
| `PATCH /drafts/:id` | `{expectedRevision,content?,presentationOptions?}`; esquema de contenido permitido, sin campos protegidos arbitrarios; invalida revisión del texto alterado. |
| `POST /drafts/:id/reviews` | `{expectedRevision,decision,claimDecisions,linkDecisions}`; confirma, pide cambios o señala conflicto. `reviewed` exige resolver pendientes y comprobar vigencia. |
| `GET /drafts/:id/preview` | HTML escapado de la revisión solicitada, con fuentes y composición local; no crea versión por abrirlo. |
| `POST /versions` | `{draftId,expectedDraftRevision}`; operación de render y commit atómico. Conserva la revisión precisa, sin releer contenido dentro del render. |
| `GET /versions` | Filtros `opportunityId,company,role,locale,from,to,archived`; identidad, estado, fecha y páginas. |
| `GET /versions/:id` | Modelo, opciones, procedencia, revisión, lifecycle y relación con versión anterior. |
| `GET /versions/:id/pdf` | PDF original, hash en encabezado y nombre de descarga seguro; 410 si eliminado. |
| `GET /versions/:id/html` | HTML original conservado; visor en iframe restringido/descarga. |
| `GET /versions/compare?leftId=...&rightId=...` | Cambios semánticos de campos, proyectos y claims; no comparar únicamente bytes PDF. |
| `POST /versions/:id/drafts` | Crea borrador descendiente; la versión de origen permanece congelada. |
| `POST /versions/:id/reviews` | `{decision,claimDecisions,linkDecisions}`; evento de revisión del contenido congelado, sin modificarlo. Enlaces defectuosos requieren versión descendiente; comprobaciones de acceso se registran en findings del evento. |
| `POST /versions/:id/archive` | `{archived:true|false}`; metadatos y evento. |
| `GET /versions/:id/delete-preview` | Candidaturas asociadas, documentos afectados, identidad de alcance y revisión. |
| `DELETE /versions/:id` | `{scopeHash,confirmation:true}`; solo si asociaciones siguen vigentes; tombstone y limpieza segura de artefactos no compartidos. |

`linkDecisions` identifica el enlace y su URL resuelta exacta, decisión y nota de comprobación; fecha/actor los fija el servidor. El servidor recalcula clasificaciones y rechaza confirmaciones de URL/base obsoletas. Los eventos de versión conservan estas decisiones sin modificar el modelo congelado.

Revisiones deben citar IDs de evidencia presentes en el snapshot. Aportar evidencia privada crea un nuevo snapshot y exige revalidar la adaptación; no se agregan referencias a posteriori a una versión inmutable. Los CV revisados históricamente conservan su evento aunque el perfil actual cambie; el panel muestra desactualización por separado.

## Seguimiento manual

| Método y ruta | Entrada / resultado |
|---|---|
| `GET /dashboard` | Totales por estados, últimas acciones y pendientes, aplicando los filtros de oportunidades. |
| `POST /applications` | `{opportunityId,cvVersionId?,channel}`; inicia seguimiento de esa candidatura. |
| `PATCH /applications/:id` | `{expectedRevision,state?,cvVersionId?,sentAt?,note?,nextAction?,nextActionAt?,reason?}`; transiciones permitidas y evento. |
| `GET /applications/:id` | Estado, historial y versión exacta asociada, incluidos tombstones. |

No hay endpoint de envío externo. El cliente no puede asignar `sent_confirmed`. El registro `sent_declared` exige fecha/canal y selección explícita de versión disponible o indicación de documento externo desconocido; desconocido nunca apunta ficticiamente al último CV.

Una candidatura `ready` necesita un CV revisado; un registro histórico de algo que el usuario efectivamente envió puede declararse aunque no cumpla ese estado, mostrando la diferencia. Entrevista/oferta/rechazo/retirada son eventos manuales. Se cuenta una candidatura por ID, sin contar cada avance o documento como un nuevo envío.

## Configuración IA, consumo y operaciones

| Método y ruta | Entrada / resultado |
|---|---|
| `GET /ai/settings` | Configuración no secreta, disponibilidad de clave (booleano), capacidades, categoría de datos y estado de validación. |
| `PUT /ai/settings` | Modelo, `billingMode`, límites mensual/por operación, perfil tarifario y categorías; `expectedRevision`. No recibe una clave. |
| `POST /ai/settings/validate` | Con aceptación de transmisión y presupuesto explícitos, prueba mínima de acceso/esquema y registra resultado/consumo. No llama al proveedor al abrir la pantalla. |
| `POST /ai/settings/enable` | `{expectedRevision,enabled}`; habilita una revisión válida y confirmada; deshabilitar impide nuevas llamadas. |
| `GET /ai/usage?period=YYYY-MM` | Uso contabilizado, reservado, incierto, ajustes, límite y saldo estimado. |
| `POST /ai/usage/reconcile` | Ajustes con evidencia/motivo del propietario para consumo incierto o restaurado; no borrar costos conocidos. |
| `GET /operations/:id` | Estado `queued,running,succeeded,failed,interrupted,cancelled`, fase y resultados. |
| `POST /operations/:id/cancel` | Detiene trabajo pendiente/abortable; conserva resultados y reserva de una llamada incierta. |
| `POST /operations/:id/retry` | Nueva operación con `retryOfId`, clave nueva y validación de vigencia; no reejecuta resultados ya confirmados. |

Cada operación usa una revisión de configuración. La prueba mínima de configuración puede ejecutarse antes de `enabled=true`, pero solo bajo la misma aceptación de datos y reserva presupuestaria; `enabled` gobierna adaptaciones ordinarias. Modelo/precio/aceptación incompletos no provocan una llamada exploratoria implícita.

## Backup y restauración

| Método y ruta | Entrada / resultado |
|---|---|
| `POST /backups` | Solicita copia coherente; operación en mantenimiento y resultado backupId. |
| `GET /backups/:id/download` | Copia SQLite validada, sin claves ni sesión; descarga privada. |
| `POST /backups/restore-preview` | SQLite binario ≤512 MiB, validado en worker; devuelve operationId de validación, hash, conteos y alcance del reemplazo. |
| `POST /backups/restore` | `{validationOperationId,expectedDatasetId,confirmation:true}`; exige archivo/estado vigente, mantenimiento y recuperación según storage.md. |

Las copias generadas son archivos operativos temporales privados, no BLOB del propio backup dentro de sí mismo. Referencias en el resultado de operación permiten descargarlas durante 24 horas; la UI explica esa duración y el usuario conserva la copia descargada. Temporales de importación/validación se eliminan al finalizar o expirar.

La restauración conserva un recibo operativo local de recuperación y copia anterior antes de sustituir la DB. Al abrir el conjunto restaurado registra ese recibo en su historial. Una interrupción se resuelve con la herramienta offline; no se declara éxito hasta comprobar integridad. El consumo externo posterior al backup se concilia antes de reactivar IA.

## Compatibilidad con el generador actual

- `GET /api/content`, `GET /preview` y `POST /api/pdf` continúan disponibles como adaptadores de compatibilidad.
- `POST /api/pdf` usa el servicio de versión general, conserva el PDF en historial y responde sus bytes más `X-CV-Version-Id`. El cliente actualizado envía idempotencia; clientes anteriores sin clave reciben una clave de intento asignada por el servidor.
- `npm run cv:pdf` mantiene nombre/ruta de descarga de conveniencia; cada generación confirmada tiene versión propia. Ninguna ruta reemplaza automáticamente el CV público del portafolio.
