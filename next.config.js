/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy all /api/* requests to the FastAPI backend
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

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Allow images from the R2 CDN domain (used in <Image> if you ever switch)
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
