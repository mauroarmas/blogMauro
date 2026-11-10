import { timingSafeEqual } from 'node:crypto';
import { StudioError, publicError } from './errors.mjs';
import { limits } from './schemas.mjs';

export function assertLocalContext(req,port) {
  const extra = process.env.CV_ALLOWED_HOSTS ? process.env.CV_ALLOWED_HOSTS.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const hosts=[`127.0.0.1:${port}`,`localhost:${port}`,...extra],origins=hosts.map(host=>`http://${host}`);
  if(!hosts.includes(req.headers.host)||(req.headers.origin&&!origins.includes(req.headers.origin))||req.headers['sec-fetch-site']==='cross-site') throw new StudioError('FORBIDDEN','Este módulo solo admite acceso local desde su propio panel.',{status:403});
}
export function assertToken(req,token) {
  const supplied=Buffer.from(String(req.headers['x-cv-token']||'')),expected=Buffer.from(token);
  if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))throw new StudioError('FORBIDDEN','Abrí el panel local para continuar.',{status:403});
}
export async function readJson(req,{maxBytes=limits.jsonBytes}={}) {
  if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new StudioError('INVALID_INPUT','Se requiere JSON.');
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>maxBytes)throw new StudioError('INPUT_LIMIT','La solicitud es demasiado grande.',{status:413});chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new StudioError('INVALID_INPUT','El JSON no es válido.');}
}
export function sendError(res,error,requestId) {
  const body=JSON.stringify(publicError(error,requestId));
  res.writeHead(error instanceof StudioError?error.status:500,{'Content-Type':'application/json; charset=utf-8'});res.end(body);
}

export async function readOfferForm(req) {
  const type=req.headers['content-type']||'';
  if(!type.toLowerCase().startsWith('multipart/form-data;'))throw new StudioError('INVALID_INPUT','Se requiere un formulario con texto o archivo.');
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>11*1024*1024)throw new StudioError('INPUT_LIMIT','La oferta supera el tamaño permitido.',{status:413});chunks.push(chunk);}
  let form;
  try {form=await new Request('http://127.0.0.1/',{method:'POST',headers:{'content-type':type},body:Buffer.concat(chunks)}).formData();}
  catch {throw new StudioError('INVALID_INPUT','No se pudo leer el formulario.');}
  if([...form.keys()].some(key=>!['text','file','sourceUrl','sourceKind'].includes(key)))throw new StudioError('INVALID_INPUT','El formulario contiene campos desconocidos.');
  for(const key of new Set(form.keys()))if(form.getAll(key).length!==1)throw new StudioError('INVALID_INPUT','El formulario contiene campos duplicados.');
  const text=form.get('text'),file=form.get('file');
  if((typeof text==='string')===(file instanceof File))throw new StudioError('INVALID_INPUT','Ingresá texto o un archivo, no ambos.');
  const sourceUrl=form.get('sourceUrl'),sourceKind=form.get('sourceKind');
  if((sourceUrl!==null&&typeof sourceUrl!=='string')||(sourceKind!==null&&typeof sourceKind!=='string'))throw new StudioError('INVALID_INPUT','El origen no es válido.');
  if(Buffer.byteLength(String(sourceUrl||'')+String(sourceKind||''))>8192)throw new StudioError('INPUT_LIMIT','Los metadatos superan el límite.',{status:413});
  let bytes,mediaType;
  if(file instanceof File){if(file.size>10*1024*1024)throw new StudioError('INPUT_LIMIT','El archivo supera 10 MiB.',{status:413});bytes=Buffer.from(await file.arrayBuffer());mediaType=file.type==='application/pdf'?'application/pdf':file.type==='text/plain'?'text/plain':null;}
  else{if(text.length>100000)throw new StudioError('INPUT_LIMIT','El texto supera el límite.',{status:413});bytes=Buffer.from(text);mediaType='text/plain';}
  if(!mediaType)throw new StudioError('INVALID_MEDIA_TYPE','Adjuntá un archivo TXT o PDF.');
  return {bytes:bytes.toString('base64'),mediaType,...(sourceUrl?{sourceUrl}:{}),...(sourceKind?{sourceKind}:{})};
}

/** Carga una copia a staging privado sin mantener 512 MiB en memoria. */
export async function receiveBackup(req,directory){
  const {open,rm}=await import('node:fs/promises');const {join}=await import('node:path');const {randomUUID}=await import('node:crypto');
  const id=randomUUID(),path=join(directory,id+'.sqlite'),file=await open(path,'wx',0o600);let size=0;
  try{
    for await(const chunk of req){size+=chunk.length;if(size>limits.restoreBytes)throw new StudioError('INPUT_LIMIT','La copia supera 512 MiB.',{status:413});let offset=0;while(offset<chunk.length){const result=await file.write(chunk,offset,chunk.length-offset);offset+=result.bytesWritten;}}
    if(!size)throw new StudioError('INVALID_INPUT','La copia está vacía.');await file.sync();await file.close();return {id,path};
  }catch(error){await file.close().catch(()=>{});await rm(path,{force:true});throw error;}
}
