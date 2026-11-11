import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

test('exportación estática excluye datos y rutas privadas',async t=>{
  const root=join(process.cwd(),'out');if(!await access(root).then(()=>true,()=>false)){t.skip('Ejecutá npm run build -- --webpack para verificar la exportación.');return;}
  const files=[];async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const path=join(dir,item.name);if(item.isDirectory())await walk(path);else files.push(path);}}await walk(root);
  const paths=files.map(p=>p.slice(root.length));assert.ok(paths.some(p=>p==='/es.html'||p==='/es/index.html'));assert.ok(!paths.some(p=>/\.sqlite(?:-wal|-shm)?$|\.cv-studio|\/api\/v1\/|\/assets\/studio\.(?:js|html|css)$/i.test(p)));
  for(const path of files.filter(p=>/\.html$/.test(p))){const content=await readFile(path,'utf8');assert.doesNotMatch(content,/GEMINI_API_KEY|\.cv-studio\/studio\.sqlite|\/api\/v1\/owner-evidence/);}
});
