import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Nav from '@/components/Nav';
import CodeBlock from '@/components/CodeBlock';
import CaseStudyImage from '@/components/CaseStudyImage';
import { getProyectoBySlug } from '@/content/proyectos';
import { getContentBySlug } from '@/lib/content';
import { getDictionary, SUPPORTED_LOCALES } from '../../dictionaries';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const languages = Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `/${l}/proyectos/${slug}`]));
  return {
    alternates: {
      canonical: `/${lang}/proyectos/${slug}`,
      languages,
    },
  };
}

export default async function CaseStudyPage({ params, searchParams }) {
  const { lang, slug } = await params;
  const { area } = await searchParams;
  const dict = await getDictionary(lang);
  const search = area ? `?area=${area}` : '';
  const project = getProyectoBySlug(slug);

  // RF-017: un proyecto sin caso de estudio no debe tener una página de detalle.
  if (!project || !project.hasCaseStudy) {
    notFound();
  }

  const result = await getContentBySlug(slug, { locale: lang, type: 'caso_estudio' });
  if (!result.found) {
    notFound();
  }

  const { content, isFallback, availableLocale } = result;
  const i18n = project.i18n[lang] || project.i18n.es;
  const date = content.published_at
    ? new Date(content.published_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null;

  return (
    <div className="wrap">
      <Nav lang={lang} dict={dict} basePath={`/proyectos/${slug}`} search={search} />

      <article className="article">
        <div className="art-topbar">
          <Link className="back" href={`/${lang}#proyectos`}>
            <svg className="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M14 6l-6 6 6 6" />
            </svg>
            {dict.caseStudy.volver}
          </Link>
        </div>

        {isFallback && (
          <div className="callout fallback-notice">
            <span className="mk">{dict.caseStudy.nota}</span>
            <span>
              {availableLocale === 'es' ? dict.caseStudy.fallbackNoticeEs : dict.caseStudy.fallbackNoticeEn}
              {' '}
              <a href={`/${availableLocale}/proyectos/${slug}`}>
                {availableLocale === 'es' ? dict.caseStudy.fallbackCtaEs : dict.caseStudy.fallbackCtaEn}
              </a>
            </span>
          </div>
        )}

        <header className="art-head">
          <div className="art-meta">
            <span className="tag mono">{i18n.context}</span>
            {date && <><span className="m">{date}</span><span className="dot"></span></>}
            {content.read_time && (
              <span className="m">
                <svg className="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" />
                </svg>
                {dict.caseStudy.minLectura.replace('{n}', content.read_time)}
              </span>
            )}
          </div>
          <h1 className="art-title serif">{content.title}</h1>
          {content.excerpt && <p className="art-deck">{content.excerpt}</p>}
        </header>

        <div className="prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code(props) {
                const { children, className, ...rest } = props;
                const match = /language-(\w+)/.exec(className || '');
                if (match) {
                  return <CodeBlock code={String(children).replace(/\n$/, '')} lang={match[1]} />;
                }
                return <code className={className} {...rest}>{children}</code>;
              },
            }}
          >
            {content.body || ''}
          </ReactMarkdown>

          {content.images?.map((img) => (
            <CaseStudyImage key={img.url} url={img.url} alt={img.alt} />
          ))}
        </div>
      </article>

      <footer className="foot">
        <span>© 2026 Mauro Armas</span>
        <span className="seg">
          <Link href={`/${lang}#proyectos`}>{dict.caseStudy.proyectos}</Link>
          <Link href={`/${lang}#contacto`}>{dict.caseStudy.contacto}</Link>
        </span>
      </footer>
    </div>
  );
}
