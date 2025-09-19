import type { MetadataRoute } from 'next';

const DISALLOWED_PATHS = ['/api/', '/app/api/', '/admin/', '/guardados'];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const normalizedSiteUrl = siteUrl ? siteUrl.replace(/\/$/, '') : undefined;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS, // anti-spam guard
      },
    ],
    sitemap: normalizedSiteUrl ? `${normalizedSiteUrl}/sitemap.xml` : undefined,
  };
}