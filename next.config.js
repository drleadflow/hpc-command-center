/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: ['@blade/core', '@blade/db', '@blade/shared', '@blade/docker-runner'],
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'dockerode', 'docker-modem', 'ssh2'],
  },
};

module.exports = nextConfig;
