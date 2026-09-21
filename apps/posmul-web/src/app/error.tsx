"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global App Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-full bg-red-950/80 text-red-400 border border-red-800/60 flex items-center justify-center mx-auto animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300">
            일시적인 오류가 발생했습니다
          </h2>
          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
            {error.message || "요청을 처리하는 도중 예상치 못한 에러가 발생했습니다."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-4 h-4" /> 다시 시도하기
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center gap-1.5 border border-slate-700"
          >
            <Home className="w-4 h-4" /> 홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
