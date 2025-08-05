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
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
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

  // הוספת הסעיף הבא כדי להתעלם משגיאות ESLint בזמן build:
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
