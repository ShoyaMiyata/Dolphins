import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    localPatterns: [
      {
        pathname: '/images/**',
        search: '',
      },
    ],
  },
  // Disable Vercel Analytics to prevent 404 errors
  experimental: {
    webVitalsAttribution: [],
  },
};

export default nextConfig;
