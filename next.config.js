/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/okx/:path*',
        destination: 'https://www.okx.com/:path*',
      },
    ];
  },
  experimental: {
    // Next 16 compatibility
  },
};

module.exports = nextConfig;
