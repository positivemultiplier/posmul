import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@posmul/auth-economy-sdk"],
};

export default nextConfig;

