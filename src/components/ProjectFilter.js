'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AREA_KEYS, normalizeArea as normalize } from '@/lib/areas';

// Filtro por área (RF-013/RF-014): el estado vive en la URL (?area=...) — la propia
// URL es la fuente de verdad, sin estado local duplicado que sincronizar. La ocultación
// de cards es imperativa sobre el DOM ya renderizado por el servidor (mismo patrón que
// la maqueta de referencia), no re-renderiza los ProjectCard.
export default function ProjectFilter({ projects, initialArea, dict, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef(null);
  const area = normalize(searchParams.get('area') ?? initialArea);

  useEffect(() => {
    const nodes = containerRef.current?.querySelectorAll('.proj') || [];
    nodes.forEach((node) => {
      const nodeAreas = (node.dataset.areas || '').split(' ');
      node.hidden = !(area === 'todos' || nodeAreas.includes(area));
    });
  }, [area]);

  function applyArea(next) {
    router.replace(next === 'todos' ? pathname : `${pathname}?area=${next}`, { scroll: false });
  }

  const count = area === 'todos' ? projects.length : projects.filter((p) => p.areas.includes(area)).length;
  const countLabel = count === 1 ? dict.filters.countOne : dict.filters.countMany.replace('{n}', count);

  return (
    <>
      <div className="filters" role="group" aria-label="Filtrar proyectos por área">
        {AREA_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={area === key}
            onClick={() => applyArea(key)}
          >
            {dict.filters[key]}
          </button>
        ))}
        <span className="filter-count" aria-live="polite">{countLabel}</span>
      </div>

      <div className="projects" ref={containerRef}>
        {children}
        {count === 0 && <p className="empty">{dict.filters.empty}</p>}
      </div>
    </>
  );
}
