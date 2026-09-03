'use client';

import { useState } from 'react';

export default function CopyButton({ text, labelIdle = 'copiar', labelDone = 'copiado' }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Sin acceso al portapapeles (contexto no seguro, permisos): el email ya es
      // texto seleccionable, así que el visitante puede copiarlo a mano igual.
    }
  }

  return (
    <button className={`copy${copied ? ' done' : ''}`} type="button" onClick={handleClick}>
      {copied ? labelDone : labelIdle}
    </button>
  );
}
