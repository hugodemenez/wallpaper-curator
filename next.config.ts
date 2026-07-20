import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
