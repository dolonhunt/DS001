/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['firebase', 'firebase-admin'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude Firebase client packages from server bundle
      config.externals = config.externals || [];
    }
    return config;
  },
};

module.exports = nextConfig;
