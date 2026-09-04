const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// 1. Increase .wrap-wide
css = css.replace(
  '.wrap-wide { max-width: 1200px; }',
  '.wrap-wide { max-width: 1360px; }'
);

// 2. Adjust .art-hero grid template columns (make left larger)
css = css.replace(
  '.art-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }',
  '.art-hero { display: grid; grid-template-columns: 1.4fr 1fr; gap: 64px; align-items: center; }'
);

// 3. Replace GALLERY CAROUSEL section
const oldCarousel = `/* ============================================================
   GALLERY CAROUSEL
   ============================================================ */
.gallery-carousel { display: flex; flex-direction: column; gap: 8px; }
.gallery-slide { width: 100%; }
.gallery-controls { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 12px; }
.btn-gal { background: var(--panel); border: 1px solid var(--line); border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--mut); transition: background 0.15s, border-color 0.15s, color 0.15s; }
.btn-gal:hover { background: var(--accent-soft); border-color: oklch(0.82 0.075 80 / 0.4); color: var(--accent); }
.gal-count { font-family: var(--mono); font-size: 11.5px; color: var(--mut); letter-spacing: 0.04em; }`;

const newCarousel = `/* ============================================================
   GALLERY CAROUSEL
   ============================================================ */
.gallery-carousel { position: relative; width: 100%; }
.gallery-slide { width: 100%; position: relative; background: var(--bg); cursor: zoom-in; }
.gallery-slide:fullscreen { display: flex; align-items: center; justify-content: center; padding: 40px; background: #000; }
.gallery-slide:fullscreen .case-image { margin: 0; width: 100%; max-width: 1600px; }
.gallery-slide:fullscreen .case-image img, .gallery-slide:fullscreen .case-image iframe { height: auto; max-height: 85vh; object-fit: contain; }
.gallery-slide:fullscreen figcaption { color: #fff; opacity: 0.8; font-size: 16px; margin-top: 16px; }

.btn-gal { position: absolute; top: 50%; transform: translateY(-50%); background: var(--panel); border: 1px solid var(--line); border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--mut); box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s; z-index: 10; }
.btn-gal:hover { background: var(--accent-soft); border-color: oklch(0.82 0.075 80 / 0.4); color: var(--accent); transform: translateY(-50%) scale(1.05); }
.btn-gal:active { transform: translateY(-50%) scale(0.95); }
.btn-gal-left { left: -22px; }
.btn-gal-right { right: -22px; }

.gal-count-floating { position: absolute; bottom: 16px; right: 16px; background: rgba(0,0,0,0.6); color: #fff; font-family: var(--mono); font-size: 11px; padding: 4px 10px; border-radius: 12px; letter-spacing: 0.04em; backdrop-filter: blur(4px); pointer-events: none; z-index: 10; }`;

css = css.replace(oldCarousel, newCarousel);

fs.writeFileSync('src/app/globals.css', css);
console.log("Updated globals.css part 3");
