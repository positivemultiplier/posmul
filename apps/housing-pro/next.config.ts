import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@posmul/auth-economy-sdk"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

