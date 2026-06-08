-- Crear la tabla para el blog adaptada a PostgreSQL
CREATE TABLE IF NOT EXISTS posts (
  id           SERIAL PRIMARY KEY,
  slug         VARCHAR(255) NOT NULL UNIQUE,
  title        VARCHAR(255) NOT NULL,
  excerpt      TEXT,
  content      TEXT,
  tag          VARCHAR(100),
  status       VARCHAR(50) NOT NULL DEFAULT 'draft',
  read_time    INTEGER,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Opcional: Insertar un post inicial para testear
INSERT INTO posts (slug, title, excerpt, content, tag, status, read_time, published_at) 
VALUES (
  'bienvenidos-a-mi-blog', 
  'Bienvenidos a mi Blog', 
  'Este es el primer post usando la nueva arquitectura de diseño premium.', 
  'El contenido detallado va aquí. Soporta **Markdown** y bloques de código.', 
  'Desarrollo', 
  'published', 
  2, 
  CURRENT_TIMESTAMP
) ON CONFLICT (slug) DO NOTHING;
