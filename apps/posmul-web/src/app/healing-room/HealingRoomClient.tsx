"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Disc3,
  ExternalLink,
  Heart,
  Home,
  Lock,
  LogIn,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  ShoppingBag,
  SkipForward,
  Sparkles,
  Square,
  Trophy,
  Waves,
  X,
} from "lucide-react";
import {
  ALL_HEALING_ITEMS,
  BGM_TRACKS,
  MINIMI_STYLES,
  MOOD_TAGS,
  ROOM_THEMES,
  type AnyHealingItem,
  type HealingItemCategory,
} from "./healing-room-catalog";
import type { HealingRoomPageData } from "./healing-room-service";
import { IsometricMiniroomStage } from "./components/IsometricMiniroomStage";

interface HealingRoomClientProps {
  initialData: HealingRoomPageData;
}

type CyTabKey = "home" | "profile" | "prediction" | "donation" | "shop" | "guestbook";
type ShopCategoryFilter = "all" | HealingItemCategory;

interface FeedbackNotice {
  type: "success" | "error" | "info";
  message: string;
}

interface BinderSkinStyle {
  coverGradient: string;
  borderClass: string;
  innerSurface: string;
  titleColor: string;
}

const THEME_BINDER_SKINS: Record<string, BinderSkinStyle> = {
  "sunset-attic": {
    coverGradient: "from-[#1e3a8a] via-[#1d4ed8] to-[#0f766e]",
    borderClass: "border-sky-400/50",
    innerSurface: "bg-[#f4f7fc]",
    titleColor: "text-[#1e3a8a]",
  },
  "seongsu-bookcafe": {
    coverGradient: "from-[#065f46] via-[#047857] to-[#0f766e]",
    borderClass: "border-emerald-400/50",
    innerSurface: "bg-[#f3faf7]",
    titleColor: "text-[#065f46]",
  },
  "hanok-teahouse": {
    coverGradient: "from-[#78350f] via-[#b45309] to-[#92400e]",
    borderClass: "border-amber-400/55",
    innerSurface: "bg-[#fbf8f1]",
    titleColor: "text-[#92400e]",
  },
  "starlight-rooftop": {
    coverGradient: "from-[#312e81] via-[#4c1d95] to-[#1e1b4b]",
    borderClass: "border-purple-400/55",
    innerSurface: "bg-[#f5f3ff]",
    titleColor: "text-[#4c1d95]",
  },
  "jeju-forest": {
    coverGradient: "from-[#0f766e] via-[#0d9488] to-[#0369a1]",
    borderClass: "border-teal-300/55",
    innerSurface: "bg-[#f2fbf9]",
    titleColor: "text-[#0f766e]",
  },
};

const CY_BOOKMARK_TABS: ReadonlyArray<{
  key: CyTabKey;
  label: string;
  icon: string;
  inactiveClass: string;
  activeAccent: string;
}> = [
  {
    key: "home",
    label: "홈",
    icon: "🏠",
    inactiveClass: "bg-indigo-700 border-indigo-400/60 hover:bg-indigo-600 text-indigo-50",
    activeAccent: "text-indigo-900 border-l-indigo-500",
  },
  {
    key: "profile",
    label: "프로필",
    icon: "👤",
    inactiveClass: "bg-amber-600 border-amber-300/60 hover:bg-amber-500 text-amber-50",
    activeAccent: "text-amber-900 border-l-amber-500",
  },
  {
    key: "prediction",
    label: "예측장",
    icon: "🔮",
    inactiveClass: "bg-sky-700 border-sky-400/60 hover:bg-sky-600 text-sky-50",
    activeAccent: "text-sky-900 border-l-sky-500",
  },
  {
    key: "donation",
    label: "기부첩",
    icon: "🕊️",
    inactiveClass: "bg-purple-700 border-purple-400/60 hover:bg-purple-600 text-purple-50",
    activeAccent: "text-purple-900 border-l-purple-500",
  },
  {
    key: "shop",
    label: "선물가게",
    icon: "🎁",
    inactiveClass: "bg-emerald-700 border-emerald-400/60 hover:bg-emerald-600 text-emerald-50",
    activeAccent: "text-emerald-900 border-l-emerald-500",
  },
  {
    key: "guestbook",
    label: "방명록",
    icon: "💌",
    inactiveClass: "bg-rose-700 border-rose-400/60 hover:bg-rose-600 text-rose-50",
    activeAccent: "text-rose-900 border-l-rose-500",
  },
];

const RELATION_PRESETS = ["PosMul 일촌", "동네 이웃", "예측 동지", "응원 손님"] as const;

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function HealingRoomClient({ initialData }: HealingRoomClientProps) {
  const [data, setData] = useState<HealingRoomPageData>(initialData);
  const [activeTab, setActiveTab] = useState<CyTabKey>("home");
  const [shopFilter, setShopFilter] = useState<ShopCategoryFilter>("all");
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<FeedbackNotice | null>(null);

  // 인라인 제목 편집 상태
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);

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

  // Web Audio API BGM 플레이어 상태
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [previewBgmId, setPreviewBgmId] = useState(initialData.room.bgmTrack);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmTimerRef = useRef<number | null>(null);
  const noteStepRef = useRef(0);

  // 우측 미니홈피 위젯 감성 게이지
  const [boostHealing, setBoostHealing] = useState(0);
  const [boostWarmth, setBoostWarmth] = useState(0);
  const [boostInsight, setBoostInsight] = useState(0);

  const { room, isOwner, isAuthenticated, viewerPmpBalance, ownerStats } = data;

  const activeTheme = useMemo(
    () => ROOM_THEMES.find((t) => t.id === room.roomTheme) ?? ROOM_THEMES[0],
    [room.roomTheme]
  );

  const binderSkin = useMemo(
    () => THEME_BINDER_SKINS[room.roomTheme] ?? THEME_BINDER_SKINS["sunset-attic"],
    [room.roomTheme]
  );

  const activeMinimi = useMemo(
    () => MINIMI_STYLES.find((m) => m.id === room.minimiStyle) ?? MINIMI_STYLES[0],
    [room.minimiStyle]
  );

  const activeBgm = useMemo(
    () => BGM_TRACKS.find((track) => track.id === previewBgmId) ?? BGM_TRACKS[0],
    [previewBgmId]
  );

  const unlockedTrophies = useMemo(
    () => data.trophies.filter((trophy) => trophy.unlocked),
    [data.trophies]
  );

  const ownedSet = useMemo(() => new Set(room.ownedItems), [room.ownedItems]);

  const filteredShopItems = useMemo(() => {
    if (shopFilter === "all") return ALL_HEALING_ITEMS;
    return ALL_HEALING_ITEMS.filter((item) => item.category === shopFilter);
  }, [shopFilter]);

  const recommendedShopItems = useMemo(
    () => ALL_HEALING_ITEMS.filter((item) => item.pricePmp > 0).slice(0, 2),
    []
  );

  // 방 전환 시 입력 상태 동기화
  useEffect(() => {
    setEditTitle(room.roomTitle);
    setEditStatus(room.statusMessage);
    setEditQuote(room.minimiQuote);
    setEditMood(room.moodTag);
    setEditBgm(room.bgmTrack);
    setPreviewBgmId(room.bgmTrack);
    setIsEditingHeadline(false);
  }, [
    room.userId,
    room.roomTitle,
    room.statusMessage,
    room.minimiQuote,
    room.moodTag,
    room.bgmTrack,
  ]);

  // Web Audio API BGM 재생/정지
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

  function handleCloseWindow() {
    window.close();
    // 브라우저 보안 정책으로 window.close()가 무시되는 일반 탭에서는 홈으로 이동
    window.setTimeout(() => {
      if (!window.closed) {
        window.location.href = "/";
      }
    }, 180);
  }

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
        showNotice("error", json.error || "이웃 미니홈피로 이동하지 못했습니다.");
        return;
      }
      setData(json.data);
      setActiveTab("home");
      showNotice(
        "info",
        `🌊 ${json.data.room.ownerNickname}님의 PosMul 힐링룸으로 파도타기 했습니다!`
      );
    } catch {
      showNotice("error", "파도타기 중 통신 오류가 발생했습니다.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    await postAction(
      {
        action: "update_room",
        roomTitle: editTitle,
        statusMessage: editStatus,
        minimiQuote: editQuote,
        moodTag: editMood,
        bgmTrack: editBgm,
      },
      "✨ PosMul 힐링룸 프로필과 BGM 설정을 저장했습니다."
    );
  }

  async function handleQuickHeadlineSave(event: React.FormEvent) {
    event.preventDefault();
    const ok = await postAction(
      { action: "update_room", roomTitle: editTitle },
      "✏️ 힐링룸 대문 제목을 변경했습니다."
    );
    if (ok) {
      setIsEditingHeadline(false);
    }
  }

  async function handleQuickMoodChange(nextMood: string) {
    setEditMood(nextMood);
    if (isOwner) {
      await postAction(
        { action: "update_room", moodTag: nextMood },
        `TODAY IS 기분을 '${nextMood}'(으)로 바꿨습니다.`
      );
    }
  }

  async function handleToggleProp(propId: string) {
    if (!isOwner) {
      showNotice("info", "내 방으로 돌아가서 가구를 배치할 수 있습니다.");
      return;
    }
    const alreadyPlaced = room.placedItems.includes(propId);
    const nextPlaced = alreadyPlaced
      ? room.placedItems.filter((id) => id !== propId)
      : [...room.placedItems, propId].slice(0, 8);

    await postAction(
      { action: "update_room", placedItems: nextPlaced },
      alreadyPlaced ? "📦 가구를 보관함으로 정리했습니다." : "🪴 가구를 미니룸에 배치했습니다."
    );
  }

  async function handleEquipOwnedItem(item: AnyHealingItem) {
    if (!isOwner) {
      showNotice("info", "먼저 '내 힐링룸'으로 돌아가서 꾸밀 수 있습니다.");
      return;
    }

    if (item.category === "theme") {
      await postAction(
        { action: "update_room", roomTheme: item.id },
        `🏠 '${item.name}' 미니룸 스킨을 적용했습니다.`
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

    await handleToggleProp(item.id);
  }

  async function handleBuyItem(item: AnyHealingItem) {
    if (!isAuthenticated) {
      showNotice(
        "info",
        "로그인하면 보유 PMP로 미니룸·미니미 아이템을 선물가게에서 구매할 수 있습니다."
      );
      return;
    }
    if (!isOwner) {
      showNotice("info", "먼저 '내 힐링룸'으로 이동한 뒤 구매해주세요.");
      return;
    }
    await postAction(
      {
        action: "buy_item",
        itemId: item.id,
        equipOnBuy: true,
      },
      item.pricePmp > 0
        ? `🛒 ${item.pricePmp.toLocaleString()} PMP로 '${item.name}' 구매 및 장착을 완료했습니다!`
        : `✨ '${item.name}' 아이템을 적용했습니다!`
    );
  }

  async function handleWriteGuestbook(event: React.FormEvent) {
    event.preventDefault();
    if (guestContent.trim().length < 2) {
      showNotice("error", "일촌평을 2자 이상 입력해주세요.");
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
      "💌 따뜻한 일촌평이 등록되었습니다."
    );
    if (ok) {
      setGuestContent("");
    }
  }

  async function handleNextBgm() {
    const idx = BGM_TRACKS.findIndex((t) => t.id === previewBgmId);
    const nextTrack = BGM_TRACKS[(idx + 1) % BGM_TRACKS.length];
    setPreviewBgmId(nextTrack.id);
    if (isOwner) {
      await postAction(
        { action: "update_room", bgmTrack: nextTrack.id },
        `💿 Lo-Fi BGM을 '${nextTrack.label}'(으)로 변경했습니다.`
      );
    }
  }

  // PosMul 시민 선순환 Activity News 4줄
  const updatedNewsLines = useMemo(() => {
    const lines: Array<{ tag: string; tagClass: string; text: string; targetTab: CyTabKey }> = [];

    if (data.donations[0]) {
      lines.push({
        tag: "[기부]",
        tagClass: "bg-purple-100 text-purple-800 border-purple-200",
        text: `${data.donations[0].title} (${data.donations[0].pmcAmount.toLocaleString()} PMC 나눔)`,
        targetTab: "donation",
      });
    } else {
      lines.push({
        tag: "[기부]",
        tagClass: "bg-purple-100 text-purple-800 border-purple-200",
        text: "첫 PMC 공공 기부로 따뜻한 선순환을 시작해보세요",
        targetTab: "donation",
      });
    }

    if (data.createdGames[0]) {
      lines.push({
        tag: "[개설]",
        tagClass: "bg-amber-100 text-amber-800 border-amber-200",
        text: `내가 연 예측게임: ${data.createdGames[0].title}`,
        targetTab: "prediction",
      });
    } else {
      lines.push({
        tag: "[개설]",
        tagClass: "bg-amber-100 text-amber-800 border-amber-200",
        text: "우리 동네·세상 이슈 예측게임을 직접 열어보세요",
        targetTab: "prediction",
      });
    }

    if (data.recentPredictions[0]) {
      lines.push({
        tag: "[예측]",
        tagClass: "bg-sky-100 text-sky-800 border-sky-200",
        text: `${data.recentPredictions[0].gameTitle} (${data.recentPredictions[0].betAmount.toLocaleString()} PMP)`,
        targetTab: "prediction",
      });
    } else {
      lines.push({
        tag: "[예측]",
        tagClass: "bg-sky-100 text-sky-800 border-sky-200",
        text: "집단지성 예측 참여 기록을 쌓아보세요",
        targetTab: "prediction",
      });
    }

    if (unlockedTrophies[0]) {
      lines.push({
        tag: "[명예]",
        tagClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
        text: `트로피 해금: ${unlockedTrophies[0].icon} ${unlockedTrophies[0].title}`,
        targetTab: "profile",
      });
    } else {
      lines.push({
        tag: "[명예]",
        tagClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
        text: "실제 활동 시 영광의 선반 트로피가 자동 진열됩니다",
        targetTab: "profile",
      });
    }

    return lines;
  }, [data.donations, data.createdGames, data.recentPredictions, unlockedTrophies]);

  const healingPct = Math.min(100, 48 + room.placedItems.length * 6 + boostHealing);
  const warmthPct = Math.min(
    100,
    28 + Math.min(60, Math.round(ownerStats.totalDonatedPmc / 40)) + boostWarmth
  );
  const insightPct = Math.min(
    100,
    25 + Math.min(65, ownerStats.createdGamesCount * 15 + ownerStats.predictionCount * 5) + boostInsight
  );

  return (
    /* PosMul 딥 네이비 별빛 모눈 배경 + Layout 상단 3단 네비 패딩 상쇄 */
    <div
      className="relative -mt-[60px] md:-mt-[142px] min-h-screen overflow-x-hidden bg-[#090d16] text-slate-900 pb-14"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(99,102,241,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.10) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      {/* PosMul 브랜드 앰비언트 오로라 글로우 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* === 독립 팝업 전용 PosMul 다크 글래스 상단 윈도우 바 === */}
      <header className="sticky top-0 z-40 border-b border-indigo-500/30 bg-[#0b101d]/95 px-3 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2.5">
          {/* 좌측: PosMul 로고 + HEALING ROOM 배지 + 미니 주소창 */}
          <div className="flex flex-1 items-center gap-2.5 min-w-[240px]">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                PosMul
              </span>
              <span className="rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-amber-300">
                HEALING ROOM
              </span>
            </div>

            <div className="hidden sm:flex flex-1 items-center gap-2 rounded-lg border border-slate-700/80 bg-[#090d16]/90 px-3 py-1 text-xs text-slate-300 shadow-inner">
              <span className="text-sky-400">🏡</span>
              <span className="truncate font-mono text-[11px]">
                posmul.com/healing-room/@{room.ownerNickname}
              </span>
            </div>
          </div>

          {/* 우측: 전용 윈도우 액션 컨트롤 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {isAuthenticated && !isOwner && data.viewerUserId && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void visitRoom({ targetUserId: data.viewerUserId ?? undefined })}
                className="inline-flex items-center gap-1 rounded-lg border border-sky-400/50 bg-sky-500/20 px-2.5 py-1 text-[11px] font-bold text-sky-200 transition hover:bg-sky-500/30"
              >
                <Home className="h-3 w-3" />
                <span>내 힐링룸</span>
              </button>
            )}

            {!isAuthenticated && (
              <Link
                href="/auth/login?next=/healing-room"
                className="inline-flex items-center gap-1 rounded-lg border border-amber-400/60 bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[11px] font-extrabold text-slate-950 shadow-sm hover:brightness-110"
              >
                <LogIn className="h-3 w-3" />
                <span>로그인하고 내 방 만들기</span>
              </Link>
            )}

            <button
              type="button"
              disabled={isBusy}
              onClick={() => void visitRoom({ targetUserId: room.userId })}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
            >
              <RefreshCw className="h-3 w-3" />
              <span>새로고침</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-1 text-[11px] font-semibold text-indigo-200 hover:bg-indigo-500/25"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">PosMul 본창</span>
            </a>

            <button
              type="button"
              onClick={handleCloseWindow}
              title="힐링룸 창 닫기"
              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold text-rose-200 hover:bg-rose-500/30"
            >
              <X className="h-3.5 w-3.5" />
              <span>창 닫기</span>
            </button>
          </div>
        </div>
      </header>

      {/* 피드백 알림 배너 */}
      {notice && (
        <div className="relative z-10 mx-auto mt-3 max-w-[1240px] px-3">
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur-md ${
              notice.type === "error"
                ? "border-rose-400/50 bg-rose-950/90 text-rose-100"
                : notice.type === "success"
                  ? "border-emerald-400/50 bg-emerald-950/90 text-emerald-100"
                  : "border-sky-400/50 bg-slate-900/95 text-sky-100"
            }`}
          >
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-3 text-[11px] underline opacity-80 hover:opacity-100"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* === 메인 2컬럼 레이아웃: PosMul 테마 연동 바인더(좌) + PosMul Citizen Studio 위젯(우) === */}
      <div className="relative z-10 mx-auto mt-4 flex max-w-[1240px] flex-col gap-4 px-2 sm:px-4 xl:flex-row xl:items-start">
        {/* 1) PosMul 시그니처 하드커버 바인더 + 우측 돌출 책갈피 탭 */}
        <div className="relative flex-1 min-w-0">
          {/* 모바일 상단 가로 책갈피 탭 (xl 미만) */}
          <div className="mb-2 flex flex-wrap gap-1 xl:hidden">
            {CY_BOOKMARK_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "border-amber-200 bg-white text-slate-900"
                      : `${tab.inactiveClass}`
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 테마 연동 PosMul 그라데이션 하드커버 */}
          <div
            className={`relative rounded-2xl border-2 bg-gradient-to-br ${binderSkin.coverGradient} ${binderSkin.borderClass} p-2.5 sm:p-3.5 shadow-[0_22px_55px_rgba(0,0,0,0.65)]`}
          >
            {/* 샴페인 골드 점선 스티치 */}
            <div className="rounded-xl border-2 border-dashed border-amber-200/70 p-1.5 sm:p-2">
              <div className="relative grid grid-cols-1 gap-2 lg:grid-cols-12">
                {/* 중앙 골드-실버 메탈 스프링 바인더 링 4개 (데스크톱 lg 이상) */}
                <div className="pointer-events-none hidden lg:flex absolute left-[25.5%] top-12 bottom-12 z-30 -translate-x-1/2 flex-col justify-between py-6">
                  {[0, 1, 2, 3].map((ringIdx) => (
                    <div
                      key={ringIdx}
                      className="flex h-3.5 w-8 items-center justify-between rounded-full border border-amber-400/70 bg-gradient-to-b from-amber-50 via-slate-200 to-amber-300/90 shadow-md"
                    >
                      <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-slate-800" />
                      <span className="mr-0.5 h-1.5 w-1.5 rounded-full bg-slate-800" />
                    </div>
                  ))}
                </div>

                {/* === 바인더 좌측 페이지: TODAY/TOTAL · 자산 뱃지 · 프로필 · 일촌 파도타기 === */}
                <aside
                  className={`lg:col-span-3 min-w-0 flex flex-col rounded-xl border border-indigo-200/80 ${binderSkin.innerSurface} p-3`}
                >
                  {/* TODAY | TOTAL */}
                  <div className="mb-2 flex items-center justify-center gap-2 border-b border-dotted border-slate-300 pb-2 text-[11px] font-bold">
                    <span className="text-slate-500">TODAY</span>
                    <span className="font-mono text-xs font-extrabold text-rose-600">
                      {room.todayVisits.toLocaleString()}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">TOTAL</span>
                    <span className="font-mono text-xs font-extrabold text-slate-800">
                      {room.totalVisits.toLocaleString()}
                    </span>
                  </div>

                  {/* PosMul PMP / PMC 미니 자산 배지 */}
                  <div className="mb-2 grid grid-cols-2 gap-1.5 text-center text-[10px]">
                    <div className="rounded border border-sky-200 bg-sky-50 px-1.5 py-1">
                      <span className="block font-semibold text-sky-700">활동 PMP</span>
                      <span className="font-mono font-extrabold text-sky-900">
                        {ownerStats.pmpBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded border border-purple-200 bg-purple-50 px-1.5 py-1">
                      <span className="block font-semibold text-purple-700">누적 나눔</span>
                      <span className="font-mono font-extrabold text-purple-900">
                        {ownerStats.totalDonatedPmc.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 좌측 내부 화이트 프로필 카드 */}
                  <div className="flex flex-1 flex-col justify-between rounded-lg border border-slate-200/90 bg-white p-3 shadow-sm">
                    <div className="space-y-3">
                      {/* 대문 프로필 미니미 프레임 */}
                      <div
                        className={`relative flex h-40 flex-col items-center justify-center overflow-hidden rounded-md border border-indigo-200 bg-gradient-to-b ${activeTheme.windowBgClass} p-3 text-center shadow-inner`}
                      >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-200 bg-white/90 text-4xl shadow-md">
                          <span>{activeMinimi.avatarEmoji}</span>
                        </div>
                        <span className="mt-2 rounded-full border border-indigo-200 bg-white/95 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-800 shadow-sm">
                          {activeMinimi.accessoryEmoji} {activeMinimi.name}
                        </span>
                        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-white drop-shadow">
                          <MapPin className="h-3 w-3" />
                          {room.regionLabel}
                        </span>
                      </div>

                      {/* TODAY IS... 기분 박스 */}
                      <div className="rounded-md border border-indigo-200 bg-indigo-50/50 px-2.5 py-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-indigo-800">TODAY IS..</span>
                          {isOwner ? (
                            <select
                              aria-label="오늘의 기분 선택"
                              value={room.moodTag}
                              disabled={isBusy}
                              onChange={(e) => void handleQuickMoodChange(e.target.value)}
                              className="cursor-pointer rounded border border-indigo-200 bg-white px-1.5 py-0.5 text-[11px] font-bold text-slate-700 focus:outline-none"
                            >
                              {MOOD_TAGS.map((tag) => (
                                <option key={tag} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-bold text-slate-700">{room.moodTag}</span>
                          )}
                        </div>
                      </div>

                      {/* 상태 메시지 */}
                      <div className="min-h-[68px] rounded-md border border-dashed border-slate-200 bg-slate-50/70 p-2.5 text-xs leading-relaxed text-slate-600">
                        {room.statusMessage}
                      </div>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("profile")}
                          className="text-[11px] font-bold text-indigo-700 hover:underline"
                        >
                          ✎ 프로필 / 인사말 편집하기
                        </button>
                      )}
                    </div>

                    {/* 하단 HISTORY + 시민 랭킹 + 일촌 파도타기 */}
                    <div className="mt-4 space-y-2 border-t border-dotted border-slate-300 pt-3">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>▶ POSMUL HISTORY</span>
                        <span>▲ ▼</span>
                      </div>

                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {room.ownerNickname}{" "}
                          <span className="text-[10px] font-semibold text-indigo-600">
                            ({isOwner ? "My Room" : "Neighbor"})
                          </span>
                        </p>
                        {ownerStats.overallRank !== null && (
                          <p className="text-[11px] font-bold text-amber-600">
                            시민 랭킹 #{ownerStats.overallRank.toLocaleString()} · 기여{" "}
                            {ownerStats.contributionScore.toLocaleString()}점
                          </p>
                        )}
                      </div>

                      {/* 일촌 파도타기 */}
                      <div className="space-y-1.5 rounded-md border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-sky-900">일촌 파도타기</span>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void visitRoom({ wave: true })}
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-700 hover:underline"
                          >
                            <Waves className="h-3 w-3" />
                            <span>랜덤 마실</span>
                          </button>
                        </div>
                        <select
                          aria-label="일촌 파도타기 목록"
                          value={room.userId}
                          disabled={isBusy}
                          onChange={(e) => void visitRoom({ targetUserId: e.target.value })}
                          className="w-full rounded border border-sky-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value={room.userId}>★ {room.ownerNickname} (현재 방)</option>
                          {data.neighbors
                            .filter((n) => n.userId !== room.userId)
                            .map((neighbor) => (
                              <option key={neighbor.userId} value={neighbor.userId}>
                                🌊 {neighbor.ownerNickname} ({neighbor.regionLabel})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* === 바인더 중앙/우측 메인 페이지 === */}
                <main className="lg:col-span-9 min-w-0 flex flex-col rounded-xl border border-indigo-200/80 bg-white p-3.5 sm:p-5 shadow-sm">
                  {/* 대문 타이틀 줄 */}
                  <div className="mb-3 flex flex-col gap-1 border-b border-slate-200 pb-2.5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-2">
                      {isOwner && isEditingHeadline ? (
                        <form
                          onSubmit={(e) => void handleQuickHeadlineSave(e)}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            maxLength={50}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="rounded border border-indigo-500 px-2 py-0.5 text-sm font-bold text-slate-900"
                          />
                          <button
                            type="submit"
                            disabled={isBusy}
                            className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditTitle(room.roomTitle);
                              setIsEditingHeadline(false);
                            }}
                            className="text-xs text-slate-500"
                          >
                            취소
                          </button>
                        </form>
                      ) : (
                        <>
                          <h1
                            className={`text-lg sm:text-xl font-black tracking-tight ${binderSkin.titleColor}`}
                          >
                            {room.roomTitle}
                          </h1>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => setIsEditingHeadline(true)}
                              className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-50"
                            >
                              제목수정
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                          isOwner
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {isOwner ? "👑 내 PosMul 힐링룸" : "🌊 이웃 마실 모드"}
                      </span>
                      <span className="hidden sm:inline font-mono text-[10px] text-slate-400">
                        @{room.ownerNickname}
                      </span>
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* TAB 1: 홈 (PosMul Activity News + Miniroom + What friends say) */}
                  {/* ========================================================== */}
                  {activeTab === "home" && (
                    <div className="space-y-4">
                      {/* 1단: PosMul Activity News (좌) + 2x3 PosMul 도메인 컬러 바둑판 표 (우) */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                        {/* PosMul Activity News */}
                        <div className="md:col-span-7">
                          <div className="mb-1.5 flex items-center justify-between border-b-2 border-indigo-200 pb-1">
                            <h2 className="text-xs font-extrabold text-indigo-900">
                              PosMul Activity News
                            </h2>
                            <span className="text-[10px] font-semibold text-slate-400">
                              시민 선순환 기록
                            </span>
                          </div>
                          <ul className="space-y-1.5 text-xs">
                            {updatedNewsLines.map((line, index) => (
                              <li key={index} className="flex items-center gap-1.5 truncate">
                                <span
                                  className={`shrink-0 rounded border px-1.5 py-0.2 text-[10px] font-extrabold ${line.tagClass}`}
                                >
                                  {line.tag}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab(line.targetTab)}
                                  className="truncate text-left text-slate-700 hover:text-indigo-700 hover:underline"
                                >
                                  {line.text}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 우측 2열 x 3행 도메인 컬러 요약 표 */}
                        <div className="md:col-span-5">
                          <div className="overflow-hidden rounded-lg border border-indigo-200 text-[11px] shadow-xs">
                            <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200">
                              <button
                                type="button"
                                onClick={() => setActiveTab("donation")}
                                className="flex items-center justify-between bg-purple-50/50 px-2.5 py-1.5 hover:bg-purple-50"
                              >
                                <span className="font-bold text-purple-900">🕊️ 공공기부</span>
                                <span className="font-extrabold text-purple-700">
                                  {ownerStats.donationCount}건
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab("prediction")}
                                className="flex items-center justify-between bg-amber-50/50 px-2.5 py-1.5 hover:bg-amber-50"
                              >
                                <span className="font-bold text-amber-900">🎯 개설게임</span>
                                <span className="font-extrabold text-amber-700">
                                  {ownerStats.createdGamesCount}개
                                </span>
                              </button>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200">
                              <button
                                type="button"
                                onClick={() => setActiveTab("prediction")}
                                className="flex items-center justify-between bg-sky-50/40 px-2.5 py-1.5 hover:bg-sky-50"
                              >
                                <span className="font-bold text-sky-900">🔮 예측참여</span>
                                <span className="font-extrabold text-sky-700">
                                  {ownerStats.predictionCount}회
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab("profile")}
                                className="flex items-center justify-between bg-amber-50/30 px-2.5 py-1.5 hover:bg-amber-50"
                              >
                                <span className="font-bold text-slate-700">🏅 명예배지</span>
                                <span className="font-extrabold text-amber-600">
                                  {unlockedTrophies.length}/{data.trophies.length}
                                </span>
                              </button>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-slate-200">
                              <button
                                type="button"
                                onClick={() => setActiveTab("shop")}
                                className="flex items-center justify-between bg-emerald-50/40 px-2.5 py-1.5 hover:bg-emerald-50"
                              >
                                <span className="font-bold text-emerald-900">💎 보유PMP</span>
                                <span className="font-extrabold text-emerald-700">
                                  {ownerStats.pmpBalance.toLocaleString()}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab("guestbook")}
                                className="flex items-center justify-between bg-rose-50/40 px-2.5 py-1.5 hover:bg-rose-50"
                              >
                                <span className="font-bold text-rose-900">💌 방명록</span>
                                <span className="font-extrabold text-rose-600">
                                  {data.guestbooks.length}개
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2단: Miniroom 섹션 */}
                      <div>
                        <div className="mb-1.5 flex items-end justify-between border-b border-indigo-200 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-t-md border border-b-0 border-indigo-200 bg-indigo-50 px-3 py-0.5 text-xs font-extrabold text-indigo-800">
                              PosMul Miniroom
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {activeTheme.icon} {activeTheme.name}
                            </span>
                          </div>
                          <span className="truncate text-[11px] font-bold text-indigo-700">
                            ✨ {room.minimiQuote}
                          </span>
                        </div>

                        <IsometricMiniroomStage
                          roomTheme={room.roomTheme}
                          minimiStyle={room.minimiStyle}
                          minimiQuote={room.minimiQuote}
                          ownerNickname={room.ownerNickname}
                          placedItems={room.placedItems}
                          ownedItems={room.ownedItems}
                          trophies={data.trophies}
                          isOwner={isOwner}
                          isBusy={isBusy}
                          onToggleProp={(propId) => void handleToggleProp(propId)}
                        />
                      </div>

                      {/* 3단: What friends say */}
                      <div className="pt-1">
                        <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-1">
                          <h3 className="text-xs font-extrabold text-indigo-900">
                            What friends say{" "}
                            <span className="ml-1 font-normal text-[11px] text-slate-500">
                              서로의 예측과 나눔을 응원해주세요~
                            </span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => setActiveTab("guestbook")}
                            className="text-[11px] font-bold text-indigo-600 hover:underline"
                          >
                            방명록 전체보기 →
                          </button>
                        </div>

                        <form
                          onSubmit={(e) => void handleWriteGuestbook(e)}
                          className="mb-2.5 flex flex-col gap-1.5 rounded-lg border border-indigo-200/80 bg-indigo-50/50 p-2 sm:flex-row sm:items-center"
                        >
                          <span className="shrink-0 text-[11px] font-extrabold text-indigo-900">
                            일촌평
                          </span>
                          {!isAuthenticated && (
                            <input
                              type="text"
                              maxLength={20}
                              placeholder="닉네임"
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="w-full sm:w-28 rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                            />
                          )}
                          <input
                            type="text"
                            maxLength={200}
                            placeholder="따뜻한 일촌평을 남겨주세요..."
                            value={guestContent}
                            onChange={(e) => setGuestContent(e.target.value)}
                            className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isBusy}
                            className="shrink-0 rounded bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            확인
                          </button>
                        </form>

                        <ul className="divide-y divide-dotted divide-slate-200 text-xs">
                          {data.guestbooks.length > 0 ? (
                            data.guestbooks.slice(0, 5).map((entry) => (
                              <li
                                key={entry.id}
                                className="flex flex-wrap items-baseline justify-between gap-2 py-1.5"
                              >
                                <div className="flex flex-wrap items-baseline gap-1.5">
                                  <span className="text-slate-700">{entry.content}</span>
                                  <span className="text-[11px] font-semibold text-indigo-600">
                                    ({entry.relationLabel}{" "}
                                    <strong className="text-slate-900">{entry.authorName}</strong>)
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {formatShortDate(entry.createdAt)}
                                </span>
                              </li>
                            ))
                          ) : (
                            <li className="py-3 text-center text-xs text-slate-400">
                              아직 등록된 일촌평이 없습니다. 첫 인사를 남겨보세요!
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* TAB 2: 프로필 & 영광의 선반 명예 트로피 상세             */}
                  {/* ========================================================== */}
                  {activeTab === "profile" && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h2 className="text-sm font-extrabold text-indigo-900">
                          👤 미니홈피 프로필 설정 & 영광의 선반
                        </h2>
                        <span className="text-xs font-bold text-amber-600">
                          해금 트로피 {unlockedTrophies.length} / {data.trophies.length}
                        </span>
                      </div>

                      {isOwner ? (
                        <form
                          onSubmit={(e) => void handleSaveProfile(e)}
                          className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4"
                        >
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-bold text-slate-700">
                                미니홈피 제목
                              </label>
                              <input
                                type="text"
                                maxLength={50}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold text-slate-700">
                                미니미 말풍선
                              </label>
                              <input
                                type="text"
                                maxLength={60}
                                value={editQuote}
                                onChange={(e) => setEditQuote(e.target.value)}
                                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold text-slate-700">
                              상태 메시지 (인사말)
                            </label>
                            <textarea
                              rows={2}
                              maxLength={140}
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-bold text-slate-700">
                                TODAY IS... 기분 태그
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {MOOD_TAGS.map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setEditMood(tag)}
                                    className={`rounded border px-2 py-1 text-[11px] font-semibold ${
                                      editMood === tag
                                        ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                                        : "border-slate-300 bg-white text-slate-600"
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold text-slate-700">
                                기본 BGM 선택
                              </label>
                              <select
                                value={editBgm}
                                onChange={(e) => {
                                  setEditBgm(e.target.value);
                                  setPreviewBgmId(e.target.value);
                                }}
                                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                              >
                                {BGM_TRACKS.map((track) => (
                                  <option key={track.id} value={track.id}>
                                    🎵 {track.label} ({track.moodDesc})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isBusy}
                            className="rounded-lg bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-2 text-xs font-bold text-white shadow hover:brightness-110 disabled:opacity-50"
                          >
                            {isBusy ? "저장 중..." : "✨ 미니홈피 설정 저장"}
                          </button>
                        </form>
                      ) : (
                        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                          현재 <strong>{room.ownerNickname}</strong>님의 PosMul 힐링룸을 구경 중입니다. 내 프로필 편집은 본인 방에서 가능합니다.
                        </div>
                      )}

                      {/* 영광의 선반 */}
                      <div>
                        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span>영광의 선반 (실제 활동으로만 해금되는 명예 트로피)</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {data.trophies.map((trophy) => (
                            <div
                              key={trophy.id}
                              className={`flex items-start gap-3 rounded-lg border p-3 ${
                                trophy.unlocked
                                  ? "border-amber-300 bg-amber-50/75"
                                  : "border-slate-200 bg-slate-50 opacity-70"
                              }`}
                            >
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl ${
                                  trophy.unlocked ? "bg-amber-100" : "bg-slate-200 grayscale"
                                }`}
                              >
                                {trophy.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-extrabold text-slate-900">
                                    {trophy.title}
                                  </span>
                                  {!trophy.unlocked && (
                                    <Lock className="h-3 w-3 text-slate-400" />
                                  )}
                                </div>
                                <p className="mt-0.5 text-[11px] text-slate-600">
                                  {trophy.description}
                                </p>
                                <p
                                  className={`mt-1 text-[11px] font-bold ${
                                    trophy.unlocked ? "text-amber-700" : "text-slate-500"
                                  }`}
                                >
                                  {trophy.progressText}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* TAB 3: 예측장                                              */}
                  {/* ========================================================== */}
                  {activeTab === "prediction" && (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <h2 className="text-sm font-extrabold text-sky-800">
                          🔮 {room.ownerNickname}님의 예측 활동 다이어리
                        </h2>
                        <Link
                          href="/prediction"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-sky-600 px-3 py-1 text-xs font-bold text-white hover:brightness-110"
                        >
                          <span>예측게임 광장 가기</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3.5">
                          <h3 className="mb-2.5 text-xs font-extrabold text-amber-800">
                            🎯 직접 개설한 예측게임 ({ownerStats.createdGamesCount}개)
                          </h3>
                          {data.createdGames.length > 0 ? (
                            <ul className="space-y-2">
                              {data.createdGames.map((game) => (
                                <li key={game.gameId}>
                                  <Link
                                    href={`/prediction/${game.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded border border-slate-200 bg-white p-2.5 transition hover:border-amber-400"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="truncate text-xs font-bold text-slate-800">
                                        {game.title}
                                      </span>
                                      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                        {game.status}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-[10px] text-slate-500">
                                      {game.category}
                                      {game.subcategory ? ` · ${game.subcategory}` : ""} ·{" "}
                                      {formatShortDate(game.createdAt)}
                                    </p>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="py-6 text-center text-xs text-slate-400">
                              아직 개설한 예측게임이 없습니다.
                            </p>
                          )}
                        </div>

                        <div className="rounded-lg border border-sky-200 bg-sky-50/30 p-3.5">
                          <h3 className="mb-2.5 text-xs font-extrabold text-sky-800">
                            ✨ 최근 예측 참여 ({ownerStats.predictionCount}회)
                          </h3>
                          {data.recentPredictions.length > 0 ? (
                            <ul className="space-y-2">
                              {data.recentPredictions.map((pred) => (
                                <li key={pred.predictionId}>
                                  <Link
                                    href={`/prediction/${pred.gameSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between rounded border border-slate-200 bg-white p-2.5 transition hover:border-sky-400"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <p className="truncate text-xs font-bold text-slate-800">
                                        {pred.gameTitle}
                                      </p>
                                      <p className="mt-0.5 text-[10px] text-slate-500">
                                        {formatShortDate(pred.createdAt)}
                                      </p>
                                    </div>
                                    <span className="shrink-0 rounded bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800">
                                      {pred.betAmount.toLocaleString()} PMP
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="py-6 text-center text-xs text-slate-400">
                              아직 예측 참여 기록이 없습니다.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* TAB 4: 기부첩                                              */}
                  {/* ========================================================== */}
                  {activeTab === "donation" && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div>
                          <h2 className="text-sm font-extrabold text-purple-900">
                            🕊️ {room.ownerNickname}님의 나눔 기록첩
                          </h2>
                          <p className="text-[11px] text-slate-500">
                            누적 {ownerStats.donationCount}회 · 총{" "}
                            <strong className="text-purple-700">
                              {ownerStats.totalDonatedPmc.toLocaleString()} PMC
                            </strong>{" "}
                            공공 나눔 실천
                          </p>
                        </div>
                        <Link
                          href="/donation"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:brightness-110"
                        >
                          <Heart className="h-3.5 w-3.5" />
                          <span>따뜻한 기부하기</span>
                        </Link>
                      </div>

                      {data.donations.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {data.donations.map((donation) => (
                            <div
                              key={donation.id}
                              className="rounded-lg border border-purple-200 bg-purple-50/40 p-3.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-extrabold text-slate-800">
                                  {donation.title}
                                </span>
                                <span className="shrink-0 rounded bg-purple-100 px-2 py-0.5 text-[11px] font-extrabold text-purple-800">
                                  {donation.pmcAmount.toLocaleString()} PMC
                                </span>
                              </div>
                              <p className="mt-1.5 text-xs text-slate-600">{donation.description}</p>
                              <p className="mt-2 text-[10px] text-slate-400">
                                {donation.category} · {formatShortDate(donation.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                          아직 공개된 기부 기록이 없습니다. 첫 PMC 기부를 실천하고 명예 트로피를 받아보세요!
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* TAB 5: 선물가게 (PMP 전용 상점)                            */}
                  {/* ========================================================== */}
                  {activeTab === "shop" && (
                    <div className="space-y-4">
                      <div className="flex flex-col justify-between gap-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-sky-50 to-indigo-50 p-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-xs font-extrabold text-emerald-950">
                            🎁 PosMul 힐링 선물가게 (경제 불변식: 무위험 포인트 PMP 전용)
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-600">
                            예측·포럼 활동으로 얻은 PMP로만 구매 가능하며, 소중한 PMC는 절대 차감되지 않습니다.
                          </p>
                        </div>
                        <div className="shrink-0 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-right shadow-xs">
                          <span className="block text-[10px] text-slate-500">
                            {isAuthenticated ? "내 사용 가능 PMP" : "체험 모드 (로그인 시 구매 가능)"}
                          </span>
                          <span className="text-sm font-extrabold text-sky-700">
                            {(isAuthenticated
                              ? viewerPmpBalance
                              : ownerStats.pmpBalance
                            ).toLocaleString()}{" "}
                            PMP
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            { key: "all", label: "전체 카탈로그" },
                            { key: "theme", label: "🏠 미니룸 스킨" },
                            { key: "minimi", label: "🧸 미니미 코디" },
                            { key: "prop", label: "🪑 가구 · 소품" },
                          ] as const
                        ).map((cat) => (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setShopFilter(cat.key)}
                            className={`rounded-md border px-3 py-1 text-xs font-bold transition ${
                              shopFilter === cat.key
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                              className={`flex flex-col justify-between rounded-lg border p-3 ${
                                isEquipped
                                  ? "border-indigo-400 bg-indigo-50/40"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-slate-50 text-xl">
                                      {previewIcon}
                                    </span>
                                    <div>
                                      <h4 className="text-xs font-extrabold text-slate-800">
                                        {item.name}
                                      </h4>
                                      <span className="text-[10px] font-semibold text-slate-400">
                                        {item.category === "theme"
                                          ? "미니룸 스킨"
                                          : item.category === "minimi"
                                            ? "미니미"
                                            : "미니룸 가구"}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-extrabold text-sky-700">
                                    {item.pricePmp === 0
                                      ? "기본"
                                      : `${item.pricePmp.toLocaleString()} PMP`}
                                  </span>
                                </div>
                                <p className="mt-2 text-[11px] leading-snug text-slate-600">
                                  {item.description}
                                </p>
                              </div>

                              <div className="mt-3">
                                {isOwned ? (
                                  <button
                                    type="button"
                                    disabled={isBusy || (!isOwner && isAuthenticated)}
                                    onClick={() => void handleEquipOwnedItem(item)}
                                    className={`w-full rounded py-1.5 text-xs font-bold transition ${
                                      isEquipped
                                        ? item.category === "prop"
                                          ? "border border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700"
                                          : "bg-emerald-100 text-emerald-800 cursor-default"
                                        : "border border-indigo-400 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                                    }`}
                                  >
                                    {isEquipped
                                      ? item.category === "prop"
                                        ? "✅ 배치됨 (치우기)"
                                        : "✅ 적용 중"
                                      : item.category === "prop"
                                        ? "🪑 방에 배치하기"
                                        : "✨ 적용하기"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => void handleBuyItem(item)}
                                    className="w-full rounded bg-gradient-to-r from-amber-500 to-orange-500 py-1.5 text-xs font-extrabold text-slate-950 shadow-sm hover:brightness-110 disabled:opacity-50"
                                  >
                                    {isBusy
                                      ? "구매 중..."
                                      : `🎁 ${item.pricePmp.toLocaleString()} PMP 선물구매`}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ========================================================== */}
                  {/* TAB 6: 방명록                                              */}
                  {/* ========================================================== */}
                  {activeTab === "guestbook" && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-200 pb-2">
                        <h2 className="text-sm font-extrabold text-rose-700">
                          💌 {room.ownerNickname}님의 방명록 ({data.guestbooks.length}건)
                        </h2>
                      </div>

                      <form
                        onSubmit={(e) => void handleWriteGuestbook(e)}
                        className="space-y-2.5 rounded-lg border border-rose-200 bg-rose-50/40 p-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            💌 일촌평 남기기
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {RELATION_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setGuestRelation(preset)}
                                className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                                  guestRelation === preset
                                    ? "border-rose-500 bg-rose-600 text-white"
                                    : "border-slate-300 bg-white text-slate-600"
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
                            className="w-full sm:w-56 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-rose-500 focus:outline-none"
                          />
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={200}
                            placeholder="미니룸 잘 구경하고 갑니다! 응원 한마디를 남겨보세요."
                            value={guestContent}
                            onChange={(e) => setGuestContent(e.target.value)}
                            className="flex-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-rose-500 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isBusy}
                            className="rounded bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            등록
                          </button>
                        </div>
                      </form>

                      <div className="space-y-2.5">
                        {data.guestbooks.length > 0 ? (
                          data.guestbooks.map((entry) => {
                            const aMinimi =
                              MINIMI_STYLES.find((m) => m.id === entry.authorMinimi) ??
                              MINIMI_STYLES[0];
                            return (
                              <div
                                key={entry.id}
                                className="rounded-lg border border-slate-200 bg-white p-3"
                              >
                                <div className="flex items-center justify-between border-b border-dotted border-slate-200 pb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{aMinimi.avatarEmoji}</span>
                                    <span className="text-xs font-extrabold text-slate-900">
                                      {entry.authorName}
                                    </span>
                                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                      {entry.relationLabel}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {formatShortDate(entry.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-2 text-xs leading-relaxed text-slate-700">
                                  {entry.content}
                                </p>
                              </div>
                            );
                          })
                        ) : (
                          <p className="py-6 text-center text-xs text-slate-400">
                            방명록이 비어 있습니다. 첫 글을 남겨보세요!
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </main>
              </div>
            </div>

            {/* === 다이어리 우측 돌출 도메인 컬러 책갈피 인덱스 탭 (xl 데스크톱 전용) === */}
            <nav
              aria-label="미니홈피 메뉴 탭"
              className="hidden xl:flex flex-col gap-1.5 absolute -right-[84px] top-12 z-20 w-[86px]"
            >
              {CY_BOOKMARK_TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1 rounded-r-lg border-2 border-l-0 px-2 py-2 text-left text-xs font-extrabold shadow-md transition-all ${
                      active
                        ? `-ml-1 border-amber-200 border-l-4 bg-white ${tab.activeAccent}`
                        : `${tab.inactiveClass}`
                    }`}
                  >
                    <span className="text-[11px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 2) 최우측 PosMul Citizen Studio 다크 글래스 위젯 컬럼 */}
        <aside className="w-full xl:w-[244px] xl:ml-[84px] shrink-0 space-y-3 text-slate-100">
          {/* PosMul Citizen Studio 게이지 + 주크박스 카드 */}
          <div className="overflow-hidden rounded-2xl border border-indigo-500/35 bg-[#111827]/95 shadow-2xl backdrop-blur-xl">
            <div className="bg-gradient-to-r from-indigo-600/85 via-sky-600/85 to-purple-600/85 px-3 py-2 text-center text-xs font-black tracking-tight text-white">
              PosMul Citizen Studio
            </div>

            <div className="space-y-3 p-3.5 text-[11px]">
              {/* 3색 게이지 바 */}
              {[
                {
                  label: "🌿 힐링지수",
                  pct: healingPct,
                  barClass: "bg-gradient-to-r from-emerald-500 to-teal-400",
                  onPlus: () => setBoostHealing((p) => (p + 10) % 40),
                },
                {
                  label: "🕊️ 나눔온도",
                  pct: warmthPct,
                  barClass: "bg-gradient-to-r from-purple-500 to-fuchsia-400",
                  onPlus: () => setBoostWarmth((p) => (p + 10) % 40),
                },
                {
                  label: "🔮 집단통찰",
                  pct: insightPct,
                  barClass: "bg-gradient-to-r from-sky-500 to-indigo-400",
                  onPlus: () => setBoostInsight((p) => (p + 10) % 40),
                },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">{stat.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-slate-400">{stat.pct}%</span>
                      <button
                        type="button"
                        onClick={stat.onPlus}
                        title={`${stat.label} 충전`}
                        className="flex h-4 w-4 items-center justify-center rounded border border-slate-600 bg-slate-800 text-[10px] font-bold text-sky-300 hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${stat.barClass}`}
                      style={{ width: `${stat.pct}%` }}
                    />
                  </div>
                </div>
              ))}

              {/* 마이심볼 */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-2.5">
                <span className="font-bold text-slate-300">🏅 마이심볼</span>
                <div className="flex items-center gap-1">
                  {unlockedTrophies.length > 0 ? (
                    unlockedTrophies.slice(0, 4).map((t) => (
                      <span key={t.id} title={t.title} className="text-sm">
                        {t.icon}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500">🌱 🔮 ☕</span>
                  )}
                </div>
              </div>

              {/* 바로가기 링크 */}
              <div className="flex items-center justify-center gap-2 border-t border-slate-800 pt-2.5 text-[11px] font-bold text-sky-300">
                <Link
                  href="/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-200 hover:underline"
                >
                  내 대시보드
                </Link>
                <span className="text-slate-600">|</span>
                <Link
                  href="/prediction"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-200 hover:underline"
                >
                  예측 광장
                </Link>
              </div>
            </div>

            {/* PosMul Lo-Fi 주크박스 */}
            <div className="border-t border-slate-800 bg-[#0b101d] p-3">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>💿 POSMUL JUKEBOX</span>
                <span className={isBgmPlaying ? "text-amber-300 animate-pulse" : "text-slate-500"}>
                  {isBgmPlaying ? "● ON AIR" : "LO-FI"}
                </span>
              </div>

              <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-[11px]">
                <Disc3
                  className={`h-4 w-4 shrink-0 text-amber-400 ${
                    isBgmPlaying ? "animate-spin" : ""
                  }`}
                />
                <span className="truncate font-bold text-sky-100">{activeBgm.label}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsBgmPlaying((prev) => !prev)}
                  className={`flex-1 inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold transition ${
                    isBgmPlaying
                      ? "border-amber-400/60 bg-amber-500/20 text-amber-200"
                      : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {isBgmPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  <span>{isBgmPlaying ? "일시정지" : "BGM 재생"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBgmPlaying(false)}
                  className="rounded-md border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                  title="정지"
                >
                  <Square className="h-2.5 w-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleNextBgm()}
                  className="rounded-md border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                  title="다음 BGM"
                >
                  <SkipForward className="h-3 w-3" />
                </button>
              </div>

              <select
                aria-label="미니홈피 BGM 트랙 선택"
                value={previewBgmId}
                onChange={(e) => setPreviewBgmId(e.target.value)}
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
              >
                {BGM_TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    ♪ {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PMP 선물가게 추천 아이템 카드 */}
          <div className="overflow-hidden rounded-2xl border border-emerald-500/35 bg-[#111827]/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-2 text-[11px] font-extrabold text-emerald-200">
              <span>🎁 PMP 선물가게 추천</span>
              <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="p-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                {recommendedShopItems.map((item) => {
                  const icon =
                    item.category === "theme"
                      ? item.icon
                      : item.category === "minimi"
                        ? item.avatarEmoji
                        : item.emoji;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab("shop")}
                      className="flex flex-col items-center rounded-xl border border-slate-700/80 bg-slate-900/80 p-2 text-center transition hover:border-sky-400/60"
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="mt-1 line-clamp-1 text-[10px] font-bold text-slate-200">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-bold text-sky-400">
                        {item.pricePmp} PMP
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShopFilter("all");
                    setActiveTab("shop");
                  }}
                  className="rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 py-1.5 text-[11px] font-extrabold text-slate-950 hover:brightness-110"
                >
                  PMP 선물가게
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("guestbook")}
                  className="rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 py-1.5 text-[11px] font-extrabold text-white hover:brightness-110"
                >
                  일촌평 쓰기
                </button>
              </div>
            </div>
          </div>

          {/* PosMul 경제 불변식 안내 카드 */}
          <div className="rounded-2xl border border-slate-700/80 bg-[#0b101d]/90 p-3 text-[10px] leading-relaxed text-slate-300 shadow-lg">
            <p className="flex items-center gap-1 font-extrabold text-amber-300">
              <Sparkles className="h-3 w-3" />
              PosMul 힐링룸 약속
            </p>
            <p className="mt-1 text-slate-400">
              미니룸 꾸미기는 무위험 포인트 <strong className="text-sky-300">PMP</strong>만 사용하며, 소중한{" "}
              <strong className="text-purple-300">PMC</strong>는 오직 기부와 공공선에만 쓰입니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
