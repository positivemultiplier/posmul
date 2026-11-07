"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Coins,
  Database,
  ExternalLink,
  Layers,
  MessageSquare,
  PlusCircle,
  Radio,
  RefreshCw,
  Rss,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardHeader,
  AdminCardTitle,
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from "./shadcn-admin-ui";

export interface AdminGameRow {
  game_id: string;
  slug: string | null;
  title: string;
  category: string;
  subcategory: string | null;
  status: string;
  data_source: string | null;
  external_id: string | null;
  settlement_type: string | null;
  registration_end: string | null;
  settlement_date: string | null;
  options: Array<{ id: string; label: string }>;
}

export interface AdminSettlementSourceRow {
  id: string;
  game_id: string;
  game_title: string;
  source_type: string;
  external_id: string | null;
  scheduled_at: string;
  config_summary: string;
}

export interface AdminLiveRoomSummary {
  id: string;
  categoryLabel: string;
  title: string;
  viewerCount: number;
  statusText: string;
  linkedGameSlug: string;
  linkedGameQuestion: string;
  oracleLabel: string;
  totalPoolPmc: number;
}

interface AdminOverviewClientProps {
  metrics: {
    activeGamesCount: number;
    settledGamesCount: number;
    totalBetsCount: number;
    totalStakePmp: number;
    feedItemsCount: number;
    billsCount: number;
    forumPostsCount: number;
    liveMessagesCount: number;
    settlementQueueCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    label: string;
    count: number;
    colorClass: string;
  }>;
  games: AdminGameRow[];
  settlementSources: AdminSettlementSourceRow[];
  liveRooms: AdminLiveRoomSummary[];
}

const ORACLE_CATALOG = [
  {
    key: "kobis",
    name: "영화진흥위원회 통합전산망 (KOBIS)",
    domain: "ENTERTAINMENT · 박스오피스",
    mode: "Auto REST API",
    schedule: "주말 마감 ➔ 월 09:00 정산",
  },
  {
    key: "kcontent",
    name: "닐슨코리아 시청률 · Netflix Tudum · 써클차트",
    domain: "ENTERTAINMENT · 드라마/OTT/음원",
    mode: "Official Snapshot Oracle",
    schedule: "익일 07:00~11:00 공시 직후",
  },
  {
    key: "coingecko",
    name: "CoinGecko 글로벌 암호화폐 인덱스 v3",
    domain: "ECONOMY · 비트코인/이더리움",
    mode: "Real-Time Public API",
    schedule: "24/7 실시간 목표가 대조",
  },
  {
    key: "alpha-vantage",
    name: "Alpha Vantage US/KR 증시 종가",
    domain: "ECONOMY · 나스닥100/코스피",
    mode: "Auto REST API",
    schedule: "정규장 마감 후 06:00 KST",
  },
  {
    key: "dart",
    name: "금융감독원 전자공시시스템 (OpenDART)",
    domain: "ECONOMY · 상장사 분기 실적",
    mode: "Auto REST API",
    schedule: "분기보고서 공시 직후",
  },
  {
    key: "kosis",
    name: "통계청 국가통계포털 (KOSIS)",
    domain: "ECONOMY/POLITICS · 물가/실업률",
    mode: "Auto REST API",
    schedule: "월간 통계 발표 후 09:00",
  },
  {
    key: "ecos",
    name: "한국은행 경제통계시스템 (BOK ECOS)",
    domain: "ECONOMY · 기준금리/GDP/경상수지",
    mode: "Auto REST API",
    schedule: "금통위/속보치 발표 후 11:00",
  },
  {
    key: "football_data",
    name: "Football-Data.org / EPL 공식 경기 기록",
    domain: "SPORTS · 유럽축구 6대 리그",
    mode: "Auto Match API",
    schedule: "경기 종료(FT) 후 30분 내",
  },
  {
    key: "thesportsdb",
    name: "KBO 공식 기록실 & TheSportsDB",
    domain: "SPORTS · 한국시리즈/프로야구",
    mode: "Match Score Oracle",
    schedule: "경기 종료 직후 최종 스코어",
  },
];

type TabKey = "overview" | "games" | "oracles" | "live";

export function AdminOverviewClient({
  metrics,
  categoryBreakdown,
  games,
  settlementSources,
  liveRooms,
}: AdminOverviewClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const runAdminAction = async (
    key: string,
    label: string,
    fn: () => Promise<Response>
  ) => {
    setActionLoading(key);
    setActionToast(`${label} 실행 중...`);
    try {
      const res = await fn();
      const data = await res.json();
      if (data.success !== false) {
        setActionToast(
          `✅ ${label} 완료! ${data.message || ""}`
        );
        router.refresh();
      } else {
        setActionToast(`❌ ${label} 실패: ${data.error || "알 수 없는 오류"}`);
      }
    } catch (e: any) {
      setActionToast(`❌ 오류 발생: ${e?.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickSettle = async (gameId: string, winningOption: string, title: string) => {
    if (!confirm(`[${title}]\n'${winningOption}' 옵션을 최종 승리로 확정하고 PMC 보상을 정산하시겠습니까?`)) {
      return;
    }
    await runAdminAction(
      `settle-${gameId}`,
      `'${winningOption}' 승리 정산`,
      () =>
        fetch("/api/dev/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "settle",
            gameId,
            winningOption,
          }),
        })
    );
  };

  const filteredGames = games.filter((g) => {
    const matchCat = categoryFilter === "ALL" || g.category === categoryFilter;
    const matchSearch =
      !searchQuery.trim() ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.data_source || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.slug || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. 상단 대시보드 헤더 & 원클릭 액션 바 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <AdminBadge variant="info">
              <ShieldCheck className="w-3 h-3" />
              <span>shadcn/ui Admin Dashboard v2.5</span>
            </AdminBadge>
            <AdminBadge variant="success">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Supabase & 9 Oracles Linked</span>
            </AdminBadge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            PosMul 통합 운영 커맨드 센터
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            9대 공인 데이터 오라클, 예측 마켓, 3단계 MoneyWave 상금풀, 실시간 라이브 응원톡 및 포럼을 한곳에서 제어합니다.
          </p>
        </div>

        {/* 우측 원클릭 운영 트리거 버튼 그룹 */}
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton
            variant="secondary"
            onClick={() =>
              runAdminAction("feed-ingest", "다채널 피드 수집 & AI 초안 생성", () =>
                fetch("/api/cron/feed-ingest?category=all")
              )
            }
            disabled={actionLoading !== null}
          >
            <Rss className={`w-3.5 h-3.5 text-sky-400 ${actionLoading === "feed-ingest" ? "animate-spin" : ""}`} />
            <span>다채널 피드 수집</span>
          </AdminButton>

          <AdminButton
            variant="secondary"
            onClick={() =>
              runAdminAction("scheduler-sync", "마스터 템플릿 스케줄러 동기화", () =>
                fetch("/api/admin/scheduler/sync", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ materializeTemplates: true }),
                })
              )
            }
            disabled={actionLoading !== null}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${actionLoading === "scheduler-sync" ? "animate-spin" : ""}`} />
            <span>스케줄러 동기화</span>
          </AdminButton>

          <AdminButton
            variant="amber"
            onClick={() =>
              runAdminAction("oracle-settle", "오라클 자동 정산 배치", () =>
                fetch("/api/cron/prediction-settle")
              )
            }
            disabled={actionLoading !== null}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>오라클 일괄 정산</span>
          </AdminButton>
        </div>
      </div>

      {/* 액션 실행 피드백 알림 바 */}
      {actionToast && (
        <div className="rounded-xl border border-sky-500/40 bg-sky-950/30 px-4 py-3 text-xs text-sky-200 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionToast(null)}
            className="text-sky-400 hover:text-white font-bold text-xs"
          >
            닫기
          </button>
        </div>
      )}

      {/* 2. 상단 4열 shadcn/ui KPI 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <AdminCardTitle className="text-xs font-bold text-zinc-400">
              활성 예측 마켓 (ACTIVE)
            </AdminCardTitle>
            <Target className="w-4 h-4 text-sky-400" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-black text-white">
              {metrics.activeGamesCount}개
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              정산 완료 <strong className="text-emerald-400">{metrics.settledGamesCount}개</strong> · 전 카테고리 라이브
            </p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <AdminCardTitle className="text-xs font-bold text-zinc-400">
              공인 데이터 오라클 큐
            </AdminCardTitle>
            <Database className="w-4 h-4 text-emerald-400" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-black text-emerald-400">
              9 / 9 연동됨
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              자동 정산 예약 대기열 <strong className="text-white">{metrics.settlementQueueCount}건</strong>
            </p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <AdminCardTitle className="text-xs font-bold text-zinc-400">
              누적 시민 베팅 & PMP
            </AdminCardTitle>
            <Coins className="w-4 h-4 text-amber-400" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-black text-amber-300">
              {metrics.totalStakePmp.toLocaleString()} PMP
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              총 <strong className="text-white">{metrics.totalBetsCount.toLocaleString()}건</strong> 시민 예측 참여 기록
            </p>
          </AdminCardContent>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <AdminCardTitle className="text-xs font-bold text-zinc-400">
              LIVE 응원톡 & 커뮤니티
            </AdminCardTitle>
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
          </AdminCardHeader>
          <AdminCardContent>
            <div className="text-2xl font-black text-white">
              {liveRooms.length}개 LIVE 룸
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              포럼 게시글 <strong className="text-sky-300">{metrics.forumPostsCount}건</strong> · 수집 피드 <strong className="text-purple-300">{metrics.feedItemsCount}건</strong>
            </p>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* 3. shadcn/ui 스타일 탭 네비게이션 */}
      <div className="border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900/90 p-1 text-zinc-400 border border-zinc-800/80 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-zinc-100 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            📊 종합 애널리틱스 & 오라클
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("games")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "games"
                ? "bg-zinc-100 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            🎮 예측 마켓 테이블 ({games.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("oracles")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "oracles"
                ? "bg-zinc-100 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ⚖️ 자동 정산 대기열 ({settlementSources.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "live"
                ? "bg-zinc-100 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            🔴 LIVE 응원톡 매니저 ({liveRooms.length})
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Link
            href="/admin/feed"
            className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition"
          >
            <span>AI 피드 센터</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/economy"
            className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition"
          >
            <span>MoneyWave 원장</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ================= TAB 1: 종합 애널리틱스 & 오라클 ================= */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 좌측 7컬럼: 도메인 분포 & 핵심 활성 마켓 테이블 */}
          <div className="lg:col-span-7 space-y-6">
            {/* 도메인별 예측 마켓 분포 차트 카드 */}
            <AdminCard>
              <AdminCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <AdminCardTitle>도메인별 활성 예측 마켓 분포</AdminCardTitle>
                    <AdminCardDescription>
                      현재 운영 중인 {metrics.activeGamesCount}개 공식 예측 게임의 카테고리 비중과 데이터 소스 연결 현황
                    </AdminCardDescription>
                  </div>
                  <BarChart3 className="w-4 h-4 text-zinc-400" />
                </div>
              </AdminCardHeader>
              <AdminCardContent className="space-y-4">
                {categoryBreakdown.map((item) => {
                  const pct =
                    metrics.activeGamesCount > 0
                      ? Math.round((item.count / metrics.activeGamesCount) * 100)
                      : 0;
                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-200 flex items-center gap-2">
                          <span>{item.label}</span>
                          <span className="text-[11px] font-mono text-zinc-500">
                            ({item.category})
                          </span>
                        </span>
                        <span className="font-mono font-bold text-zinc-300">
                          {item.count}개 ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/80">
                        <div
                          className={`h-full rounded-full ${item.colorClass}`}
                          style={{ width: `${Math.max(pct, 6)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </AdminCardContent>
            </AdminCard>

            {/* 최근 활성 예측 마켓 Top 6 빠른 제어 */}
            <AdminCard>
              <AdminCardHeader className="flex flex-row items-center justify-between">
                <div>
                  <AdminCardTitle>핵심 활성 예측 마켓 빠른 제어</AdminCardTitle>
                  <AdminCardDescription>
                    클릭 시 유저 상세 화면 확인 또는 즉시 정산이 가능합니다
                  </AdminCardDescription>
                </div>
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("games")}
                >
                  전체 {games.length}개 보기 →
                </AdminButton>
              </AdminCardHeader>
              <AdminCardContent>
                <AdminTable>
                  <AdminTableHeader>
                    <AdminTableRow>
                      <AdminTableHead>예측 게임 제목</AdminTableHead>
                      <AdminTableHead>오라클 소스</AdminTableHead>
                      <AdminTableHead className="text-right">빠른 액션</AdminTableHead>
                    </AdminTableRow>
                  </AdminTableHeader>
                  <AdminTableBody>
                    {games.slice(0, 6).map((g) => (
                      <AdminTableRow key={g.game_id}>
                        <AdminTableCell>
                          <div className="font-bold text-white line-clamp-1">
                            {g.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono">
                            {g.category} {g.subcategory ? `· ${g.subcategory}` : ""}
                          </div>
                        </AdminTableCell>
                        <AdminTableCell>
                          <AdminBadge variant="info">
                            {g.data_source || "manual"}
                          </AdminBadge>
                        </AdminTableCell>
                        <AdminTableCell className="text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              href={`/prediction/${g.slug || g.game_id}`}
                              target="_blank"
                              className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <span>보기</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </AdminTableCell>
                      </AdminTableRow>
                    ))}
                  </AdminTableBody>
                </AdminTable>
              </AdminCardContent>
            </AdminCard>
          </div>

          {/* 우측 5컬럼: 9대 공인 데이터 오라클 상태 & 빠른 포인트/경제 조작 */}
          <div className="lg:col-span-5 space-y-6">
            {/* 9대 공인 데이터 오라클 카탈로그 & 상태 */}
            <AdminCard>
              <AdminCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <AdminCardTitle>📡 9대 공인 데이터 오라클 상태</AdminCardTitle>
                    <AdminCardDescription>
                      문서화된 마스터 데이터 소스와 SettlementOrchestrator 실시간 연결 현황
                    </AdminCardDescription>
                  </div>
                  <AdminBadge variant="success">ALL ACTIVE</AdminBadge>
                </div>
              </AdminCardHeader>
              <AdminCardContent className="space-y-2.5">
                {ORACLE_CATALOG.map((orc) => (
                  <div
                    key={orc.key}
                    className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {orc.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {orc.domain} · <span className="text-sky-400">{orc.schedule}</span>
                      </div>
                    </div>
                    <AdminBadge variant="success" className="shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>연동됨</span>
                    </AdminBadge>
                  </div>
                ))}
              </AdminCardContent>
            </AdminCard>

            {/* 경제 & 포인트 빠른 컨트롤 카드 */}
            <AdminCard>
              <AdminCardHeader>
                <AdminCardTitle>⚡ 경제 & 포인트 원클릭 도구</AdminCardTitle>
                <AdminCardDescription>
                  테스트 계정 PMP 즉시 충전 및 3단계 MoneyWave 상금풀 재계산
                </AdminCardDescription>
              </AdminCardHeader>
              <AdminCardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <AdminButton
                  variant="amber"
                  onClick={() =>
                    runAdminAction("grant-pmp", "테스트 계정 10,000 PMP 지급", () =>
                      fetch("/api/admin/economy", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "grant-pmp", amount: 10000 }),
                      })
                    )
                  }
                  disabled={actionLoading !== null}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>+10,000 PMP 지급</span>
                </AdminButton>

                <AdminButton
                  variant="secondary"
                  onClick={() =>
                    runAdminAction("calc-mw", "MoneyWave 상금풀 재계산", () =>
                      fetch("/api/admin/economy", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "calculate-moneywave" }),
                      })
                    )
                  }
                  disabled={actionLoading !== null}
                >
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>MoneyWave 재계산</span>
                </AdminButton>
              </AdminCardContent>
            </AdminCard>
          </div>
        </div>
      )}

      {/* ================= TAB 2: 예측 마켓 전체 데이터 테이블 ================= */}
      {activeTab === "games" && (
        <AdminCard>
          <AdminCardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <AdminCardTitle>전체 예측 마켓 관리 테이블 ({filteredGames.length}개)</AdminCardTitle>
                <AdminCardDescription>
                  Supabase prediction.prediction_games 실시간 연동 · 검색, 카테고리 필터 및 원클릭 승리 판정 지원
                </AdminCardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 검색 입력 */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="제목, 오라클, 슬러그 검색..."
                    className="h-8 pl-8 pr-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* 카테고리 필터 */}
                {["ALL", "ECONOMY", "ENTERTAINMENT", "SPORTS", "POLITICS", "INVEST"].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        categoryFilter === cat
                          ? "bg-zinc-100 text-zinc-950 border-white"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                      }`}
                    >
                      {cat === "ALL" ? "전체" : cat}
                    </button>
                  )
                )}
              </div>
            </div>
          </AdminCardHeader>

          <AdminCardContent>
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>상태</AdminTableHead>
                  <AdminTableHead>카테고리</AdminTableHead>
                  <AdminTableHead>예측 게임 제목 & 슬러그</AdminTableHead>
                  <AdminTableHead>공인 오라클</AdminTableHead>
                  <AdminTableHead>마감 / 정산일</AdminTableHead>
                  <AdminTableHead className="text-right">원클릭 정산 / 상세</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {filteredGames.map((g) => (
                  <AdminTableRow key={g.game_id}>
                    <AdminTableCell>
                      <AdminBadge
                        variant={g.status === "ACTIVE" ? "success" : "secondary"}
                      >
                        {g.status}
                      </AdminBadge>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="font-bold text-zinc-200">{g.category}</div>
                      {g.subcategory && (
                        <div className="text-[10px] font-mono text-zinc-500">
                          {g.subcategory}
                        </div>
                      )}
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="font-bold text-white max-w-md line-clamp-1">
                        {g.title}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">
                        /{g.slug || g.game_id}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminBadge variant="info">
                        {g.data_source || "manual"}
                      </AdminBadge>
                      <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                        {g.settlement_type || "auto"}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="font-mono text-[11px] text-zinc-400">
                      <div>
                        마감:{" "}
                        {g.registration_end
                          ? new Date(g.registration_end).toLocaleDateString("ko-KR")
                          : "-"}
                      </div>
                      <div>
                        정산:{" "}
                        {g.settlement_date
                          ? new Date(g.settlement_date).toLocaleDateString("ko-KR")
                          : "-"}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        {g.status === "ACTIVE" &&
                          g.options.slice(0, 2).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                handleQuickSettle(g.game_id, opt.id, g.title)
                              }
                              className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition cursor-pointer"
                              title={`'${opt.label}' 승리 확정 및 정산`}
                            >
                              🏆 {opt.label.slice(0, 8)}
                            </button>
                          ))}
                        <Link
                          href={`/prediction/${g.slug || g.game_id}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <span>열기</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          </AdminCardContent>
        </AdminCard>
      )}

      {/* ================= TAB 3: 오라클 자동 정산 대기열 ================= */}
      {activeTab === "oracles" && (
        <AdminCard>
          <AdminCardHeader className="flex flex-row items-center justify-between">
            <div>
              <AdminCardTitle>
                ⚖️ 오라클 무인 자동 정산 대기열 ({settlementSources.length}건)
              </AdminCardTitle>
              <AdminCardDescription>
                prediction.settlement_sources 테이블에 등록된 공식 오라클 판정 설정 및 정산 예정 시각
              </AdminCardDescription>
            </div>
            <AdminButton
              variant="amber"
              size="sm"
              onClick={() =>
                runAdminAction("oracle-batch", "오라클 자동 정산 실행", () =>
                  fetch("/api/cron/prediction-settle")
                )
              }
            >
              <Scale className="w-3.5 h-3.5" />
              <span>도래한 정산 즉시 실행</span>
            </AdminButton>
          </AdminCardHeader>
          <AdminCardContent>
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>오라클 타입</AdminTableHead>
                  <AdminTableHead>연동된 예측 게임</AdminTableHead>
                  <AdminTableHead>판정 기준 (source_config)</AdminTableHead>
                  <AdminTableHead>자동 정산 예정 시각</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {settlementSources.map((src) => (
                  <AdminTableRow key={src.id}>
                    <AdminTableCell>
                      <AdminBadge variant="info">{src.source_type}</AdminBadge>
                      {src.external_id && (
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          {src.external_id}
                        </div>
                      )}
                    </AdminTableCell>
                    <AdminTableCell className="font-bold text-white max-w-sm">
                      {src.game_title}
                    </AdminTableCell>
                    <AdminTableCell className="font-mono text-[11px] text-emerald-300 max-w-xs truncate">
                      {src.config_summary}
                    </AdminTableCell>
                    <AdminTableCell className="font-mono text-xs text-amber-300">
                      {new Date(src.scheduled_at).toLocaleString("ko-KR")}
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          </AdminCardContent>
        </AdminCard>
      )}

      {/* ================= TAB 4: LIVE 응원톡 매니저 ================= */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveRooms.map((room) => (
            <AdminCard key={room.id} className="flex flex-col justify-between">
              <AdminCardHeader>
                <div className="flex items-center justify-between mb-1">
                  <AdminBadge variant="live">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>LIVE ROOM</span>
                  </AdminBadge>
                  <span className="text-xs font-mono text-zinc-400">
                    접속 {room.viewerCount.toLocaleString()}명
                  </span>
                </div>
                <AdminCardTitle className="text-base">{room.title}</AdminCardTitle>
                <AdminCardDescription>{room.categoryLabel}</AdminCardDescription>
              </AdminCardHeader>
              <AdminCardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1 text-xs">
                  <div className="text-zinc-400 font-semibold">
                    전광판 상태: <span className="text-red-300 font-bold">{room.statusText}</span>
                  </div>
                  <div className="text-zinc-400">
                    연동 예측: <span className="text-white font-bold">{room.linkedGameQuestion}</span>
                  </div>
                  <div className="text-emerald-300 text-[11px]">
                    📡 오라클: {room.oracleLabel} · 💰 {room.totalPoolPmc.toLocaleString()} PMC
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    href={`/live/${room.id}`}
                    target="_blank"
                    className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold text-center transition"
                  >
                    🔴 라이브 룸 입장
                  </Link>
                  <Link
                    href={`/prediction/${room.linkedGameSlug}`}
                    target="_blank"
                    className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
                  >
                    예측 마켓 →
                  </Link>
                </div>
              </AdminCardContent>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}

