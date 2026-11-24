"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Clock,
  FileCheck2,
  Play,
  Plus,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useGlobalUx } from "@/components/mobile/global-ux-provider";
import { getMutedSubjectColor } from "@/lib/study-theme";

interface StudyFabSheetProps {
  open: boolean;
  pathname: string;
  onClose: () => void;
  onToast: (message: string) => void;
}

export function StudyFabSheet({ open, pathname, onClose, onToast }: StudyFabSheetProps) {
  const router = useRouter();
  const { subjects, todayISO, addTodo } = useStudyCurriculum();
  const { quickTimer, startQuickTimer, openTimerOverlay, openSpotlight } = useGlobalUx();

  const [todoDraft, setTodoDraft] = useState("");
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0);

  if (!open) return null;

  const activeSubject = subjects[selectedSubjectIdx] || subjects[0];
  const activeColor = activeSubject
    ? getMutedSubjectColor(activeSubject.title, activeSubject.color, selectedSubjectIdx)
    : "#4F7CAC";

  const handleAddQuickTodo = () => {
    const clean = todoDraft.trim();
    if (!clean) return;
    addTodo({
      title: clean,
      subjectId: activeSubject?.id,
      subjectTitle: activeSubject?.shortTitle || activeSubject?.title || "일반",
      subjectColor: activeColor,
      dueDate: todayISO,
    });
    setTodoDraft("");
    onClose();
    onToast("오늘 플래너와 타이머 목록에 추가했습니다.");
  };

  // 현재 탭에 맞춘 최우선 추천 액션 1개 (AI 스캔 제외)
  const getContextPrimaryAction = () => {
    if (pathname.startsWith("/study/planner")) {
      return {
        label: "오늘 계획 바로 타이머 시작",
        sub: "실행 즉시 스터디 그룹방으로 연결",
        icon: Play,
        run: () => {
          onClose();
          if (quickTimer.active) {
            openTimerOverlay();
          } else {
            startQuickTimer({
              id: activeSubject?.id || "quick-study",
              subjectId: activeSubject?.id,
              title: `${activeSubject?.shortTitle || activeSubject?.title || "학습"} 집중 학습`,
              subjectTitle: activeSubject?.shortTitle || activeSubject?.title || "학습",
              subjectColor: activeColor,
            });
          }
        },
      };
    }
    if (pathname.startsWith("/study/stats")) {
      return {
        label: "약점 선지 3초 O/X 복습",
        sub: "별표·오답 선지 바로 훑기",
        icon: RotateCw,
        run: () => {
          onClose();
          router.push("/study/ox?mode=weak");
        },
      };
    }
    if (pathname.startsWith("/study/solve")) {
      return {
        label: "1초 개념 · 기출 검색",
        sub: "키워드로 조문·기출 지문 즉시 확인",
        icon: Search,
        run: () => {
          onClose();
          openSpotlight();
        },
      };
    }
    if (pathname.startsWith("/study/ox")) {
      return {
        label: "20제 실전 기출 풀기",
        sub: "단원별 · 회차별 고속 풀이",
        icon: FileCheck2,
        run: () => {
          onClose();
          router.push("/study/solve");
        },
      };
    }
    return {
      label: quickTimer.active ? "실행 중인 그룹 타이머 열기" : "그룹 타이머 바로 시작",
      sub: "실행 즉시 스터디 그룹 좌석 화면 노출",
      icon: Clock,
      run: () => {
        onClose();
        if (quickTimer.active) {
          openTimerOverlay();
        } else {
          const firstTopic = activeSubject?.units[0]?.topics[0];
          startQuickTimer({
            id: firstTopic?.id || "quick-study",
            title: firstTopic?.title || activeSubject?.title || "집중 학습",
            subjectTitle: activeSubject?.shortTitle || activeSubject?.title || "학습",
            subjectColor: activeColor,
          });
        }
      },
    };
  };

  const primary = getContextPrimaryAction();
  const PrimaryIcon = primary.icon;

  return (
    <div
      className="fixed inset-0 z-[70] bg-[var(--hp-overlay)] backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] rounded-t-2xl bg-[var(--hp-bg)] border-t border-x border-[var(--hp-border-strong)] p-4 pb-safe space-y-4 shadow-2xl text-[var(--hp-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">빠른 기록 · 실행</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--hp-surface)] flex items-center justify-center text-[var(--hp-text-2)]"
            aria-label="닫기"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* 1. 3초 할 일 1줄 즉시 입력 (어느 탭에서든 오늘 플래너에 등록) */}
        <div className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {subjects.slice(0, 6).map((subj, idx) => {
              const color = getMutedSubjectColor(subj.title, subj.color, idx);
              const selected = idx === selectedSubjectIdx;
              return (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => setSelectedSubjectIdx(idx)}
                  className={`px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1.5 whitespace-nowrap border transition ${
                    selected
                      ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                      : "border-transparent text-[var(--hp-text-2)]"
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span>{subj.shortTitle || subj.title}</span>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddQuickTodo();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={todoDraft}
              onChange={(e) => setTodoDraft(e.target.value)}
              placeholder="오늘 할 일 1줄 입력 후 Enter..."
              className="flex-1 h-9 px-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)] focus:border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
            />
            <button
              type="submit"
              disabled={!todoDraft.trim()}
              className="h-9 px-3 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium disabled:opacity-40 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2]" />
              <span>추가</span>
            </button>
          </form>
        </div>

        {/* 2. 현재 탭 최우선 액션 */}
        <button
          type="button"
          onClick={primary.run}
          className="w-full p-3.5 rounded-xl bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-left flex items-center gap-3 hover:opacity-92 transition"
        >
          <PrimaryIcon className="w-4 h-4 stroke-[1.75] shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-semibold">{primary.label}</div>
            <div className="text-xs opacity-70 mt-0.5">{primary.sub}</div>
          </div>
        </button>

        {/* 3. 어디서든 즉시 실행 3종 */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (quickTimer.active) {
                openTimerOverlay();
              } else {
                const firstTopic = activeSubject?.units[0]?.topics[0];
                startQuickTimer({
                  id: firstTopic?.id || "quick-study",
                  title: firstTopic?.title || activeSubject?.title || "집중 학습",
                  subjectTitle: activeSubject?.shortTitle || activeSubject?.title || "학습",
                  subjectColor: activeColor,
                });
              }
            }}
            className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-left space-y-1.5 transition"
          >
            <Clock className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)]" />
            <div className="text-xs font-medium">그룹 타이머</div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              openSpotlight();
            }}
            className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-left space-y-1.5 transition"
          >
            <Search className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)]" />
            <div className="text-xs font-medium">1초 검색</div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/study/planner");
            }}
            className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-left space-y-1.5 transition"
          >
            <CheckSquare className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)]" />
            <div className="text-xs font-medium">10분 플래너</div>
          </button>
        </div>
      </div>
    </div>
  );
}
