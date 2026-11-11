# Feature Specification: CV Studio — Adaptación de CV y seguimiento laboral

**Feature Branch**: No se creó una rama; esta especificación es independiente de la rama de trabajo.

**Created**: 2026-11-08

**Status**: Primera etapa planificada — lista para descomposición en tareas

**Input**: El propietario quiere que el proyecto sea su base de conocimiento profesional y ampliar CV Studio para adaptar CV a ofertas adjuntas, conservar versiones, encontrar oportunidades, preparar postulaciones y centralizar el seguimiento en un dashboard. Pide ser entrevistado para resolver dudas y poder iniciar el trabajo mediante una orden explícita.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adaptar un CV a una oferta usando mi trayectoria real (Priority: P1)

Como Mauro, quiero adjuntar una oferta y obtener una propuesta de CV que destaque mis experiencias relevantes, con una explicación del ajuste y las carencias, para preparar una candidatura fiel a mi trayectoria en menos tiempo.

**Why this priority**: Es el valor central de la primera entrega y puede utilizarse con ofertas obtenidas por el propio usuario.

**Independent Test**: Incorporar una oferta de desarrollo junior y otra de infraestructura desde texto o documento; preparar un CV para cada una y contrastar sus afirmaciones con las fuentes del perfil.

**Acceptance Scenarios**:

1. **Given** una oferta pegada como texto o adjunta en un PDF con texto legible, **When** solicito analizarla, **Then** veo el contenido original, puesto, empresa, modalidad, ubicación, idioma y requisitos detectados; los datos ausentes quedan como desconocidos y puedo corregir la interpretación.
2. **Given** una oferta analizada y mi contenido profesional disponible, **When** solicito adaptar el CV, **Then** recibo una propuesta con biografía, selección y orden de proyectos, competencias y descripciones ajustadas, junto con las razones de los cambios y sus fuentes.
3. **Given** una oferta que solicita una tecnología o experiencia ausente de mis fuentes, **When** se genera la adaptación, **Then** esa ausencia aparece como brecha; no se convierte en una competencia ni en años de experiencia inventados.
4. **Given** una propuesta, **When** modifico la redacción, los proyectos o las opciones de presentación, **Then** puedo previsualizar y guardar el PDF; las afirmaciones nuevas sin respaldo se señalan para que aporte evidencia o las retire antes de marcarlo revisado.
5. **Given** una adaptación para desarrollo o para infraestructura, **When** guardo la versión, **Then** se conserva la identidad visual de CV Studio y la base profesional general sigue disponible para otras oportunidades.

---

### User Story 2 - Conservar y comparar las versiones que preparé (Priority: P1)

Como Mauro, quiero guardar cada CV junto con la oferta, las fuentes y las decisiones que lo originaron para saber qué preparé o presenté en cada oportunidad.

**Why this priority**: Sin historial, una actualización del perfil o una nueva generación puede hacer perder la candidatura anterior.

**Independent Test**: Guardar dos versiones para la misma oferta, modificar posteriormente el perfil y reabrir ambas versiones; sus documentos originales deben seguir disponibles y ser comparables.

**Acceptance Scenarios**:

1. **Given** un PDF generado correctamente, **When** finaliza su guardado, **Then** aparece una versión identificable con fecha, oferta, idioma, opciones, resumen de cambios, procedencia de las afirmaciones y una copia de las fuentes utilizadas.
2. **Given** una versión guardada, **When** cambio el perfil y genero otra, **Then** la primera conserva su contenido y archivo exactos; la nueva queda vinculada como una versión diferente.
3. **Given** dos versiones, **When** las comparo, **Then** identifico cambios en biografía, proyectos, competencias y redacción sin tener que abrir dos archivos por separado.
4. **Given** una candidatura vinculada a una versión, **When** consulto su historial, **Then** puedo descargar exactamente el CV asociado y distinguirlo de versiones posteriores.
5. **Given** un fallo al generar o guardar, **When** reviso el historial, **Then** aparece el intento fallido con una explicación, sin un documento incompleto marcado como disponible.

---

### User Story 3 - Organizar oportunidades y seguimiento en un dashboard (Priority: P1)

Como Mauro, quiero consultar ofertas, análisis, versiones y acciones pendientes en un mismo lugar para llevar un seguimiento de mi búsqueda laboral.

**Why this priority**: Permite utilizar diariamente las adaptaciones y el historial, incluso antes de incorporar conexiones externas.

**Independent Test**: Cargar oportunidades y registrar manualmente postulaciones, entrevistas y descartes; verificar filtros, detalle, historial y conteos.

**Acceptance Scenarios**:

1. **Given** varias ofertas, **When** abro el dashboard, **Then** veo empresa, puesto, modalidad, ubicación, nivel de ajuste, brechas, estado, última actividad y próxima acción cuando exista.
2. **Given** una oportunidad, **When** abro su detalle, **Then** encuentro oferta original, análisis, versiones, notas y seguimiento en una secuencia comprensible.
3. **Given** una postulación que realicé por fuera de CV Studio, **When** registro fecha, canal y versión enviada, **Then** aparece como envío declarado por mí, diferenciado de una confirmación observada directamente en el canal externo.
4. **Given** filtros por estado, empresa, puesto, modalidad, ajuste o fecha, **When** los aplico, **Then** la lista y los conteos muestran únicamente las oportunidades correspondientes, sin contar versiones de CV como postulaciones adicionales.
5. **Given** una oportunidad ya registrada, **When** adjunto otra copia de la misma oferta, **Then** se detecta la coincidencia y puedo actualizar su información o conservar una revisión sin duplicar su seguimiento.

---

### User Story 4 - Mantener mi base profesional y mis preferencias (Priority: P1)

Como Mauro, quiero que CV Studio consulte mis proyectos, documentación, formación, conocimientos e intereses vigentes y me permita definir preferencias laborales para adaptar las propuestas a mi situación real.

**Why this priority**: La confiabilidad de las adaptaciones depende de fuentes actuales y de distinguir experiencia, conocimientos en formación e intereses.

**Independent Test**: Actualizar una descripción de proyecto y una preferencia, solicitar un nuevo análisis y verificar su efecto sin alterar versiones históricas.

**Acceptance Scenarios**:

1. **Given** una modificación en mi perfil, proyecto o documento profesional incluido, **When** vuelvo a analizar o generar, **Then** se usa la revisión actual y puedo consultar qué fuentes se utilizaron.
2. **Given** dos fuentes contradictorias sobre un logro, una fecha o mi rol, **When** se propone usar ese dato, **Then** se presenta la contradicción y se solicita resolverla; no se selecciona silenciosamente la versión más favorable.
3. **Given** una preferencia por puestos junior o pasantías y remoto o presencial en Tucumán, **When** analizo una oferta, **Then** veo coincidencias, desajustes y datos pendientes; puedo distinguir preferencias de condiciones excluyentes.
4. **Given** un interés declarado en una tecnología sin experiencia demostrada, **When** se adapta el CV, **Then** se conserva esa distinción y no se presenta como experiencia profesional.
5. **Given** una recomendación que considero incorrecta, **When** corrijo la interpretación de la oferta o mis preferencias, **Then** puedo recalcular el análisis con un registro de la corrección.

---

### User Story 5 - Encontrar ofertas y preparar postulaciones bajo mi control (Priority: P2; segunda etapa)

Como Mauro, quiero iniciar explícitamente una búsqueda de oportunidades relevantes, en LinkedIn y Computrabajo Argentina, y revisar cada candidatura antes de que se envíe.

**Why this priority**: Amplía el flujo una vez que las adaptaciones, el historial y el dashboard son confiables. Está fuera de la primera entrega.

**Independent Test**: En un canal de prueba o con oportunidades controladas, iniciar una búsqueda, revisar candidatos y comprobar que cada envío requiere una aprobación individual vinculada a la oferta y los materiales exactos.

**Acceptance Scenarios**:

1. **Given** preferencias y acceso disponible a una fuente, **When** doy la orden de buscar, **Then** se registran los límites de esa ejecución, las ofertas encontradas y las razones de su relevancia, con deduplicación respecto del historial.
2. **Given** una oportunidad seleccionada, **When** se prepara la candidatura, **Then** se muestra el destinatario o destino, el CV y las respuestas requeridas para revisión individual.
3. **Given** una candidatura revisada, **When** apruebo su envío, **Then** solo se envían los materiales aprobados a esa oferta; cambios posteriores en la oferta, las respuestas o el CV requieren una nueva revisión.
4. **Given** una pregunta de selección cuya respuesta no consta en mi información confirmada, **When** se intenta preparar la candidatura, **Then** se me consulta antes de avanzar; no se inventan disponibilidad, expectativa salarial, permiso de trabajo ni experiencia.
5. **Given** un canal inaccesible, una sesión vencida o una etapa que requiere intervención, **When** la ejecución llega a ese punto, **Then** guarda lo preparado y muestra la acción pendiente; cuando sea posible, permite continuar manualmente desde la oferta original.
6. **Given** un intento de envío con resultado incierto, **When** consulto su estado o lo retomo, **Then** se mantiene como pendiente de verificación y no se reenvía automáticamente ni se declara exitoso sin evidencia.

### Edge Cases

- Oferta incompleta, expirada o eliminada: conservar la copia disponible y su fecha, señalar la limitación y permitir actualizarla; no completar campos ausentes por suposición.
- PDF escaneado, ilegible o protegido: informar que no pudo extraerse una oferta utilizable y permitir pegar el texto. El reconocimiento de imágenes no es requisito de la primera entrega.
- Enlace que exige iniciar sesión o no permite recuperar el contenido: conservar el enlace y pedir texto o documento; una URL por sí sola no equivale a una oferta analizada.
- Texto de una oferta que contiene órdenes ajenas al proceso: tratarlo como contenido a analizar, sin permitir que modifique el perfil, las preferencias, los permisos o el comportamiento del módulo.
- Oferta repetida con cambios: reconocer su identidad, conservar revisiones relevantes y no borrar información ya asociada a una candidatura.
- Fuente profesional ausente, desactualizada o contradictoria: señalar la situación y evitar afirmaciones sin respaldo; las versiones históricas conservan las fuentes que efectivamente usaron.
- Ningún proyecto cumple un requisito: mostrar la brecha y proponer únicamente contenido real, sin añadir tecnologías para incrementar artificialmente la coincidencia.
- Oferta con inglés avanzado, modalidad híbrida, ubicación o elegibilidad remota desconocidas: señalar el desajuste o la incertidumbre; no asumir dominio avanzado, movilidad ni autorización laboral.
- CV más largo de lo habitual o enlaces locales que el destinatario no puede abrir: conservar el contenido mediante paginación legible y señalar enlaces inutilizables antes de darlo por revisado.
- Cierre de CV Studio durante una tarea: conservar los resultados ya guardados e identificar intentos incompletos al reabrir; reintentar no debe sobreescribir una versión anterior.
- Generación duplicada por doble acción: mostrar la operación en curso y evitar versiones accidentales del mismo intento; una regeneración deliberada sí crea otra versión.
- Borrado de una versión usada en una candidatura: mostrar la asociación y su consecuencia antes de eliminarla; no dejar enlaces de descarga ficticios.
- Desconexión de una cuenta externa o falta de autorización en segunda etapa: detener las acciones pendientes del canal y conservar el historial local.

## Requirements *(mandatory)*

### Functional Requirements

**Primera etapa: adaptación, historial y dashboard**

- **FR-001**: CV Studio DEBE seguir siendo un espacio privado del propietario. Ofertas, preferencias, análisis, versiones e historial de candidaturas no deben quedar accesibles a los visitantes del portafolio.
- **FR-002**: El sistema DEBE utilizar el contenido profesional mantenido en este proyecto como fuente autorizada: perfil, proyectos, casos de estudio, documentación profesional incluida, formación y competencias. Debe permitir conocer qué fuentes están disponibles y cuáles no pudieron leerse.
- **FR-003**: El sistema DEBE distinguir hechos respaldados, conocimientos en formación, intereses y preferencias. Una oferta externa nunca debe incorporarse como evidencia de experiencia del propietario.
- **FR-004**: Cada adaptación DEBE usar la revisión vigente de las fuentes al comenzar y conservar una copia identificable de lo que utilizó. Los cambios de fuentes durante una operación deben señalarse antes de marcar el resultado como revisado.
- **FR-005**: El propietario DEBE poder mantener preferencias laborales y clasificarlas como deseables o excluyentes. Los valores iniciales serán junior/pasantías de Sistemas o desarrollo como preferencias, presencial únicamente en Tucumán como condición excluyente, remoto con elegibilidad por verificar y español e inglés intermedio. La ubicación presencial se inicializa como condición excluyente: presencial fuera de la provincia de Tucumán = fail; presencial en Tucumán = pass; ubicación ausente = unknown. Para remoto esta condición geográfica no se aplica; elegibilidad remota se verifica por separado. La modalidad híbrida sigue sin definir y se muestra para revisión, sin inferir autorización de traslado.
- **FR-006**: El sistema DEBE aceptar ofertas mediante texto pegado, archivo de texto o PDF con texto legible. Debe permitir registrar su URL de origen aunque no pueda recuperar el contenido del enlace.
- **FR-007**: Cada oferta DEBE conservar contenido original, fuente, fecha de incorporación y campos detectados de puesto, empresa, modalidad, ubicación, seniority, idiomas, requisitos y condiciones informadas. Los campos no informados deben mostrarse como desconocidos y admitir corrección.
- **FR-008**: El análisis DEBE relacionar requisitos de la oferta con evidencia profesional, distinguir coincidencias, brechas y datos desconocidos, y explicar sus conclusiones. El ajuste no debe presentarse como probabilidad de contratación.
- **FR-009**: El sistema DEBE presentar un nivel de ajuste alto, medio o bajo con razones visibles y una categoría «información insuficiente». Toda condición excluyente incumplida debe mostrarse por separado y evitar que la oferta se recomiende como compatible sin advertir el conflicto.
- **FR-010**: La adaptación DEBE poder reformular la biografía y los resúmenes de proyectos, seleccionar y ordenar proyectos y priorizar competencias relevantes. Debe preservar roles, fechas, instituciones, niveles de idioma, estado de proyectos y alcance real de logros.
- **FR-011**: El sistema DEBE permitir rastrear cada afirmación profesional de la adaptación hasta una fuente concreta del proyecto o una aportación confirmada por el propietario. Las afirmaciones nuevas o contradictorias deben quedar pendientes de evidencia o corrección antes de marcar la versión revisada.
- **FR-012**: El propietario DEBE poder revisar y editar la propuesta antes de utilizarla, ver los cambios respecto del perfil general y elegir idioma español/inglés, foto y proyectos. Corregir una adaptación no debe modificar silenciosamente la fuente profesional general.
- **FR-013**: El PDF DEBE conservar la identidad visual existente de CV Studio, iconos discretos, texto seleccionable y enlaces utilizables, con paginación sin recortes. El orden lateral predeterminado será Contacto, Formación, Competencias, Certificaciones e Idiomas; las páginas de continuación no repetirán el nombre en su encabezado principal. Antes de marcar revisado, deben retirarse o sustituirse enlaces locales, inválidos o de acceso restringido y registrarse la comprobación manual de acceso del destinatario para los demás enlaces web; cambiar el destino invalida esa comprobación.
- **FR-014**: Toda generación completada DEBE producir una versión persistente con identificador, fecha, oferta asociada, idioma, opciones, contenido adaptado, archivo exacto, fuentes utilizadas, razones de adaptación y estado de revisión. Debe poder guardarse también un CV general sin oferta.
- **FR-015**: Una versión guardada DEBE permanecer inalterada al editar el perfil, la oferta o la presentación. Regenerar o editar una versión guardada debe crear otra, vinculada a la anterior; descargarla debe recuperar su archivo original.
- **FR-016**: El propietario DEBE poder consultar, descargar y comparar versiones por oferta, empresa, puesto, idioma y fecha, así como archivar o eliminar versiones deliberadamente con advertencia de sus asociaciones existentes.
- **FR-017**: El dashboard DEBE reunir oportunidades, ajuste y razones, versiones, estados, fechas, notas y próximas acciones. Debe permitir filtrar por estado, empresa, puesto, modalidad, nivel de ajuste y período.
- **FR-018**: El sistema DEBE permitir registrar manualmente una postulación y sus avances, asociando la versión utilizada, fecha y canal. Debe distinguir una declaración manual del propietario de una confirmación externa comprobada.
- **FR-019**: El sistema DEBE mantener separados el seguimiento de la oportunidad, el estado de la candidatura y el estado de las operaciones. Una generación exitosa no debe contarse como postulación enviada.
- **FR-020**: Las oportunidades DEBEN poder marcarse como nuevas, analizadas, seleccionadas, descartadas o cerradas. Las candidaturas deben distinguir preparación, pendiente de revisión, lista para presentar, envío declarado, envío confirmado, resultado incierto, entrevista, propuesta laboral, rechazo y retirada; cada cambio debe registrar fecha y origen. En la primera entrega solo se habilitan estados manuales; envío confirmado y resultado incierto del canal externo quedan reservados para la segunda etapa.
- **FR-021**: La detección de duplicados DEBE reutilizar una oportunidad cuando exista el mismo identificador o enlace de origen; coincidencias solo por empresa/puesto deben presentarse para revisión antes de fusionar registros. Las revisiones de una oferta deben conservar su vínculo con los CV existentes.
- **FR-022**: El usuario DEBE iniciar explícitamente cada análisis o generación, conocer su progreso y resultado, y poder reintentar un fallo conservando lo ya guardado. El comportamiento visible debe ser el mismo tanto si se inicia desde CV Studio como por una orden explícita compatible.
- **FR-023**: El historial DEBE conservarse al cerrar y reabrir CV Studio. El propietario debe poder exportar una copia de sus oportunidades, versiones, preferencias e historial y restaurarla sin alterar los documentos guardados.
- **FR-024**: Los documentos y análisis privados DEBEN permanecer fuera de la publicación del portafolio. Si el procesamiento requiere transmitir material profesional a un servicio externo, debe informarse qué categorías se transmiten y respetarse la configuración elegida por el propietario antes de la primera transmisión.
- **FR-025**: La primera entrega DEBE permitir el flujo completo oferta adjunta → análisis → adaptación revisable → PDF versionado → seguimiento manual, sin depender de una conexión a LinkedIn ni a Computrabajo. Debe conservarse la generación general de CV ya disponible.

**Segunda etapa: búsqueda y envío — fuera de los criterios de entrega inicial**

- **FR-026**: El sistema DEBERÁ permitir iniciar búsquedas en fuentes habilitadas, inicialmente LinkedIn y Computrabajo Argentina, con criterios y límites visibles por ejecución, e incorporar las oportunidades pertinentes al dashboard con su procedencia y razones de selección.
- **FR-027**: El propietario DEBERÁ poder conocer el estado del acceso a una fuente, conectarlo cuando exista una vía disponible y desconectarlo. La falta de acceso debe permitir continuar con ofertas adjuntas y seguimiento manual.
- **FR-028**: Cada envío DEBERÁ requerir revisión y aprobación individual del destino, versión de CV y respuestas que se presentarán. Una orden de buscar o preparar no debe equivaler a aprobar envíos, y una aprobación no se debe reutilizar tras cambiar los materiales.
- **FR-029**: Las respuestas a formularios DEBERÁN proceder de información confirmada. Las preguntas sin respuesta, condiciones nuevas o decisiones personales deben consultarse al propietario antes de avanzar.
- **FR-030**: Cada intento de envío DEBERÁ registrar resultado y evidencia disponible, impedir duplicados de la misma candidatura y mantener resultados inciertos pendientes de verificación antes de reintentar.
- **FR-031**: El propietario DEBERÁ poder detener una ejecución y retomar lo preparado. Los envíos ya realizados deben conservar su estado; no deben mostrarse como revertidos al detener la tarea.

### Key Entities *(include if feature involves data)*

- **Base profesional**: contenido autorizado del propietario, organizado en perfil, proyectos, documentación, formación, competencias e intereses; distingue hechos, conocimiento en formación y preferencias.
- **Fuente y revisión**: documento o registro de origen, ubicación, fecha/revisión, estado de lectura y copia del contenido usado para una adaptación.
- **Perfil de búsqueda**: puestos, seniority, modalidades, zonas, idiomas y condiciones deseables/excluyentes; admite campos todavía no definidos y cambios posteriores.
- **Oportunidad y revisión de oferta**: anuncio con identidad, origen, texto original, fecha y condiciones detectadas/corregidas; puede tener distintas revisiones sin duplicar su seguimiento.
- **Análisis de ajuste**: relación entre requisitos y evidencia, coincidencias, brechas, datos desconocidos, nivel de ajuste y razones; vincula una revisión de oferta con revisiones de fuentes y preferencias.
- **Borrador de adaptación**: propuesta editable de biografía, proyectos y competencias, cambios explicados, afirmaciones pendientes y preferencias de presentación.
- **Versión de CV**: resultado guardado e inmutable, documento exacto, contenido, opciones, fecha, origen, estado de revisión y vínculos con oferta, fuentes y versión anterior.
- **Candidatura**: seguimiento de una postulación concreta, oportunidad, versión elegida, canal, respuestas, fechas, estados y evidencia del envío o declaración manual.
- **Actividad y ejecución**: acción iniciada por el usuario, alcance, progreso, resultado, errores y eventos de seguimiento. En segunda etapa incluye límites, aprobaciones y resultados de acciones externas.
- **Aprobación individual**: en segunda etapa, autorización vinculada a un destino y materiales exactos, con fecha y condición de invalidez si cambian.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Primera entrega**

- **SC-001**: En una evaluación con 10 ofertas legibles de desarrollo y Sistemas, al menos 9 pueden incorporarse y llegar a una primera propuesta de CV en menos de 5 minutos desde el inicio del análisis, excluyendo el tiempo de revisión humana; un fallo informa causa y alternativa de continuación.
- **SC-002**: En las versiones revisadas del conjunto de aceptación, el 100 % de las afirmaciones profesionales cuentan con fuente localizable; se producen cero invenciones de empleadores, roles, años de experiencia, certificaciones, tecnologías dominadas o nivel de idioma.
- **SC-003**: En 10 casos controlados de requisitos ausentes o contradictorios, los 10 se muestran como brecha, incertidumbre o conflicto y ninguno se introduce como hecho en un CV revisado.
- **SC-004**: Después de guardar 20 versiones y modificar las fuentes del perfil, se recupera el 100 % de los archivos originales con la oferta y las fuentes que los originaron, incluso tras cerrar y reabrir CV Studio.
- **SC-005**: Con 100 oportunidades y 200 versiones de prueba, el propietario puede localizar una candidatura concreta y descargar su CV asociado en menos de 30 segundos usando el dashboard.
- **SC-006**: En una prueba que mezcla borradores, versiones y envíos declarados, todos los conteos coinciden con las candidaturas reales; ninguna generación aislada se cuenta como envío y no se permite registrar una confirmación externa desde el flujo manual de la primera etapa.
- **SC-007**: Todas las variantes de aceptación en español e inglés, con/sin foto y con contenido extenso mantienen texto legible, sin recortes, el orden lateral establecido y acceso a todas las páginas y enlaces válidos.
- **SC-008**: Una copia exportada y restaurada conserva el 100 % de las 20 versiones de prueba, sus asociaciones y estados. Ninguna oferta, versión privada o historial aparece en la publicación pública del portafolio.

**Segunda etapa; no condiciona la aceptación inicial**

- **SC-009**: En todas las pruebas de envío, el 100 % requiere aprobación individual vigente para el destino y materiales exactos; buscar o preparar produce cero envíos por sí solo.
- **SC-010**: En los casos de interrupción, sesión vencida, envío incierto y reanudación, no se producen envíos duplicados y ningún resultado incierto se registra como confirmado.

## Assumptions

### Decisiones confirmadas en entrevista — 2026-11-08

- **D-001 — Entrega inicial**: adaptar CV a ofertas adjuntas, guardar versiones y dashboard. Búsqueda y postulaciones se desarrollarán en una segunda etapa.
- **D-002 — Autonomía futura**: preparar candidaturas y revisar cada una antes de enviarla. No se adopta aprobación por lote ni postulación automática por el solo hecho de iniciar una búsqueda.
- **D-003 — Búsqueda inicial**: preferencia por puestos junior o pasantías de Ingeniería en Sistemas/desarrollo, remoto o presencial únicamente en Tucumán, español e inglés intermedio.
- **D-004 — Fuente profesional**: por indicación expresa del propietario, este proyecto pasa a ser la base autorizada para adaptaciones, incluida su documentación profesional mantenida. Las versiones de CV derivadas son resultados históricos, no nuevas fuentes de credenciales.

- **D-005 — Portales de empleo**: LinkedIn y [Computrabajo Argentina](https://ar.computrabajo.com/) quedan incluidos como orígenes de ofertas desde la primera etapa; su búsqueda y postulación conectadas pertenecen a la segunda.

- **D-006 — Uso de IA**: el propietario elige generar desde CV Studio con un proveedor externo configurable y una clave propia; indicó experiencia con Google AI Studio. La configuración debe explicar qué información profesional se enviará.
- **D-007 — Consumo**: el propietario no fijó todavía un presupuesto mensual. El límite y la modalidad de consumo se elegirán al configurar el proveedor; la suscripción de ChatGPT Plus no se presume equivalente a crédito de consumo para una clave.

### Supuestos de alcance revisables

- Un único propietario utiliza CV Studio de forma privada, inicialmente en su equipo, conforme al módulo existente. Acceso remoto multiusuario y publicación del dashboard quedan fuera de esta entrega.
- «Tucumán» se interpreta inicialmente como la provincia; la ubicación debe poder precisarse. Remoto no implica elegibilidad en todos los países: restricciones geográficas o de contratación se muestran como condiciones por verificar.
- Salario, jornada, tipo de contrato, países elegibles, modalidad híbrida y tecnologías excluyentes todavía no están definidos. Permanecen configurables; no se inventan valores ni se aplican filtros restrictivos a partir de su ausencia.
- Junior y pasantías se registran como preferencias iniciales. Las condiciones que el propietario marque como excluyentes se aplicarán con ese carácter. Inglés intermedio se conserva como dato del perfil y se explicita cualquier exigencia superior.
- La base profesional comprende materiales incluidos y mantenidos en el proyecto para describir la trayectoria; no abarca automáticamente todo el equipo ni documentos privados ajenos a esa finalidad.
- La incorporación inicial de ofertas acepta texto y PDF legible. Recuperación automática desde cualquier sitio, reconocimiento de imágenes y otros formatos de documento podrán evaluarse posteriormente.
- Las notas, fechas, próximas acciones y resultados de postulaciones se actualizan manualmente en la primera etapa. Sincronización de correo, calendario y mensajes de reclutadores no forma parte de ella.
- Las versiones se conservan hasta que el propietario las elimine deliberadamente. La exportación/restauración es local; no se presume almacenamiento remoto ni sincronización automática.
- Se conserva la generación de CV general, la estética y la presentación acordadas. Las decisiones de implementación de la asistencia, la búsqueda de evidencia y la automatización se resolverán durante la planificación.
- La pertinencia profesional debe poder explicarse con hechos y preferencias. No se promete obtener entrevistas, superar filtros de selección ni garantizar empleo.

### Dependencias y límites de la segunda etapa

- La viabilidad del acceso y las acciones disponibles en LinkedIn y Computrabajo deben verificarse antes de planificar su implementación. Conectar una identidad no demuestra por sí solo acceso a búsqueda o envío de candidaturas.
- La documentación oficial consultada describe [Apply Connect](https://learn.microsoft.com/en-gb/linkedin/talent/apply-connect/apply-connect-overview) como integración con sistemas de selección de personal y diferencia permisos disponibles en [Getting Access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access). Esto no demuestra una vía disponible para el flujo de postulante personal propuesto; la segunda etapa requiere una validación específica.
- Cuando una fuente o un paso no esté disponible, el flujo debe conservar la oferta y los materiales preparados, indicar la intervención necesaria y permitir el seguimiento manual. No se presumirá capacidad de saltar restricciones de acceso.
- La segunda etapa no incluye modificar el perfil público de LinkedIn, enviar mensajes a reclutadores, agregar contactos, pagar servicios ni realizar acciones distintas de las candidaturas revisadas.

### Encaje con los principios del proyecto

- La especialización de un CV por oferta mantiene la representación completa de desarrollo e infraestructura en la base general y preserva la integridad de credenciales y la propiedad del contenido.
- La instrucción actual del propietario sobre la fuente de verdad prevalece sobre la referencia histórica de la constitución a CV anteriores. La enmienda explícita de la constitución 2.0.0 autoriza el stack del módulo local monousuario; no amplía el alcance a acceso remoto ni cambia la web pública.
- Esta especificación contiene una sola feature con dos etapas. Solo los requisitos FR-001 a FR-025 y los resultados SC-001 a SC-008 forman la entrega inicial; FR-026 a FR-031 y SC-009 a SC-010 describen la continuación futura.
