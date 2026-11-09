import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { generatePdf, writeAtomic } from './lib/pdf.mjs';
import { PROJECT_ROOT } from './lib/content.mjs';

try {
  const { values } = parseArgs({ options: {
    locale: { type: 'string', default: 'es' }, projects: { type: 'string' },
    'no-photo': { type: 'boolean', default: false }, 'portfolio-url': { type: 'string' }, output: { type: 'string' },
  } });
  const options = { locale: values.locale, photo: !values['no-photo'], portfolioUrl: values['portfolio-url'],
    ...(values.projects !== undefined ? { projects: values.projects.split(',').filter(Boolean) } : {}),
  };
  const result = await generatePdf(options);
  const path = resolve(PROJECT_ROOT, values.output || `output/pdf/CV-Mauro-Armas-${values.locale}.pdf`);
  if (!path.endsWith('.pdf')) throw new Error('El archivo de salida debe terminar en .pdf.');
  await writeAtomic(path, result.pdf);
  await writeAtomic(path.replace(/\.pdf$/, '.html'), result.html);
  console.log(`CV generado: ${path}\n${result.pages} páginas · contenido ${result.revision}\nVista HTML guardada junto al PDF.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
