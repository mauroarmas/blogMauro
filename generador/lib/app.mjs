import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { mkdir, chmod, lstat, realpath, rm, readdir, stat } from 'node:fs/promises';
import { join, relative, isAbsolute } from 'node:path';
import { openStudioDatabase } from './db.mjs';
import { Operations } from './operations.mjs';
import { getPreferences } from './preferences.mjs';
import { captureKnowledgeSnapshot } from './sources.mjs';
import { extractDocument } from './documents.mjs';
import { identifyOfferOrigin } from './offer-origin.mjs';
import { saveOfferRevision } from './opportunities.mjs';
import { analyzeOpportunity } from './matching.mjs';
import { createGeneralDraft, createAdaptedDraft } from './adaptation.mjs';
import { createVersion } from './versions.mjs';
import { createGeminiProvider, executeGeminiStep } from './providers/gemini.mjs';
import { getAiSettings, markAiValidated } from './providers/budget.mjs';
import { StudioError } from './errors.mjs';
import { exportBackup, inspectBackup, prepareRestore } from './backup.mjs';

/** Transporte y CLI comparten esta instancia propietaria y sus servicios. */
export async function createStudio(options = {}) {
  const storage=await openStudioDatabase(options);
  try {
    const db=new Proxy({}, {get(_target,key){const value=storage.db[key];return typeof value==='function'?value.bind(storage.db):value;}});getPreferences(db);
    const state={maintenance:false};
    const backupDir=join(storage.directory,'backups'),stagingDir=join(storage.directory,'staging'),recoveryDir=join(storage.directory,'recovery');
    for(const dir of [backupDir,stagingDir,recoveryDir]){await mkdir(dir,{recursive:true,mode:0o700});if((await lstat(dir)).isSymbolicLink())throw new StudioError('INVALID_INPUT','Una carpeta privada no puede ser un enlace simbólico.');const rel=relative(storage.directory,await realpath(dir));if(!rel||rel.startsWith('..')||isAbsolute(rel))throw new StudioError('INVALID_INPUT','Una carpeta privada está fuera del directorio de datos.');await chmod(dir,0o700);}
    const stagedPath=id=>{if(!/^[0-9a-f-]{36}$/i.test(id))throw new StudioError('INVALID_INPUT','Identificador de copia no válido.');return join(stagingDir,id+'.sqlite');};
    const maxAge=24*60*60*1000;
    for(const dir of [backupDir,stagingDir])for(const name of await readdir(dir)){if(!/^[0-9a-f-]{36}\.sqlite$/i.test(name))continue;const path=join(dir,name),info=await lstat(path);if(info.isFile()&&Date.now()-info.mtimeMs>maxAge)await rm(path,{force:true});}
    const requireStaged=async id=>{const path=stagedPath(id);let info;try{info=await lstat(path);}catch{throw new StudioError('NOT_FOUND','La copia ya no está disponible.',{status:404});}if(!info.isFile()||Date.now()-info.mtimeMs>maxAge){if(info.isFile())await rm(path,{force:true});throw new StudioError('NOT_FOUND','La copia ya no está disponible.',{status:404});}return path;};
    const provider=()=>options.provider||createGeminiProvider();
    const keyAvailable=options.provider?true:undefined;
    const handlers={
      'backup.export':async (_input,{progress})=>{
        state.maintenance=true;
        try{progress({phase:'backup'});const backupId=randomUUID();const result=await exportBackup(storage.db,join(backupDir,backupId+'.sqlite'));return {backupId,sha256:result.sha256,byteLength:result.byteLength};}
        finally{state.maintenance=false;}
      },
      'backup.inspect':async (input,{id,progress})=>{
        progress({phase:'validating'});const path=await requireStaged(input.stagingId);
        try{const result=await inspectBackup(path);return {...result,validationOperationId:id,expectedDatasetId:db.prepare('SELECT dataset_id FROM schema_metadata').get().dataset_id};}
        catch(error){await rm(path,{force:true});throw error;}
      },
      'backup.restore':async (input,{id,progress})=>{
        if(input.confirmation!==true)throw new StudioError('INVALID_INPUT','Confirmá el reemplazo del conjunto local.');
        const validation=db.prepare("SELECT * FROM operations WHERE id=? AND kind='backup.inspect' AND state='succeeded'").get(input.validationOperationId);
        if(!validation)throw new StudioError('INVALID_STATE','La copia debe inspeccionarse antes de restaurar.',{status:409});
        const staged=JSON.parse(validation.input_manifest),inspected=JSON.parse(validation.result_refs);
        if(inspected.expectedDatasetId!==input.expectedDatasetId)throw new StudioError('REVISION_CONFLICT','El alcance de restauración cambió.',{status:409});
        state.maintenance=true;
        try{
          progress({phase:'preparing'});
          await exportBackup(storage.db,join(recoveryDir,randomUUID()+'.sqlite'));
          const prepared=await prepareRestore({storage,sourcePath:await requireStaged(staged.stagingId),expectedHash:inspected.sha256,expectedDatasetId:input.expectedDatasetId,operationId:id});
          progress({phase:'replacing'});await storage.replaceWith(prepared.preparedPath);await rm(stagedPath(staged.stagingId),{force:true});
          return {restored:true,datasetId:prepared.inspection.datasetId,requiresReconciliation:true};
        } finally {state.maintenance=false;}
      },
      'sources.refresh':async (_input,{signal,progress})=>{
        if(signal.aborted) throw new Error('Cancelado');progress({phase:'reading'});
        const result=await captureKnowledgeSnapshot(db,{root:options.root});if(signal.aborted)throw new Error('Cancelado');return result;
      },
      'offer.import':async (input,{signal,progress})=>{
        if(signal.aborted)throw new Error('Cancelado');progress({phase:'reading'});
        const bytes=Buffer.from(input.bytes,'base64'),doc=await extractDocument(bytes,{type:input.mediaType,kind:'offer'});
        if(signal.aborted)throw new Error('Cancelado');
        const identity=identifyOfferOrigin(input.sourceUrl,{sourceKind:input.sourceKind});
        return saveOfferRevision(db,{identity,originalBytes:bytes,text:doc.text,mediaType:input.mediaType});
      },
      'offer.analyze':async (input,context)=>analyzeOpportunity({db,provider:provider(),operationId:context.id,...input,signal:context.signal,progress:context.progress,keyAvailable,root:options.root}),
      'draft.create':async (input,context)=>{
        const draft=input.general?await createGeneralDraft(db,input.options,{root:options.root}):await createAdaptedDraft({db,provider:provider(),operationId:context.id,analysisId:input.analysisId,options:input.options,signal:context.signal,keyAvailable,root:options.root});
        return {draftId:draft.id};
      },
      'version.create':async (input,context)=>createVersion(db,{operationId:context.id,...input,root:options.root,signal:context.signal}),
      'pdf.general':async (input,context)=>{
        const draft=await createGeneralDraft(db,input.options,{root:options.root});
        return createVersion(db,{operationId:context.id,draftId:draft.id,expectedDraftRevision:draft.revision,root:options.root,signal:context.signal});
      },
      'ai.validate':async (_input,context)=>{
        const settings=getAiSettings(db,{keyAvailable});
        if(!settings.config)throw new StudioError('AI_CONFIGURATION_REQUIRED','Configurá el proveedor antes de validar.',{status:409});
        const outputSchema=z.strictObject({ok:z.boolean()});
        const result=await executeGeminiStep({db,provider:provider(),operationId:context.id,input:{test:'Responde con ok verdadero.'},systemInstruction:'Devolvé solo el JSON solicitado.',jsonSchema:z.toJSONSchema(outputSchema),outputSchema,signal:context.signal,allowValidation:true,keyAvailable});
        if(!result.data.ok)throw new StudioError('MODEL_NOT_VALIDATED','El modelo no superó la prueba.',{status:422});
        markAiValidated(db,settings.config.id,context.id);return {validated:true};
      },
    };
    const operations=new Operations(db,{handlers});
    return {db,operations,backupDir,stagingDir,get maintenance(){return state.maintenance;},health(){const row=db.prepare('SELECT dataset_id,schema_version FROM schema_metadata').get();return {state:'ready',datasetId:row.dataset_id,schemaVersion:row.schema_version};},async close(){await operations.close();await storage.close();}};
  } catch(error) {await storage.close();throw error;}
}
