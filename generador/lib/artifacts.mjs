import { timingSafeEqual } from 'node:crypto';
import { sha256 } from './schemas.mjs';
import { StudioError } from './errors.mjs';

const allowed = new Set(['application/pdf','text/plain','text/html','text/css','application/json','application/javascript','image/png','image/jpeg','image/webp','font/woff2','application/octet-stream']);

/** Solo dentro del commit de una entidad consumidora, sin blobs huérfanos. */
export function putArtifact(db, input, mediaType) {
  if (!db.isTransaction) throw new Error('El artefacto debe insertarse dentro de una transacción.');
  if (!allowed.has(mediaType)) throw new StudioError('INVALID_MEDIA_TYPE','El tipo de archivo no está permitido.');
  if (!(input instanceof Uint8Array)) throw new StudioError('INVALID_INPUT','El archivo no contiene bytes válidos.');
  const bytes=Buffer.from(input), digest=sha256(bytes);
  const old=db.prepare('SELECT byte_length,bytes FROM artifacts WHERE sha256=?').get(digest);
  if (old) {
    const existing=Buffer.from(old.bytes);
    if (old.byte_length!==bytes.length || !timingSafeEqual(existing,bytes)) throw new StudioError('ARTIFACT_INTEGRITY_ERROR','Un archivo guardado no supera la comprobación de integridad.',{status:500});
  } else db.prepare('INSERT INTO artifacts(sha256,media_type,byte_length,bytes,created_at) VALUES(?,?,?,?,?)').run(digest,mediaType,bytes.length,bytes,new Date().toISOString());
  return {sha256:digest,mediaType,byteLength:bytes.length};
}

/** La autorización por entidad es responsabilidad del servicio llamador. */
export function getArtifact(db, digest) {
  const row=db.prepare('SELECT sha256,media_type,byte_length,bytes FROM artifacts WHERE sha256=?').get(digest);
  if (!row) throw new StudioError('ARTIFACT_NOT_FOUND','No se encontró el documento.',{status:404});
  const bytes=Buffer.from(row.bytes);
  if (bytes.length!==row.byte_length || sha256(bytes)!==row.sha256) throw new StudioError('ARTIFACT_INTEGRITY_ERROR','El documento guardado está dañado.',{status:500});
  return {sha256:row.sha256,mediaType:row.media_type,byteLength:row.byte_length,bytes};
}
