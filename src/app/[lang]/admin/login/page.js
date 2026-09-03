'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'es';
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(`/${lang}/admin`);
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <div className="wrap">
      <nav className="nav">
        <div className="brand"><span className="br">[</span>mauroarmas.dev<span className="br">]</span></div>
      </nav>
      <div style={{ maxWidth: 360, margin: '80px auto', padding: 0 }}>
        <h1 className="et" style={{ marginBottom: 24 }}>Acceso</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && (
            <p style={{ color: 'oklch(0.65 0.18 22)', fontSize: 13, marginTop: 8 }}>
              Contraseña incorrecta.
            </p>
          )}
          <div className="form-actions">
            <button className="btn-publish" type="submit" disabled={loading}>
              {loading ? '...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
