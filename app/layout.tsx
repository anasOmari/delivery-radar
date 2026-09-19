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
    <html lang="ar" dir="rtl">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
