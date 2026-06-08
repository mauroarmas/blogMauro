'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '', tag: '', date: '', excerpt: '', content: '', status: 'published'
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
  };

  const handleEdit = (post) => {
    setEditing(post.id);
    const dateStr = post.published_at 
      ? new Date(post.published_at).toISOString().split('T')[0]
      : (post.created_at ? new Date(post.created_at).toISOString().split('T')[0] : '');
      
    setFormData({
      title: post.title,
      tag: post.tag || '',
      date: dateStr,
      excerpt: post.excerpt || '',
      content: post.content || '',
      status: post.status || 'draft'
    });
    
    // Scroll to editor
    document.getElementById('editor-panel')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const handleNew = () => {
    setEditing(null);
    setFormData({ title: '', tag: '', date: '', excerpt: '', content: '', status: 'published' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/posts/${editing}` : '/api/posts';
    
    // Auto generate slug from title
    const slug = formData.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Calculate read time
    const words = formData.content.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.round(words / 200));
    
    const payload = {
      ...formData,
      slug,
      read_time: readTime,
      published_at: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString()
    };
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    fetchPosts();
    handleNew();
  };

  const handleDelete = async (id, title) => {
    if(confirm(`¿Eliminar "${title}"?\nEsta acción no se puede deshacer.`)) {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      fetchPosts();
    }
  };

  return (
    <div className="wrap">
      <div className="admin-shell">
        {/* Lista de publicaciones */}
        <section className="admin-list">
          <div className="admin-head">
            <h1>Publicaciones</h1>
            <button className="btn-new" onClick={handleNew}>
              <svg className="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Nuevo post
            </button>
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
                        <button className="btn-row edit" title="Editar" onClick={() => handleEdit(post)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
                        </button>
                        <button className="btn-row del" title="Eliminar" onClick={() => handleDelete(post.id, post.title)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Editor de post */}
        <aside className="editor-panel" id="editor-panel">
          <h2>
            <span className="ep-indicator"></span>
            <span>{editing ? 'Editando post' : 'Nuevo post'}</span>
          </h2>

          <form onSubmit={handleSave}>
            <div className="form-row">
              <label htmlFor="f-title">Título</label>
              <input type="text" id="f-title" required placeholder="El título del artículo…" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label htmlFor="f-tag">Categoría</label>
                <select id="f-tag" value={formData.tag} onChange={e=>setFormData({...formData, tag: e.target.value})}>
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
                <input type="date" id="f-date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="f-excerpt">Extracto</label>
              <textarea id="f-excerpt" placeholder="Una o dos frases que resuman el artículo…" value={formData.excerpt} onChange={e=>setFormData({...formData, excerpt: e.target.value})}></textarea>
            </div>

            <div className="form-row">
              <label htmlFor="f-content">Contenido</label>
              <textarea id="f-content" className="big" placeholder="Markdown, HTML o el formato que uses en tu stack…" value={formData.content} onChange={e=>setFormData({...formData, content: e.target.value})}></textarea>
            </div>

            <div className="form-row">
              <label>Estado</label>
              <div className="status-toggle">
                <div className="st-opt">
                  <input type="radio" name="status" id="s-pub" value="published" checked={formData.status === 'published'} onChange={() => setFormData({...formData, status: 'published'})} />
                  <label htmlFor="s-pub">
                    <span className="badge-dot" style={{background: 'oklch(0.82 0.075 80)'}}></span>Publicar
                  </label>
                </div>
                <div className="st-opt">
                  <input type="radio" name="status" id="s-draft" value="draft" checked={formData.status === 'draft'} onChange={() => setFormData({...formData, status: 'draft'})} />
                  <label htmlFor="s-draft">
                    <span className="badge-dot" style={{background: 'oklch(0.62 0.010 262)'}}></span>Borrador
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-publish">{editing ? 'Guardar cambios' : 'Publicar'}</button>
              <button type="button" className="btn-draft" onClick={() => {
                setFormData({...formData, status: 'draft'});
                // We don't trigger submit directly here, they can click Publicar/Guardar to trigger normal flow.
                // Or we can manually trigger the save:
                setTimeout(() => document.querySelector('form').requestSubmit(), 0);
              }}>Guardar borrador</button>
              <button type="button" className="btn-cancel" onClick={handleNew}>Cancelar</button>
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
