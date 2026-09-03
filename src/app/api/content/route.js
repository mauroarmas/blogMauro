import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { getProyectoBySlug } from '@/content/proyectos';
import { readTime } from '@/lib/readTime';

const VALID_TYPES = ['caso_estudio', 'articulo'];
const VALID_LOCALES = ['es', 'en'];

// contracts/content-api.md — reemplaza a /api/posts. Uso exclusivo del admin autenticado.

export async function GET(req) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const locale = searchParams.get('locale');
  const type = searchParams.get('type');

  const conditions = [];
  const params = [];
  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  if (locale) { params.push(locale); conditions.push(`locale = $${params.length}`); }
  if (type) { params.push(type); conditions.push(`type = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const res = await query(
      `SELECT id, type, locale, slug, project_slug, title, excerpt, status, source, source_ref, read_time, published_at, updated_at
       FROM content ${where} ORDER BY updated_at DESC`,
      params
    );
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function validate(body) {
  if (!VALID_TYPES.includes(body.type)) {
    return 'type debe ser caso_estudio o articulo';
  }
  if (!VALID_LOCALES.includes(body.locale)) {
    return 'locale debe ser es o en';
  }
  if (!body.slug || !body.title) {
    return 'slug y title son obligatorios';
  }
  if (body.type === 'caso_estudio') {
    if (!body.projectSlug || !getProyectoBySlug(body.projectSlug)) {
      return 'projectSlug debe existir en src/content/proyectos.js';
    }
  } else if (body.projectSlug) {
    return 'un artículo no debe tener projectSlug';
  }
  const source = body.source || 'site';
  if (source !== 'site' && !body.sourceRef) {
    return 'sourceRef es obligatorio cuando source no es site';
  }
  if (source === 'site' && body.sourceRef) {
    return 'sourceRef debe estar vacío cuando source es site';
  }
  return null;
}

export async function POST(req) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const error = validate(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const source = body.source || 'site';
  const status = body.status === 'published' ? 'published' : 'draft';

  try {
    const res = await query(
      `INSERT INTO content (type, locale, slug, project_slug, title, excerpt, body, images, status, source, source_ref, read_time, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
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
        status === 'published' ? new Date().toISOString() : null,
      ]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err) {
    if (String(err.message).toUpperCase().includes('UNIQUE')) {
      return NextResponse.json({ error: 'Ya existe un contenido con ese slug y locale' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
