import fs from 'fs';
import path from 'path';
import Nav from '@/components/Nav';

export const metadata = {
  title: 'Mauro Armas | Blog Personal',
  description: 'Blog personal y portfolio enfocado en desarrollo de software y sistemas.',
};

export default function RootLayout({ children }) {
  const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
  let cssContent = '';
  try {
    cssContent = fs.readFileSync(cssPath, 'utf8');
  } catch (e) {
    console.error('Error loading globals.css inline:', e);
  }

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: cssContent }} />
      </head>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
