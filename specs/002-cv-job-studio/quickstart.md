# Quickstart — validación de CV Studio

**Estado:** guía de aceptación para el módulo local implementado. Las pruebas reales de Gemini requieren configuración y ejecución explícitas; la segunda etapa de conexión a portales y postulaciones no está implementada.

[Plan](plan.md) · [HTTP](contracts/studio-http.md) · [UI/CLI](contracts/studio-ui-cli.md) · [Evidencia](contracts/ai-and-evidence.md) · [Almacenamiento](contracts/storage.md)

## 1. Preparar el entorno

Desde la raíz del repositorio:

```bash
node --version
npm ci
npm run cv:install
pdfinfo -v
pdftotext -v
npm run cv:studio -- doctor
```

Resultado esperado: Node 24.16.x, Chromium disponible, Poppler mantenido por la distribución y esquema compatible. `doctor` no llama al proveedor; la ausencia de clave solo deshabilita asistencia remota. Si falta Poppler, instalar el paquete `poppler-utils` de la distribución. La base se crea en `.cv-studio/`, fuera del sitio público.

`cv:studio`, `cv:dev`, `cv:pdf`, `cv:install` y `cv:test` están disponibles; consultá el registro de validación para conocer la cobertura y los pendientes.

## 2. Validación automatizada sin consumo remoto

```bash
npm run cv:test
```

La suite ampliada debe usar bases temporales, copias temporales del corpus y un adaptador de proveedor simulado inyectado por el harness de pruebas. Debe fallar ante cualquier intento de acceso a Gemini/portales y no leer la clave real. No modifica la base cotidiana ni el contenido profesional del repositorio. Los fixtures incluyen ofertas, respuestas estructuradas correctas/incorrectas y fallos controlados; no contienen credenciales.

Resultados requeridos:

- Se conservan las regresiones del generador actual.
- Dos adaptaciones —desarrollo e infraestructura— usan fuentes reales y selección distinta, sin inventar credenciales.
- Un requisito ausente, una cita inexistente y un rol exagerado no obtienen estado revisado.
- Doble clic produce una sola versión por intento; editar una revisión antigua devuelve conflicto sin perder el texto.
- Reinicio y fallos antes/después del commit conservan resultados confirmados y no repiten llamadas inciertas.
- Se recuperan los mismos bytes de 20 versiones después de modificar fuentes, cerrar/reabrir y restaurar un backup.
- Las pruebas de límites, presupuesto, consumo incierto y privacidad cubren los contratos asociados.

Los tiempos con proveedor simulado verifican el flujo local; no demuestran la latencia o calidad de Gemini. Registrar por separado los resultados de la prueba real optativa.

## 3. Abrir el panel y trabajar sin IA

```bash
npm run cv:dev
```

Abrir `http://127.0.0.1:4317`. Verificar:

1. «Fuentes» muestra perfil, proyectos, casos, documentos y su disponibilidad. Refrescar no llama a Gemini.
2. «Preferencias» muestra junior/pasantías, Sistemas/desarrollo, remoto o presencial en Tucumán, español e inglés intermedio. La presencialidad fuera de Tucumán aparece como excluyente; ubicación desconocida pide revisión. Junior/pasantías son preferencias. Salario, jornada, híbrido y países elegibles permanecen sin definir; remoto no hereda esa restricción provincial.
3. Agregar una oferta pegando texto y otra mediante PDF legible. Incluir URL de LinkedIn o Computrabajo cuando exista. Se conserva el original sin navegar al portal.
4. Reimportar el mismo anuncio con parámetros de seguimiento reutiliza su identidad. Cambiar el texto crea revisión; una coincidencia entre portales solo sugiere relación.
5. Generar un CV general sin oferta ni clave produce una versión descargable. Cerrar y abrir el panel conserva el registro.
6. Adjuntar un PDF escaneado presenta un problema de lectura y permite pegar texto, sin inventar datos.

## 4. Configurar Gemini y probar explícitamente

Esta sección es optativa y transmite información al proveedor. El propietario configura `GEMINI_API_KEY` en el entorno del servidor mediante su mecanismo local habitual, sin incorporarla a comandos guardados, Git, capturas o conversaciones. Reiniciar el servidor para que reciba ese entorno.

En «Configuración»:

1. Elegir Gemini y un modelo disponible en la cuenta. El candidato documentado es `gemini-3.6-flash`; no sustituirlo automáticamente si no está disponible.
2. Declarar la modalidad real de la cuenta. Para pago, establecer límite mensual y por operación y verificar las tarifas. Para gratuito, confirmar compatibilidad de modelo/cuota; usar AI Studio no acredita por sí solo esa modalidad.
3. Revisar las categorías transmitidas y el tratamiento aplicable. Datos de contacto y foto se incorporan localmente al CV.
4. Pulsar «Validar conexión»: esta prueba explícita también consume/reserva según configuración. Habilitar la revisión validada.
5. Analizar una oferta y revisar la interpretación. Corregirla si corresponde; recalcular sin perder las correcciones.
6. Adaptar el CV. Abrir evidencia por bloque, contrastar roles/fechas/logros y editar. Guardar una versión; solo marcarla revisada cuando no queden afirmaciones pendientes o contradictorias.
7. Revisar consumo conocido, reservado e incierto. Deshabilitar IA debe impedir nuevas llamadas sin bloquear ofertas, versiones ni CV general.

Para SC-001, ejecutar el conjunto acordado de diez ofertas con configuración válida, medir desde inicio del análisis hasta primera propuesta y excluir revisión humana. Se requiere al menos 9/10 en menos de cinco minutos. Registrar modelo, fecha, resultado y limitaciones de cuota/red; no declarar aprobado por una simulación.

## 5. Comprobar la CLI compartida

Comandos disponibles en `cv:studio`:

```bash
npm run cv:studio -- sources refresh --wait --json
npm run cv:studio -- offer add --text-file /ruta/absoluta/oferta.txt --wait --json
npm run cv:studio -- offer analyze OPPORTUNITY_ID --wait --json
npm run cv:studio -- cv adapt --analysis ANALYSIS_ID --locale es --wait --json
npm run cv:studio -- cv render --draft DRAFT_ID --revision REVISION --wait --json
npm run cv:studio -- cv download VERSION_ID --output /ruta/absoluta/candidatura.pdf
```

Sustituir las rutas e identificadores por los archivos propios y valores devueltos en `data`/resultados de operación. `--url URL` es opcional al importar; su ausencia indica entrada manual. Análisis y adaptación requieren la configuración del paso anterior y provocan llamadas reales; render y descarga no usan IA.

Esperado: los mismos registros aparecen en el panel, con igual evidencia y estado. El comando no marca una candidatura enviada ni confirma automáticamente la revisión del CV. Con el servidor activo se utiliza esa instancia; sin él se coordina una instancia temporal exclusiva y las operaciones exigen `--wait`. Probar también un comando de operación sin servidor ni `--wait`: debe fallar con `SERVER_REQUIRED_FOR_ASYNC`, salida 3, sin encolar ni consumir IA. La instancia con `--wait` permanece hasta persistir el resultado; SIGINT conserva consumo incierto y una caída abrupta se recupera como interrupted.

## 6. Historial, seguimiento y presentación

- Guardar dos versiones para una oferta. Comparar biografía, proyectos y competencias desde el historial. Modificar una fuente en la copia de prueba y crear otra adaptación: las anteriores mantienen PDF y evidencia exactos.
- Registrar una postulación manual con fecha, canal y versión efectivamente enviada. Verificar «Envío declarado por mí». Intentar establecer confirmación externa debe rechazarse en esta etapa.
- Poblar la base de aceptación con 100 oportunidades/200 versiones desde el harness, sin IA real. Medir localizar una candidatura y descargar su documento: menos de 30 segundos. Los filtros del dashboard y sus conteos deben coincidir.
- Archivar una versión mantiene su descarga; eliminar una asociada muestra impacto y deja su identidad histórica, sin enlace de descarga ficticio.
- Recorrer todo el panel por teclado, comprobar foco/etiquetas/errores y pantallas de 1440×900 y 390×844.
- Inspeccionar PDFs ES/EN, con/sin foto y texto extenso: texto seleccionable, sin recortes, enlaces utilizables, iconos discretos y orden Contacto → Formación → Competencias → Certificaciones → Idiomas. No repetir el nombre en el encabezado principal de la segunda página. Incluir fixtures de localhost, file:, IP privada, URL autenticada y ts.net pendiente: no deben permitir reviewed hasta retirar/sustituir o verificar el acceso según el contrato. Una URL pública requiere comprobación manual registrada; cambiar URL/base la invalida. El visor privado de evidencia no se exporta como enlace del CV.

## 7. Backup y recuperación

Usar una base temporal de aceptación; nunca restaurar fixtures sobre el historial cotidiano.

```bash
npm run cv:studio -- backup export --output /ruta/absoluta/cv-studio-backup.sqlite --wait
npm run cv:studio -- backup inspect --file /ruta/absoluta/cv-studio-backup.sqlite --wait --json
```

Inspeccionar conteos, identidad y alcance. La restauración requiere confirmación explícita del conjunto que se reemplazará:

```bash
npm run cv:studio -- backup restore --file /ruta/absoluta/cv-studio-backup.sqlite --expected-dataset DATASET_ID --confirm-replace --wait
```

Esperado: 20 documentos mantienen SHA-256, relaciones y estados; no se importan claves ni se habilitan llamadas automáticamente. Un backup antiguo no devuelve consumo ya realizado: conciliar antes de reactivar IA. Archivos truncados, alterados, sobredimensionados o con esquema inesperado se rechazan sin sustituir la base activa.

Con el servidor detenido, comprobar también recuperación offline con `recover` según el contrato CLI. Simular la interrupción del reemplazo desde el harness, verificar la copia anterior y completar recuperación sin conexión a IA.

## 8. Frontera pública y aceptación final

```bash
npm run build -- --webpack
```

Comprobar que `out/` no contiene la base, ofertas, PDFs privados, claves ni rutas del panel. Se usa el modo webpack por la limitación actual del resolver de fuentes en Turbopack observada en el repositorio. El build puede regenerar `.next`; no incluir artefactos transitorios como cambios de la feature.

| Criterio | Evidencia de aceptación |
|---|---|
| SC-001 | Diez ofertas y medición real optativa, ≥9 propuestas dentro del plazo; simulación identificada por separado. |
| SC-002–003 | Revisión de fuentes y diez casos de ausencia/conflicto; cero credenciales inventadas en versiones revisadas. |
| SC-004 | Hashes de veinte documentos antes/después de cambios y reinicio. |
| SC-005–006 | Prueba de 100 oportunidades/200 versiones, tiempo de consulta y conteos independientes de generaciones. |
| SC-007 | Inspección visual y textual de todas las variantes PDF, teclado y pantallas del panel. |
| SC-008 | Restauración con hashes/relaciones iguales y exportación pública sin contenido privado. |

La entrega inicial no se acepta únicamente porque pase un test de render. Registrar resultados observados, fallos y comprobaciones aún pendientes. Búsqueda, conexión a LinkedIn/Computrabajo y envíos corresponden a una planificación posterior.
