"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Target,
  ListFilter,
  PlusCircle,
  Scale,
  CalendarClock,
  FileCode2,
  Rss,
  MessageSquare,
  Coins,
  Radio,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/shared/ui/utils/cn";
import { AdminBadge } from "./shadcn-admin-ui";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: "Overview",
    items: [
      {
        href: "/admin",
        label: "통합 커맨드 대시보드",
        icon: LayoutDashboard,
        badge: "v2.5",
      },
      {
        href: "/admin/users",
        label: "시민 회원 관리",
        icon: Users,
      },
    ],
  },
  {
    groupLabel: "Prediction & Oracles",
    items: [
      {
        href: "/admin/prediction",
        label: "예측 파이프라인 콘솔",
        icon: Target,
      },
      {
        href: "/admin/prediction/games",
        label: "전체 예측 게임 테이블",
        icon: ListFilter,
      },
      {
        href: "/admin/prediction/games/create",
        label: "신규 예측 게임 생성",
        icon: PlusCircle,
      },
      {
        href: "/admin/prediction/settlement",
        label: "오라클 & 정산 센터",
        icon: Scale,
        badge: "Auto",
      },
      {
        href: "/admin/prediction/scheduler",
        label: "스케줄러 & 데이터소스",
        icon: CalendarClock,
      },
      {
        href: "/admin/prediction/templates",
        label: "정기 예측 템플릿",
        icon: FileCode2,
      },
    ],
  },
  {
    groupLabel: "Ingestion & Ecosystem",
    items: [
      {
        href: "/admin/feed",
        label: "AI 다채널 피드 수집",
        icon: Rss,
        badge: "Gemini",
      },
      {
        href: "/admin/forum",
        label: "포럼 갤러리 관리",
        icon: MessageSquare,
      },
      {
        href: "/admin/economy",
        label: "경제 & MoneyWave",
        icon: Coins,
        badge: "PMC",
      },
    ],
  },
];

export function AdminSidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [liveTicker, setLiveTicker] = useState<{
    btcUsd: number;
    usdKrw: number;
    activeGames: number;
    oracleCount: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/prediction/oracle-status")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          setLiveTicker({
            btcUsd: data.liveMarketSnapshot?.btcUsd ?? 93850,
            usdKrw: data.liveMarketSnapshot?.usdKrw ?? 1380,
            activeGames: data.summary?.activeGamesCount ?? 22,
            oracleCount: data.oracleAdapters?.length ?? 9,
          });
        }
      })
      .catch(() => null);
  }, []);

  // 현재 경로에 맞는 브레드크럼 타이틀 도출
  const activeItem = ADMIN_NAV_GROUPS.flatMap((g) => g.items).find(
    (i) => i.href === pathname
  );

  return (
    <div className="flex min-h-screen bg-[#07080c] text-zinc-100 font-sans">
      {/* 좌측 shadcn/ui 스타일 사이드바 (Sidebar-07 아키텍처) */}
      <aside
        className={cn(
          "border-r border-zinc-800/80 bg-[#090a0f] flex flex-col justify-between transition-all duration-200 shrink-0 select-none",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="space-y-4 py-4">
          {/* 상단 브랜드 워크스페이스 헤더 */}
          <div className="px-3 flex items-center justify-between">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-900 transition overflow-hidden"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                P
              </div>
              {!collapsed && (
                <div className="leading-tight truncate">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>PosMul Admin</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    shadcn Command v2.5
                  </div>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
              title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 네비게이션 그룹 리스트 */}
          <nav className="px-2.5 space-y-5">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.groupLabel} className="space-y-1">
                {!collapsed && (
                  <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {group.groupLabel}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname === item.href ||
                          (pathname.startsWith(item.href + "/") &&
                            item.href !== "/admin/prediction");

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all",
                          isActive
                            ? "bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60"
                            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              "w-4 h-4 shrink-0",
                              isActive ? "text-sky-400" : "text-zinc-400"
                            )}
                          />
                          {!collapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>
                        {!collapsed && item.badge && (
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded text-[10px] font-bold",
                              isActive
                                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                : "bg-zinc-800 text-zinc-400"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* 하단 라이브 서비스 바로가기 푸터 */}
        <div className="p-3 border-t border-zinc-800/80 space-y-1.5">
          {!collapsed && (
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Live User Channels
            </div>
          )}
          <Link
            href="/prediction"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
          >
            <span className="flex items-center gap-2 truncate">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              {!collapsed && <span>예측 마켓 메인</span>}
            </span>
            {!collapsed && <ExternalLink className="w-3 h-3 text-zinc-500" />}
          </Link>
          <Link
            href="/live"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 transition"
          >
            <span className="flex items-center gap-2 truncate">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
              {!collapsed && <span>LIVE 응원톡 라운지</span>}
            </span>
            {!collapsed && <ExternalLink className="w-3 h-3 text-red-400/70" />}
          </Link>
        </div>
      </aside>

      {/* 우측 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 shadcn/ui 브레드크럼 & 실시간 오라클 티커 바 */}
        <header className="h-14 border-b border-zinc-800/80 bg-[#090a0f]/90 backdrop-blur px-6 flex items-center justify-between gap-4 sticky top-[60px] md:top-[142px] z-30">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/admin"
              className="text-zinc-400 hover:text-white font-semibold transition"
            >
              PosMul Admin
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="font-bold text-white">
              {activeItem?.label || "관리자 콘솔"}
            </span>
          </div>

          {/* 우측 실시간 오라클 상태 & 퀵 버튼 */}
          <div className="flex items-center gap-3">
            {liveTicker && (
              <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{liveTicker.oracleCount}대 오라클 정상</span>
                </span>
                <span className="text-zinc-700">|</span>
                <span>
                  BTC <strong className="text-amber-300">${liveTicker.btcUsd.toLocaleString()}</strong>
                </span>
                <span className="text-zinc-700">|</span>
                <span>
                  USD/KRW <strong className="text-sky-300">₩{liveTicker.usdKrw.toLocaleString()}</strong>
                </span>
                <span className="text-zinc-700">|</span>
                <span>
                  활성 게임 <strong className="text-white">{liveTicker.activeGames}개</strong>
                </span>
              </div>
            )}

            <Link
              href="/admin/prediction/games/create"
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition flex items-center gap-1 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>새 예측 생성</span>
            </Link>
          </div>
        </header>

        {/* 페이지 본문 */}
        <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

