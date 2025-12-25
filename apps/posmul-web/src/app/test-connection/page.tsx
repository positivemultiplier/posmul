"use client";

// Supabase 연결 테스트 페이지
import { createAuthEconomyClient } from "@posmul/auth-economy-sdk";

import { useEffect, useState } from "react";

export default function TestConnectionPage() {
  const [status, setStatus] = useState<string>("연결 확인 중...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        const sdk = createAuthEconomyClient({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        });

        // 현재 사용자 상태 확인 (로그인 되어 있지 않으면 null 반환)
        const userResult = await sdk.auth.getCurrentUser();

        if (userResult.success) {
          setStatus(
            `✅ Supabase 연결 성공! 현재 사용자: ${userResult.data?.email || "로그인 없음"}`
          );
        } else {
          setStatus("✅ Supabase 연결 성공! (로그인 없음)");
        }
      } catch (err) {
        setError(
          `❌ 연결 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
        );
        setStatus("❌ Supabase 연결 실패");
      }
    }

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded">
            <h2 className="font-semibold mb-2">환경 설정</h2>
            <p className="text-sm">
              URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </p>
            <p className="text-sm">
              Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}
              ...
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded">
            <h2 className="font-semibold mb-2">연결 상태</h2>
            <p className="text-sm">{status}</p>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>

          <div className="space-y-2">
            <a
              href="/auth/signup"
              className="block w-full p-2 text-center bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              회원가입 테스트 →
            </a>
            <a
              href="/auth/login"
              className="block w-full p-2 text-center bg-green-500 text-white rounded hover:bg-green-600"
            >
              로그인 테스트 →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
