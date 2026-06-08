import { Pool } from 'pg';

const pool = new Pool({
  // URL de conexión apuntando a tu Contenedor 2 por defecto, o usando la variable de entorno
  connectionString: process.env.DATABASE_URL || 'postgres://mauro:utn2026@172.16.90.162:5432/blogdb',
  // Es VITAL mantener el máximo de conexiones bajo para no colapsar los 128MB de RAM del contenedor 2
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}
