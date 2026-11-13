"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Flame,
  LayoutGrid,
  CheckCircle2,
  Camera,
  Zap,
  ArrowRight,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { REAL_2026_CHAPTERS, type ExamChapterPlan } from "@/data/mock-exam-chapters";

// 열품타 하루 표준 24시간 (05시 ~ 익일 04시)
const YPT_HOURS = [
  5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4,
];

interface TimetableBlock {
  color: string;
  label: string;
}

// 초기 자동 기록된 학습 타임라인 색칠 생성기
function createInitialGrid(): Record<string, TimetableBlock> {
  const map: Record<string, TimetableBlock> = {};

  const fillRange = (hour: number, startSlot: number, endSlot: number, block: TimetableBlock) => {
    for (let s = startSlot; s <= endSlot; s++) {
      map[`${hour}-${s}`] = block;
    }
  };

  // 07:00~08:50 주택법 (주황)
  fillRange(7, 0, 5, { color: "#FF5A36", label: "주택법" });
  fillRange(8, 0, 4, { color: "#FF5A36", label: "주택법" });

  // 10:00~11:40 공동주택관리법 (하늘)
  fillRange(10, 0, 5, { color: "#38BDF8", label: "공동주택관리법" });
  fillRange(11, 0, 3, { color: "#38BDF8", label: "공동주택관리법" });

  // 14:00~16:10 관리실무 (초록)
  fillRange(14, 0, 5, { color: "#10B981", label: "관리실무" });
  fillRange(15, 0, 5, { color: "#10B981", label: "관리실무" });
  fillRange(16, 0, 0, { color: "#10B981", label: "관리실무" });

  // 20:00~22:30 오답 O/X 복습 (보라)
  fillRange(20, 0, 5, { color: "#A855F7", label: "O/X 오답복습" });
  fillRange(21, 0, 5, { color: "#A855F7", label: "O/X 오답복습" });
  fillRange(22, 0, 2, { color: "#A855F7", label: "O/X 오답복습" });

  return map;
}

export default function YptMobilePlannerPage() {
  const [activeTab, setActiveTab] = useState<"diary" | "heatmap" | "board">("diary");
  const [chapters, setChapters] = useState<ExamChapterPlan[]>(REAL_2026_CHAPTERS);
  const [timetableGrid, setTimetableGrid] = useState<Record<string, TimetableBlock>>(
    () => createInitialGrid()
  );
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{
    chapter: ExamChapterPlan;
    tier: number;
  } | null>(null);

  // 타임테이블 총 순공시간 계산 (1칸 = 10분)
  const totalMinutes = useMemo(() => {
    return Object.keys(timetableGrid).length * 10;
  }, [timetableGrid]);

  const totalHoursText = `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}H ${String(
    totalMinutes % 60
  ).padStart(2, "0")}M`;

  // 목표 6시간(360분) 대비 달성률
  const achievementPct = Math.round((totalMinutes / 360) * 100);

  // 전체 회독 진도율
  const overallProgressPct = useMemo(() => {
    const totalPossible = chapters.length * 5 * 100;
    const currentTotal = chapters.reduce((acc, c) => {
      return acc + c.tierProgress.reduce((tAcc, p) => tAcc + p, 0);
    }, 0);
    return Math.round((currentTotal / totalPossible) * 100);
  }, [chapters]);

  // 블록 이동
  const moveChapter = (
    id: string,
    targetBlock: "morning" | "afternoon1" | "afternoon2" | "unassigned"
  ) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, timeBlock: targetBlock } : c))
    );
  };

  // 미완료 단원 자동 이월 시뮬레이션
  const handleCarryOverUnfinished = () => {
    setChapters((prev) =>
      prev.map((c) => (c.timeBlock === "unassigned" ? { ...c, timeBlock: "morning" } : c))
    );
  };

  // 열품타 오렌지 5단계 농도 매핑 함수
  const getHeatmapTileStyle = (pct: number) => {
    if (pct >= 100) return "bg-[#FF5A36] text-white border-[#FF5A36] font-black shadow-md shadow-[#FF5A36]/25";
    if (pct >= 80) return "bg-[#FF5A36]/85 text-white border-[#FF5A36]/80 font-black";
    if (pct >= 60) return "bg-[#FF5A36]/60 text-white border-[#FF5A36]/60 font-bold";
    if (pct >= 35) return "bg-[#FF5A36]/35 text-orange-100 border-[#FF5A36]/40 font-bold";
    if (pct > 0) return "bg-[#FF5A36]/15 text-[#FF8A6B] border-[#FF5A36]/25 font-bold";
    return "bg-[#1A1A21] text-slate-600 border-white/[0.04]";
  };

  return (
    <MobileAppShell>
      {/* 상단 앱 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FF5A36]" />
            <h1 className="text-sm font-black text-white">
              열품타 자동 다이어리 · 플래너
            </h1>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#FF7A59]">
            2026.11.13 (금)
          </span>
        </div>

        {/* 상단 3탭 세그먼트 컨트롤 */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#0E0E12] border border-white/[0.06] text-[11px] font-black">
          <button
            type="button"
            onClick={() => setActiveTab("diary")}
            className={`py-2 rounded-xl transition ${
              activeTab === "diary"
                ? "bg-[#FF5A36] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📊 오늘 다이어리
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("heatmap")}
            className={`py-2 rounded-xl transition ${
              activeTab === "heatmap"
                ? "bg-[#FF5A36] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🔥 1~5회독 히트맵
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("board")}
            className={`py-2 rounded-xl transition ${
              activeTab === "board"
                ? "bg-[#FF5A36] text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🗂️ 타임블록 보드
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {activeTab === "diary" && (
          /* ========================================================== */
          /* 1. 오늘 다이어리 (열품타 10분 단위 24시간 색칠 타임테이블) */
          /* ========================================================== */
          <div className="space-y-4">
            {/* 요약 통계 3단 카드 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-[#1A1A21] border border-white/[0.06] text-center space-y-0.5">
                <div className="text-[10px] text-slate-400 font-bold">오늘 순공시간</div>
                <div className="font-mono text-sm font-black text-white">{totalHoursText}</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#1A1A21] border border-[#FF5A36]/30 text-center space-y-0.5">
                <div className="text-[10px] text-slate-400 font-bold">목표 달성률</div>
                <div className="font-mono text-sm font-black text-[#FF7A59]">
                  {achievementPct}%
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#1A1A21] border border-white/[0.06] text-center space-y-0.5">
                <div className="text-[10px] text-slate-400 font-bold">AI 스캔 기록</div>
                <div className="font-mono text-xs font-black text-amber-300 pt-0.5">
                  p.48 외 2건
                </div>
              </div>
            </div>

            {/* 자동 기록 학습 타임라인 요약 */}
            <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-white">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>무입력 자동 기록된 과목별 범례</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">1칸 = 10분</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[10.5px] font-bold">
                {[
                  { color: "#FF5A36", label: "주택법 (1h 50m)" },
                  { color: "#38BDF8", label: "공동주택관리법 (1h 40m)" },
                  { color: "#10B981", label: "관리실무 (2h 10m)" },
                  { color: "#A855F7", label: "O/X 오답복습 (2h 30m)" },
                ].map((legend) => (
                  <span
                    key={legend.label}
                    className="px-2 py-1 rounded-lg bg-[#121216] border border-white/[0.06] flex items-center gap-1.5 text-slate-200"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: legend.color }}
                    />
                    <span>{legend.label}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* ⏱️ 열품타 시그니처 24시간 × 6칸(10분 단위) 타임테이블 그리드 */}
            <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-2 shadow-xl">
              {/* 상단 열 헤더 (10m ~ 60m) */}
              <div className="grid grid-cols-[36px_1fr] gap-2 items-center text-[10px] font-mono font-bold text-slate-500 pb-1 border-b border-white/[0.06]">
                <div className="text-center">시</div>
                <div className="grid grid-cols-6 gap-1 text-center">
                  <span>10</span>
                  <span>20</span>
                  <span>30</span>
                  <span>40</span>
                  <span>50</span>
                  <span>60</span>
                </div>
              </div>

              {/* 24시간 행 렌더링 */}
              <div className="space-y-1">
                {YPT_HOURS.map((hour) => (
                  <div key={hour} className="grid grid-cols-[36px_1fr] gap-2 items-center">
                    <div className="font-mono text-[10.5px] font-bold text-slate-400 text-center">
                      {String(hour).padStart(2, "0")}
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {[0, 1, 2, 3, 4, 5].map((slot) => {
                        const key = `${hour}-${slot}`;
                        const cell = timetableGrid[key];
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              // 클릭 시 수동 체크 토글 가능
                              setTimetableGrid((prev) => {
                                const copy = { ...prev };
                                if (copy[key]) {
                                  delete copy[key];
                                } else {
                                  copy[key] = { color: "#FF5A36", label: "직접 추가" };
                                }
                                return copy;
                              });
                            }}
                            title={
                              cell
                                ? `${String(hour).padStart(2, "0")}:${slot * 10}~${(slot + 1) * 10} (${cell.label})`
                                : `${String(hour).padStart(2, "0")}:${slot * 10} 비어 있음 (탭하여 추가)`
                            }
                            className={`h-4 rounded-[3px] transition ${
                              cell
                                ? "opacity-95 hover:opacity-100 shadow-sm"
                                : "bg-[#111115] border border-white/[0.04] hover:border-white/[0.15]"
                            }`}
                            style={cell ? { backgroundColor: cell.color } : undefined}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "heatmap" && (
          /* ========================================================== */
          /* 2. 열품타 오렌지 5단계 농도 1~5회독 히트맵 (전체 조감도) */
          /* ========================================================== */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#FF5A36] fill-[#FF5A36]" />
                  <span>2026 제29회 48문항 회독 히트맵</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  타일을 터치하면 해당 단원·회독 O/X 복습 덱으로 직결됩니다
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-400 font-bold">종합 완주율</div>
                <div className="font-mono text-lg font-black text-[#FF5A36]">
                  {overallProgressPct}%
                </div>
              </div>
            </div>

            {/* 농도 범례 */}
            <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400 font-bold">
              <span>미학습</span>
              <span className="w-3.5 h-3.5 rounded bg-[#FF5A36]/15 border border-[#FF5A36]/25" />
              <span className="w-3.5 h-3.5 rounded bg-[#FF5A36]/35 border border-[#FF5A36]/40" />
              <span className="w-3.5 h-3.5 rounded bg-[#FF5A36]/60 border border-[#FF5A36]/60" />
              <span className="w-3.5 h-3.5 rounded bg-[#FF5A36]/85 border border-[#FF5A36]/80" />
              <span className="w-3.5 h-3.5 rounded bg-[#FF5A36] border border-[#FF5A36]" />
              <span className="text-white">100%</span>
            </div>

            {/* 6단원 x 1~5회독 (30칸 매트릭스) */}
            <div className="space-y-2.5">
              {chapters.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-white truncate">
                      {ch.title}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {ch.questionCount}문항
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {ch.tierProgress.map((pct, idx) => {
                      const tier = idx + 1;
                      const isSelected =
                        selectedHeatmapCell?.chapter.id === ch.id &&
                        selectedHeatmapCell?.tier === tier;

                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setSelectedHeatmapCell({ chapter: ch, tier })}
                          className={`py-2.5 rounded-xl border text-center transition ${getHeatmapTileStyle(
                            pct
                          )} ${isSelected ? "ring-2 ring-white" : ""}`}
                        >
                          <div className="text-[9.5px] opacity-85">{tier}회독</div>
                          <div className="text-xs font-mono">{pct}%</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 선택된 셀 상세 및 O/X 직결 */}
            {selectedHeatmapCell && (
              <div className="p-4 rounded-2xl bg-[#1D1615] border border-[#FF5A36]/50 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-white">
                    {selectedHeatmapCell.chapter.title} · {selectedHeatmapCell.tier}회독 (
                    {selectedHeatmapCell.tier * 20}%)
                  </span>
                  <span className="font-mono text-[#FF7A59] font-black">
                    달성률 {selectedHeatmapCell.chapter.tierProgress[selectedHeatmapCell.tier - 1]}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  핵심 테마: {selectedHeatmapCell.chapter.keyTopics.join(" · ")}
                </p>
                <Link
                  href="/study/ox"
                  className="w-full py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white font-black text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>이 회독 3초 컷 O/X 복습 바로 시작</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "board" && (
          /* ========================================================== */
          /* 3. 모바일 원터치 타임블록 보드 (오전 / 오후1 / 오후2) */
          /* ========================================================== */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1A21] border border-white/[0.06] text-xs">
              <span className="font-bold text-slate-300">
                오늘 할 단원을 타임블록에 배치하세요
              </span>
              <button
                type="button"
                onClick={handleCarryOverUnfinished}
                className="px-2.5 py-1 rounded-lg bg-[#FF5A36]/20 text-[#FF7A59] border border-[#FF5A36]/40 text-[11px] font-black flex items-center gap-1 hover:bg-[#FF5A36]/30 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>미완료 자동 이월</span>
              </button>
            </div>

            {(
              [
                { key: "morning", label: "🌅 오전 집중 (07:00~11:30)" },
                { key: "afternoon1", label: "☀️ 오후 1블록 (13:30~16:30)" },
                { key: "afternoon2", label: "🌆 오후 2블록 (19:00~22:00)" },
                { key: "unassigned", label: "📦 대기 단원 (미배치)" },
              ] as const
            ).map((block) => {
              const items = chapters.filter((c) => c.timeBlock === block.key);
              const totalQ = items.reduce((a, b) => a + b.questionCount, 0);
              const totalM = items.reduce((a, b) => a + b.estimatedMinutes, 0);

              return (
                <div
                  key={block.key}
                  className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-2">
                    <span className="font-black text-white">{block.label}</span>
                    <span className="font-mono text-[11px] text-[#FF7A59] font-bold">
                      {totalQ}문항 · 약 {totalM}분
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-2 text-center">
                      배치된 단원이 없습니다
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((ch) => (
                        <div
                          key={ch.id}
                          className="p-3 rounded-xl bg-[#121216] border border-white/[0.06] space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-white truncate">
                              {ch.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {ch.questionCount}문항 / {ch.estimatedMinutes}분
                            </span>
                          </div>

                          {/* 원터치 블록 이동 버튼 */}
                          <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                            {(
                              [
                                { id: "morning", name: "오전" },
                                { id: "afternoon1", name: "오후1" },
                                { id: "afternoon2", name: "오후2" },
                                { id: "unassigned", name: "보류" },
                              ] as const
                            ).map((target) => (
                              <button
                                key={target.id}
                                type="button"
                                onClick={() => moveChapter(ch.id, target.id)}
                                className={`py-1 rounded-lg transition ${
                                  ch.timeBlock === target.id
                                    ? "bg-[#FF5A36] text-white"
                                    : "bg-white/[0.05] text-slate-400 hover:text-white"
                                }`}
                              >
                                {target.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileAppShell>
  );
}
