"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Sparkles, ArrowRight, AlertCircle } from "lucide-react";

function GateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pass.trim()) {
      setError("입장 코드를 입력해 주세요.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/gate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pass }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data.message || "입장 코드가 일치하지 않습니다.");
          return;
        }

        // 인증 성공 시 대상 페이지로 리다이렉트
        window.location.href = redirectTo;
      } catch (err) {
        setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="pass" className="block text-xs font-semibold text-slate-300 mb-1.5">
          입장 코드 (Access Code)
        </label>
        <div className="relative">
          <input
            id="pass"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="입장 코드를 입력하세요"
            autoFocus
            disabled={isPending}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? (
          <span>접속 권한 검증 중...</span>
        ) : (
          <>
            <span>프리뷰 입장하기</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

export default function GatePage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* 배경 장식 발광체 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[380px] h-[380px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-md relative z-10">
        {/* 상단 뱃지 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>모두의창업 3기 비공개 프리뷰</span>
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-7 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/80">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              PosMul
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
              Positive Multiplier • 집단지성 예측 플랫폼
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 mb-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
              <Lock className="w-4 h-4 shrink-0" />
              비공개 보안 열람 안내
            </p>
            현재 공식 발표 및 런칭을 앞두고 비공개 심사 모드로 운영 중입니다. 심사위원 및 프로젝트 관계자는 부여받은 입장 코드를 입력해 주세요.
          </div>

          <Suspense fallback={<div className="text-center text-xs text-slate-500 py-4">로딩 중...</div>}>
            <GateForm />
          </Suspense>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              💡 대표님 전용 링크나 시크릿 파라미터가 포함된 URL을 클릭하시면 코드 입력 없이 즉시 입장하실 수 있습니다.
            </p>
          </div>
        </div>

        {/* 하단 카피라이트 */}
        <p className="text-center text-xs text-slate-600 mt-6 font-mono">
          © 2026 PosMul Team. All rights reserved. (Confidential)
        </p>
      </main>
    </div>
  );
}
