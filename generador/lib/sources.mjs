import { randomUUID } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { PROJECT_ROOT } from './content.mjs';
import { captureModules } from './ingest-worker.mjs';
import { extractDocument } from './documents.mjs';
import { transaction } from './db.mjs';
import { putArtifact } from './artifacts.mjs';
import { canonicalJson, sha256 } from './schemas.mjs';
import { StudioError } from './errors.mjs';

const asBytes = value => Buffer.from(typeof value === 'string' ? value : canonicalJson(value));
const contained = (parent,path) => {const part=relative(parent,path);return part!=='' && !part.startsWith('..') && !isAbsolute(part);};
function fragments(value, locator = '$', out = []) {
  if (typeof value === 'string' && value.trim()) {
    for (let pos=0; pos<value.length; pos+=1200) out.push({ text:value.slice(pos,pos+1200), locator:{field:locator,offset:pos}, classification: /interes|interest/i.test(locator)?'interest':'fact' });
  } else if (Array.isArray(value)) value.forEach((v,i)=>fragments(v,`${locator}[${i}]`,out));
  else if (value && typeof value==='object') for(const [key,v] of Object.entries(value)) fragments(v,`${locator}.${key}`,out);
  return out;
}
function pdfReferences(value, out = new Set()) {
  if (Array.isArray(value)) for(const item of value) pdfReferences(item,out);
  else if (value && typeof value==='object') {
    if (typeof value.url==='string' && /\.pdf(?:$|[?#])/i.test(value.url) && value.url.startsWith('/assets/')) out.add(value.url);
    for(const item of Object.values(value)) pdfReferences(item,out);
  }
  return out;
}
async function readProfessionalPdf(root, url) {
  let decoded;
  try { decoded=decodeURIComponent(url); } catch { throw new StudioError('SOURCE_INVALID','Una ruta de documento no es válida.',{status:422}); }
  const publicRoot=await realpath(resolve(root,'public'));
  const path=await realpath(resolve(publicRoot,'.'+decoded));
  if(!contained(publicRoot,path)) throw new StudioError('SOURCE_INVALID','Un documento apunta fuera de public.',{status:422});
  return readFile(path);
}
function documentFragments(text) {
  const out=[];
  text.split('\f').forEach((page,i)=>{
    let offset=0;
    for(const block of page.split(/\n\s*\n/)){
      const start=page.indexOf(block,offset);offset=start+block.length;
      if(!block.trim()) continue;
      for(let pos=0;pos<block.length;pos+=1200) out.push({text:block.slice(pos,pos+1200),locator:{page:i+1,offset:start+pos},classification:'fact'});
    }
  });
  return out;
}

/** Lee la lista de fuentes autorizadas; no recorre ni importa versiones de CV. */
export async function captureKnowledgeSnapshot(db,{root=PROJECT_ROOT}={}) {
  const captured=await captureModules({root});
  const {profile,projects,education,skills,cases}=captured.data;
  const contentByFile=new Map([
    ['src/content/perfil.js',profile],['src/content/proyectos.js',projects],
    ['src/content/formacion.js',education],['src/content/stack.js',skills],
    ...cases.map(item=>[item.path,item.content]),
  ]);
  const staged=captured.files.filter(file=>contentByFile.has(file.path)).map(file=>{
    const value=contentByFile.get(file.path);
    return {key:file.path,path:file.path,kind:file.path.includes('/casos/')?'case_study':file.path.endsWith('perfil.js')?'profile':file.path.endsWith('proyectos.js')?'project':file.path.endsWith('formacion.js')?'education':'skill',bytes:file.bytes,extracted:asBytes(value),parts:fragments(value),status:'ready',availability:'available',extractor:'structured-json-v1'};
  });
  for(const url of [...pdfReferences({projects,cases})].sort()) {
    let bytes=null;
    try {
      bytes=await readProfessionalPdf(root,url);
      const document=await extractDocument(bytes,{type:'application/pdf',kind:'professional'});
      const check=await readProfessionalPdf(root,url);
      if(sha256(bytes)!==sha256(check)) throw new StudioError('SOURCE_CHANGED','Un documento cambió durante la captura.',{status:409});
      staged.push({key:url,path:url,kind:'professional_document',bytes,extracted:asBytes(document.text),parts:documentFragments(document.text),status:'ready',availability:'available',extractor:document.extractorVersion});
    } catch (error) {
      if (error.code==='SOURCE_INVALID' || error.code==='SOURCE_CHANGED') throw error;
      staged.push({key:url,path:url,kind:'professional_document',bytes,extracted:null,parts:[],status:'failed',availability:error.code==='ENOENT'?'missing':'unreadable',error:error.code||'UNREADABLE_SOURCE',extractor:'poppler-pdftotext-utf8'});
    }
  }
  const activeKeys=new Set(staged.map(item=>item.key));
  for(const old of db.prepare("SELECT kind,logical_key,relative_location FROM professional_sources WHERE kind!='owner_assertion'").all()) {
    if(!activeKeys.has(old.logical_key)) staged.push({key:old.logical_key,path:old.relative_location,kind:old.kind,bytes:null,extracted:null,parts:[],status:'failed',availability:'missing',error:'SOURCE_REMOVED',extractor:'catalog-v1'});
  }
  const now=new Date().toISOString();
  return transaction(db,()=>{
    const sources=[];
    for(const item of staged){
      let source=db.prepare('SELECT * FROM professional_sources WHERE logical_key=?').get(item.key);
      if(!source){
        source={id:randomUUID(),current_revision_id:null};
        db.prepare('INSERT INTO professional_sources(id,kind,logical_key,relative_location,availability,last_checked_at) VALUES(?,?,?,?,?,?)').run(source.id,item.kind,item.key,item.path,item.availability,now);
      }
      const identity=sha256(canonicalJson({key:item.key,bytes:item.bytes?sha256(item.bytes):null,extracted:item.extracted?sha256(item.extracted):null,availability:item.availability,error:item.error||null,extractor:item.extractor}));
      let rev=db.prepare('SELECT id FROM source_revisions WHERE source_id=? AND content_sha256=?').get(source.id,identity);
      if(!rev){
        rev={id:randomUUID()};
        const original=item.bytes?putArtifact(db,item.bytes,item.kind==='professional_document'?'application/pdf':'application/javascript').sha256:null;
        const extracted=item.extracted?putArtifact(db,item.extracted,item.kind==='professional_document'?'text/plain':'application/json').sha256:null;
        db.prepare('INSERT INTO source_revisions(id,source_id,content_sha256,original_artifact_sha256,extracted_artifact_sha256,extraction_status,extraction_error_code,extractor_version,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(rev.id,source.id,identity,original,extracted,item.status,item.error||null,item.extractor,now);
        const insert=db.prepare('INSERT INTO evidence_fragments(id,source_revision_id,fragment_sha256,text,locator,classification,language,created_at) VALUES(?,?,?,?,?,?,?,?)');
        for(const part of item.parts) insert.run(randomUUID(),rev.id,sha256(asBytes(part)),part.text,canonicalJson(part.locator),part.classification,null,now);
      }
      db.prepare('UPDATE professional_sources SET current_revision_id=?,availability=?,last_checked_at=? WHERE id=?').run(rev.id,item.availability,now,source.id);
      sources.push({id:source.id,revisionId:rev.id,key:item.key,contentSha256:identity,availability:item.availability});
    }
    for(const row of db.prepare("SELECT s.id,s.logical_key,s.availability,r.id revision_id,r.content_sha256 FROM professional_sources s JOIN source_revisions r ON r.id=s.current_revision_id WHERE s.kind='owner_assertion'").all()) sources.push({id:row.id,revisionId:row.revision_id,key:row.logical_key,contentSha256:row.content_sha256,availability:row.availability});
    sources.sort((a,b)=>a.key.localeCompare(b.key));
    const manifest={schemaVersion:1,sources};
    const bytes=asBytes(manifest), digest=sha256(bytes);
    let snapshot=db.prepare('SELECT id FROM knowledge_snapshots WHERE snapshot_sha256=?').get(digest);
    if(!snapshot){
      snapshot={id:randomUUID()};const artifact=putArtifact(db,bytes,'application/json');
      db.prepare('INSERT INTO knowledge_snapshots(id,snapshot_sha256,manifest_artifact_sha256,schema_version,created_at) VALUES(?,?,?,?,?)').run(snapshot.id,digest,artifact.sha256,1,now);
      const insert=db.prepare('INSERT INTO snapshot_sources(snapshot_id,source_revision_id) VALUES(?,?)');
      for(const source of sources) insert.run(snapshot.id,source.revisionId);
    }
    return {snapshotId:snapshot.id,snapshotSha256:digest,sources,warnings:sources.filter(source=>source.availability!=='available')};
  });
}

export function addOwnerEvidence(db,input){
  if(!input || input.confirmation!==true || typeof input.text!=='string' || !input.text.trim() || input.text.length>12000 || !['fact','learning','interest','preference'].includes(input.classification) || typeof input.entityType!=='string' || !/^[\w-]{1,60}$/.test(input.entityType) || typeof input.entityId!=='string' || !input.entityId.trim() || input.entityId.length>200 || Object.keys(input).some(k=>!['text','classification','entityType','entityId','confirmation'].includes(k))) throw new StudioError('INVALID_INPUT','Confirmá una aportación válida y su categoría.');
  return transaction(db,()=>{
    const sourceId=randomUUID(),revisionId=randomUUID(),now=new Date().toISOString(),key=`owner:${sourceId}`,bytes=asBytes(input.text),artifact=putArtifact(db,bytes,'text/plain'),digest=sha256(bytes);
    db.prepare('INSERT INTO professional_sources(id,kind,logical_key,relative_location,availability,last_checked_at) VALUES(?,?,?,?,?,?)').run(sourceId,'owner_assertion',key,'Aportación privada','available',now);
    db.prepare('INSERT INTO source_revisions(id,source_id,content_sha256,original_artifact_sha256,extracted_artifact_sha256,extraction_status,extractor_version,owner_confirmation,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(revisionId,sourceId,digest,artifact.sha256,artifact.sha256,'ready','owner-v1',canonicalJson({author:'owner',confirmedAt:now,entityType:input.entityType,entityId:input.entityId,classification:input.classification}),now);
    const insert=db.prepare('INSERT INTO evidence_fragments(id,source_revision_id,fragment_sha256,text,locator,classification,language,created_at) VALUES(?,?,?,?,?,?,?,?)'),parts=[];
    for(let offset=0;offset<input.text.length;offset+=1200){const text=input.text.slice(offset,offset+1200),locator={field:'owner_assertion',offset},id=randomUUID();insert.run(id,revisionId,sha256(asBytes({text,locator,classification:input.classification})),text,canonicalJson(locator),input.classification,null,now);parts.push({id,text,locator,classification:input.classification});}
    db.prepare('UPDATE professional_sources SET current_revision_id=? WHERE id=?').run(revisionId,sourceId);
    return {sourceId,revisionId,fragments:parts};
  });
}
export function listSources(db){return db.prepare('SELECT id,kind,logical_key AS logicalKey,relative_location AS location,availability,current_revision_id AS revisionId,last_checked_at AS lastCheckedAt FROM professional_sources ORDER BY kind,logical_key').all();}
export function sourceRevisions(db,id){if(!db.prepare('SELECT id FROM professional_sources WHERE id=?').get(id))throw new StudioError('NOT_FOUND','No se encontró la fuente.',{status:404});return db.prepare('SELECT id,content_sha256 AS contentSha256,extraction_status AS status,extraction_error_code AS error,created_at AS createdAt FROM source_revisions WHERE source_id=? ORDER BY created_at DESC').all(id);}
export function getSourceRevision(db,id){const row=db.prepare('SELECT * FROM source_revisions WHERE id=?').get(id);if(!row)throw new StudioError('NOT_FOUND','No se encontró la revisión.',{status:404});return {id:row.id,sourceId:row.source_id,status:row.extraction_status,error:row.extraction_error_code,confirmation:row.owner_confirmation?JSON.parse(row.owner_confirmation):null,hasDocument:!!row.original_artifact_sha256,fragments:db.prepare('SELECT id,text,locator,classification FROM evidence_fragments WHERE source_revision_id=? ORDER BY rowid').all(id).map(f=>({...f,locator:JSON.parse(f.locator)}))};}
