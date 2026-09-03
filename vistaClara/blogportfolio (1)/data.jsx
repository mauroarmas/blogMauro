// Shared sample content + helpers for the three home-page directions.
// Exported to window so each direction script can read it.

const BLOG = {
  wordmark: 'tunombre.dev',     // placeholder — swap for your handle/name
  role: 'Ingeniero de software',
  intro:
    'Escribo sobre sistemas pequeños, rendimiento y el oficio de construir software que dura. Sin humo: notas honestas desde la trinchera.',
  posts: [
    {
      n: '01',
      title: 'Cómo corro este blog en un contenedor de 128 MB',
      excerpt:
        'Presupuesto de memoria, build de Next.js en modo standalone y por qué SQLite gana a Postgres cuando la RAM es el recurso escaso.',
      tag: 'Infra',
      date: '28 May 2026',
      read: '6 min',
      featured: true,
    },
    {
      n: '02',
      title: 'Server Components cambiaron mi modelo mental',
      excerpt:
        'Dejar de pensar en “páginas que hidratan” y empezar a pensar en árboles que se resuelven en el servidor. Lo bueno, lo raro y las trampas.',
      tag: 'Next.js',
      date: '12 May 2026',
      read: '9 min',
    },
    {
      n: '03',
      title: 'SQLite en producción para proyectos pequeños',
      excerpt:
        'Una sola conexión, WAL activado y backups que caben en un cron. Cuándo es suficiente y cuándo de verdad necesitas algo más.',
      tag: 'Datos',
      date: '30 Abr 2026',
      read: '7 min',
    },
    {
      n: '04',
      title: 'Un CRUD que no necesita un framework',
      excerpt:
        'Cuatro endpoints, validación en el borde y cero dependencias de más. El caso a favor de escribir menos código del que crees.',
      tag: 'Backend',
      date: '14 Abr 2026',
      read: '5 min',
    },
    {
      n: '05',
      title: 'Tipos estrictos sin fricción en TypeScript',
      excerpt:
        'Inferencia, narrowing y los pocos patrones que uso para que el compilador trabaje por mí en lugar de pelear contra él.',
      tag: 'TypeScript',
      date: '22 Mar 2026',
      read: '8 min',
    },
  ],
};

window.BLOG = BLOG;
