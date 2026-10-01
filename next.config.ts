import type { NextConfig } from 'next';
const media = (process.env.IMAGE_HOSTS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const config: NextConfig = {
  // The fixture suite builds separately; its fictional data never enters the production output.
  distDir:
    process.env.EDOCTOR_RESEARCH_TEST_BUILD === '1'
      ? '.next-research-test'
      : process.env.EDOCTOR_TEST_BUILD === '1'
        ? '.next-catalog-test'
        : '.next',
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { useTypeScriptCli: true },
  images: {
    remotePatterns: media.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
      pathname: '/**',
    })),
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      { source: '/produkter', destination: '/produits', permanent: true },
      {
        source: '/produkt/:slug',
        destination: '/produit/:slug',
        permanent: true,
      },
      { source: '/kategorier', destination: '/categories', permanent: true },
      {
        source: '/kategori/:slug',
        destination: '/categorie/:slug',
        permanent: true,
      },
      { source: '/handlekurv', destination: '/panier', permanent: true },
      { source: '/kasse', destination: '/panier', permanent: true },
      { source: '/min-konto', destination: '/compte', permanent: true },
      { source: '/logg-inn', destination: '/compte', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
export default config;
