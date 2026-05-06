import withBundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
    ],
  },

  turbopack: {
    root: __dirname,
  },

  serverExternalPackages: ['mammoth', 'bcryptjs'],

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      'three',
    ],
  },
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)