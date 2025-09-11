import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CafeMX - Gestión Inteligente para Cafeterías',
  description: 'SaaS multi-tenant para gestión de cafeterías mexicanas con OCR automático de tickets',
  keywords: 'cafetería, gestión, OCR, tickets, contabilidad, México, POS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}