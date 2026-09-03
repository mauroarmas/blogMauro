import Image from 'next/image';

const MESES = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function formatPeriod(period, lang) {
  const meses = MESES[lang] || MESES.es;
  const fmt = (m) => {
    if (!m) return null;
    const [y, mo] = m.split('-');
    return `${meses[Number(mo) - 1]} ${y}`;
  };
  return { start: fmt(period.start), end: period.end ? fmt(period.end) : null };
}

function formatRole(role, dict) {
  if (role.mode === 'individual') return dict.project.individual;
  if (role.teamSize) return dict.project.equipo.replace('{n}', role.teamSize);
  return dict.project.equipoSinTamano;
}

export default function ProjectCard({ project, lang, index, hasCaseStudyContent, hidden = false, dict }) {
  const i18n = project.i18n[lang] || project.i18n.es;
  const { start, end } = formatPeriod(project.period, lang);
  const num = String(index + 1).padStart(2, '0');
  const availableLinks = project.verification.filter((v) => v.available);
  const showCaseStudyLink = project.hasCaseStudy && hasCaseStudyContent;

  return (
    <article className="proj" data-areas={project.areas.join(' ')} hidden={hidden}>
      <span className="pnum">{num}</span>
      {project.thumbnail ? (
        <Image
          className="pthumb"
          src={project.thumbnail}
          alt={`${dict.project.repositorio}: ${i18n.name}`}
          width={104}
          height={74}
        />
      ) : (
        <div className="pthumb" aria-hidden="true" />
      )}
      <div>
        <h3 className="pttl">
          {showCaseStudyLink ? (
            <a href={`/${lang}/proyectos/${project.slug}`}>{i18n.name}</a>
          ) : (
            i18n.name
          )}
        </h3>
        <p className="pctx">{i18n.context}</p>
        <p className="pprob">{i18n.problem}</p>
        <ul className="ptech">
          {project.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      </div>
      <div className="pmeta">
        <div className="pareas">
          {project.areas.map((area) => (
            <span className="area" key={area}>{dict.filters[area] || area}</span>
          ))}
        </div>
        <div className="prole">
          <span className="rk">{dict.project.rol}</span>
          {formatRole(project.role, dict)}
        </div>
        <div className="pwhen">
          {start} — {end || <span className="live">{dict.project.enCurso}</span>}
        </div>
        {availableLinks.length > 0 && (
          <div className="plinks">
            {availableLinks.map((v) => (
              <a key={v.type} href={v.url} target="_blank" rel="noopener noreferrer">
                {dict.project[v.type] || v.type}
              </a>
            ))}
            {showCaseStudyLink && (
              <a href={`/${lang}/proyectos/${project.slug}`}>{dict.project.casoDeEstudio}</a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
