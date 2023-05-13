/** @type {import('next').NextConfig} */

const nextConfig = {
    experimental: {
        externalDir: false,
    },
    images: {
        domains: ['hips.hearstapps.com', 'toppng.com'],
    },
}

module.exports = nextConfig
