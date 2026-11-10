import test from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { temporaryStudio } from './helpers/studio.mjs';
const exec=promisify(execFile);
test('CLI diagnostica sin clave, rechaza asíncrono sin servidor y espera al guardar',async t=>{
  const {directory}=await temporaryStudio(t),env={...process.env,CV_STUDIO_DATA_DIR:directory,CV_PORT:'59998'};delete env.GEMINI_API_KEY;
  const command=(...args)=>exec(process.execPath,['generador/studio-cli.mjs',...args],{env,timeout:60000});
  const doctor=JSON.parse((await command('doctor','--json')).stdout);assert.equal(doctor.data.geminiKeyAvailable,false);assert.equal(doctor.data.serverRunning,false);
  await assert.rejects(command('offer','add','--text-file','/archivo-que-no-existe','--json'),error=>JSON.parse(error.stderr).error.code==='SERVER_REQUIRED_FOR_ASYNC');
  const result=JSON.parse((await command('sources','refresh','--wait','--json')).stdout);assert.equal(result.ok,true);assert.ok(result.data.snapshotId);
});

test('CLI comparte la instancia activa y una operación continúa en segundo plano',async t=>{
  const {startServer}=await import('../server.mjs');const {directory}=await temporaryStudio(t),app=await startServer({port:0,dataDirectory:directory});t.after(()=>app.close());const env={...process.env,CV_STUDIO_DATA_DIR:directory,CV_PORT:new URL(app.url).port};delete env.GEMINI_API_KEY;
  const command=async(...args)=>JSON.parse((await exec(process.execPath,['generador/studio-cli.mjs',...args,'--json'],{env,timeout:60000})).stdout);
  const submitted=await command('sources','refresh');assert.ok(submitted.operationId);let status;for(let i=0;i<100;i++){status=(await command('operation','status',submitted.operationId)).data;if(!['queued','running'].includes(status.state))break;}assert.equal(status.state,'succeeded');assert.ok(status.result.snapshotId);
});

for(const signal of ['SIGINT','SIGKILL'])test(`interrupción ${signal} permite reabrir la base temporal`,async t=>{
  const {spawn}=await import('node:child_process'),{access}=await import('node:fs/promises'),{DatabaseSync}=await import('node:sqlite'),{join}=await import('node:path');const {directory}=await temporaryStudio(t),env={...process.env,CV_STUDIO_DATA_DIR:directory,CV_PORT:'59996'};delete env.GEMINI_API_KEY;
  const child=spawn(process.execPath,['generador/studio-cli.mjs','sources','refresh','--wait','--json'],{env,stdio:'ignore'}),path=join(directory,'studio.sqlite');let interrupted=false;
  for(let i=0;i<200;i++){if(await access(path).then(()=>true,()=>false)){try{const db=new DatabaseSync(path,{readOnly:true}),running=db.prepare("SELECT count(*) n FROM operations WHERE state='running'").get().n;db.close();if(running){child.kill(signal);interrupted=true;break;}}catch{}}await new Promise(r=>setTimeout(r,10));}
  const exited=child.exitCode!==null||child.signalCode!==null?null:new Promise(resolve=>child.once('exit',resolve));if(exited)await exited;assert.equal(interrupted,true);
  const result=JSON.parse((await exec(process.execPath,['generador/studio-cli.mjs','sources','refresh','--wait','--json'],{env,timeout:60000})).stdout);assert.equal(result.ok,true);const db=new DatabaseSync(path,{readOnly:true});try{assert.ok(db.prepare("SELECT count(*) n FROM operations WHERE state='interrupted'").get().n>=1);}finally{db.close();}
});

test('CLI general versiona y recuperación offline valida la identidad',async t=>{
  const {join}=await import('node:path'),{readFile}=await import('node:fs/promises');const {directory}=await temporaryStudio(t),env={...process.env,CV_STUDIO_DATA_DIR:join(directory,'data'),CV_PORT:'59995'};delete env.GEMINI_API_KEY;const command=async(...args)=>JSON.parse((await exec(process.execPath,['generador/studio-cli.mjs',...args,'--json'],{env,timeout:60000})).stdout);
  const target=join(directory,'general.pdf');const generated=await exec(process.execPath,['generador/cli.mjs','--no-photo','--output',target],{env,timeout:60000});assert.equal((await readFile(target)).subarray(0,4).toString(),'%PDF');const version=generated.stdout.match(/Versión privada: ([0-9a-f-]+)/)?.[1];assert.ok(version);const historical=join(directory,'historical.pdf');await command('cv','download',version,'--output',historical);assert.deepEqual(await readFile(historical),await readFile(target));const file=join(directory,'backup.sqlite');await command('backup','export','--output',file,'--wait');const inspected=await command('backup','inspect','--file',file,'--wait');assert.ok(inspected.data.expectedDatasetId);await assert.rejects(command('recover','--file',file,'--expected-dataset','wrong','--confirm-replace','--wait'));const result=await command('recover','--file',file,'--expected-dataset',inspected.data.expectedDatasetId,'--confirm-replace','--wait');assert.equal(result.data.restored,true);
});
