// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['*.ngrok-free.dev'],

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
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
      // https://ihttixmdelobsmnkqokk.supabase.co/storage/v1/object/public/questionnaire-assets/...
      {
        protocol: 'https',
        hostname: 'ihttixmdelobsmnkqokk.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  turbopack: {
    root: __dirname,
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
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

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(pwaConfig(nextConfig))