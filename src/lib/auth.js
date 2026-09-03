import crypto from 'crypto';

// Sesión simple con cookie firmada HMAC — sin librería de auth externa (research.md §3):
// un solo dueño, sin roles, sin proveedores OAuth que gestionar.
export const SESSION_COOKIE = 'portfolio_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET no está configurado (ver .env.example)');
  }
  return secret;
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash || !password) return false;
  const attempt = crypto.scryptSync(password, 'portfolio-salt', 64).toString('hex');
  return timingSafeStringEqual(attempt, hash);
}

export function createSessionToken() {
  const exp = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token) {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;
  if (!timingSafeStringEqual(sig, sign(exp))) return false;
  const expNumber = Number(exp);
  return Number.isFinite(expNumber) && Date.now() < expNumber;
}

// Atajo para Route Handlers: `req` es un NextRequest, que expone `.cookies.get()`.
export function isAuthenticated(req) {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}
