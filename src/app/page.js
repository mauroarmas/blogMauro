import { query } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  let posts = [];
  try {
    const res = await query(
      "SELECT * FROM posts WHERE status = $1 ORDER BY COALESCE(published_at, created_at) DESC",
      ['published']
    );
    posts = res.rows;
  } catch (error) {
    console.error('Failed to fetch posts:', error);
  }

  return (
    <div className="wrap">
      <header className="hero">
        <aside className="ledger">
          <Image 
            src="/mauro.jpeg" 
            alt="Mauro Armas" 
            width={190} 
            height={192}
            style={{ width: '100%', height: '192px', objectFit: 'cover', borderRadius: '6px', marginBottom: '20px', display: 'block' }} 
            priority
          />
          <div><span className="k">Rol</span><span className="v">Desarrollador</span></div>
          <div><span className="k">Estudia</span><span className="v">Ing. en Sistemas<br/>de Información</span></div>
          <div><span className="k">Stack de Plataforma</span><span className="v">Next.js · PostgreSQL</span></div>
          <div><span className="k">Host</span><span className="v">Proxmox (NAP)</span></div>
          <div><span className="k">Posts</span><span className="v">{posts.length < 10 ? `0${posts.length}` : posts.length} publicados</span></div>
        </aside>

        <div className="hero-main">
          <h1 className="name">Mauro <span className="last">Armas</span></h1>
          <p className="role">Desarrollador y Estudiante de Ingeniería en UTN-FRT</p>

          <p className="statement serif">
            Un índice de cosas que <em>aprendí</em> en mi carrera y construyendo <em>SOFT</em>.
          </p>
          <p className="lead">
            Escribo notas sobre sistemas con recursos limitados, rendimiento, y el oficio de hacer software que dura sin vender humo. Trabajo final integrador.
          </p>

          <div className="subscribe">
            <input type="email" placeholder="tu@correo.com" aria-label="Correo" />
            <button type="button">SUSCRIBIR</button>
            <Link href="/rss.xml" className="rss" aria-label="RSS">
              <svg className="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />
                <circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none" />
              </svg>
              rss
            </Link>
          </div>
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
          <Link href="/reporte_despliegue.pdf" download>descargar pdf</Link>
          <Link href="/admin">admin</Link>
        </span>
      </footer>
    </div>
  );
}
