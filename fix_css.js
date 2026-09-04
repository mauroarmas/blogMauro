const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// Replace article
css = css.replace('.article { max-width: 720px; margin: 0 auto; }',
`.article { max-width: 720px; margin: 0 auto; }
.article-split { max-width: 100%; display: grid; grid-template-columns: 1fr 1.3fr; gap: 48px; align-items: start; }
.art-gallery { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 24px; }
.art-content { max-width: 100%; min-width: 0; }`);

// Replace media query
css = css.replace('  .wrap { padding: 0 22px; }\r\n  .p-hero, .about { grid-template-columns: 1fr; gap: 30px; }',
`  .wrap { padding: 0 22px; }
  .article-split { grid-template-columns: 1fr; }
  .art-gallery { position: static; }
  .p-hero, .about { grid-template-columns: 1fr; gap: 30px; }`);

// Second attempt for media query with \n instead of \r\n
css = css.replace('  .wrap { padding: 0 22px; }\n  .p-hero, .about { grid-template-columns: 1fr; gap: 30px; }',
`  .wrap { padding: 0 22px; }
  .article-split { grid-template-columns: 1fr; }
  .art-gallery { position: static; }
  .p-hero, .about { grid-template-columns: 1fr; gap: 30px; }`);

fs.writeFileSync('src/app/globals.css', css);
