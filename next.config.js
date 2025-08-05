// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless", // Changed from 'require-corp' to 'credentialless'
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
  // Allow loading scripts from CDNs
  async rewrites() {
    return [
      {
        source: "/opencv/:path*",
        destination: "https://docs.opencv.org/:path*",
      },
      {
        source: "/jscanify/:path*",
        destination: "https://cdn.jsdelivr.net/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
