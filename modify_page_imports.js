const fs = require('fs');
let c = fs.readFileSync('src/app/[lang]/page.js', 'utf8');

c = c.replace(
  "import { hasPublishedCaseStudy } from '@/lib/content';",
  "import { hasPublishedCaseStudy, getContentBySlug } from '@/lib/content';"
);

c = c.replace(
  `  const caseStudyFlags = proyectosOrdenados.map((p) =>
    p.hasCaseStudy ? hasPublishedCaseStudy(p.slug) : false
  );`,
  `  const caseStudyFlags = proyectosOrdenados.map((p) =>
    p.hasCaseStudy ? hasPublishedCaseStudy(p.slug) : false
  );

  const proyectosConThumbnail = proyectosOrdenados.map((p, i) => {
    let thumb = p.thumbnail;
    if (caseStudyFlags[i] && !thumb) {
      const result = getContentBySlug(p.slug, { locale: lang, type: 'caso_estudio' });
      if (result.found && result.content.images && result.content.images.length > 0) {
        const firstImg = result.content.images.find(img => !img.url.includes('loom.com'));
        if (firstImg) {
          thumb = firstImg.url;
        }
      }
    }
    return { ...p, thumbnail: thumb };
  });`
);

c = c.replace(
  `          <ProjectFilter projects={proyectosOrdenados} initialArea={undefined} dict={dict}>
            {proyectosOrdenados.map((project, i) => (`,
  `          <ProjectFilter projects={proyectosConThumbnail} initialArea={undefined} dict={dict}>
            {proyectosConThumbnail.map((project, i) => (`
);

fs.writeFileSync('src/app/[lang]/page.js', c);
console.log('Done!');
