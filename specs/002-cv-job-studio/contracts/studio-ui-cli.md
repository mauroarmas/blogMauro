# UI y CLI — contrato de experiencia

**Estado:** diseño para implementación. Todos los controles nuevos pertenecen a CV Studio local. El portafolio público mantiene su navegación actual.

## Navegación y pantallas

| Área | Contenido y acciones principales |
|---|---|
| Inicio | Resumen de oportunidades/candidaturas, pendientes, actividad reciente y acceso a «Agregar oferta» y «CV general». |
| Ofertas | Listado filtrable; origen LinkedIn/Computrabajo/manual/otro; detalle original, requisitos corregibles, análisis, versiones y seguimiento. |
| Editor de CV | Propuesta, cambios respecto del perfil, evidencia por bloque y vista previa A4. Idioma, foto, proyectos/competencias, edición y guardado de versión. |
| Versiones | Histórico, comparación de dos versiones, descarga exacta, origen de la evidencia, revisión, archivado y eliminación deliberada. |
| Fuentes | Documentos/proyectos incluidos, revisión, disponibilidad y problemas; refrescar y aportar evidencia privada confirmada. |
| Preferencias | Perfil de búsqueda, deseables/excluyentes y campos sin definir. No editar aquí credenciales profesionales como nivel real de idioma. |
| Configuración | Proveedor/modelo, estado de clave, tratamiento de datos, modalidad/límites, consumo y copias/restauración. |

La UI mantiene paleta y tipografías existentes. La barra lateral del PDF conserva Contacto → Formación → Competencias → Certificaciones → Idiomas e iconos discretos. La navegación del dashboard es independiente del orden del documento.

## Flujo de primera adaptación

1. Elegir «Agregar oferta», pegar texto o adjuntar TXT/PDF y, si se dispone, URL original. La fuente se reconoce con las reglas del contrato HTTP; puede corregirse sin fabricar una identidad externa.
2. Mostrar original y estado de lectura. Archivo ilegible ofrece pegar texto. Guardar la oferta es posible sin IA configurada.
3. «Analizar oferta» crea una operación, muestra progreso y permite abrir otras pantallas. Si falta configuración, enlaza al formulario correspondiente sin enviar contenido.
4. Mostrar campos detectados, razones del ajuste, brechas, excluyentes y desconocidos. El propietario puede corregir campos; la corrección crea revisión y pide recalcular antes de reutilizar un análisis antiguo.
5. «Adaptar CV» utiliza un análisis vigente y produce una propuesta editable. La revisión muestra fuente localizada y confirmación humana como estados distintos.
6. Presentar tres vistas coordinadas: contenido propuesto, cambios y evidencia localizable. En móvil se alternan con controles etiquetados; el PDF no fuerza ancho horizontal en la página general.
7. Editar invalida la revisión del bloque alterado. Afirmaciones sin respaldo requieren aportar evidencia privada o retirar el texto. Cambios en datos canónicos se señalan y no se aceptan como meras reformulaciones.
8. «Guardar versión» genera PDF y registra archivos y vínculos; puede conservar un borrador sin marcarlo revisado. «Marcar revisado» exige resolver hallazgos y confirmar la revisión actual. Descargar permite elegir una versión concreta.
9. Si se postula manualmente, registrar canal, fecha y versión realmente usada. El estado visible será «Envío declarado por mí».

## Fuentes, cambios y límites

- Un cambio en el perfil afecta nuevas operaciones. Las versiones históricas muestran qué revisión usaron y una indicación separada si hay fuentes más recientes.
- Al intentar marcar revisada una propuesta basada en fuentes cambiadas, presentar el motivo y una acción para actualizar/revalidar; no ignorar la diferencia.
- Una brecha significa falta de evidencia documentada, no un juicio definitivo sobre capacidad profesional.
- No mostrar un porcentaje como probabilidad de conseguir trabajo. «Alto/medio/bajo» lleva explicación y factores; condiciones excluyentes y datos desconocidos siempre son visibles.
- Los archivos adjuntos y respuestas de IA se presentan como texto; no renderizar HTML recibido del proveedor o de la oferta.
- Las vistas de original/evidencia conservan contexto y página/campo. El usuario puede volver del documento al bloque que lo citó.

## Configuración inicial de IA

- Mostrar Gemini como proveedor implementado y el modelo estable candidato; permitir seleccionar un identificador admitido y validarlo. No listar OpenAI como conexión utilizable antes de implementar su adaptador.
- Mostrar «Clave configurada/no configurada» e instrucciones para establecer `GEMINI_API_KEY` en el servidor; nunca pedir que se pegue en una conversación ni mostrarla en el navegador.
- Elegir modalidad gratuita declarada o pago y revisar las condiciones del proveedor. Explicar que usar AI Studio no demuestra que la cuenta sea gratuita y que `store:false` no equivale a ausencia total de tratamiento.
- Para pago: límite mensual y por operación explícitos, tarifas/modelo verificados. Sin límite no hay llamadas de pago. Para gratuito: registrar modalidad/capacidades de cuota y mostrar conteos; no cambiar automáticamente a pago.
- Mostrar categorías enviadas, omitidas y enlace de condiciones. Confirmación persistida por configuración, no nueva pregunta en cada generación; cambios de proveedor o categorías requieren revisar esa configuración.
- «Validar conexión» es una acción explícita y presupuestada. Abrir ajustes o guardar un borrador de configuración no consume llamadas.
- Consumo distingue conocido, reservado e incierto. Un límite alcanzado conserva el trabajo y explica qué debe corregirse; no invita a aumentar el gasto automáticamente.

## Estados, accesibilidad y errores

- Estado vacío con siguiente acción concreta; carga anunciada con `role=status`; errores accionables junto al control, además de un resumen cuando corresponda.
- Teclado completo, foco visible, etiquetas reales, errores asociados, contraste suficiente y estado nunca comunicado solo por color. Diálogos devuelven foco al disparador.
- Formularios conservan lo escrito al fallar. Conflictos de edición muestran revisión actual y permiten recuperar el texto local antes de reintentar.
- No exponer nombres internos de tablas, prompts, tokens de sesión o traces en los flujos de uso. Los IDs de operación sirven como referencia discreta de diagnóstico.
- Cancelar detiene lo pendiente; una llamada remota iniciada puede tener consumo incierto. Mostrar ese hecho sin decir que se deshizo.
- Eliminar versión y restaurar backup requieren una pantalla concreta de impacto; confirmar afecta solo ese alcance. Archivar es la opción habitual.
- La restauración muestra que sustituye el conjunto local, conserva una copia recuperable y puede requerir conciliar consumo antes de reactivar IA.

## CLI compartida

Interfaz propuesta `npm run cv:studio -- <command>`. No reemplaza `cv:dev`, `cv:pdf` ni `cv:test` actuales. El binario cliente utiliza los mismos contratos/servicios: no implementa un segundo flujo de adaptación ni escribe directamente en SQLite.

| Comando propuesto | Resultado |
|---|---|
| `doctor` | Verifica runtime, Chromium, Poppler, esquema, instancia y presencia de clave; no llama a IA. |
| `sources refresh` | Snapshot actual y avisos de fuentes. |
| `offer add --file PATH --url URL` | Incorpora archivo local; `--url` es opcional, y también admite `--text-file PATH` para descripción. Devuelve opportunityId y revisionId. |
| `offer analyze ID` | Análisis usando preferencias vigentes y configuración IA habilitada. |
| `cv adapt --analysis ID --locale es` | Crea borrador trazable. |
| `cv render --draft ID --revision N` | Guarda versión desde revisión exacta; no cambia estado a revisado por ejecutar el comando. |
| `cv download ID --output PATH` | Copia los bytes originales de la versión. |
| `operation status ID` | Progreso/resultado persistido. |
| `operation cancel ID` | Solicitud de cancelación con las mismas reglas del panel. |
| `backup export --output PATH` | Copia coherente de datos privados. |
| `backup inspect --file PATH` | Validación y resumen de impacto; sin sustitución. |
| `backup restore --file PATH --expected-dataset ID --confirm-replace` | Restauración explícita del alcance inspeccionado, con recuperación y conciliación. |
| `recover --file PATH --expected-dataset ID --confirm-replace` | Recuperación offline con servidor detenido; no inicia IA. |

- `--json` devuelve `{ok,data,operationId?}` o `{ok:false,error:{code,message},requestId?}` sin secuencias de terminal; errores también producen código de salida no cero.
- Salidas: 0 éxito; 2 entrada inválida; 3 revisión/estado incompatible; 4 proveedor/configuración/cuota; 5 almacenamiento/extracción/render; 6 ejecución interrumpida.
- Con servidor ya activo, `--wait` espera resultado; sin esa opción devuelve el ID y el servidor conserva la operación. En una instancia temporal, todo comando que crea una operación exige `--wait`: sin él falla con `SERVER_REQUIRED_FOR_ASYNC` (salida 3) antes de crear operación, leer adjuntos o llamar a IA. Las consultas no requieren `--wait`.
- Si el servidor está activo, comunicarse con él. Si no, iniciar una instancia temporal exclusiva para consultas u operaciones con `--wait`, mantenerla hasta estado terminal y cerrar después de persistir resultado/consumo. Ante SIGINT, cancelar lo abortable y conservar reserva incierta antes de cerrar; ante caída abrupta, la siguiente apertura marca running como interrupted. No crear daemon implícito ni dos escritores. Recuperación exige servidor detenido y `--wait`, con la misma regla de cierre seguro.
- Las rutas de archivo CLI son entradas locales explícitas; HTTP y los modelos nunca reciben capacidad equivalente de leer rutas arbitrarias.
- No se ofrecen comandos de búsqueda, inicio de sesión en portales o envío en la primera etapa.

## Enlaces del CV y revisión del destinatario

La revisión de enlaces es local y determinista, sin fetch, resolución DNS ni apertura automática. Se aplica a todos los enlaces del modelo final, incluida URL base del portafolio, proyectos, documentación y contacto; no se limita a enlaces redactados por IA.

- Resolver referencias relativas contra una URL base HTTP(S) absoluta aceptada; si falta base, son `invalid`. No publicar rutas del equipo ni usar el origen loopback del panel como base.
- `invalid`: URL malformada, credenciales embebidas, esquema distinto de HTTP(S)/mailto/tel o referencia sin resolver. `file:`, `javascript:` y `data:` no se convierten en enlaces clicables, incluso en borradores.
- `local`: localhost y subdominios, loopback IPv4/IPv6, IP privadas/link-local/ULA, nombres de una sola etiqueta y sufijos `.local`, `.localhost`, `.internal`, `.test` o `.invalid`. Deben sustituirse o retirarse del PDF antes de marcar reviewed.
- `restricted`: destino declarado por el propietario como privado, autenticado o dependiente de VPN. Debe sustituirse por un recurso accesible al destinatario o retirarse como enlace; el texto descriptivo puede conservarse.
- `needs_check`: HTTP(S) restante. Un host bajo `ts.net` recibe además una advertencia de posible acceso por red privada; no se afirma que todo ese dominio sea inaccesible. No se promete disponibilidad pública a partir del formato de la URL.
- El propietario verifica manualmente un destino needs_check desde un contexto sin sesión/VPN cuando corresponda y registra `recipient_access_confirmed`, fecha y nota de comprobación; si requiere acceso, lo clasifica restricted. mailto/tel sintácticamente válidos son acciones de contacto, no páginas que requieran esa comprobación.
- `reviewed` exige cero enlaces invalid/local/restricted y confirmación por cada URL HTTP(S) needs_check. Un cambio de URL, destino relativo o base invalida la confirmación afectada. Una versión histórica conserva la comprobación con su fecha, sin afirmar disponibilidad actual ni reescribir su revisión.
- La UI muestra URL, ubicación dentro del CV, motivo y acciones de sustituir/retirar/registrar comprobación. Un borrador no revisado puede guardarse con advertencias; no se desbloquea la revisión confirmando genéricamente todo el documento.
- La evidencia privada de un claim se abre en el visor de Studio; esos enlaces internos nunca se insertan automáticamente como links del PDF enviado.

Casos de aceptación: ruta relativa sin/con base pública, localhost, IPv4 privada, IPv6 local, file/javascript/data, URL autenticada, host ts.net con acceso pendiente y comprobación manual, HTTP(S) pública confirmada, mailto/tel y cambio de base tras confirmar. La suite no navega destinos; usa clasificaciones y confirmaciones de fixtures.
