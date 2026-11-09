# Storage Contract — persistencia, versiones y recuperación

**Fecha**: 2026-11-08 · **Estado**: diseño, sin implementación · **Modelo**: [../data-model.md](../data-model.md)

## 1. Límite de responsabilidad

Este contrato pertenece al servicio local de CV Studio. Interfaz y comandos utilizan los mismos servicios y reglas; no escriben directamente en tablas o archivos privados.

- Runtime base: Node 24.16.x con `node:sqlite` (release candidate en la versión verificada).
- Base única: `.cv-studio/studio.sqlite`; permisos `0700` en el directorio y `0600` en base, temporales y backups generados.
- `.cv-studio/` queda excluido de Git y de cualquier copia hacia `public/` u `out/`.
- Persistencia: claves foráneas activas, tablas con tipos y restricciones explícitos, sentencias parametrizadas y transacciones cortas. No se ejecuta SQL proveniente de usuarios, ofertas, modelos o backups.
- Una instancia propietaria coordina las mutaciones y operaciones pesadas. Si ya existe una instancia, un comando utiliza su servicio o falla con una explicación; no inicia otro escritor independiente.
- Las consultas y el PDF general ya disponible siguen siendo utilizables sin una clave de IA; la asistencia remota necesita la configuración válida correspondiente.

## 2. Identidad y serialización

| Dato | Contrato |
|---|---|
| Entidades | UUID, generado por el servicio; no reutilizar IDs después de borrar |
| Artefactos | SHA-256 completo sobre bytes, 64 caracteres hexadecimales al transportarlo |
| Documentos estructurados | JSON validado, con `schemaVersion` y serialización canónica para calcular hashes |
| Instantes | ISO 8601 UTC; UI y mes presupuestario en `America/Argentina/Tucuman` |
| Importes | Enteros de millonésimas de USD, asociados a moneda/tarifa explícitas |
| Campos ausentes | `null` o estado `unknown`, distinto de cero, vacío o incumplimiento |
| Revisión editable | Entero creciente; actualizar exige `expectedRevision` |
| Idempotencia | Clave de solicitud más hash de entrada; misma clave no admite otra entrada |

Los hashes de fuentes y snapshots incluyen identidades y límites de campos inequívocos. Dos archivos distintos con igual texto no se confunden como una sola fuente; pueden compartir su artefacto de bytes.

## 3. Artefactos y fuentes

### `putArtifact(bytes, mediaType)`

- Calcula hash y longitud, valida el tipo permitido y los límites de tamaño del flujo de origen.
- Si ya existe, reutiliza únicamente tras comprobar coincidencia de longitud y contenido.
- Devuelve `{sha256, mediaType, byteLength}`; no devuelve una ruta del sistema de archivos.
- La inserción definitiva se realiza dentro de la transacción que confirma la entidad consumidora o queda asociada a un intento identificable para limpieza posterior.

### `captureKnowledgeSnapshot(sourceManifest)`

- Solo lee fuentes profesionales incluidas en el manifiesto autorizado; aplica resolución de rutas reales para evitar salir de las raíces admitidas mediante enlaces simbólicos.
- Congela revisiones, originales, extracción, fragmentos y localizadores. Registra fuentes ausentes o ilegibles sin tratarlas como contenido vacío válido.
- Devuelve `{snapshotId, snapshotSha256, sources, warnings}`.
- El snapshot se confirma con todas sus asociaciones. Una fuente que cambia durante su captura se vuelve a leer o se informa como inestable; nunca se mezcla una revisión de texto con bytes de otra.

### `compareCurrentSources(snapshotId)`

- Devuelve revisiones iguales, modificadas, ausentes o ilegibles con sus identidades.
- La revisión del CV utiliza este resultado. Una comprobación no modifica versiones históricas ni sustituye su evidencia.

## 4. Ofertas, preferencias y borradores

### `saveOfferRevision(opportunityId?, original, fields, provenance)`

- Deduplica por identidad externa o URL canónica cuando son conocidas; una coincidencia aproximada solo produce una sugerencia.
- Inserta una nueva revisión y mueve el puntero vigente en la misma transacción.
- Mantiene originales de LinkedIn, Computrabajo, otras fuentes y entradas manuales con procedencia distinta de las fuentes profesionales.
- Devuelve oportunidad/revisión, resultado de duplicado y advertencias de campos desconocidos.

### `updateDraft(draftId, expectedRevision, patch)`

- Valida esquema, referencias de evidencia y pertenencia al snapshot.
- Revisión obsoleta ⇒ `REVISION_CONFLICT`, sin sobreescritura; la UI debe recuperar la revisión vigente.
- Una modificación incrementa la revisión e invalida cualquier revisión humana de contenido anterior.
- Nuevos hechos necesitan una aportación profesional confirmada o corrección de fuente, incorporada a un nuevo snapshot. No se aceptan como evidencia por aparecer en una respuesta del modelo.

### `appendPreferenceRevision(profileId, expectedRevision, preferences)`

- Crea una revisión nueva y actualiza el puntero vigente; los análisis existentes conservan sus preferencias anteriores.
- Desconocido no se convierte automáticamente en condición excluyente.

## 5. Operaciones e idempotencia

### `startOperation(kind, requestKey, frozenInput)`

- Inserta la operación antes de comenzar trabajo pesado.
- Misma clave y entrada ⇒ devuelve la misma operación y su estado. Misma clave con distinto hash ⇒ `IDEMPOTENCY_CONFLICT`.
- Una única operación pesada puede pasar a `running`; las demás quedan en `queued`. Mutaciones relacionadas con datos cambian mediante transacciones independientes y breves.
- Solicitudes externas y renderizado se ejecutan fuera de transacciones de escritura.
- Al reiniciar, `running` pasa a `interrupted`; se conservan resultados confirmados. No se repiten llamadas remotas cuyo resultado o consumo sean inciertos.
- Un reintento explícito crea un intento vinculado al original, con una nueva clave; una regeneración deliberada genera una nueva versión.

### `reserveModelCall(operationId, configRevisionId, requestBounds)`

- Requiere transmisión habilitada, categorías de datos confirmadas, clave disponible en el entorno, tarifa conocida y política presupuestaria configurada. La operación explícita de validación de configuración puede ejecutarse antes de habilitar adaptaciones, respetando las mismas categorías, límites y reservas.
- En la misma transacción: calcula período local, costo reservado máximo según límites de la llamada, gasto/reservas existentes; valida saldo mensual y total contabilizado/reservado de la operación (incluidos reintentos) e inserta llamada + reserva. En modalidad gratuita válida se registran tokens/cuota y costo monetario cero, sin habilitar pago automáticamente.
- Presupuesto insuficiente ⇒ `BUDGET_EXCEEDED`; configuración incompleta ⇒ `AI_CONFIGURATION_REQUIRED`. Ninguno transmite datos.
- Usa un importe superior conservador según límites y tarifa documentados. Un cambio de modelo/tarifa requiere otra revisión de configuración, sin recalcular el pasado.

### `settleModelCall(callId, providerOutcome)`

- Registra uso y costo estimado calculado y liquida la reserva atómicamente; acepta una sola liquidación compatible por llamada.
- Fallo conocido anterior al envío ⇒ libera reserva. Resultado remoto incierto ⇒ conserva el importe como `uncertain` hasta conciliación.
- El presupuesto suma costos contabilizados, ajustes positivos conciliados y reservas pendientes/inciertas del período de inicio de cada llamada.
- Las cifras locales son control estimado de consumo; no se etiquetan como factura del proveedor.

## 6. Publicar y recuperar una versión privada

### `commitCvVersion(operationId, frozenInputs, renderedArtifacts)`

1. Verificar que el renderizado terminó correctamente, el PDF es válido y no existe error de paginación.
2. Validar asociaciones de oferta, fuentes, preferencias, borrador y presentación; verificar hashes de los artefactos.
3. En una transacción: insertar/reutilizar artefactos, insertar versión inmutable, vincular su estado inicial de revisión y finalizar la operación.
4. Confirmar la transacción antes de anunciar la versión disponible o permitir descargarla.

Fallo antes del commit ⇒ ninguna versión disponible. Fallo después del commit pero antes de responder ⇒ la misma clave recupera la versión existente. El PDF no se regenera al descargar.

### `getVersionDocument(versionId)`

- Disponible ⇒ bytes originales y metadatos de tipo, tamaño y hash.
- Archivada ⇒ mantiene descarga si se abre desde historial.
- Eliminada ⇒ `VERSION_DELETED`, con información del tombstone; nunca un documento reconstruido o diferente bajo el mismo identificador.
- Desaparecido/corrupto ⇒ `ARTIFACT_INTEGRITY_ERROR`; no se reemplaza silenciosamente con una nueva generación.

### `reviewVersion(versionId, decision)`

- Registra evento de revisión, no modifica el contenido de la versión.
- Para `reviewed`: no quedan afirmaciones pendientes/conflictivas, se verifican cambios de fuentes desde la captura y se valida la política de enlaces/comprobaciones del destinatario de `studio-ui-cli.md`. Una fuente nueva que cambia el contenido requiere una versión descendiente.
- No habilita envíos externos en etapa 1. `markManuallySent` registra una declaración del propietario, nunca una confirmación externa.

## 7. Archivo y eliminación

- `archiveVersion` cambia metadatos de ciclo de vida y registra actividad; es la opción predeterminada para quitar una versión de la lista activa.
- `previewDeleteVersion` informa candidaturas asociadas, contenido que desaparecerá y artefactos compartidos que deben conservarse.
- `deleteVersion` exige confirmación del alcance presentado y la revisión de asociaciones vigente; si cambió, devuelve conflicto y requiere revisar el alcance actualizado.
- Se conserva un tombstone mínimo y las asociaciones históricas de candidaturas; los vínculos muestran «archivo eliminado». Se purgan únicamente artefactos sin referencias activas.
- El borrado no altera el estado real de una candidatura ni elimina hechos de envío del historial.

## 8. Copia de seguridad coherente

### `exportBackup()`

- Entra en mantenimiento: pausa nuevas mutaciones y espera a que termine o se cancele de forma controlada la operación pesada activa. No toma una copia a mitad de una llamada remota aún no contabilizada.
- Utiliza `node:sqlite.backup()` hacia un archivo temporal nuevo. No copia directamente el archivo SQLite abierto ni separa el WAL de su base.
- La base resultante incluye metadatos, originales, fragmentos, preferencias, análisis, borradores, versiones exactas, actividad, operaciones, configuración no secreta y consumo/reservas.
- Verifica integridad, relaciones y hashes; publica el backup completo mediante renombrado atómico y sale del mantenimiento.
- La exportación es una única base SQLite con versión de formato, sin claves, sesiones o cachés de navegador. Incluye bytes de fuentes y presentación como evidencia histórica, pero restaurar nunca ejecuta esos bytes ni instala código de aplicación; el render de nuevas versiones utiliza módulos confiables de la instalación.
- Si falla, el backup temporal se descarta y la base activa permanece disponible. A partir de 512 MiB, la operación rechaza con `BACKUP_TOO_LARGE` y explica el límite de restauración de esta etapa.

## 9. Validación y restauración de backup no confiable

### `inspectBackup(upload)`

- Admite como máximo 512 MiB; valida cabecera/formato antes de procesarlo. Nunca acepta SQL, archivos comprimidos ni rutas de extracción.
- Abre la entrada exclusivamente de lectura, con extensiones deshabilitadas, modo defensivo, esquema no confiable, límites de recursos y tiempo de validación acotado.
- Exige versión soportada y esquema exactamente reconocido: allowlist de tablas/columnas/tipos/índices; prohíbe vistas, triggers, tablas virtuales y objetos inesperados.
- Compara el esquema antes de consultar datos de usuario; no ejecuta sentencias de creación o migración que provengan del backup.
- Verifica integridad, claves foráneas, IDs, estados permitidos, tamaños, JSON versionado y SHA-256 de cada artefacto. Presenta conteos y posibles operaciones interrumpidas.
- Una validación fallida conserva el conjunto activo y devuelve un error accionable; un esquema futuro no se acepta parcialmente.

### `restoreBackup(validatedBackup, expectedDatasetId, confirmation)`

1. Entrar en mantenimiento y confirmar que no hay operaciones activas ni escrituras concurrentes.
2. Revalidar identidad/hash del archivo inspeccionado y del conjunto de datos que se reemplazará.
3. Construir una base nueva con el esquema confiable de la aplicación e importar solamente datos permitidos mediante sentencias parametrizadas; nunca adoptar el esquema recibido.
4. Verificar relaciones, hashes, conteos y documentos exactos en la base nueva. Normalizar operaciones activas históricas a `interrupted` y conservar reservas de consumo incierto.
5. Cerrar conexiones y realizar el reemplazo conservando una copia recuperable de la base anterior; registrar la restauración con ambas identidades y conteos.
6. Reabrir y comprobar la base restaurada antes de salir de mantenimiento. No importar claves; las autorizaciones de transmisión externas quedan pendientes de reactivación en el entorno local.
7. Marcar el presupuesto del período como pendiente de conciliación: recuperar/conciliar el gasto externo posterior al backup, usando el conjunto anterior y la información disponible del proveedor. Registrar cualquier diferencia como ajuste; no habilitar nuevas llamadas si eso devolvería saldo ya consumido o ignoraría reservas inciertas.

## 10. Recuperación y verificación

- Una herramienta local de recuperación funciona con el servidor detenido y la base cerrada. Puede verificar/restaurar el último backup válido cuando el panel no logra iniciar; no requiere la IA ni un portal de empleo.
- La recuperación reconoce temporales incompletos y el backup anterior; nunca elige un archivo únicamente por ser el más reciente sin validar su integridad.
- Pruebas obligatorias: doble clic/idempotencia; conflicto de edición; cierre antes/después del commit; reinicio con operación activa; igualdad de bytes de 20 CVs tras cambiar fuentes y restaurar.
- Probar también copia con WAL activo, referencias a artefactos compartidos, borrado con candidaturas, esquema con trigger/vista, JSON o hashes inválidos, backup truncado/sobredimensionado y restauración interrumpida.
- Presupuesto: dos reservas concurrentes no exceden el saldo permitido; consumo incierto permanece reservado; restaurar un backup antiguo no repone gasto; cambio de mes usa Tucumán; claves del entorno no aparecen en DB, backup, errores o logs.
- Rechazar cualquier intento de acceder a datos privados desde la publicación del portafolio, usar una ruta arbitraria o descargar artefactos sin una entidad válida que los vincule.
