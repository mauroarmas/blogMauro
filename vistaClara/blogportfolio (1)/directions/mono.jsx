// Direction C — "Mono Index"
// Technical precision: numbered index, monospace metadata, ledger-like rhythm.
function DirectionMono() {
  const B = window.BLOG;
  const accent = 'oklch(0.82 0.07 80)';   // warm steel/amber, restrained
  const css = `
  .mi{--bg:oklch(0.15 0.006 260);--fg:oklch(0.92 0.005 260);--mut:oklch(0.6 0.01 260);
      --line:oklch(1 0 0 / 0.08);--accent:${accent};
      background:var(--bg);color:var(--fg);width:100%;min-height:100%;
      font-family:'JetBrains Mono',ui-monospace,monospace;-webkit-font-smoothing:antialiased;}
  .mi *{box-sizing:border-box;}
  .mi-serif{font-family:'Newsreader',Georgia,serif;}
  .mi-sans{font-family:'Hanken Grotesk',system-ui,sans-serif;}
  .mi-pad{padding:0 64px;}
  .mi-nav{display:flex;align-items:center;justify-content:space-between;height:64px;
          border-bottom:1px solid var(--line);font-size:13px;}
  .mi-mark{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:-0.02em;}
  .mi-mark .b{color:var(--accent);}
  .mi-links{display:flex;gap:26px;color:var(--mut);font-size:12.5px;}
  .mi-links a{color:inherit;text-decoration:none;transition:.15s;}
  .mi-links a:hover{color:var(--accent);}
  .mi-status{display:flex;align-items:center;gap:8px;color:var(--mut);font-size:12px;}
  .mi-status .led{width:7px;height:7px;border-radius:50%;background:oklch(0.8 0.14 158);
     box-shadow:0 0 8px oklch(0.8 0.14 158 / 0.7);}
  .mi-hero{display:grid;grid-template-columns:auto 1fr;gap:48px;
           padding:64px 0 56px;border-bottom:1px solid var(--line);}
  .mi-hkey{font-size:12px;color:var(--mut);letter-spacing:0.05em;padding-top:8px;
           border-left:2px solid var(--accent);padding-left:16px;line-height:2.1;white-space:nowrap;}
  .mi-hkey b{color:var(--fg);font-weight:400;}
  .mi-h1{font-family:'Newsreader',serif;font-size:56px;line-height:1.08;letter-spacing:-0.02em;
         font-weight:400;margin:0 0 22px;}
  .mi-h1 em{font-style:italic;color:var(--accent);}
  .mi-lead{font-family:'Hanken Grotesk',sans-serif;font-size:17.5px;line-height:1.62;
           color:var(--mut);max-width:540px;margin:0 0 28px;}
  .mi-cta{display:flex;align-items:stretch;gap:0;max-width:460px;border:1px solid var(--line);}
  .mi-cta input{flex:1;background:transparent;border:0;outline:0;color:var(--fg);
     font-family:inherit;font-size:13px;padding:13px 16px;}
  .mi-cta input::placeholder{color:oklch(0.52 0.01 260);}
  .mi-cta button{background:var(--accent);color:oklch(0.2 0.02 80);border:0;font-family:inherit;
     font-weight:700;font-size:12px;padding:0 20px;cursor:pointer;letter-spacing:0.03em;}
  .mi-cta a{display:flex;align-items:center;gap:7px;padding:0 16px;color:var(--mut);
     text-decoration:none;border-left:1px solid var(--line);font-size:12px;}
  .mi-cta a:hover{color:var(--accent);}
  .mi-idxhead{display:grid;grid-template-columns:54px 110px 1fr 120px 70px;gap:20px;
     padding:22px 0 14px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;
     color:var(--mut);border-bottom:1px solid var(--line);}
  .mi-row{display:grid;grid-template-columns:54px 110px 1fr 120px 70px;gap:20px;align-items:baseline;
     padding:26px 0;border-bottom:1px solid var(--line);cursor:pointer;transition:.16s;}
  .mi-row:hover{background:oklch(1 0 0 / 0.018);}
  .mi-num{font-size:13px;color:var(--accent);}
  .mi-tag{font-size:12px;color:var(--mut);}
  .mi-tcell .t{font-family:'Newsreader',serif;font-size:23px;line-height:1.2;font-weight:400;
     margin:0 0 8px;letter-spacing:-0.005em;transition:.16s;}
  .mi-row:hover .mi-tcell .t{color:var(--accent);}
  .mi-tcell .x{font-family:'Hanken Grotesk',sans-serif;font-size:14px;line-height:1.55;
     color:var(--mut);max-width:560px;margin:0;}
  .mi-date{font-size:12.5px;color:var(--mut);}
  .mi-read{font-size:12.5px;color:var(--mut);text-align:right;display:flex;align-items:center;
     gap:6px;justify-content:flex-end;}
  .mi-foot{display:flex;align-items:center;justify-content:space-between;
     padding:26px 0 44px;color:var(--mut);font-size:12px;}
  .mi-foot .seg{display:flex;gap:22px;}
  `;
  const Clock = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
  const Rss = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
  return (
    <div className="mi">
      <style>{css}</style>
      <nav className="mi-nav mi-pad">
        <div className="mi-mark"><span className="b">[</span>{B.wordmark}<span className="b">]</span></div>
        <div className="mi-links">
          <a href="#">~/escritos</a><a href="#">~/sobre</a><a href="#">~/rss.xml</a>
        </div>
        <div className="mi-status"><span className="led"></span>online · 128MB</div>
      </nav>

      <header className="mi-hero mi-pad">
        <div className="mi-hkey">
          rol&nbsp;&nbsp;&nbsp;<b>{B.role}</b><br />
          stack&nbsp;<b>Next.js · SQLite</b><br />
          host&nbsp;&nbsp;<b>128 MB / 8 GB</b><br />
          posts&nbsp;<b>{String(B.posts.length).padStart(2, '0')} publicados</b>
        </div>
        <div>
          <h1 className="mi-h1">Un índice de cosas que <em>aprendí</em> construyendo.</h1>
          <p className="mi-lead">{B.intro}</p>
          <div className="mi-cta">
            <input placeholder="tu@correo.com" />
            <button>SUSCRIBIR</button>
            <a href="#"><Rss />rss</a>
          </div>
        </div>
      </header>

      <section className="mi-pad">
        <div className="mi-idxhead">
          <span>Nº</span><span>Tema</span><span>Artículo</span><span>Fecha</span><span>Lectura</span>
        </div>
        {B.posts.map((p) => (
          <article className="mi-row" key={p.n}>
            <span className="mi-num">{p.n}</span>
            <span className="mi-tag">{p.tag}</span>
            <div className="mi-tcell">
              <h3 className="t">{p.title}</h3>
              <p className="x">{p.excerpt}</p>
            </div>
            <span className="mi-date">{p.date}</span>
            <span className="mi-read"><Clock />{p.read}</span>
          </article>
        ))}
      </section>

      <footer className="mi-foot mi-pad">
        <span>© 2026 {B.wordmark}</span>
        <span className="seg"><span>build:standalone</span><span>rss ·</span><span>newsletter</span></span>
      </footer>
    </div>
  );
}
window.DirectionMono = DirectionMono;
