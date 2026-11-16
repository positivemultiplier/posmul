"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { signUpStudyUserWithPosmulAction } from "@/app/actions/auth-profile.actions";
import { createClient } from "@/lib/supabase/client";
import { resolveSafeNextPath } from "@/lib/supabase/sso-cookie";

function HousingProSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useStudyAuth();

  const nextPath = resolveSafeNextPath(
    searchParams.get("next") || searchParams.get("redirectTo")
  );
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const regRes = await signUpStudyUserWithPosmulAction({
        email,
        password,
        nickname,
      });

      if (!regRes.success) {
        setError(regRes.error || "회원가입에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginErr) {
        setError(loginErr.message);
        setIsLoading(false);
        return;
      }

      await refreshProfile();
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "가입 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <MobileAppShell>
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] flex items-center justify-between">
        <Link
          href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>로그인</span>
        </Link>
        <span className="text-xs font-black text-white">PosMul 통합 회원가입</span>
        <span className="w-10" />
      </header>

      <div className="px-4 py-6 space-y-5 flex-1">
        <section className="p-4 rounded-2xl bg-gradient-to-br from-[#23191A] to-[#16161D] border border-amber-500/35 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black">
            <Sparkles className="w-3 h-3" />
            <span>가입 즉시 10,000 PMP + PosMul 통합 계정</span>
          </div>
          <h1 className="text-base font-black text-white">
            한 번 가입으로 수험앱과 posmul.com 모두 사용
          </h1>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            이메일 인증 대기 없이 가입 즉시 로그인되며, 지금까지 게스트로 풀어둔 문제와 오답 기록도 자동으로 연결됩니다.
          </p>
        </section>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs font-bold text-rose-200">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSignup}
          className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3"
        >
          <label className="block space-y-1">
            <span className="text-[10.5px] font-bold text-slate-400">닉네임</span>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                minLength={2}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: 29회합격예정"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#101015] border border-white/[0.1] text-xs text-white focus:border-[#FF5A36] focus:outline-none"
              />
            </div>
          </label>

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
            <span className="text-[10.5px] font-bold text-slate-400">비밀번호 (6자 이상)</span>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상 입력"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#101015] border border-white/[0.1] text-xs text-white focus:border-[#FF5A36] focus:outline-none"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 transition"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>가입하고 바로 공부 시작</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </MobileAppShell>
  );
}

export default function HousingProSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
        </div>
      }
    >
      <HousingProSignupForm />
    </Suspense>
  );
}
