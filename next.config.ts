import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "/home/stephanomgeni/Desktop/forza",
  },
  images: {
    domains: ['media.api-sports.io'],
  },
};

export default nextConfig;
