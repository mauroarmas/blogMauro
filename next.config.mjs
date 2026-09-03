/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  experimental: {
    serverMinification: true
  }
};

export default nextConfig;