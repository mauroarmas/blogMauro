<!--
Sync Impact Report
- Cambio de versión: 1.0.0 → 1.1.0
- Cambio de idioma: inglés → español (documento completo)
- Principios modificados:
  - "I. Professional Signal First" → "I. Señal Profesional Dual (Desarrollo + Infraestructura)"
    (ampliado: ahora exige explícitamente representar ambos perfiles del dueño del
    proyecto, no solo "empleabilidad" en abstracto)
  - II–V: traducidos, sin cambios de fondo
- Secciones añadidas:
  - "Fuente de Verdad del Perfil" dentro de Restricciones de Contenido y Tecnología,
    referenciando los dos CVs (Desarrollo e Infraestructura/Redes) como insumo para
    el contenido del portafolio
- Secciones eliminadas: ninguna
- Plantillas que requieren actualización:
  - .specify/templates/plan-template.md ✅ sin cambios necesarios (el gate de
    Constitution Check es genérico y lee este archivo al momento de planificar)
  - .specify/templates/spec-template.md ✅ sin cambios necesarios
  - .specify/templates/tasks-template.md ✅ sin cambios necesarios
  - README.md ⚠ pendiente — sigue describiendo el boilerplate genérico de
    create-next-app; se recomienda actualizarlo cuando se implemente la primera
    feature del portafolio profesional
- TODOs de seguimiento: ninguno bloqueante
-->

# Constitución del Portafolio

## Principios Fundamentales

### I. Señal Profesional Dual (Desarrollo + Infraestructura)

Todo el contenido del portafolio DEBE demostrar empleabilidad real en las dos
áreas de interés del dueño del proyecto: **Desarrollo de Software** (full-stack,
Node.js/NestJS, React/Next.js, IA/RAG, bases de datos) e **Infraestructura de
Redes** (virtualización con Proxmox VE, administración Linux, redes TCP/IP,
cloud). El portafolio NO DEBE inclinarse a mostrar un solo perfil como si fuera
el único; cada proyecto, habilidad o logro relevante para cualquiera de las dos
áreas DEBE tener presencia visible y curada. Contenido construido solo para
cumplir una consigna académica (p. ej. un motor de blog genérico mantenido
únicamente porque una materia lo exigía) DEBE reformularse para aportar valor
profesional (p. ej. como "artículos técnicos" que demuestran comunicación) o
eliminarse. Cuando el público principal de una funcionalidad es un docente
evaluador y no un reclutador o responsable de contratación, esa funcionalidad no
pertenece al producto.

**Justificación**: El propósito del proyecto cambió de "aprobar una materia" a
"conseguir trabajo", y el dueño del proyecto tiene dos perfiles profesionales
igualmente válidos (desarrollo e infraestructura/redes) que el portafolio debe
representar como una combinación completa, no como dos mitades desconectadas.

### II. Integridad de Proyectos y Credenciales

Todo proyecto mostrado DEBE incluir: qué hace, el aporte/rol real del autor, el
stack tecnológico utilizado y una forma de verificarlo (demo en vivo, enlace al
repositorio o artefacto descargable). Todo curso o certificación listado DEBE ser
real, estar vigente o completado, y no debe tergiversar alcance, institución
emisora ni fecha de finalización. Proyectos de relleno, contenido de relleno o
afirmaciones no verificables NO DEBEN publicarse.

**Justificación**: La credibilidad de un portafolio es toda su propuesta de
valor; una sola entrada exagerada o falsa socava la confianza en todas las demás.

### III. Simplicidad y Ajuste al Framework (NO NEGOCIABLE)

Las soluciones DEBEN usar el enfoque más simple que satisfaga el requisito,
priorizando las capacidades nativas de Next.js/React por sobre abstracciones
propias, librerías de estado adicionales o infraestructura especulativa. Dado
que la versión de Next.js de este proyecto se aparta de las convenciones
estándar conocidas por el modelo de entrenamiento (ver `AGENTS.md`), la guía
correspondiente en `node_modules/next/dist/docs/` DEBE consultarse antes de
implementar cualquier patrón específico de Next.js (ruteo, obtención de datos,
server actions, caché). No se debe arrastrar complejidad que existía solo para
cumplir los requisitos académicos previos (p. ej. mecanismos de auto-hospedaje)
salvo que siga sirviendo al objetivo de portafolio profesional.

**Justificación**: Es un sitio personal mantenido por una sola persona y de bajo
tráfico. Cada abstracción agregada es deuda de mantenimiento sin un equipo que la
absorba, y los supuestos específicos del framework provenientes del
entrenamiento del modelo son activamente incorrectos para la versión de Next.js
de este código.

### IV. Rendimiento y Accesibilidad como Prueba de Habilidad

El sitio en sí mismo es una muestra de trabajo. Las páginas DEBEN ser responsive
en viewports móviles y de escritorio, DEBEN seguir siendo utilizables con
navegación por teclado y lectores de pantalla (HTML semántico, texto alternativo,
contraste suficiente), y DEBEN evitar JavaScript de cliente innecesario que
degrade el rendimiento de carga. Las regresiones en Core Web Vitals o
accesibilidad introducidas por un cambio DEBEN corregirse antes de considerar
ese cambio terminado.

**Justificación**: La primera impresión técnica que un reclutador tiene de la
habilidad del candidato es la propia UX y rendimiento del portafolio — es una
demostración en vivo, no solo un contenedor de contenido.

### V. Propiedad y Vigencia del Contenido

Todo el contenido (proyectos, cursos, experiencia, biografía) es redactado y
mantenido por el dueño del sitio; no se DEBE introducir contenido sintético o de
relleno de terceros sin revisión explícita. El contenido desactualizado (cursos
finalizados no listados, proyectos entregados faltantes, rol/título
desactualizado) DEBE corregirse apenas se identifique, en lugar de quedar
inconsistente con la realidad.

**Justificación**: Un portafolio que queda rezagado respecto de los logros
reales y actuales del dueño lo representa mal ante las personas a las que busca
persuadir.

## Restricciones de Contenido y Tecnología

- **Stack**: Next.js 16 (App Router) con React 19; PostgreSQL (vía `pg`) como
  almacén de datos principal, con SQLite/`better-sqlite3` permitido solo para
  desarrollo local o herramientas de migración. Tailwind CSS para estilos.
- **El destino de despliegue ya no está fijado por un requisito académico**: el
  auto-hospedaje previo en Proxmox era una restricción de la materia, no un
  requisito del producto. Las decisiones de hosting DEBEN estar guiadas ahora
  por confiabilidad, costo y facilidad de mantenimiento para un sitio de cara
  profesional, no por lo que exigía un trabajo práctico pasado.
- **La funcionalidad de blog heredada** (posts, autoría desde admin) PUEDE
  conservarse solo si se reformula como un canal de contenido profesional (p. ej.
  artículos técnicos) bajo el Principio I; NO DEBE permanecer simplemente porque
  ya existe.
- Los secretos, credenciales de base de datos y mecanismos de autenticación del
  admin NO DEBEN commitearse al repositorio ni exponerse en el bundle de cliente.
- **Fuente de verdad del perfil**: los dos CVs del dueño del proyecto
  (`public/CVS/CV-Desarrollo/` y `public/CVS/CV-Redes/`) son la referencia
  autorizada para validar qué proyectos, tecnologías, experiencia y objetivos
  profesionales deben reflejarse en el portafolio. Ante cualquier duda sobre qué
  incluir, priorizar, o cómo enmarcar un logro, estos documentos son la fuente de
  verdad hasta que el dueño indique lo contrario. El portafolio DEBE presentar
  ambos perfiles (Desarrollo e Infraestructura/Redes) como una combinación
  coherente y completa, no como dos versiones separadas o currículums duplicados.

## Flujo de Trabajo de Desarrollo

- Este es un proyecto mantenido por una sola persona: el dueño es el único
  revisor y aprobador de los cambios, pero DEBE igualmente autorrevisar cada
  cambio contra los Principios Fundamentales antes de publicarlo en producción.
- Antes de implementar cualquier comportamiento específico de Next.js, la guía
  correspondiente en `node_modules/next/dist/docs/` DEBE consultarse, según
  `AGENTS.md`.
- Las features nuevas o reestructuradas que agreguen contenido de
  proyectos/cursos/experiencia DEBERÍAN pasar por el flujo spec → plan → tasks
  (`speckit-specify`, `speckit-plan`, `speckit-tasks`) cuando el cambio no sea
  trivial (nuevo tipo de página, nuevo modelo de datos, nuevo flujo de
  contenido); las ediciones de contenido menores (corregir un typo, actualizar
  una fecha) no requieren el flujo completo.
- Todo cambio de UI no trivial DEBE verificarse manualmente en un navegador
  (viewport de escritorio y móvil) antes de considerarse completo, según el
  Principio IV.

## Gobernanza

Esta constitución reemplaza las prácticas ad-hoc previas y las restricciones
académicas que originalmente moldearon este proyecto. Las enmiendas requieren:

1. Una justificación documentada del cambio (qué problema resuelve o a qué
   objetivo profesional sirve mejor).
2. Una actualización de este archivo con el Sync Impact Report regenerado.
3. Una revisión de las plantillas dependientes (`plan-template.md`,
   `spec-template.md`, `tasks-template.md`) y de los comandos de Spec Kit
   instalados para verificar consistencia.

**Política de versionado**: Se aplica versionado semántico a esta
constitución — MAJOR para eliminaciones o redefiniciones de gobernanza o
principios incompatibles con versiones anteriores, MINOR para principios nuevos
o guías ampliadas de forma sustancial, PATCH para aclaraciones y correcciones de
redacción.

**Revisión de cumplimiento**: Todo plan de feature producido vía `speckit-plan`
DEBE pasar el gate de Constitution Check contra los principios anteriores antes
de que avance la implementación; cualquier violación debe justificarse en la
tabla de Complexity Tracking de ese plan, o el plan debe revisarse para cumplir.

**Versión**: 1.1.0 | **Ratificada**: 2026-08-07 | **Última Enmienda**: 2026-08-07
