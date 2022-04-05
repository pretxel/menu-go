/** @type {import('next').NextConfig} */
const withLess = require('next-with-less')
const path = require('path')

const pathToLessFileWithVariables = path.resolve(
  './src/assets/less/yoda-theme.less'
)
const nextConfig = {
  experimental: {
    externalDir: false,
    runtime: 'nodejs',
  },
  images: {
    domains: ['hips.hearstapps.com', 'toppng.com'],
  },
  lessLoaderOptions: {
    additionalData: (content) =>
      `${content}\n\n@import '${pathToLessFileWithVariables}';`,
  },
}

module.exports = withLess(nextConfig)
