import { createHash } from 'node:crypto';
import { z } from 'zod';
import { StudioError } from './errors.mjs';

export const uuid = z.uuid();
export const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const locale = z.enum(['es', 'en']);
export const sourceKind = z.enum(['manual', 'linkedin', 'computrabajo', 'other']);
export const matchStatus = z.enum(['supported', 'partial', 'unsupported', 'unknown', 'conflict']);
export const limits = Object.freeze({ jsonBytes: 256 * 1024, offerBytes: 10 * 1024 * 1024, offerCharacters: 100000, restoreBytes: 512 * 1024 * 1024, inputTokens: 24000, outputTokens: 6000 });
export const idempotencyKey = z.string().min(16).max(128);
export const revision = z.number().int().nonnegative();
export const presentationOptions = z.strictObject({ locale, photo: z.boolean(), portfolioUrl: z.string().max(2048).optional(), projects: z.array(z.string().max(200)).max(30).optional() });
export function validate(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw new StudioError('INVALID_INPUT', 'Los datos ingresados no son válidos.', { details: result.error.issues.map(({ path, message }) => ({ path, message })) });
  return result.data;
}
export function canonicalJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
  throw new StudioError('INVALID_INPUT', 'Los datos no pueden serializarse de forma segura.');
}
export const sha256 = data => createHash('sha256').update(data).digest('hex');

/** Los días del filtro se interpretan en la zona de búsqueda del propietario. */
export function dateBoundary(value,{end=false}={}) {
  if(typeof value!=='string')throw new StudioError('INVALID_INPUT','La fecha no es válida.');
  if(/^\d{4}-\d{2}-\d{2}$/.test(value)){
    const [year,month,day]=value.split('-').map(Number),check=new Date(Date.UTC(year,month-1,day));
    if(check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==day)throw new StudioError('INVALID_INPUT','La fecha no es válida.');
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Argentina/Tucuman',timeZoneName:'longOffset',hour:'2-digit'}).formatToParts(new Date(value+'T12:00:00Z'));
    const zone=parts.find(part=>part.type==='timeZoneName')?.value||'GMT';const offset=zone==='GMT'?'+00:00':zone.replace('GMT','');
    const instant=new Date(`${value}T${end?'23:59:59.999':'00:00:00.000'}${offset}`);
    if(Number.isNaN(instant.valueOf()))throw new StudioError('INVALID_INPUT','La fecha no es válida.');return instant.toISOString();
  }
  if(!/^\d{4}-\d{2}-\d{2}T/.test(value)||Number.isNaN(Date.parse(value)))throw new StudioError('INVALID_INPUT','La fecha no es válida.');
  return new Date(value).toISOString();
}
