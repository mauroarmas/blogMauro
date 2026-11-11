# Implementation Plan: CV Studio — Adaptación de CV y seguimiento laboral

**Branch**: `dev` (rama Git real) | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Feature context**: `002-cv-job-studio`; el setup usa este identificador en su campo BRANCH como fallback. No se crea ni cambia una rama.

**Input**: Feature specification from `specs/002-cv-job-studio/spec.md`.

## Summary

Ampliar el CV Studio local con oportunidades adjuntas de LinkedIn, Computrabajo u otras fuentes; análisis de ajuste con evidencia del proyecto; adaptación asistida desde el panel; versiones inmutables y seguimiento manual. El usuario confirmó que búsqueda y envío conectados son una segunda etapa y que cada envío futuro requerirá revisión individual.

Se reutilizan el servidor local y la composición PDF existentes. SQLite privado mantiene registros y artefactos exactos; un proceso de captura congela contenido profesional y documentos; recuperación local selecciona evidencia por requisito; Gemini devuelve propuestas estructuradas validadas y revisables. El dashboard reúne oportunidades, editor, historial, preferencias y estado de fuentes. La clave queda en el servidor y el consumo se habilita solo después de configurar modelo, modalidad, límite y categorías de datos transmitidos.

El flujo se limita a FR-001–FR-025 y SC-001–SC-008. Los contratos reservan identidad de fuente y separación entre versión/candidatura, pero no implementan conectores, autenticación en portales ni envíos de la segunda etapa.

## Technical Context

**Language/Version**: JavaScript ESM; Node 24.16.x como runtime probado. La web existente continúa en Next.js 16.2.7 y React 19.2.4, sin cambiar sus rutas para esta feature.

**Primary Dependencies**: HTTP/crypto/fs/SQLite nativos de Node; Playwright 1.65.0 y Fontsource ya instalados; Poppler mantenido por la distribución (24.02.0 observado); incorporar SDK oficial `@google/genai` 3.0.0 y Zod 4.6.7, fijados por lockfile. Validar compatibilidad en instalación; no modificar silenciosamente versiones durante una generación.

**Storage**: `.cv-studio/studio.sqlite` privado; metadatos relacionales, revisiones y artefactos BLOB con SHA-256. SQLite con WAL, claves foráneas, migraciones y backup coherente. Configuración secreta en `GEMINI_API_KEY` del proceso, fuera de DB/exportaciones.

**Testing**: `node:test` y Playwright existentes; fixtures deterministas de proveedor para aceptación repetible; prueba real optativa con clave y configuración expresas; Poppler para inspección de PDFs. Contratos, estados, idempotencia, recuperación, privacidad y referencias de evidencia se validan por comportamiento.

**Target Platform**: Linux local del propietario, servidor en `127.0.0.1:4317`, navegador de escritorio/móvil para pruebas de layout. La primera etapa no publica el dashboard ni permite acceso remoto.

**Project Type**: herramienta web local con CLI, compartiendo servicios de aplicación; sitio público estático independiente.

**Performance Goals**: primera propuesta en <5 minutos para ≥9/10 ofertas de aceptación; localizar y descargar una candidatura en <30 segundos con 100 oportunidades/200 versiones. Operaciones de generación persistentes con progreso, sin bloquear la navegación del dashboard.

**Constraints**: una operación pesada activa; límites explícitos de adjuntos/contexto/tiempos; llamadas IA sin herramientas y sin navegación; no inventar credenciales; snapshots completos; ningún dato privado en la exportación pública. No hay garantía semántica automática por usar JSON Schema o citas: el estado revisado requiere evaluación del propietario.

**Scale/Scope**: un propietario; corpus observado de cuatro módulos, cinco casos y cuatro PDFs profesionales; datos de aceptación de 100 oportunidades y 200 CV. Retención hasta borrado deliberado, exportación/restauración y continuidad de generación general.

## Constitution Check

*GATE: revisado antes de la investigación y nuevamente al cerrar el diseño.*

| Principio/restricción | Aplicación | Resultado previo / posterior |
|---|---|---|
| I. Señal profesional dual | La base conserva desarrollo e infraestructura; cada oferta puede priorizar contenido pertinente sin reemplazar el perfil general. | Cumple / cumple |
| II. Integridad de credenciales | Evidencia por afirmación, campos protegidos, conflictos explícitos y revisión humana. No inferir dominio, años ni rol a partir del anuncio. | Cumple / cumple |
| III. Simplicidad | Extender el módulo que ya funciona, sin vector DB, Redis, agentes autónomos ni segundo framework de interfaz. Guía local de exportación estática leída. | Cumple con ámbito local autorizado en constitución 2.0.0 / cumple |
| IV. Rendimiento y accesibilidad | HTML semántico, teclado, foco, estados anunciados, formularios etiquetados, pruebas móvil/escritorio y PDF sin recortes. | Gate de implementación definido / cubierto por quickstart |
| V. Propiedad y vigencia | Ediciones fuente prevalecen para nuevas operaciones; adaptaciones no cambian el portafolio silenciosamente. | Cumple / cumple |
| Fuente histórica de verdad | Instrucción expresa D-004 convierte el proyecto en fuente; la constitución permite que el propietario indique otra referencia. | Cumple por instrucción vigente / cumple |
| Persistencia local | SQLite cotidiano permitido expresamente para CV Studio monousuario por constitución 2.0.0; transacciones, historial y recuperación obligatorios. | Cumple / cumple |
| Stack/UI del sitio | Node/HTML/CSS permitido para el módulo local por constitución 2.0.0; la web Next estática conserva su stack. | Cumple / cumple |
| Secretos y datos privados | Clave solo servidor; datos fuera de public/out/Git; Host/Origin/token en todas las mutaciones. | Cumple / cumple |

**Resultado:** PASS contra constitución 2.0.0, enmendada explícitamente antes de repetir la auditoría. El diseño cumple el ámbito local autorizado; no se usa Complexity Tracking para dispensar una prohibición vigente.

## Project Structure

### Documentation (this feature)

```text
specs/002-cv-job-studio/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── contracts/
    ├── studio-http.md
    ├── studio-ui-cli.md
    ├── ai-and-evidence.md
    └── storage.md
```

`tasks.md` se generará en la fase siguiente con `/speckit-tasks`; no forma parte de esta ejecución.

### Source Code (repository root)

Estructura propuesta para implementar; los módulos nuevos aún no existen:

```text
generador/
├── server.mjs                 # HTTP loopback y recursos permitidos
├── cli.mjs                    # Compatibilidad de cv:pdf
├── studio-cli.mjs             # Órdenes del mismo flujo persistente
├── assets/
│   ├── studio.html / .css / .js
│   ├── views/                 # Ofertas, editor, versiones, fuentes y ajustes
│   └── cv.css / paginate.js   # Composición impresa actual
├── lib/
│   ├── content.mjs / template.mjs / icons.mjs / pdf.mjs
│   ├── app.mjs                # Servicios usados por HTTP y CLI
│   ├── schemas.mjs            # Validación común, enums y límites
│   ├── db.mjs / migrations/   # Persistencia local y migraciones
│   ├── sources.mjs            # Corpus permitido, revisiones y manifiestos
│   ├── ingest-worker.mjs      # Evaluación de copia de módulos confiables
│   ├── documents.mjs          # TXT/PDF mediante Poppler
│   ├── evidence.mjs           # Fragmentos, alias y recuperación
│   ├── matching.mjs           # Razones y nivel de ajuste reproducible
│   ├── links.mjs             # Clasificación local y comprobación de enlaces
│   ├── adaptation.mjs        # Propuestas, claims, revisión y modelo final
│   ├── operations.mjs        # Cola local, idempotencia y recuperación
│   ├── versions.mjs           # Guardado y descarga exacta
│   ├── opportunities.mjs      # Origen, revisiones y duplicados
│   ├── applications.mjs       # Seguimiento manual y eventos
│   ├── backup.mjs             # Exportación/restauración validada
│   └── providers/
│       ├── registry.mjs / budget.mjs
│       └── gemini.mjs
└── test/
    ├── cv.test.mjs            # Regresiones existentes
    ├── fixtures/              # Ofertas/evidencia y respuestas controladas
    ├── contracts.test.mjs
    ├── workflow.test.mjs
    ├── storage.test.mjs
    └── studio.test.mjs
.cv-studio/                    # Estado privado ignorado; no fuente indiscriminada
src/content/                   # Fuente profesional pública existente
src/styles/tokens.css          # Paleta compartida existente
output/pdf/                    # Copias exportadas de conveniencia
```

**Structure Decision:** mantener la frontera que ya separa CV Studio de la web. Módulos de servicios concretos sin capas de repositorio genéricas; toda entrada valida el mismo contrato. `pdf.mjs` incorpora render desde un modelo/presentación congelados, mientras el wrapper de CV general conserva su uso actual y añade registro de versión.

## Design Workflow

1. **Incorporar:** guardar texto/adjunto y origen (`linkedin`, `computrabajo`, `manual`, `other`); deduplicar identidad exacta sin navegar al portal.
2. **Congelar:** capturar revisión de oferta, preferencias y corpus autorizado con fuentes legibles/ausentes, hashes y artefactos de presentación.
3. **Analizar:** extraer campos/requisitos; recuperar evidencia; determinar coincidencias, brechas y conflictos; calcular nivel de ajuste explicado.
4. **Adaptar:** proponer bloques de texto y selección por IDs; validar campos protegidos y referencias; mostrar cambios y evidencia.
5. **Revisar:** editar con concurrencia optimista, invalidar revisión de bloques modificados y resolver afirmaciones nuevas/conflictivas; clasificar enlaces sin red y exigir comprobaciones de destinatario según el contrato UI/CLI.
6. **Versionar:** generar fuera de transacción y guardar PDF/HTML/modelo/manifest/evento de manera atómica. Descargar devuelve esos bytes.
7. **Seguir:** registrar manualmente fecha, canal, versión enviada, notas y evolución; contar candidaturas, no documentos.
8. **Respaldar:** exportar/validar/restaurar una copia coherente con recuperación ante fallo y sin credenciales.

Los contratos describen formatos, errores, estados y límites. La implementación no debe ampliar este flujo a búsqueda/envío sin la planificación de la segunda etapa.

## Validation Strategy

- Mantener las seis pruebas existentes de generación, contenido actualizado, opciones, HTML seguro, límites A4 y flujo del panel, adaptando su contrato cuando la exportación pase a persistir versiones.
- Agregar pruebas de valor: snapshots sobreviven cambios/borrados de fuentes; descarga devuelve bytes exactos; referencia falsa o conflicto no consigue estado revisado; rollback no deja CV disponible incompleto; idempotencia no duplica; revisión obsoleta devuelve conflicto.
- Fixtures de LinkedIn/Computrabajo, incluidos mismo anuncio con tracking, actualización de contenido y coincidencia entre portales; no usar navegación real en aceptación automatizada.
- Cubrir PDF ilegible, exceso de tamaño, prompt injection, claves en errores, presupuesto agotado, timeout/resultado incierto y reinicio. Comprobar que un flujo con IA simulada nunca envía datos externos.
- Backup/restauración: 20 versiones y fuentes, alteración deliberada del archivo, restauración válida e igualdad de hashes/relaciones. Aceptación ampliada con 100 oportunidades/200 versiones.
- Revisión manual del panel con teclado y tamaños 1440×900 y 390×844, más inspección visual de PDFs ES/EN, con/sin foto y texto extenso.
- Validar producción estática con `npm run build -- --webpack` y comprobar ausencia de `.cv-studio`, ofertas o rutas privadas en `out/`.
- Una prueba Gemini real es optativa y explícita, con modelo, clave, límite y tratamiento de datos configurados; no forma parte de tests que se ejecutan por defecto.

## Complexity Tracking

No hay violaciones constitucionales vigentes que justificar. La elección de SQLite y
Node/HTML/CSS corresponde a la excepción explícita para CV Studio local de la
constitución 2.0.0; se debe revisar antes de cualquier acceso remoto o multiusuario.

## Planning Completion

Investigación y contratos revisados contra la especificación. La primera etapa queda lista para descomponerse en tareas. No se instalaron dependencias, no se hicieron llamadas de IA ni se conectaron cuentas durante el plan. PowerShell no está instalado; se utilizó el setup Bash equivalente con rutas correctas. No hay hooks configurados antes/después de plan. Remediación posterior autorizada: constitución 2.0.0, CLI temporal con --wait obligatorio, presencialidad en Tucumán como required condicional y política de enlaces con comprobaciones registradas; revisar nuevamente antes de implementar.
