# Evaluación real de Gemini

Estado: **pendiente**. Ninguna prueba simulada demuestra calidad, disponibilidad ni latencia del proveedor real (SC-001–SC-003).

La ejecución optativa `generador/test/live-evaluation.mjs` requiere una clave en el entorno, modelo y consentimiento configurados y límites suficientes en CV Studio, además de `CV_STUDIO_LIVE_EVAL=1` y un archivo JSON con diez rutas locales a ofertas de texto. Guarda ofertas, análisis y borradores privados y puede consumir cuota. El resultado registra identificadores y tiempos; el propietario debe contrastar cada propuesta y sus afirmaciones con la evidencia antes de decidir si la calidad cumple el criterio. Nunca ejecutar automáticamente en la suite.
