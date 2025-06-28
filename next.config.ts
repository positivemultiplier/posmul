// posmul/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ⛔ 빌드 시 ESLint 단계 건너뛰기
  },
};

export default nextConfig;