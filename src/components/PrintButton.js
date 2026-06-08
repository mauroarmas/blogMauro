'use client';

export default function PrintButton() {
  return (
    <button className="btn-pdf" onClick={() => window.print()} title="Descargar como PDF">
      <svg className="ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      Descargar PDF
    </button>
  );
}
