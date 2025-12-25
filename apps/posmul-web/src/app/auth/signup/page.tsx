"use client";

import { useState, FormEvent } from "react";
import { createClient } from "../../../lib/supabase/client";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import { Chrome, Loader2, Sparkles, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [mode, setMode] = useState<"social" | "email">("social");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이메일 회원가입 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">이메일을 확인해주세요!</h2>
              <p className="text-gray-400 mb-6">
                <span className="text-white font-semibold">{email}</span>로 <br />
                확인 이메일을 발송했습니다.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                이메일의 링크를 클릭하여 계정을 활성화하세요.
              </p>
              <Link
                href="/auth/login"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                로그인 페이지로 이동
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <FadeIn>
          {/* Logo & Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">PosMul에 가입하고 PMP 1000을 받으세요!</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              회원가입
            </h1>
            <p className="text-gray-400">
              몇 초만에 가입하고 예측 게임을 시작하세요
            </p>
          </div>

          {/* Signup Card */}
          <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 -z-10"></div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-lg">
              <button
                onClick={() => setMode("social")}
                className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 ${mode === "social"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                소셜 가입
              </button>
              <button
                onClick={() => setMode("email")}
                className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 ${mode === "email"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                이메일 가입
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {mode === "social" ? (
              /* Social Signup */
              <div className="space-y-4">
                <HoverLift>
                  <button
                    onClick={handleGoogleSignup}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Chrome className="w-5 h-5" />
                    )}
                    <span>Google로 계속하기</span>
                  </button>
                </HoverLift>

                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FEE500] text-[#000000] rounded-xl font-semibold opacity-50 cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.79 1.84 5.24 4.61 6.63-.2.73-.73 2.73-.84 3.16-.13.52.19.51.4.37.16-.11 2.54-1.73 3.53-2.4.7.1 1.42.15 2.15.15 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
                  </svg>
                  <span>Kakao로 계속하기 (준비중)</span>
                </button>
              </div>
            ) : (
              /* Email Signup Form */
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    이메일
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    비밀번호
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="최소 6자"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="비밀번호 재입력"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "가입하기"
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1a1a2e] text-gray-400">또는</span>
              </div>
            </div>

            {/* Info Text */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-400">
                이미 계정이 있으신가요?{" "}
                <Link href="/auth/login" className="text-blue-400 hover:underline font-semibold">
                  로그인
                </Link>
              </p>
              <p className="text-xs text-gray-500">
                가입하면 <Link href="/terms" className="text-blue-400 hover:underline">이용약관</Link> 및{" "}
                <Link href="/privacy" className="text-blue-400 hover:underline">개인정보처리방침</Link>에 동의하게 됩니다
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← 홈으로 돌아가기
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
