"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Sparkles,
  Star,
  X,
  RefreshCw,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Lock,
  ScanLine,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { recordAiScanAndRewardPmp } from "@/app/actions/study-economy.actions";
import { getUserSerialStatusAction } from "@/app/actions/serial.actions";
import { SerialRegisterModal } from "@/components/auth/serial-register-modal";

export default function BookAiScanPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [userBalance, setUserBalance] = useState(1000);
  const [isSerialVerified, setIsSerialVerified] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [verifiedBookTitle, setVerifiedBookTitle] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<{
    page: number;
    bookTitle: string;
    detectedCount: number;
    stars: Array<{ question: number; option: number; text: string }>;
    xmarks: Array<{ question: number; option: number; text: string }>;
    earnedPmp: number;
    isSerialVerified?: boolean;
    rewardMessage: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("housing_pro_serial_auth");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.serialCode) {
            setIsSerialVerified(true);
            setVerifiedBookTitle(parsed.bookTitle || null);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    getUserSerialStatusAction("user-demo-housing-1").then((res) => {
      if (res.isRegistered) {
        setIsSerialVerified(true);
        if (res.bookTitle) setVerifiedBookTitle(res.bookTitle);
      }
    });
  }, []);

  const handleSimulateScan = async () => {
    setIsScanning(true);

    const mockDetected = [
      { question: 14, option: 2, mark: "STAR" as const },
      { question: 16, option: 5, mark: "STAR" as const },
      { question: 15, option: 4, mark: "X" as const },
    ];

    try {
      const res = await recordAiScanAndRewardPmp({
        userId: "user-demo-housing-1",
        bookCode: "HP-2026-R2",
        pageNumber: 48,
        detectedMarkings: mockDetected,
      });

      if (res.newBalance) {
        setUserBalance(res.newBalance);
      }

      setScanResult({
        page: 48,
        bookTitle: verifiedBookTitle || "2026 주택관리사 2차 관계법규 회독 기출문제집",
        detectedCount: mockDetected.length,
        stars: [
          {
            question: 14,
            option: 2,
            text: "관리주체는 예산안을 회계연도 개시 30일 전까지 제출해야 한다.",
          },
          {
            question: 16,
            option: 5,
            text: "하자진단비용은 하자보수보증금에서 우선 지출할 수 있다.",
          },
        ],
        xmarks: [
          {
            question: 15,
            option: 4,
            text: "동별 대표자의 임기는 2년으로 하되 1회에 한하여 중임할 수 있다.",
          },
        ],
        earnedPmp: res.earnedPmp,
        isSerialVerified: res.isSerialVerified ?? isSerialVerified,
        rewardMessage: res.message,
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <MobileAppShell>
      {/* 상단 앱 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#FF5A36]" />
          <h1 className="text-sm font-black text-white">종이책 AI 비전 스캐너</h1>
        </div>

        {isSerialVerified ? (
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>정품인증 (+40 PMP)</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsSerialModalOpen(true)}
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-amber-300 border border-amber-500/30 flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3" />
            <span>정품 키 등록</span>
          </button>
        )}
      </header>

      {/* 시리얼 미등록 배너 */}
      {!isSerialVerified && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-amber-200 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              정품 시리얼 등록 시 스캔당 <strong>+40 PMP</strong> 즉시 적립!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSerialModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] shrink-0"
          >
            등록
          </button>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* 📸 스마트폰 카메라 뷰파인더 프레임 */}
        <div className="relative rounded-3xl bg-[#0A0A0D] border border-white/[0.1] p-5 overflow-hidden shadow-2xl">
          {/* 모서리 L자 스캔 가이드라인 */}
          <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#16161C] to-[#0E0E12] p-6 text-center space-y-4">
            <span className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#FF5A36] rounded-tl-lg" />
            <span className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#FF5A36] rounded-tr-lg" />
            <span className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#FF5A36] rounded-bl-lg" />
            <span className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#FF5A36] rounded-br-lg" />

            {/* 레이저 스캔바 애니메이션 */}
            <div
              className={`absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[#FF5A36] to-transparent shadow-[0_0_12px_#FF5A36] transition-all duration-700 ${
                isScanning ? "top-3/4 opacity-100 animate-pulse" : "top-1/3 opacity-60"
              }`}
            />

            <div className="w-14 h-14 rounded-2xl bg-[#FF5A36]/15 border border-[#FF5A36]/40 text-[#FF5A36] flex items-center justify-center mx-auto">
              <ScanLine className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="text-[10.5px] font-black text-[#FF7A59] tracking-wide">
                기본값 O(빈칸) · ★/X 마킹만 1초 핀포인트 인식
              </div>
              <h2 className="text-base font-black text-white">
                기출문제집 마킹 존을 비추세요
              </h2>
              <p className="text-[11px] text-slate-400">
                어뷰징 방어: 동일 페이지는 1일 1회 보상 인정
              </p>
            </div>

            {/* 대형 셔터 버튼 */}
            <button
              type="button"
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(255,90,54,0.4)] transition disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Vision AI 마킹 분석 중...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>
                    {isSerialVerified
                      ? "종이책 스캔 촬영 (+40 PMP)"
                      : "종이책 페이지 체험 촬영하기"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 스캔 결과 카드 */}
        {scanResult && (
          <div className="rounded-3xl bg-[#1A1A21] border border-white/[0.08] p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#FF7A59]">
                  인식 완료 · p.{scanResult.page}
                </span>
                <h3 className="text-xs font-black text-white">
                  검출된 ★/X 선지 ({scanResult.detectedCount}개)
                </h3>
              </div>

              {scanResult.earnedPmp > 0 ? (
                <div className="text-right">
                  <span className="text-[11px] font-black text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/30">
                    +{scanResult.earnedPmp} PMP 적립
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    잔액 {userBalance.toLocaleString()}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSerialModalOpen(true)}
                  className="text-[10.5px] font-black text-amber-300 bg-amber-950/70 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>시리얼 등록 시 +40 PMP</span>
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>★ 긴가민가 선지 ({scanResult.stars.length}개)</span>
              </div>
              {scanResult.stars.map((s, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#121216] border border-white/[0.05] space-y-0.5"
                >
                  <span className="text-[10px] font-mono text-slate-400">
                    {s.question}번 문항 · {s.option}번 선지
                  </span>
                  <p className="text-slate-200 text-[11.5px]">{s.text}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-rose-400 flex items-center gap-1">
                <X className="w-3.5 h-3.5" />
                <span>X 틀린 선지 ({scanResult.xmarks.length}개)</span>
              </div>
              {scanResult.xmarks.map((x, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#121216] border border-white/[0.05] space-y-0.5"
                >
                  <span className="text-[10px] font-mono text-slate-400">
                    {x.question}번 문항 · {x.option}번 선지
                  </span>
                  <p className="text-slate-200 text-[11.5px]">{x.text}</p>
                </div>
              ))}
            </div>

            <Link
              href="/study/ox"
              className="w-full py-3 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white font-black text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>검출된 선지 3초 컷 O/X 복습 시작</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* 정품 시리얼 등록 모달 (z-50) */}
      <SerialRegisterModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        onSuccess={(data) => {
          setIsSerialVerified(true);
          setVerifiedBookTitle(data.bookTitle);
        }}
      />
    </MobileAppShell>
  );
}
