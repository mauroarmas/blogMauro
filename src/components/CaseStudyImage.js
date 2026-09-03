import Image from 'next/image';

// Recurso Visual de un caso de estudio (data-model.md §1, RF-016a). El alt es
// obligatorio a nivel de contrato: sin él, la imagen no aporta nada a quien navega
// con lector de pantalla (Principio IV de la constitución).
export default function CaseStudyImage({ url, alt, width = 720, height = 405 }) {
  if (!alt) return null;

  return (
    <figure className="case-image">
      <Image src={url} alt={alt} width={width} height={height} />
      <figcaption>{alt}</figcaption>
    </figure>
  );
}
