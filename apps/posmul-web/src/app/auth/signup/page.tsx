"use client";
// 회원가입 페이지 (Next.js 15 App Router)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignUpForm } from '../../../shared/ui';
import { createAuthEconomyClient, createEmail, isFailure } from '@posmul/auth-economy-sdk';
import type { SignUpFormData } from '../../../shared/ui/components/forms/SignUpForm';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Auth-Economy SDK 초기화
  const sdk = createAuthEconomyClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });

  const handleSignUp = async (data: SignUpFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const email = createEmail(data.email.toLowerCase());
      const result = await sdk.auth.signUp(email, data.password);

      if (isFailure(result)) {
        setError(result.error.message || '회원가입 중 오류가 발생했습니다.');
      } else {
        // 회원가입 성공 - 이메일 확인 안내 또는 대시보드로 이동
        alert('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('SignUp error:', err);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">회원가입</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <SignUpForm
          onSubmit={handleSignUp}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </main>
  );
}
