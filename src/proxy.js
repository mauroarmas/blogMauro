import { NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['es', 'en'];
const DEFAULT_LOCALE = 'es';

function detectLocale(request) {
  const acceptLanguage = request.headers.get('accept-language') || '';
  const preferred = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase());

  return preferred.find((lang) => SUPPORTED_LOCALES.includes(lang)) || DEFAULT_LOCALE;
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/es${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (pathname === '/') {
    const locale = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin', '/admin/:path*'],
};
