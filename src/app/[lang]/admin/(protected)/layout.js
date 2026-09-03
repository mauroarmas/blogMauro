import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

// Guardia de sesión (RF-032). Vive en un route group `(protected)` separado de
// `admin/login/` para que el propio login no quede atrapado por su propio redirect.
export default async function ProtectedAdminLayout({ children, params }) {
  const { lang } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!verifySessionToken(token)) {
    redirect(`/${lang}/admin/login`);
  }

  return children;
}
