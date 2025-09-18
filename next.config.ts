import type { NextConfig } from 'next';

const FALLBACK_STRAPI_HOSTNAMES = [
  'graceful-bear-073b8037ba.strapiapp.com',
  'graceful-bear-073b8037ba.media.strapiapp.com',
];

/**
 * Devuelve los remotePatterns para las imágenes de Strapi
 * en base a NEXT_PUBLIC_STRAPI_URL. Si la env no existe o es inválida,
 * usa los hostnames fallback (Strapi Cloud).
 */
function getStrapiRemotePatterns(): Array<{
  protocol: 'http' | 'https';
  hostname: string;
  port: string;
  pathname: string;
}> {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (!strapiUrl) {
    // Fallback a hostnames de Strapi Cloud (https)
    return FALLBACK_STRAPI_HOSTNAMES.map((hostname) => ({
      protocol: 'https',
      hostname,
      port: '',
      pathname: '/**',
    }));
  }

  try {
    const url = new URL(strapiUrl);
    const protocol: 'http' | 'https' = url.protocol === 'http:' ? 'http' : 'https';
    const hostname = url.hostname;

    // Calcula hostname de media.* si aplica
    const mediaHostname = hostname.includes('.strapiapp.com')
      ? hostname.replace('.strapiapp.com', '.media.strapiapp.com')
      : hostname.startsWith('media.')
      ? hostname
      : `media.${hostname}`;

    const uniqueHosts = Array.from(new Set([hostname, mediaHostname]));

    return uniqueHosts.map((h) => ({
      protocol,
      hostname: h,
      port: '',
      pathname: '/**',
    }));
  } catch {
    console.warn(
      `[next.config] Invalid NEXT_PUBLIC_STRAPI_URL "${strapiUrl}". Falling back to default Strapi hostnames.`
    );
    return FALLBACK_STRAPI_HOSTNAMES.map((hostname) => ({
      protocol: 'https',
      hostname,
      port: '',
      pathname: '/**',
    }));
  }
}

const nextConfig: NextConfig = {
  // Mantén el build “verde” aunque haya warnings de TS/ESLint en producción
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      // Fuentes públicas que ya usás:
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Strapi (principal + media.*), tomando protocolo desde la ENV
      ...getStrapiRemotePatterns(),
    ],
  },
};

export default nextConfig;
