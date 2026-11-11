import { parseArgs } from 'node:util';
import { access, readFile, rename, rm, stat } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
import { startServer } from './server.mjs';
import { writeAtomic } from './lib/pdf.mjs';
import { PROJECT_ROOT } from './lib/content.mjs';
import { recoverOffline } from './lib/recovery.mjs';

async function doctor() {
  const executable=(name,args)=>{try{execFileSync(name,args,{stdio:'ignore',timeout:5000});return true;}catch{return false;}};
  const browser=await access(chromium.executablePath()).then(()=>true,()=>false);
  const running=Boolean(await findServer(`http://127.0.0.1:${Number(process.env.CV_PORT||4317)}`));
  let schema='not_initialized';const path=resolve(process.env.CV_STUDIO_DATA_DIR||resolve(PROJECT_ROOT,'.cv-studio'),'studio.sqlite');
  try {await access(path);const db=new DatabaseSync(path,{readOnly:true});try{schema=db.prepare('PRAGMA user_version').get().user_version===2?'compatible':'unsupported';}finally{db.close();}}catch(error){if(error.code!=='ENOENT')schema='unavailable';}
  return {node:process.version,chromium:browser,pdfinfo:executable('pdfinfo',['-v']),pdftotext:executable('pdftotext',['-v']),schema,serverRunning:running,geminiKeyAvailable:Boolean(process.env.GEMINI_API_KEY)};
}
export async function findServer(url) {
  try {const response=await fetch(`${url}/api/v1/session`,{signal:AbortSignal.timeout(1000)});if(!response.ok)return null;const session=await response.json();return typeof session.token==='string'?{url,token:session.token}:null;}catch{return null;}
}
export async function connectStudio({wait=false,createsOperation=false}={}) {
  let server=await findServer(`http://127.0.0.1:${Number(process.env.CV_PORT||4317)}`),app;
  if(!server&&createsOperation&&!wait)throw Object.assign(new Error('Iniciá CV Studio o agregá --wait para ejecutar sin servidor.'),{exitCode:3,code:'SERVER_REQUIRED_FOR_ASYNC'});
  if(!server){app=await startServer({port:0});server=await findServer(app.url);}
  if(!server)throw new Error('No se pudo conectar a CV Studio.');
  return {...server,close:async()=>{if(app)await app.close();}};
}
async function request(server,path,{method='GET',json,body,headers={}}={}){
  const h={'X-CV-Token':server.token,...headers};if(json!==undefined){h['Content-Type']='application/json';body=JSON.stringify(json);}
  const response=await fetch(server.url+'/api/v1'+path,{method,headers:h,body,...(body instanceof Readable?{duplex:'half'}:{})});
  if(!response.ok){const problem=await response.json().catch(()=>({}));throw Object.assign(new Error(problem.error?.message||'No se pudo completar la solicitud.'),{exitCode:response.status===429?4:3,code:problem.error?.code});}
  return response;
}
async function operation(server,path,{json,body,wait}){
  const response=await request(server,path,{method:'POST',json,body,headers:{'Idempotency-Key':randomUUID()}}),started=await response.json();
  if(!wait)return {ok:true,data:started,operationId:started.operationId};
  let result;do{await new Promise(resolvePromise=>setTimeout(resolvePromise,100));try{result=await(await request(server,'/operations/'+started.operationId)).json();}catch(error){if(error.code==='MAINTENANCE'){result={state:'running'};continue;}throw error;}}while(['queued','running'].includes(result.state));
  if(result.state!=='succeeded')throw Object.assign(new Error(`No se completó la operación (${result.errorCode||result.state}).`),{exitCode:result.errorCode?.includes('AI')||result.errorCode==='BUDGET_EXCEEDED'?4:5,code:result.errorCode});
  return {ok:true,data:result.result,operationId:started.operationId};
}
export async function runCli(args=process.argv.slice(2)) {
  const {values,positionals}=parseArgs({args,allowPositionals:true,options:{json:{type:'boolean'},wait:{type:'boolean'},file:{type:'string'},'text-file':{type:'string'},url:{type:'string'},'expected-dataset':{type:'string'},'confirm-replace':{type:'boolean'},analysis:{type:'string'},draft:{type:'string'},revision:{type:'string'},locale:{type:'string'},output:{type:'string'}}});
  if(positionals[0]==='doctor'&&positionals.length===1)return {ok:true,data:await doctor()};
  const [group,action,id]=positionals;
  if(group==='recover'){
    if(!values.file||!values['expected-dataset']||!values['confirm-replace']||!values.wait)throw Object.assign(new Error('Recuperar requiere --file, --expected-dataset, --confirm-replace y --wait.'),{exitCode:2});
    const data=await recoverOffline({file:resolve(values.file),expectedDatasetId:values['expected-dataset'],confirmation:true,dataDirectory:process.env.CV_STUDIO_DATA_DIR});return {ok:true,data};
  }
  const isOperation=(group==='offer'&&['add','analyze'].includes(action))||(group==='cv'&&['adapt','render'].includes(action))||(group==='sources'&&action==='refresh')||(group==='backup'&&['export','inspect','restore'].includes(action));
  const allowed=isOperation||(group==='cv'&&action==='download')||(group==='operation'&&['status','cancel'].includes(action))||(group==='backup'&&action==='download');
  if(!allowed)throw Object.assign(new Error('Comando no disponible.'),{exitCode:2,code:'INVALID_INPUT'});
  const server=await connectStudio({wait:Boolean(values.wait),createsOperation:isOperation});
  try {
    if(group==='operation'){
      if(!id)throw Object.assign(new Error('Falta el ID de operación.'),{exitCode:2});
      const data=await(await request(server,`/operations/${encodeURIComponent(id)}${action==='cancel'?'/cancel':''}`,{method:action==='cancel'?'POST':'GET'})).json();return {ok:true,data};
    }
    if(group==='sources')return await operation(server,'/sources/refresh',{json:{},wait:values.wait});
    if(group==='backup'&&action==='download'){
      if(!id||!values.output)throw Object.assign(new Error('Indicá el ID y --output PATH.'),{exitCode:2});
      const response=await request(server,`/backups/${encodeURIComponent(id)}/download`),target=resolve(values.output),temporary=`${target}.${randomUUID()}.tmp`;
      try{await pipeline(Readable.fromWeb(response.body),createWriteStream(temporary,{flags:'wx',mode:0o600}));await rename(temporary,target);}finally{await rm(temporary,{force:true});}
      return {ok:true,data:{backupId:id,output:target}};
    }
    if(group==='backup'&&action==='export'){
      if(!values.output)throw Object.assign(new Error('Indicá --output PATH.'),{exitCode:2});
      const result=await operation(server,'/backups',{json:{},wait:values.wait});
      if(!values.wait)return {...result,data:{...result.data,downloadCommand:`backup download BACKUP_ID --output ${values.output}`}};
      const response=await request(server,`/backups/${encodeURIComponent(result.data.backupId)}/download`),target=resolve(values.output),temporary=`${target}.${randomUUID()}.tmp`;
      try{await pipeline(Readable.fromWeb(response.body),createWriteStream(temporary,{flags:'wx',mode:0o600}));await rename(temporary,target);}finally{await rm(temporary,{force:true});}
      return {...result,data:{...result.data,output:target}};
    }
    if(group==='backup'&&(action==='inspect'||action==='restore')){
      if(!values.file)throw Object.assign(new Error('Indicá --file PATH.'),{exitCode:2});
      if(action==='restore'&&(!values['expected-dataset']||!values['confirm-replace']))throw Object.assign(new Error('Restaurar requiere --expected-dataset y --confirm-replace.'),{exitCode:2});
      const path=resolve(values.file),info=await stat(path);if(!info.isFile()||info.size>512*1024*1024)throw Object.assign(new Error('La copia no es válida o supera 512 MiB.'),{exitCode:2});
      const inspected=await operation(server,'/backups/restore-preview',{body:createReadStream(path),wait:action==='restore'||values.wait});
      if(action==='inspect')return inspected;
      if(inspected.data.expectedDatasetId!==values['expected-dataset'])throw Object.assign(new Error('La identidad del conjunto local cambió.'),{exitCode:3,code:'REVISION_CONFLICT'});
      return await operation(server,'/backups/restore',{json:{validationOperationId:inspected.data.validationOperationId,expectedDatasetId:values['expected-dataset'],confirmation:true},wait:values.wait});
    }
    if(group==='offer'&&action==='add'){
      if(Boolean(values.file)===Boolean(values['text-file']))throw Object.assign(new Error('Indicá --file o --text-file.'),{exitCode:2});
      const path=values.file||values['text-file'],bytes=await readFile(path),form=new FormData();
      if(values['text-file'])form.set('text',new TextDecoder('utf-8',{fatal:true}).decode(bytes));
      else{const type=extname(path).toLowerCase()==='.pdf'?'application/pdf':'text/plain';form.set('file',new Blob([bytes],{type}),path.split('/').at(-1));}
      if(values.url)form.set('sourceUrl',values.url);return await operation(server,'/opportunities/import',{body:form,wait:values.wait});
    }
    if(group==='offer'&&action==='analyze'){
      if(!id)throw Object.assign(new Error('Falta el ID de oferta.'),{exitCode:2});
      const offer=await(await request(server,'/opportunities/'+encodeURIComponent(id))).json(),prefs=await(await request(server,'/preferences')).json();
      return await operation(server,`/opportunities/${encodeURIComponent(id)}/analyses`,{json:{offerRevisionId:offer.revisionId,preferencesRevisionId:prefs.revisionId},wait:values.wait});
    }
    if(group==='cv'&&action==='adapt'){
      if(!values.analysis)throw Object.assign(new Error('Indicá --analysis ID.'),{exitCode:2});return await operation(server,'/drafts',{json:{analysisId:values.analysis,locale:values.locale||'es',photo:true},wait:values.wait});
    }
    if(group==='cv'&&action==='render'){
      const revision=Number(values.revision);if(!values.draft||!Number.isSafeInteger(revision)||revision<1)throw Object.assign(new Error('Indicá --draft ID y --revision N.'),{exitCode:2});return await operation(server,'/versions',{json:{draftId:values.draft,expectedDraftRevision:revision},wait:values.wait});
    }
    if(group==='cv'&&action==='download'){
      if(!id||!values.output)throw Object.assign(new Error('Indicá el ID y --output PATH.'),{exitCode:2});const response=await request(server,`/versions/${encodeURIComponent(id)}/pdf`),bytes=Buffer.from(await response.arrayBuffer());await writeAtomic(resolve(values.output),bytes);return {ok:true,data:{versionId:id,output:resolve(values.output),sha256:response.headers.get('x-cv-sha256')}};
    }
    throw Object.assign(new Error('Comando no disponible.'),{exitCode:2});
  } finally {await server.close();}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const json=process.argv.includes('--json');
  try {const result=await runCli();console.log(JSON.stringify(result,null,json?0:2));}
  catch(error){console.error(json?JSON.stringify({ok:false,error:{code:error.code||'COMMAND_FAILED',message:error.message}}):error.message);process.exitCode=error.exitCode||5;}
}
