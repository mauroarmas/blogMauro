-- Contenido Editorial del portafolio profesional (data-model.md §1).
-- Reemplaza a la tabla `posts` del blog académico original: type/locale distinguen
-- casos de estudio de proyecto de artículos futuros (RF-030), project_slug vincula al
-- proyecto que documenta (referencia lógica a src/content/proyectos.js, sin FK real
-- porque ese archivo no vive en la base de datos), y source/source_ref dejan lugar a
-- una futura ingesta automática (fuera de alcance de esta feature, ver RF-031).
CREATE TABLE IF NOT EXISTS content (
  id           SERIAL PRIMARY KEY,
  type         VARCHAR(20)  NOT NULL DEFAULT 'caso_estudio',
  locale       VARCHAR(5)   NOT NULL DEFAULT 'es',
  slug         VARCHAR(255) NOT NULL,
  project_slug VARCHAR(255),
  title        VARCHAR(255) NOT NULL,
  excerpt      TEXT,
  body         TEXT,
  images       TEXT,
  status       VARCHAR(20)  NOT NULL DEFAULT 'draft',
  source       VARCHAR(20)  NOT NULL DEFAULT 'site',
  source_ref   VARCHAR(255),
  read_time    INTEGER,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (slug, locale)
);
