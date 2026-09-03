import { query } from './db';

function parseRow(row) {
  if (!row) return null;
  return {
    ...row,
    images: row.images ? JSON.parse(row.images) : [],
  };
}

// contracts/content-api.md — lista de contenido publicado, sin body/images (payload liviano).
export async function getPublishedContent({ locale, type } = {}) {
  const conditions = ["status = 'published'"];
  const params = [];
  if (locale) {
    params.push(locale);
    conditions.push(`locale = $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }
  const res = await query(
    `SELECT * FROM content WHERE ${conditions.join(' AND ')} ORDER BY published_at DESC`,
    params
  );
  return res.rows.map(parseRow);
}

// contracts/content-api.md — resuelve un caso de estudio/artículo por slug con el
// fallback de traducción de RF-025: si no hay fila publicada en el locale pedido, trae
// la de cualquier locale disponible y lo marca explícitamente como fallback.
export async function getContentBySlug(slug, { locale, type } = {}) {
  const baseConditions = ['slug = $1', "status = 'published'"];
  const baseParams = [slug];
  if (type) {
    baseParams.push(type);
    baseConditions.push(`type = $${baseParams.length}`);
  }

  if (locale) {
    const params = [...baseParams, locale];
    const res = await query(
      `SELECT * FROM content WHERE ${baseConditions.join(' AND ')} AND locale = $${params.length} LIMIT 1`,
      params
    );
    if (res.rows[0]) {
      return { found: true, isFallback: false, locale, content: parseRow(res.rows[0]) };
    }
  }

  const fallbackRes = await query(
    `SELECT * FROM content WHERE ${baseConditions.join(' AND ')} LIMIT 1`,
    baseParams
  );
  if (fallbackRes.rows[0]) {
    const row = parseRow(fallbackRes.rows[0]);
    return {
      found: true,
      isFallback: true,
      requestedLocale: locale,
      availableLocale: row.locale,
      content: row,
    };
  }

  return { found: false };
}

// Atajo usado por ProjectCard (US1/US2) para decidir si mostrar el link "Caso de estudio"
// sin traer el cuerpo completo — solo necesita saber si existe algo publicado.
export async function hasPublishedCaseStudy(projectSlug) {
  const res = await query(
    "SELECT id FROM content WHERE project_slug = $1 AND type = 'caso_estudio' AND status = 'published' LIMIT 1",
    [projectSlug]
  );
  return res.rows.length > 0;
}
