"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Chrome,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { createClient } from "@/lib/supabase/client";
import { resolveSafeNextPath } from "@/lib/supabase/sso-cookie";

function resolvePosmulCoreOrigin(): string {
  if (typeof window === "undefined") return "https://posmul.com";
  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://posmul.com";
}

function HousingProLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useStudyAuth();

  const nextPath = resolveSafeNextPath(
    searchParams.get("next") || searchParams.get("redirectTo")
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(searchParams.get("error"));

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingProvider("email");
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        throw new Error(
          signInError.message.includes("Invalid login")
            ? "이메일 또는 비밀번호가 올바르지 않습니다."
            : signInError.message
        );
      }

      await refreshProfile();
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다.");
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setLoadingProvider("google");
    setError(null);
    window.location.href = `/api/auth/google/login?next=${encodeURIComponent(nextPath)}`;
  };

  const handlePosmulSocialLogin = (provider: "kakao" | "naver") => {
    setIsLoading(true);
    setLoadingProvider(provider);
    const coreOrigin = resolvePosmulCoreOrigin();
    const returnUrl = `${window.location.origin}${nextPath}`;
    window.location.href = `${coreOrigin}/api/auth/${provider}/login?next=${encodeURIComponent(
      returnUrl
    )}`;
  };

  return (
    <MobileAppShell>
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>학습홈</span>
        </Link>
        <span className="text-xs font-black text-white">PosMul 통합 로그인</span>
        <Link
          href={`/auth/signup?next=${encodeURIComponent(nextPath)}`}
          className="text-[11px] font-black text-[#FF7A59] hover:underline"
        >
          회원가입
        </Link>
      </header>

      <div className="px-4 py-6 space-y-5 flex-1">
        {/* 연동 안내 히어로 */}
        <section className="p-4 rounded-2xl bg-gradient-to-br from-[#241A18] to-[#16161D] border border-[#FF5A36]/40 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF5A36]/20 text-[#FF7A59] text-[10px] font-black">
            <ShieldCheck className="w-3 h-3" />
            <span>posmul.com ↔ pro.posmul.com 단일 계정</span>
          </div>
          <h1 className="text-base font-black text-white leading-snug">
            내 학습 기록 · 오답 · PMP 지갑을
            <br />
            PosMul 계정에 영구 연동하세요
          </h1>
          <ul className="space-y-1 text-[11px] text-slate-300">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>비로그인으로 풀던 게스트 기록도 로그인 즉시 자동 이관</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>교재 없이 O/X · 기출 풀이로 획득한 PMP가 PosMul에 바로 적립</span>
            </li>
          </ul>
        </section>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs font-bold text-rose-200">
            {error}
          </div>
        )}

        {/* 1. 이메일 로그인 */}
        <form
          onSubmit={handleEmailLogin}
          className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3"
        >
          <div className="text-xs font-black text-white">이메일로 로그인</div>

          <div className="space-y-2">
            <label className="block space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400">이메일</span>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#101015] border border-white/[0.1] text-xs text-white focus:border-[#FF5A36] focus:outline-none"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400">비밀번호</span>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#101015] border border-white/[0.1] text-xs text-white focus:border-[#FF5A36] focus:outline-none"
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 transition"
          >
            {loadingProvider === "email" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>PosMul 계정으로 로그인</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 2. 소셜 1초 연동 로그인 */}
        <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white">PosMul 간편 소셜 연동</span>
            <span className="text-[10px] font-bold text-slate-400">posmul.com 인증 연동</span>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handlePosmulSocialLogin("kakao")}
            className="w-full py-2.5 rounded-xl bg-[#FEE500] text-[#191919] font-black text-xs flex items-center justify-center gap-2 hover:brightness-95 transition disabled:opacity-60"
          >
            {loadingProvider === "kakao" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>카카오 1초 로그인 (PosMul 연동)</span>
            )}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handlePosmulSocialLogin("naver")}
            className="w-full py-2.5 rounded-xl bg-[#03C75A] text-white font-black text-xs flex items-center justify-center gap-2 hover:brightness-95 transition disabled:opacity-60"
          >
            {loadingProvider === "naver" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>네이버 1초 로그인 (PosMul 연동)</span>
            )}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loadingProvider === "google" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Chrome className="w-4 h-4" />
                <span>Google 계정으로 로그인</span>
              </>
            )}
          </button>
        </section>

        <div className="text-center text-xs text-slate-400">
          아직 PosMul 계정이 없으신가요?{" "}
          <Link
            href={`/auth/signup?next=${encodeURIComponent(nextPath)}`}
            className="text-[#FF7A59] font-black hover:underline inline-flex items-center gap-0.5"
          >
            <Sparkles className="w-3 h-3" />
            <span>10초 가입 (+10,000 PMP)</span>
          </Link>
        </div>
      </div>
    </MobileAppShell>
  );
}

export default function HousingProLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
        </div>
      }
    >
      <HousingProLoginForm />
    </Suspense>
  );
}
