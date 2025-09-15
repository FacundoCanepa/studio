
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { getCategories } from '@/lib/strapi-client';
import { Poppins, EB_Garamond } from 'next/font/google';
import { cn } from '@/lib/utils';

// [PERFORMANCE FIX] Use next/font to optimize font loading
const fontBody = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
});

const fontHeadline = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-headline',
});

// [SEO FIX] Add metadataBase for root SEO configuration.
export const metadata: Metadata = {
  metadataBase: new URL('https://vestigio.com.ar'),
  title: {
    default: 'Vestigio Magazine',
    template: `%s - Vestigio Magazine`,
  },
  description: 'Revista de moda, estilo de vida y tendencias.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  // [SEO FIX] Use logo.png as the primary icon.
  openGraph: {
    title: 'Vestigio Magazine',
    description: 'Revista de moda, estilo de vida y tendencias.',
    images: ['/logo.png'],
    siteName: 'Vestigio Magazine',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vestigio Magazine',
    description: 'Revista de moda, estilo de vida y tendencias.',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: '/',
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("font-body antialiased", fontBody.variable, fontHeadline.variable)}>
        <div className="relative flex min-h-screen flex-col">
          <AppHeader categories={categories} />
          <main className="flex-1">{children}</main>
          <AppFooter />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
