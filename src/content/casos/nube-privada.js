// Caso de estudio: nube-privada
// Actualizado con el informe final de PPS y la documentación de CONAIISI 2026.

const caso = {
  locale: "es",
  slug: "nube-privada",
  project_slug: "nube-privada",
  title: "NAP — Una nube académica, desde el portal hasta la infraestructura",
  excerpt: "Aprobado en CONAIISI 2026. Diseñé y desarrollé la capa de software que convierte un clúster Proxmox en servicios académicos: Linux, bases de datos y aplicaciones web, con aprobación, capacidad controlada y acceso seguro.",
  read_time: 7,
  published_at: "2026-11-08T12:00:00-03:00",
  images: [
    { url: '/assets/NAP/NAP-1.png', alt: 'Vista general del clúster Proxmox VE, estado de nodos, cátedras y almacenamiento', width: 1920, height: 965 },
    { url: '/assets/NAP/NAP-2.png', alt: 'Gestión y trazabilidad del ciclo de vida de solicitudes de servicio (LXC y VMs)', width: 1920, height: 965 },
    { url: '/assets/NAP/NAP-3.png', alt: 'Observabilidad y métricas de consumo en tiempo real por servicio y contenedor', width: 1920, height: 965 },
    { url: '/assets/NAP/NAP-4.png', alt: 'Catálogo estandarizado de templates para contenedores LXC y máquinas virtuales', width: 1920, height: 965 },
  ],
  highlights: [
  {
    "value": "3",
    "label": "Modalidades: IaaS, PaaS y SaaS"
  },
  {
    "value": "900+",
    "label": "Pruebas automatizadas documentadas"
  },
  {
    "value": "≤ 3 s",
    "label": "p95 de las vistas en el ensayo de laboratorio"
  }
],
  documents: [
  {
    "title": "Aprobado en CONAIISI 2026",
    "description": "El trabajo del equipo: problema institucional, arquitectura de la nube y enfoque de aprendizaje activo.",
    "url": "/assets/NAP/Nube%20Acad%C3%A9mica%20Pr%C3%A1ctica%20%28NAP%29%20-%20Prototipo%20de%20Nube%20Privada%20para%20el%20Aprendizaje%20Activo%20en%20la%20UTN-FRT.pdf",
    "preview": "/assets/NAP/nap-articulo-portada.webp",
    "previewWidth": 510,
    "previewHeight": 720,
    "pages": "6"
  },
  {
    "title": "Presentación para el congreso",
    "description": "Una síntesis visual del proyecto, su topología, el flujo de autoservicio y las líneas de evolución.",
    "url": "/assets/NAP/slides%20conaiisi.pdf",
    "preview": "/assets/NAP/nap-presentacion-portada.webp",
    "previewWidth": 720,
    "previewHeight": 405,
    "pages": "9"
  },
  {
    "title": "Informe final de práctica supervisada",
    "description": "Mi aporte en software: diseño, implementación, decisiones técnicas, pruebas y alcance de la validación.",
    "url": "/assets/NAP/PPS%20NAP%20%E2%80%94%20Informe%20Final%20_%20Versi%C3%B3n%20equilibrada%20%E2%80%94%20Mauro%20Armas.pdf",
    "preview": "/assets/NAP/nap-informe-portada.webp",
    "previewWidth": 510,
    "previewHeight": 720,
    "pages": "28"
  }
],
  body: "## Un proyecto aceptado en CONAIISI 2026\n\n**Nube Académica Práctica (NAP)** es un trabajo estudiantil aceptado en el [**14.º Congreso Nacional de Ingeniería Informática / Sistemas de Información — CONAIISI 2026**](https://conaiisi2026.frre.utn.edu.ar/). Lo desarrollamos **Mauro Armas, Fabrizio Medina e Iván Ochoa**, en el marco de las prácticas supervisadas de la UTN Facultad Regional Tucumán.\n\nEl proyecto combina infraestructura de virtualización, almacenamiento y software de autoservicio. Mi responsabilidad fue **diseñar, desarrollar y validar el portal y el motor de orquestación**, desde la interfaz hasta la integración con Proxmox. Las otras dos responsabilidades del equipo fueron el clúster y la red, y el almacenamiento compartido.\n\nEl artículo y la presentación describen la propuesta integral del equipo. El informe final de PPS documenta mi aporte individual en ingeniería de software: **200 horas, del 14 de septiembre al 3 de noviembre de 2026**.\n\n## El problema: infraestructura disponible, acceso fragmentado\n\nUna cátedra necesita Linux para una práctica de Sistemas Operativos; otra, una base de datos; otra, una aplicación web. Resolver cada laboratorio por separado multiplica instalaciones, incompatibilidades y tareas manuales de soporte. Además, el equipamiento personal del estudiante condiciona qué puede ejecutar.\n\nLa propuesta de NAP es convertir los recursos institucionales en entornos de práctica accesibles y comparables. El docente solicita **qué necesita, para qué cátedra y durante qué período**. Administración evalúa la solicitud y el software traduce esa decisión en infraestructura. Los conceptos de nodos, contenedores, almacenamiento y redes quedan en la capa que los administra.\n\nEl trabajo se enmarca en **Design Science Research**: relevar una necesidad real, diseñar un artefacto, construirlo y evaluarlo. El propósito académico guía las decisiones de producto y de infraestructura.\n\n## Un catálogo, tres formas de usar la nube\n\n| Modalidad | Qué recibe la cátedra | Acceso |\n| --- | --- | --- |\n| **IaaS** | Un entorno Linux Ubuntu o Debian sobre LXC. | Consola y SSH mediante clave pública. |\n| **PaaS** | Una instancia de MariaDB con base de datos y usuario propios. | Conexión cifrada con TLS. |\n| **SaaS** | Una aplicación web, como Draw.io. | Acceso HTTPS vinculado a la sesión del portal. |\n\nLas aplicaciones utilizan imágenes OCI y Docker dentro de entornos Linux aislados. El catálogo permite reutilizar ofertas sin reservar capacidad por adelantado: **publicar una opción no crea una instancia**. Los recursos se comprometen cuando se aprueba un pedido concreto.\n\nEl recorrido completo comprende solicitud, revisión, aprobación o rechazo, despliegue inmediato o programado, acceso, seguimiento, renovación y baja. El responsable de cátedra administra sus servicios; el administrador mantiene el catálogo, evalúa capacidad y supervisa el conjunto.\n\n## Arquitectura: separar la decisión de su ejecución\n\nEl portal está construido con **React y Vite**, la API con **Python y FastAPI**, y la persistencia con **PostgreSQL**. Un worker procesa operaciones de infraestructura desde una cola persistente respaldada por la misma base de datos.\n\n```text\nDocente / Administración\n          │\n     Portal React\n          │\n     API FastAPI ─────► PostgreSQL\n          │             pedidos · reservas · operaciones · historial\n          ▼\n  Worker de orquestación\n          │\n   ┌──────┴────────────┐\n   ▼                   ▼\nAPI de Proxmox    Ejecutor de nodo acotado\n   │                   │\n   └──────┬────────────┘\n          ▼\n  LXC · Docker · servicios\n          │\n   Acceso SSH / TLS / HTTPS\n\nEntorno de integración: clúster Proxmox · TrueNAS · redes aisladas\n```\n\nEl navegador no recibe credenciales del hipervisor. La API controla permisos y reglas académicas; Proxmox administra la virtualización; un ejecutor separado realiza acciones previstas dentro del nodo. Esa separación limita las responsabilidades y evita convertir el portal en una terminal privilegiada.\n\nLas tareas prolongadas no bloquean la atención web. Una aprobación confirma que el pedido fue admitido; el despliegue termina cuando el sistema comprueba el resultado real.\n\n## La decisión difícil: cuándo hay capacidad disponible\n\nLa capacidad no se reduce a sumar lo que aparece libre en un panel. El sistema debe considerar lo que ya está ocupado, incluso fuera de NAP, y lo que ya prometió a otros pedidos.\n\n### Reservar antes de desplegar\n\nUna aprobación reserva CPU, memoria y disco en el destino elegido. Los controles transaccionales evitan que dos aprobaciones concurrentes consuman el mismo saldo. Un pedido con inicio futuro conserva su reserva hasta el momento autorizado.\n\nLa política evolucionó desde cuotas anticipadas por cátedra hacia una **evaluación de capacidad por solicitud**. Así, la decisión se toma con el pedido y el inventario real a la vista, sin inmovilizar recursos que una asignatura quizá no utilice.\n\n### El almacenamiento compartido se cuenta una sola vez\n\nSi el mismo almacenamiento TrueNAS está montado en varios nodos, sigue siendo una única capacidad. Sumar cada montaje multiplicaría artificialmente el espacio disponible.\n\nAdemás, detener un servicio no equivale a eliminarlo: CPU y memoria pueden liberarse tras verificar la detención, pero el disco sigue ocupado porque conserva los datos. La liberación completa requiere comprobar la baja efectiva.\n\n### Una respuesta incierta no autoriza a repetir a ciegas\n\nLas operaciones de Proxmox son asíncronas. Un identificador de tarea no demuestra que el contenedor ya exista ni que la aplicación esté lista. El orquestador observa el resultado y reconcilia su inventario con la infraestructura antes de repetir o cerrar una acción.\n\nEsto permite reparar un despliegue fallido sin duplicar indiscriminadamente recursos y conservar las reservas mientras no se haya confirmado qué ocurrió.\n\n## Seguridad y observabilidad como parte del servicio\n\nEl aislamiento se aplica en dos planos: **permisos en el servidor y separación de red**. Ocultar un botón no impide que una cátedra consulte un recurso ajeno; el backend también debe rechazar esa solicitud. De forma complementaria, los entornos no deben alcanzar servicios de otras asignaturas ni redes administrativas.\n\nEl acceso se adapta a cada modalidad: claves SSH para Linux, credenciales particulares y TLS para MariaDB, y sesiones revocables para aplicaciones web. Las acciones relevantes conservan autor, resultado e historial.\n\nLa supervisión integra estado de los servicios, consumo, métricas históricas y notificaciones. También diferencia tres situaciones que una interfaz podría confundir: **pedido aprobado, contenedor encendido y aplicación disponible**.\n\n## Resultados documentados\n\nEl informe final registra **más de 900 pruebas automatizadas** entre backend, frontend, operaciones de infraestructura y recorridos de usuario. Se cubrieron aprobaciones simultáneas, reintentos, accesos cruzados, credenciales incorrectas y cambios del ciclo de vida. La concurrencia también se verificó con PostgreSQL real.\n\n### Rendimiento con historial de métricas\n\nEl ensayo documentado utilizó **100 servicios de prueba, 12,96 millones de observaciones históricas y 10 sesiones autenticadas concurrentes**. El objetivo fue que el 95% de las mediciones de cada vista quedara dentro de tres segundos.\n\n| Vista | p95 medido | Objetivo |\n| --- | --- | --- |\n| Pedidos | **1,57 s** | ≤ 3 s |\n| Servicios | **2,75 s** | ≤ 3 s |\n| Métricas | **2,47 s** | ≤ 3 s |\n\nSon resultados de un ensayo reproducible de laboratorio con datos sintéticos y transportes de infraestructura simulados; miden el portal en esas condiciones. Las pruebas reales con Proxmox se documentan por separado.\n\n### Integración sobre infraestructura real\n\nEn laboratorio se verificaron el ciclo de vida de Linux, acceso SSH, aplicaciones con HTTPS y MariaDB con TLS y persistencia tras detener e iniciar el servicio. Un entorno de **dos nodos con TrueNAS compartido** permitió comprobar restricciones entre cátedras, aislamiento de red, reparación y recuperación de reglas tras reiniciar un nodo.\n\nTambién se documentó conexión y aprovisionamiento básico sobre el clúster físico de la facultad. Esta evidencia acredita integración entre las capas; la validación avanzada sobre los cuatro nodos definitivos corresponde a la puesta en servicio.\n\nLos detalles, condiciones y límites de estas mediciones están en el **informe final**, disponible en la documentación de esta página.\n\n## Estado actual\n\n**El trabajo de software y la PPS están completados; el despliegue institucional sigue pendiente.** NAP cuenta con validación funcional y de integración en laboratorio. Todavía no hay una demo pública ni una operación institucional desplegada.\n\nLa siguiente etapa requiere completar certificados y accesos, repetir las pruebas avanzadas sobre el clúster definitivo y realizar la aceptación con docentes. La aceptación del artículo en CONAIISI es un hito académico del proyecto; la aceptación operativa del servicio es una etapa distinta.\n\n## Lo que me dejó el proyecto\n\n**Una nube empieza por sus reglas de asignación.** El aprovisionamiento sólo es fiable si aprobación, reserva, identidad del recurso y estado real siguen siendo coherentes ante concurrencia y fallos.\n\n**Un servicio se valida desde quien lo usa.** Un contenedor encendido no demuestra que una base de datos acepte conexiones ni que una aplicación responda por HTTPS. Cada modalidad necesita su propia comprobación.\n\n**La evidencia necesita contexto.** Diferenciar pruebas automatizadas, mediciones con transportes simulados, laboratorio real y aceptación institucional permite explicar con precisión qué está conseguido y qué falta para ponerlo en servicio.\n",
};

export default caso;
