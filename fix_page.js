const fs = require('fs');
let c = fs.readFileSync('src/app/[lang]/proyectos/[slug]/page.js', 'utf8');

c = c.replace(
`          </div>

          <div className="prose prose-wide">`,
`          </div>
        </div>

        <div className="prose prose-wide">`
);

fs.writeFileSync('src/app/[lang]/proyectos/[slug]/page.js', c);
