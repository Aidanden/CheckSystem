/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL || 'http://10.250.100.40:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

