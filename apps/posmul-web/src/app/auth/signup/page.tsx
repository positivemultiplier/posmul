"use client";
// 회원가입 페이지 (Next.js 15 App Router)
import { useRouter } from 'next/navigation';
import { SignUpForm, type SignUpFormData } from '../../../shared/ui';
import { useAuth } from '../../../bounded-contexts/auth/presentation/hooks/useAuth';

export default function SignUpPage() {
  const { signUp, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const handleSignUp = async (data: SignUpFormData) => {
    if (data.password !== data.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      clearError(); // 이전 에러 초기화
      await signUp({ email: data.email.toLowerCase(), password: data.password });

      // 회원가입 성공 - 이메일 확인 안내
      alert('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
      router.push('/auth/login'); // 로그인 페이지로 이동
    } catch (error) {
      // 에러는 useAuth에서 처리되므로 여기서는 로깅만
      console.error('SignUp failed:', error);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <SignUpForm
          onSubmit={handleSignUp}
          isLoading={isLoading}
          error={error}
        />

        {/* 추가 네비게이션 */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            이미 계정이 있으신가요? 로그인하기
          </button>
        </div>
      </div>
    </main>
  );
}