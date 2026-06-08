'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <nav className="nav wrap">
      <div className="brand">
        <Link href="/">
          <span className="br">[</span> mis escritos <span className="br">]</span>
        </Link>
      </div>
      <div className="nav-right">
        <div className="status">
          <div className="led"></div>
          <span>online · 128 MB</span>
        </div>
        <Link href="/admin" className={`btn-admin ${isAdmin ? 'active' : ''}`}>
          <svg className="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          admin
        </Link>
      </div>
    </nav>
  );
}
