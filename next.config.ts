import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow iPhone / LAN devices to load Next.js HMR assets in development
  allowedDevOrigins: [
    "192.168.0.127",
    "localhost",
    "https://192.168.0.127",
    "https://localhost",
  ],
  async headers() {
    return [
      {
        source: "/og.jpg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
          { key: "Content-Type", value: "image/jpeg" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "iip.smk.dk",
      },
      {
        protocol: "https",
        hostname: "iip-thumb.smk.dk",
      },
      {
        protocol: "https",
        hostname: "api.smk.dk",
      },
    ],
  },
};

export default nextConfig;
