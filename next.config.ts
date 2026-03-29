import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActionsBodySizeLimit: '10mb',
  },
};

export default nextConfig;
