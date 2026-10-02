import type { NextConfig } from 'next';
const media = (process.env.IMAGE_HOSTS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const config: NextConfig = {
  output: 'standalone',
  distDir: process.env.EDOCTOR_BUILD_DIR || '.next',
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
