import Database from 'better-sqlite3';

const db = new Database('local_blog.db');
db.pragma('journal_mode = WAL');

// Crear la tabla si no existe (Equivalente al esquema PostgreSQL pero en SQLite)
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT NOT NULL UNIQUE,
    title        TEXT NOT NULL,
    excerpt      TEXT,
    content      TEXT,
    tag          TEXT,
    status       TEXT NOT NULL DEFAULT 'draft',
    read_time    INTEGER,
    published_at TEXT,
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insertar un post inicial si la tabla está vacía
const count = db.prepare('SELECT COUNT(*) as count FROM posts').get();
if (count.count === 0) {
  db.prepare(`
    INSERT INTO posts (slug, title, excerpt, content, tag, status, read_time, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    'bienvenidos', 
    'Bienvenidos a mi Blog', 
    'Este es el primer post usando la nueva arquitectura.', 
    'El contenido detallado va aquí. Soporta **Markdown** y bloques de código.\n\n```js\nconsole.log("Hola Mundo");\n```', 
    'Desarrollo', 
    'published', 
    2
  );
}

// Wrapper para imitar la interfaz de "pg" (PostgreSQL) que usan nuestros endpoints
export async function query(text, params = []) {
  // Convertir placeholders de Postgres ($1, $2) a SQLite (?)
  const sqliteText = text.replace(/\$\d+/g, '?');
  
  const stmt = db.prepare(sqliteText);
  
  if (sqliteText.trim().toUpperCase().startsWith('SELECT')) {
    const rows = stmt.all(...params);
    return { rows };
  } else if (sqliteText.trim().toUpperCase().startsWith('INSERT') && sqliteText.includes('RETURNING *')) {
    const cleanText = sqliteText.replace(/RETURNING \*/i, '');
    const info = db.prepare(cleanText).run(...params);
    const rows = db.prepare('SELECT * FROM posts WHERE id = ?').all(info.lastInsertRowid);
    return { rows };
  } else if (sqliteText.trim().toUpperCase().startsWith('UPDATE') && sqliteText.includes('RETURNING *')) {
    const cleanText = sqliteText.replace(/RETURNING \*/i, '');
    db.prepare(cleanText).run(...params);
    // Recuperar el id que fue pasado como último parámetro
    const id = params[params.length - 1];
    const rows = db.prepare('SELECT * FROM posts WHERE id = ?').all(id);
    return { rows };
  } else {
    const info = stmt.run(...params);
    return { rowCount: info.changes };
  }
}
