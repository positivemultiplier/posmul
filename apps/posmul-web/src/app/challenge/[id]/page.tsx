"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Lock,
  Clock,
  Trophy,
  Flame,
  Send,
  Users,
  ShieldCheck,
  Sparkles,
  Swords,
  LogIn,
} from "lucide-react";
import { UserChallengeDTO, ChallengeCommentDTO } from "../types";
import {
  getChallengeDetailAction,
  participateChallengeAction,
  getChallengeCommentsAction,
  postChallengeCommentAction,
  settleChallengeAction,
  acceptChallengeResultAction,
  disputeChallengeResultAction,
  getRivalRecordAction,
} from "../actions/challenge.actions";

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<UserChallengeDTO | null>(null);
  const [comments, setComments] = useState<ChallengeCommentDTO[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [selectedBetOption, setSelectedBetOption] = useState<string>("B");
  const [betAmount, setBetAmount] = useState<number>(300);

  // 라이벌 전적
  const [rivalRecord, setRivalRecord] = useState<{
    isSelf: boolean;
    isLoggedIn: boolean;
    myWins: number;
    hostWins: number;
    totalMatches: number;
    netPmpWon: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isBetting, setIsBetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [certCopied, setCertCopied] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState("");

  const commentEndRef = useRef<HTMLDivElement>(null);

  // 1. 챌린지 상세 및 댓글 로드
  const loadData = async () => {
    try {
      const res = await getChallengeDetailAction(challengeId);
      if (res.success && res.challenge) {
        setChallenge(res.challenge);
        if (res.challenge.options.length >= 2 && !res.challenge.myBet) {
          setSelectedBetOption(res.challenge.options[1].id);
        }

        // 호스트와의 1:1 라이벌 전적 로드
        getRivalRecordAction(res.challenge.hostId).then((rRes) => {
          if (rRes.success) {
            setRivalRecord(rRes);
          }
        });
      }
      const cRes = await getChallengeCommentsAction(challengeId);
      if (cRes.success) {
        setComments(cRes.comments);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [challengeId]);

  // 2. 실시간 마감 타이머
  useEffect(() => {
    if (!challenge) return;

    const timer = setInterval(() => {
      const closeMs = new Date(challenge.eventStartAt).getTime();
      const diffMs = closeMs - Date.now();

      if (challenge.status === "SETTLED") {
        setTimeLeftStr("정산 완료 🏆");
      } else if (diffMs <= 0 || challenge.status === "LOCKED") {
        setTimeLeftStr("베팅 마감 (결과 대기)");
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setTimeLeftStr(
          `마감까지 ${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge]);

  // 3. 베팅 제출 (로그인 필수)
  const handleBetSubmit = async () => {
    if (!challenge || challenge.myBet || challenge.status !== "OPEN") return;

    if (rivalRecord && !rivalRecord.isLoggedIn) {
      if (confirm("상대방과 라이벌 전적을 영구 기록하려면 로그인이 필요합니다. 로그인 페이지로 이동할까요?")) {
        router.push(`/auth/login?redirectTo=/challenge/${challengeId}`);
      }
      return;
    }

    setIsBetting(true);
    try {
      const res = await participateChallengeAction({
        challengeId,
        optionId: selectedBetOption,
        amountPmp: betAmount,
      });

      if (res.success) {
        await loadData();
      } else if (res.requireLogin) {
        router.push(`/auth/login?redirectTo=/challenge/${challengeId}`);
      } else {
        alert(res.error || "베팅 참여 실패");
      }
    } finally {
      setIsBetting(false);
    }
  };

  // 4. 댓글 작성
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const msg = commentInput.trim();
    setCommentInput("");

    await postChallengeCommentAction({
      challengeId,
      message: msg,
      optionId: challenge?.myBet?.optionId,
    });

    const cRes = await getChallengeCommentsAction(challengeId);
    if (cRes.success) {
      setComments(cRes.comments);
      commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 5. 정산 제안 처리 (호스트 전용)
  const handleSettle = async (optId: string, optLabel: string) => {
    if (
      !confirm(
        `'${optLabel}' 옵션을 승리로 확정 제안하시겠습니까?\n(대결 성사 시 10분 이의제기 대기 후 또는 상대 인정(GG) 시 즉시 PMP가 분배됩니다)`
      )
    ) {
      return;
    }

    const res = await settleChallengeAction({
      challengeId,
      winningOptionId: optId,
    });
    if (res.success) {
      if (res.resultStatus === "VOID") {
        alert("반대편 참여자가 없어 참여자 전원에게 원금 100% PMP가 환불되었습니다.");
      } else {
        alert("결과 확정 제안이 등록되었습니다! (10분 이내 이의가 없거나 패자가 GG 인정 시 즉시 정산됩니다)");
      }
      loadData();
    } else {
      alert(res.error || "정산 실패");
    }
  };

  // 5-1. 패자 1초 결과 인정 (GG) 즉시 정산
  const handleAcceptResult = async () => {
    if (!confirm("호스트 판정을 인정(GG)하고 즉시 승자에게 PMP를 정산할까요?")) return;
    const res = await acceptChallengeResultAction({ challengeId });
    if (res.success) {
      alert("GG 인정 완료! 승자 PMP 및 호스트 수수료가 즉시 지급되었습니다.");
      loadData();
    } else {
      alert(res.error || "처리 실패");
    }
  };

  // 5-2. 판정 이의 제기
  const handleDisputeResult = async () => {
    if (
      !confirm(
        "호스트 판정에 이의를 제기하시겠습니까?\n(참여자 30% 이상 동의 시 즉시 무효 처리되어 전원 원금 100% PMP가 환불됩니다)"
      )
    ) {
      return;
    }
    const res = await disputeChallengeResultAction({ challengeId });
    if (res.success) {
      if (res.voided) {
        alert("이의제기 기준을 충족하여 무효 처리 및 전액 PMP 환불이 완료되었습니다.");
      } else {
        alert("판정 이의가 접수되었습니다.");
      }
      loadData();
    } else {
      alert(res.error || "이의제기 실패");
    }
  };

  // 단톡방 초대 문구 + 링크 복사 (바이럴용)
  const handleCopyLink = () => {
    const url = window.location.href;
    const inviteText = challenge
      ? `🥊 [PosMul ${challenge.linkedGameTitle ? "꼬리 내기" : "맞짱 도전장"}]\n"${challenge.title}"\n💰 총 판돈 ${challenge.totalPoolPmp.toLocaleString()} PMP · 지금 들어와서 한판 붙자!\n👉 ${url}`
      : url;
    navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 모바일 OS 공유 시트 (카톡/메신저 앱 선택) 또는 URL 복사 폴백
  const handleNativeShare = async () => {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function" && challenge) {
      try {
        await navigator.share({
          title: `🥊 [${challenge.hostName}] ${challenge.title}`,
          text: `총 판돈 ${challenge.totalPoolPmp.toLocaleString()} PMP 맞짱! 내 편에 서거나 맞불을 놓으세요.`,
          url,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 트위터(X) 공유
  const handleShareTwitter = () => {
    if (!challenge) return;
    const url = window.location.href;
    const tweetText = `🥊 [PosMul 맞짱 챌린지]\n"${challenge.title}"\n\n호스트 [${challenge.hostName}]님의 도전장! 지금 바로 참여하세요!\n👉 ${url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank");
  };

  // 승리 인증 텍스트 복사
  const handleCopyVictoryCert = () => {
    if (!challenge) return;
    const winningLabel = challenge.winningOptionLabel || "승리";
    const certText = `🏆 [PosMul 승리 인증서]\n대결 주제: "${challenge.title}"\n결과: [${winningLabel}] 최종 적중 성공!\n호스트 [${challenge.hostName}]을(를) 꺾고 PMP 쟁취 완료 👑\n👉 https://posmul.com/challenge/${challenge.id}`;
    navigator.clipboard.writeText(certText);
    setCertCopied(true);
    setTimeout(() => setCertCopied(false), 2000);
  };

  if (isLoading || !challenge) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">맞짱 내기 룸을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const isSettled = challenge.status === "SETTLED";
  const isVoid = challenge.status === "VOID";
  const isPendingSettlement = challenge.status === "PENDING_SETTLEMENT";
  const isClosedOrLocked =
    challenge.status === "LOCKED" || isPendingSettlement || isSettled || isVoid;
  const optionA = challenge.options[0];
  const optionB = challenge.options[1];
  const isWinner =
    challenge.myBet &&
    challenge.winningOptionId &&
    challenge.myBet.optionId === challenge.winningOptionId;
  const isPendingLoser =
    Boolean(
      isPendingSettlement &&
        challenge.myBet &&
        challenge.pendingWinningOptionId &&
        challenge.myBet.optionId !== challenge.pendingWinningOptionId
    );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-6 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 상단 네비게이션 & 공유 바 */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <Link
            href="/challenge"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>챌린지 목록</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareTwitter}
              className="px-2.5 py-1.5 rounded-xl bg-black hover:bg-slate-900 border border-white/20 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition"
            >
              <span>𝕏</span>
              <span className="hidden sm:inline">트위터</span>
            </button>
            <button
              type="button"
              onClick={handleNativeShare}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-100 text-xs font-bold flex items-center gap-1.5 transition"
              title="메신저/앱으로 공유"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">공유</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow-md"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "초대장 복사됨!" : "카톡 초대"}</span>
            </button>
          </div>
        </div>

        {/* 🌟 1:1 라이벌 전적실 배지 (로그인 유저 대상 영구 기록) */}
        {rivalRecord && !rivalRecord.isSelf && rivalRecord.isLoggedIn && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950/40 via-purple-950/30 to-slate-900 border border-red-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-bold text-slate-200">
                호스트 <strong className="text-amber-400">[{challenge.hostName}]</strong>님과의 1:1 라이벌 전적:
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono font-black">
              {rivalRecord.totalMatches > 0 ? (
                <>
                  <span className="text-emerald-400">{rivalRecord.myWins}승</span>
                  <span className="text-slate-600">-</span>
                  <span className="text-rose-400">{rivalRecord.hostWins}패</span>
                  <span className="text-[11px] text-amber-300 ml-1">
                    ({rivalRecord.netPmpWon >= 0 ? `+${rivalRecord.netPmpWon}` : rivalRecord.netPmpWon} PMP)
                  </span>
                </>
              ) : (
                <span className="text-slate-400 text-[11px]">첫 맞짱 대결! 🥊</span>
              )}
            </div>
          </div>
        )}

        {/* 꼬리 내기 원본 마켓 연결 배지 */}
        {challenge.linkedGameTitle && (
          <Link
            href={
              challenge.linkedGameSlug
                ? `/prediction/${challenge.linkedGameSlug}`
                : "/prediction"
            }
            className="p-3 rounded-2xl bg-sky-950/40 border border-sky-500/30 hover:border-sky-400/60 text-xs flex items-center justify-between gap-2 transition group"
          >
            <span className="text-sky-300 font-bold truncate">
              🔗 공식 예측 꼬리 내기: <strong className="text-white">{challenge.linkedGameTitle}</strong>
            </span>
            <span className="text-[11px] font-black text-sky-400 shrink-0 group-hover:underline">
              원본 마켓 보기 →
            </span>
          </Link>
        )}

        {/* 1. 상태 배너 (정산 완료 / 환불 / 이의제기 골든타임 / 마감 알림) */}
        {isSettled ? (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  <strong>🏆 정산 완료!</strong> 최종 승리 옵션:{" "}
                  <span className="text-white font-black underline underline-offset-2">
                    {challenge.winningOptionLabel || "승리 확정"}
                  </span>
                </span>
              </div>
              {isWinner && (
                <button
                  type="button"
                  onClick={() => setShowCertModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1 shadow-md transition"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>승리 인증서 자랑하기 👑</span>
                </button>
              )}
            </div>
            {challenge.payoutDetails && (
              <div className="text-[11px] text-emerald-200/80 font-mono pt-1 border-t border-emerald-500/20 flex flex-wrap gap-3">
                <span>총 풀 {Number(challenge.payoutDetails.total_pool_pmp || 0).toLocaleString()} PMP</span>
                <span>· 호스트 수수료 +{Number(challenge.payoutDetails.host_fee_pmp || 0).toLocaleString()} PMP</span>
                <span>· 소각 {Number(challenge.payoutDetails.burn_pmp || 0).toLocaleString()} PMP</span>
              </div>
            )}
          </div>
        ) : isVoid ? (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-600/50 text-slate-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
              <span>
                <strong>↩️ 무효 처리 · 원금 100% 환불 완료</strong> (참여자 이의제기 또는 반대편 미참여)
              </span>
            </div>
          </div>
        ) : isPendingSettlement ? (
          <div className="p-4 rounded-2xl bg-indigo-950/70 border border-indigo-400/50 text-indigo-200 text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>⚖️ 공정 합의 대기 중 (10분 골든타임)</strong> — 방장 판정:{" "}
                  <strong className="text-white underline">
                    {challenge.pendingWinningOptionLabel || challenge.pendingWinningOptionId}
                  </strong>
                </span>
              </div>
              <span className="text-[11px] font-mono text-amber-300">
                이의제기 {challenge.disputeCount}명
              </span>
            </div>

            {challenge.myBet && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {isPendingLoser && (
                  <button
                    type="button"
                    onClick={handleAcceptResult}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md"
                  >
                    🤝 결과 인정 (GG) · 1초 만에 정산 완료
                  </button>
                )}
                <button
                  type="button"
                  disabled={Boolean(challenge.hasDisputed)}
                  onClick={handleDisputeResult}
                  className={`px-3.5 py-2 rounded-xl font-black text-xs border transition ${
                    challenge.hasDisputed
                      ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                      : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40"
                  }`}
                >
                  {challenge.hasDisputed
                    ? "이의 제기 완료됨"
                    : "🚨 판정 이의 제기 (30% 이상 시 전액 환불)"}
                </button>
              </div>
            )}
          </div>
        ) : isClosedOrLocked ? (
          <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>🔒 베팅 마감!</strong> 경기/상황이 시작되어 추가 베팅이 잠겼습니다.
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-400">결과 대기 중</span>
          </div>
        ) : null}

        {/* 2. 메인 매치 카드 */}
        <div className="bg-[#111520] border border-white/[0.08] p-6 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
          {/* 상단 뱃지 & 마감 카운트다운 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-black">
                🥊 {challenge.hostName}님의 맞짱 챌린지
              </span>
              <span className="text-[11px] text-slate-500 font-bold">
                {challenge.visibility === "PRIVATE" ? "🔒 비공개 링크" : "🌐 오픈 매치"}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{timeLeftStr}</span>
            </span>
          </div>

          {/* 대형 질문 제목 */}
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-snug break-keep">
            "{challenge.title}"
          </h1>

          {/* 대결 게이지 바 */}
          {optionA && optionB && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-black">
                <span className="text-sky-400 flex items-center gap-1">
                  <span>🔴 {optionA.label}</span>
                  <span className="font-mono">({optionA.ratio}%)</span>
                </span>
                <span className="text-rose-400 flex items-center gap-1">
                  <span className="font-mono">({optionB.ratio}%)</span>
                  <span>🔵 {optionB.label}</span>
                </span>
              </div>

              <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex p-0.5 border border-white/[0.08]">
                <div
                  className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-l-full transition-all duration-300"
                  style={{ width: `${optionA.ratio}%` }}
                />
                <div
                  className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-r-full transition-all duration-300"
                  style={{ width: `${optionB.ratio}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>{optionA.votes}명 ({optionA.pmp.toLocaleString()} PMP)</span>
                <span>{optionB.votes}명 ({optionB.pmp.toLocaleString()} PMP)</span>
              </div>
            </div>
          )}

          {/* 판돈 정보 요약 */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-amber-400 font-black flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>총 판돈: {challenge.totalPoolPmp.toLocaleString()} PMP</span>
            </span>
            <span className="text-slate-400 text-[11px]">
              호스트 수수료: 3% ({challenge.hostFeePmp.toLocaleString()} PMP)
            </span>
          </div>
        </div>

        {/* 3. 베팅 참여 구역 */}
        <div className="bg-[#111520] border border-white/[0.08] p-5 sm:p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center justify-between">
            <span>내 선택 & 맞불 베팅</span>
            {challenge.myBet && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
                ✓ 베팅 완료 ({challenge.myBet.amountPmp.toLocaleString()} PMP)
              </span>
            )}
          </h3>

          {!challenge.myBet && !isClosedOrLocked ? (
            <div className="space-y-4">
              {/* 비로그인 유저일 때 로그인 유도 배너 */}
              {rivalRecord && !rivalRecord.isLoggedIn && (
                <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-between text-xs">
                  <span className="text-blue-300">
                    전적을 기록하고 PMP를 뺏어오려면 로그인이 필요합니다.
                  </span>
                  <Link
                    href={`/auth/login?redirectTo=/challenge/${challengeId}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black shrink-0 flex items-center gap-1"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>3초 로그인</span>
                  </Link>
                </div>
              )}

              {/* 옵션 선택 버튼들 */}
              <div className="grid grid-cols-2 gap-3">
                {challenge.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedBetOption(opt.id)}
                    className={`p-3.5 rounded-2xl text-xs font-black border transition-all text-left flex items-center justify-between ${
                      selectedBetOption === opt.id
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 scale-[1.02]"
                        : "bg-[#0c0f17] text-slate-300 border-white/[0.08] hover:border-amber-400/50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="font-mono text-[11px] opacity-75">
                      {opt.ratio}%
                    </span>
                  </button>
                ))}
              </div>

              {/* 금액 선택 */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-bold shrink-0">판돈:</span>
                <div className="flex gap-2 flex-1">
                  {[100, 300, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBetAmount(amt)}
                      className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                        betAmount === amt
                          ? "bg-slate-200 text-slate-950 border-white font-black"
                          : "bg-slate-900 text-slate-400 border-white/[0.06] hover:text-white"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 베팅 버튼 */}
              <button
                type="button"
                onClick={handleBetSubmit}
                disabled={isBetting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isBetting ? (
                  <span>베팅 처리 중...</span>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    <span>
                      [{challenge.options.find((o) => o.id === selectedBetOption)?.label}]에 {betAmount.toLocaleString()} PMP 맞불 베팅 🥊
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#0c0f17] border border-white/[0.06] text-center space-y-1">
              <div className="text-xs font-bold text-slate-300">
                {challenge.myBet ? (
                  <span>
                    당신은{" "}
                    <strong className="text-amber-400">
                      [{challenge.options.find((o) => o.id === challenge.myBet?.optionId)?.label}]
                    </strong>
                    에 {challenge.myBet.amountPmp.toLocaleString()} PMP를 베팅하셨습니다!
                  </span>
                ) : (
                  <span>베팅이 마감되어 더 이상 참여할 수 없습니다.</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">결과 발표 후 승패에 따라 PMP가 정산됩니다.</p>
            </div>
          )}
        </div>

        {/* 4. 호스트 정산 컨트롤러 (결과 대기 중일 때 실제 호스트에게만 노출) */}
        {!isSettled && !isVoid && !isPendingSettlement && challenge.isHost && (
          <div className="p-4 rounded-3xl bg-[#0e121c] border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>방장 결과 확정 (정산)</span>
              </span>
              <span className="text-[11px] text-slate-500">결과 발생 시 승자 선택 (이의제기 없으면 10분 후 지급)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {challenge.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSettle(opt.id, opt.label)}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-emerald-950/60 border border-white/[0.08] hover:border-emerald-500/40 text-xs font-bold text-slate-300 hover:text-emerald-300 transition"
                >
                  [{opt.label}] 승리 확정 🏆
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. 단톡방형 타임라인 대화 스레드 (댓글) */}
        <div className="bg-[#111520] border border-white/[0.08] rounded-3xl overflow-hidden shadow-xl">
          <div className="px-5 py-3.5 bg-[#0c0f17] border-b border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>친구들의 썰전 & 응원톡 ({comments.length})</span>
            </div>
            <span className="text-[11px] text-slate-500">실시간 대화</span>
          </div>

          {/* 댓글 목록 */}
          <div className="p-4 max-h-[300px] overflow-y-auto space-y-3 text-xs divide-y divide-white/[0.04]">
            {comments.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                아직 대화가 없습니다. 친구들에게 첫 한마디를 남겨보세요!
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="pt-2.5 flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-200">{c.userName}</span>
                      {c.optionId && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-amber-400 border border-slate-700">
                          {c.optionId}픽
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600 font-mono">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-slate-300 break-words leading-relaxed">{c.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={commentEndRef} />
          </div>

          {/* 댓글 입력창 */}
          <form onSubmit={handleCommentSubmit} className="p-3 bg-[#0c0f17] border-t border-white/[0.06] flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="친구들에게 도발 멘트 남기기..."
              className="flex-1 bg-[#121621] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition font-bold"
              title="전송"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 🌟 6. 황금 승리 인증서 모달 (승리자 전용) */}
        {showCertModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111520] border-2 border-amber-400/60 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl text-center relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-amber-500/30">
                👑
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                  PosMul Victory Certificate
                </div>
                <h3 className="text-xl font-black text-white">
                  맞짱 대결 승리 인증서
                </h3>
                <p className="text-xs text-slate-400">
                  호스트 [{challenge.hostName}]님과의 한판 승부에서 완승!
                </p>
              </div>

              {/* 인증서 박스 */}
              <div className="p-4 rounded-2xl bg-[#090b12] border border-amber-500/30 text-left space-y-2 text-xs font-mono">
                <div className="text-slate-400 text-[11px]">대결: "{challenge.title}"</div>
                <div className="text-amber-300 font-bold">내 선택: [{challenge.winningOptionLabel}] 적중!</div>
                <div className="text-emerald-400 font-bold">획득 상금: +{challenge.myBet?.amountPmp.toLocaleString()} PMP</div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCopyVictoryCert}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition"
                >
                  {certCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{certCopied ? "자랑용 인증서 복사 완료!" : "카톡/단톡방에 자랑하기 복사"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
