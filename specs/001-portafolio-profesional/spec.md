# Especificación de Funcionalidad: Portafolio Profesional con Perfil Dual

**Directorio de Feature**: `specs/001-portafolio-profesional`

**Creada**: 2026-08-07

**Estado**: Borrador

**Entrada**: Reorientar el portafolio de enfoque académico (blog para aprobar una materia,
alojado en Proxmox) a un portafolio profesional orientado a empleabilidad, que represente de
forma unificada el perfil dual del dueño: Desarrollo de Software e Infraestructura/Redes.

## Escenarios de Usuario y Testing *(obligatorio)*

**Criterio rector**: el sitio debe servir a dos lecturas de duración muy distinta. Un
reclutador no técnico dedica 30-60 segundos y necesita identificar rol, stack y
verificabilidad. Un líder técnico dedica 3-5 minutos y necesita ver criterio de arquitectura.
Ninguna de las dos lecturas debe requerir la otra para aportar valor.

### Historia de Usuario 1 - Evaluación rápida del reclutador (Prioridad: P1)

Una reclutadora de IT recibe el enlace del portafolio junto con decenas de candidaturas.
Abre el sitio y, sin hacer scroll, necesita responder tres preguntas: qué es esta persona,
para qué búsqueda la puedo postular, y cómo verifico lo que dice. Si en menos de un minuto
no obtiene esas respuestas, cierra la pestaña y pasa al siguiente candidato. Si las obtiene,
baja a ver los proyectos, escanea de qué se tratan y con qué tecnologías se hicieron, y se
lleva el CV y un medio de contacto.

**Por qué esta prioridad**: Es el filtro que todo el resto del sitio necesita superar para
existir. Sin esta historia, ninguna otra llega a ser leída. El dueño no tiene experiencia
laboral formal, por lo que esta primera pantalla es la única oportunidad de establecer
credibilidad antes de que los proyectos hablen.

**Test independiente**: Se puede probar completamente entregando la URL a una persona que no
conozca al dueño, cronometrando 60 segundos, y pidiéndole después que indique el rol, tres
tecnologías del stack, un proyecto y cómo contactarlo. Entrega valor por sí sola: es un
portafolio funcional aunque no exista ninguna otra historia.

**Escenarios de Aceptación**:

1. **Dado** un visitante que abre el sitio por primera vez en escritorio, **Cuando** la
   página termina de cargar sin que él haga scroll, **Entonces** ve el nombre, el
   posicionamiento profesional en una línea, la ubicación y modalidad de trabajo, las
   tecnologías principales como texto seleccionable, y accesos directos a proyectos,
   repositorio público y descarga de CV.
2. **Dado** un visitante en la sección de proyectos, **Cuando** observa cualquier tarjeta de
   proyecto, **Entonces** ve el nombre del proyecto, para quién o en qué contexto se hizo,
   qué problema resolvió en una línea, el rol real del autor (individual o integrante de un
   equipo de N personas), las tecnologías usadas, y al menos un medio de verificación.
3. **Dado** un visitante que quiere contactar al dueño, **Cuando** llega a la sección de
   contacto, **Entonces** encuentra la dirección de correo como texto copiable, enlaces a sus
   perfiles profesionales públicos, y el CV descargable, sin necesidad de completar
   formularios.
4. **Dado** un visitante que usa el buscador del navegador o una herramienta de rastreo de
   candidaturas, **Cuando** busca el nombre de una tecnología del stack principal,
   **Entonces** la encuentra como texto real en la página, no dentro de una imagen o gráfico.
5. **Dado** un visitante en un teléfono móvil, **Cuando** recorre el sitio completo,
   **Entonces** todas las secciones son legibles y utilizables sin desplazamiento horizontal.

---

### Historia de Usuario 2 - Validación técnica en profundidad (Prioridad: P2)

Un líder técnico ya pasó el filtro inicial y quiere saber si el candidato tiene criterio o
solo siguió tutoriales. Abre el proyecto que más le llamó la atención y busca lo único que le
importa: qué problema real había, cómo lo resolvió, y **por qué eligió ese camino y no otro**.
Una lista de funcionalidades no le sirve; necesita ver decisiones justificadas.

**Por qué esta prioridad**: Es lo que convierte una visita en una entrevista, y es el
diferencial más difícil de falsificar. Depende de la P1 para recibir visitantes, pero aporta
un valor distinto y medible por separado.

**Test independiente**: Se puede probar entregando la URL de un caso de estudio a un
desarrollador senior y pidiéndole que enumere las decisiones de arquitectura tomadas y su
justificación. Entrega valor por sí sola como material de respaldo enviable en una
postulación.

**Escenarios de Aceptación**:

1. **Dado** un visitante en una tarjeta de un proyecto que tiene caso de estudio, **Cuando**
   activa el enlace de detalle, **Entonces** accede a una página dedicada de ese proyecto.
2. **Dado** un visitante en la página de un caso de estudio, **Cuando** la recorre completa,
   **Entonces** encuentra el problema que originó el proyecto, la arquitectura de la solución,
   al menos tres decisiones técnicas con su justificación explícita, el resultado obtenido y
   los aprendizajes.
3. **Dado** un visitante en una tarjeta de un proyecto sin caso de estudio, **Cuando** la
   observa, **Entonces** no se le ofrece un enlace de detalle que lleve a una página vacía o
   sin contenido sustantivo.
4. **Dado** un visitante que terminó de leer un caso de estudio, **Cuando** llega al final,
   **Entonces** dispone de un camino de retorno a los demás proyectos y de un medio de
   contacto.

---

### Historia de Usuario 3 - Filtrado por área profesional (Prioridad: P3)

Un reclutador especializado busca cubrir una vacante concreta: o de desarrollo, o de
infraestructura. Necesita aislar rápidamente la evidencia relevante para su búsqueda sin
tener que interpretar cuál de los proyectos aplica a su caso.

**Por qué esta prioridad**: Resuelve el mayor riesgo del perfil dual (que la ambigüedad
provoque descarte), pero el sitio ya es útil sin el filtro porque cada proyecto declara su
área. Es una mejora de foco, no un cimiento.

**Test independiente**: Se puede probar seleccionando cada área y verificando que el conjunto
de proyectos mostrado corresponde a esa clasificación, y que el estado del filtro es
compartible por enlace.

**Escenarios de Aceptación**:

1. **Dado** un visitante en la sección de proyectos, **Cuando** observa los controles de
   filtro, **Entonces** puede elegir entre ver todos los proyectos, solo los de desarrollo o
   solo los de infraestructura.
2. **Dado** un visitante que seleccionó un área, **Cuando** se aplica el filtro, **Entonces**
   se muestran únicamente los proyectos clasificados en esa área, incluidos los que
   pertenecen a ambas.
3. **Dado** un visitante que aplicó un filtro, **Cuando** copia la dirección de la página y la
   abre en otra ventana, **Entonces** el mismo filtro aparece aplicado.
4. **Dado** un visitante con un filtro de área activo, **Cuando** descarga el CV, **Entonces**
   obtiene el único CV que el sitio ofrece (orientado a desarrollo) — el filtro de proyectos
   no condiciona qué CV se entrega (ver Supuestos: solo se distribuye el CV de desarrollo).
5. **Dado** un visitante que navega solo con teclado, **Cuando** recorre los controles de
   filtro, **Entonces** puede alcanzarlos y activarlos, y percibe cuál está seleccionado.

---

### Historia de Usuario 4 - Lectura en inglés (Prioridad: P4)

Un reclutador de una empresa internacional o de una posición remota en inglés llega al sitio.
Necesita leer el contenido en inglés para evaluarlo y para reenviarlo internamente a su equipo.

**Por qué esta prioridad**: Amplía el mercado alcanzable a posiciones remotas
internacionales, pero el mercado local e hispanohablante ya queda cubierto sin esta historia.
Es una extensión de alcance sobre una base que ya funciona.

**Test independiente**: Se puede probar accediendo a la variante en inglés de cada página y
verificando que el contenido está traducido y que las ausencias de traducción se declaran
explícitamente.

**Escenarios de Aceptación**:

1. **Dado** un visitante en cualquier página del sitio, **Cuando** busca cambiar de idioma,
   **Entonces** encuentra un control visible para alternar entre español e inglés.
2. **Dado** un visitante que cambia de idioma, **Cuando** se completa el cambio, **Entonces**
   permanece en la misma página y sección donde estaba, ahora en el idioma elegido.
3. **Dado** un contenido que aún no tiene traducción al idioma solicitado, **Cuando** el
   visitante accede a él, **Entonces** el sitio le indica de forma explícita que ese contenido
   está disponible en otro idioma y se lo ofrece, en lugar de mostrar una mezcla de idiomas
   sin aviso o una página vacía.
4. **Dado** un visitante en la variante en inglés, **Cuando** descarga el CV, **Entonces**
   obtiene el mismo CV que un visitante en español — el sitio no ofrece una traducción del
   documento en sí (ver Supuestos); solo el contenido de las páginas está traducido.
5. **Dado** un motor de búsqueda que rastrea el sitio, **Cuando** indexa una página,
   **Entonces** puede distinguir el idioma de esa página y la existencia de su variante
   alternativa.

---

### Historia de Usuario 5 - Mantenimiento del contenido por el dueño (Prioridad: P5)

El dueño del portafolio termina un proyecto, completa un curso o cambia de rol, y necesita
reflejarlo en el sitio sin tener que modificar código ni volver a desplegar. Si actualizar es
costoso, el contenido se desactualiza, y un portafolio desactualizado lo perjudica.

**Por qué esta prioridad**: Es lo que sostiene el Principio V de la constitución a lo largo del
tiempo. El sitio puede lanzarse con contenido inicial sin esta historia, pero sin ella la
calidad se degrada mes a mes.

**Test independiente**: Se puede probar creando, editando y despublicando un contenido desde
la interfaz de administración y verificando que el cambio se refleja en el sitio público.

**Escenarios de Aceptación**:

1. **Dado** el dueño autenticado en la administración, **Cuando** crea o edita un caso de
   estudio, **Entonces** puede escribirlo en formato de texto enriquecido y previsualizar el
   resultado antes de publicarlo.
2. **Dado** el dueño editando un contenido, **Cuando** lo guarda como borrador, **Entonces**
   ese contenido no aparece en el sitio público.
3. **Dado** el dueño editando un contenido, **Cuando** indica a qué idioma corresponde,
   **Entonces** ese contenido se muestra únicamente a los visitantes de ese idioma.
4. **Dado** un visitante no autenticado, **Cuando** intenta acceder a la administración,
   **Entonces** se le deniega el acceso.
5. **Dado** el dueño creando un contenido, **Cuando** elige su tipo, **Entonces** puede
   distinguir entre un caso de estudio de proyecto y un artículo, aun cuando por ahora solo se
   publiquen casos de estudio.

---

### Casos Límite

- **Medio de verificación aún no producido**: las demostraciones grabadas se incorporan después
  del lanzamiento. Un proyecto sin demo todavía disponible debe presentarse completo con sus
  medios existentes, sin dejar huecos ni enlaces inactivos a la espera.
- **Proyecto en curso y en producción**: dos de los cuatro proyectos siguen activos y operando
  con datos reales. El sitio debe comunicar que están en curso sin que se lea como inconcluso, y
  el material publicado no debe exponer información sensible de esos sistemas.
- **Publicación parcial del portafolio**: si solo una parte de los proyectos tiene su contenido
  terminado, el sitio público no debe exhibir el resto a medio completar.
- **Filtro sin resultados**: si un área quedara sin proyectos asociados, el filtro debe
  comunicarlo claramente en lugar de mostrar una sección vacía sin explicación.
- **Traducción faltante o desactualizada**: un contenido publicado en un idioma y no en el otro
  nunca debe producir una página en blanco, un error, ni una mezcla silenciosa de idiomas.
- **Contenido académico heredado**: las publicaciones creadas para la materia original no deben
  aparecer en el sitio público reorientado.
- **Roles de infraestructura/redes sin CV propio**: el sitio no distribuye un CV orientado a
  infraestructura; un visitante que busca ese perfil se dirige por correo o LinkedIn (RF-022,
  Supuestos), no por una descarga desde el sitio.
- **Enlace externo caído**: un repositorio o demo que deje de estar disponible no debe romper
  la presentación del proyecto.
- **Visitante sin JavaScript o con conexión degradada**: el contenido principal (quién es, qué
  hizo, cómo contactarlo) debe seguir siendo legible.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

**Presentación y posicionamiento**

- **RF-001**: El sitio DEBE presentar, en la primera pantalla visible y sin requerir scroll,
  el nombre del dueño, un posicionamiento profesional de una línea que abarque explícitamente
  desarrollo e infraestructura, la ubicación y modalidad de trabajo, y las tecnologías
  principales.
- **RF-002**: Las tecnologías del stack principal DEBEN presentarse como texto seleccionable y
  buscable, nunca exclusivamente dentro de imágenes.
- **RF-003**: El sitio DEBE ofrecer en la primera pantalla accesos directos a la sección de
  proyectos, al perfil público de repositorios y a la descarga del CV.
- **RF-004**: El sitio DEBE presentar las competencias técnicas agrupadas por capa (backend,
  frontend, datos, infraestructura y nube, e inteligencia artificial).
- **RF-005**: El sitio NO DEBE representar el nivel de dominio de una tecnología mediante
  barras de progreso, porcentajes ni puntajes numéricos.
- **RF-006**: El sitio DEBE incluir una descripción personal breve, acotada a un máximo de
  cuatro líneas de texto.
- **RF-007**: El sitio NO DEBE mostrar la edad del dueño, fotografías de tipo carnet en tamaño
  destacado, ni ninguna referencia a que el sitio se originó como trabajo práctico académico.

**Proyectos**

- **RF-008**: El sitio DEBE mostrar los proyectos ordenados por impacto profesional decidido
  por el dueño, no por orden cronológico automático.
- **RF-009**: Cada proyecto DEBE mostrar: nombre, contexto o cliente, el problema resuelto
  expresado en una línea, el rol real del autor indicando si fue trabajo individual o en equipo
  y de cuántas personas, y las tecnologías empleadas.
- **RF-010**: Cada proyecto DEBE ofrecer al menos un medio de verificación accesible al
  visitante. Los cuatro proyectos DEBEN enlazar su repositorio de código público, y DEBEN poder
  además ofrecer un informe técnico descargable.
- **RF-010a**: Cada proyecto DEBE admitir la incorporación de medios de verificación
  adicionales (demostración grabada, informe, documento) de forma progresiva y posterior a su
  publicación inicial, sin requerir rehacer el contenido ya publicado ni redesplegar el sitio.
- **RF-010b**: Un medio de verificación aún no disponible NO DEBE mostrarse como un enlace
  vacío, deshabilitado ni pendiente; simplemente no se muestra hasta que exista.
- **RF-011**: Cada proyecto DEBE estar clasificado en al menos un área profesional
  (desarrollo, infraestructura, o ambas).
- **RF-012**: Cada proyecto DEBE indicar su período y si continúa en curso.
- **RF-013**: El sitio DEBE permitir filtrar los proyectos por área profesional, incluyendo
  una opción que los muestre todos.
- **RF-014**: El estado del filtro de área DEBE quedar reflejado en la dirección de la página,
  de modo que sea compartible y recuperable.

**Casos de estudio**

- **RF-015**: El sitio DEBE ofrecer una página de detalle dedicada únicamente para los
  proyectos que tengan un caso de estudio publicado.
- **RF-016**: Cada caso de estudio DEBE contener el problema de origen, la arquitectura de la
  solución, un mínimo de tres decisiones técnicas acompañadas de su justificación, el resultado
  y los aprendizajes.
- **RF-016a**: Cada caso de estudio DEBE poder incorporar material visual (diagramas de
  arquitectura y capturas del sistema) intercalado con el texto, con texto alternativo
  descriptivo para cada pieza.
- **RF-016b**: El material visual de los casos de estudio NO DEBE exponer datos reales de
  clientes, credenciales ni información sensible de sistemas en producción.
- **RF-017**: Un proyecto sin caso de estudio publicado NO DEBE ofrecer un enlace a una página
  de detalle.
- **RF-018**: Cada caso de estudio DEBE ofrecer al final un camino de retorno a los proyectos y
  un medio de contacto.

**Contacto y CV**

- **RF-019**: El sitio DEBE mostrar la dirección de correo del dueño como texto copiable y
  enlaces a sus perfiles profesionales públicos.
- **RF-020**: El sitio NO DEBE requerir completar un formulario para obtener un medio de
  contacto.
- **RF-021**: El sitio DEBE ofrecer el CV descargable desde cualquier página en un máximo de
  dos interacciones.
- **RF-022**: El sitio DEBE distribuir únicamente el CV orientado a desarrollo; NO DEBE
  ofrecer descarga de un CV orientado a infraestructura/redes, independientemente del filtro
  de área que el visitante tenga activo en la sección de proyectos (decisión del dueño: para
  roles de infraestructura/redes prefiere que lo contacten directo por correo o LinkedIn en
  vez de vía este sitio).

**Idiomas**

- **RF-023**: El sitio DEBE estar disponible en español e inglés, y DEBE ofrecer un control
  visible para alternar entre ambos desde cualquier página.
- **RF-024**: Al cambiar de idioma, el visitante DEBE permanecer en la página equivalente y no
  ser devuelto al inicio.
- **RF-025**: Cuando un contenido no exista en el idioma solicitado, el sitio DEBE informarlo
  explícitamente al visitante y ofrecerle la versión disponible; NO DEBE mostrar contenido
  mezclado entre idiomas sin aviso, una página vacía ni un error.
- **RF-026**: Cada página DEBE declarar su idioma y la existencia de su variante alternativa de
  forma reconocible por motores de búsqueda.

**Gestión de contenido**

- **RF-027**: El dueño DEBE poder crear, editar, publicar y despublicar contenidos desde una
  interfaz de administración, sin modificar código ni redesplegar el sitio.
- **RF-028**: Los contenidos DEBEN admitir un estado de borrador que no sea visible en el
  sitio público.
- **RF-028a**: El sitio DEBE permitir preparar la totalidad del contenido de proyectos y casos
  de estudio en estado no público, y habilitarlo en bloque, de modo que el portafolio
  reorientado nunca quede expuesto con proyectos a medio documentar.
- **RF-028b**: Mientras el contenido reorientado no esté habilitado, el sitio público NO DEBE
  mostrar secciones vacías, tarjetas incompletas ni casos de estudio sin cuerpo.
- **RF-029**: Cada contenido DEBE registrar el idioma al que corresponde.
- **RF-030**: Cada contenido DEBE registrar su tipo, distinguiendo como mínimo entre caso de
  estudio de proyecto y artículo, aunque en el alcance actual solo se publiquen casos de
  estudio.
- **RF-031**: Cada contenido DEBE registrar su origen, permitiendo distinguir entre contenido
  redactado directamente en el sitio y contenido proveniente de una fuente externa, de modo que
  una futura incorporación automática de publicaciones no requiera rehacer el modelo de datos.
- **RF-032**: El acceso a la interfaz de administración DEBE requerir autenticación.
- **RF-033**: El contenido creado para la materia académica original NO DEBE ser visible en el
  sitio público.

**Calidad transversal**

- **RF-034**: Todas las páginas DEBEN ser utilizables en viewports móviles y de escritorio sin
  desplazamiento horizontal.
- **RF-035**: Todas las funcionalidades interactivas DEBEN ser alcanzables y operables mediante
  teclado, con indicación visible del elemento enfocado.
- **RF-036**: El contenido textual principal DEBE ser legible aunque no se ejecute JavaScript
  en el navegador del visitante.
- **RF-037**: Un enlace externo no disponible NO DEBE impedir la visualización del resto de la
  información del proyecto.

### Entidades Clave

- **Proyecto**: Trabajo realizado por el dueño que se exhibe como evidencia profesional.
  Atributos: nombre, contexto o cliente, problema resuelto, descripción, rol del autor, tamaño
  del equipo, tecnologías, áreas profesionales asociadas, período, estado (en curso o
  finalizado), orden de prioridad de exhibición, y referencia opcional a un caso de estudio.
- **Medio de Verificación**: Evidencia externa que respalda un proyecto. Atributos: proyecto al
  que pertenece, tipo (repositorio de código, informe técnico, demostración grabada, documento),
  destino, y disponibilidad. Un proyecto tiene uno o varios, y puede sumar nuevos con el tiempo.
- **Contenido Editorial**: Pieza de texto extensa publicable. Atributos: título, cuerpo en
  formato enriquecido, tipo (caso de estudio o artículo), idioma, estado de publicación,
  origen (redactado en el sitio o proveniente de fuente externa), identificador de la fuente
  externa cuando corresponda, fechas de creación y actualización, y vínculo al proyecto que
  documenta cuando es un caso de estudio.
- **Recurso Visual**: Imagen que acompaña a un contenido editorial. Atributos: contenido al que
  pertenece, tipo (diagrama de arquitectura o captura de sistema), archivo, texto alternativo
  descriptivo, y posición dentro del cuerpo.
- **Competencia Técnica**: Tecnología o habilidad que el dueño declara. Atributos: nombre,
  capa a la que pertenece, y áreas profesionales en las que aplica. No incluye nivel numérico
  de dominio.
- **Formación**: Estudio, curso o certificación. Atributos: título, institución, período,
  estado (en curso o completado), y medio de verificación cuando exista.
- **Perfil Profesional**: Datos identitarios y de posicionamiento del dueño. Atributos: nombre,
  posicionamiento de una línea, ubicación, modalidad de trabajo, descripción breve, correo de
  contacto, enlaces a perfiles públicos, y la ruta al único CV que el sitio distribuye
  (orientado a desarrollo).
- **Área Profesional**: Eje de clasificación que permite segmentar proyectos y competencias
  técnicas (ya no el CV, que es único). Valores: desarrollo e infraestructura.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **CE-001**: Una persona que no conoce al dueño puede indicar su rol profesional, tres
  tecnologías de su stack y un medio de verificación, tras 60 segundos de exposición al sitio,
  en al menos 4 de cada 5 intentos.
- **CE-002**: El 100% de los proyectos exhibidos muestra contexto, problema resuelto, rol real
  del autor, tecnologías y al menos un medio de verificación.
- **CE-003**: Un evaluador técnico puede enumerar al menos tres decisiones de arquitectura con
  su justificación tras leer cualquiera de los casos de estudio publicados.
- **CE-004**: La información esencial (quién es, qué hizo, cómo contactarlo) queda disponible
  para el visitante en menos de 2,5 segundos desde la solicitud de la página, en una conexión
  móvil de gama media.
- **CE-005**: Cero elementos del listado de exclusiones (barras de porcentaje, edad, fotografía
  de carnet destacada, formularios de contacto obligatorios, referencias académicas al origen
  del sitio) aparecen en el sitio publicado.
- **CE-006**: Cero casos de contenido mostrado en un idioma distinto al solicitado sin aviso
  explícito al visitante.
- **CE-007**: El sitio completo es operable únicamente con teclado, y el 100% de las
  combinaciones de texto y fondo cumple el nivel de contraste AA.
- **CE-008**: El CV se obtiene en un máximo de dos interacciones desde cualquier página del
  sitio.
- **CE-009**: El dueño puede publicar un caso de estudio nuevo y verlo en el sitio público en
  menos de 15 minutos, sin modificar código ni redesplegar.
- **CE-010**: Cero páginas del sitio requieren desplazamiento horizontal en un viewport de 360
  píxeles de ancho.
- **CE-011**: En el momento de habilitar el portafolio reorientado, el 100% de los proyectos
  exhibidos tiene su contenido completo; cero tarjetas o casos de estudio quedan a medio
  documentar en el sitio público.
- **CE-012**: El dueño puede sumar una demostración grabada a un proyecto ya publicado sin
  modificar el resto de su contenido ni redesplegar el sitio.

## Supuestos

- Las tarjetas de proyecto se limitan a los cuatro proyectos declarados en los CVs del dueño:
  TrimIA, Software de Gestión y Orquestación de Nube Privada, Sistema de Gestión de Colas de
  Pacientes para Guardia Médica, y Red Social de Trabajos.
- Los casos de estudio en profundidad se limitan a TrimIA y al Software de Gestión y
  Orquestación de Nube Privada, por ser los de mayor sustancia arquitectónica. Los otros dos
  proyectos se exhiben solo como tarjeta.
- El orden de exhibición por impacto profesional coloca a TrimIA y a la Nube Privada por
  encima de los otros dos proyectos.
- La sección de formación se alimenta inicialmente de lo declarado en los CVs (Ingeniería en
  Sistemas de Información en UTN-FRT, y Full-Stack Dev MERN en Rolling Code School). La
  estructura admite certificaciones adicionales que el dueño incorpore más adelante.
- El sitio tiene un único autor y administrador; no se requiere gestión de múltiples usuarios,
  roles ni flujos de aprobación editorial.
- La incorporación automática de publicaciones desde una red social profesional queda **fuera
  del alcance** de esta especificación. Solo se exige que el modelo de contenido no la impida.
- El dueño mantiene dos versiones de CV (orientada a desarrollo y orientada a
  infraestructura/redes) como documentos propios, pero **el sitio distribuye solo la de
  desarrollo**. Para roles de infraestructura/redes, el dueño prefiere ser contactado
  directamente por correo o LinkedIn antes que a través de una descarga del sitio — decisión
  explícita que reemplaza al RF-022 original (CV por área activa). El sitio no genera el CV,
  solo lo sirve como archivo estático.
- La elección de plataforma de alojamiento deja de estar condicionada por el requisito
  académico original y se resolverá en la fase de planificación según confiabilidad, costo y
  mantenimiento.
- El motor de contenido en formato enriquecido y la interfaz de administración ya existentes
  se reutilizan como base, reorientados a casos de estudio.
- El idioma por defecto del sitio es el español, por ser el mercado principal del dueño.
- Los cuatro proyectos tienen repositorio de código público del cual el dueño es propietario,
  por lo que la verificación primaria de cada uno es el enlace al repositorio.
- Las demostraciones grabadas se producirán después del lanzamiento inicial y se incorporarán
  de forma incremental. Su ausencia no bloquea la publicación.
- El dueño dispone de diagramas de arquitectura y capturas de pantalla publicables para los dos
  casos de estudio.
- El portafolio reorientado se habilita en bloque, una vez que el contenido de todos los
  proyectos esté completo. No hay lanzamiento parcial por secciones en el sitio público.
- El contenido y los medios de verificación del sitio han sido revisados por el dueño para
  descartar información sensible de los sistemas que están en producción.

## Dependencias

- Requiere que el dueño provea el contenido redactado de los dos casos de estudio, incluidas
  las decisiones técnicas y sus justificaciones. El sitio no puede inferirlas.
- Requiere que el dueño defina el posicionamiento profesional de una línea y la descripción
  breve, en ambos idiomas.
- Requiere las traducciones al inglés de todo el contenido publicado, o la decisión explícita
  de qué contenidos quedan solo en español.
- Requiere las direcciones de los repositorios públicos de los cuatro proyectos, y los informes
  técnicos que acompañen a cada uno.
- Requiere los diagramas de arquitectura y capturas publicables de los dos casos de estudio,
  revisados para no exponer datos de sistemas en producción.
- Requiere el archivo de CV orientado a desarrollo (única versión que el sitio distribuye).
