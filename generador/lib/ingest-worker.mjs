import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { PROJECT_ROOT } from './content.mjs';
import { restrictedEnvironment } from './config.mjs';
import { sha256 } from './schemas.mjs';
import { StudioError } from './errors.mjs';

const inside = (base,path) => { const rel=relative(base,path); return rel!=='' && !rel.startsWith('..') && !isAbsolute(rel); };
async function safeRead(root, rel) {
  const path = await realpath(resolve(root, rel));
  const contentRoot=await realpath(resolve(root,'src/content'));
  if (!inside(root,path) || !inside(contentRoot,path)) throw new StudioError('SOURCE_INVALID','Una fuente profesional apunta fuera del catálogo autorizado.',{status:422});
  return readFile(path);
}
function runWorker(dir, files) {
  return new Promise((resolvePromise,reject) => {
    execFile(process.execPath,[new URL(import.meta.url).pathname,'--evaluate',dir,JSON.stringify(files)],{env:restrictedEnvironment(),timeout:30000,maxBuffer:4*1024*1024,encoding:'utf8'},(error,stdout)=>{
      if(error) return reject(new StudioError('SOURCE_UNREADABLE','No se pudieron evaluar las fuentes profesionales.',{status:422}));
      try { resolvePromise(JSON.parse(stdout)); } catch { reject(new StudioError('SOURCE_UNREADABLE','Las fuentes devolvieron datos inválidos.',{status:422})); }
    });
  });
}

/** Copia solamente módulos profesionales autorizados, conservando imports relativos. */
export async function captureModules({ root = PROJECT_ROOT } = {}) {
  const actualRoot=await realpath(root);
  const folder=await realpath(resolve(actualRoot,'src/content'));
  if(!inside(actualRoot,folder)) throw new StudioError('SOURCE_INVALID','El contenido está fuera del proyecto.',{status:422});
  const index='src/content/casos/index.js';
  const indexBytes=await safeRead(actualRoot,index);
  const imported=[...indexBytes.toString('utf8').matchAll(/\bimport\s+[^;\n]*?from\s*['"]\.\/([a-z0-9-]+\.js)['"]/gi)].map(m=>`src/content/casos/${m[1]}`);
  const files=['src/content/perfil.js','src/content/proyectos.js','src/content/formacion.js','src/content/stack.js',index,...new Set(imported)];
  const temp=await mkdtemp(join(tmpdir(),'cv-studio-ingest-'));
  try {
    const snapshots=[];
    for(const path of files){
      const bytes=path===index?indexBytes:await safeRead(actualRoot,path);
      if(bytes.length>2*1024*1024) throw new StudioError('INPUT_LIMIT','Un módulo profesional supera 2 MiB.',{status:422});
      const dest=join(temp,path);await mkdir(dirname(dest),{recursive:true,mode:0o700});await writeFile(dest,bytes,{mode:0o600});
      snapshots.push({path,bytes,sha256:sha256(bytes)});
    }
    await writeFile(join(temp,'package.json'),'{"type":"module"}',{mode:0o600});
    const data=await runWorker(temp,imported);
    for(const snap of snapshots){
      if(sha256(await safeRead(actualRoot,snap.path))!==snap.sha256) throw new StudioError('SOURCE_CHANGED','Una fuente cambió durante la lectura; volvé a intentar.',{status:409});
    }
    return {files:snapshots,data};
  } finally { await rm(temp,{recursive:true,force:true}); }
}

if(process.argv[2]==='--evaluate'){
  const dir=process.argv[3], files=JSON.parse(process.argv[4]);
  const load=async p=>import(pathToFileURL(join(dir,p)).href);
  const [profile,projects,education,skills]=await Promise.all(['perfil','proyectos','formacion','stack'].map(n=>load(`src/content/${n}.js`)));
  const cases=await Promise.all(files.map(async path=>({path,content:(await load(path)).default})));
  process.stdout.write(JSON.stringify({profile:{es:profile.getPerfil('es'),en:profile.getPerfil('en')},projects:projects.proyectos,education:education.formacion,skills:{items:skills.stack,layers:skills.STACK_LAYERS},cases}));
}
