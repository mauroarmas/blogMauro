const fs = require('fs');

const path = 'src/app/[lang]/proyectos/[slug]/page.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('<div className="wrap">', '<div className="wrap wrap-wide">');

content = content.replace('<article className="article article-split">', '<article className="article article-wide">');

// We need to change:
// <aside className="art-gallery">...</aside>
// <div className="art-content">
//   <div className="art-topbar">...</div>
//   ...
//   <header className="art-head">...</header>
//   <div className="prose">...</div>
// </div>
//
// to:
// <div className="art-hero">
//   <aside className="art-gallery">...</aside>
//   <div className="art-header">
//     <div className="art-topbar">...</div>
//     ...
//     <header className="art-head">...</header>
//   </div>
// </div>
// <div className="prose prose-wide">...</div>

content = content.replace(
  '<aside className="art-gallery">',
  '<div className="art-hero">\n          <aside className="art-gallery">'
);

content = content.replace(
  '<div className="art-content">',
  '<div className="art-header">'
);

content = content.replace(
  '<div className="prose">',
  '</div>\n\n          <div className="prose prose-wide">'
);

// We added <div className="art-hero"> so we have an extra closing div to remove?
// Original:
//         <div className="prose">
//           ...
//         </div>
//       </article>
// Wait! Previously, .prose was INSIDE .art-content.
// By replacing `<div className="prose">` with `</div>\n<div className="prose prose-wide">`, we are closing `.art-header`.
// Then `.prose` is closed.
// But `.art-hero` also needs to be closed. So we should do:
// `</div>\n        </div>\n\n        <div className="prose prose-wide">`
// Let's refine the replacement:

content = content.replace(
  '          <div className="prose">',
  '          </div>\n        </div>\n\n        <div className="prose prose-wide">'
);

// Then at the end, we had:
//           </div>
//         </div>
//       </article>
// Because `.art-content` was closed. But we already closed `.art-header` and `.art-hero` before `.prose`!
// So `.prose` is now closed, but we don't need the extra `</div>` that used to close `.art-content`.
content = content.replace(
  '            </ReactMarkdown>\n          </div>\n        </div>\n      </article>',
  '            </ReactMarkdown>\n          </div>\n      </article>'
);

fs.writeFileSync(path, content);
console.log("Rewrite done!");
