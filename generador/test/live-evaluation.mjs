// Optativo: consume la cuota configurada y guarda diez ofertas reales en la base local.
// Uso: CV_STUDIO_LIVE_EVAL=1 node generador/test/live-evaluation.mjs /ruta/lista.json
// La lista debe contener exactamente diez rutas a archivos de texto de ofertas.
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runCli } from '../studio-cli.mjs';
if(process.env.CV_STUDIO_LIVE_EVAL!=='1'||!process.env.GEMINI_API_KEY||process.argv.length!==3){
  console.error('Evaluación deshabilitada: indicá CV_STUDIO_LIVE_EVAL=1, GEMINI_API_KEY y una lista JSON de diez archivos. Configurá antes el modelo, consentimiento y límites en el panel.');process.exit(2);
}
const files=JSON.parse(await readFile(resolve(process.argv[2]),'utf8'));
if(!Array.isArray(files)||files.length!==10||files.some(path=>typeof path!=='string'||!path.trim()))throw Error('Se requieren exactamente diez rutas de ofertas.');
for(const file of files){const info=await stat(resolve(file));if(!info.isFile()||info.size>100000)throw Error('Una oferta no es válida o supera el límite.');}
const results=[];
for(const file of files){const start=Date.now();try{
  const added=await runCli(['offer','add','--text-file',resolve(file),'--wait']);
  const analyzed=await runCli(['offer','analyze',added.data.opportunityId,'--wait']);
  const adapted=await runCli(['cv','adapt','--analysis',analyzed.data.analysisId,'--wait']);
  results.push({opportunityId:added.data.opportunityId,analysisId:analyzed.data.analysisId,draftId:adapted.data.draftId,elapsedMs:Date.now()-start,generated:true});
}catch(error){results.push({elapsedMs:Date.now()-start,generated:false,errorCode:error.code||'FAILED'});}}
const completed=results.filter(r=>r.generated&&r.elapsedMs<300000).length;
console.log(JSON.stringify({completedWithinFiveMinutes:completed,technicalTarget:completed>=9,quality:'pending_owner_review',results},null,2));
