"use client";

import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Coins,
  ExternalLink,
  GraduationCap,
  Library,
  LogIn,
  LogOut,
  Minus,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Type,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useGlobalUx } from "@/components/mobile/global-ux-provider";

interface StudyMenuDrawerProps {
  open: boolean;
  isProShell: boolean;
  pathname: string;
  dDayLabel: string;
  onClose: () => void;
  onSwitchMode: (targetPro: boolean) => void;
}

export function StudyMenuDrawer({
  open,
  isProShell,
  pathname,
  dDayLabel,
  onClose,
  onSwitchMode,
}: StudyMenuDrawerProps) {
  const { isLoggedIn, profile, pmpBalance, signOut } = useStudyAuth();
  const { examDate, setExamDate } = useStudyCurriculum();
  const {
    theme,
    toggleTheme,
    largeFont,
    toggleLargeFont,
    dailyGoalMinutes,
    setDailyGoalMinutes,
  } = useGlobalUx();

  if (!open) return null;

  const goalHours = Math.round((dailyGoalMinutes / 60) * 10) / 10;

  return (
    <div
      className="fixed inset-0 z-[70] bg-[var(--hp-overlay)] backdrop-blur-sm flex justify-start"
      onClick={onClose}
    >
      <aside
        className="w-[84%] max-w-[330px] h-full bg-[var(--hp-bg)] border-r border-[var(--hp-border)] flex flex-col shadow-2xl pt-safe pb-safe overflow-y-auto text-[var(--hp-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-4 py-3.5 border-b border-[var(--hp-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">Housing-Pro</span>
            <span className="px-2 py-0.5 rounded-md bg-[var(--hp-surface)] border border-[var(--hp-border)] text-[11px] hp-tabular text-[var(--hp-text-2)]">
              {dDayLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--hp-surface)] flex items-center justify-center text-[var(--hp-text-2)]"
            aria-label="메뉴 닫기"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        <div className="p-4 space-y-5 flex-1">
          {/* 1. 수험생 <-> 현직 소장 Pro View 모드 전환 */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-[var(--hp-text-3)] px-0.5">
              워크스페이스
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
              <button
                type="button"
                onClick={() => onSwitchMode(false)}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  !isProShell
                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)]"
                    : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>수험생</span>
              </button>
              <button
                type="button"
                onClick={() => onSwitchMode(true)}
                className={`py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  isProShell
                    ? "bg-sky-600 text-white"
                    : "text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>소장 Pro</span>
              </button>
            </div>
          </div>

          {/* 2. PosMul 통합 계정 & 지갑 */}
          {isLoggedIn ? (
            <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)] shrink-0" />
                  <span className="text-sm font-medium truncate">{profile.displayName}</span>
                </div>
                <span className="text-xs hp-tabular font-medium text-[var(--hp-text)] shrink-0">
                  {pmpBalance.toLocaleString()} PMP
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://posmul.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2.5 rounded-lg border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-xs text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center justify-center gap-1 transition"
                >
                  <span>posmul.com</span>
                  <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    void signOut();
                  }}
                  className="py-1.5 px-2.5 rounded-lg border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-xs text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1 transition"
                >
                  <LogOut className="w-3 h-3 stroke-[1.5]" />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          ) : (
            <Link
              href={`/auth/login?next=${encodeURIComponent(pathname || "/")}`}
              onClick={onClose}
              className="w-full p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] flex items-center justify-between gap-2 hover:bg-[var(--hp-surface-2)] transition"
            >
              <div>
                <div className="text-sm font-medium">PosMul 계정 로그인</div>
                <div className="text-xs text-[var(--hp-text-2)] mt-0.5">
                  순공·회독·오답 기록 및 일일 300 PMP 동기화
                </div>
              </div>
              <LogIn className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)] shrink-0" />
            </Link>
          )}

          {/* 3. 수험 목표 설정 (D-Day & 일일 목표 시간) */}
          <div className="space-y-2.5 pt-1 border-t border-[var(--hp-border)]">
            <div className="text-[11px] font-medium text-[var(--hp-text-3)] px-0.5 pt-2">
              수험 설정
            </div>

            <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
              <span className="flex items-center gap-2 text-xs text-[var(--hp-text-2)]">
                <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>시험 D-Day</span>
              </span>
              <input
                type="date"
                value={examDate}
                onChange={(e) => {
                  if (e.target.value) setExamDate(e.target.value);
                }}
                className="bg-transparent text-xs hp-tabular text-[var(--hp-text)] outline-none text-right"
              />
            </label>

            <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
              <span className="text-xs text-[var(--hp-text-2)]">일일 목표 시간</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDailyGoalMinutes(dailyGoalMinutes - 30)}
                  className="w-6 h-6 rounded-md border border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                  aria-label="일일 목표 30분 감소"
                >
                  <Minus className="w-3 h-3 stroke-[1.5]" />
                </button>
                <span className="text-xs hp-tabular font-medium min-w-[44px] text-center">
                  {goalHours}h
                </span>
                <button
                  type="button"
                  onClick={() => setDailyGoalMinutes(dailyGoalMinutes + 30)}
                  className="w-6 h-6 rounded-md border border-[var(--hp-border)] flex items-center justify-center text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
                  aria-label="일일 목표 30분 증가"
                >
                  <Plus className="w-3 h-3 stroke-[1.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* 4. 관리 · 서재 메뉴 (AI 스캔 제외) */}
          <div className="space-y-1 pt-1 border-t border-[var(--hp-border)]">
            <div className="text-[11px] font-medium text-[var(--hp-text-3)] px-0.5 pt-2 mb-1">
              관리 및 자료
            </div>
            {[
              { href: "/study/more?tab=group", label: "스터디 그룹 관리", icon: Users },
              { href: "/study/more?tab=library", label: "내 교재 · 과목 설정", icon: Library },
              { href: "/study/books", label: "69단원 개념 · 이론서", icon: BookOpen },
              { href: "/study/more?tab=wallet", label: "PosMul 지갑 · 리워드", icon: Coins },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--hp-surface)] text-sm text-[var(--hp-text)] transition"
                >
                  <Icon className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* 5. 화면 표시 (테마 · 큰 글씨) */}
          <div className="space-y-2 pt-2 border-t border-[var(--hp-border)]">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between text-xs"
            >
              <span className="flex items-center gap-2 text-[var(--hp-text)]">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)]" />
                ) : (
                  <Sun className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)]" />
                )}
                <span>화면 테마</span>
              </span>
              <span className="text-[var(--hp-text-2)]">
                {theme === "dark" ? "오브시디언 다크" : "페이퍼 라이트"}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleLargeFont}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between text-xs"
            >
              <span className="flex items-center gap-2 text-[var(--hp-text)]">
                <Type className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)]" />
                <span>큰 글씨 모드 (112%)</span>
              </span>
              <span className="text-[var(--hp-text-2)]">{largeFont ? "켜짐" : "꺼짐"}</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
