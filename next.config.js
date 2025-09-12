/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.ycm360.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.ycm360.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: '/admin/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;