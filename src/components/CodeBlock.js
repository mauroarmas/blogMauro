import { codeToHtml } from 'shiki';

export default async function CodeBlock({ code, lang, filename }) {
  let html = '';
  try {
    html = await codeToHtml(code, { lang: lang || 'text', theme: 'vesper' });
  } catch (e) {
    html = `<pre><code>${code}</code></pre>`;
  }

  return (
    <div className="code">
      <div className="code-bar">
        <div className="dots">
          <i></i><i></i><i></i>
        </div>
        {filename && <span className="file">{filename}</span>}
        <span className="lang">{lang}</span>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
