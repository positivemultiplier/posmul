import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@posmul/shared-types",
    "@posmul/auth-economy-sdk",
    "@posmul/study-cycle-core",
  ],
  serverExternalPackages: ["@supabase/supabase-js"],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": join(__dirname, "src"),
      "@/": join(__dirname, "src"),
    };
    return config;
  },
  // 🎯 타입 안전성 완전 활성화 - 모든 TypeScript 오류가 해결되었으므로 활성화
  typescript: {
    ignoreBuildErrors: false, // ✅ TypeScript 빌드 오류 검증 활성화
  },
  eslint: {
    ignoreDuringBuilds: true, // ⚠️ 임시: ESLint 설정 문제로 일시 비활성화
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || "https://placeholder.supabase.co",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "dummy",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy",
  },
  // Windows 환경에서 .nft.json 파일 접근 오류 회피
  experimental: {
    // outputFileTracing: false, // Next.js 15에서 제거됨
  },
};

export default nextConfig;
