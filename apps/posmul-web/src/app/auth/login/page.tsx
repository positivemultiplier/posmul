"use client";
// 로그인 페이지 (Next.js 15 App Router)
import { LoginForm } from '@posmul/shared-ui';

export default function LoginPage() {
  // 임시: 실제 인증 로직 연결 전까지 noop
  const handleLogin = async () => {};
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">로그인</h1>
        <LoginForm onSubmit={handleLogin} />
      </div>
    </main>
  );
}
