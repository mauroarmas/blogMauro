import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { writeAtomic } from './lib/pdf.mjs';
import { PROJECT_ROOT, normalizeOptions } from './lib/content.mjs';
import { connectStudio } from './studio-cli.mjs';

try {
  const { values } = parseArgs({ options: {
    locale: { type: 'string', default: 'es' }, projects: { type: 'string' },
    'no-photo': { type: 'boolean', default: false }, 'portfolio-url': { type: 'string' }, output: { type: 'string' },
  } });
  const options = normalizeOptions({ locale: values.locale, photo: !values['no-photo'], portfolioUrl: values['portfolio-url'],
    ...(values.projects !== undefined ? { projects: values.projects.split(',').filter(Boolean) } : {}),
  });
  const path = resolve(PROJECT_ROOT, values.output || `output/pdf/CV-Mauro-Armas-${values.locale}.pdf`);
  if (!path.endsWith('.pdf')) throw new Error('El archivo de salida debe terminar en .pdf.');
  const server=await connectStudio({wait:true,createsOperation:true});
  try {
    const response=await fetch(server.url+'/api/pdf',{method:'POST',headers:{'Content-Type':'application/json','X-CV-Token':server.token,'Idempotency-Key':randomUUID()},body:JSON.stringify(options)});
    if(!response.ok){const problem=await response.json();throw new Error(problem.error?.message||'No se pudo generar el CV.');}
    const versionId=response.headers.get('x-cv-version-id'),pdf=Buffer.from(await response.arrayBuffer());
    const htmlResponse=await fetch(`${server.url}/api/v1/versions/${versionId}/html`);if(!htmlResponse.ok)throw new Error('No se pudo descargar la vista HTML guardada.');
    await writeAtomic(path,pdf);await writeAtomic(path.replace(/\.pdf$/,'.html'),Buffer.from(await htmlResponse.arrayBuffer()));
    console.log(`CV generado: ${path}\nVersión privada: ${versionId}\nVista HTML guardada junto al PDF.`);
  } finally {await server.close();}
} catch(error) {console.error(error.message);process.exitCode=1;}
