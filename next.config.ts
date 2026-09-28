import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let other devices on the network open the dev server by IP (Wi-Fi and Tailscale).
  allowedDevOrigins: ["192.168.248.117", "100.66.194.122"],
  experimental: {
    // Allow photo uploads through server actions.
    serverActions: { bodySizeLimit: "25mb" },
  },
  images: {
    // Stock tour photos come from Unsplash; uploaded photos are served from our own /uploads route.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    formats: ["image/webp"],
  },
};

export default nextConfig;
