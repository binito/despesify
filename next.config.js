/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8520',
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fix for Tesseract.js worker in Next.js
      config.externals = config.externals || []
      config.externals.push({
        'tesseract.js': 'commonjs tesseract.js'
      })
    }
    return config
  },
}

module.exports = nextConfig
