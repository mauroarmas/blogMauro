const fs = require('fs');
let c = fs.readFileSync('src/app/[lang]/proyectos/[slug]/page.js', 'utf8');

c = c.replace(
  "import CaseStudyImage from '@/components/CaseStudyImage';",
  "import CaseStudyImage from '@/components/CaseStudyImage';\nimport GalleryCarousel from '@/components/GalleryCarousel';"
);

c = c.replace(
  `        <aside className="art-gallery">\n          {content.images?.map((img) => (\n            <CaseStudyImage key={img.url} url={img.url} alt={img.alt} />\n          ))}\n        </aside>`,
  `        <aside className="art-gallery">\n          <GalleryCarousel images={content.images} />\n        </aside>`
);

fs.writeFileSync('src/app/[lang]/proyectos/[slug]/page.js', c);
