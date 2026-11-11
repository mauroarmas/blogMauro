import { StudioError } from './errors.mjs';

/** Identifica un anuncio sin visitar portales ni adivinar IDs. */
export function identifyOfferOrigin(input,{sourceKind}={}) {
  if(sourceKind && !['manual','linkedin','computrabajo','other'].includes(sourceKind)) throw new StudioError('INVALID_INPUT','Origen desconocido.');
  if(!input) return {sourceKind:sourceKind||'manual',sourceCountry:sourceKind==='computrabajo'?'ar':'global',externalId:null,canonicalUrl:null,originalUrl:null};
  let url;
  try {url=new URL(input);}catch{throw new StudioError('INVALID_INPUT','La URL de la oferta no es válida.');}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new StudioError('INVALID_INPUT','La URL debe ser HTTP(S) sin credenciales.');
  const originalUrl=url.href,host=url.hostname.toLowerCase();url.hash='';
  for(const key of [...url.searchParams.keys()])if(/^utm_/i.test(key)||['trk','trackingid','refid'].includes(key.toLowerCase()))url.searchParams.delete(key);
  const linkedin=host==='linkedin.com'||host.endsWith('.linkedin.com');
  const computrabajo=host==='ar.computrabajo.com';
  let kind=linkedin?'linkedin':computrabajo?'computrabajo':sourceKind||'other';
  if((kind==='linkedin'&&!linkedin)||(kind==='computrabajo'&&!computrabajo))kind='other';
  let externalId=null,individual=false;
  if(linkedin){
    const match=/^\/jobs\/view\/(?:[^/]*-)?(\d+)\/?$/i.exec(url.pathname);
    if(match){externalId=match[1];individual=true;}
    else individual=/^\/jobs\/view\/[^/]+\/?$/i.test(url.pathname);
  }else if(computrabajo){
    individual=/^\/ofertas-de-trabajo\/oferta-de-trabajo-de-[^/]+\/?$/i.test(url.pathname);
    const match=individual&&/-([0-9a-f]{16,64})\/?$/i.exec(url.pathname);
    if(match) externalId=match[1].toUpperCase();
  }else individual=url.pathname!=='/' && !/(?:^|\/)(?:search|buscar|jobs|ofertas-de-trabajo)\/?$/i.test(url.pathname);
  return {sourceKind:kind,sourceCountry:computrabajo?'ar':'global',externalId,canonicalUrl:individual?url.href:null,originalUrl};
}
