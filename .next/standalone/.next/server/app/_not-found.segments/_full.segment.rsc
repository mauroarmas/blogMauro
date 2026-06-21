1:"$Sreact.fragment"
8:I[68027,["/44581626/_next/static/chunks/1vt-y__blxj6n.js","/44581626/_next/static/chunks/14mrh2-p_w84d.js"],"default",1]
:HL["https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap","style"]
:HL["https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap","style"]
:HL["https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;1,400&display=swap","style"]
2:T4f29,/* ============================================================
   Mauro Armas — Blog  ·  Direction C "Mono Index"
   Shared design system: dark premium, sand/gold accent,
   Newsreader (serif articles) + Hanken Grotesk (UI) + JetBrains Mono (meta/code)
   ============================================================ */

:root {
  --bg:     oklch(0.148 0.006 262);
  --panel:  oklch(0.178 0.007 262);
  --panel2: oklch(0.205 0.008 262);
  --fg:     oklch(0.93 0.005 262);
  --fg-2:   oklch(0.80 0.008 262);
  --mut:    oklch(0.62 0.010 262);
  --faint:  oklch(0.50 0.010 262);
  --line:   oklch(1 0 0 / 0.08);
  --line-2: oklch(1 0 0 / 0.045);
  --accent: oklch(0.82 0.075 80);     /* sand / gold */
  --accent-deep: oklch(0.70 0.085 70);
  --accent-soft: oklch(0.82 0.075 80 / 0.10);
  --ok:     oklch(0.80 0.13 158);

  /* code tokens */
  --t-com: oklch(0.50 0.010 262);
  --t-kw:  oklch(0.82 0.075 80);
  --t-str: oklch(0.78 0.075 150);
  --t-num: oklch(0.80 0.090 45);
  --t-fn:  oklch(0.83 0.045 235);
  --t-pun: oklch(0.62 0.010 262);

  --maxw: 1080px;
  --sans: 'Hanken Grotesk', system-ui, sans-serif;
  --serif: 'Newsreader', Georgia, serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--mono);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* faint top sheen so the dark doesn't feel flat */
body::before {
  content: "";
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(900px 360px at 50% -140px, oklch(0.82 0.075 80 / 0.06), transparent 70%);
}

.wrap { position: relative; z-index: 1; max-width: var(--maxw); margin: 0 auto; padding: 0 40px; }

a { color: inherit; }

.serif { font-family: var(--serif); }
.sans  { font-family: var(--sans); }
.mono  { font-family: var(--mono); }

/* ---------------- top bar ---------------- */
.nav {
  display: flex; align-items: center; justify-content: space-between;
  height: 66px; border-bottom: 1px solid var(--line); font-size: 13px;
}
.brand { display: flex; align-items: center; gap: 9px; font-weight: 700; letter-spacing: -0.02em; }
.brand .br { color: var(--accent); }
.nav-links { display: flex; gap: 26px; color: var(--mut); font-size: 12.5px; }
.nav-links a { color: inherit; text-decoration: none; transition: color .15s; }
.nav-links a:hover { color: var(--accent); }
.status { display: flex; align-items: center; gap: 8px; color: var(--mut); font-size: 12px; }
.led { width: 7px; height: 7px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 9px oklch(0.80 0.13 158 / 0.7); }

/* ---------------- hero ---------------- */
.hero { display: grid; grid-template-columns: 190px 1fr; gap: 52px; padding: 76px 0 60px; border-bottom: 1px solid var(--line); }
.ledger {
  font-size: 12px; color: var(--mut); line-height: 1; letter-spacing: 0.03em;
  border-left: 2px solid var(--accent); padding-left: 16px;
  display: flex; flex-direction: column; gap: 16px; padding-top: 10px;
}
.ledger .k { color: var(--faint); display: block; margin-bottom: 6px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
.ledger .v { color: var(--fg-2); }

.name {
  font-family: var(--serif); font-weight: 430; letter-spacing: -0.028em;
  font-size: clamp(56px, 9vw, 104px); line-height: 0.94; margin: 0;
}
.name .last { color: var(--accent); font-style: italic; }
.role {
  margin: 22px 0 0; font-size: 14px; color: var(--mut); letter-spacing: 0.02em;
  display: inline-flex; align-items: center; gap: 12px;
}
.role::before { content: ""; width: 26px; height: 1px; background: var(--accent); opacity: .6; }

.statement {
  font-family: var(--serif); font-weight: 400; font-size: 30px; line-height: 1.22;
  letter-spacing: -0.01em; margin: 44px 0 18px; max-width: 620px;
}
.statement em { font-style: italic; color: var(--accent); }
.lead { font-family: var(--sans); font-size: 17px; line-height: 1.62; color: var(--mut); max-width: 560px; margin: 0 0 30px; }

/* newsletter / rss inline field */
.subscribe { display: flex; align-items: stretch; max-width: 470px; border: 1px solid var(--line); border-radius: 3px; overflow: hidden; }
.subscribe input { flex: 1; background: oklch(1 0 0 / 0.02); border: 0; outline: 0; color: var(--fg); font-family: var(--mono); font-size: 13px; padding: 14px 16px; }
.subscribe input::placeholder { color: var(--faint); }
.subscribe button { background: var(--accent); color: oklch(0.20 0.03 80); border: 0; font-family: var(--mono); font-weight: 700; font-size: 12px; letter-spacing: 0.04em; padding: 0 22px; cursor: pointer; transition: background .15s; }
.subscribe button:hover { background: oklch(0.86 0.08 82); }
.subscribe .rss { display: flex; align-items: center; gap: 7px; padding: 0 16px; color: var(--mut); text-decoration: none; border-left: 1px solid var(--line); font-size: 12px; transition: color .15s; }
.subscribe .rss:hover { color: var(--accent); }

/* ---------------- index table ---------------- */
.section-head { display: flex; align-items: baseline; gap: 16px; padding: 48px 0 0; }
.section-head h2 { font-family: var(--sans); font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--fg-2); margin: 0; }
.section-head .l { flex: 1; height: 1px; background: var(--line); }
.section-head .c { font-size: 12px; color: var(--mut); }

.idx-head, .row {
  display: grid; grid-template-columns: 50px 104px 1fr 116px 66px; gap: 20px;
}
.idx-head { padding: 22px 0 13px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); border-bottom: 1px solid var(--line); }
.row { align-items: baseline; padding: 27px 0; border-bottom: 1px solid var(--line); text-decoration: none; color: inherit; transition: background .16s, padding-left .16s; }
.row:hover { background: oklch(1 0 0 / 0.018); padding-left: 10px; }
.row .num { font-size: 13px; color: var(--accent); }
.row .tag { font-size: 12px; color: var(--mut); }
.row .ttl { font-family: var(--serif); font-size: 23px; line-height: 1.2; font-weight: 400; letter-spacing: -0.005em; margin: 0 0 8px; transition: color .16s; }
.row:hover .ttl { color: var(--accent); }
.row .exc { font-family: var(--sans); font-size: 14px; line-height: 1.55; color: var(--mut); max-width: 580px; margin: 0; }
.row .date { font-size: 12.5px; color: var(--mut); }
.row .read { font-size: 12.5px; color: var(--mut); display: flex; align-items: center; gap: 6px; justify-content: flex-end; }

/* ---------------- footer ---------------- */
.foot { display: flex; align-items: center; justify-content: space-between; padding: 30px 0 56px; color: var(--mut); font-size: 12px; }
.foot .seg { display: flex; gap: 22px; }
.foot a { color: inherit; text-decoration: none; transition: color .15s; }
.foot a:hover { color: var(--accent); }

svg.ico { display: inline-block; vertical-align: -1px; }

/* ============================================================
   ARTICLE / reading page
   ============================================================ */
.article { max-width: 720px; margin: 0 auto; }

.back { display: inline-flex; align-items: center; gap: 8px; color: var(--mut); text-decoration: none; font-size: 12.5px; margin: 44px 0 0; transition: color .15s, gap .15s; }
.back:hover { color: var(--accent); gap: 11px; }

.art-head { padding: 30px 0 40px; border-bottom: 1px solid var(--line); }
.art-meta { display: flex; align-items: center; gap: 14px; font-size: 12.5px; color: var(--mut); margin-bottom: 24px; }
.art-meta .tag { color: var(--accent); border: 1px solid oklch(0.82 0.075 80 / 0.32); border-radius: 4px; padding: 4px 10px; letter-spacing: 0.04em; }
.art-meta .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--faint); }
.art-meta .m { display: inline-flex; align-items: center; gap: 6px; }
.art-title { font-family: var(--serif); font-weight: 430; font-size: clamp(38px, 5.4vw, 56px); line-height: 1.06; letter-spacing: -0.022em; margin: 0 0 22px; }
.art-deck { font-family: var(--sans); font-size: 19px; line-height: 1.6; color: var(--fg-2); margin: 0; }

.art-author { display: flex; align-items: center; gap: 12px; padding: 22px 0 0; font-size: 13px; color: var(--mut); }
.art-author .av { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(145deg, var(--accent), var(--accent-deep)); display: grid; place-items: center; color: oklch(0.20 0.03 80); font-weight: 700; font-size: 13px; font-family: var(--sans); }
.art-author b { color: var(--fg-2); font-weight: 600; font-family: var(--sans); }

/* prose */
.prose { font-family: var(--serif); color: var(--fg-2); font-size: 19.5px; line-height: 1.72; padding: 40px 0 0; }
.prose > * { max-width: 100%; }
.prose p { margin: 0 0 26px; }
.prose p .lead-cap::first-letter { } /* reserved */
.prose h2 { font-family: var(--sans); color: var(--fg); font-size: 15px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin: 50px 0 8px; display: flex; align-items: center; gap: 12px; }
.prose h2::before { content: ""; width: 14px; height: 1px; background: var(--accent); }
.prose h3 { font-family: var(--serif); color: var(--fg); font-size: 26px; font-weight: 500; letter-spacing: -0.01em; margin: 40px 0 12px; }
.prose a { color: var(--accent); text-decoration: none; border-bottom: 1px solid oklch(0.82 0.075 80 / 0.35); }
.prose a:hover { border-bottom-color: var(--accent); }
.prose strong { color: var(--fg); font-weight: 600; }
.prose em { font-style: italic; }
.prose ul { margin: 0 0 26px; padding: 0; list-style: none; }
.prose ul li { position: relative; padding-left: 26px; margin-bottom: 12px; }
.prose ul li::before { content: ""; position: absolute; left: 4px; top: 0.7em; width: 7px; height: 1px; background: var(--accent); }
.prose blockquote { margin: 34px 0; padding: 6px 0 6px 26px; border-left: 2px solid var(--accent); font-style: italic; color: var(--fg); font-size: 23px; line-height: 1.5; }

/* inline code */
.prose code { font-family: var(--mono); font-size: 0.82em; background: var(--panel2); color: var(--accent); padding: 2px 7px; border-radius: 4px; border: 1px solid var(--line); }

/* code block */
.code { margin: 32px 0; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--panel); }
.code-bar { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-bottom: 1px solid var(--line); font-family: var(--mono); font-size: 12px; color: var(--mut); }
.code-bar .dots { display: flex; gap: 6px; margin-right: 4px; }
.code-bar .dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--line); }
.code-bar .file { color: var(--fg-2); }
.code-bar .lang { margin-left: auto; color: var(--faint); letter-spacing: 0.06em; text-transform: uppercase; font-size: 10.5px; }
.code pre { margin: 0; padding: 20px 22px; overflow-x: auto; font-family: var(--mono); font-size: 13.5px; line-height: 1.7; color: var(--fg-2); }
.code pre code { background: none; border: 0; padding: 0; color: inherit; font-size: inherit; }
.tok-com { color: var(--t-com); font-style: italic; }
.tok-kw  { color: var(--t-kw); }
.tok-str { color: var(--t-str); }
.tok-num { color: var(--t-num); }
.tok-fn  { color: var(--t-fn); }
.tok-pun { color: var(--t-pun); }

/* callout */
.callout { display: flex; gap: 14px; margin: 32px 0; padding: 18px 20px; border: 1px solid var(--line); border-left: 2px solid var(--accent); border-radius: 6px; background: var(--accent-soft); font-family: var(--sans); font-size: 15.5px; line-height: 1.6; color: var(--fg-2); }
.callout .mk { color: var(--accent); font-family: var(--mono); font-weight: 600; flex: 0 0 auto; }

/* article footer: prev/next + subscribe */
.art-end { max-width: 720px; margin: 56px auto 0; padding-top: 30px; border-top: 1px solid var(--line); }
.next-card { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px 0 0; text-decoration: none; color: inherit; }
.next-card .lbl { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); margin-bottom: 8px; }
.next-card .nt { font-family: var(--serif); font-size: 23px; line-height: 1.2; transition: color .16s; }
.next-card:hover .nt { color: var(--accent); }
.next-card .arr { font-size: 22px; color: var(--mut); transition: transform .16s, color .16s; }
.next-card:hover .arr { color: var(--accent); transform: translateX(4px); }

.art-sub { max-width: 720px; margin: 40px auto 0; padding: 28px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); }
.art-sub h4 { font-family: var(--serif); font-size: 24px; font-weight: 400; margin: 0 0 6px; }
.art-sub p { font-family: var(--sans); font-size: 14.5px; color: var(--mut); margin: 0 0 18px; }

/* ============================================================
   NAV updates — right cluster + admin button
   ============================================================ */
.nav-right { display: flex; align-items: center; gap: 18px; }
.btn-admin { display: inline-flex; align-items: center; gap: 7px; padding: 7px 13px;
  border: 1px solid var(--line); border-radius: 5px; font-size: 12.5px; color: var(--mut);
  text-decoration: none; transition: color .15s, border-color .15s, background .15s; white-space: nowrap; }
.btn-admin:hover { color: var(--accent); border-color: oklch(0.82 0.075 80 / 0.4); background: var(--accent-soft); }
.btn-admin.active { color: var(--accent); border-color: oklch(0.82 0.075 80 / 0.5); background: var(--accent-soft); }

/* post page top bar */
.art-topbar { display: flex; align-items: center; justify-content: space-between; padding-top: 40px; }
.btn-pdf { display: inline-flex; align-items: center; gap: 7px; padding: 8px 15px;
  border: 1px solid var(--line); border-radius: 5px; font-family: var(--mono); font-size: 12px;
  color: var(--mut); background: transparent; cursor: pointer; transition: color .15s, border-color .15s, background .15s; }
.btn-pdf:hover { color: var(--accent); border-color: oklch(0.82 0.075 80 / 0.4); background: var(--accent-soft); }

/* ============================================================
   ADMIN — gestor de publicaciones
   ============================================================ */
.admin-shell { display: grid; grid-template-columns: 1fr 380px; gap: 32px; align-items: start; padding: 44px 0 60px; }

/* ---- list panel ---- */
.admin-list {}
.admin-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.admin-head h1 { font-family: var(--sans); font-size: 14px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--fg-2); margin: 0; }
.btn-new { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px;
  background: var(--accent); color: oklch(0.20 0.03 80); border: 0; border-radius: 6px;
  font-family: var(--mono); font-weight: 700; font-size: 12px; letter-spacing: 0.04em;
  cursor: pointer; transition: background .15s; }
.btn-new:hover { background: oklch(0.86 0.08 82); }

.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint);
  padding: 0 0 12px; text-align: left; border-bottom: 1px solid var(--line); font-weight: 500; }
.admin-table th:last-child { text-align: right; }
.admin-table td { padding: 18px 0; border-bottom: 1px solid var(--line-2); vertical-align: top; }
.admin-table td:last-child { text-align: right; white-space: nowrap; }
.admin-table tr:last-child td { border-bottom: none; }
.tbl-num { font-size: 12.5px; color: var(--accent); padding-right: 12px; }
.tbl-tag { font-size: 11.5px; color: var(--mut); padding-right: 16px; white-space: nowrap; }
.tbl-title { font-family: var(--serif); font-size: 18px; line-height: 1.2; margin: 0 0 4px; }
.tbl-date { font-size: 12px; color: var(--mut); }
.tbl-date2 { font-size: 12px; color: var(--mut); white-space: nowrap; }

/* status badges */
.badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: 0.06em;
  text-transform: uppercase; border-radius: 4px; padding: 4px 9px; font-weight: 600; white-space: nowrap; }
.badge-pub { color: oklch(0.82 0.075 80); background: oklch(0.82 0.075 80 / 0.10); border: 1px solid oklch(0.82 0.075 80 / 0.28); }
.badge-draft { color: var(--mut); background: oklch(1 0 0 / 0.03); border: 1px solid var(--line); }
.badge-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

/* row actions */
.row-actions { display: inline-flex; align-items: center; gap: 4px; }
.btn-row { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px;
  border: 1px solid transparent; border-radius: 6px; background: transparent; cursor: pointer;
  color: var(--mut); transition: color .14s, background .14s, border-color .14s; }
.btn-row:hover { border-color: var(--line); background: var(--panel); }
.btn-row.edit:hover { color: var(--accent); }
.btn-row.del:hover { color: oklch(0.65 0.18 22); }

/* ---- editor panel ---- */
.editor-panel { position: sticky; top: 24px; border: 1px solid var(--line); border-radius: 12px;
  background: var(--panel); padding: 28px; }
.editor-panel h2 { font-family: var(--sans); font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--fg-2); margin: 0 0 24px; display: flex; align-items: center; gap: 10px; }
.editor-panel h2 .ep-indicator { width: 7px; height: 7px; border-radius: 50%; background: var(--accent);
  box-shadow: 0 0 8px oklch(0.82 0.075 80 / 0.6); }
.form-row { margin-bottom: 18px; }
.form-row label { display: block; font-size: 11.5px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--faint); margin-bottom: 7px; }
.form-row input, .form-row select, .form-row textarea {
  width: 100%; background: oklch(1 0 0 / 0.03); border: 1px solid var(--line); border-radius: 6px;
  color: var(--fg); font-family: var(--mono); font-size: 13.5px; padding: 10px 13px;
  outline: none; transition: border-color .15s, box-shadow .15s; resize: none; }
.form-row input:focus, .form-row select:focus, .form-row textarea:focus {
  border-color: oklch(0.82 0.075 80 / 0.55); box-shadow: 0 0 0 3px oklch(0.82 0.075 80 / 0.08); }
.form-row select option { background: var(--bg); color: var(--fg); }
.form-row input::placeholder, .form-row textarea::placeholder { color: var(--faint); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-row textarea { min-height: 90px; line-height: 1.55; }
.form-row textarea.big { min-height: 130px; font-family: var(--mono); font-size: 13px; }

/* status toggle */
.status-toggle { display: flex; gap: 8px; }
.st-opt { flex: 1; }
.st-opt input[type=radio] { display: none; }
.st-opt label { display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 9px; border: 1px solid var(--line); border-radius: 6px; font-size: 12px; cursor: pointer;
  color: var(--mut); transition: all .14s; text-transform: uppercase; letter-spacing: 0.06em; }
.st-opt input[type=radio]:checked + label { border-color: oklch(0.82 0.075 80 / 0.5);
  color: var(--accent); background: var(--accent-soft); }

/* form actions */
.form-actions { display: flex; gap: 10px; margin-top: 22px; padding-top: 20px; border-top: 1px solid var(--line); }
.btn-publish { flex: 1; background: var(--accent); color: oklch(0.20 0.03 80); border: 0;
  border-radius: 7px; font-family: var(--mono); font-weight: 700; font-size: 12.5px;
  letter-spacing: 0.04em; padding: 12px; cursor: pointer; transition: background .15s; }
.btn-publish:hover { background: oklch(0.86 0.08 82); }
.btn-draft { flex: 1; background: transparent; color: var(--mut); border: 1px solid var(--line);
  border-radius: 7px; font-family: var(--mono); font-size: 12.5px; letter-spacing: 0.04em;
  padding: 12px; cursor: pointer; transition: all .15s; }
.btn-draft:hover { color: var(--fg); border-color: oklch(1 0 0 / 0.18); }
.btn-cancel { background: transparent; color: var(--faint); border: 0; font-family: var(--mono);
  font-size: 12px; cursor: pointer; padding: 8px; transition: color .14s; }
.btn-cancel:hover { color: var(--mut); }
0:{"P":null,"c":["","_not-found"],"q":"","i":false,"f":[[["",{"children":["/_not-found",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",16],[["$","$1","c",{"children":[[["$","script","script-0",{"src":"/44581626/_next/static/chunks/1vt-y__blxj6n.js","async":true,"nonce":"$undefined"}],["$","script","script-1",{"src":"/44581626/_next/static/chunks/14mrh2-p_w84d.js","async":true,"nonce":"$undefined"}]],["$","html",null,{"lang":"es","children":[["$","head",null,{"children":[["$","link",null,{"rel":"preconnect","href":"https://fonts.googleapis.com"}],["$","link",null,{"rel":"preconnect","href":"https://fonts.gstatic.com","crossOrigin":"anonymous"}],["$","link",null,{"href":"https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap","rel":"stylesheet"}],["$","link",null,{"href":"https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap","rel":"stylesheet"}],["$","link",null,{"href":"https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;1,400&display=swap","rel":"stylesheet"}],["$","style",null,{"dangerouslySetInnerHTML":{"__html":"$2"}}]]}],"$L3"]}]]}],{"children":["$L4",{"children":["$L5",{},null,false,null]},null,false,"$@6"]},null,false,null],"$L7",false]],"m":"$undefined","G":["$8",[]],"S":true,"h":null,"s":"$undefined","l":"$undefined","p":"$undefined","d":"$undefined","b":"cujaG1a1td1IwVO5cQbEQ"}
9:I[78990,["/44581626/_next/static/chunks/1vt-y__blxj6n.js","/44581626/_next/static/chunks/14mrh2-p_w84d.js"],"default"]
a:I[39756,["/44581626/_next/static/chunks/1vt-y__blxj6n.js","/44581626/_next/static/chunks/14mrh2-p_w84d.js"],"default"]
b:I[37457,["/44581626/_next/static/chunks/1vt-y__blxj6n.js","/44581626/_next/static/chunks/14mrh2-p_w84d.js"],"default"]
c:I[97367,["/44581626/_next/static/chunks/1vt-y__blxj6n.js","/44581626/_next/static/chunks/14mrh2-p_w84d.js"],"OutletBoundary"]
d:"$Sreact.suspense"
10:I[97367,["/44581626/_next/static/chunks/1vt-y__blxj6n.js","/44581626/_next/static/chunks/14mrh2-p_w84d.js"],"ViewportBoundary"]
12:I[97367,["/44581626/_next/static/chunks/1vt-y__blxj6n.js","/44581626/_next/static/chunks/14mrh2-p_w84d.js"],"MetadataBoundary"]
3:["$","body",null,{"children":[["$","$L9",null,{}],["$","$La",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],[]],"forbidden":"$undefined","unauthorized":"$undefined"}]]}]
4:["$","$1","c",{"children":[null,["$","$La",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$Lb",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}]
5:["$","$1","c",{"children":[[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":"$3:props:children:1:props:notFound:0:1:props:style","children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":"$3:props:children:1:props:notFound:0:1:props:children:props:children:1:props:style","children":404}],["$","div",null,{"style":"$3:props:children:1:props:notFound:0:1:props:children:props:children:2:props:style","children":["$","h2",null,{"style":"$3:props:children:1:props:notFound:0:1:props:children:props:children:2:props:children:props:style","children":"This page could not be found."}]}]]}]}]],null,["$","$Lc",null,{"children":["$","$d",null,{"name":"Next.MetadataOutlet","children":"$@e"}]}]]}]
f:[]
6:"$Wf"
7:["$","$1","h",{"children":[["$","meta",null,{"name":"robots","content":"noindex"}],["$","$L10",null,{"children":"$L11"}],["$","div",null,{"hidden":true,"children":["$","$L12",null,{"children":["$","$d",null,{"name":"Next.Metadata","children":"$L13"}]}]}],null]}]
11:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
e:null
13:[["$","title","0",{"children":"Mauro Armas | Blog Personal"}],["$","meta","1",{"name":"description","content":"Blog personal y portfolio enfocado en desarrollo de software y sistemas."}]]
