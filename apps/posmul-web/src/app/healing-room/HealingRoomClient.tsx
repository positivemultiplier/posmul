"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Compass,
  Edit3,
  Heart,
  Home,
  Lock,
  LogIn,
  MapPin,
  MessageCircle,
  Music,
  RefreshCw,
  Send,
  ShoppingBag,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";
import {
  ALL_HEALING_ITEMS,
  BGM_TRACKS,
  MINIMI_STYLES,
  MOOD_TAGS,
  ROOM_PROPS,
  ROOM_THEMES,
  type AnyHealingItem,
  type HealingItemCategory,
} from "./healing-room-catalog";
import type { HealingRoomPageData } from "./healing-room-service";

interface HealingRoomClientProps {
  initialData: HealingRoomPageData;
}

type BottomTabKey = "showcase" | "shop" | "guestbook";
type ShopCategoryFilter = "all" | HealingItemCategory;

interface FeedbackNotice {
  type: "success" | "error" | "info";
  message: string;
}

const RELATION_PRESETS = ["PosMul 일촌", "동네 이웃", "예측 동지", "응원 손님"] as const;

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function HealingRoomClient({ initialData }: HealingRoomClientProps) {
  const [data, setData] = useState<HealingRoomPageData>(initialData);
  const [activeTab, setActiveTab] = useState<BottomTabKey>("showcase");
  const [shopFilter, setShopFilter] = useState<ShopCategoryFilter>("all");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<FeedbackNotice | null>(null);
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [minimiGreeting, setMinimiGreeting] = useState<string | null>(null);

  // 프로필 편집 폼 상태
  const [editTitle, setEditTitle] = useState(initialData.room.roomTitle);
  const [editStatus, setEditStatus] = useState(initialData.room.statusMessage);
  const [editQuote, setEditQuote] = useState(initialData.room.minimiQuote);
  const [editMood, setEditMood] = useState(initialData.room.moodTag);
  const [editBgm, setEditBgm] = useState(initialData.room.bgmTrack);

  // 방명록 작성 상태
  const [guestContent, setGuestContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestRelation, setGuestRelation] = useState<string>(
    initialData.isAuthenticated ? "PosMul 일촌" : "동네 이웃"
  );

  // Web Audio API 앰비언트 BGM 상태
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmTimerRef = useRef<number | null>(null);
  const noteStepRef = useRef(0);

  const { room, isOwner, isAuthenticated, viewerPmpBalance, ownerStats } = data;

  const activeTheme = useMemo(
    () => ROOM_THEMES.find((t) => t.id === room.roomTheme) ?? ROOM_THEMES[0],
    [room.roomTheme]
  );

  const activeMinimi = useMemo(
    () => MINIMI_STYLES.find((m) => m.id === room.minimiStyle) ?? MINIMI_STYLES[0],
    [room.minimiStyle]
  );

  const activeBgm = useMemo(
    () => BGM_TRACKS.find((track) => track.id === room.bgmTrack) ?? BGM_TRACKS[0],
    [room.bgmTrack]
  );

  const placedPropItems = useMemo(
    () => ROOM_PROPS.filter((prop) => room.placedItems.includes(prop.id)),
    [room.placedItems]
  );

  const unlockedTrophies = useMemo(
    () => data.trophies.filter((trophy) => trophy.unlocked),
    [data.trophies]
  );

  const ownedSet = useMemo(() => new Set(room.ownedItems), [room.ownedItems]);

  const filteredShopItems = useMemo(() => {
    if (shopFilter === "all") {
      return ALL_HEALING_ITEMS;
    }
    return ALL_HEALING_ITEMS.filter((item) => item.category === shopFilter);
  }, [shopFilter]);

  // 방 데이터가 바뀔 때 편집 입력창 동기화
  useEffect(() => {
    setEditTitle(room.roomTitle);
    setEditStatus(room.statusMessage);
    setEditQuote(room.minimiQuote);
    setEditMood(room.moodTag);
    setEditBgm(room.bgmTrack);
    setSelectedPropId(null);
  }, [
    room.userId,
    room.roomTitle,
    room.statusMessage,
    room.minimiQuote,
    room.moodTag,
    room.bgmTrack,
  ]);

  // Web Audio API BGM 재생/정지 제어
  useEffect(() => {
    const stopBgmAudio = () => {
      if (bgmTimerRef.current !== null) {
        window.clearInterval(bgmTimerRef.current);
        bgmTimerRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close().catch(() => undefined);
        audioCtxRef.current = null;
      }
    };

    if (!isBgmPlaying) {
      stopBgmAudio();
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) {
      setIsBgmPlaying(false);
      setNotice({
        type: "info",
        message: "현재 브라우저에서는 Web Audio BGM 재생을 지원하지 않습니다.",
      });
      return;
    }

    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;
    noteStepRef.current = 0;

    const playAmbientNote = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        return;
      }
      const notes = activeBgm.frequencies;
      const freq = notes[noteStepRef.current % notes.length];
      noteStepRef.current += 1;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = activeBgm.waveform;
      osc.frequency.setValueAtTime(freq, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(950, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.9);
    };

    playAmbientNote();
    bgmTimerRef.current = window.setInterval(playAmbientNote, 1350);

    return stopBgmAudio;
  }, [isBgmPlaying, activeBgm]);

  const showNotice = (type: FeedbackNotice["type"], message: string) => {
    setNotice({ type, message });
  };

  async function postAction(payload: Record<string, unknown>, successMessage: string) {
    setIsBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/healing-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as {
        success?: boolean;
        data?: HealingRoomPageData;
        error?: string;
      };
      if (!response.ok || !json.success || !json.data) {
        showNotice("error", json.error || "요청을 처리하지 못했습니다.");
        return false;
      }
      setData(json.data);
      showNotice("success", successMessage);
      return true;
    } catch {
      showNotice("error", "네트워크 연결 상태를 확인한 후 다시 시도해주세요.");
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function visitRoom(options: { targetUserId?: string; wave?: boolean }) {
    setIsBusy(true);
    setNotice(null);
    try {
      const params = new URLSearchParams();
      if (options.wave) {
        params.set("wave", "1");
        params.set("currentRoomUserId", room.userId);
      } else if (options.targetUserId) {
        params.set("userId", options.targetUserId);
      }
      params.set("visit", "1");

      const response = await fetch(`/api/healing-room?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as {
        success?: boolean;
        data?: HealingRoomPageData;
        error?: string;
      };
      if (!response.ok || !json.success || !json.data) {
        showNotice("error", json.error || "이웃 힐링룸으로 이동하지 못했습니다.");
        return;
      }
      setData(json.data);
      setIsEditingProfile(false);
      showNotice(
        "info",
        `🌊 ${json.data.room.ownerNickname}님의 힐링룸에 놀러왔어요!`
      );
    } catch {
      showNotice("error", "파도타기 중 통신 오류가 발생했습니다.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    const ok = await postAction(
      {
        action: "update_room",
        roomTitle: editTitle,
        statusMessage: editStatus,
        minimiQuote: editQuote,
        moodTag: editMood,
        bgmTrack: editBgm,
      },
      "✨ 내 힐링룸 프로필과 BGM 설정을 저장했습니다."
    );
    if (ok) {
      setIsEditingProfile(false);
    }
  }

  async function handleEquipOwnedItem(item: AnyHealingItem) {
    if (!isOwner) {
      showNotice("info", "내 힐링룸으로 돌아가서 꾸밀 수 있습니다.");
      return;
    }

    if (item.category === "theme") {
      await postAction(
        { action: "update_room", roomTheme: item.id },
        `🏠 '${item.name}' 미니룸 테마를 적용했습니다.`
      );
      return;
    }

    if (item.category === "minimi") {
      await postAction(
        { action: "update_room", minimiStyle: item.id },
        `🧸 '${item.name}' 미니미 코디를 장착했습니다.`
      );
      return;
    }

    const alreadyPlaced = room.placedItems.includes(item.id);
    const nextPlaced = alreadyPlaced
      ? room.placedItems.filter((id) => id !== item.id)
      : [...room.placedItems, item.id].slice(0, 8);

    await postAction(
      { action: "update_room", placedItems: nextPlaced },
      alreadyPlaced
        ? `📦 '${item.name}' 소품을 보관함으로 치웠습니다.`
        : `🪴 '${item.name}' 소품을 미니룸에 배치했습니다.`
    );
  }

  async function handleBuyItem(item: AnyHealingItem) {
    if (!isAuthenticated) {
      showNotice("info", "로그인하면 보유 PMP로 나만의 힐링룸 아이템을 구매할 수 있습니다.");
      return;
    }
    if (!isOwner) {
      showNotice("info", "먼저 '내 방으로' 이동한 뒤 아이템을 구매해주세요.");
      return;
    }
    await postAction(
      {
        action: "buy_item",
        itemId: item.id,
        equipOnBuy: true,
      },
      item.pricePmp > 0
        ? `🛒 ${item.pricePmp.toLocaleString()} PMP로 '${item.name}'을(를) 구매하고 바로 적용했습니다!`
        : `✨ '${item.name}' 아이템을 무료로 적용했습니다!`
    );
  }

  async function handleWriteGuestbook(event: React.FormEvent) {
    event.preventDefault();
    if (guestContent.trim().length < 2) {
      showNotice("error", "따뜻한 일촌평을 2자 이상 입력해주세요.");
      return;
    }
    const ok = await postAction(
      {
        action: "write_guestbook",
        roomUserId: room.userId,
        content: guestContent,
        guestName: !isAuthenticated ? guestName : undefined,
        relationLabel: guestRelation,
      },
      "💌 정성스러운 일촌평이 방명록에 등록되었습니다."
    );
    if (ok) {
      setGuestContent("");
    }
  }

  function handleMinimiPoke() {
    const cheers = [
      "오늘도 현실의 짐을 내려놓고 잠시 쉬어가세요 ☕",
      `누적 ${ownerStats.totalDonatedPmc.toLocaleString()} PMC 나눔, 당신의 선한 영향력이 빛나요 🌱`,
      "집단지성과 따뜻함이 공존하는 나만의 아지트 ✨",
      "좋아하는 BGM을 켜고 내일의 변화를 그려보세요 🔮",
    ];
    const randomText = cheers[Math.floor(Math.random() * cheers.length)];
    setMinimiGreeting(randomText);
    window.setTimeout(() => {
      setMinimiGreeting((prev) => (prev === randomText ? null : prev));
    }, 3500);
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-16">
      {/* 은은한 배경 글로우 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-45">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* 상단 싸이월드 감성 미니홈피 컨트롤 바 */}
        <header className="mb-5 rounded-3xl border border-slate-700/70 bg-slate-900/85 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* 좌측 TODAY / TOTAL & 위치 */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-950/30 px-3.5 py-1.5 text-xs font-mono">
                <span className="text-amber-300 font-bold">TODAY</span>
                <span className="text-white font-extrabold">{room.todayVisits.toLocaleString()}</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">TOTAL</span>
                <span className="text-amber-200 font-bold">{room.totalVisits.toLocaleString()}</span>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-200">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                {room.regionLabel}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                  isOwner
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "border-sky-500/40 bg-sky-500/15 text-sky-300"
                }`}
              >
                {isOwner ? "👑 내 힐링룸" : "🌊 이웃 마실 모드"}
              </span>
            </div>

            {/* 중앙 제목 */}
            <div className="flex-1 lg:px-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  {room.roomTitle}
                </h1>
                <span className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-200">
                  {room.moodTag}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">{room.statusMessage}</p>
            </div>

            {/* 우측 BGM & 파도타기 컨트롤 */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Web Audio API 앰비언트 BGM 플레이어 */}
              <button
                type="button"
                onClick={() => setIsBgmPlaying((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                  isBgmPlaying
                    ? "border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-lg shadow-amber-500/10"
                    : "border-slate-700 bg-slate-800/90 text-slate-300 hover:bg-slate-800"
                }`}
                title={`${activeBgm.label} (${activeBgm.moodDesc})`}
              >
                {isBgmPlaying ? (
                  <Volume2 className="h-4 w-4 text-amber-300 animate-pulse" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-400" />
                )}
                <Music className="h-3.5 w-3.5" />
                <span>{isBgmPlaying ? `재생중 · ${activeBgm.label}` : `BGM · ${activeBgm.label}`}</span>
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => void visitRoom({ wave: true })}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-50"
              >
                <Waves className="h-4 w-4" />
                <span>파도타기</span>
              </button>

              {isAuthenticated && !isOwner && data.viewerUserId && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void visitRoom({ targetUserId: data.viewerUserId ?? undefined })}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  <Home className="h-4 w-4" />
                  <span>내 방으로</span>
                </button>
              )}

              {!isAuthenticated && (
                <Link
                  href="/auth/login?next=/healing-room"
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110"
                >
                  <LogIn className="h-4 w-4" />
                  <span>로그인하고 내 방 만들기</span>
                </Link>
              )}
            </div>
          </div>

          {/* 피드백 알림 배너 */}
          {notice && (
            <div
              className={`mt-3 flex items-center justify-between rounded-2xl border px-4 py-2.5 text-xs sm:text-sm ${
                notice.type === "error"
                  ? "border-rose-500/40 bg-rose-950/50 text-rose-200"
                  : notice.type === "success"
                    ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-200"
                    : "border-sky-500/40 bg-sky-950/50 text-sky-200"
              }`}
            >
              <span>{notice.message}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="ml-4 text-xs opacity-70 hover:opacity-100"
              >
                닫기
              </button>
            </div>
          )}
        </header>

        {/* 메인 12컬럼 미니홈피 본문: 좌측 프로필·명예선반(4) + 우측 2.5D 미니룸 무대(8) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 좌측 패널: 미니미 명함 + 프로필 편집 + 명예 트로피 선반 */}
          <aside className="space-y-5 lg:col-span-4">
            {/* 방 주인 카드 */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border bg-gradient-to-br text-3xl shadow-inner ${activeMinimi.auraClass}`}
                  >
                    <span>{activeMinimi.avatarEmoji}</span>
                    <span className="absolute -bottom-1.5 -right-1.5 rounded-full border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-sm shadow">
                      {activeMinimi.accessoryEmoji}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-white">{room.ownerNickname}</h2>
                      <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                        {activeMinimi.badgeLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{activeMinimi.name}</p>
                    {ownerStats.overallRank !== null && (
                      <p className="mt-1 text-xs font-semibold text-sky-300">
                        전체 시민 랭킹 #{ownerStats.overallRank.toLocaleString()} · 기여도{" "}
                        {ownerStats.contributionScore.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-amber-300" />
                    <span>{isEditingProfile ? "닫기" : "편집"}</span>
                  </button>
                )}
              </div>

              {/* PosMul 핵심 실적 요약 그리드 */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[11px] text-slate-400">보유 활동 재화 (PMP)</p>
                  <p className="mt-0.5 text-base font-extrabold text-sky-300">
                    {ownerStats.pmpBalance.toLocaleString()} <span className="text-xs">PMP</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[11px] text-slate-400">누적 공공 기부 (PMC)</p>
                  <p className="mt-0.5 text-base font-extrabold text-emerald-300">
                    {ownerStats.totalDonatedPmc.toLocaleString()} <span className="text-xs">PMC</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[11px] text-slate-400">개설한 예측게임</p>
                  <p className="mt-0.5 text-base font-extrabold text-amber-300">
                    {ownerStats.createdGamesCount.toLocaleString()} <span className="text-xs">개</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[11px] text-slate-400">예측 참여 발자취</p>
                  <p className="mt-0.5 text-base font-extrabold text-purple-300">
                    {ownerStats.predictionCount.toLocaleString()} <span className="text-xs">회</span>
                  </p>
                </div>
              </div>

              {/* 본인 방 편집 폼 */}
              {isOwner && isEditingProfile && (
                <form
                  onSubmit={(e) => void handleSaveProfile(e)}
                  className="mt-4 space-y-3 rounded-2xl border border-amber-500/30 bg-slate-950/80 p-3.5"
                >
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      미니홈피 제목
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      상태 메시지 (인사말)
                    </label>
                    <textarea
                      rows={2}
                      maxLength={140}
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      미니미 말풍선
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={editQuote}
                      onChange={(e) => setEditQuote(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      오늘의 기분 (일촌명)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {MOOD_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setEditMood(tag)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                            editMood === tag
                              ? "border-amber-400 bg-amber-500/20 text-amber-200"
                              : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      미니룸 BGM 선택
                    </label>
                    <select
                      value={editBgm}
                      onChange={(e) => setEditBgm(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                    >
                      {BGM_TRACKS.map((track) => (
                        <option key={track.id} value={track.id}>
                          🎵 {track.label} — {track.moodDesc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full rounded-xl bg-amber-500 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                  >
                    {isBusy ? "저장 중..." : "✨ 미니홈피 설정 저장"}
                  </button>
                </form>
              )}
            </section>

            {/* 영광의 선반 (실적 기반 해금 트로피) */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-extrabold text-white">영광의 선반 (명예 트로피)</h3>
                </div>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                  {unlockedTrophies.length} / {data.trophies.length} 해금
                </span>
              </div>
              <p className="mb-3 text-[11px] text-slate-400">
                PMP로 살 수 없는 진짜 명예! 실제 기부·예측·나눔 활동으로 자동 진열됩니다.
              </p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {data.trophies.map((trophy) => (
                  <div
                    key={trophy.id}
                    className={`flex items-start gap-3 rounded-2xl border p-3 transition ${
                      trophy.unlocked
                        ? "border-amber-500/35 bg-gradient-to-r from-amber-950/35 to-slate-900/80"
                        : "border-slate-800/80 bg-slate-950/50 opacity-65"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
                        trophy.unlocked
                          ? "bg-amber-500/20 shadow-inner"
                          : "bg-slate-800/80 grayscale"
                      }`}
                    >
                      {trophy.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-bold text-white">
                          {trophy.title}
                        </span>
                        {!trophy.unlocked && <Lock className="h-3 w-3 shrink-0 text-slate-500" />}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                        {trophy.description}
                      </p>
                      <p
                        className={`mt-1 text-[11px] font-semibold ${
                          trophy.unlocked ? "text-amber-300" : "text-slate-500"
                        }`}
                      >
                        {trophy.progressText}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          {/* 우측 메인 2.5D 미니룸 무대 & 이웃 파도타기 바 */}
          <section className="space-y-5 lg:col-span-8">
            <div className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/90 shadow-2xl">
              {/* 미니룸 2.5D 스테이지 */}
              <div
                className={`relative h-[370px] sm:h-[430px] w-full overflow-hidden bg-gradient-to-b ${activeTheme.gradientClass}`}
              >
                {/* 은은한 벽지 그리드 패턴 */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-15"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.45) 1px, transparent 0)",
                    backgroundSize: "24px 24px",
                  }}
                />

                {/* 창문 (좌상단 감성 창가) */}
                <div className="absolute left-6 top-6 sm:left-10 sm:top-8 z-10">
                  <div className="rounded-2xl border-4 border-amber-100/20 bg-slate-950/30 p-1.5 shadow-2xl backdrop-blur-sm">
                    <div
                      className={`relative h-28 w-40 sm:h-36 sm:w-52 overflow-hidden rounded-xl bg-gradient-to-b ${activeTheme.windowBgClass}`}
                    >
                      {/* 반짝이는 별/빛 */}
                      <div className="absolute right-4 top-3 h-7 w-7 rounded-full bg-white/40 blur-[1px]" />
                      <div className="absolute left-5 top-6 h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
                      <div className="absolute left-12 top-3 h-1 w-1 rounded-full bg-white/70 animate-ping" />
                      {/* 창살 십자 프레임 */}
                      <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-slate-950/35" />
                      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-slate-950/35" />
                    </div>
                    <p className="mt-1 text-center text-[10px] font-semibold text-white/80">
                      {activeTheme.icon} {activeTheme.windowLabel}
                    </p>
                  </div>
                </div>

                {/* 우상단 벽면 영광의 선반 (해금된 트로피 전시대) */}
                <div className="absolute right-5 top-6 sm:right-10 sm:top-8 z-10">
                  <div className="rounded-2xl border border-amber-300/25 bg-slate-950/45 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
                      🏅 명예 선반
                    </p>
                    {unlockedTrophies.length > 0 ? (
                      <div className="flex items-center gap-2">
                        {unlockedTrophies.slice(0, 4).map((trophy) => (
                          <div
                            key={trophy.id}
                            title={`${trophy.title}: ${trophy.progressText}`}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-lg shadow transition hover:scale-110"
                          >
                            {trophy.icon}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-300/80">첫 활동으로 채워보세요!</p>
                    )}
                    {/* 선반 받침대 느낌 */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gradient-to-r from-amber-700/80 via-amber-500/70 to-amber-700/80" />
                  </div>
                </div>

                {/* 바닥 (2.5D 원목 플로어) */}
                <div
                  className={`absolute inset-x-0 bottom-0 h-[42%] border-t border-white/15 bg-gradient-to-b ${activeTheme.floorClass}`}
                >
                  <div
                    className="h-full w-full opacity-20"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 48px)",
                    }}
                  />
                  {/* 중앙 러그 */}
                  <div className="absolute left-1/2 top-1/2 h-24 w-56 sm:h-28 sm:w-72 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/15 bg-white/10 shadow-inner backdrop-blur-[2px]" />
                </div>

                {/* 배치된 미니룸 소품들 */}
                {placedPropItems.map((prop) => {
                  const isSelected = selectedPropId === prop.id;
                  return (
                    <button
                      key={prop.id}
                      type="button"
                      onClick={() =>
                        setSelectedPropId((prev) => (prev === prop.id ? null : prop.id))
                      }
                      style={{
                        left: `${prop.posLeftPct}%`,
                        bottom: `${prop.posBottomPct}%`,
                      }}
                      className="group absolute -translate-x-1/2 z-20 flex flex-col items-center focus:outline-none"
                    >
                      {isSelected && (
                        <div className="mb-1.5 whitespace-nowrap rounded-xl border border-amber-300/40 bg-slate-950/90 px-2.5 py-1 text-[11px] text-amber-100 shadow-lg">
                          <span className="font-bold">{prop.name}</span> · {prop.badgeText}
                        </div>
                      )}
                      <span className="text-4xl sm:text-5xl drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:-translate-y-1.5 group-hover:scale-110">
                        {prop.emoji}
                      </span>
                      <span className="mt-0.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white/85 opacity-0 transition group-hover:opacity-100">
                        {prop.name}
                      </span>
                    </button>
                  );
                })}

                {/* 중앙 미니미 & 말풍선 (클릭 시 응원 메시지 토스트) */}
                <div className="absolute bottom-[20%] left-1/2 z-30 -translate-x-1/2 flex flex-col items-center">
                  {/* 말풍선 */}
                  <div className="mb-2.5 max-w-[260px] rounded-2xl border border-white/25 bg-white/95 px-3.5 py-2 text-center text-xs font-bold text-slate-900 shadow-2xl">
                    {minimiGreeting ?? room.minimiQuote}
                  </div>

                  {/* 미니미 캐릭터 */}
                  <button
                    type="button"
                    onClick={handleMinimiPoke}
                    title="미니미를 눌러보세요!"
                    className="group relative flex flex-col items-center focus:outline-none"
                  >
                    <div
                      className={`flex h-24 w-24 items-center justify-center rounded-full border-2 bg-gradient-to-br text-5xl shadow-2xl transition-transform duration-300 group-hover:scale-105 ${activeMinimi.auraClass}`}
                    >
                      <span className="drop-shadow">{activeMinimi.avatarEmoji}</span>
                      <span className="absolute -right-1 top-0 rounded-full border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-lg shadow">
                        {activeMinimi.accessoryEmoji}
                      </span>
                    </div>
                    {/* 바닥 그림자 */}
                    <div className="mt-1.5 h-3 w-16 rounded-full bg-black/45 blur-[2px]" />
                    <span className="mt-1 rounded-full border border-white/20 bg-slate-950/75 px-3 py-0.5 text-[11px] font-bold text-white shadow">
                      {room.ownerNickname}
                    </span>
                  </button>
                </div>

                {/* 스테이지 좌하단 테마 배지 */}
                <div className="absolute bottom-3 left-4 z-20 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                  {activeTheme.icon} {activeTheme.name} · 배치 소품 {placedPropItems.length}/8
                </div>
              </div>

              {/* 스테이지 하단: 보유 소품 빠른 배치 툴바 (내 방일 때) + 이웃 미니룸 파도타기 바 */}
              <div className="border-t border-slate-800 bg-slate-950/70 p-4 space-y-3">
                {isOwner && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 mr-1">
                      🪴 내 소품 빠른 배치:
                    </span>
                    {ROOM_PROPS.filter((p) => ownedSet.has(p.id) || p.pricePmp === 0).map((prop) => {
                      const isPlaced = room.placedItems.includes(prop.id);
                      return (
                        <button
                          key={prop.id}
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleEquipOwnedItem(prop)}
                          className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-medium transition ${
                            isPlaced
                              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                              : "border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span>{prop.emoji}</span>
                          <span>{prop.name}</span>
                          {isPlaced && <Check className="h-3 w-3 text-emerald-300" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 이웃 미니룸 파도타기 리스트 */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Compass className="h-4 w-4" />
                    <span>이웃 시민 힐링룸 놀러가기</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {data.neighbors.slice(0, 6).map((neighbor) => {
                      const isCurrent = neighbor.userId === room.userId;
                      const nMinimi =
                        MINIMI_STYLES.find((m) => m.id === neighbor.minimiStyle) ?? MINIMI_STYLES[0];
                      return (
                        <button
                          key={neighbor.userId}
                          type="button"
                          disabled={isBusy || isCurrent}
                          onClick={() => void visitRoom({ targetUserId: neighbor.userId })}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            isCurrent
                              ? "border-amber-400/60 bg-amber-500/20 text-amber-200"
                              : "border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/50 hover:text-white"
                          }`}
                        >
                          <span>{nMinimi.avatarEmoji}</span>
                          <span>{neighbor.ownerNickname}</span>
                          <span className="text-[10px] text-slate-400">
                            ({neighbor.regionLabel})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 3대 핵심 탭 네비게이션 */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
              <div className="mb-5 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("showcase")}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
                    activeTab === "showcase"
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>나의 PosMul 자랑 (기부·예측)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("shop")}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
                    activeTab === "shop"
                      ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>미니룸·미니미 PMP 상점</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("guestbook")}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
                    activeTab === "guestbook"
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>일촌평 · 방명록 ({data.guestbooks.length})</span>
                </button>
              </div>

              {/* TAB 1: 나의 PosMul 자랑 */}
              {activeTab === "showcase" && (
                <div className="space-y-6">
                  <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 p-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        🌱 현실의 경쟁을 넘어, 세상을 바꾼 나의 흔적
                      </h3>
                      <p className="mt-1 text-xs text-slate-300">
                        예측게임 참여·생성으로 얻은 통찰과 공공 나눔의 온기가 이 미니룸을 밝힙니다.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href="/donation"
                        className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
                      >
                        <Heart className="h-3.5 w-3.5" />
                        <span>기부하러 가기</span>
                      </Link>
                      <Link
                        href="/prediction"
                        className="inline-flex items-center gap-1 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/25"
                      >
                        <span>🔮 예측게임 광장</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* 3열 실적 쇼케이스 */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* 기부 쇼케이스 */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-emerald-300">
                          🕊️ 최근 공공 나눔 ({ownerStats.donationCount}회)
                        </h4>
                        <span className="text-xs font-semibold text-slate-400">
                          총 {ownerStats.totalDonatedPmc.toLocaleString()} PMC
                        </span>
                      </div>
                      {data.donations.length > 0 ? (
                        <ul className="space-y-2.5">
                          {data.donations.map((donation) => (
                            <li
                              key={donation.id}
                              className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-bold text-white">
                                  {donation.title}
                                </span>
                                <span className="shrink-0 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                                  {donation.pmcAmount.toLocaleString()} PMC
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                                {donation.description}
                              </p>
                              <p className="mt-1.5 text-[10px] text-slate-500">
                                {donation.category} · {formatShortDate(donation.createdAt)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                          아직 공개된 기부 기록이 없습니다. 첫 PMC 나눔으로 씨앗 트로피를 해금해보세요!
                        </div>
                      )}
                    </div>

                    {/* 내가 만든 예측게임 쇼케이스 */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-amber-300">
                          🎯 개설한 예측게임 ({ownerStats.createdGamesCount}개)
                        </h4>
                        <Link
                          href="/prediction"
                          className="text-[11px] font-semibold text-amber-300/80 hover:text-amber-200"
                        >
                          새 게임 만들기 →
                        </Link>
                      </div>
                      {data.createdGames.length > 0 ? (
                        <ul className="space-y-2.5">
                          {data.createdGames.map((game) => (
                            <li key={game.gameId}>
                              <Link
                                href={`/prediction/${game.slug}`}
                                className="block rounded-xl border border-slate-800/80 bg-slate-900/70 p-3 transition hover:border-amber-500/40 hover:bg-slate-900"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate text-xs font-bold text-white">
                                    {game.title}
                                  </span>
                                  <span className="shrink-0 rounded-lg bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                    {game.status}
                                  </span>
                                </div>
                                <p className="mt-1 text-[10px] text-slate-400">
                                  {game.category}
                                  {game.subcategory ? ` · ${game.subcategory}` : ""} ·{" "}
                                  {formatShortDate(game.createdAt)}
                                </p>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                          아직 개설한 예측게임이 없습니다. 우리 동네 이슈나 경제·사회 질문을 직접 열어보세요!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 최근 예측 참여 목록 */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-purple-300">
                        🔮 최근 집단지성 예측 참여 ({ownerStats.predictionCount}회)
                      </h4>
                    </div>
                    {data.recentPredictions.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {data.recentPredictions.map((pred) => (
                          <Link
                            key={pred.predictionId}
                            href={`/prediction/${pred.gameSlug}`}
                            className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/70 px-3.5 py-2.5 transition hover:border-purple-500/40"
                          >
                            <div className="min-w-0 pr-3">
                              <p className="truncate text-xs font-bold text-white">
                                {pred.gameTitle}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {formatShortDate(pred.createdAt)}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-lg bg-purple-500/15 px-2.5 py-1 text-[11px] font-bold text-purple-200">
                              {pred.betAmount.toLocaleString()} PMP
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        아직 예측게임 참여 기록이 없습니다. 예측에 참여해 PMP와 PMC를 모아보세요!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: 미니룸 · 미니미 꾸미기 (PMP 전용 상점) */}
              {activeTab === "shop" && (
                <div className="space-y-4">
                  <div className="flex flex-col justify-between gap-3 rounded-2xl border border-sky-500/30 bg-sky-950/30 p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-extrabold text-sky-200">
                        🔒 경제 불변식 안내: 힐링룸 상점은 활동 포인트(PMP) 전용입니다
                      </p>
                      <p className="mt-1 text-[11px] text-slate-300">
                        예측게임과 포럼 활동으로 얻은 무위험 포인트 PMP로 미니룸과 미니미를 꾸며보세요. (PMC는 절대 차감되지 않습니다)
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-sky-400/40 bg-slate-950/80 px-4 py-2 text-right">
                      <p className="text-[10px] text-slate-400">
                        {isAuthenticated ? "내 사용 가능 PMP" : "체험 모드 (로그인 시 적용)"}
                      </p>
                      <p className="text-base font-extrabold text-sky-300">
                        {(isAuthenticated ? viewerPmpBalance : ownerStats.pmpBalance).toLocaleString()}{" "}
                        PMP
                      </p>
                    </div>
                  </div>

                  {/* 상점 카테고리 필터 */}
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { key: "all", label: "전체 카탈로그" },
                        { key: "theme", label: "🏠 미니룸 테마" },
                        { key: "minimi", label: "🧸 미니미 코디" },
                        { key: "prop", label: "🪴 가구 · 소품" },
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setShopFilter(cat.key)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                          shopFilter === cat.key
                            ? "border-sky-400 bg-sky-500/20 text-sky-200"
                            : "border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* 상점 아이템 그리드 */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredShopItems.map((item) => {
                      const isOwned = ownedSet.has(item.id) || item.pricePmp === 0;
                      const isEquipped =
                        (item.category === "theme" && room.roomTheme === item.id) ||
                        (item.category === "minimi" && room.minimiStyle === item.id) ||
                        (item.category === "prop" && room.placedItems.includes(item.id));

                      const previewIcon =
                        item.category === "theme"
                          ? item.icon
                          : item.category === "minimi"
                            ? item.avatarEmoji
                            : item.emoji;

                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                            isEquipped
                              ? "border-emerald-400/60 bg-emerald-950/20"
                              : "border-slate-800 bg-slate-950/60"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-2xl">
                                  {previewIcon}
                                </span>
                                <div>
                                  <h4 className="text-xs font-bold text-white sm:text-sm">
                                    {item.name}
                                  </h4>
                                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                                    {item.category === "theme"
                                      ? "미니룸 테마"
                                      : item.category === "minimi"
                                        ? "미니미 코디"
                                        : "미니룸 소품"}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`rounded-lg px-2 py-0.5 text-[11px] font-extrabold ${
                                  item.pricePmp === 0
                                    ? "bg-slate-800 text-slate-300"
                                    : "bg-sky-500/15 text-sky-300"
                                }`}
                              >
                                {item.pricePmp === 0
                                  ? "기본 무료"
                                  : `${item.pricePmp.toLocaleString()} PMP`}
                              </span>
                            </div>
                            <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                              {item.description}
                            </p>
                          </div>

                          <div className="mt-4">
                            {isOwned ? (
                              <button
                                type="button"
                                disabled={isBusy || (!isOwner && isAuthenticated)}
                                onClick={() => void handleEquipOwnedItem(item)}
                                className={`w-full rounded-xl py-2 text-xs font-bold transition ${
                                  isEquipped
                                    ? item.category === "prop"
                                      ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-rose-950/40 hover:text-rose-200"
                                      : "bg-emerald-500/20 text-emerald-300 cursor-default"
                                    : "border border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
                                } disabled:opacity-50`}
                              >
                                {isEquipped
                                  ? item.category === "prop"
                                    ? "✅ 배치 중 (클릭 시 치우기)"
                                    : "✅ 현재 적용 중"
                                  : item.category === "prop"
                                    ? "🪴 내 방에 배치하기"
                                    : "✨ 내 방에 적용하기"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleBuyItem(item)}
                                className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-2 text-xs font-extrabold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
                              >
                                {isBusy
                                  ? "처리 중..."
                                  : `🛒 ${item.pricePmp.toLocaleString()} PMP로 구매 & 적용`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: 일촌평 · 방명록 */}
              {activeTab === "guestbook" && (
                <div className="space-y-5">
                  <form
                    onSubmit={(e) => void handleWriteGuestbook(e)}
                    className="rounded-2xl border border-rose-500/30 bg-slate-950/70 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-extrabold text-rose-200">
                        💌 {room.ownerNickname}님에게 따뜻한 일촌평 남기기
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {RELATION_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setGuestRelation(preset)}
                            className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${
                              guestRelation === preset
                                ? "border-rose-400 bg-rose-500/20 text-rose-200"
                                : "border-slate-700 bg-slate-900 text-slate-400"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!isAuthenticated && (
                      <input
                        type="text"
                        maxLength={20}
                        placeholder="닉네임 (미입력 시 '지나가는 시민')"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full sm:w-64 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-rose-400 focus:outline-none"
                      />
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        maxLength={200}
                        placeholder="미니룸 구경 잘 했어요! 따뜻한 응원 한마디를 남겨보세요 (2~200자)"
                        value={guestContent}
                        onChange={(e) => setGuestContent(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-rose-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-rose-400 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>남기기</span>
                      </button>
                    </div>
                  </form>

                  {/* 방명록 리스트 */}
                  <div className="space-y-3">
                    {data.guestbooks.length > 0 ? (
                      data.guestbooks.map((entry) => {
                        const authorMinimi =
                          MINIMI_STYLES.find((m) => m.id === entry.authorMinimi) ??
                          MINIMI_STYLES[0];
                        return (
                          <div
                            key={entry.id}
                            className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-xl">
                              {authorMinimi.avatarEmoji}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-extrabold text-white">
                                  {entry.authorName}
                                </span>
                                <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                                  {entry.relationLabel}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {formatShortDate(entry.createdAt)}
                                </span>
                              </div>
                              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-200">
                                {entry.content}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
                        아직 일촌평이 비어 있습니다. 첫 번째 따뜻한 인사말을 남겨보세요!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 새로고침 / 힐링 철학 푸터 */}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/70 pt-4 text-xs text-slate-500">
          <p>
            🏡 PosMul 힐링룸 — 현실의 무게를 잠시 내려놓고, 예측과 나눔으로 완성되는 나만의 안식처
          </p>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void visitRoom({ targetUserId: room.userId })}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>방 상태 새로고침</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
