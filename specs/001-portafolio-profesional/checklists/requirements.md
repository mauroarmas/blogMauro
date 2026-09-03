# Checklist de Calidad de Especificación: Portafolio Profesional con Perfil Dual

**Propósito**: Validar la completitud y calidad de la especificación antes de avanzar a planificación
**Creada**: 2026-08-07
**Feature**: [spec.md](../spec.md)

## Calidad del Contenido

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs)
- [x] Enfocada en valor de usuario y necesidades de negocio
- [x] Redactada para interesados no técnicos
- [x] Todas las secciones obligatorias completadas

## Completitud de Requisitos

- [x] No quedan marcadores [NEEDS CLARIFICATION] — resueltos en la ronda de clarificación
- [x] Los requisitos son testeables y no ambiguos
- [x] Los criterios de éxito son medibles
- [x] Los criterios de éxito son agnósticos de tecnología
- [x] Todos los escenarios de aceptación están definidos
- [x] Los casos límite están identificados
- [x] El alcance está claramente delimitado
- [x] Dependencias y supuestos identificados

## Preparación de la Funcionalidad

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros
- [x] Los escenarios de usuario cubren los flujos principales
- [x] La funcionalidad cumple los resultados medibles definidos en Criterios de Éxito
- [x] No se filtran detalles de implementación en la especificación

## Alineación con la Constitución (v1.1.0)

- [x] **Principio I — Señal Profesional Dual**: RF-001, RF-011, RF-013 garantizan que ambos
      perfiles tengan presencia visible; RF-007 y RF-033 eliminan el rastro académico
- [x] **Principio II — Integridad de Proyectos y Credenciales**: RF-009 y RF-010 exigen rol
      real y repositorio público por proyecto. Riesgo cerrado: los cuatro proyectos tienen repo
      público propiedad del dueño, más informe técnico. RF-010b impide anunciar medios que aún
      no existen
- [x] **Principio III — Simplicidad y Ajuste al Framework**: el alcance excluye explícitamente
      la ingesta automática desde LinkedIn; los supuestos reutilizan el motor de contenido
      existente en lugar de construir uno nuevo
- [x] **Principio IV — Rendimiento y Accesibilidad**: RF-034 a RF-036 y CE-004, CE-007, CE-010
- [x] **Principio V — Propiedad y Vigencia del Contenido**: RF-025 y CE-006 impiden traducciones
      parciales silenciosas; RF-027 y CE-009 hacen barato mantener el contenido al día

## Notas

### Clarificaciones resueltas (2026-08-07)

1. **Verificabilidad**: los cuatro proyectos tienen repositorio público del que el dueño es
   propietario. Además se cargará informe técnico por proyecto, y demostraciones grabadas más
   adelante. Resultó en RF-010, RF-010a y RF-010b.
2. **Material visual**: hay diagramas de arquitectura y capturas disponibles; las demos se
   producen después. Resultó en RF-016a y, por tratarse de sistemas en producción con datos
   reales, en RF-016b (prohibición de exponer información sensible).
3. **Hallazgo adicional**: se relevó una condición de publicación no contemplada en la primera
   redacción — nada se publica hasta que el contenido de todos los proyectos esté completo.
   Resultó en RF-028a, RF-028b, CE-011 y un caso límite nuevo.

### Limpieza aplicada

- `public/informe-tpf.pdf` eliminado del repositorio (era la presentación de la materia) junto
  con sus dos referencias en `src/app/page.js`, para no dejar enlaces rotos en el sitio actual.
  Cumple RF-033 y el Principio I de la constitución.

### Observaciones sobre el alcance

- La ingesta automática de publicaciones de LinkedIn está **fuera de alcance** por decisión
  explícita, pero RF-030 y RF-031 preservan la extensibilidad del modelo de contenido para esa
  fase posterior.
- El bilingüe ES/EN duplica el costo de mantenimiento del contenido. RF-025 mitiga el riesgo
  principal (traducción parcial silenciosa), pero la carga de traducción queda registrada como
  dependencia externa a resolver por el dueño.
