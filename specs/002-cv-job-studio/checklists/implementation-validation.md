# Validación de implementación de CV Studio

## Punto de partida — T001

- Commit de partida: `0fb2492` en `dev`; árbol limpio tras el commit solicitado.
- Node 24.16.0, npm 11.13.0 y Poppler 24.02.0 disponibles.
- `npm run cv:test`: 6 pruebas existentes aprobadas antes de implementar.
- Se consultó la guía local de exportación estática de Next.js.
- `npm run build -- --webpack` es la validación prevista por el plan; el resolver de fuentes de Turbopack presentó problemas anteriormente. No se ejecutó build de nuevo en esta etapa.
- PowerShell no está instalado; las comprobaciones de Spec Kit utilizaron el script Bash equivalente.

Los resultados y criterios de aceptación de la ampliación se agregarán al completar cada fase. Ninguna prueba de esta línea de base valida todavía la nueva funcionalidad.

- T002: Node fijado a 24.16.0 en `.nvmrc`; `@google/genai` 3.0.0 y Zod 4.6.7 fijados. Chromium funciona en las pruebas existentes. La instalación informó vulnerabilidades en el árbol npm; se evaluarán sin aplicar actualizaciones incompatibles automáticamente.

- T013: el conjunto existente pasó 6/6 después del cambio y la repetición dirigida A4/servidor pasó 2/2. Una ejecución anterior informó desbordamiento A4 en dos renders; el fallo fue intermitente y debe investigarse durante T060, no se considera definitivamente resuelto.

## Infraestructura inicial — T002–T014

- Dependencias y aislamiento preparados; 26 tablas migradas en una base temporal con WAL, claves foráneas y permisos restrictivos.
- Se probaron integridad de artefactos, captura estable de 11 fuentes actuales, reglas de preferencias, cola/idempotencia y protección HTTP.
- `npm run cv:test`: 6/6 tras la integración. La advertencia por desbordamiento intermitente permanece pendiente de T060.
- Estas comprobaciones aún no validan las historias de adaptación, versiones o dashboard.

## Flujo inicial — T015–T031

- La suite completa `npm run cv:test` pasó 22/22 con proveedores simulados y datos temporales.
- Prueba de navegador: configurar modalidad gratuita simulada, incorporar oferta, analizar evidencia, adaptar y guardar PDF.
- No se llamó al proveedor real; SC-001 y cualquier evaluación de calidad/tiempo real siguen pendientes hasta configurar la cuenta y ejecutar la prueba explícita.

## Historial y respaldo — T032–T042

- `node --test generador/test/storage.test.mjs generador/test/studio.test.mjs`: 12/12.
- Veinte PDFs con hashes distintos se conservan tras restaurar; se verificaron archivado, eliminación con asociaciones, idempotencia, render concurrente y recuperación offline.
- Se rechazaron copia truncada, vista inesperada y BLOB alterado. La restauración mantiene gasto conocido y bloquea IA hasta conciliarlo.
- El panel creó, descargó, inspeccionó y restauró una copia en un directorio temporal.

## Dashboard y seguimiento — T043–T050

- Tres pruebas de candidaturas: rechazo de confirmación externa, envío declarado con fecha y documento, filtros/conteos y requisito de versión revisada para estado lista.
- Prueba de navegador: crear oferta, corregir campos, registrar envío manual y filtrar el dashboard; 1 oportunidad y 1 candidatura.
- No se implementaron conexiones ni envíos a portales.

## Fuentes y preferencias — avance de US4

- Las aportaciones privadas exigen confirmación y conservan su clasificación; un interés no acredita experiencia. Un borrador debe capturar una nueva revisión antes de citar evidencia agregada y las confirmaciones humanas permanecen pendientes.
- Tres pruebas unitarias verificaron snapshots históricos, conflicto semántico y edición concurrente de preferencias. El navegador recorrió fuentes y preferencias en 390 × 844.
- Permanecen casos adicionales de fuentes y criterios de accesibilidad y aceptación pendientes en `tasks.md`; no se declaran aprobados por estas pruebas parciales.

## Exportación y evaluación opcional

- `npm run build -- --webpack` terminó correctamente y la prueba de frontera pública inspeccionó `out/` sin encontrar base, rutas privadas ni referencias a la clave.
- Se revisó visualmente el CV general en español sin foto. Las demás combinaciones visuales y un perfil largo también se revisaron; el desbordamiento intermitente previo sigue bajo observación según `pdf-validation.md`.
- La evaluación real de diez ofertas no se ejecutó. `live-evaluation.md` distingue el objetivo técnico del contraste humano de las afirmaciones.
- `npm audit --omit=dev` informó 6 vulnerabilidades de producción (1 moderada, 4 altas, 1 crítica) en el árbol existente, entre ellas Next.js. Su aplicabilidad al despliegue estático requiere revisión y actualización por separado.

- Se probaron documentos ausentes, imports relativos y rechazo de symlink que apunta fuera del catálogo. El selector de evidencia permite volver al bloque de procedencia en el editor.
- La prueba local con 100 oportunidades, 200 versiones y 10 candidaturas encontró una oferta y descargó su PDF dentro de los 30 segundos; los conteos distinguieron candidaturas de versiones. La restauración separada conservó hashes de 20 documentos. Falta una medición equivalente completa de interacción humana (SC-005).
- El diagnóstico CLI sin clave, el rechazo de operación asíncrona sin servidor y la operación temporal con `--wait` pasaron en una base aislada; se verificaron también instancia activa, SIGINT y caída abrupta, descarga idéntica de versión general y recuperación offline con identidad validada.
- La captura de fuentes en 1440 × 900 y 390 × 844 mantuvo el ancho y el foco básico; no sustituye la auditoría integral de accesibilidad (SC-007).

## Criterios consolidados

| Criterio | Estado observado |
|---|---|
| SC-001 | Pendiente de diez ofertas reales y proveedor configurado; fixtures no validan latencia remota. |
| SC-002–003 | Cobertura simulada de brechas y conflictos; pendiente contrastar calidad con proveedor real y revisión humana. |
| SC-004 | Veinte archivos con hashes distintos conservados tras copia/restauración en pruebas aisladas. |
| SC-005 | Consulta y descarga automatizadas en navegador con 100 ofertas/200 versiones por debajo de 30 segundos; pendiente medición con una persona. |
| SC-006 | Pruebas de conteos con 100 ofertas, 200 versiones y 10 candidaturas aprobadas. |
| SC-007 | Revisiones visuales ES/EN con y sin foto, perfil largo y pruebas automáticas de paginación; pendiente auditoría integral de accesibilidad del panel. |
| SC-008 | Restauración de veinte hashes/relaciones, rechazo de copias alteradas y frontera pública verificados con fixtures. |

Una clave canaria no apareció en PDF, HTML ni backup; el período de presupuesto cambió a medianoche de Tucumán. La salida de diagnóstico tampoco expuso la clave canaria; se verificaron la cola y la cancelación de una llamada con consumo incierto.

- La guía se recorrió con una base aislada: `doctor`, refresco de fuentes, exportación e inspección de copia finalizaron correctamente sin clave ni proveedor. Las secciones dependientes de conexión real siguen pendientes según su condición explícita.

- En el fixture de volumen se restauraron 20 documentos, se verificaron relaciones de candidaturas, se rechazó recuperación offline con identidad errónea y el navegador filtró y descargó dentro de 30 segundos.
- Tras un reinicio inesperado, las reservas activas pasan a consumo incierto conciliable; la CLI superó pruebas de instancia activa, segundo plano y caída abrupta en bases aisladas.

- La suite completa pasó 55 pruebas antes del último ajuste de preservación de formularios; el recorrido dirigido posterior verificó que el texto sin guardar se conserva al navegar.

## Comprobación final

- `npm run cv:test`: 56/56; luego pasaron también las pruebas dirigidas del panel y accesibilidad con la comprobación adicional de contraste.
- `npm run lint`: correcto. `npm run build -- --webpack`: correcto; la frontera pública se verificó después de exportar.
- La evaluación de Gemini con diez ofertas reales y una auditoría con lectores de pantalla siguen pendientes; ver `live-evaluation.md` y `ui-validation.md`.
- Las modificaciones de implementación permanecen sin commit; el commit inicial solicitado es `0fb2492`.
