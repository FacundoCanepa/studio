import type {NextConfig} from 'next';

const FALLBACK_STRAPI_HOSTNAMES = [
  'graceful-bear-073b8037ba.strapiapp.com',
  'graceful-bear-073b8037ba.media.strapiapp.com',
];

const strapiHostnames = (() => {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;

  if (!strapiUrl) {
    return FALLBACK_STRAPI_HOSTNAMES;
  }

  try {
    const hostname = new URL(strapiUrl).hostname;
    const hostnames = new Set<string>([hostname]);

    const mediaHostname = hostname.includes('.strapiapp.com')
      ? hostname.replace('.strapiapp.com', '.media.strapiapp.com')
      : hostname.startsWith('media.')
        ? hostname
        : `media.${hostname}`;

    hostnames.add(mediaHostname);

    return Array.from(hostnames);
  } catch (error) {
    console.warn(
      `[next.config] Invalid NEXT_PUBLIC_STRAPI_URL "${strapiUrl}". Falling back to default Strapi hostnames.`,
    );
    return FALLBACK_STRAPI_HOSTNAMES;
  }
})();

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,

  },
  images: {
    remotePatterns: [
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
      ...strapiHostnames.map(hostname => ({
        protocol: 'https',
        hostname,
        port: '',
        pathname: '/**',
      })),
    ],
  },
};

export default nextConfig;