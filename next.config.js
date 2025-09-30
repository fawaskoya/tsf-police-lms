const withNextIntl = require('next-intl/plugin')(
  './lib/i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
const config = withNextIntl(nextConfig);
const normalizedTrailingSlashFlag =
  typeof config.env?._next_intl_trailing_slash === 'string'
    ? config.env._next_intl_trailing_slash
    : config.trailingSlash
      ? 'true'
      : 'false';

config.env = {
  ...config.env,
  _next_intl_trailing_slash: normalizedTrailingSlashFlag,
};

module.exports = config;
