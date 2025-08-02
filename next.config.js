/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,

  // Enable SWC minification for better performance
  swcMinify: true,

  // Image optimization configuration
  images: {
    // Allow images from Bunny.net CDN
    domains: [
      "academitna.b-cdn.net",
      "localhost",
      "127.0.0.1",
      "academitna.online",
      "www.academitna.online",
    ],

    // Image formats to support
    formats: ["image/webp", "image/avif"],

    // Image sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Enable image optimization
    unoptimized: false,

    // Loader configuration for CDN
    loader: "default",
  },

  // Environment variables
  env: {
    CUSTOM_KEY: "academitna_production",
  },

  // Experimental features
  experimental: {
    // Enable app directory (if using Next.js 13+)
    appDir: true,

    // Enable server components
    serverComponentsExternalPackages: [],
  },

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Output configuration
  output: "standalone",

  // Trailing slash configuration
  trailingSlash: false,

  // Redirects
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack configurations

    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
        },
      };
    }

    // Add custom loaders or plugins if needed
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/,
      use: {
        loader: "file-loader",
        options: {
          publicPath: "/_next/static/media/",
          outputPath: "static/media/",
        },
      },
    });

    return config;
  },

  // TypeScript configuration (if using TypeScript)
  typescript: {
    // Ignore TypeScript errors during build (not recommended for production)
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Ignore ESLint errors during build (not recommended for production)
    ignoreDuringBuilds: false,
  },

  // Internationalization (if needed)
  i18n: {
    locales: ["ar", "en"],
    defaultLocale: "ar",
    localeDetection: true,
  },

  // API routes configuration
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "production"
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`
            : "http://localhost:8080/api/:path*",
      },
    ];
  },

  // Performance optimizations
  poweredByHeader: false,
  generateEtags: true,
  compress: true,

  // Development configuration
  ...(process.env.NODE_ENV === "development" && {
    // Development-specific configurations
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),

  // Production optimizations
  ...(process.env.NODE_ENV === "production" && {
    // Production-specific configurations
    productionBrowserSourceMaps: false,
    optimizeFonts: true,
  }),
};

module.exports = nextConfig;
