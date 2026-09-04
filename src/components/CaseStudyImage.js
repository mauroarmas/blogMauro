import Image from 'next/image';

// Recurso Visual de un caso de estudio (data-model.md §1, RF-016a). El alt es
// obligatorio a nivel de contrato: sin él, la imagen no aporta nada a quien navega
// con lector de pantalla (Principio IV de la constitución).
export default function CaseStudyImage({ url, alt, width = 720, height = 405 }) {
  if (!alt) return null;

  const isLoom = url.includes('loom.com');
  if (isLoom) {
    const embedUrl = url.replace('/share/', '/embed/');
    return (
      <figure className="case-image">
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
          <iframe 
            src={embedUrl} 
            frameBorder="0" 
            allowFullScreen 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          ></iframe>
        </div>
        <figcaption style={{ fontSize: '13px', color: 'var(--mut)', marginTop: '12px', textAlign: 'center' }}>{alt}</figcaption>
      </figure>
    );
  }

  return (
    <figure className="case-image">
      <Image src={url} alt={alt} width={width} height={height} style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--line)' }} />
      <figcaption style={{ fontSize: '13px', color: 'var(--mut)', marginTop: '12px', textAlign: 'center' }}>{alt}</figcaption>
    </figure>
  );
}
