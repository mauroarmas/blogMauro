/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  // Optimización experimental extra para entornos de bajos recursos
  experimental: {
    serverMinification: true
  }
};

export default nextConfig;
