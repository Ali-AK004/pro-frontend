/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server for the Docker image (node server.js)
  output: "standalone",
  poweredByHeader: false,

  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["react-icons", "react-toastify"],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
      },
      {
        protocol: "https",
        hostname: "academitna.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "academitna.online",
      },
    ],
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

  // Security headers for every page
  async headers() {
    const apiOrigin = (() => {
      try {
        return process.env.NEXT_PUBLIC_API_BASE_URL ? new URL(process.env.NEXT_PUBLIC_API_BASE_URL).origin : "";
      } catch {
        return "";
      }
    })();
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      `connect-src 'self' ${apiOrigin} ${isDev ? "http://localhost:8080 ws:" : ""}`.trim(),
      // Only the Bunny Stream player may be embedded
      "frame-src https://iframe.mediadelivery.net",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accept.paymob.com",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              'camera=(), microphone=(), geolocation=(), display-capture=(), encrypted-media=(self "https://iframe.mediadelivery.net"), fullscreen=(self)',
          },
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
        ],
      },
    ];
  },
};

export default nextConfig;
