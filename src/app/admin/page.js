import { query } from '@/lib/db';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
const BASE = '/44581626';

export default async function AdminPage(props) {
  const searchParams = await props.searchParams;

  let posts = [];
  try {
    const res = await query("SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC");
    posts = res.rows || [];
  } catch (error) {
    console.error('Failed to fetch posts:', error);
  }

  const editId = searchParams?.edit;
  let editingPost = null;
  if (editId) {
    editingPost = posts.find(p => p.id.toString() === editId);
  }

  async function savePost(formData) {
    'use server';
    const id = formData.get('id');
    const title = formData.get('title');
    const tag = formData.get('tag');
    const date = formData.get('date');
    const excerpt = formData.get('excerpt');
    const content = formData.get('content');
    const status = formData.get('status');

    const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const words = content.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.round(words / 200));
    const published_at = date ? new Date(date).toISOString() : new Date().toISOString();

    if (id) {
      await query(
        "UPDATE posts SET title=$1, tag=$2, excerpt=$3, content=$4, status=$5, slug=$6, read_time=$7, published_at=$8 WHERE id=$9",
        [title, tag, excerpt, content, status, slug, readTime, published_at, id]
      );
    } else {
      await query(
        "INSERT INTO posts (title, tag, excerpt, content, status, slug, read_time, published_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [title, tag, excerpt, content, status, slug, readTime, published_at]
      );
    }
    revalidatePath('/admin');
    redirect(`${BASE}/admin`);
  }

  async function deletePost(formData) {
    'use server';
    const id = formData.get('id');
    await query("DELETE FROM posts WHERE id=$1", [id]);
    revalidatePath('/admin');
    redirect(`${BASE}/admin`);
  }

  const defaultTitle = editingPost?.title || '';
  const defaultTag = editingPost?.tag || '';
  let defaultDate = '';
  if (editingPost) {
    const d = editingPost.published_at || editingPost.created_at;
    if (d) defaultDate = new Date(d).toISOString().split('T')[0];
  }
  const defaultExcerpt = editingPost?.excerpt || '';
  const defaultContent = editingPost?.content || '';
  const defaultStatus = editingPost?.status || 'published';

  return (
    <div className="wrap">
      <div className="admin-shell">
        <section className="admin-list">
          <div className="admin-head">
            <h1>Publicaciones</h1>
            <Link href="/admin" className="btn-new" style={{ textDecoration: 'none' }}>
              <svg className="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Nuevo post
            </Link>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th style={{width: '40px'}}>Nº</th>
                <th style={{width: '80px'}}>Tema</th>
                <th>Artículo</th>
                <th style={{width: '90px'}}>Fecha</th>
                <th style={{width: '96px'}}>Estado</th>
                <th style={{width: '76px'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => {
                const num = (posts.length - i).toString().padStart(2, '0');
                const isPublished = post.status === 'published';
                const dateObj = new Date(post.published_at || post.created_at);
                const fullDateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                const shortDateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' });
                
                return (
                  <tr key={post.id}>
                    <td className="tbl-num mono">{num}</td>
                    <td className="tbl-tag mono">{post.tag}</td>
                    <td>
                      <div className="tbl-title">{post.title}</div>
                      <div className="tbl-date mono">
                        {isPublished ? `${fullDateStr} · ${post.read_time || 5} min` : 'Borrador · sin publicar'}
                      </div>
                    </td>
                    <td className="tbl-date2 mono">{isPublished ? shortDateStr : '—'}</td>
                    <td>
                      {isPublished ? (
                        <span className="badge badge-pub"><span className="badge-dot"></span>Publicado</span>
                      ) : (
                        <span className="badge badge-draft"><span className="badge-dot"></span>Borrador</span>
                      )}
                    </td>
                    <td>
                      <span className="row-actions">
                        <Link href={`/admin?edit=${post.id}#editor-panel`} className="btn-row edit" title="Editar" style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
                        </Link>
                        <form action={deletePost} style={{display: 'inline'}}>
                          <input type="hidden" name="id" value={post.id} />
                          <button type="submit" className="btn-row del" title="Eliminar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                          </button>
                        </form>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <aside className="editor-panel" id="editor-panel">
          <h2>
            <span className="ep-indicator"></span>
            <span>{editingPost ? 'Editando post' : 'Nuevo post'}</span>
          </h2>

          <form action={savePost}>
            {editingPost && <input type="hidden" name="id" value={editingPost.id} />}
            
            <div className="form-row">
              <label htmlFor="f-title">Título</label>
              <input type="text" id="f-title" name="title" required placeholder="El título del artículo…" defaultValue={defaultTitle} />
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label htmlFor="f-tag">Categoría</label>
                <select id="f-tag" name="tag" defaultValue={defaultTag}>
                  <option value="">— Elige —</option>
                  <option value="Infra">Infra</option>
                  <option value="Next.js">Next.js</option>
                  <option value="Datos">Datos</option>
                  <option value="Backend">Backend</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="f-date">Fecha</label>
                <input type="date" id="f-date" name="date" defaultValue={defaultDate} />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="f-excerpt">Extracto</label>
              <textarea id="f-excerpt" name="excerpt" placeholder="Una o dos frases que resuman el artículo…" defaultValue={defaultExcerpt}></textarea>
            </div>

            <div className="form-row">
              <label htmlFor="f-content">Contenido</label>
              <textarea id="f-content" name="content" className="big" placeholder="Markdown, HTML o el formato que uses en tu stack…" defaultValue={defaultContent}></textarea>
            </div>

            <div className="form-row">
              <label>Estado</label>
              <div className="status-toggle">
                <div className="st-opt">
                  <input type="radio" name="status" id="s-pub" value="published" defaultChecked={defaultStatus === 'published'} />
                  <label htmlFor="s-pub">
                    <span className="badge-dot" style={{background: 'oklch(0.82 0.075 80)'}}></span>Publicar
                  </label>
                </div>
                <div className="st-opt">
                  <input type="radio" name="status" id="s-draft" value="draft" defaultChecked={defaultStatus === 'draft'} />
                  <label htmlFor="s-draft">
                    <span className="badge-dot" style={{background: 'oklch(0.62 0.010 262)'}}></span>Borrador
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-publish">Guardar post</button>
              <Link href="/admin" className="btn-cancel" style={{textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}>Cancelar</Link>
            </div>
          </form>
        </aside>
      </div>

      <footer className="foot" style={{ marginTop: '40px' }}>
        <span>© 2026 Mauro Armas</span>
        <span className="seg">
          <Link href="/">ver blog</Link>
          <a href="#">rss.xml</a>
        </span>
      </footer>
    </div>
  );
}
