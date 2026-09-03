import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { getProyectoBySlug } from '@/content/proyectos';
import { readTime } from '@/lib/readTime';

const VALID_TYPES = ['caso_estudio', 'articulo'];
const VALID_LOCALES = ['es', 'en'];

export async function GET(req, { params }) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const res = await query('SELECT * FROM content WHERE id = $1', [id]);
  if (!res.rows[0]) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
  const row = res.rows[0];
  return NextResponse.json({ ...row, images: row.images ? JSON.parse(row.images) : [] });
}

export async function PUT(req, { params }) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const existing = await query('SELECT id, published_at FROM content WHERE id = $1', [id]);
  if (!existing.rows[0]) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  if (!VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'type debe ser caso_estudio o articulo' }, { status: 400 });
  }
  if (!VALID_LOCALES.includes(body.locale)) {
    return NextResponse.json({ error: 'locale debe ser es o en' }, { status: 400 });
  }
  if (body.type === 'caso_estudio' && (!body.projectSlug || !getProyectoBySlug(body.projectSlug))) {
    return NextResponse.json({ error: 'projectSlug debe existir en src/content/proyectos.js' }, { status: 400 });
  }
  const source = body.source || 'site';
  if (source !== 'site' && !body.sourceRef) {
    return NextResponse.json({ error: 'sourceRef es obligatorio cuando source no es site' }, { status: 400 });
  }

  const status = body.status === 'published' ? 'published' : 'draft';
  const now = new Date().toISOString();
  // Se computa en JS en vez de con un CASE WHEN en SQL: el adaptador SQLite (db.js)
  // reemplaza cada `$N` por un `?` posicional, así que un placeholder repetido dos
  // veces en el texto rompe el conteo de parámetros — mejor evitarlo directamente.
  const publishedAt = status === 'published' ? (existing.rows[0].published_at || now) : null;

  try {
    const res = await query(
      `UPDATE content SET
         type=$1, locale=$2, slug=$3, project_slug=$4, title=$5, excerpt=$6, body=$7,
         images=$8, status=$9, source=$10, source_ref=$11, read_time=$12,
         published_at=$13, updated_at=$14
       WHERE id = $15
       RETURNING *`,
      [
        body.type,
        body.locale,
        body.slug,
        body.type === 'caso_estudio' ? body.projectSlug : null,
        body.title,
        body.excerpt || null,
        body.body || null,
        body.images ? JSON.stringify(body.images) : null,
        status,
        source,
        body.sourceRef || null,
        readTime(body.body || ''),
        publishedAt,
        now,
        id,
      ]
    );
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    if (String(err.message).toUpperCase().includes('UNIQUE')) {
      return NextResponse.json({ error: 'Ya existe un contenido con ese slug y locale' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  await query('DELETE FROM content WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}
