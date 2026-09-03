import { Newsreader, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { SUPPORTED_LOCALES, hasLocale } from './dictionaries';
import '../globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--serif',
  display: 'swap',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--mono',
  display: 'swap',
});

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export const metadata = {
  title: 'Mauro Armas — Desarrollador Full-Stack e Infraestructura Cloud',
  description:
    'Mauro Armas. Desarrollo full-stack (NestJS, React/Next.js, PostgreSQL) e infraestructura cloud (Proxmox VE, Linux, Docker, AWS). Tucumán, Argentina · Remoto.',
};

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      className={`${newsreader.variable} ${hanken.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <Script id="theme-init" strategy="beforeInteractive">
          {"(function(){try{document.documentElement.dataset.theme=localStorage.getItem('ma-theme')||'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();"}
        </Script>
      </body>
    </html>
  );
}
