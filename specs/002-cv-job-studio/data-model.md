# Data Model — CV Studio, primera etapa

**Fecha**: 2026-11-08 · **Estado**: diseño para implementación · **Spec**: [spec.md](spec.md)

## Convenciones e invariantes

- SQLite privado en `.cv-studio/studio.sqlite`; tablas transaccionales y artefactos BLOB en la misma base. Directorio `0700`, archivo `0600`; no se publica ni se versiona en Git.
- Entidades identificadas con UUID. Los artefactos se identifican por SHA-256 completo de sus bytes: 32 bytes, representados como 64 caracteres hexadecimales minúsculos en contratos.
- Instantes en UTC con formato ISO 8601. La interfaz y los períodos mensuales de presupuesto usan `America/Argentina/Tucuman`.
- `created_at` es inmutable. Registros editables incluyen `updated_at` y `revision` entero creciente; las actualizaciones requieren la revisión esperada.
- Las revisiones de fuentes, preferencias, ofertas, análisis finalizados y contenido de CV se agregan; no se sustituyen. Los estados de revisión y archivado se expresan por eventos o metadatos separados.
- Claves foráneas activas y eliminación restrictiva. Los campos JSON son documentos con esquema versionado; validar sus referencias también cuando no puedan expresarse como claves foráneas.
- Contenido desconocido se representa como `null`/`unknown`, nunca mediante un dato inventado. Una oferta es entrada externa, no evidencia de experiencia propia.
- Los estados de oportunidad, candidatura, revisión de CV y operación son independientes. Generar un CV no crea un envío.
- No se almacenan claves de Gemini, cookies de portales ni credenciales de cuentas. La configuración sensible se aporta mediante el entorno del proceso.

## Fuente de conocimiento y artefactos

### `artifacts`

- Campos: `sha256` (PK), `media_type`, `byte_length`, `bytes`, `created_at`.
- Contiene PDFs originales/generados, textos normalizados, imágenes, fuentes tipográficas, recursos de presentación y documentos estructurados serializados.
- El hash se verifica antes de insertar y al restaurar; igual hash exige igual longitud y bytes. Un artefacto compartido no se elimina mientras conserve referencias.
- Los artefactos solo se descargan a través de una entidad accesible que los referencia; conocer un hash no habilita navegar por la base o el equipo.

### `professional_sources` y `source_revisions`

- Fuente: `id`, `kind` (`profile`, `project`, `case_study`, `education`, `skill`, `professional_document`, `owner_assertion`), `logical_key`, `relative_location`, `current_revision_id`, `availability`, `last_checked_at`.
- Revisión: `id`, `source_id`, `content_sha256`, `original_artifact_sha256`, `extracted_artifact_sha256?`, `extraction_status`, `extraction_error_code?`, `extractor_version`, `created_at`.
- `logical_key` es estable, por ejemplo proyecto + slug; `relative_location` es una ruta incluida o un identificador interno de aportación del propietario, nunca una ruta arbitraria recibida de la oferta.
- `content_sha256` cubre identidad de fuente y contenido canónico con delimitación inequívoca; no se reutiliza el hash truncado del generador actual para identidad histórica.
- Estados de disponibilidad: `available`, `missing`, `unreadable`. Extracción: `ready`, `unsupported`, `failed`. Una revisión histórica conserva sus bytes aunque cambie o desaparezca el original.
- Una revisión de aportación del propietario incluye `owner_confirmation` con autor, fecha, entidad, categoría y contexto de confirmación. Confirmar una frase del CV no confirma automáticamente hechos diferentes en otras fuentes.

### `evidence_fragments`

- Campos: `id`, `source_revision_id`, `fragment_sha256`, `text`, `locator`, `classification`, `language`, `created_at`.
- `locator`: página y bloque para PDF, encabezado/párrafo para documento, o campo estable para contenido estructurado.
- `classification`: `fact`, `learning`, `interest`, `preference`. `fact` identifica un hecho declarado en una fuente, no una certificación automática de veracidad; el origen privado se distingue por `professional_sources.kind=owner_assertion`. Un fragmento debe conservar contexto suficiente para no cambiar el sentido de un logro.
- Los fragmentos provienen de revisiones profesionales; el texto de ofertas no puede incorporarse a esta tabla como evidencia personal.

### `knowledge_snapshots` y `snapshot_sources`

- Snapshot: `id`, `snapshot_sha256`, `manifest_artifact_sha256`, `created_at`, `schema_version`.
- Asociación: `snapshot_id`, `source_revision_id`; clave compuesta única. El manifiesto identifica revisiones y fragmentos disponibles, sus localizadores y estados de lectura.
- La identidad se calcula sobre un manifiesto canónico ordenado de identidades y hashes, no sobre concatenación de contenidos sin rutas.
- Un análisis y un CV apuntan al snapshot utilizado. Cambiar fuentes durante una tarea no altera ese snapshot; la comparación con las fuentes vigentes produce una señal de desactualización.

### `presentation_snapshots`

- Campos: `id`, `snapshot_sha256`, `manifest_artifact_sha256`, `schema_version`, `created_at`.
- El manifiesto referencia plantilla, reglas de paginación, CSS compartido/impreso, fuentes tipográficas y foto efectivamente usados, con hashes completos.
- Su finalidad es explicar y conservar la composición. La descarga histórica recupera el PDF original y no depende de reproducirlo en otra versión del navegador.

## Preferencias, ofertas y análisis

### `search_profiles` y `search_profile_revisions`

- Perfil: `id`, `name`, `current_revision_id`, `revision`, `created_at`, `updated_at`.
- Revisión: `id`, `profile_id`, `preferences`, `created_at`.
- `preferences`: roles, seniorities, modalidades, ubicaciones, idiomas, restricciones geográficas, jornada, contratos, expectativas salariales con moneda/período y tecnologías deseables/excluyentes.
- Cada condición declara `preference` o `required`; ausencia de valor significa sin definir. Inicial: junior/pasantías de Sistemas/desarrollo `preference`; regla condicional de presencialidad en Tucumán `required`, español e inglés intermedio desde el perfil. La ubicación presencial se inicializa como condición excluyente: presencial fuera de la provincia de Tucumán = fail; presencial en Tucumán = pass; ubicación ausente = unknown. Para remoto esta condición geográfica no se aplica; elegibilidad remota se verifica por separado. La modalidad híbrida sigue sin definir y se muestra para revisión, sin inferir autorización de traslado.
- Los niveles de idioma declarados provienen del perfil profesional; editar filtros de búsqueda no modifica esas credenciales.

### `opportunities` y `offer_revisions`

- Oportunidad: `id`, `source_kind` (`manual`, `linkedin`, `computrabajo`, `other`), `source_country` (código de país o `global`), `external_id?`, `canonical_url?`, `current_revision_id`, `status`, `archived_at?`, `revision`, `created_at`, `updated_at`.
- Revisión: `id`, `opportunity_id`, `original_artifact_sha256`, `normalized_text_artifact_sha256`, `content_sha256`, `captured_at`, `original_url?`, `fields`, `field_provenance`, `revision_origin` (`import`, `extraction`, `owner_correction`), `created_at`.
- `fields`: puesto, empresa, ubicación, modalidad, seniority, idiomas, requisitos identificados con IDs, salario/moneda/período, condiciones de elegibilidad y vencimiento si constan.
- `field_provenance` distingue extracción, corrección del propietario y desconocido. Corregir crea otra revisión, sin borrar el anuncio original.
- Duplicados exactos: unicidad de `source_kind + source_country + external_id` cuando existe y de URL canónica de anuncio individual conocida. Computrabajo Argentina usa `ar`; LinkedIn usa `global` para no duplicar el mismo ID entre subdominios regionales. Coincidencias solo por empresa/puesto generan sugerencias, sin fusión automática.
- Las URLs conservan identidad del anuncio; retirar únicamente parámetros de seguimiento reconocidos. Anuncios de distintos portales se mantienen separados hasta una decisión explícita de asociación.

### `analyses`

- Campos: `id`, `opportunity_id`, `offer_revision_id`, `knowledge_snapshot_id`, `search_profile_revision_id`, `operation_id`, `schema_version`, `match_level`, `requirement_matches`, `reasons`, `created_at`.
- `match_level`: `high`, `medium`, `low`, `insufficient_information`; los conflictos excluyentes se registran por separado.
- Cada entrada de `requirement_matches` incluye `requirement_id`, `status` (`supported`, `partial`, `unsupported`, `unknown`, `conflict`), referencias a fragmentos del snapshot y explicación.
- Resultado finalizado inmutable. Recalcular crea otro análisis; las razones no expresan probabilidad de contratación.

## Borradores, versiones y revisión

### `adaptation_drafts`

- Campos: `id`, `opportunity_id?`, `analysis_id?`, `knowledge_snapshot_id`, `search_profile_revision_id?`, `parent_version_id?`, `content`, `claims`, `presentation_options`, `link_checks`, `revision`, `created_at`, `updated_at`.
- `content` contiene biografía, proyectos seleccionados/ordenados, resúmenes y competencias. `presentation_options` incluye idioma, fotografía y URL base del portafolio.
- Cada afirmación en `claims` tiene identificador, ubicación en el contenido, texto y referencias de evidencia; validación de evidencia `source_located`, `needs_evidence`, `conflict` y revisión humana separada `pending`, `owner_confirmed`. Una fuente localizada no equivale a verdad confirmada.
- `link_checks` registra por enlace ubicación, URL resuelta, clasificación, motivo, confirmación del propietario, fecha/nota y versión de política; se invalida al cambiar URL/base y se congela dentro de `model_artifact_sha256` al versionar. No requiere una tabla adicional.
- Una edición invalida las revisiones anteriores del borrador. Las referencias deben pertenecer al snapshot o a aportaciones del propietario incorporadas en un nuevo snapshot.
- Guardar un borrador no cambia los archivos profesionales generales. Las correcciones allí se realizan como acción diferente y explícita.

### `cv_versions`, `cv_version_contents` y `cv_version_lifecycle`

- Identidad estable (`cv_versions`): `id`, `opportunity_id?`, `parent_version_id?`, `operation_id`, `created_at`; conserva la identidad referenciada por candidaturas y versiones descendientes.
- Contenido inmutable (`cv_version_contents`, relación 1:1 por `version_id`): `offer_revision_id?`, `analysis_id?`, `draft_id?`, `draft_revision?`, `knowledge_snapshot_id`, `search_profile_revision_id?`, `presentation_snapshot_id`, `pdf_artifact_sha256`, `html_artifact_sha256`, `model_artifact_sha256`, `claims_artifact_sha256`, `adaptation_reasons`, `language`, `page_count`.
- Lifecycle: `version_id`, `archived_at?`, `deleted_at?`, `deletion_event_id?`. El archivado es la acción normal para retirar una versión de la lista activa.
- Una versión existe como disponible solo cuando PDF, HTML, modelo, evidencias y vínculos quedan confirmados en la misma transacción.
- Editar una versión crea un borrador descendiente y posteriormente otra versión. No se actualizan sus bytes, contenido ni las fuentes congeladas.
- La eliminación deliberada retira `cv_version_contents` y deja identidad y lifecycle como tombstone, con fecha y hashes históricos no referenciales. Así las claves foráneas de candidaturas siguen siendo válidas; las descargas devuelven «eliminado», nunca una ruta ficticia.
- Un artefacto de versión puede purgarse solo tras retirar todas sus referencias activas. Las candidaturas conservan la identidad tombstone de la versión presentada y muestran que su archivo ya no está disponible.

### `review_events`

- Campos: `id`, `draft_id?`, `draft_revision?`, `cv_version_id?`, `state`, `findings`, `source_comparison_sha256`, `actor`, `created_at`.
- Exactamente un objetivo: revisión precisa de borrador o versión guardada. Estados: `needs_review`, `changes_requested`, `reviewed`, `stale_sources`.
- `reviewed` exige cero afirmaciones pendientes/conflictivas, comparación de fuentes vigente y confirmación del propietario; también cero enlaces invalid/local/restricted y comprobaciones de destinatario vigentes según `contracts/studio-ui-cli.md`. Las nuevas evidencias deben incorporarse antes a un snapshot; aceptar texto sin sustento no salta este control.
- La revisión de un borrador no se reutiliza tras editarlo. Al generar desde la misma revisión, su resultado queda vinculado a la versión, con la comprobación final de fuentes.

## Seguimiento y ejecución

### `applications` y `activity_events`

- Candidatura: `id`, `opportunity_id`, `cv_version_id?`, `state`, `channel`, `sent_at?`, `confirmation_origin?`, `next_action?`, `next_action_at?`, `revision`, `created_at`, `updated_at`.
- Evento: `id`, `entity_type`, `entity_id`, `kind`, `before_state?`, `after_state?`, `details`, `actor` (`owner`, `system`), `occurred_at`, `created_at`.
- Etapa 1: `preparing → pending_review → ready → sent_declared`; desde envío declarado, seguimiento manual a `interview`, `offer`, `rejected` o `withdrawn`. Reabrir/corregir requiere evento con motivo.
- `ready` exige versión revisada disponible. Registrar un envío manual admite describir fielmente lo que efectivamente se envió, señalando si su versión aún no fue revisada.
- El contrato de etapa 1 no permite establecer `sent_confirmed` ni fabricar evidencia externa. Tampoco crea tablas de conexiones o aprobaciones de portales antes de la segunda etapa.
- Oportunidades: `new → analyzed → selected`, con descarte/cierre y reapertura explícitos. Cambiar candidatura puede actualizar la oportunidad mediante reglas documentadas, nunca mediante coincidencia de nombres de estados.

### `operations`

- Campos: `id`, `kind`, `request_key`, `request_sha256`, `input_manifest`, `state`, `progress`, `attempt`, `retry_of_id?`, `result_refs`, `error_code?`, `started_at?`, `finished_at?`, `created_at`.
- Estados: `queued → running → succeeded | failed | interrupted | cancelled`. Solo una operación pesada en `running`; los pasos de IA/PDF se ejecutan fuera de transacciones largas.
- `request_key` único: misma clave y mismo hash recuperan la operación; misma clave con otra entrada devuelve conflicto. Regeneración deliberada usa otra clave y produce otra versión.
- Al reiniciar, operaciones que quedaron en `running` pasan a `interrupted`. Reintentar es explícito y crea otro intento sin sustituir resultados confirmados.

## Configuración de IA y presupuesto

### `ai_settings` y `ai_config_revisions`

- Configuración activa (`ai_settings`, singleton): `current_revision_id`, `enabled`, `revision`, `validated_revision_id?`, `validation_operation_id?`, `updated_at`. Cambiar proveedor/modelo/tarifas/categorías deshabilita y exige revalidación; habilitar no modifica una revisión histórica.
- Revisión inmutable: `id`, `provider` (`gemini` inicialmente), `model`, `billing_mode` (`free`, `paid`), `sharing_categories`, `sharing_confirmed_at?`, `monthly_limit_microusd?`, `per_operation_limit_microusd?`, `budget_timezone`, `price_snapshot`, `output_limits`, `created_at`.
- Nunca contiene claves: la disponibilidad de la clave se obtiene del entorno. Las revisiones preservan qué configuración no secreta se empleó en cada llamada.
- Dinero en enteros de millonésimas de USD, sin flotantes. Un límite ausente se muestra como no configurado; no debe interpretarse silenciosamente como presupuesto ilimitado.
- `price_snapshot` identifica moneda, precios, unidades, fecha y fuente usados para estimar; un proveedor/modelo sin estimación válida no habilita compromisos de gasto nuevos.

### `llm_calls`, `budget_reservations` y `budget_adjustments`

- Llamada: `id`, `operation_id`, `ai_config_revision_id`, `request_sha256`, `provider_request_id?`, `state`, `input_tokens?`, `output_tokens?`, `other_usage`, `estimated_cost_microusd`, `accounted_cost_microusd?`, `usage_status`, `started_at?`, `finished_at?`.
- Reserva: `id`, `llm_call_id`, `period_key` (`YYYY-MM` en Tucumán), `amount_microusd`, `state` (`reserved`, `settled`, `released`, `uncertain`), `created_at`, `updated_at`.
- Antes de transmitir: validar configuración, disponibilidad presupuestaria y límites de entrada/salida; crear llamada y reserva en una transacción. No mantener la transacción abierta durante la solicitud externa.
- Disponible = límite del período menos costos contabilizados y reservas `reserved/uncertain`; el cálculo y la nueva reserva se realizan bajo el mismo bloqueo de escritura.
- Registrar uso y liquidar/liberar la reserva en una transacción. Un fallo anterior al envío libera; un resultado remoto incierto mantiene la reserva, marca la llamada y requiere conciliación, sin reintento automático.
- Ajuste presupuestario: `id`, `period_key`, `amount_microusd`, `reason`, `source_dataset_id?`, `confirmed_at?`, `created_at`. Registra consumo conservado/conciliado que no figura en el historial restaurado, sin referencias rotas a operaciones de otro conjunto.
- El saldo también descuenta ajustes positivos. Restaurar un backup antiguo no repone gasto externo: exige conciliación del período, conserva al menos el consumo conocido en el conjunto anterior y bloquea nuevas llamadas mientras queden importes inciertos sin resolver.
- El modo gratuito requiere declaración del propietario y un perfil de modelo/cuota compatible; no infiere la modalidad de cuenta a partir de una clave. El modo de pago requiere límites mensual y por operación definidos. Antes de reservar se comprueba tanto el saldo del mes como el total contabilizado/reservado por la operación, incluyendo reintentos.
- El costo calculado es estimado según la tarifa guardada, no un comprobante de facturación del proveedor. Consumo incierto no se presenta como cero.

## Restauración e índices

- `schema_metadata` registra versión del esquema/formato, identidad del conjunto de datos y fecha de creación; `PRAGMA user_version` debe coincidir con la versión soportada.
- Índices sobre fuente/identificador de oferta, URL canónica, estado/fecha, empresa/puesto normalizados, claves foráneas, hash de artefacto, idempotencia y período/estado de reservas.
- Backup y restauración incluyen las tablas anteriores y sus vínculos; excluyen credenciales, sesiones y cachés de navegador. Tras restaurar, la configuración de transmisión se reactiva solo en el entorno local válido.
- El procedimiento de validación, mantenimiento y recuperación está definido en [contracts/storage.md](contracts/storage.md).
