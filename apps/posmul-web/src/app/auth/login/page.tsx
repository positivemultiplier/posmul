"use client";
// 로그인 페이지 (Next.js 15 App Router)
import { useRouter } from 'next/navigation';
import { LoginForm, type LoginFormData } from '../../../shared/ui';
import { useAuth } from '../../../bounded-contexts/auth/presentation/hooks/useAuth';

export default function LoginPage() {
  const { signIn, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const handleLogin = async (data: LoginFormData) => {
    try {
      clearError(); // 이전 에러 초기화
      await signIn({ email: data.email, password: data.password });
      router.push('/dashboard'); // 로그인 성공 시 대시보드로 이동
    } catch (error) {
      // 에러는 useAuth에서 처리되므로 여기서는 로깅만
      console.error('Login failed:', error);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
        />

        {/* 추가 네비게이션 */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/auth/signup')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            회원가입하러 가기
          </button>
        </div>
      </div>
    </main>
  );
}
