const nextConfig = {
  /* config options here */
  reactStrictMode: false,
  serverExternalPackages: ['cashfree-pg', '@opentelemetry/api'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  }
};
export default nextConfig;