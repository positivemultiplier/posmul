"use client";

import { useState, FormEvent, Suspense } from "react";
import { createClient } from "../../../lib/supabase/client";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import { Chrome, Loader2, Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [mode, setMode] = useState<"social" | "email">("social");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirectTarget =
    searchParams.get("redirectTo") ||
    searchParams.get("redirect") ||
    searchParams.get("next") ||
    "/dashboard";

  // 1. 구글 소셜 로그인
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setLoadingProvider("google");
    setError(null);

    try {
      const supabase = createClient();
      const nextQuery = redirectTarget ? `?next=${encodeURIComponent(redirectTarget)}` : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback${nextQuery}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "구글 로그인 중 오류가 발생했습니다.");
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  // 2. 카카오 1초 간편 로그인
  const handleKakaoLogin = () => {
    setIsLoading(true);
    setLoadingProvider("kakao");
    const nextQuery = redirectTarget ? `?next=${encodeURIComponent(redirectTarget)}` : "";
    window.location.href = `/api/auth/kakao/login${nextQuery}`;
  };

  // 3. 네이버 1초 간편 로그인
  const handleNaverLogin = () => {
    setIsLoading(true);
    setLoadingProvider("naver");
    const nextQuery = redirectTarget ? `?next=${encodeURIComponent(redirectTarget)}` : "";
    window.location.href = `/api/auth/naver/login${nextQuery}`;
  };

  // 4. 이메일/비밀번호 로그인
  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingProvider("email");
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      let targetRoute = redirectTarget;
      if (targetRoute === "/dashboard") {
        try {
          const profRes = await fetch("/api/user/profile");
          const profJson = await profRes.json();
          if (profJson?.success) {
            if (!profJson.onboardingCompleted) {
              targetRoute = "/dashboard?onboarding=1";
            } else if (profJson.personalization?.defaultLanding) {
              targetRoute = profJson.personalization.defaultLanding;
            }
          }
        } catch {
          // 기본 이동
        }
      }

      router.push(targetRoute);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "이메일 로그인 중 오류가 발생했습니다.");
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="w-full max-w-md">
      <FadeIn>
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-indigo-300 font-semibold">
              첫 로그인 시 10,000 PMP 환영 보너스!
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2.5 bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            PosMul 로그인
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            간편 로그인으로 집단지성 예측과 실시간 맞짱 내기에 참여하세요
          </p>
        </div>

        {/* Login Card */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl">
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode("social")}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                mode === "social"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              간편 소셜 로그인
            </button>
            <button
              onClick={() => setMode("email")}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                mode === "email"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              이메일 로그인
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <p className="text-xs text-rose-400">{error}</p>
            </div>
          )}

          {mode === "social" ? (
            /* 대한민국 3대 소셜 간편 로그인 */
            <div className="space-y-3">
              {/* 1. 카카오 로그인 */}
              <HoverLift>
                <button
                  onClick={handleKakaoLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] rounded-xl font-bold transition-all duration-200 shadow-md text-sm active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {loadingProvider === "kakao" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#191919]" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#191919">
                      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.79 1.84 5.24 4.61 6.63-.2.73-.73 2.73-.84 3.16-.13.52.19.51.4.37.16-.11 2.54-1.73 3.53-2.4.7.1 1.42.15 2.15.15 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
                    </svg>
                  )}
                  <span>카카오로 1초 시작하기</span>
                </button>
              </HoverLift>

              {/* 2. 네이버 로그인 */}
              <HoverLift>
                <button
                  onClick={handleNaverLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#03C75A] hover:bg-[#02b351] text-white rounded-xl font-bold transition-all duration-200 shadow-md text-sm active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {loadingProvider === "naver" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                    </svg>
                  )}
                  <span>네이버로 1초 시작하기</span>
                </button>
              </HoverLift>

              {/* 3. 구글 로그인 */}
              <HoverLift>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-100 hover:bg-white text-slate-900 rounded-xl font-bold transition-all duration-200 shadow-md text-sm active:scale-98 cursor-pointer disabled:opacity-50 border border-slate-200"
                >
                  {loadingProvider === "google" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-800" />
                  ) : (
                    <Chrome className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                  <span>Google로 계속하기</span>
                </button>
              </HoverLift>
            </div>
          ) : (
            /* Email Login Form */
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  이메일 주소
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {isLoading && loadingProvider === "email" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>로그인</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-slate-900 text-slate-500">또는</span>
            </div>
          </div>

          {/* 회원가입 링크 */}
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-400">
              아직 PosMul 회원이 아니신가요?{" "}
              <Link
                href={`/auth/signup${redirectTarget ? `?next=${encodeURIComponent(redirectTarget)}` : ""}`}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-2 ml-1"
              >
                무료 회원가입
              </Link>
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              로그인 시 PosMul{" "}
              <Link href="/terms" className="text-slate-400 hover:underline">
                이용약관
              </Link>{" "}
              및{" "}
              <Link href="/privacy" className="text-slate-400 hover:underline">
                개인정보처리방침
              </Link>
              에 동의하게 됩니다.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07090e] via-[#101426] to-[#07090e] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-center text-xs text-slate-500">로그인 로딩 중...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
