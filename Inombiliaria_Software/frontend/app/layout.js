import './globals.css';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--f-display', display: 'swap' });
const body = Figtree({ subsets: ['latin'], variable: '--f-body', display: 'swap' });

export const metadata = { title: 'Habitat Capital', description: 'Gestión de inmuebles y contratos' };

export default function RootLayout({ children }) {
  return (<html lang="es" className={`${display.variable} ${body.variable}`}><body>{children}</body></html>);
}
