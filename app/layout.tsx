import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from './ClientLayout';

export const metadata: Metadata = {
  title: 'LeadRadar | B2B Lead Generation & Sales Platform',
  description: 'Google Maps business data extraction, WhatsApp marketing and sales pipeline management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(() => { let theme = 'dark'; try { const saved = localStorage.getItem('app_theme'); if (saved === 'light' || saved === 'dark') theme = saved; } catch {} document.documentElement.dataset.theme = theme; })();` }} />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
