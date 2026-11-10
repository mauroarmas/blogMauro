import { StudioError } from './errors.mjs';

const aliasGroups=[
  ['administration','administracion','admin','administrar'],['network','networks','networking','redes','red'],
  ['developer','development','desarrollo','desarrollador','programador'],['infrastructure','infraestructura'],
  ['database','databases','datos','basededatos'],['virtualization','virtualizacion'],
  ['testing','test','tests','pruebas'],['machinelearning','aprendizajeautomatico'],
  ['javascript','js'],['typescript','ts'],['postgresql','postgres'],['kubernetes','k8s'],
];
const aliases=new Map(aliasGroups.flatMap(([canonical,...words])=>[canonical,...words].map(word=>[word,canonical])));
const noise=new Set(['and','the','with','for','en','de','del','y','con','para','un','una','las','los','el','la']);
function terms(text){
  const input=String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const words=input.match(/c\+\+|c#|[a-z0-9]+(?:[./_-][a-z0-9]+)*/g)||[];
  return [...new Set(words.map(word=>aliases.get(word)||word).filter(word=>!noise.has(word)))];
}
export function retrieveEvidence(requirement,fragments,{limit=6}={}) {
  const wanted=terms(requirement);if(!wanted.length)return [];
  const ranked=fragments.map(fragment=>{
    const content=new Set(terms(fragment.text));
    const weight=/(?:technology|technolog|stack|project.name)/i.test(fragment.field||'')?4:/(?:heading|title|field)/i.test(fragment.field||'')?3:1;
    const hits=wanted.filter(term=>content.has(term));
    return {...fragment,score:hits.length*weight,matchedTerms:hits};
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||String(a.id).localeCompare(String(b.id)));
  const counts=new Map(),selected=[];
  for(const candidate of ranked){
    const key=candidate.sourceId||candidate.sourceRevisionId||candidate.id;
    const otherAvailable=ranked.some(item=>(item.sourceId||item.sourceRevisionId||item.id)!==key && !selected.includes(item));
    if((counts.get(key)||0)>=2 && otherAvailable)continue;
    selected.push(candidate);counts.set(key,(counts.get(key)||0)+1);if(selected.length>=Math.min(limit,6))break;
  }
  return selected;
}
export function validateEvidenceRefs(refs,fragments) {
  if(!Array.isArray(refs)||!Array.isArray(fragments))throw new StudioError('INVALID_EVIDENCE','Las referencias de evidencia no son válidas.',{status:422});
  const map=new Map(fragments.map(item=>[item.id,item]));
  for(const ref of refs){
    const source=map.get(ref.fragmentId);
    if(!source || typeof ref.quote!=='string' || !ref.quote.trim() || !source.text.includes(ref.quote))throw new StudioError('INVALID_EVIDENCE','Una cita no pertenece a las fuentes seleccionadas.',{status:422});
  }
  return true;
}
