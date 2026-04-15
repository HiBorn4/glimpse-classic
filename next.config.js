/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for OpenNext/Cloudflare — do NOT use 'standalone'
  output: undefined,

  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/thumbnails/:path*',
        destination: `${backendUrl}/thumbnails/:path*`,
      },
    ];
  },

  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;