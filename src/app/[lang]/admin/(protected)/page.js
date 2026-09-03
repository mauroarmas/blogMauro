'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { proyectos } from '@/content/proyectos';

function parseImagesText(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [url, alt] = line.split('|').map((s) => s.trim());
      return { url, alt: alt || '', position: i + 1 };
    })
    .filter((img) => img.url && img.alt);
}

function imagesToText(images) {
  return (images || []).map((img) => `${img.url} | ${img.alt}`).join('\n');
}

const EMPTY_FORM = {
  id: null,
  type: 'caso_estudio',
  locale: 'es',
  slug: '',
  projectSlug: proyectos[0]?.slug || '',
  title: '',
  excerpt: '',
  body: '',
  imagesText: '',
  status: 'draft',
};

export default function AdminPage() {
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'es';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  async function loadItems() {
    const res = await fetch('/api/content');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    fetch('/api/content')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!ignore) {
          setItems(data);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function openEditor(item) {
    if (!item) {
      setForm(EMPTY_FORM);
      return;
    }
    const res = await fetch(`/api/content/${item.id}`);
    if (!res.ok) return;
    const full = await res.json();
    setForm({
      id: full.id,
      type: full.type,
      locale: full.locale,
      slug: full.slug,
      projectSlug: full.project_slug || proyectos[0]?.slug || '',
      title: full.title,
      excerpt: full.excerpt || '',
      body: full.body || '',
      imagesText: imagesToText(full.images),
      status: full.status,
    });
  }

  function field(name) {
    return {
      value: form[name],
      onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
    };
  }

  async function save(e, statusOverride) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      type: form.type,
      locale: form.locale,
      slug: form.slug,
      projectSlug: form.type === 'caso_estudio' ? form.projectSlug : null,
      title: form.title,
      excerpt: form.excerpt,
      body: form.body,
      images: parseImagesText(form.imagesText),
      status: statusOverride || form.status,
      source: 'site',
    };

    const url = form.id ? `/api/content/${form.id}` : '/api/content';
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || 'Error al guardar.');
      return;
    }
    setForm(EMPTY_FORM);
    loadItems();
  }

  async function remove(item) {
    if (!confirm(`¿Eliminar "${item.title}"?\nEsta acción no se puede deshacer.`)) return;
    await fetch(`/api/content/${item.id}`, { method: 'DELETE' });
    loadItems();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = `/${lang}/admin/login`;
  }

  return (
    <div className="wrap">
      <nav className="nav">
        <div className="brand"><span className="br">[</span>mauroarmas.dev<span className="br">]</span></div>
        <div className="nav-right">
          <button className="btn-cancel" type="button" onClick={logout}>salir</button>
        </div>
      </nav>

      <div className="admin-shell">
        <section className="admin-list">
          <div className="admin-head">
            <h1>Contenido</h1>
            <button className="btn-new" type="button" onClick={() => openEditor(null)}>+ Nuevo</button>
          </div>

          {loading ? (
            <p style={{ color: 'var(--mut)' }}>Cargando…</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Nº</th>
                  <th style={{ width: 90 }}>Tipo</th>
                  <th>Contenido</th>
                  <th style={{ width: 50 }}>Idi.</th>
                  <th style={{ width: 96 }}>Estado</th>
                  <th style={{ width: 76 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id}>
                    <td className="tbl-num mono">{String(i + 1).padStart(2, '0')}</td>
                    <td className="tbl-tag mono">{item.type === 'caso_estudio' ? 'Caso' : 'Artículo'}</td>
                    <td>
                      <div className="tbl-title">{item.title}</div>
                      <div className="tbl-date mono">{item.slug}{item.project_slug ? ` · ${item.project_slug}` : ''}</div>
                    </td>
                    <td className="tbl-date2 mono">{item.locale}</td>
                    <td>
                      <span className={`badge ${item.status === 'published' ? 'badge-pub' : 'badge-draft'}`}>
                        <span className="badge-dot"></span>{item.status === 'published' ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td>
                      <span className="row-actions">
                        <button className="btn-row edit" type="button" title="Editar" onClick={() => openEditor(item)}>✎</button>
                        <button className="btn-row del" type="button" title="Eliminar" onClick={() => remove(item)}>✕</button>
                      </span>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={6} style={{ color: 'var(--mut)', padding: '24px 0' }}>Sin contenidos todavía.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </section>

        <aside className="editor-panel">
          <h2><span className="ep-indicator"></span>{form.id ? 'Editando' : 'Nuevo contenido'}</h2>

          <form onSubmit={save}>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-row">
                <label htmlFor="f-type">Tipo</label>
                <select id="f-type" {...field('type')}>
                  <option value="caso_estudio">Caso de estudio</option>
                  <option value="articulo">Artículo</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="f-locale">Idioma</label>
                <select id="f-locale" {...field('locale')}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {form.type === 'caso_estudio' && (
              <div className="form-row">
                <label htmlFor="f-project">Proyecto</label>
                <select id="f-project" {...field('projectSlug')}>
                  {proyectos.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.i18n.es.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-row">
              <label htmlFor="f-slug">Slug</label>
              <input id="f-slug" type="text" placeholder="trimia" {...field('slug')} />
            </div>

            <div className="form-row">
              <label htmlFor="f-title">Título</label>
              <input id="f-title" type="text" {...field('title')} />
            </div>

            <div className="form-row">
              <label htmlFor="f-excerpt">Extracto</label>
              <textarea id="f-excerpt" {...field('excerpt')} />
            </div>

            <div className="form-row">
              <label htmlFor="f-body">Contenido (Markdown)</label>
              <textarea id="f-body" className="big" {...field('body')} />
            </div>

            <div className="form-row">
              <label htmlFor="f-images">Imágenes — una por línea: url | texto alternativo</label>
              <textarea id="f-images" placeholder="/img/proyectos/trimia-arquitectura.png | Diagrama de arquitectura de TrimIA" {...field('imagesText')} />
            </div>

            <div className="form-row">
              <label>Estado</label>
              <div className="status-toggle">
                <div className="st-opt">
                  <input type="radio" name="status" id="s-draft" value="draft" checked={form.status === 'draft'} onChange={() => setForm((f) => ({ ...f, status: 'draft' }))} />
                  <label htmlFor="s-draft"><span className="badge-dot" style={{ background: 'var(--mut)' }}></span>Borrador</label>
                </div>
                <div className="st-opt">
                  <input type="radio" name="status" id="s-pub" value="published" checked={form.status === 'published'} onChange={() => setForm((f) => ({ ...f, status: 'published' }))} />
                  <label htmlFor="s-pub"><span className="badge-dot" style={{ background: 'var(--accent)' }}></span>Publicado</label>
                </div>
              </div>
            </div>

            {formError && <p style={{ color: 'oklch(0.65 0.18 22)', fontSize: 13, marginBottom: 12 }}>{formError}</p>}

            <div className="form-actions">
              <button className="btn-publish" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : form.status === 'published' ? 'Publicar' : 'Guardar borrador'}
              </button>
              <button className="btn-cancel" type="button" onClick={() => setForm(EMPTY_FORM)}>Cancelar</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
