
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { getCategories } from '@/lib/strapi-client';
import { Poppins, EB_Garamond } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/components/theme/theme-provider';
import Script from 'next/script';
import { AnalyticsTracker } from '@/lib/gtag/AnalyticsTracker';
import { CookieConsent } from '@/components/privacy/CookieBanner';

const fontBody = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
});

const fontHeadline = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-headline',
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL('https://studio-lemon.vercel.app'),
  title: {
    default: 'Vestigio Magazine',
    template: `%s - Vestigio Magazine`,
  },
  description: 'Revista de moda, estilo de vida y tendencias.',
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
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  alternates: {
    canonical: '/',
  },
  other: {
    "google-adsense-account": "ca-pub-5118101506692087",
  }
};
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script
          id="adsense-base"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5118101506692087"
          crossOrigin="anonymous"
        />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: "ca-pub-5118101506692087",
                enable_page_level_ads: true
              });
            `,
          }}
        />
        <Script id="consent-defaults" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'analytics_storage': 'denied',
              'wait_for_update': 500
            });
          `}
        </Script>
      </head>
      <body className={cn("font-body antialiased", fontBody.variable, fontHeadline.variable)}>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <AnalyticsTracker />
              <div className="relative flex min-h-screen flex-col">
                <AppHeader categories={categories} />
                <main className="flex-1">{children}</main>
                <AppFooter />
              </div>
              <Toaster />
              <CookieConsent />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
