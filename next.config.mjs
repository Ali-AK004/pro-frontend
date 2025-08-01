/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["react-icons", "react-toastify"],
  },

  // Image optimization
  images: {
    domains: ["images.unsplash.com", "localhost"],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // Compression
  compress: true,

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === "true" && {
    webpack: (config) => {
      config.plugins.push(
        new (require("@next/bundle-analyzer"))({
          enabled: true,
        })
      );
      return config;
    },
  }),

  // Performance optimizations
  swcMinify: true,

  // Headers for caching
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=60",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
