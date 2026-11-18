"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  HelpCircle,
  Plus,
  Trash2,
} from "lucide-react";
import {
  CUSTOM_SUBJECT_COLOR_PALETTE,
  type StudySubjectNode,
} from "@/data/study-textbooks";
import type { CustomBookSubjectInput } from "@/lib/study-curriculum-store";

export type TocLevel = 0 | 1 | 2; // 0: 과목, 1: 대단원, 2: 단원

export interface TocDraftNode {
  id: string;
  level: TocLevel;
  title: string;
  estimatedMinutes?: number;
  sourceTopicId?: string;
  sourceSubjectId?: string;
  sourceUnitId?: string;
  color?: string;
}

const LEVEL_META: Record<
  TocLevel,
  {
    label: string;
    guide: string;
    placeholder: string;
    badgeClass: string;
    rowClass: string;
    indentClass: string;
  }
> = {
  0: {
    label: "과목",
    guide: "가장 큰 분류",
    placeholder: "과목명 (예: 주택관리관계법규)",
    badgeClass: "bg-[#FF5A36] text-white border-[#FF5A36]",
    rowClass: "bg-[#1D171A] border-[#FF5A36]/45",
    indentClass: "ml-0",
  },
  1: {
    label: "대단원",
    guide: "중간 챕터·생략가능",
    placeholder: "대단원명 (예: PART 01 주택법)",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-400/50",
    rowClass: "bg-[#141922] border-sky-500/35",
    indentClass: "ml-4",
  },
  2: {
    label: "단원",
    guide: "공부·타이머 체크 단위",
    placeholder: "단원명 (예: 01. 총칙 및 용어정의)",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/50",
    rowClass: "bg-[#12161B] border-white/[0.1]",
    indentClass: "ml-8",
  },
};

export function createDraftNode(
  level: TocLevel,
  title: string,
  extra?: Partial<TocDraftNode>
): TocDraftNode {
  return {
    id: `toc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level,
    title,
    estimatedMinutes: extra?.estimatedMinutes ?? 35,
    ...extra,
  };
}

/** 줄바꿈 텍스트를 초기 블록 목록으로 변환 */
export function parseRawLinesToDraftNodes(rawText: string): TocDraftNode[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    if (/^(?:#\s*|SUBJECT\s*\d+\s+|\[과목\]\s*)/i.test(line)) {
      return createDraftNode(
        0,
        line.replace(/^(?:#\s*|SUBJECT\s*\d+\s+|\[과목\]\s*)/i, "").trim()
      );
    }
    if (/^(?:##\s*|PART\s*\d+[:.\s]+|제\s*\d+\s*편\s+)/i.test(line)) {
      return createDraftNode(1, line.replace(/^##\s*/, "").trim());
    }
    return createDraftNode(
      2,
      line
        .replace(/^[-•*]\s*/, "")
        .replace(/^CHAPTER\s*\d+[:.\s]*/i, "")
        .trim()
    );
  });
}

/** 기존 StudySubjectNode 트리를 드래그&드롭 편집용 평탄 블록으로 변환 (원본 ID 보존) */
export function subjectsToDraftNodes(subjects: StudySubjectNode[]): TocDraftNode[] {
  const nodes: TocDraftNode[] = [];
  for (const subj of subjects) {
    nodes.push(
      createDraftNode(0, subj.title, {
        sourceSubjectId: subj.id,
        color: subj.color,
      })
    );
    for (const unit of subj.units) {
      nodes.push(
        createDraftNode(1, unit.title, {
          sourceUnitId: unit.id,
        })
      );
      for (const topic of unit.topics) {
        nodes.push(
          createDraftNode(2, topic.title, {
            sourceTopicId: topic.id,
            estimatedMinutes: topic.estimatedMinutes,
          })
        );
      }
    }
  }
  return nodes;
}

/** 드래그&드롭 블록 목록을 계층형 과목·대단원·단원 구조로 변환 (과목/대단원 생략 시 자동 보정) */
export function draftNodesToSubjectInputs(params: {
  nodes: TocDraftNode[];
  defaultSubjectTitle: string;
  defaultColor: string;
  category: string;
}): Array<
  CustomBookSubjectInput & {
    sourceSubjectId?: string;
    units: Array<{
      title: string;
      sourceUnitId?: string;
      topics: Array<{
        title: string;
        defaultKeyword?: string;
        estimatedMinutes?: number;
        sourceTopicId?: string;
      }>;
    }>;
  }
> {
  const { nodes, defaultSubjectTitle, defaultColor, category } = params;
  const cleanNodes = nodes.filter((n) => n.title.trim().length > 0);
  if (cleanNodes.length === 0) return [];

  const examStage: "1차" | "2차" = category.includes("1차") ? "1차" : "2차";

  type BuiltSubj = CustomBookSubjectInput & {
    sourceSubjectId?: string;
    units: Array<{
      title: string;
      sourceUnitId?: string;
      topics: Array<{
        title: string;
        defaultKeyword?: string;
        estimatedMinutes?: number;
        sourceTopicId?: string;
      }>;
    }>;
  };

  const result: BuiltSubj[] = [];
  let curSubj: BuiltSubj | null = null;
  let curUnit: BuiltSubj["units"][number] | null = null;

  const ensureSubj = (title?: string, color?: string, sourceSubjectId?: string) => {
    const subjTitle = (title || defaultSubjectTitle || "기본 과목").trim();
    curSubj = {
      title: subjTitle,
      color:
        color ||
        CUSTOM_SUBJECT_COLOR_PALETTE[result.length % CUSTOM_SUBJECT_COLOR_PALETTE.length] ||
        defaultColor,
      examStage,
      category,
      ...(sourceSubjectId ? { sourceSubjectId } : {}),
      units: [],
    };
    result.push(curSubj);
    curUnit = null;
    return curSubj;
  };

  const ensureUnit = (title?: string, sourceUnitId?: string) => {
    if (!curSubj) {
      ensureSubj(defaultSubjectTitle, defaultColor);
    }
    curUnit = {
      title: (title || "기본 목차").trim(),
      ...(sourceUnitId ? { sourceUnitId } : {}),
      topics: [],
    };
    curSubj!.units.push(curUnit);
    return curUnit;
  };

  for (const node of cleanNodes) {
    const cleanTitle = node.title.trim();
    if (node.level === 0) {
      ensureSubj(cleanTitle, node.color, node.sourceSubjectId);
    } else if (node.level === 1) {
      ensureUnit(cleanTitle, node.sourceUnitId);
    } else {
      if (!curUnit) {
        ensureUnit("기본 목차");
      }
      curUnit!.topics.push({
        title: cleanTitle,
        defaultKeyword: cleanTitle.slice(0, 6),
        estimatedMinutes: node.estimatedMinutes ?? 35,
        ...(node.sourceTopicId ? { sourceTopicId: node.sourceTopicId } : {}),
      });
    }
  }

  // 비어 있는 과목에도 기본 unit 하나 유지 (이후 단원 추가용)
  for (const subj of result) {
    if (subj.units.length === 0) {
      subj.units.push({ title: "기본 목차", topics: [] });
    }
  }

  return result;
}

interface TocDragBuilderProps {
  nodes: TocDraftNode[];
  onChange: (next: TocDraftNode[]) => void;
  defaultSubjectTitle?: string;
}

export function TocDragBuilder({
  nodes,
  onChange,
  defaultSubjectTitle = "기본 과목",
}: TocDragBuilderProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newLineTitle, setNewLineTitle] = useState("");
  const [newLineLevel, setNewLineLevel] = useState<TocLevel>(2);
  const [showGuideTip, setShowGuideTip] = useState<boolean>(true);

  const listRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    id: string;
    startX: number;
    startLevel: TocLevel;
  } | null>(null);
  const nodesRef = useRef<TocDraftNode[]>(nodes);
  nodesRef.current = nodes;

  const structureSummary = useMemo(() => {
    const built = draftNodesToSubjectInputs({
      nodes,
      defaultSubjectTitle,
      defaultColor: "#FF5A36",
      category: "주택관리사 2차",
    });
    const subjectCount = built.length;
    const unitCount = built.reduce((acc, s) => acc + s.units.length, 0);
    const topicCount = built.reduce(
      (acc, s) => acc + s.units.reduce((uAcc, u) => uAcc + u.topics.length, 0),
      0
    );
    return { subjectCount, unitCount, topicCount };
  }, [nodes, defaultSubjectTitle]);

  const setNodeLevel = (id: string, nextLevel: TocLevel) => {
    onChange(nodes.map((n) => (n.id === id ? { ...n, level: nextLevel } : n)));
  };

  const cycleNodeLevel = (id: string, current: TocLevel) => {
    const next = ((current + 1) % 3) as TocLevel;
    setNodeLevel(id, next);
  };

  const updateNodeTitle = (id: string, title: string) => {
    onChange(nodes.map((n) => (n.id === id ? { ...n, title } : n)));
  };

  const removeNode = (id: string) => {
    onChange(nodes.filter((n) => n.id !== id));
  };

  const handleAddSingleLine = () => {
    const clean = newLineTitle.trim();
    if (!clean) return;
    onChange([...nodes, createDraftNode(newLineLevel, clean)]);
    setNewLineTitle("");
  };

  const handleLoadSampleGuide = () => {
    onChange([
      createDraftNode(0, "1과목 (예: 주택관리관계법규)"),
      createDraftNode(1, "대단원 (예: PART 01 주택법)"),
      createDraftNode(2, "01. 총칙 및 용어정의"),
      createDraftNode(2, "02. 주택의 건설과 공급"),
    ]);
  };

  const handlePointerDownHandle = (
    e: React.PointerEvent<HTMLButtonElement>,
    node: TocDraftNode
  ) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      id: node.id,
      startX: e.clientX,
      startLevel: node.level,
    };
    setDraggingId(node.id);
  };

  const handlePointerMoveHandle = (e: React.PointerEvent<HTMLButtonElement>) => {
    const ds = dragStateRef.current;
    if (!ds) return;

    const currentNodes = [...nodesRef.current];
    const fromIdx = currentNodes.findIndex((n) => n.id === ds.id);
    if (fromIdx === -1) return;

    let changed = false;

    // 1. 가로(좌/우) 드래그로 계층(과목 0 <-> 대단원 1 <-> 단원 2) 변경
    const deltaX = e.clientX - ds.startX;
    const levelShift = Math.round(deltaX / 28);
    const targetLevel = Math.max(0, Math.min(2, ds.startLevel + levelShift)) as TocLevel;
    if (currentNodes[fromIdx].level !== targetLevel) {
      currentNodes[fromIdx] = { ...currentNodes[fromIdx], level: targetLevel };
      changed = true;
    }

    // 2. 세로(위/아래) 드래그로 목록 순서 실시간 재배치 + 자동 스크롤
    const container = listRef.current;
    if (container) {
      const cRect = container.getBoundingClientRect();
      if (e.clientY < cRect.top + 28) {
        container.scrollTop -= 12;
      } else if (e.clientY > cRect.bottom - 28) {
        container.scrollTop += 12;
      }

      const rowEls = Array.from(
        container.querySelectorAll<HTMLElement>("[data-toc-row-id]")
      );
      let targetIdx = fromIdx;
      for (let i = 0; i < rowEls.length; i += 1) {
        const el = rowEls[i];
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (i < fromIdx && e.clientY < midY) {
          targetIdx = i;
          break;
        }
        if (i > fromIdx && e.clientY > midY) {
          targetIdx = i;
        }
      }

      if (targetIdx !== fromIdx) {
        const [moved] = currentNodes.splice(fromIdx, 1);
        currentNodes.splice(targetIdx, 0, moved);
        changed = true;
      }
    }

    if (changed) {
      onChange(currentNodes);
    }
  };

  const handlePointerUpHandle = () => {
    dragStateRef.current = null;
    setDraggingId(null);
  };

  const draggingNode = draggingId ? nodes.find((n) => n.id === draggingId) : null;

  return (
    <div className="space-y-2.5">
      {/* 상단 드래그 & 계층 가이드 바 */}
      <div className="p-2.5 rounded-xl bg-[#111118] border border-white/[0.08] space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10.5px] font-black text-sky-300 flex items-center gap-1.5 min-w-0">
            <GripVertical className="w-3.5 h-3.5 text-[#FF7A59] shrink-0" />
            {draggingNode ? (
              <span className="truncate text-amber-300">
                이동 중: [{LEVEL_META[draggingNode.level].label}]{" "}
                {draggingNode.title || "(제목 없음)"} · 좌우로 단계 조절
              </span>
            ) : (
              <span className="truncate">드래그 &amp; 드롭 목차 구조 잡기</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowGuideTip((prev) => !prev)}
            className="text-[9.5px] font-bold text-slate-400 hover:text-white flex items-center gap-0.5 shrink-0"
          >
            <HelpCircle className="w-3 h-3" />
            <span>{showGuideTip ? "접기" : "사용법"}</span>
          </button>
        </div>

        {showGuideTip && (
          <div className="text-[10px] text-slate-300 leading-relaxed space-y-0.5 pt-0.5 border-t border-white/[0.06]">
            <div>
              • <strong className="text-white">≡ 위·아래 드래그</strong>: 순서 변경 &nbsp;|&nbsp;{" "}
              <strong className="text-white">≡ 좌·우 드래그(또는 배지 탭)</strong>:{" "}
              <span className="text-[#FF7A59] font-bold">과목</span>▸
              <span className="text-sky-300 font-bold">대단원</span>▸
              <span className="text-emerald-300 font-bold">단원</span> 전환
            </div>
            <div className="text-[9.5px] text-slate-400">
              ※ 구분이 애매하면 모두 <strong>[단원]</strong>으로 두셔도 자동으로 과목 아래로 묶입니다.
            </div>
          </div>
        )}
      </div>

      {/* 드래그 가능한 블록 리스트 */}
      {nodes.length === 0 ? (
        <div className="p-3.5 rounded-xl bg-[#0E0E13] border border-dashed border-white/[0.15] space-y-2">
          <div className="text-[10.5px] font-bold text-slate-400 text-center">
            아직 목차 블록이 없습니다. 아래에서 줄을 추가하거나 예시로 감을 잡아보세요.
          </div>
          {/* 희미한 가이드 미리보기 */}
          <div className="space-y-1 opacity-55 pointer-events-none select-none">
            <div className="px-2.5 py-1.5 rounded-lg border border-dashed border-[#FF5A36]/50 text-[10px] text-slate-300 flex items-center gap-1.5">
              <span className="px-1.5 py-0.2 rounded bg-[#FF5A36]/40 text-[9px] font-black text-white">
                과목
              </span>
              <span>예) 주택관리관계법규 (가장 큰 묶음)</span>
            </div>
            <div className="ml-4 px-2.5 py-1.5 rounded-lg border border-dashed border-sky-500/40 text-[10px] text-slate-300 flex items-center gap-1.5">
              <span className="px-1.5 py-0.2 rounded bg-sky-500/25 text-[9px] font-black text-sky-300">
                대단원
              </span>
              <span>예) PART 01 주택법 (생략 가능)</span>
            </div>
            <div className="ml-8 px-2.5 py-1.5 rounded-lg border border-dashed border-emerald-500/40 text-[10px] text-slate-300 flex items-center gap-1.5">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/25 text-[9px] font-black text-emerald-300">
                단원
              </span>
              <span>예) 01. 총칙 (실제 공부·타이머 단위)</span>
            </div>
          </div>
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={handleLoadSampleGuide}
              className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-bold text-slate-200 transition"
            >
              가이드 예시 채워서 체험하기
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={listRef}
          className="max-h-60 overflow-y-auto pr-0.5 space-y-1.5"
        >
          {nodes.map((node) => {
            const meta = LEVEL_META[node.level];
            const isDragging = draggingId === node.id;

            return (
              <div
                key={node.id}
                data-toc-row-id={node.id}
                className={`${meta.indentClass} transition-all duration-100`}
              >
                <div
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border transition ${
                    isDragging
                      ? "ring-2 ring-[#FF5A36] bg-[#241E22] border-[#FF5A36] scale-[1.01] shadow-lg"
                      : meta.rowClass
                  }`}
                >
                  {/* 모바일·PC 공용 드래그 핸들 (위아래 순서 + 좌우 레벨) */}
                  <button
                    type="button"
                    onPointerDown={(e) => handlePointerDownHandle(e, node)}
                    onPointerMove={handlePointerMoveHandle}
                    onPointerUp={handlePointerUpHandle}
                    onPointerCancel={handlePointerUpHandle}
                    className="p-1 -ml-0.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] touch-none cursor-grab active:cursor-grabbing shrink-0"
                    title="위아래로 끌어 순서 변경 · 좌우로 끌어 단계 변경"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>

                  {/* 레벨 배지 (탭하면 과목 -> 대단원 -> 단원 순환) */}
                  <button
                    type="button"
                    onClick={() => cycleNodeLevel(node.id, node.level)}
                    className={`px-1.5 py-0.5 rounded-md border text-[9px] font-black shrink-0 transition ${meta.badgeClass}`}
                    title={`${meta.label} (${meta.guide}) · 클릭 시 단계 전환`}
                  >
                    {meta.label}
                  </button>

                  {/* 제목 인라인 편집 + 가이드 placeholder */}
                  <input
                    type="text"
                    value={node.title}
                    onChange={(e) => updateNodeTitle(node.id, e.target.value)}
                    placeholder={meta.placeholder}
                    className="flex-1 min-w-0 bg-transparent text-[11px] font-bold text-white placeholder:text-slate-500 focus:outline-none"
                  />

                  {/* 단계 guide 텍스트 (좁은 화면에서는 숨김) */}
                  <span className="hidden sm:inline text-[9px] text-slate-500 shrink-0">
                    {meta.guide}
                  </span>

                  {/* 좌/우 들여쓰기 미세 조정 버튼 */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={node.level === 0}
                      onClick={() =>
                        setNodeLevel(node.id, Math.max(0, node.level - 1) as TocLevel)
                      }
                      className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.12] disabled:opacity-25 text-slate-300"
                      title="상위 단계로(←)"
                    >
                      <ArrowLeft className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      disabled={node.level === 2}
                      onClick={() =>
                        setNodeLevel(node.id, Math.min(2, node.level + 1) as TocLevel)
                      }
                      className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.12] disabled:opacity-25 text-slate-300"
                      title="하위 단계로(→)"
                    >
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNode(node.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400"
                      title="이 줄 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 새 블록 1줄 바로 추가 (모바일 친화적 3단 레벨 선택 + 입력) */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center gap-1">
          {([0, 1, 2] as TocLevel[]).map((lvl) => {
            const active = newLineLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setNewLineLevel(lvl)}
                className={`px-2 py-1 rounded-md border text-[10px] font-black transition ${
                  active
                    ? LEVEL_META[lvl].badgeClass
                    : "bg-[#0E0E12] border-white/[0.08] text-slate-400 hover:text-white"
                }`}
              >
                + {LEVEL_META[lvl].label}
              </button>
            );
          })}
          <span className="text-[9.5px] text-slate-500 pl-1 truncate">
            {LEVEL_META[newLineLevel].guide}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newLineTitle}
            onChange={(e) => setNewLineTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSingleLine();
              }
            }}
            placeholder={LEVEL_META[newLineLevel].placeholder}
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#0E0E12] border border-white/[0.1] text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5A36]"
          />
          <button
            type="button"
            onClick={handleAddSingleLine}
            disabled={!newLineTitle.trim()}
            className="px-3 py-1.5 rounded-lg bg-[#FF5A36] hover:bg-[#ff6d4d] disabled:opacity-40 text-[10.5px] font-black text-white shrink-0 flex items-center gap-1 transition"
          >
            <Plus className="w-3 h-3" />
            <span>추가</span>
          </button>
        </div>
      </div>

      {/* 실시간 자동 구조 계산 요약 */}
      {nodes.length > 0 && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/35 border border-emerald-500/25 text-[10px] font-bold">
          <span className="text-emerald-200">
            저장 구조 미리보기: {structureSummary.subjectCount}과목 ·{" "}
            {structureSummary.unitCount}대단원 · {structureSummary.topicCount}단원
          </span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-slate-400 hover:text-rose-300 text-[9.5px]"
          >
            전체 비우기
          </button>
        </div>
      )}
    </div>
  );
}
