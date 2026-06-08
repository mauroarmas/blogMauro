import { query } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  let post = null;
  
  try {
    const res = await query('SELECT * FROM posts WHERE slug = $1', [decodedSlug]);
    if (res.rows.length > 0) post = res.rows[0];
  } catch (error) {
    console.error(error);
  }

  if (!post) {
    return notFound();
  }

  const date = new Date(post.published_at || post.created_at).toLocaleDateString('es-ES', {
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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content || ''}
          </ReactMarkdown>
        </div>
      </article>
      
      <footer className="foot" style={{ marginTop: '40px' }}>
        <span>© 2026 Mauro Armas</span>
        <span className="seg">
          <Link href="/">índice</Link>
        </span>
      </footer>
    </div>
  );
}
