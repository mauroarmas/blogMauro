let pool;
let sqliteDb;

if (process.env.DATABASE_URL) {
  // MODO PRODUCCIÓN (PROXMOX) -> Usa PostgreSQL
  const { Pool } = require('pg');
  
  // Forzar IPv4 para evitar el timeout de 10s de Node.js intentando conectar a ::1 (IPv6)
  const connectionString = process.env.DATABASE_URL 
    ? process.env.DATABASE_URL.replace('localhost', '127.0.0.1')
    : process.env.DATABASE_URL;

  pool = new Pool({
    connectionString: connectionString,
    max: 3, // Límite estricto para 128MB RAM
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000, // 8s para tolerar contenedor DB "dormido"
  });
} else {
  // MODO DESARROLLO (LOCAL) -> Usa SQLite
  const Database = require('better-sqlite3');
  sqliteDb = new Database('local_blog.db');
  sqliteDb.pragma('journal_mode = WAL');
}

export async function query(text, params = []) {
  if (process.env.DATABASE_URL) {
    // Postgres adapter
    const client = await pool.connect();
    try {
      const res = await client.query(text, params);
      return res;
    } finally {
      client.release();
    }
  } else {
    // SQLite adapter
    const sqliteText = text.replace(/\$\d+/g, '?');
    const stmt = sqliteDb.prepare(sqliteText);
    
    if (sqliteText.trim().toUpperCase().startsWith('SELECT')) {
      const rows = stmt.all(...params);
      return { rows };
    } else if (sqliteText.trim().toUpperCase().startsWith('INSERT') && sqliteText.includes('RETURNING *')) {
      const cleanText = sqliteText.replace(/RETURNING \*/i, '');
      const info = sqliteDb.prepare(cleanText).run(...params);
      const rows = sqliteDb.prepare('SELECT * FROM posts WHERE id = ?').all(info.lastInsertRowid);
      return { rows };
    } else if (sqliteText.trim().toUpperCase().startsWith('UPDATE') && sqliteText.includes('RETURNING *')) {
      const cleanText = sqliteText.replace(/RETURNING \*/i, '');
      sqliteDb.prepare(cleanText).run(...params);
      const id = params[params.length - 1];
      const rows = sqliteDb.prepare('SELECT * FROM posts WHERE id = ?').all(id);
      return { rows };
    } else {
      const info = stmt.run(...params);
      return { rowCount: info.changes };
    }
  }
}
