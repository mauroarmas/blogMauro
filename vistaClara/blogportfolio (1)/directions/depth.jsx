// Direction B — "Premium Depth"
// Layered surfaces, soft radial glow, glass cards, green accent. More designed.
function DirectionDepth() {
  const B = window.BLOG;
  const accent = 'oklch(0.8 0.14 158)';
  const css = `
  .pd{--bg:oklch(0.158 0.012 250);--fg:oklch(0.95 0.006 250);--mut:oklch(0.65 0.015 250);
      --card:oklch(0.205 0.013 252);--line:oklch(1 0 0 / 0.07);--accent:${accent};
      position:relative;background:var(--bg);color:var(--fg);overflow:hidden;
      font-family:'Hanken Grotesk',system-ui,sans-serif;width:100%;min-height:100%;
      -webkit-font-smoothing:antialiased;}
  .pd *{box-sizing:border-box;}
  .pd-serif{font-family:'Newsreader',Georgia,serif;}
  .pd-mono{font-family:'JetBrains Mono',monospace;}
  .pd-glow{position:absolute;inset:0;pointer-events:none;
     background:
       radial-gradient(680px 420px at 78% -8%, oklch(0.8 0.14 158 / 0.10), transparent 70%),
       radial-gradient(560px 380px at 8% 4%, oklch(0.7 0.1 250 / 0.10), transparent 72%);}
  .pd-grain{position:absolute;inset:0;pointer-events:none;opacity:.4;
     background-image:linear-gradient(oklch(1 0 0 / 0.015) 1px, transparent 1px);
     background-size:100% 3px;}
  .pd-wrap{position:relative;z-index:1;padding:0 64px;}
  .pd-nav{display:flex;align-items:center;justify-content:space-between;height:88px;}
  .pd-mark{display:flex;align-items:center;gap:11px;font-weight:600;font-size:16px;}
  .pd-dot{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;
     background:linear-gradient(145deg,oklch(0.8 0.14 158),oklch(0.62 0.13 168));
     box-shadow:0 0 18px oklch(0.8 0.14 158 / 0.5);}
  .pd-dot i{width:7px;height:7px;background:var(--bg);border-radius:2px;transform:rotate(45deg);}
  .pd-links{display:flex;align-items:center;gap:12px;}
  .pd-links a{color:var(--mut);text-decoration:none;font-size:14.5px;padding:8px 14px;
     border-radius:8px;transition:.15s;}
  .pd-links a:hover{color:var(--fg);background:oklch(1 0 0 / 0.04);}
  .pd-links .pill{border:1px solid var(--line);color:var(--fg);display:flex;align-items:center;gap:8px;}
  .pd-hero{display:grid;grid-template-columns:1fr 0.86fr;gap:56px;align-items:center;
     padding-top:62px;padding-bottom:74px;}
  .pd-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:0.12em;
     text-transform:uppercase;color:var(--accent);margin-bottom:26px;
     border:1px solid oklch(0.8 0.14 158 / 0.3);border-radius:100px;padding:7px 14px;
     background:oklch(0.8 0.14 158 / 0.06);}
  .pd-eyebrow b{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);}
  .pd-h1{font-size:58px;line-height:1.06;letter-spacing:-0.022em;font-weight:400;margin:0 0 26px;}
  .pd-h1 em{font-style:italic;color:var(--accent);}
  .pd-lead{font-size:18px;line-height:1.65;color:var(--mut);max-width:480px;margin:0 0 34px;}
  .pd-cta{display:flex;align-items:center;gap:14px;}
  .pd-btn{background:var(--accent);color:oklch(0.18 0.02 160);border:0;font-family:inherit;
     font-weight:600;font-size:15px;padding:14px 24px;border-radius:10px;cursor:pointer;
     box-shadow:0 8px 28px oklch(0.8 0.14 158 / 0.25);}
  .pd-ghost{color:var(--mut);font-size:14.5px;text-decoration:none;display:flex;align-items:center;gap:8px;}
  .pd-ghost:hover{color:var(--fg);}
  /* featured card */
  .pd-feat{position:relative;border:1px solid var(--line);border-radius:18px;padding:30px;
     background:linear-gradient(160deg, oklch(0.22 0.014 252), oklch(0.18 0.012 250));
     box-shadow:0 30px 70px -20px oklch(0 0 0 / 0.6), inset 0 1px 0 oklch(1 0 0 / 0.05);}
  .pd-feat .badge{display:inline-flex;align-items:center;gap:7px;font-size:11px;letter-spacing:0.1em;
     text-transform:uppercase;color:var(--accent);margin-bottom:20px;}
  .pd-feat .badge i{width:6px;height:6px;border-radius:50%;background:var(--accent);}
  .pd-feat h3{font-size:30px;line-height:1.16;letter-spacing:-0.01em;font-weight:400;margin:0 0 14px;}
  .pd-feat p{font-size:15px;line-height:1.62;color:var(--mut);margin:0 0 26px;}
  .pd-feat .row{display:flex;align-items:center;gap:16px;font-size:12.5px;color:var(--mut);
     padding-top:20px;border-top:1px solid var(--line);}
  .pd-feat .row .s{display:flex;align-items:center;gap:6px;}
  .pd-feat .row .go{margin-left:auto;color:var(--accent);font-weight:600;display:flex;align-items:center;gap:6px;}
  /* list */
  .pd-listhead{display:flex;align-items:baseline;gap:14px;margin-bottom:20px;}
  .pd-listhead h2{font-size:14px;font-weight:600;margin:0;}
  .pd-listhead .l{flex:1;height:1px;background:var(--line);}
  .pd-listhead span{font-size:12.5px;color:var(--mut);}
  .pd-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding-bottom:60px;}
  .pd-card{border:1px solid var(--line);border-radius:14px;padding:24px 26px;cursor:pointer;
     background:oklch(0.2 0.012 252 / 0.6);transition:.18s;}
  .pd-card:hover{background:var(--card);border-color:oklch(0.8 0.14 158 / 0.3);transform:translateY(-2px);}
  .pd-card .top{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
  .pd-card .num{font-size:12px;color:var(--accent);}
  .pd-card .tg{font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:var(--mut);
     border:1px solid var(--line);border-radius:5px;padding:3px 8px;}
  .pd-card .dt{margin-left:auto;font-size:12px;color:var(--mut);}
  .pd-card h4{font-family:'Newsreader',serif;font-size:21px;line-height:1.22;font-weight:400;margin:0 0 9px;transition:.18s;}
  .pd-card:hover h4{color:var(--accent);}
  .pd-card p{font-size:13.5px;line-height:1.55;color:var(--mut);margin:0 0 16px;}
  .pd-card .rd{font-size:12px;color:var(--mut);display:flex;align-items:center;gap:6px;}
  .pd-foot{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;
     padding:30px 64px 44px;border-top:1px solid var(--line);color:var(--mut);font-size:13px;}
  `;
  const Clock = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
  const Rss = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
  const feat = B.posts[0];
  const rest = B.posts.slice(1);
  return (
    <div className="pd">
      <style>{css}</style>
      <div className="pd-glow"></div>
      <div className="pd-grain"></div>

      <div className="pd-wrap">
        <nav className="pd-nav">
          <div className="pd-mark"><span className="pd-dot"><i></i></span>{B.wordmark}</div>
          <div className="pd-links">
            <a href="#">Escritos</a><a href="#">Sobre</a>
            <a href="#" className="pill"><Rss />Suscribirse</a>
          </div>
        </nav>

        <header className="pd-hero">
          <div>
            <span className="pd-eyebrow"><b></b>{B.role}</span>
            <h1 className="pd-h1 pd-serif">Software pequeño, <em>bien hecho.</em></h1>
            <p className="pd-lead">{B.intro}</p>
            <div className="pd-cta">
              <button className="pd-btn">Leer el blog</button>
              <a href="#" className="pd-ghost"><Rss />Feed RSS</a>
            </div>
          </div>
          <article className="pd-feat">
            <span className="badge"><i></i>Destacado</span>
            <h3 className="pd-serif">{feat.title}</h3>
            <p>{feat.excerpt}</p>
            <div className="row">
              <span className="s pd-mono">{feat.date}</span>
              <span className="s pd-mono"><Clock />{feat.read}</span>
              <span className="go">Leer →</span>
            </div>
          </article>
        </header>

        <div className="pd-listhead">
          <h2>Más escritos</h2><span className="l"></span>
          <span className="pd-mono">{String(B.posts.length).padStart(2, '0')} total</span>
        </div>
        <div className="pd-grid">
          {rest.map((p) => (
            <article className="pd-card" key={p.n}>
              <div className="top">
                <span className="num pd-mono">{p.n}</span>
                <span className="tg pd-mono">{p.tag}</span>
                <span className="dt pd-mono">{p.date}</span>
              </div>
              <h4>{p.title}</h4>
              <p>{p.excerpt}</p>
              <span className="rd pd-mono"><Clock />{p.read} de lectura</span>
            </article>
          ))}
        </div>
      </div>

      <footer className="pd-foot">
        <span>© 2026 · {B.wordmark}</span>
        <span className="pd-mono">Next.js · 128 MB · SQLite</span>
      </footer>
    </div>
  );
}
window.DirectionDepth = DirectionDepth;
