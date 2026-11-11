import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { transaction } from './db.mjs';
import { canonicalJson, validate } from './schemas.mjs';
import { StudioError } from './errors.mjs';

const tags = z.array(z.string().min(1).max(120)).max(40);
const condition = z.strictObject({ value: z.string().max(200).nullable(), priority: z.enum(['preference','required']) });
export const preferenceSchema = z.strictObject({
  roles: tags, seniorities: tags, preferredModes: z.array(z.enum(['remote','onsite','hybrid'])).max(3),
  onsiteProvince: condition, languages: tags,
  remoteEligibility: z.string().max(200).nullable(), hybrid: z.string().max(200).nullable(),
  schedule: z.string().max(200).nullable(), contracts: tags,
  salary: z.strictObject({ amount: z.number().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/), period: z.enum(['month','year','hour']) }).nullable(),
  desiredTechnologies: tags, excludedTechnologies: tags,
});
export const initialPreferences = Object.freeze({
  roles:['Ingeniería en Sistemas','Desarrollador'], seniorities:['junior','pasantía'], preferredModes:['remote','onsite'],
  onsiteProvince:{ value:'Tucumán', priority:'required' }, languages:['español','inglés intermedio'],
  remoteEligibility:null, hybrid:null, schedule:null, contracts:[], salary:null, desiredTechnologies:[], excludedTechnologies:[],
});
function read(db) {
  const row=db.prepare('SELECT p.id,p.revision,p.current_revision_id,r.preferences FROM search_profiles p JOIN search_profile_revisions r ON r.id=p.current_revision_id ORDER BY p.created_at LIMIT 1').get();
  return row ? {id:row.id,revision:row.revision,revisionId:row.current_revision_id,preferences:JSON.parse(row.preferences)} : null;
}
export function getPreferences(db) {
  const found=read(db); if(found) return found;
  return transaction(db,()=>{
    const existing=read(db);if(existing) return existing;
    const id=randomUUID(),revisionId=randomUUID(),now=new Date().toISOString();
    db.prepare('INSERT INTO search_profiles(id,name,revision,created_at,updated_at) VALUES(?,?,?,?,?)').run(id,'Preferencias laborales',1,now,now);
    db.prepare('INSERT INTO search_profile_revisions(id,profile_id,preferences,created_at) VALUES(?,?,?,?)').run(revisionId,id,canonicalJson(initialPreferences),now);
    db.prepare('UPDATE search_profiles SET current_revision_id=? WHERE id=?').run(revisionId,id);
    return {id,revision:1,revisionId,preferences:structuredClone(initialPreferences)};
  });
}
export function updatePreferences(db,expectedRevision,input) {
  const preferences=validate(preferenceSchema,input);
  return transaction(db,()=>{
    const current=read(db);if(!current) throw new StudioError('NOT_FOUND','No existe un perfil de búsqueda.',{status:404});
    if(current.revision!==expectedRevision) throw new StudioError('REVISION_CONFLICT','Las preferencias cambiaron. Volvé a cargarlas.',{status:409,details:{currentRevision:current.revision}});
    const revisionId=randomUUID(),now=new Date().toISOString();
    db.prepare('INSERT INTO search_profile_revisions(id,profile_id,preferences,created_at) VALUES(?,?,?,?)').run(revisionId,current.id,canonicalJson(preferences),now);
    db.prepare('UPDATE search_profiles SET current_revision_id=?,revision=revision+1,updated_at=? WHERE id=?').run(revisionId,now,current.id);
    return {id:current.id,revision:current.revision+1,revisionId,preferences};
  });
}
export function checkOnsiteLocation(mode, location, preferences) {
  if (mode==='remote') return {status:'pass',reason:'La condición provincial no se aplica a remoto.'};
  if (mode!=='onsite' || !location || !preferences.onsiteProvince.value) return {status:'unknown',reason:'La modalidad o ubicación requiere revisión.'};
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const normalized=normalize(location), target=normalize(preferences.onsiteProvince.value);
  if(normalized.includes(target)) return {status:'pass',reason:'Ubicación presencial elegida.'};
  const provinces=['buenos aires','catamarca','chaco','chubut','cordoba','corrientes','entre rios','formosa','jujuy','la pampa','la rioja','mendoza','misiones','neuquen','rio negro','salta','san juan','san luis','santa cruz','santa fe','santiago del estero','tierra del fuego','ciudad autonoma de buenos aires','caba'];
  if(provinces.some(name=>normalized.includes(name))) return preferences.onsiteProvince.priority==='required'?{status:'fail',reason:'Fuera de la provincia exigida.'}:{status:'pass',reason:'Fuera de la provincia preferida; no es excluyente.'};
  return {status:'unknown',reason:'No se pudo confirmar la provincia presencial.'};
}
