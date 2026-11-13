"use client";

import { useState } from "react";
import {
  BookOpen,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X,
  ExternalLink,
  Lock,
} from "lucide-react";
import { verifyAndRegisterSerialAction } from "@/app/actions/serial.actions";

interface SerialRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { serialCode: string; bookTitle: string }) => void;
  userId?: string;
}

export function SerialRegisterModal({
  isOpen,
  onClose,
  onSuccess,
  userId = "user-demo-housing-1",
}: SerialRegisterModalProps) {
  const [serialInput, setSerialInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    bookTitle: string;
    serialCode: string;
  } | null>(null);

  if (!isOpen) return null;

  // 테스트용 샘플 시리얼 원클릭 입력
  const handleFillSample = () => {
    setSerialInput("HP26-TEST-PASS-2026");
    setErrorMsg(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await verifyAndRegisterSerialAction({
        userId,
        serialCode: serialInput,
      });

      if (!res.success || !res.isRegistered) {
        setErrorMsg(res.message);
        return;
      }

      // 로컬 스토리지에 정품 인증 토큰 캐시
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "housing_pro_serial_auth",
          JSON.stringify({
            serialCode: res.serialCode,
            bookTitle: res.bookTitle,
            registeredAt: res.registeredAt,
          })
        );
      }

      setSuccessData({
        bookTitle: res.bookTitle || "2026 주택관리사 2차 회독 기출문제집",
        serialCode: res.serialCode || serialInput,
      });

      onSuccess({
        serialCode: res.serialCode || serialInput,
        bookTitle: res.bookTitle || "2026 주택관리사 2차 회독 기출문제집",
      });
    } catch (err) {
      setErrorMsg("인증 처리 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121A2B] border border-sky-500/30 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* 상단 글로우 이펙트 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-400" />

        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 font-extrabold text-[10px] border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>O2O 종이책 정품 인증</span>
              </span>
              <span className="text-slate-400 text-xs">POD 교재 전용</span>
            </div>
            <h3 className="text-lg font-black text-white">
              교재 정품 시리얼 번호 등록
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!successData ? (
          <form onSubmit={handleVerify} className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed text-xs">
              구매하신 <strong className="text-white">『2026 주택관리사 2차 5개년 회독 기출문제집』</strong> 첫 페이지 또는 뒷면 바코드 하단에 인쇄된 16자리 시리얼 번호를 입력해주세요.
            </p>

            {/* 정품 혜택 3대 안내 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-2">
              <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>정품 시리얼 등록 즉시 해금되는 3대 혜택</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11.5px] pl-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>2~5회독 전 범위 100% 전면 해금</strong> (기출 240선지 완벽 정복)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>종이책 AI 카메라 스캔 시 즉시 +40 PMP</strong> 마찰 돌파 보상 지급</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>망각곡선 복습 3연속 정답 시 +10 PMP</strong> 지식 체화 보상 활성화</span>
                </li>
              </ul>
            </div>

            {/* 시리얼 입력 폼 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                  <span>시리얼 번호 (16자리)</span>
                </label>
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
                >
                  💡 테스트용 정품 키 자동입력
                </button>
              </div>

              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                placeholder="예: HP26-TEST-PASS-2026"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/[0.1] text-white text-sm font-mono tracking-wider focus:outline-none focus:border-sky-500 uppercase"
                required
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              <a
                href="https://smartstore.naver.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <span>교재 아직 없으신가요? POD 종이책 구매처</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black transition text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <span>인증 확인 중...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>정품 등록 및 전면 해금</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* 인증 성공 뷰 */
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-xl shadow-emerald-950/40 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-white">
                정품 인증이 완료되었습니다!
              </h4>
              <p className="text-xs text-slate-300">
                {successData.bookTitle} 정품 교재 구매자로 확인되었습니다.
              </p>
              <div className="font-mono text-xs text-amber-300 font-bold pt-1">
                시리얼: {successData.serialCode}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 text-left space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>해금 완료된 서비스:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                <li>2회독(40%) ~ 5회독(100%) 심화 지엽 선지 240문항 전체 활성화</li>
                <li>종이책 카메라 스캔 시 즉시 +40 PMP 원장 적립</li>
                <li>오답 복습 승격 시 +10 PMP 지급 활성화</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30"
            >
              학습 계속하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

