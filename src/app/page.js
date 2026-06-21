import { query } from '@/lib/db';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const BASE = '/44581626';

async function getPosts(retries = 3, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await query(
        "SELECT * FROM posts WHERE status = $1 ORDER BY COALESCE(published_at, created_at) DESC",
        ['published']
      );
      return res.rows;
    } catch (error) {
      console.error(`Failed to fetch posts (attempt ${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  return [];
}

export default async function Home() {
  const posts = await getPosts();

  let imageBase64 = '';
  try {
    const imagePath = path.join(process.cwd(), 'public', 'mauro.jpeg');
    const imageBuffer = fs.readFileSync(imagePath);
    imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  } catch (e) {
    console.error('Error loading image inline:', e);
    imageBase64 = `${BASE}/mauro.jpeg`; // fallback
  }

  return (
    <div className="wrap">
      <header className="hero">
        <aside className="ledger">
          <img 
            src={imageBase64}
            alt="Mauro Armas" 
            style={{ width: '100%', height: '192px', objectFit: 'cover', borderRadius: '6px', marginBottom: '20px', display: 'block' }} 
          />
          <div><span className="k">Rol</span><span className="v">Estudiante</span></div>
          <div><span className="k">Contenedores</span><span className="v">DB: 44581626DB (C162)<br/>App: 44581626A (C159)</span></div>
          <div><span className="k">Stack de Plataforma</span><span className="v">Next.js · PostgreSQL</span></div>
          <div><span className="k">Host</span><span className="v">Proxmox (NAP)</span></div>
          <div><span className="k">Posts</span><span className="v">{posts.length < 10 ? `0${posts.length}` : posts.length} publicados</span></div>
        </aside>

        <div className="hero-main">
          <h1 className="name">Mauro <span className="last">Armas</span></h1>
          <p className="role">Estudiante de Ingeniería en Sistemas de Información en UTN-FRT</p>

          <p className="statement serif">
            Trabajo Final Integrador: <br></br> <em>Virtualización: Consolidación de Servidores</em>
          </p>
          <p className="lead">
            En esta página tipo blog publico notas sobre sistemas de información y SOFT.
          </p>

          <h3 className="ttl">
            Ver el <em>Informe</em> de desarrollo e implementación del TPF:         
          </h3>

            <a href={`${BASE}/informe-tpf.pdf`} target="_blank" rel="noopener noreferrer" className="btn-download">
              <span className="br">[</span> TPF <span className="br">]</span>
            </a>
        </div>
      </header>

      <section>
        <div className="section-head">
          <h2>Índice de escritos</h2>
          <span className="l"></span>
          <span className="c mono">2026 — presente</span>
        </div>

        <div className="idx-head">
          <span>Nº</span><span>Tema</span><span>Artículo</span><span>Fecha</span><span>Lectura</span>
        </div>

        {posts.length === 0 ? (
          <div style={{ padding: '40px 0', color: 'var(--mut)' }}>No hay posts publicados aún.</div>
        ) : (
          posts.map((post, i) => {
            const num = (posts.length - i).toString().padStart(2, '0');
            const date = new Date(post.published_at || post.created_at).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'short', year: 'numeric'
            });
            
            return (
              <Link key={post.id} className="row" href={`/posts/${post.slug}`}>
                <span className="num">{num}</span>
                <span className="tag">{post.tag || 'Blog'}</span>
                <div>
                  <h3 className="ttl">{post.title}</h3>
                  <p className="exc">{post.excerpt || post.content.substring(0, 100) + '...'}</p>
                </div>
                <span className="date">{date}</span>
                <span className="read">
                  <svg className="ico" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" strokeLinecap="round" />
                  </svg>
                  {post.read_time || 5} min
                </span>
              </Link>
            )
          })
        )}
      </section>

      <footer className="foot">
        <span>© 2026 Mauro Armas</span>
        <span className="seg">
          <span>build:standalone</span>

          <a href={`${BASE}/informe-tpf.pdf`} target="_blank" rel="noopener noreferrer" className="btn-download">descargar pdf</a>

          <Link href="/admin">admin</Link>
        </span>
      </footer>
    </div>
  );
}
