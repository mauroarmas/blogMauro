import { Newsreader, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import Nav from '@/components/Nav';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Mauro Armas | Blog Personal',
  description: 'Blog personal y portfolio enfocado en desarrollo de software y sistemas.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${newsreader.variable} ${hanken.variable} ${jetbrains.variable}`}>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
