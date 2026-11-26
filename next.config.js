/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/nks/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
