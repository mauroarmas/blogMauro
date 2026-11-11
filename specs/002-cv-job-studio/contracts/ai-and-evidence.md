# Contrato de IA, evidencia y adaptación

**Estado**: diseño de la primera etapa; no ejecuta llamadas reales durante la planificación.
**Relacionados**: [especificación](../spec.md), [plan](../plan.md), [modelo de datos](../data-model.md).
**Objetivo**: producir propuestas revisables y trazables sin convertir una oferta laboral en evidencia profesional del candidato.

## 1. Proveedor y configuración

- `providerId`: `gemini` en la primera entrega. El contrato admite proveedores futuros, pero registrar un nombre no significa que exista un adaptador implementado.
- Adaptador inicial: `@google/genai` 3.x, con versión fijada por el lockfile y runtime compatible con sus requisitos. Validador local: Zod 4.
- `modelId` es configurable. `gemini-3.6-flash` es el candidato inicial verificado durante la planificación, no un alias que deba aceptarse sin comprobar disponibilidad y capacidades al configurar la instalación.
- La configuración debe validar generación de salida estructurada, conteo de tokens, límites de entrada/salida, tratamiento del razonamiento y disponibilidad del modelo antes de habilitar adaptaciones.
- El contrato interno no expone el método de transporte del SDK. El adaptador debe usar la interfaz documentada compatible con la versión instalada, sin asumir métodos heredados ni mezclar formatos de distintas interfaces.
- `GEMINI_API_KEY` se lee exclusivamente en el servidor desde el entorno. Nunca se guarda en la base, snapshots, exportaciones, respuestas HTTP ni almacenamiento del navegador.
- OpenAI u otros proveedores quedan como alternativa futura: no hay cambio automático de proveedor/modelo ante un error.
- El usuario elige modelo, límite mensual y límite por ejecución, seleccionando modalidad gratuita declarada o un presupuesto monetario explícito para pago. No se admite gasto de pago ilimitado en esta entrega. Una configuración incompleta no autoriza llamadas de generación.
- La configuración registra aceptación de las categorías transmitidas: oferta, preferencias laborales necesarias y fragmentos profesionales seleccionados. Foto, teléfono, correo y credenciales se incorporan localmente al CV y se omiten de las solicitudes de adaptación.
- Cada solicitud es autocontenida: no se depende de una conversación remota persistente para reconstruir resultados. La implementación inicial usa Interactions con `store:false`, sin `previous_interaction_id` ni ejecución remota en background; no promete retención nula por omitir un identificador de conversación.

## 2. Flujo explícito y límites de autoridad

La operación consta de tres pasos, iniciados por el usuario. El análisis puede ejecutarse separado de la adaptación: las revisiones humanas ocurren entre operaciones terminadas, con resultados intermedios persistidos; no se deja una solicitud remota abierta esperando al usuario.

1. **Extraer oferta**: interpretar únicamente el texto adjunto y devolver campos y requisitos con evidencia dentro de esa oferta.
2. **Analizar compatibilidad**: relacionar requisitos corregidos, preferencias y evidencia profesional recuperada; señalar coincidencias, brechas, conflictos y datos desconocidos.
3. **Proponer adaptación**: redactar biografía y resúmenes, seleccionar proyectos y priorizar competencias, citando los fragmentos utilizados y explicando cambios.

El modelo devuelve datos; no puede editar archivos, consultar rutas arbitrarias, cambiar preferencias, leer secretos, navegar ni enviar candidaturas. El servidor decide qué leer, validar, guardar y renderizar. La generación general sin oferta continúa funcionando sin IA.

Las instrucciones del sistema se mantienen separadas del texto de ofertas y documentos. Los bloques de datos incluyen tipo, identificador y delimitación inequívoca, pero esos delimitadores no se consideran una defensa suficiente contra instrucciones maliciosas. Las salidas se validan y las acciones permitidas están limitadas por el servidor.

## 3. Corpus profesional permitido

La ingestión comienza con cuatro módulos estructurados (`perfil`, `proyectos`, `formacion`, `stack`), cinco casos publicados y cuatro PDFs profesionales actualmente vinculados: tres de NAP y el informe de clasificación de aves. Nuevas entradas se descubren mediante el catálogo profesional y sus referencias permitidas, no recorriendo indiscriminadamente el equipo.

- Incluir datos estructurados, títulos, extractos, cuerpos de casos, límites de resultados y documentos locales referenciados como documentación o informe profesional.
- Añadir aportaciones privadas confirmadas por el propietario con `entityType`, `entityId`, texto, categoría (`fact`, `learning`, `interest`, `preference`), fecha y autor de confirmación. Estas aportaciones no modifican silenciosamente el contenido público.
- Excluir ofertas, versiones generadas, CV históricos, HTML de referencia, código ajeno a los módulos de datos, dependencias, configuración y secretos. Una versión derivada no es evidencia de una credencial.
- Resolver rutas reales dentro de raíces permitidas y rechazar escapes mediante rutas relativas o enlaces simbólicos. Decodificar y normalizar las referencias públicas una sola vez.
- Ejecutar la lectura de módulos confiables del proyecto en un proceso nuevo por actualización del corpus para contemplar imports relativos y evitar revisiones antiguas en caché. Los adjuntos son datos y nunca se importan como módulos ejecutables.
- El proceso de ingestión recibe un entorno mínimo, sin las claves del proveedor; devuelve únicamente los datos permitidos del catálogo.
- Mostrar fuentes ausentes, ilegibles o excluidas con su motivo. Una fuente inaccesible no debe desaparecer silenciosamente de una revisión ya guardada.

### Extracción y fragmentos

- TXT: validar UTF-8, preservar original y texto normalizado; no ejecutar contenido ni interpretar HTML.
- PDF: usar Poppler (`pdfinfo`, `pdftotext`) con argumentos separados, sin shell, salida UTF-8 y conservación de saltos de página. El estado de lectura incluye versión del extractor.
- Límites propuestos: ofertas de hasta 10 MiB y 50 páginas; documentos profesionales de hasta 25 MiB y 100 páginas; 30 segundos y salida máxima de 2 MiB por extracción. Un exceso produce error visible, no truncamiento silencioso.
- PDF escaneado, protegido o sin texto utilizable: `unreadable`, con opción de pegar el contenido. OCR no forma parte de esta entrega.
- Dividir casos por encabezado/párrafo y PDFs por página/párrafo; fragmentos de hasta 1.200 caracteres cuando sea posible, preservando oraciones. Un fragmento no debe cruzar páginas de origen.
- Cada fragmento tiene `fragmentId`, `sourceRevisionId`, entidad, texto exacto y localizador: campo estructurado, encabezado/offsets o página/offsets. Los offsets se refieren al texto extraído preservado, no a una extracción posterior.
- Las tablas o columnas de extracción ambigua se señalan para revisión. El texto extraído no se trata como una reconstrucción infalible del documento.

## 4. Recuperación local y snapshots

La primera entrega usa recuperación léxica determinista en JavaScript, sin embeddings ni base vectorial. Se normalizan mayúsculas, tildes y alias explícitos ES/EN de dominios y tecnologías, preservando diferencias como C, C++ y C#.

Para cada requisito se asignan coincidencias ponderadas: nombre de tecnología/proyecto = 4, encabezado o campo estructurado = 3, cuerpo = 1. Cada término canónico cuenta una vez por campo y fragmento; empates se resuelven por identificador estable. Se seleccionan hasta 6 fragmentos por requisito, con un máximo de 2 por documento cuando existan otras fuentes pertinentes, eliminando duplicados.

El contexto siempre incluye datos canónicos protegidos y los límites de los proyectos seleccionados: rol individual/equipo, alcance, estado, fechas, institución y condiciones de las métricas. Estos invariantes no se descartan porque otro párrafo tenga mejor coincidencia léxica. La relevancia léxica por sí sola no equivale a respaldo de una afirmación.

El límite total de contexto decide cuántos fragmentos adicionales entran. La operación registra selección, puntuación, versión de alias/ranking y exclusiones por presupuesto. Si los datos obligatorios no caben, se solicita reducir alcance; no se eliminan restricciones esenciales para hacer lugar.

- Cada archivo se lee una vez, se conserva como BLOB y se identifica por SHA-256 completo de sus bytes.
- `SourceRevision` conserva identidad lógica, bytes, texto extraído, hashes, localizadores y estado de lectura. El hash corto del generador actual no sustituye este registro.
- `EvidenceSnapshot` conserva el manifiesto ordenado de revisiones, datos estructurados y fragmentos utilizados. Los BLOB y metadatos se guardan en SQLite según el modelo de datos.
- Al iniciar una operación se fijan revisiones de oferta, preferencias y fuentes. Se comprueba si cambiaron antes de marcar la adaptación como revisada; un cambio invalida la revisión pendiente y se muestra al usuario. La revisión histórica de un CV guardado conserva su fecha; se muestra una señal de fuentes nuevas, sin reescribir aquel evento.
- Toda versión guardada conserva PDF exacto, contenido de render, HTML autónomo, manifiesto y revisión de presentación. Descargar una versión no implica regenerarla con fuentes nuevas.

## 5. Formato de las respuestas

Cada respuesta usa un objeto JSON de esquema cerrado, validado localmente con Zod incluso si el proveedor ofrece salida estructurada. No se aceptan propiedades inesperadas, identificadores fuera del contexto, HTML, comandos ni URLs inventadas. Los límites del esquema del proveedor se complementan con validación local; cumplir el esquema no demuestra veracidad.

El servidor añade `operationId`, paso, fechas, proveedor/modelo efectivos, revisiones, versión de instrucciones/esquema, consumo y estado de validación. Estos campos de auditoría no se confían al contenido producido por el modelo.

### `OfferExtraction`

- `schemaVersion`, `title`, `company`, `location`, `workMode`, `seniority`, `languages`, `conditions` y `requirements`.
- Los campos desconocidos usan `null` más un motivo, no textos plausibles inventados. `workMode`: `remote | onsite | hybrid | unknown`.
- Cada requisito lleva `id`, texto, categoría, importancia `required | preferred | unknown` y citas con offsets del texto original. La importancia desconocida no se convierte automáticamente en obligatoria.
- Requisitos con varios compromisos se separan en unidades evaluables. Se rechazan citas que no coincidan con la revisión de oferta.
- Límites: hasta 80 requisitos, título de 200 caracteres, empresa de 200 y texto de requisito de 1.000. Un exceso requiere dividir o corregir la oferta, sin descartes silenciosos.

### `MatchAnalysis`

- Una entrada por requisito con `requirementId`, `status`, `evidenceRefs`, explicación y datos que faltan.
- `supported`: evidencia concreta que respalda el requisito; `partial`: evidencia relacionada que no cubre todo el alcance; `unsupported`: requisito comprensible sin evidencia profesional documentada; `unknown`: falta información para evaluarlo; `conflict`: fuentes pertinentes incompatibles.
- `unsupported` no afirma que el propietario sea incapaz: significa «sin evidencia documentada». `unknown` no se presenta como coincidencia.
- `evidenceRefs` contiene fragmento, cita exacta y localizador; las referencias se validan contra el snapshot.
- Las condiciones excluyentes se evalúan por separado como `pass | fail | unknown`, con su origen en la preferencia confirmada y en la oferta. La ubicación presencial se inicializa como condición excluyente: presencial fuera de la provincia de Tucumán = fail; presencial en Tucumán = pass; ubicación ausente = unknown. Para remoto esta condición geográfica no se aplica; elegibilidad remota se verifica por separado. La modalidad híbrida sigue sin definir y se muestra para revisión, sin inferir autorización de traslado.
- El modelo propone relaciones y razones; el servidor calcula el nivel de ajuste conforme a la regla publicada siguiente.

### Regla de ajuste reproducible

- Peso 2 para requisitos expresamente obligatorios y 1 para deseables o de importancia desconocida.
- Valor de cobertura: `supported` = 1, `partial` = 0,5; `unsupported`, `unknown` y `conflict` = 0. Cobertura = suma ponderada / suma de pesos.
- Resultado `insufficient_information` si falta puesto, no hay requisitos evaluables o más de la mitad de los requisitos tiene estado `unknown`.
- Resultado `low` si existe una condición excluyente `fail` o, con información suficiente, cobertura menor a 50 %.
- Resultado `high` si cobertura es al menos 80 %, todos los requisitos obligatorios son `supported`, no hay conflictos y ninguna condición excluyente está pendiente o incumplida.
- Resultado `medium` en los demás casos con información suficiente. Un resultado insuficiente nunca oculta un excluyente incumplido: ese conflicto se muestra siempre y la oferta no se recomienda como compatible.
- Se muestran los factores que determinaron el resultado. El nivel no es una probabilidad de contratación. Correcciones humanas recalculan el mismo criterio y quedan registradas.

### `AdaptationProposal`

- `locale`, `biographyClaims`, `selectedProjects`, `selectedSkills`, `changeReasons` y `warnings`.
- Proyectos y competencias se seleccionan por IDs existentes, con orden explícito. Un proyecto puede tener nuevas formulaciones respaldadas, no un historial nuevo.
- Cada afirmación incluye `claimId`, texto, destino dentro del CV, categoría, `evidenceRefs` y `reviewStatus` inicial `pending`.
- El modelo no devuelve nombre, instituciones, fechas, roles o nivel de idioma como valores reemplazables: el render los toma de datos canónicos. Una mención narrativa de esos datos también debe respetar los invariantes.
- Límites: biografía total hasta 6.000 caracteres, resumen por proyecto hasta 5.000, 100 afirmaciones y 30 proyectos. Texto más largo se presenta como error corregible; la plantilla pagina el contenido aceptado sin achicarlo ni ocultarlo.

## 6. Afirmaciones, contradicciones y revisión

Referenciar un fragmento real no prueba que la afirmación se deduzca de él. Se separan `source_located`, `pending`, `conflict` y `owner_confirmed`; ninguna validación de esquema convierte automáticamente una narrativa en confirmada.

Las comprobaciones deterministas validan pertenencia de referencias, citas exactas y consistencia de números, fechas, unidades y campos protegidos. Un chequeo semántico asistido puede advertir problemas, pero no sustituye la confirmación del propietario.

Las discrepancias se agrupan por entidad, atributo, unidad y alcance temporal. Dos mediciones bajo condiciones distintas no se fusionan ni se tratan automáticamente como una contradicción. Se conserva la resolución del propietario con las fuentes involucradas y su motivo.

Invariantes de aceptación iniciales:

- NAP: validación de laboratorio y despliegue institucional pendiente; alcance del software del autor separado del trabajo del equipo.
- NAP: artículo aceptado no equivale a presentación realizada; métricas con datos sintéticos o transportes simulados conservan esas condiciones.
- TrimIA: ventas y crédito simulados en la demo no equivalen a integración productiva verificada.
- Inglés intermedio no se eleva a avanzado por el idioma de la oferta o del CV.
- Interés, conocimiento en formación y nociones no se convierten en experiencia laboral o dominio profesional.

El panel muestra propuesta, cambios y evidencia abrible junto a cada bloque. Editar una afirmación invalida su revisión. Puede guardarse una versión como borrador, pero marcarla revisada exige resolver todas las afirmaciones pendientes, referencias inválidas y conflictos. Una aportación nueva debe confirmarse como evidencia privada, no simplemente aceptar una frase sin origen.

## 7. Tokens, costo y tiempo

- Máximo por petición: 24.000 tokens de entrada, incluidos instrucciones, oferta y evidencia, y 6.000 tokens de salida. Usar conteo compatible con el modelo; no usar caracteres como límite monetario definitivo.
- Cada paso dispone de hasta 60 segundos. La ejecución completa dispone de 240 segundos desde su inicio, incluido conteo, esperas y reintento; las revisiones humanas pausadas no consumen ese plazo.
- Se permite un único reintento global de generación en la ejecución, solo ante respuesta explícita 429 o 503 antes de recibir contenido, respetando `Retry-After` y el plazo restante. Hay como máximo cuatro intentos de generación si se ejecutan los tres pasos juntos; analizar por separado utiliza dos pasos y adaptar desde un análisis vigente utiliza uno. Cada operación conserva su propio límite y no repite pasos ya válidos.
- Un timeout, desconexión o consumo desconocido no provoca reintento automático. Se registra resultado incierto y se ofrece iniciar un intento nuevo deliberadamente, conservando la estimación reservada hasta reconciliarla.
- Antes de cada solicitud se reserva presupuesto de manera transaccional usando tokens de entrada contados y el máximo de salida. No se descuenta por posibles aciertos de caché antes de observarlos.
- Si el modelo contabiliza razonamiento dentro del máximo de salida, los 6.000 tokens reservados lo incluyen; si lo contabiliza aparte, el adaptador debe fijar un techo adicional verificable y reservarlo a tarifa de salida. Si no puede establecer una cota, ese modelo no se habilita con límite monetario.
- La tabla de precios configurada identifica modelo, moneda, tarifas por millón, reglas de caché/razonamiento, fecha y procedencia. Cambiar modelo invalida su validación de precios/capacidades; no se reutiliza el precio de otro modelo.
- Conciliar con el uso informado por el proveedor, incluyendo tokens de razonamiento cuando corresponda. Si falta el dato, conservar el peor caso reservado y marcar `usage_unknown`; no convertir el costo a cero.
- El límite mensual se calcula con zona horaria `America/Argentina/Tucuman` sobre uso confirmado más reservas abiertas. La UI distingue costo conocido, reservado y estimado. Es un control del cliente, no una garantía sobre cargos externos al módulo.
- No se inicia una solicitud que exceda el límite mensual o por ejecución configurado. Llegar al límite conserva resultados parciales y muestra la acción pendiente; no cambia de modelo ni proveedor para continuar.

## 8. Errores y validación de aceptación

Errores identificables: `PROVIDER_NOT_CONFIGURED`, `MODEL_NOT_VALIDATED`, `BUDGET_EXCEEDED`, `INPUT_LIMIT`, `UNREADABLE_SOURCE`, `SOURCE_CHANGED`, `INVALID_RESPONSE`, `INVALID_EVIDENCE`, `EVIDENCE_CONFLICT`, `DEADLINE_EXCEEDED` y `USAGE_UNKNOWN`. La respuesta pública omite claves, contenido completo de credenciales y detalles internos innecesarios.

Pruebas requeridas: alias ES/EN; requisito sin respaldo; citas inexistentes; números/roles exagerados; prompt injection en oferta/PDF; archivo ilegible o sobredimensionado; fuente editada o eliminada tras congelar un snapshot; cambio de modelo sin revalidar; presupuesto concurrente; razonamiento/uso desconocido; 429/503 y timeout; preservación de versiones antiguas; reanudación manual sin duplicar resultados. Las pruebas automatizadas usan un adaptador simulado y fixtures; las pruebas reales de proveedor son opt-in, con clave y presupuesto configurados.

## Referencias consultadas

- [Gemini: salidas estructuradas](https://ai.google.dev/gemini-api/docs/structured-output): formato estructurado y sus límites; la validación de negocio sigue en el servidor.
- [Gemini: modelos](https://ai.google.dev/gemini-api/docs/models) y [conteo de tokens](https://ai.google.dev/gemini-api/docs/tokens): capacidades que debe verificar la configuración del modelo elegido.
- [JSON Schema: objetos](https://json-schema.org/understanding-json-schema/reference/object): propiedades requeridas y rechazo de campos adicionales.
- [OWASP: prevención de prompt injection](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html): separación de instrucciones/datos, validación de salidas y privilegios mínimos.
- [Poppler](https://poppler.freedesktop.org/) y manual local `/usr/share/man/man1/pdftotext.1.gz`: extracción, UTF-8 y conservación de páginas. El entorno inspeccionado tiene Poppler 24.02.0; usar una distribución mantenida y registrar la versión efectiva.
