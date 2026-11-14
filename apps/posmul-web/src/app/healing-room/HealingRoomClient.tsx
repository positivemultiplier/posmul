"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Disc3,
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

const CY_BOOKMARK_TABS: ReadonlyArray<{ key: CyTabKey; label: string }> = [
  { key: "home", label: "홈" },
  { key: "profile", label: "프로필" },
  { key: "prediction", label: "예측장" },
  { key: "donation", label: "기부첩" },
  { key: "shop", label: "선물가게" },
  { key: "guestbook", label: "방명록" },
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

  // 인라인 제목 편집 상태 (싸이월드 대문 제목 클릭 시)
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);

  // 프로필 편집 폼 상태
  const [editTitle, setEditTitle] = useState(initialData.room.roomTitle);
  const [editStatus, setEditStatus] = useState(initialData.room.statusMessage);
  const [editQuote, setEditQuote] = useState(initialData.room.minimiQuote);
  const [editMood, setEditMood] = useState(initialData.room.moodTag);
  const [editBgm, setEditBgm] = useState(initialData.room.bgmTrack);

  // 방명록 작성 상태 (홈 일촌평 & 방명록 탭 공용)
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
        `🌊 ${json.data.room.ownerNickname}님의 미니홈피로 파도타기 했습니다!`
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
      "✨ 미니홈피 프로필과 BGM 설정을 저장했습니다."
    );
  }

  async function handleQuickHeadlineSave(event: React.FormEvent) {
    event.preventDefault();
    const ok = await postAction(
      { action: "update_room", roomTitle: editTitle },
      "✏️ 미니홈피 대문 제목을 변경했습니다."
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
      showNotice("info", "먼저 '내 미니홈피'로 돌아가서 꾸밀 수 있습니다.");
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
      showNotice("info", "로그인하면 보유 PMP로 미니룸·미니미 아이템을 선물가게에서 구매할 수 있습니다.");
      return;
    }
    if (!isOwner) {
      showNotice("info", "먼저 '내 방으로' 이동한 뒤 구매해주세요.");
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
        `💿 싸이BGM을 '${nextTrack.label}'(으)로 변경했습니다.`
      );
    }
  }

  // Updated news 4줄 (기부 · 개설게임 · 예측참여 · 해금트로피)
  const updatedNewsLines = useMemo(() => {
    const lines: Array<{ tag: string; tagColor: string; text: string; targetTab: CyTabKey }> = [];

    if (data.donations[0]) {
      lines.push({
        tag: "[기부]",
        tagColor: "text-emerald-700",
        text: `${data.donations[0].title} (${data.donations[0].pmcAmount.toLocaleString()} PMC 나눔)`,
        targetTab: "donation",
      });
    } else {
      lines.push({
        tag: "[기부]",
        tagColor: "text-emerald-700",
        text: "첫 PMC 공공 기부로 따뜻함을 나눠보세요",
        targetTab: "donation",
      });
    }

    if (data.createdGames[0]) {
      lines.push({
        tag: "[예측]",
        tagColor: "text-sky-700",
        text: `내가 연 게임: ${data.createdGames[0].title}`,
        targetTab: "prediction",
      });
    } else {
      lines.push({
        tag: "[예측]",
        tagColor: "text-sky-700",
        text: "우리 동네·세상 이슈 예측게임을 직접 열어보세요",
        targetTab: "prediction",
      });
    }

    if (data.recentPredictions[0]) {
      lines.push({
        tag: "[참여]",
        tagColor: "text-indigo-700",
        text: `${data.recentPredictions[0].gameTitle} (${data.recentPredictions[0].betAmount.toLocaleString()} PMP)`,
        targetTab: "prediction",
      });
    } else {
      lines.push({
        tag: "[참여]",
        tagColor: "text-indigo-700",
        text: "집단지성 예측 참여 기록을 쌓아보세요",
        targetTab: "prediction",
      });
    }

    if (unlockedTrophies[0]) {
      lines.push({
        tag: "[명예]",
        tagColor: "text-amber-700",
        text: `배지 해금: ${unlockedTrophies[0].icon} ${unlockedTrophies[0].title}`,
        targetTab: "profile",
      });
    } else {
      lines.push({
        tag: "[명예]",
        tagColor: "text-amber-700",
        text: "활동 시 영광의 선반 트로피가 자동 진열됩니다",
        targetTab: "profile",
      });
    }

    return lines;
  }, [data.donations, data.createdGames, data.recentPredictions, unlockedTrophies]);

  const healingPct = Math.min(100, 48 + room.placedItems.length * 6 + boostHealing);
  const warmthPct = Math.min(100, 28 + Math.min(60, Math.round(ownerStats.totalDonatedPmc / 40)) + boostWarmth);
  const insightPct = Math.min(100, 25 + Math.min(65, (ownerStats.createdGamesCount * 15) + ownerStats.predictionCount * 5) + boostInsight);

  return (
    /* 정통 싸이월드 모눈종이 배경 프레임 */
    <div
      className="min-h-screen bg-[#767a7e] text-[#333333] pb-12"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.14) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    >
      {/* 레트로 미니 브라우저 주소창 */}
      <div className="border-b border-[#525659] bg-[#e9ecef] px-3 py-2 shadow-sm">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2 min-w-[240px]">
            <span className="hidden sm:inline-flex items-center gap-1 rounded border border-[#adb5bd] bg-[#dee2e6] px-2 py-0.5 text-[11px] font-bold text-[#495057]">
              ◀ ▶ ↻
            </span>
            <div className="flex flex-1 items-center gap-2 rounded border border-[#adb5bd] bg-white px-3 py-1 text-xs text-[#495057] shadow-inner">
              <span className="text-[#2b879e]">🏡</span>
              <span className="truncate font-mono">
                http://www.posmul.com/healing-room/{room.ownerNickname}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAuthenticated && !isOwner && data.viewerUserId && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void visitRoom({ targetUserId: data.viewerUserId ?? undefined })}
                className="inline-flex items-center gap-1 rounded border border-[#2b879e] bg-[#e6f5f8] px-2.5 py-1 text-[11px] font-bold text-[#175c6e] hover:bg-[#d2edf3]"
              >
                <Home className="h-3 w-3" />
                <span>내 미니홈피</span>
              </button>
            )}
            {!isAuthenticated && (
              <Link
                href="/auth/login?next=/healing-room"
                className="inline-flex items-center gap-1 rounded border border-orange-500 bg-[#ff7a00] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-[#e56d00]"
              >
                <LogIn className="h-3 w-3" />
                <span>로그인하고 내 방 만들기</span>
              </Link>
            )}
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void visitRoom({ targetUserId: room.userId })}
              className="inline-flex items-center gap-1 rounded border border-[#ced4da] bg-white px-2 py-1 text-[11px] font-semibold text-[#495057] hover:bg-slate-50"
            >
              <RefreshCw className="h-3 w-3" />
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </div>

      {/* 알림 배너 */}
      {notice && (
        <div className="mx-auto mt-3 max-w-[1220px] px-3">
          <div
            className={`flex items-center justify-between rounded-lg border px-3.5 py-2 text-xs font-semibold shadow-md ${
              notice.type === "error"
                ? "border-rose-400 bg-rose-50 text-rose-800"
                : notice.type === "success"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : "border-sky-400 bg-sky-50 text-sky-900"
            }`}
          >
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-3 text-[11px] underline opacity-75 hover:opacity-100"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* === 메인 싸이월드 2열 구조: 좌측 바인더 본체 + 우측 미니홈피 위젯 컬럼 === */}
      <div className="mx-auto mt-4 flex max-w-[1220px] flex-col gap-4 px-2 sm:px-4 xl:flex-row xl:items-start">
        {/* 1) 하늘색 하드커버 바인더 + 책갈피 탭 Wrapper */}
        <div className="relative flex-1">
          {/* 모바일 상단 가로 탭바 (xl 미만에서만 표시) */}
          <div className="mb-2 flex flex-wrap gap-1 xl:hidden">
            {CY_BOOKMARK_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === tab.key
                    ? "border-[#2b879e] bg-white text-[#236a7d]"
                    : "border-[#237083] bg-[#2b879e] text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 하늘색 바인더 외피 */}
          <div className="relative rounded-2xl border-2 border-[#3f91a5] bg-[#5cb5ca] p-2.5 sm:p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.42)]">
            {/* 바인더 안쪽 흰색 점선 스티치 */}
            <div className="rounded-xl border-2 border-dashed border-white/85 p-1.5 sm:p-2">
              <div className="relative grid grid-cols-1 gap-2 lg:grid-cols-12">
                {/* === 중앙 스프링 바인더 링 4개 (데스크톱 lg 이상 표시) === */}
                <div className="pointer-events-none hidden lg:flex absolute left-[28.2%] top-10 bottom-10 z-30 -translate-x-1/2 flex-col justify-between py-6">
                  {[0, 1, 2, 3].map((ringIdx) => (
                    <div
                      key={ringIdx}
                      className="flex items-center justify-between w-8 h-3.5 rounded-full border border-[#8fa1a8] bg-gradient-to-b from-white via-[#dfe6e9] to-[#9fb1b8] shadow-sm"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4b5c63] ml-0.5" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4b5c63] mr-0.5" />
                    </div>
                  ))}
                </div>

                {/* === 바인더 좌측 페이지: TODAY/TOTAL · 프로필 · 일촌 파도타기 === */}
                <aside className="lg:col-span-3 min-w-0 flex flex-col rounded-xl border border-[#b6c8cf] bg-[#f8fbfc] p-3">
                  {/* TODAY | TOTAL */}
                  <div className="mb-2 flex items-center justify-center gap-2 border-b border-dotted border-[#c4d5dc] pb-2 text-[11px] font-bold tracking-tight">
                    <span className="text-[#5c6f78]">TODAY</span>
                    <span className="font-mono text-xs font-extrabold text-[#e11d48]">
                      {room.todayVisits.toLocaleString()}
                    </span>
                    <span className="text-[#94a3b8]">|</span>
                    <span className="text-[#5c6f78]">TOTAL</span>
                    <span className="font-mono text-xs font-extrabold text-[#1e293b]">
                      {room.totalVisits.toLocaleString()}
                    </span>
                  </div>

                  {/* 좌측 내부 흰색 메인 카드 */}
                  <div className="flex flex-1 flex-col justify-between rounded-lg border border-[#cfdce1] bg-white p-3">
                    <div className="space-y-3">
                      {/* 대문 프로필 사진 프레임 (현재 미니미 + 테마 감성 일러스트) */}
                      <div
                        className={`relative flex h-40 flex-col items-center justify-center overflow-hidden rounded border border-[#d6e2e6] bg-gradient-to-b ${activeTheme.windowBgClass} p-3 text-center shadow-inner`}
                      >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-white/85 text-4xl shadow-md">
                          <span>{activeMinimi.avatarEmoji}</span>
                        </div>
                        <span className="mt-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-[#1e293b] shadow-sm">
                          {activeMinimi.accessoryEmoji} {activeMinimi.name}
                        </span>
                        <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-white drop-shadow">
                          <MapPin className="h-3 w-3" />
                          {room.regionLabel}
                        </span>
                      </div>

                      {/* TODAY IS... 기분 박스 */}
                      <div className="rounded border border-[#cbd9df] bg-[#f9fcfd] px-2.5 py-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-[#2b879e]">TODAY IS..</span>
                          {isOwner ? (
                            <select
                              aria-label="오늘의 기분 선택"
                              value={room.moodTag}
                              disabled={isBusy}
                              onChange={(e) => void handleQuickMoodChange(e.target.value)}
                              className="cursor-pointer rounded border border-[#d2e0e6] bg-white px-1.5 py-0.5 text-[11px] font-bold text-[#334155] focus:outline-none"
                            >
                              {MOOD_TAGS.map((tag) => (
                                <option key={tag} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-bold text-[#334155]">{room.moodTag}</span>
                          )}
                        </div>
                      </div>

                      {/* 상태 메시지 (자기소개글) */}
                      <div className="min-h-[68px] rounded border border-dashed border-[#dde6ea] bg-[#fcfefe] p-2.5 text-xs leading-relaxed text-[#475569]">
                        {room.statusMessage}
                      </div>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("profile")}
                          className="text-[11px] font-bold text-[#2b879e] hover:underline"
                        >
                          ✎ 프로필 / 인사말 편집하기
                        </button>
                      )}
                    </div>

                    {/* 하단 HISTORY + 닉네임 + 일촌 파도타기 셀렉트 */}
                    <div className="mt-4 space-y-2 border-t border-dotted border-[#cbd5e1] pt-3">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#64748b]">
                        <span>▶ HISTORY</span>
                        <span>▲ ▼</span>
                      </div>

                      <div>
                        <p className="text-sm font-extrabold text-[#1e3a5f]">
                          {room.ownerNickname}{" "}
                          <span className="text-[10px] font-normal text-[#64748b]">
                            ({isOwner ? "나" : "이웃"})
                          </span>
                        </p>
                        {ownerStats.overallRank !== null && (
                          <p className="text-[11px] font-semibold text-[#e67e22]">
                            시민 랭킹 #{ownerStats.overallRank.toLocaleString()} ·{" "}
                            {ownerStats.contributionScore.toLocaleString()}점
                          </p>
                        )}
                      </div>

                      {/* ★ 일촌 파도타기 셀렉트 + 랜덤 버튼 */}
                      <div className="space-y-1.5 rounded border border-[#d0dee3] bg-[#f2f8fa] p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#2b6b7c]">일촌</span>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void visitRoom({ wave: true })}
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#0284c7] hover:underline"
                          >
                            <Waves className="h-3 w-3" />
                            <span>랜덤 파도타기</span>
                          </button>
                        </div>
                        <select
                          aria-label="일촌 파도타기 목록"
                          value={room.userId}
                          disabled={isBusy}
                          onChange={(e) => void visitRoom({ targetUserId: e.target.value })}
                          className="w-full rounded border border-[#9bb8c3] bg-white px-2 py-1 text-[11px] font-semibold text-[#1e293b] focus:border-[#2b879e] focus:outline-none"
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
                <main className="lg:col-span-9 min-w-0 flex flex-col rounded-xl border border-[#b6c8cf] bg-white p-3.5 sm:p-5">
                  {/* 미니홈피 대문 타이틀 줄 */}
                  <div className="mb-3 flex flex-col gap-1 border-b border-[#cbd5e1] pb-2.5 sm:flex-row sm:items-end sm:justify-between">
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
                            className="rounded border border-[#2b879e] px-2 py-0.5 text-sm font-bold text-[#1e3a5f]"
                          />
                          <button
                            type="submit"
                            disabled={isBusy}
                            className="rounded bg-[#2b879e] px-2 py-0.5 text-xs font-bold text-white"
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
                          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#2b6b7c]">
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

                    <div className="flex items-center gap-2 text-[11px] text-[#64748b]">
                      <span
                        className={`rounded px-2 py-0.5 font-bold ${
                          isOwner
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-sky-50 text-sky-700 border border-sky-200"
                        }`}
                      >
                        {isOwner ? "👑 내 힐링룸" : "🌊 이웃 마실중"}
                      </span>
                      <span className="hidden sm:inline font-mono text-[10px] text-[#94a3b8]">
                        posmul.com/{room.ownerNickname}
                      </span>
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* TAB 1: 홈 (레퍼런스 이미지와 동일한 3단 미니홈피 대문 구조) */}
                  {/* ========================================================== */}
                  {activeTab === "home" && (
                    <div className="space-y-4">
                      {/* 1단: Updated news (좌) + 2x3 활동 요약 바둑판 (우) */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                        {/* Updated news */}
                        <div className="md:col-span-7">
                          <h2 className="mb-1.5 border-b-2 border-[#cbd5e1] pb-1 text-xs font-extrabold text-[#2b879e]">
                            Updated news
                          </h2>
                          <ul className="space-y-1 text-xs">
                            {updatedNewsLines.map((line, index) => (
                              <li key={index} className="flex items-center gap-1.5 truncate">
                                <span className="text-[#94a3b8]">•</span>
                                <span className={`font-bold shrink-0 ${line.tagColor}`}>
                                  {line.tag}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab(line.targetTab)}
                                  className="truncate text-left text-[#334155] hover:text-[#2b879e] hover:underline"
                                >
                                  {line.text}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 우측 2열 x 3행 싸이월드 스타일 요약 표 */}
                        <div className="md:col-span-5">
                          <div className="overflow-hidden rounded border border-[#cbd5e1] text-[11px]">
                            <div className="grid grid-cols-2 divide-x divide-[#e2e8f0] border-b border-[#e2e8f0]">
                              <button
                                type="button"
                                onClick={() => setActiveTab("donation")}
                                className="flex items-center justify-between bg-[#f8fafc] px-2.5 py-1.5 hover:bg-[#eef6f8]"
                              >
                                <span className="font-semibold text-[#475569]">공공기부</span>
                                <span className="font-bold text-[#059669]">
                                  {ownerStats.donationCount}건
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab("prediction")}
                                className="flex items-center justify-between bg-[#f8fafc] px-2.5 py-1.5 hover:bg-[#eef6f8]"
                              >
                                <span className="font-semibold text-[#475569]">개설게임</span>
                                <span className="font-bold text-[#d97706]">
                                  {ownerStats.createdGamesCount}개
                                </span>
                              </button>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-[#e2e8f0] border-b border-[#e2e8f0]">
                              <button
                                type="button"
                                onClick={() => setActiveTab("prediction")}
                                className="flex items-center justify-between px-2.5 py-1.5 hover:bg-[#eef6f8]"
                              >
                                <span className="font-semibold text-[#475569]">예측참여</span>
                                <span className="font-bold text-[#4f46e5]">
                                  {ownerStats.predictionCount}회
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab("profile")}
                                className="flex items-center justify-between px-2.5 py-1.5 hover:bg-[#eef6f8]"
                              >
                                <span className="font-semibold text-[#475569]">명예배지</span>
                                <span className="font-bold text-[#0284c7]">
                                  {unlockedTrophies.length}/{data.trophies.length}
                                </span>
                              </button>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-[#e2e8f0]">
                              <button
                                type="button"
                                onClick={() => setActiveTab("shop")}
                                className="flex items-center justify-between bg-[#f8fafc] px-2.5 py-1.5 hover:bg-[#eef6f8]"
                              >
                                <span className="font-semibold text-[#475569]">보유 PMP</span>
                                <span className="font-bold text-[#0369a1]">
                                  {ownerStats.pmpBalance.toLocaleString()}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveTab("guestbook")}
                                className="flex items-center justify-between bg-[#f8fafc] px-2.5 py-1.5 hover:bg-[#eef6f8]"
                              >
                                <span className="font-semibold text-[#475569]">방명록</span>
                                <span className="font-bold text-[#e11d48]">
                                  {data.guestbooks.length}개
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2단: Miniroom 섹션 */}
                      <div>
                        <div className="mb-1.5 flex items-end justify-between border-b border-[#cbd5e1] pb-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-t border border-b-0 border-[#cbd5e1] bg-[#f8fafc] px-3 py-0.5 text-xs font-extrabold text-[#2b879e]">
                              Miniroom
                            </span>
                            <span className="text-[11px] font-semibold text-[#64748b]">
                              {activeTheme.icon} {activeTheme.name}
                            </span>
                          </div>
                          <span className="truncate text-[11px] font-semibold text-[#2c7a9b]">
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

                      {/* 3단: What friends say (한줄 일촌평 바로 작성 & 목록) */}
                      <div className="pt-1">
                        <div className="mb-2 flex items-center justify-between border-b border-[#cbd5e1] pb-1">
                          <h3 className="text-xs font-extrabold text-[#2b879e]">
                            What friends say{" "}
                            <span className="ml-1 font-normal text-[11px] text-[#64748b]">
                              한마디로 표현해봐~
                            </span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => setActiveTab("guestbook")}
                            className="text-[11px] font-semibold text-[#64748b] hover:text-[#2b879e]"
                          >
                            방명록 전체보기 →
                          </button>
                        </div>

                        {/* 일촌평 한줄 입력 폼 */}
                        <form
                          onSubmit={(e) => void handleWriteGuestbook(e)}
                          className="mb-2.5 flex flex-col gap-1.5 rounded border border-[#dce6ea] bg-[#f1f6f8] p-2 sm:flex-row sm:items-center"
                        >
                          <span className="shrink-0 text-[11px] font-extrabold text-[#2b6b7c]">
                            일촌평
                          </span>
                          {!isAuthenticated && (
                            <input
                              type="text"
                              maxLength={20}
                              placeholder="닉네임"
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="w-full sm:w-28 rounded border border-[#cbd5e1] bg-white px-2 py-1 text-xs focus:border-[#2b879e] focus:outline-none"
                            />
                          )}
                          <input
                            type="text"
                            maxLength={200}
                            placeholder="따뜻한 일촌평을 남겨주세요..."
                            value={guestContent}
                            onChange={(e) => setGuestContent(e.target.value)}
                            className="flex-1 rounded border border-[#cbd5e1] bg-white px-2.5 py-1 text-xs focus:border-[#2b879e] focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isBusy}
                            className="shrink-0 rounded border border-[#94a3b8] bg-white px-3 py-1 text-xs font-bold text-[#334155] hover:bg-[#e2e8f0] disabled:opacity-50"
                          >
                            확인
                          </button>
                        </form>

                        {/* 일촌평 리스트 (싸이월드 포맷) */}
                        <ul className="divide-y divide-dotted divide-[#e2e8f0] text-xs">
                          {data.guestbooks.length > 0 ? (
                            data.guestbooks.slice(0, 5).map((entry) => (
                              <li
                                key={entry.id}
                                className="flex flex-wrap items-baseline justify-between gap-2 py-1.5"
                              >
                                <div className="flex flex-wrap items-baseline gap-1.5">
                                  <span className="text-[#334155]">{entry.content}</span>
                                  <span className="text-[11px] font-semibold text-[#2b879e]">
                                    ({entry.relationLabel}{" "}
                                    <strong className="text-[#1e3a5f]">{entry.authorName}</strong>)
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#94a3b8]">
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
                      <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
                        <h2 className="text-sm font-extrabold text-[#2b879e]">
                          👤 미니홈피 프로필 설정 & 영광의 선반
                        </h2>
                        <span className="text-xs font-bold text-amber-600">
                          해금 트로피 {unlockedTrophies.length} / {data.trophies.length}
                        </span>
                      </div>

                      {isOwner ? (
                        <form
                          onSubmit={(e) => void handleSaveProfile(e)}
                          className="space-y-3 rounded-lg border border-[#d6e4e8] bg-[#f7fbfc] p-4"
                        >
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-bold text-[#334155]">
                                미니홈피 제목
                              </label>
                              <input
                                type="text"
                                maxLength={50}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full rounded border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs focus:border-[#2b879e] focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold text-[#334155]">
                                미니미 말풍선
                              </label>
                              <input
                                type="text"
                                maxLength={60}
                                value={editQuote}
                                onChange={(e) => setEditQuote(e.target.value)}
                                className="w-full rounded border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs focus:border-[#2b879e] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-bold text-[#334155]">
                              상태 메시지 (인사말)
                            </label>
                            <textarea
                              rows={2}
                              maxLength={140}
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full rounded border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs focus:border-[#2b879e] focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-bold text-[#334155]">
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
                                        ? "border-[#2b879e] bg-[#e0f3f7] text-[#175463]"
                                        : "border-slate-300 bg-white text-slate-600"
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-bold text-[#334155]">
                                기본 BGM 선택
                              </label>
                              <select
                                value={editBgm}
                                onChange={(e) => {
                                  setEditBgm(e.target.value);
                                  setPreviewBgmId(e.target.value);
                                }}
                                className="w-full rounded border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-xs focus:border-[#2b879e] focus:outline-none"
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
                            className="rounded bg-[#2b879e] px-4 py-2 text-xs font-bold text-white hover:bg-[#237185] disabled:opacity-50"
                          >
                            {isBusy ? "저장 중..." : "✨ 미니홈피 설정 저장"}
                          </button>
                        </form>
                      ) : (
                        <div className="rounded border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                          현재 <strong>{room.ownerNickname}</strong>님의 미니홈피를 구경 중입니다. 내 프로필 편집은 본인 미니홈피에서 가능합니다.
                        </div>
                      )}

                      {/* 영광의 선반 (실적 기반 해금 트로피 6종) */}
                      <div>
                        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-[#1e3a5f]">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span>영광의 선반 (실제 활동으로만 해금되는 명예 트로피)</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {data.trophies.map((trophy) => (
                            <div
                              key={trophy.id}
                              className={`flex items-start gap-3 rounded-lg border p-3 ${
                                trophy.unlocked
                                  ? "border-amber-300 bg-amber-50/70"
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
                                  <span className="text-xs font-extrabold text-[#1e293b]">
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
                  {/* TAB 3: 예측장 (내가 만든 예측게임 & 예측 참여 발자취)     */}
                  {/* ========================================================== */}
                  {activeTab === "prediction" && (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbd5e1] pb-2">
                        <h2 className="text-sm font-extrabold text-[#2b879e]">
                          🔮 {room.ownerNickname}님의 예측 활동 다이어리
                        </h2>
                        <Link
                          href="/prediction"
                          className="inline-flex items-center gap-1 rounded bg-[#2b879e] px-3 py-1 text-xs font-bold text-white hover:bg-[#237185]"
                        >
                          <span>예측게임 광장 가기</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* 내가 개설한 예측게임 */}
                        <div className="rounded-lg border border-slate-200 bg-[#fbfdfe] p-3.5">
                          <h3 className="mb-2.5 text-xs font-extrabold text-amber-700">
                            🎯 직접 개설한 예측게임 ({ownerStats.createdGamesCount}개)
                          </h3>
                          {data.createdGames.length > 0 ? (
                            <ul className="space-y-2">
                              {data.createdGames.map((game) => (
                                <li key={game.gameId}>
                                  <Link
                                    href={`/prediction/${game.slug}`}
                                    className="block rounded border border-slate-200 bg-white p-2.5 transition hover:border-[#2b879e]"
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

                        {/* 최근 예측 참여 */}
                        <div className="rounded-lg border border-slate-200 bg-[#fbfdfe] p-3.5">
                          <h3 className="mb-2.5 text-xs font-extrabold text-indigo-700">
                            ✨ 최근 예측 참여 ({ownerStats.predictionCount}회)
                          </h3>
                          {data.recentPredictions.length > 0 ? (
                            <ul className="space-y-2">
                              {data.recentPredictions.map((pred) => (
                                <li key={pred.predictionId}>
                                  <Link
                                    href={`/prediction/${pred.gameSlug}`}
                                    className="flex items-center justify-between rounded border border-slate-200 bg-white p-2.5 transition hover:border-indigo-400"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <p className="truncate text-xs font-bold text-slate-800">
                                        {pred.gameTitle}
                                      </p>
                                      <p className="mt-0.5 text-[10px] text-slate-500">
                                        {formatShortDate(pred.createdAt)}
                                      </p>
                                    </div>
                                    <span className="shrink-0 rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
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
                  {/* TAB 4: 기부첩 (내 공공 나눔 기록 & 자부심 아카이브)         */}
                  {/* ========================================================== */}
                  {activeTab === "donation" && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbd5e1] pb-2">
                        <div>
                          <h2 className="text-sm font-extrabold text-[#2b879e]">
                            🕊️ {room.ownerNickname}님의 나눔 기록첩
                          </h2>
                          <p className="text-[11px] text-slate-500">
                            누적 {ownerStats.donationCount}회 · 총{" "}
                            <strong className="text-emerald-700">
                              {ownerStats.totalDonatedPmc.toLocaleString()} PMC
                            </strong>{" "}
                            나눔 실천
                          </p>
                        </div>
                        <Link
                          href="/donation"
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
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
                              className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-extrabold text-slate-800">
                                  {donation.title}
                                </span>
                                <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800">
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
                  {/* TAB 5: 선물가게 (보유 PMP 전용 미니룸·미니미 상점)          */}
                  {/* ========================================================== */}
                  {activeTab === "shop" && (
                    <div className="space-y-4">
                      <div className="flex flex-col justify-between gap-2 rounded-lg border border-amber-300 bg-[#fff9e6] p-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-xs font-extrabold text-amber-900">
                            🎁 싸이 선물가게 (경제 불변식: 무위험 포인트 PMP 전용)
                          </p>
                          <p className="mt-0.5 text-[11px] text-amber-800">
                            예측·포럼 활동으로 얻은 PMP로만 구매 가능하며, 소중한 PMC는 절대 차감되지 않습니다.
                          </p>
                        </div>
                        <div className="shrink-0 rounded border border-amber-400 bg-white px-3 py-1.5 text-right">
                          <span className="block text-[10px] text-slate-500">
                            {isAuthenticated ? "내 사용 가능 PMP" : "체험 모드 (로그인 시 구매 가능)"}
                          </span>
                          <span className="text-sm font-extrabold text-[#0284c7]">
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
                            className={`rounded border px-3 py-1 text-xs font-bold transition ${
                              shopFilter === cat.key
                                ? "border-[#2b879e] bg-[#e0f3f7] text-[#175463]"
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
                                  ? "border-[#2b879e] bg-[#f0fafc]"
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
                                        : "border border-[#2b879e] bg-[#e0f3f7] text-[#175463] hover:bg-[#cdebf2]"
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
                                    className="w-full rounded bg-[#ff8800] py-1.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#ea7d00] disabled:opacity-50"
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
                  {/* TAB 6: 방명록 (전체 일촌평 아카이브 & 작성 폼)             */}
                  {/* ========================================================== */}
                  {activeTab === "guestbook" && (
                    <div className="space-y-4">
                      <div className="border-b border-[#cbd5e1] pb-2">
                        <h2 className="text-sm font-extrabold text-[#2b879e]">
                          📝 {room.ownerNickname}님의 방명록 ({data.guestbooks.length}건)
                        </h2>
                      </div>

                      <form
                        onSubmit={(e) => void handleWriteGuestbook(e)}
                        className="space-y-2.5 rounded-lg border border-[#cfdce1] bg-[#f4f9fb] p-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1e3a5f]">
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
                                    ? "border-[#2b879e] bg-[#2b879e] text-white"
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
                            className="w-full sm:w-56 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#2b879e] focus:outline-none"
                          />
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={200}
                            placeholder="미니룸 잘 구경하고 갑니다! 응원 한마디를 남겨보세요."
                            value={guestContent}
                            onChange={(e) => setGuestContent(e.target.value)}
                            className="flex-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-[#2b879e] focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isBusy}
                            className="rounded bg-[#2b879e] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#237185] disabled:opacity-50"
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
                                    <span className="text-xs font-extrabold text-[#1e3a5f]">
                                      {entry.authorName}
                                    </span>
                                    <span className="rounded bg-[#e6f5f8] px-1.5 py-0.5 text-[10px] font-bold text-[#2b879e]">
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

            {/* === 다이어리 우측 돌출 책갈피 인덱스 탭 (xl 데스크톱 전용) === */}
            <nav
              aria-label="미니홈피 메뉴 탭"
              className="hidden xl:flex flex-col gap-1.5 absolute -right-[74px] top-12 z-20 w-[76px]"
            >
              {CY_BOOKMARK_TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-r-lg border-2 border-l-0 px-2.5 py-2 text-left text-xs font-bold shadow transition-all ${
                      active
                        ? "-ml-1 border-[#3f91a5] bg-white text-[#1e3a5f] shadow-md"
                        : "border-[#1d6477] bg-[#2b879e] text-white hover:bg-[#237387]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 2) 최우측 별도 미니홈피 위젯 컬럼 (레퍼런스 이미지 우측 사이드바 재현) */}
        <aside className="w-full xl:w-[235px] xl:ml-[74px] shrink-0 space-y-2.5">
          {/* 싸이월드 홈 감성 게이지 박스 */}
          <div className="overflow-hidden rounded border border-[#495057] bg-[#f8f9fa] shadow-lg">
            <div className="bg-[#5c646c] px-3 py-1.5 text-center text-xs font-bold text-white">
              PosMul 미니홈피 홈
            </div>
            <div className="space-y-2.5 p-3 text-[11px]">
              {/* 3색 상태 게이지 + [+] 버튼 */}
              {[
                {
                  label: "힐링지수",
                  pct: healingPct,
                  color: "bg-[#ff6b4a]",
                  onPlus: () => setBoostHealing((p) => (p + 10) % 40),
                },
                {
                  label: "나눔온도",
                  pct: warmthPct,
                  color: "bg-[#82c91e]",
                  onPlus: () => setBoostWarmth((p) => (p + 10) % 40),
                },
                {
                  label: "통찰력",
                  pct: insightPct,
                  color: "bg-[#22b8cf]",
                  onPlus: () => setBoostInsight((p) => (p + 10) % 40),
                },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 font-bold text-[#495057]">{stat.label}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-sm border border-[#ced4da] bg-[#e9ecef]">
                    <div
                      className={`h-full transition-all duration-300 ${stat.color}`}
                      style={{ width: `${stat.pct}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={stat.onPlus}
                    title={`${stat.label} 충전`}
                    className="flex h-4 w-4 items-center justify-center rounded-sm border border-[#adb5bd] bg-white text-[10px] font-bold text-[#495057] hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              ))}

              {/* 마이심볼 */}
              <div className="flex items-center justify-between border-t border-[#e9ecef] pt-2">
                <span className="font-bold text-[#495057]">마이심볼</span>
                <div className="flex items-center gap-1">
                  {unlockedTrophies.length > 0 ? (
                    unlockedTrophies.slice(0, 4).map((t) => (
                      <span key={t.id} title={t.title} className="text-sm">
                        {t.icon}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400">🌱 🔮 ☕</span>
                  )}
                </div>
              </div>

              {/* 바로가기 링크 */}
              <div className="flex items-center justify-center gap-2 border-t border-[#e9ecef] pt-2 text-[11px] font-bold text-[#2b6b7c]">
                <Link href="/dashboard" className="hover:underline">
                  내 대시보드
                </Link>
                <span className="text-slate-300">|</span>
                <Link href="/prediction" className="hover:underline">
                  예측 광장
                </Link>
              </div>
            </div>

            {/* 싸이월드 BGM 미니 오디오 플레이어 */}
            <div className="border-t border-[#ced4da] bg-[#eef2f5] p-2.5">
              <div className="mb-1.5 flex items-center gap-1.5 rounded border border-[#adb5bd] bg-white px-2 py-1 text-[11px]">
                <Disc3
                  className={`h-3.5 w-3.5 shrink-0 text-[#ff7a00] ${
                    isBgmPlaying ? "animate-spin" : ""
                  }`}
                />
                <span className="truncate font-bold text-[#343a40]">{activeBgm.label}</span>
              </div>

              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsBgmPlaying((prev) => !prev)}
                    className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold ${
                      isBgmPlaying
                        ? "border-amber-500 bg-amber-100 text-amber-800"
                        : "border-[#adb5bd] bg-white text-[#495057] hover:bg-slate-50"
                    }`}
                  >
                    {isBgmPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    <span>{isBgmPlaying ? "일시정지" : "재생"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBgmPlaying(false)}
                    className="rounded border border-[#adb5bd] bg-white p-1 text-[#495057] hover:bg-slate-50"
                    title="정지"
                  >
                    <Square className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleNextBgm()}
                    className="rounded border border-[#adb5bd] bg-white p-1 text-[#495057] hover:bg-slate-50"
                    title="다음 BGM"
                  >
                    <SkipForward className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-[10px] font-mono text-[#6c757d]">
                  {isBgmPlaying ? "ON AIR" : "LO-FI"}
                </span>
              </div>

              <select
                aria-label="미니홈피 BGM 트랙 선택"
                value={previewBgmId}
                onChange={(e) => setPreviewBgmId(e.target.value)}
                className="mt-1.5 w-full rounded border border-[#ced4da] bg-white px-1.5 py-1 text-[10px] text-[#495057]"
              >
                {BGM_TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    ♪ {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 선물가게 / 추천 아이템 박스 */}
          <div className="overflow-hidden rounded border border-[#495057] bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-[#dee2e6] bg-[#f8f9fa] px-3 py-1.5 text-[11px] font-extrabold text-[#343a40]">
              <span>선물가게 / 추천 아이템</span>
              <ShoppingBag className="h-3.5 w-3.5 text-[#ff7a00]" />
            </div>
            <div className="p-2.5 space-y-2">
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
                      className="flex flex-col items-center rounded border border-[#dee2e6] bg-[#f8f9fa] p-2 text-center hover:border-[#2b879e]"
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="mt-1 line-clamp-1 text-[10px] font-bold text-[#343a40]">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-bold text-[#0284c7]">
                        {item.pricePmp} PMP
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShopFilter("all");
                    setActiveTab("shop");
                  }}
                  className="rounded border border-[#e6a100] bg-[#ffc107] py-1 text-[11px] font-extrabold text-[#212529] hover:bg-[#ffb300]"
                >
                  PMP 선물가게
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("guestbook")}
                  className="rounded border border-[#d96b00] bg-[#ff8800] py-1 text-[11px] font-extrabold text-white hover:bg-[#ea7d00]"
                >
                  일촌평 남기기
                </button>
              </div>
            </div>
          </div>

          {/* 3초 힐링 안내 뱃지 */}
          <div className="rounded border border-[#525659] bg-[#2f353b] p-2.5 text-[10px] leading-relaxed text-slate-200 shadow">
            <p className="font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              PosMul 미니홈피 가이드
            </p>
            <p className="mt-1 text-slate-300">
              기부와 예측은 <strong className="text-white">자랑첩</strong>에 자동 기록되고, 미니룸 꾸미기는 무위험{" "}
              <strong className="text-sky-300">PMP</strong>만 사용합니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
