import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { ClientCursorEffect } from '@/components/ui/ClientCursorEffect';
import { FirebaseProvider } from '@/firebase/provider';


export const metadata: Metadata = {
  title: 'EnrollEase - The Future of Education',
  description: 'A modern, secure education platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        <FirebaseProvider>
          <ClientCursorEffect />
          {children}
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
