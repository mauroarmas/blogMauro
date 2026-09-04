const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// We want to add .wrap-wide
css = css.replace('.wrap { position: relative; z-index: 1; max-width: var(--maxw); margin: 0 auto; padding: 0 40px; }',
'.wrap { position: relative; z-index: 1; max-width: var(--maxw); margin: 0 auto; padding: 0 40px; }\n.wrap-wide { max-width: 1200px; }');

// We want to replace .article-split with .art-hero
css = css.replace(
`.article-split { max-width: 100%; display: grid; grid-template-columns: 1fr 1.3fr; gap: 48px; align-items: start; }
.art-gallery { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 24px; }
.art-content { max-width: 100%; min-width: 0; }`,
`.article-wide { max-width: 100%; }
.art-hero { display: grid; grid-template-columns: minmax(400px, 1fr) 1.2fr; gap: 56px; align-items: start; }
.art-gallery { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 24px; background: rgba(255,0,0,0.03); min-height: 200px; /* placeholder style just in case it's empty */ }
.art-header { max-width: 100%; min-width: 0; padding-bottom: 24px; border-bottom: 1px solid var(--line); margin-bottom: 40px; }
.prose-wide { max-width: 840px; margin: 0 auto; }`
);

css = css.replace(
`  .article-split { grid-template-columns: 1fr; }`,
`  .art-hero { grid-template-columns: 1fr; gap: 32px; }`
);

// We need to make sure the bottom border is gone from .art-head because we moved it to .art-header, or just leave it.
// Let's remove the border from .art-head if it's there
css = css.replace(
`.art-head { padding: 30px 0 40px; border-bottom: 1px solid var(--line); }`,
`.art-head { padding: 30px 0 0; }`
);

fs.writeFileSync('src/app/globals.css', css);
console.log("Updated globals.css");
