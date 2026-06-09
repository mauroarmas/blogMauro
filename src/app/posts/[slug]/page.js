import { query } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PrintButton from '@/components/PrintButton';
import CodeBlock from '@/components/CodeBlock';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  let post = null;
  let nextPost = null;
  
  try {
    const res = await query('SELECT * FROM posts WHERE slug = $1', [decodedSlug]);
    if (res.rows.length > 0) {
      post = res.rows[0];
      // Fetch next post
      const nextRes = await query('SELECT * FROM posts WHERE id > $1 AND status = $2 ORDER BY id ASC LIMIT 1', [post.id, 'published']);
      if (nextRes.rows.length > 0) nextPost = nextRes.rows[0];
    }
  } catch (error) {
    console.error(error);
  }

  if (!post) {
    return notFound();
  }

  const dateObj = new Date(post.published_at || post.created_at);
  const date = dateObj.toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="wrap">
      <article className="article">
        <div className="art-topbar">
          <Link className="back" href="/">
            <svg className="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M14 6l-6 6 6 6" />
            </svg>
            Volver al índice
          </Link>
          <PrintButton />
        </div>

        <header className="art-head">
          <div className="art-meta">
            <span className="tag mono">{post.tag || 'Blog'}</span>
            <span className="m">{date}</span>
            <span className="dot"></span>
            <span className="m">
              <svg className="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
              {post.read_time || 5} min de lectura
            </span>
            <span className="dot"></span>
            <span className="m mono">#{post.id.toString().padStart(2, '0')}</span>
          </div>
          <h1 className="art-title serif">{post.title}</h1>
          <p className="art-deck">{post.excerpt}</p>
          <div className="art-author">
            <span className="av">MA</span>
            <span>Por <b>Mauro Armas</b> · Desarrollador y Estudiante de Ingeniería</span>
          </div>
        </header>

        <div className="prose">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code(props) {
                const {children, className, node, ...rest} = props;
                const match = /language-(\w+)/.exec(className || '');
                if (match) {
                  return <CodeBlock code={String(children).replace(/\n$/, '')} lang={match[1]} />;
                }
                return <code className={className} {...rest}>{children}</code>;
              }
            }}
          >
            {post.content || ''}
          </ReactMarkdown>
        </div>
      </article>
      
      <div className="art-end">
        {nextPost ? (
          <Link className="next-card" href={`/posts/${nextPost.slug}`}>
            <div>
              <div className="lbl">Siguiente artículo</div>
              <div className="nt serif">{nextPost.title}</div>
            </div>
            <span className="arr">→</span>
          </Link>
        ) : (
          <Link className="next-card" href="/">
            <div>
              <div className="lbl">Siguiente artículo</div>
              <div className="nt serif">Volver al índice del blog</div>
            </div>
            <span className="arr">→</span>
          </Link>
        )}
      </div>

      <div className="art-sub">
        <h4 className="serif">¿Te sirvió? Recibe el próximo en tu correo.</h4>
        <p>Sin spam. Un email solo cuando publico algo nuevo. Cancela cuando quieras.</p>
        <div className="subscribe">
          <input type="email" placeholder="tu@correo.com" aria-label="Correo" />
          <button type="button">SUSCRIBIR</button>
          <a href="#" className="rss" aria-label="RSS">
            <svg className="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none" /></svg>
            rss
          </a>
        </div>
      </div>

      <footer className="foot">
        <span>© 2026 Mauro Armas</span>
        <span className="seg">
          <Link href="/">índice</Link>
          <a href="#">rss.xml</a>
          <a href="#">newsletter</a>
        </span>
      </footer>
    </div>
  );
}
