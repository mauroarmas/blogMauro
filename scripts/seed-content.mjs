// Carga los dos casos de estudio iniciales (T028) en la base de datos local de
// desarrollo. El cuerpo deja marcadores [TODO] explícitos donde falta la justificación
// técnica real que solo el dueño puede dar (Principio II de la constitución: nada no
// verificado se publica como si fuera un hecho). Correr con: node scripts/seed-content.mjs
//
// Para producción (Postgres), aplicar el mismo contenido a través del panel de admin
// una vez desplegado, o adaptar este script para usar `pg` con DATABASE_URL.

import Database from 'better-sqlite3';

function readTime(content = '') {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const db = new Database('local_blog.db');
db.pragma('journal_mode = WAL');

// PENDIENTE — dos cosas que el dossier de origen marca y que solo el dueño puede cerrar:
//
// 1. NOMBRAR AL CLIENTE. La página nombra a Credimisión S.R.L. porque el CV ya lo hace, pero
//    conviene preguntarle a la empresa si autoriza. Si prefieren que no, "una comercializadora
//    de electrodomésticos de Misiones" no le quita nada al caso.
// 2. LA JUSTIFICACIÓN DE RAG vs FINE-TUNING no está escrita en ningún documento del repo: el
//    dossier la reconstruyó desde restricciones que sí están (confidencialidad, versionado del
//    corpus, umbral de escalado, auditoría por turno). Es sólida, pero leerla antes de firmarla.
//
// FUERA DEL TEXTO, por curaduría: el guion del video ancla de 6 minutos y los tres clips
// cortos, las cuatro recomendaciones de la "Parte 3", y dos decisiones técnicas más (por qué
// NestJS —el argumento SSE vs WebSocket— y los tres umbrales de similitud calibrados). Todo
// eso vive en el artefacto de origen.
const trimiaBody = `## El problema

Credimisión S.R.L. vende electrodomésticos al contado y financiados en Posadas, Garupá y el
interior de Misiones. Casi toda la operación pasa por WhatsApp, y casi todo el conocimiento
que hace falta para contestar vive en la cabeza de alguien.

El vendedor que atiende por Marketplace no tiene el precio de un producto fuera de lista: se lo
pregunta al administrativo. No sabe si queda una unidad: se lo pregunta a depósito. No puede
ofrecer financiación hasta que alguien entre a Riesgo Online y confirme que el cliente no tiene
deudas. Un empleado nuevo aprende preguntando.

Es una operación que funciona por interrupción: cada consulta de un cliente dispara dos o tres
consultas internas, y quien las responde es siempre la misma persona. No hay forma de absorber
un pico, no queda registro de lo que se preguntó, y lo que se contestó ayer se vuelve a
preguntar mañana.

## El dominio

El sistema no inventó una taxonomía: copió el organigrama. Cada agente cubre lo que hoy hace
un rol concreto de la empresa, con los mismos límites que esa persona tiene.

| Rol real | Agente | Qué resuelve · qué no |
| --- | --- | --- |
| Vendedor | \`SALES\` | Productos, precios de lista, promociones, financiación. No verifica crédito ni cierra la venta. |
| Administrativo | \`ADMIN\` | Verificación crediticia, cotización fuera de lista. Único con acceso a Riesgo Online. |
| Cobrador online | \`COLLECTIONS\` | Cuotas, vencimientos, recepción de comprobantes. No confirma un pago. |
| Logística | \`LOGISTICS\` | Envíos, tiempos de entrega, despacho. |
| Depósito | \`DEPOSITS\` | Stock, disponibilidad, fotos del producto real. |

Los cinco tienen doble público: atienden clientes y a la vez capacitan a los empleados sobre
los procesos de su área. Eso obliga a una regla que atraviesa todo el sistema: **un cliente
solo alcanza Ventas y Cobranzas, y solo recupera conocimiento marcado como público.** La misma
pregunta hecha por un empleado y por un cliente no devuelve lo mismo, y no puede.

## Arquitectura

Todo el sistema se entiende siguiendo un mensaje. El webhook no razona: valida, encola y
responde en milisegundos. El trabajo pesado corre en un worker, y ahí es donde vive la IA.

\`\`\`text
WhatsApp ──► n8n ──► POST /messaging/webhook       valida · encola · 202
                          │
                          ▼
                     BullMQ (Redis)                3 intentos, backoff
                          │
                          ▼
                     Orquestador (LangGraph)
                       ├─ trivial   ─► respuesta fija    0 tokens
                       ├─ sticky    ─► scope_check       ¿sigue el mismo agente?
                       └─ si no     ─► classify_intent   Gemini
                          │
                          ▼
                     Agente especializado (RAG)
                       retrieve_context ─► ¿score ≥ 0.65?
                            sí ─► generate_response
                            no ─► escalate_to_human
                          │
                          ▼
                     log_event + track_tokens      auditoría
\`\`\`

## Decisiones técnicas

### Por qué RAG y no un modelo afinado

**Porque la misma pregunta tiene dos respuestas según quién la haga.** La confidencialidad se
aplica al recuperar: la búsqueda filtra por audiencia antes de que el modelo vea nada. Un
modelo afinado no puede des-saber lo interno cuando quien escribe es un cliente; la
confidencialidad dejaría de ser un filtro para pasar a ser una esperanza.

**Porque el corpus lo editan supervisores, no ingenieros**, y se corrige a partir de un caso
que el agente no supo contestar: reentrenar en cada edición no es caro, es imposible. Y porque
hace falta un número para decidir si contestar — el umbral sobre el score de recuperación es lo
que separa «responde» de «deriva a una persona», y cada turno registra qué documentos se usaron
y con qué score.

### Por qué una cola y no procesar el mensaje al vuelo

WhatsApp exige que el webhook responda en milisegundos y un turno de IA tarda entre 3 y 7
segundos: sin cola hay que elegir entre hacer esperar a Meta o perder mensajes. Pero el motivo
menos obvio terminó importando más — **la cola es donde caben los trabajos que no son un turno
de conversación**: leer un comprobante con visión, reindexar un documento editado, barrer el
corpus buscando duplicados. Ninguno entra en un request HTTP.

### Por qué el ruteo se «pega» a un agente

Clasificar cada mensaje con el modelo cuesta una llamada extra por turno, y la mayoría de los
mensajes siguen hablando de lo mismo que el anterior. El orquestador resuelve en tres
escalones: saludos y cierres se contestan con una expresión regular y **cero tokens**; si la
conversación ya está asignada a un agente, una verificación de alcance decide si sigue ahí; y
solo cuando no hay agente asignado se clasifica con el modelo. Es la diferencia entre un
prototipo que anda y un sistema que alguien puede pagar.

### Por qué el gerente no es un rol

Hacía falta que quien es responsable de todas las áreas viera todo. La solución obvia era
agregar un rol \`GERENTE\` al enum: habría obligado a revisar 23 decoradores de autorización
—el guard compara por igualdad exacta, no por jerarquía— y un solo olvido le quitaba acceso al
dueño de la empresa. En su lugar, la responsabilidad de áreas se modeló como una relación N:M
y **«gerente» pasó a ser una propiedad derivada**: es quien tiene todas las áreas que existen.
El guard no se tocó. El problema no se resolvió: desapareció.

## Lo que el sistema deliberadamente no hace

Ninguna decisión financiera o contractual se cierra sola. El sistema no aprueba un crédito, no
confirma un pago y no cierra una venta financiada: recopila, consulta, prepara y deriva a una
persona.

El caso más claro es el comprobante de pago. Cuando un cliente manda la foto de una
transferencia, el sistema la lee con visión y completa los campos que detecta —monto, fecha,
referencia—, pero **eso queda marcado como sugerencia y nunca como estado del comprobante.**
La validación es de una persona, siempre. Un falso positivo acá no es un bug de software: es
una cuota que la empresa da por cobrada y no cobró.

## Resultado

El sistema no está en producción: es una tesis de grado con un cliente real detrás, y sus
resultados son de ingeniería, no de negocio. Lo que sí está medido, contra el corpus real de
la empresa:

- **0,65 de umbral de confianza**, respaldado midiendo: el piso de ruido quedó en 54,1% y la
  señal en 78,4%.
- **+2,6 puntos de señal** al incorporar el título del documento al vector, sin tocar el umbral.
- **De 343 a 10 parejas** candidatas a fusión tras prefiltrar y calibrar: de inauditable a
  revisable de una sentada.

Y un resultado cualitativo que vale más que los números: una consulta de control —«qué sabés
sobre la empresa»— pasó de no entrar siquiera entre los cuatro mejores resultados a ser el
primero, sin agregar un solo documento al corpus.

## Aprendizajes

**Un mock que simplifica de más no falla: pasa.** La librería de embeddings no lanza excepción
cuando un lote falla: devuelve arreglos vacíos. El sistema guardaba vectores vacíos y marcaba
el documento como sincronizado; el panel lo mostraba sano, el documento dejaba de ser
recuperable, y no había un solo error en consola. Aparecieron 98 en una corrida, y un test los
tapaba. Cuando un test no encuentra un defecto que existe, la pregunta correcta es qué decidió
su mock que nunca pasa.

**Cuando el prompt no alcanza, el remedio no es más prompt.** Cuatro defectos de comportamiento
en tres días, ninguno de código. En dos faltaba la regla y agregarla los resolvió. En los otros
dos la regla estaba y el modelo la ignoraba: uno se arregló sacando las quince instrucciones
que la contradecían, el otro con un control determinístico en código.

**Los fallos peligrosos son los que no fallan.** Un teléfono guardado en dos formatos deja a un
empleado tratado como cliente sin un solo error visible. Un documento que cambia de audiencia y
no se reindexa sigue siendo recuperable por quien no debería. Ninguno rompe nada: todos degradan
en silencio. Buena parte del diseño de este sistema es hacer visible la ventana en la que algo
puede estar mal.
`;

// PENDIENTE — lo único que falta de esta ficha, y solo el dueño puede cerrarlo:
//
// 1. RESULTADO — una métrica del piloto real: cuántas cátedras lo usaron, cuántos servicios
//    se desplegaron, cuánto bajó el tiempo entre "lo pido" y "lo tengo" contra el pedido
//    manual por mail. Si el piloto todavía no corrió, "prototipo validado técnicamente,
//    piloto previsto" también es un resultado y es honesto — es lo que dice hoy el cuerpo.
// 2. APRENDIZAJES — los tres que están publicados salieron del repositorio y son sólidos,
//    pero ganan mucho contados en primera persona con el momento exacto en que los aprendió:
//    el pedido atascado, el contenedor que no existía, el 409 de una cátedra que no había
//    hecho nada.
//
// FUERA DEL TEXTO, por decisión de curaduría (no son lo que lee un reclutador): el conteo de
// pruebas y migraciones, la línea de tiempo completa de las specs 001-006, y el guion de demo
// de 7 escenas. Todo eso vive en el artefacto de origen. El diagrama de la máquina de estados
// sí vale la pena: cuando esté exportado como imagen, se suma vía `images`.
const nubePrivadaBody = `## El problema

Más de veinte cátedras necesitan lo mismo con distinta forma: un motor de base de datos para
Bases de Datos, un laboratorio de red para Redes, una máquina entera para Sistemas Operativos.
La facultad ya tenía la mitad de la respuesta —un clúster Proxmox VE con almacenamiento
compartido y alta disponibilidad— pero Proxmox es una herramienta de administrador: VMIDs,
nodos, plantillas, VLANs. Darle una cuenta a un titular de cátedra es pedirle, al mismo
tiempo, que aprenda a operar un hipervisor y que no toque el clúster de las otras veinte.

> Olvidémonos de Proxmox. Proxmox va a ser nuestro back. El software tiene que gestionar
> todo.

Esa premisa, fijada por el profesor a cargo, es el proyecto. Y encima hay un segundo problema
más difícil: **el hardware es finito y nadie sabe estimar cuánto va a necesitar antes de que
empiece la cursada.** Quién obtiene qué, cuándo lo devuelve, y qué pasa cuando dos cátedras
piden lo mismo el mismo día — ese es el dominio real del sistema.

## De quién son las cosas

Antes de escribir un endpoint hubo que decidir eso, y la respuesta define el modelo entero:
**los recursos son de la cátedra, no de la persona.** Una cátedra cambia de titular y su
historial de consumo tiene que sobrevivir al cambio, porque la institución necesita responder
«cuántos recursos consumió esta materia el cuatrimestre pasado» mucho después de que los
contenedores se hayan borrado.

La capacidad se lleva en cuatro cifras: física, desplegada, **reservada** y libre. La tercera
es la que el modelo ingenuo se olvida: capacidad comprometida por una aprobación cuyo
contenedor todavía no existe. Si no cuenta como comprometida, dos aprobaciones seguidas ven
ambas el mismo saldo libre y el clúster se sobrecompromete sin que nadie haya cometido un
error individual.

Sobre eso se apoya la arquitectura —una SPA de React contra una API de FastAPI y PostgreSQL—
con dos fronteras duras: una sola capa habla con Proxmox, y una sola función cambia estados,
dejando siempre autor y motivo en el historial, incluso cuando el autor es el sistema.

## Aprobar no es opinar: compromete el clúster

La primera versión le daba a cada cátedra una cuota fija. Funcionaba mal por una razón de
fondo: obligaba a declarar por adelantado un techo que nadie sabe estimar, y después convertía
ese error de estimación en una denegación automática contra alguien que no podía hacer nada al
respecto. Las cuotas se eliminaron; la contabilidad no. Lo que cambió es **quién decide y
cuándo** — la decisión se movió al único momento en que hay información para tomarla: cuando
el administrador ve el pedido concreto contra la capacidad real.

## Tres decisiones

**La reserva es un estado, no una tabla.** Se define por consulta: un pedido aprobado, de tipo
alta, cuyo servicio no existe y cuyo plazo de 24 h no venció. Así no hay dos fuentes de verdad
que puedan divergir, y convertirla en consumo real no es una operación que pueda fallar a
medias: el servicio aparece y la reserva deja de existir en el mismo instante.

**Dos mecanismos de concurrencia, no uno.** Un *advisory lock* de PostgreSQL serializa la
sección crítica, y además un token —un hash de la capacidad comprometida— viaja a la pantalla
del administrador y vuelve al aprobar. El bloqueo es integridad: evita que dos transacciones
lean el mismo saldo libre y ambas reserven. El token es calidad de la decisión: detecta que
quien confirma está mirando la pantalla que abrió hace media hora.

**Esperar siempre la tarea de Proxmox.** Sus operaciones son asíncronas: devuelven un id de
tarea mucho antes de que el trabajo ocurra. Confiar en el \`200 OK\` fue el defecto que produjo
los primeros servicios fantasma —el portal registraba el contenedor como desplegado mientras
el clúster no había creado nada—. Ahora cada operación hace polling hasta que termina, y el
VMID se persiste *antes* de llamar a Proxmox, para que un reintento reutilice el mismo id en
vez de multiplicar contenedores.

## El día que una cátedra dejó sin servicio a otra

El sistema permite deliberadamente aprobar por encima de la capacidad libre, advertido y con
justificación registrada. El 29 de agosto de 2026 pasó: el clúster quedó con 12 vCPU y 24 GB
de RAM comprometidos de más, y eso bloqueó con un \`409 sin_capacidad\` la reactivación de un
servicio pausado **de otra cátedra**. No había salida: desde un pedido aprobado y sin
desplegar solo se podía desplegarlo —materializando el error— o esperar hasta 24 horas a que
expirara la reserva. Durante esa ventana, el error de una cátedra degradaba a todas las demás.

La corrección fue poder revertir una aprobación antes del despliegue, liberando la reserva en
el acto: todo dentro del bloqueo de capacidad y en una sola transacción, **releyendo el estado
del pedido adentro del bloqueo**. Esa relectura es lo que impide la doble liberación.

## Una constitución que se enmienda

El proyecto se desarrolló con Spec Kit, y por encima de las specs hay una constitución de seis
principios versionada. Lo más útil que aprendí de ese esquema fue qué hacer cuando un
principio **no se puede cumplir**. El principio I decía que ninguna persona usuaria toca la
interfaz de Proxmox; pero Proxmox exige un ticket de sesión para el WebSocket de consola, así
que el relay conectaba, autenticaba y la sesión moría sin transmitir. Sostenerlo al pie de la
letra dejaba a las cátedras sin forma de entrar al contenedor que pidieron, que es la razón
por la que existe el servicio. Se acotó a una excepción única y nombrada, con las condiciones
que la mantienen acotada, y se registró por qué. Un principio que vuelve inútil al sistema que
ordena no se está cumpliendo.

## Mi rol y estado

Equipo de tres, una capa cada uno: un compañero en almacenamiento, otro en infraestructura, y
yo en el software de orquestación — el portal completo, de la API a la interfaz. Todo lo
descrito acá es esa capa, construida en un sprint de siete semanas entre julio y agosto de
2026.

Hoy el portal orquesta contenedores LXC reales contra el clúster: pide, aprueba con reserva
atómica, despliega, mide, pausa, vence, renueva y da de baja, con el historial completo de
quién hizo qué y por qué. Es un prototipo validado técnicamente; el piloto con cátedras reales
es la etapa siguiente.

## Aprendizajes

- **Fallar es el caso normal.** Las llamadas a un hipervisor fallan por red, por timeout, por
  estado del clúster. Diseñar asumiendo el fallo cambia qué código escribís primero.
- **Un principio se defiende acotándolo.** Una frontera con una puerta declarada es
  defendible; una que se filtra sin que nadie lo diga, no.
- **El control se pone donde hay información.** Una cuota pedía adivinar en enero lo que
  recién se sabe en mayo. Mover la decisión al momento de la aprobación no relajó el control:
  lo hizo posible.
`;

// PENDIENTE — lo que falta de este caso de estudio y solo el dueño puede contestar.
// Se escribe acá y no dentro del cuerpo markdown: react-markdown escapa los comentarios
// HTML en vez de ocultarlos, así que un <!-- TODO --> en el body termina visible en la
// página publicada. Al completar cada punto, sumarlo al body y volver a correr este script
// (local) o pegarlo en /admin (producción).
//
// 1. CONTEXTO — ¿hubo un pedido concreto de la Municipalidad de Concepción, o el caso se
//    tomó como escenario realista para la entrega académica? Es el primer dato que un
//    entrevistador va a querer ubicar.
// 2. DECISIÓN — Por qué los comentarios van embebidos en el profesional y no en su propia
//    colección: qué se gana trayendo perfil y reputación en una sola consulta, y hasta qué
//    cantidad de comentarios por profesional esa decisión se sostiene.
// 3. DECISIÓN — Por qué las once categorías de oficio son un enum del schema y no una
//    colección: qué habría que tocar para que el municipio sume «Techista» sin un deploy.
// 4. DECISIÓN — Por qué MongoDB: cuánto pesó la forma de los datos y cuánto el stack que el
//    equipo ya manejaba. Si la respuesta honesta es «era lo que estábamos aprendiendo»,
//    escribirla así suma más de lo que resta.
// 5. MI ROL — si además del módulo de autenticación y el ABM de profesionales tocó el flujo
//    de aprobación, el buscador o la subida a Cloudinary, sumarlo.
// 6. RESULTADO — si el municipio llegó a usarlo o se cargaron profesionales reales, decirlo
//    con el número. Si no pasó, "se entregó y se aprobó" alcanza: inventar métricas de uso
//    es el riesgo más caro de toda la ficha.
// 7. APRENDIZAJES — sección entera sin escribir. Disparadores: qué haría distinto hoy en el
//    modelo de datos, y qué aprendió sobre construir para un tercero que no es el usuario
//    final (el municipio decide quién entra, pero el vecino es el que usa la app).
// PENDIENTE — la justificación de cada decisión técnica, que solo el dueño puede dar. El
// cuerpo publica QUÉ se hizo; falta el PORQUÉ, que es lo que un entrevistador realmente lee.
// Al completarlo, sumarlo bajo el ### correspondiente y volver a correr este script.
//
// 1. COLA — Por qué el criterio de orden está duplicado en SQL y en el dominio. El riesgo
//    asumido son dos fuentes de verdad que pueden divergir: ¿lo dejaría así hoy?
// 2. VALUE OBJECTS — Por qué validar en el constructor y no solo con decoradores en el DTO
//    (el DTO protege el borde HTTP; el value object protege el dominio entero: tests, seeds
//    y cualquier consumidor futuro que no sea un controller). Contar también el costo: más
//    clases, más ceremonia.
// 3. SIN ORM — Por qué no TypeORM ni Prisma teniendo NestJS al lado, y el costo real que se
//    pagó: mapeo manual repetido en cada repositorio.
// 4. 17 PUERTOS — Dónde la indirección NO se pagó sola. 17 interfaces para 4 controllers es
//    mucha ceremonia: ¿en qué tamaño de proyecto lo volvería a hacer y en cuál no?
// 5. BDD — Qué le dio escribir los escenarios antes que el código y qué le costó. Ángulo
//    fuerte: los escenarios cambiaron el diseño del dominio (el comparador existe porque un
//    escenario pedía verificar el orden de la lista, no el resultado de una consulta).
// 6. EXCLUSIÓN MUTUA — Por qué vive en el servicio y no como restricción en la base (un
//    índice único parcial sobre atenciones sin informe). Conecta directo con el primer punto
//    de "Qué haría distinto hoy": conviene contarlas juntas.
// 7. RESULTADO — Si la cátedra dejó una nota o devolución que quiera incluir. Y si en
//    algún momento el sistema se usa en la guardia, reemplazar la medición propia de los
//    ~2 minutos por el dato de operación real, que es el que cierra el círculo.
//
// FUERA DEL TEXTO: el artefacto de origen trae además un guion de video de 8 escenas
// (~100 s, sin audio, en loop) y la lista de chequeo previa a grabar. Cuando el video exista,
// se suma como `images` o como link en verification.
const guardiaMedicaBody = `## El problema

En una guardia médica, el que llega primero no es el que se atiende primero. La enfermera de
admisión toma los signos vitales, escribe el informe de ingreso y asigna un nivel de
emergencia; el médico atiende siempre el caso más grave y, a igual gravedad, al que llegó
antes.

Sostenido a mano, ese orden depende de que alguien lo recalcule mentalmente cada vez que entra
un paciente. Y no hay registro de quién atiende a quién: dos médicos pueden llamar al mismo
paciente, o un caso crítico puede quedar sepultado debajo de cinco consultas menores que
llegaron antes.

En el relevamiento, el personal de la guardia —unos 50 pacientes por día— estimó que
admitir a un paciente a mano les llevaba alrededor de siete minutos. Ese número pasó a ser
el objetivo de diseño del formulario de ingreso.

El sistema resuelve tres cosas concretas: **ordenar** la cola por criterio clínico,
**impedir** que un dato clínico imposible entre al sistema, y **dejar asentado** qué médico
tomó qué paciente y cuándo cerró la atención.

## La regla central

Cinco niveles de emergencia, cada uno con su tiempo máximo de espera. El orden es *nivel
primero, hora de llegada después*. Un paciente crítico que entra a las 16:17 pasa por delante
de una consulta sin urgencia que esperaba desde las 13:24.

| Nivel | Motivo de consulta | Ingreso | Espera máx. |
| --- | --- | --- | --- |
| Crítica | Fractura de cráneo | 16:17 | 5 min |
| Emergencia | Fractura de brazo | 16:03 | 30 min |
| Emergencia | Dengue | 16:27 | 30 min |
| Urgencia | Dolor de muela | 16:02 | 60 min |
| Urgencia menor | Dolor de hígado | 18:03 | 120 min |
| Sin urgencia | Dolor de pie | 13:24 | 240 min |

La última fila llegó primero de todas —13:24— y se atiende última. Ese es todo el sistema en
una línea.

## Arquitectura

Backend NestJS separado en cuatro capas, con las dependencias apuntando siempre hacia
adentro. El dominio no importa nada de MySQL ni de HTTP: habla con **17 interfaces**
inyectadas por token, y quién las implementa se decide en los módulos de \`app/\`.

\`presentation\` traduce HTTP y aplica los guards de rol; \`business\` es el dominio —entidades,
value objects de signos vitales y las reglas—, sin una sola dependencia de infraestructura;
\`persistence\` implementa los puertos con SQL escrito a mano sobre \`mysql2\`, sin ORM; y \`app\`
es el cableado que decide qué implementación satisface cada token. El frontend es React 18 con
Vite: rutas protegidas por el rol que viaja en el JWT y formularios que validan rangos
clínicos.

Los tests corren en GitHub Actions en cada PR a \`develop\`: ningún merge entra con la suite en
rojo.

## Decisiones técnicas

### Cola con prioridad y desempate FIFO, no una fila

El orden vive en dos lugares a propósito: en el \`ORDER BY\` de la consulta que trae los
pendientes, y en un comparador del dominio (\`Ingreso.compararCon\`) que ordena por nivel y
desempata por fecha. El servicio vuelve a ordenar en memoria lo que la base ya trajo
ordenado, y esa duplicación es la que hace testeable la regla sin base de datos: los
escenarios BDD la verifican contra repositorios en memoria.

### Value objects: un signo vital inválido nunca llega a existir

\`TensionArterial\`, \`FrecuenciaCardiaca\` y \`FrecuenciaRespiratoria\` validan en el constructor.
No hay forma de tener un \`Ingreso\` con presión 120/-80 en memoria: el objeto lanza la
excepción antes de existir. \`TensionArterial\` impone además la regla clínica de que la
sistólica tiene que ser mayor que la diastólica — algo que ningún decorador de
\`class-validator\` expresa bien, porque cruza dos campos.

### BDD antes que código: el \`.feature\` como contrato

El archivo de escenarios está escrito en el lenguaje de la enfermera, no en el del
programador: «ingresa a urgencias el siguiente paciente… la lista de espera está ordenada de
la siguiente manera». La tabla de datos obligatorios es un \`Scenario Outline\` con siete
ejemplos —informe vacío, nivel vacío, frecuencia faltante y tensión incompleta en cada una de
sus tres formas—, así que agregar un campo obligatorio es agregar una fila.

### Un médico, una atención a la vez

Reclamar un paciente hace tres cosas: verifica que el médico no tenga otra atención en
proceso, saca el primero de la cola pasándolo de \`PENDIENTE\` a \`EN PROCESO\`, y crea el
registro de atención que vincula médico e ingreso. El estado del ingreso es una máquina de
tres estados: \`PENDIENTE → EN PROCESO → FINALIZADO\`.

## Mi rol

Equipo de tres. Tomé la autenticación —registro, login, sesión por JWT y hash con argon2—, el
frontend completo y la validación de pacientes por CUIL, con verificación del dígito
verificador por módulo 11: un dígito mal tipeado no da error, crea un paciente duplicado en
lugar de encontrar al que ya existía.

## Resultado

Trabajo final de Ingeniería de Software (UTN, 2025): cinco historias de usuario entregadas,
backend y frontend en repositorios separados, y el flujo completo funcionando de punta a punta
sobre Docker. Los 31 tests unitarios y los 5 escenarios BDD quedan en verde en cada PR.

Contra los siete minutos relevados, cargar un ingreso completo en el sistema terminado
—búsqueda por CUIL, signos vitales, informe y nivel— toma alrededor de dos minutos. Es una
medición propia sobre el flujo, no un dato de operación de la guardia: el objetivo de diseño
se cumplió, y verificarlo en uso real es lo que queda pendiente.

## Qué haría distinto hoy

Los tres salieron de releer el código un año después.

### Concurrencia — dos médicos pueden llevarse el mismo paciente

Reclamar el siguiente ingreso son dos viajes a la base sin transacción: un
\`SELECT … LIMIT 1\` y después un \`UPDATE\` del estado. Si dos médicos tocan «Atender» en la
misma ventana de milisegundos, los dos leen la misma fila y los dos creen que se la llevaron.
Con un solo médico por turno no se ve nunca; con tres en una guardia real, sí.

**Cómo se arregla:** envolver ambas operaciones en una transacción con
\`SELECT … FOR UPDATE SKIP LOCKED\`, o dar vuelta la lógica a un
\`UPDATE … WHERE id_estado_ingreso = PENDIENTE\` y quedarse con la fila solo si afectó una.

### Dominio — la fecha de ingreso se pisa al rehidratar

El constructor de \`Ingreso\` asigna \`new Date()\` ignorando la fecha que recibe. Al reconstruir
un ingreso desde la base, la hora real de llegada se pierde y todos «nacen» ahora. El
desempate FIFO en memoria sigue funcionando solo porque el SQL ya venía ordenado y el sort es
estable: la regla está bien, pero se sostiene por accidente.

**Cómo se arregla:** respetar \`args.fechaIngreso\` y dejar \`new Date()\` únicamente para el
constructor de creación. Un test que rehidrate dos ingresos con fechas invertidas lo habría
cazado.

### Producto — el dato más valioso quedó modelado y sin usar

La tabla \`nivel\` guarda el tiempo máximo de espera de cada nivel —5, 30, 60, 120 y 240
minutos— y nadie lo lee nunca. Ahí estaba la feature que le habría dado sentido a toda la
pantalla: marcar en rojo a los pacientes que ya superaron su tiempo objetivo. El modelo la
tenía; la interfaz nunca la aprovechó.

**Cómo se arregla:** comparar \`fecha_ingreso + espera_maxima\` contra ahora y mostrar el
tiempo restante por paciente. Es media tarde de trabajo y es la mejor demo del proyecto.
`;

const portalOficiosBody = `## El problema

En Concepción, conseguir un gasista matriculado o un electricista de confianza pasaba por
el boca en boca: grupos de WhatsApp, la recomendación de un vecino, un volante pegado en el
almacén. No había un lugar único donde ver quién ejerce cada oficio en la ciudad, ninguna
forma de distinguir a un trabajador verificado de un número de teléfono suelto, ni registro
de cómo le había ido a otra gente con él.

Del lado del trabajador el problema era el simétrico: sin local a la calle ni presupuesto
de publicidad, su clientela no crecía más allá de su círculo de conocidos.

## Contexto

Entrega académica de la cursada de Rolling Code School, construida entre cuatro sobre un
caso de la Municipalidad de Concepción, entre noviembre de 2023 y marzo de 2024.

## Arquitectura

Una SPA en React (Vite) contra una API REST en Express y MongoDB. Tres roles conviven en la
misma aplicación: el vecino que busca, el profesional que ofrece su oficio y el
administrador municipal que habilita.

El centro del modelo no es el CRUD sino un flujo de aprobación. Cuando un profesional se
registra, su perfil nace en estado \`pendiente\`: no puede iniciar sesión ni aparecer en
ninguna búsqueda hasta que un administrador lo revisa y lo habilita. El municipio pone su
nombre en el directorio, así que el municipio decide quién entra.

Sobre ese flujo se apoya el resto:

- **Reputación construida por la comunidad.** Los comentarios de los vecinos viven
  embebidos en el documento del profesional, y un hook de Mongoose recalcula el promedio de
  calificación cada vez que se guarda uno nuevo.
- **Archivos fuera de la base.** Las fotos de perfil y los CV se suben a Cloudinary.
- **Sesión y credenciales.** Autenticación por JWT, con las contraseñas hasheadas con
  bcrypt en un hook del modelo.
- **Búsqueda tolerante a los acentos.** El buscador los normaliza antes de comparar, para
  que «Juarez» encuentre a «Juárez» — un detalle mínimo que en un padrón de apellidos
  argentinos deja de ser mínimo.

## Decisiones técnicas

### Por qué una aprobación manual y no un registro abierto

El directorio lleva el nombre del municipio: un perfil falso ahí no es un dato malo, es el
municipio recomendando a alguien que nadie verificó. Contra ese costo, la fricción de hacer
esperar a un trabajador real hasta que un administrador lo revise sale barata. Por eso el
estado \`pendiente\` cierra las dos puertas —el login y la aparición en las búsquedas— y no
solo la segunda.

## Mi rol

El portal lo construimos entre cuatro. Yo tomé el módulo de autenticación —registro, login,
hash de credenciales y sesión por JWT— y el ABM de profesionales, cubriendo las dos puntas:
los endpoints en Express y las pantallas en React.

## Resultado

Se entregó como trabajo académico de la cursada, con el directorio funcionando de punta a
punta: alta del profesional, aprobación del administrador, búsqueda por oficio y
comentarios de los vecinos.

## Volver al proyecto, dos años después

En 2026 el proyecto estaba muerto: el clúster de MongoDB Atlas se había perdido y con él la
única copia de los datos. Reconstruí la base desde cero con un seed reproducible y
versionado —veintidós profesionales repartidos en las once categorías, con sus comentarios y
calificaciones— de modo que cualquiera pueda levantar el proyecto entero con un
\`npm run seed\`. En el camino aparecieron un endpoint de edición que guardaba las
contraseñas sin hashear y un componente que se importaba sin usarse. Los dos quedaron
corregidos.
`;

const rows = [
  {
    type: 'caso_estudio',
    locale: 'es',
    slug: 'trimia',
    project_slug: 'trimia',
    title: 'TrimIA — Un asistente de WhatsApp que sabe cuándo callarse',
    excerpt:
      'Cinco agentes de IA sobre la base de conocimiento de una comercializadora de electrodomésticos: responden lo que pueden respaldar y derivan a una persona lo que no.',
    body: trimiaBody,
    images: JSON.stringify([]),
    status: 'published',
  },
  {
    type: 'caso_estudio',
    locale: 'es',
    slug: 'nube-privada',
    project_slug: 'nube-privada',
    title: 'NAP — Orquestación de nube privada sobre Proxmox VE',
    excerpt:
      'Cómo diseñé el portal que le da a las cátedras de Ingeniería en Sistemas un pedazo de nube privada sobre Proxmox VE — sin que ninguna cátedra tenga que abrir Proxmox.',
    body: nubePrivadaBody,
    images: JSON.stringify([]),
    status: 'published',
  },
  {
    type: 'caso_estudio',
    locale: 'es',
    slug: 'portal-oficios-concepcion',
    project_slug: 'portal-oficios-concepcion',
    title: 'Portal de Oficios Concepción — Directorio municipal de oficios',
    excerpt:
      'Cómo construimos un directorio donde los vecinos de Concepción encuentran gasistas, electricistas y carpinteros verificados por el municipio, con una reputación construida por la propia comunidad.',
    body: portalOficiosBody,
    images: JSON.stringify([]),
    status: 'published',
  },
  {
    type: 'caso_estudio',
    locale: 'es',
    slug: 'guardia-medica',
    project_slug: 'guardia-medica',
    title: 'Guardia Médica — Sistema de triaje para urgencias',
    excerpt:
      'Cómo modelé una cola de espera que no es una fila: prioridad clínica sobre orden de llegada, signos vitales que no pueden existir en estado inválido, y un dominio que se testea entero sin levantar la base de datos.',
    body: guardiaMedicaBody,
    images: JSON.stringify([]),
    status: 'published',
  },
];

const insert = db.prepare(`
  INSERT INTO content (type, locale, slug, project_slug, title, excerpt, body, images, status, source, read_time, published_at)
  VALUES (@type, @locale, @slug, @project_slug, @title, @excerpt, @body, @images, @status, 'site', @read_time, datetime('now'))
  ON CONFLICT (slug, locale) DO UPDATE SET
    title=excluded.title, excerpt=excluded.excerpt, body=excluded.body,
    images=excluded.images, status=excluded.status, read_time=excluded.read_time,
    updated_at=datetime('now')
`);

for (const row of rows) {
  insert.run({ ...row, read_time: readTime(row.body) });
  console.log(`✓ ${row.slug} (${row.locale})`);
}

db.close();
