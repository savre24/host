const nextConfig = {
  /* config options here */
  reactStrictMode: false,
  serverExternalPackages: ['cashfree-pg', '@opentelemetry/api'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};
export default nextConfig;