/** @type {import('next').NextConfig} */
const withLess = require('next-with-less')
const path = require('path')

const pathToLessFileWithVariables = path.resolve(
  './src/assets/less/yoda-theme.less'
)
const nextConfig = {
  reactStrictMode: true,
  withLess: withLess({
    lessLoaderOptions: {
      additionalData: (content) =>
        `${content}\n\n@import '${pathToLessFileWithVariables}';`,
    },
  }),
}

module.exports = withLess({
  lessLoaderOptions: {
    additionalData: (content) =>
      `${content}\n\n@import '${pathToLessFileWithVariables}';`,
  },
})
