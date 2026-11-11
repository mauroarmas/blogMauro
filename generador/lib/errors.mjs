export class StudioError extends Error {
  constructor(code, message, { status = 400, details, retryable = false } = {}) {
    super(message); this.name = 'StudioError'; this.code = code; this.status = status; this.details = details; this.retryable = retryable;
  }
}
export function publicError(error, requestId) {
  if (!(error instanceof StudioError)) return { error: { code: 'INTERNAL_ERROR', message: 'No se pudo completar la operación.', retryable: false }, requestId };
  return { error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}), retryable: error.retryable }, requestId };
}
