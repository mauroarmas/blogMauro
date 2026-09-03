// Direction A — "Quiet Editorial"
// Maximum air, large serif headlines, hairline rules, accent used sparingly.
function DirectionQuiet() {
  const B = window.BLOG;
  const accent = 'oklch(0.74 0.11 255)';
  const css = `
  .qe{--bg:oklch(0.172 0.008 258);--fg:oklch(0.93 0.006 258);--mut:oklch(0.63 0.012 258);
      --line:oklch(1 0 0 / 0.09);--accent:${accent};
      background:var(--bg);color:var(--fg);
      font-family:'Hanken Grotesk',system-ui,sans-serif;
      width:100%;min-height:100%;
      -webkit-font-smoothing:antialiased;}
  .qe *{box-sizing:border-box;}
  .qe-serif{font-family:'Newsreader',Georgia,serif;}
  .qe-mono{font-family:'JetBrains Mono',monospace;}
  .qe-pad{padding:0 72px;}
  .qe-nav{display:flex;align-items:center;justify-content:space-between;
          height:84px;border-bottom:1px solid var(--line);}
  .qe-mark{display:flex;align-items:center;gap:11px;font-weight:600;font-size:16px;letter-spacing:-0.01em;}
  .qe-dot{width:9px;height:9px;background:var(--accent);transform:rotate(45deg);}
  .qe-links{display:flex;align-items:center;gap:34px;font-size:14.5px;color:var(--mut);}
  .qe-links a{color:inherit;text-decoration:none;transition:color .15s;}
  .qe-links a:hover{color:var(--fg);}
  .qe-hero{padding-top:84px;padding-bottom:78px;max-width:860px;}
  .qe-eyebrow{display:flex;align-items:center;gap:12px;font-size:12.5px;letter-spacing:0.14em;
              text-transform:uppercase;color:var(--accent);margin-bottom:30px;}
  .qe-eyebrow .ln{width:38px;height:1px;background:var(--accent);opacity:.55;}
  .qe-h1{font-size:67px;line-height:1.04;letter-spacing:-0.022em;font-weight:400;margin:0 0 30px;}
  .qe-h1 em{font-style:italic;color:var(--mut);}
  .qe-lead{font-size:19.5px;line-height:1.65;color:var(--mut);max-width:600px;margin:0 0 40px;}
  .qe-cta{display:flex;align-items:center;gap:14px;}
  .qe-field{display:flex;align-items:center;gap:0;border:1px solid var(--line);border-radius:2px;
            overflow:hidden;background:oklch(1 0 0 / 0.02);}
  .qe-field input{background:transparent;border:0;outline:0;color:var(--fg);
            font-family:inherit;font-size:14.5px;padding:13px 16px;width:236px;}
  .qe-field input::placeholder{color:oklch(0.55 0.01 258);}
  .qe-field button{background:var(--fg);color:var(--bg);border:0;font-family:inherit;
            font-weight:600;font-size:14px;padding:0 20px;align-self:stretch;cursor:pointer;}
  .qe-rss{display:flex;align-items:center;gap:8px;color:var(--mut);font-size:13.5px;
          text-decoration:none;padding:0 4px;}
  .qe-rss:hover{color:var(--fg);}
  .qe-listhead{display:flex;align-items:baseline;justify-content:space-between;
               padding-top:30px;border-top:1px solid var(--line);margin-bottom:8px;}
  .qe-listhead h2{font-size:14px;font-weight:600;letter-spacing:0.02em;margin:0;}
  .qe-count{font-size:12.5px;color:var(--mut);}
  .qe-post{display:grid;grid-template-columns:150px 1fr auto;gap:40px;align-items:start;
           padding:34px 0;border-bottom:1px solid var(--line);cursor:pointer;transition:.18s;}
  .qe-post:hover{padding-left:10px;}
  .qe-meta{display:flex;flex-direction:column;gap:7px;padding-top:7px;}
  .qe-date{font-size:13px;color:var(--mut);}
  .qe-tag{font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--accent);}
  .qe-body .t{font-family:'Newsreader',serif;font-size:27px;line-height:1.18;letter-spacing:-0.01em;
              font-weight:400;margin:0 0 10px;transition:.18s;}
  .qe-post:hover .t{color:var(--accent);}
  .qe-body .x{font-size:15px;line-height:1.6;color:var(--mut);max-width:560px;margin:0;}
  .qe-read{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--mut);
           padding-top:9px;white-space:nowrap;}
  .qe-arrow{font-size:16px;color:var(--mut);padding-top:6px;transition:.18s;}
  .qe-post:hover .qe-arrow{color:var(--accent);transform:translateX(3px);}
  .qe-foot{display:flex;align-items:center;justify-content:space-between;
           padding-top:34px;padding-bottom:48px;margin-top:30px;
           border-top:1px solid var(--line);color:var(--mut);font-size:13px;}
  `;
  const Clock = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
  const Rss = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
  return (
    <div className="qe">
      <style>{css}</style>
      <nav className="qe-nav qe-pad">
        <div className="qe-mark"><span className="qe-dot"></span>{B.wordmark}</div>
        <div className="qe-links">
          <a href="#">Escritos</a><a href="#">Sobre</a>
          <a href="#" className="qe-rss"><Rss />RSS</a>
        </div>
      </nav>

      <header className="qe-hero qe-pad">
        <div className="qe-eyebrow"><span className="ln"></span>{B.role}</div>
        <h1 className="qe-h1 qe-serif">Notas honestas sobre construir software <em>que dura.</em></h1>
        <p className="qe-lead">{B.intro}</p>
        <div className="qe-cta">
          <div className="qe-field">
            <input placeholder="tu@correo.com" />
            <button>Suscribirse</button>
          </div>
          <a href="#" className="qe-rss"><Rss />Feed RSS</a>
        </div>
      </header>

      <section className="qe-pad">
        <div className="qe-listhead">
          <h2>Escritos recientes</h2>
          <span className="qe-count qe-mono">{String(B.posts.length).padStart(2, '0')} artículos</span>
        </div>
        {B.posts.map((p) => (
          <article className="qe-post" key={p.n}>
            <div className="qe-meta">
              <span className="qe-date qe-mono">{p.date}</span>
              <span className="qe-tag qe-mono">{p.tag}</span>
            </div>
            <div className="qe-body">
              <h3 className="t">{p.title}</h3>
              <p className="x">{p.excerpt}</p>
            </div>
            <div className="qe-read qe-mono"><Clock />{p.read}</div>
          </article>
        ))}
      </section>

      <footer className="qe-foot qe-pad">
        <span>© 2026 · {B.wordmark}</span>
        <span className="qe-mono">Hecho con cuidado · 128 MB</span>
      </footer>
    </div>
  );
}
window.DirectionQuiet = DirectionQuiet;
