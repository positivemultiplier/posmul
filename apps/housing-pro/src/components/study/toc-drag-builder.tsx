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
  DEFAULT_BASE_SUBJECT_COLOR,
  estimateMinutesFromPages,
  getDistinctSubjectColor,
  type StudySubjectNode,
} from "@/data/study-textbooks";
import type { CustomBookSubjectInput } from "@/lib/study-curriculum-store";

export type TocLevel = 0 | 1 | 2 | 3; // 0: 과목, 1: 편/대단원, 2: 장/중단원, 3: 절/세부단원
export type CheckpointDepthMode = "auto" | 1 | 2 | 3;

export interface TocDraftNode {
  id: string;
  level: TocLevel;
  title: string;
  estimatedMinutes?: number;
  pageStart?: number;
  pageEnd?: number;
  sourceTopicId?: string;
  sourceSubjectId?: string;
  sourceUnitId?: string;
  color?: string;
}

const LEVEL_META: Record<
  TocLevel,
  {
    label: string;
    shortLabel: string;
    placeholder: string;
    badgeClass: string;
    rowClass: string;
    indentClass: string;
  }
> = {
  0: {
    label: "과목",
    shortLabel: "과목",
    placeholder: "과목명 (예: 주택관리관계법규)",
    badgeClass: "bg-[#FF5A36] text-white border-[#FF5A36]",
    rowClass: "bg-[#1D171A] border-[#FF5A36]/45",
    indentClass: "ml-0",
  },
  1: {
    label: "편·대단원",
    shortLabel: "편",
    placeholder: "편/대단원 (예: 제1편 주택법)",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-400/50",
    rowClass: "bg-[#141922] border-sky-500/35",
    indentClass: "ml-2.5",
  },
  2: {
    label: "장·중단원",
    shortLabel: "장",
    placeholder: "장/중단원 (예: 제1장 총칙)",
    badgeClass: "bg-violet-500/20 text-violet-300 border-violet-400/50",
    rowClass: "bg-[#161522] border-violet-500/35",
    indentClass: "ml-5",
  },
  3: {
    label: "절·단원",
    shortLabel: "단원",
    placeholder: "세부 단원 (예: 01. 용어의 정의)",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/50",
    rowClass: "bg-[#12161B] border-white/[0.1]",
    indentClass: "ml-7",
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

/** 줄 끝 페이지 번호 분리 (예: "01. 총칙 ... 24", "제1장 p.14") */
function splitTrailingPage(raw: string): { title: string; pageStart?: number } {
  const trimmed = raw.trim();
  const m1 = trimmed.match(
    /^(.*?)(?:[\s·.…\-–—]+|\s*[\(\[])?(?:p\.?\s*(\d{1,4})|(\d{1,4})\s*(?:p|쪽|페이지))[\)\]]?\s*$/i
  );
  if (m1) {
    const num = Number(m1[2] || m1[3]);
    const clean = m1[1].replace(/[\s·.…\-–—]+$/, "").trim();
    if (clean.length >= 1 && num > 0 && num <= 3000) {
      return { title: clean, pageStart: num };
    }
  }
  const m2 = trimmed.match(/^(.*?)(?:\.{2,}|…+|\s{2,}|\t+)(\d{1,4})\s*$/);
  if (m2) {
    const num = Number(m2[2]);
    const clean = m2[1].replace(/[\s·.…\-–—]+$/, "").trim();
    if (clean.length >= 2 && num > 0 && num <= 3000) {
      return { title: clean, pageStart: num };
    }
  }
  return { title: trimmed };
}

/** 줄바꿈 텍스트를 4단계 블록 목록(+ 페이지 자동 추출)으로 변환 */
export function parseRawLinesToDraftNodes(rawText: string): TocDraftNode[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, "  ").trimEnd())
    .filter((l) => l.trim().length > 0);

  let hasPart = false;
  let hasChapter = false;

  return lines.map((rawLine) => {
    const leading = rawLine.length - rawLine.trimStart().length;
    const { title: withoutPage, pageStart } = splitTrailingPage(rawLine.trim());

    if (/^(?:#\s*|SUBJECT\s*\d+\s+|\[과목\]\s*)/i.test(withoutPage)) {
      return createDraftNode(
        0,
        withoutPage.replace(/^(?:#\s*|SUBJECT\s*\d+\s+|\[과목\]\s*)/i, "").trim(),
        { pageStart }
      );
    }
    if (/^(?:##\s*|PART\s*\d+[:.\s]+|제\s*\d+\s*편\b|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]\.\s+)/i.test(withoutPage)) {
      hasPart = true;
      return createDraftNode(1, withoutPage.replace(/^##\s*/, "").trim(), { pageStart });
    }
    if (/^(?:###\s*|CHAPTER\s*\d+[:.\s]+|제\s*\d+\s*장\b)/i.test(withoutPage)) {
      hasChapter = true;
      return createDraftNode(2, withoutPage.replace(/^###\s*/, "").trim(), { pageStart });
    }

    const clean = withoutPage.replace(/^[-•*]\s*/, "").trim();
    const level: TocLevel =
      leading >= 4 || (hasPart && hasChapter) || /^제\s*\d+\s*절\b/.test(clean)
        ? 3
        : hasPart || hasChapter
          ? 2
          : 2;
    return createDraftNode(level, clean, { pageStart });
  });
}

/** 기존 StudySubjectNode 트리를 편집용 평탄 블록으로 변환 (원본 ID·경로·페이지 보존) */
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
      if (unit.title && unit.title !== "기본 목차") {
        nodes.push(
          createDraftNode(1, unit.title, {
            sourceUnitId: unit.id,
          })
        );
      }
      let lastChapterLabel = "";
      for (const topic of unit.topics) {
        const chapterHint =
          topic.hierarchyPath && topic.hierarchyPath.length >= 2
            ? topic.hierarchyPath[1]
            : "";
        if (chapterHint && chapterHint !== lastChapterLabel) {
          nodes.push(createDraftNode(2, chapterHint));
          lastChapterLabel = chapterHint;
        }
        const topicLevel: TocLevel = chapterHint ? 3 : 2;
        nodes.push(
          createDraftNode(topicLevel, topic.title, {
            sourceTopicId: topic.id,
            estimatedMinutes: topic.estimatedMinutes,
            pageStart: topic.pageStart,
            pageEnd: topic.pageEnd,
          })
        );
        // 접혀있던 하위 메모(subItems)도 편집 시 그대로 복원 가능
        if (topic.subItems && topic.subItems.length > 0 && topicLevel < 3) {
          for (const sub of topic.subItems) {
            nodes.push(createDraftNode(3, sub));
          }
        }
      }
    }
  }
  return nodes;
}

/**
 * 4단계(0~3) 가변 Depth 블록 목록을 체크 단위 기준(checkpointDepth)에 맞춰
 * 엑셀 시트용 CustomBookSubjectInput으로 무손실 변환
 * - 상위 계층은 hierarchyPath 브레드크럼으로 보존
 * - 체크 단위보다 깊은 하위 항목은 subItems 메모로 보존
 * - 인접한 pageStart로 pageEnd & estimatedMinutes 자동 산출
 */
export function draftNodesToSubjectInputs(params: {
  nodes: TocDraftNode[];
  defaultSubjectTitle: string;
  defaultColor: string;
  category: string;
  checkpointDepth?: CheckpointDepthMode;
}): CustomBookSubjectInput[] {
  const {
    nodes,
    defaultSubjectTitle,
    defaultColor,
    category,
    checkpointDepth = "auto",
  } = params;
  const cleanNodes = nodes.filter((n) => n.title.trim().length > 0);
  if (cleanNodes.length === 0) return [];

  // 페이지 끝 번호 자동 보간 (현재 노드에 pageStart가 있고 pageEnd가 없으면 다음 유효 pageStart - 1)
  const withPages = cleanNodes.map((n) => ({ ...n }));
  for (let i = 0; i < withPages.length; i += 1) {
    const cur = withPages[i];
    if (typeof cur.pageStart === "number" && typeof cur.pageEnd !== "number") {
      for (let j = i + 1; j < withPages.length; j += 1) {
        const nextP = withPages[j].pageStart;
        if (typeof nextP === "number" && nextP >= cur.pageStart) {
          cur.pageEnd = Math.max(cur.pageStart, nextP - 1);
          break;
        }
      }
    }
  }

  const examStage: "1차" | "2차" = category.includes("1차") ? "1차" : "2차";
  const result: CustomBookSubjectInput[] = [];
  let curSubj: CustomBookSubjectInput | null = null;
  let curUnit: CustomBookSubjectInput["units"][number] | null = null;
  let curPartTitle = "";
  let curChapterTitle = "";
  let lastCheckpointTopic: CustomBookSubjectInput["units"][number]["topics"][number] | null =
    null;

  const ensureSubj = (title?: string, color?: string, sourceSubjectId?: string) => {
    const subjTitle = (title || defaultSubjectTitle || "기본 과목").trim();
    const resolvedColor =
      color ||
      (subjTitle === "기본 과목" || subjTitle === "기본과목"
        ? DEFAULT_BASE_SUBJECT_COLOR
        : getDistinctSubjectColor(result.length, subjTitle) ||
          CUSTOM_SUBJECT_COLOR_PALETTE[result.length % CUSTOM_SUBJECT_COLOR_PALETTE.length] ||
          defaultColor);
    curSubj = {
      title: subjTitle,
      color: resolvedColor,
      examStage,
      category,
      ...(sourceSubjectId ? { sourceSubjectId } : {}),
      units: [],
    };
    result.push(curSubj);
    curUnit = null;
    curPartTitle = "";
    curChapterTitle = "";
    lastCheckpointTopic = null;
    return curSubj;
  };

  const ensureUnit = (title?: string, sourceUnitId?: string) => {
    if (!curSubj) ensureSubj(defaultSubjectTitle, defaultColor);
    curUnit = {
      title: (title || "기본 목차").trim(),
      ...(sourceUnitId ? { sourceUnitId } : {}),
      topics: [],
    };
    curSubj!.units.push(curUnit);
    return curUnit;
  };

  for (let i = 0; i < withPages.length; i += 1) {
    const node = withPages[i];
    const nextNode = withPages[i + 1];
    const cleanTitle = node.title.trim();

    if (node.level === 0) {
      ensureSubj(cleanTitle, node.color, node.sourceSubjectId);
      continue;
    }

    // 체크 단위보다 깊은 노드는 직전 체크포인트의 subItems 메모로 접어서 보존!
    if (
      checkpointDepth !== "auto" &&
      node.level > checkpointDepth &&
      lastCheckpointTopic
    ) {
      if (!lastCheckpointTopic.subItems) lastCheckpointTopic.subItems = [];
      lastCheckpointTopic.subItems.push(cleanTitle);
      // 하위 노드에 더 큰 끝 페이지가 있으면 상위 체크포인트 끝 페이지도 확장
      if (
        typeof node.pageEnd === "number" &&
        (typeof lastCheckpointTopic.pageEnd !== "number" ||
          node.pageEnd > lastCheckpointTopic.pageEnd)
      ) {
        lastCheckpointTopic.pageEnd = node.pageEnd;
        if (typeof lastCheckpointTopic.pageStart === "number") {
          const pages = lastCheckpointTopic.pageEnd - lastCheckpointTopic.pageStart + 1;
          lastCheckpointTopic.estimatedMinutes = estimateMinutesFromPages(pages);
        }
      }
      continue;
    }

    const hasDeeperChild = Boolean(nextNode && nextNode.level > node.level);
    const isForcedCheckpoint =
      checkpointDepth !== "auto" && node.level === checkpointDepth;

    // 그룹(폴더) 노드 판별
    if (!isForcedCheckpoint && node.level === 1 && hasDeeperChild) {
      curPartTitle = cleanTitle;
      curChapterTitle = "";
      ensureUnit(cleanTitle, node.sourceUnitId);
      lastCheckpointTopic = null;
      continue;
    }
    if (!isForcedCheckpoint && node.level === 2 && hasDeeperChild) {
      curChapterTitle = cleanTitle;
      if (!curUnit) ensureUnit(curPartTitle || "기본 목차");
      lastCheckpointTopic = null;
      continue;
    }

    // 체크포인트(Leaf) 노드 생성
    if (!curUnit) ensureUnit(curPartTitle || "기본 목차");
    const hierarchyPath: string[] = [];
    if (curPartTitle && curPartTitle !== "기본 목차" && node.level >= 2) {
      hierarchyPath.push(curPartTitle);
    }
    if (curChapterTitle && node.level >= 3) {
      hierarchyPath.push(curChapterTitle);
    }

    const pageCount =
      typeof node.pageStart === "number" &&
      typeof node.pageEnd === "number" &&
      node.pageEnd >= node.pageStart
        ? node.pageEnd - node.pageStart + 1
        : 0;
    const estMinutes =
      pageCount > 0 ? estimateMinutesFromPages(pageCount) : node.estimatedMinutes ?? 35;

    const topicEntry: CustomBookSubjectInput["units"][number]["topics"][number] = {
      title: cleanTitle,
      defaultKeyword: cleanTitle.slice(0, 6),
      estimatedMinutes: estMinutes,
      ...(node.sourceTopicId ? { sourceTopicId: node.sourceTopicId } : {}),
      ...(hierarchyPath.length > 0 ? { hierarchyPath } : {}),
      ...(typeof node.pageStart === "number" ? { pageStart: node.pageStart } : {}),
      ...(typeof node.pageEnd === "number" ? { pageEnd: node.pageEnd } : {}),
    };
    curUnit!.topics.push(topicEntry);
    lastCheckpointTopic = topicEntry;
  }

  // 비어있는 과목에도 기본 unit 유지
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
  checkpointDepth?: CheckpointDepthMode;
  onCheckpointDepthChange?: (next: CheckpointDepthMode) => void;
}

export function TocDragBuilder({
  nodes,
  onChange,
  defaultSubjectTitle = "기본 과목",
  checkpointDepth = "auto",
  onCheckpointDepthChange,
}: TocDragBuilderProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newLineTitle, setNewLineTitle] = useState("");
  const [newLineLevel, setNewLineLevel] = useState<TocLevel>(2);
  const [showGuideTip, setShowGuideTip] = useState<boolean>(false);

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
      checkpointDepth,
    });
    const subjectCount = built.length;
    let topicCount = 0;
    let totalPages = 0;
    let totalMinutes = 0;
    for (const s of built) {
      for (const u of s.units) {
        for (const t of u.topics) {
          topicCount += 1;
          totalMinutes += t.estimatedMinutes ?? 35;
          if (
            typeof t.pageStart === "number" &&
            typeof t.pageEnd === "number" &&
            t.pageEnd >= t.pageStart
          ) {
            totalPages += t.pageEnd - t.pageStart + 1;
          }
        }
      }
    }
    return { subjectCount, topicCount, totalPages, totalMinutes };
  }, [nodes, defaultSubjectTitle, checkpointDepth]);

  const setNodeLevel = (id: string, nextLevel: TocLevel) => {
    onChange(nodes.map((n) => (n.id === id ? { ...n, level: nextLevel } : n)));
  };

  const cycleNodeLevel = (id: string, current: TocLevel) => {
    const next = ((current + 1) % 4) as TocLevel;
    setNodeLevel(id, next);
  };

  const updateNodeTitle = (id: string, title: string) => {
    onChange(nodes.map((n) => (n.id === id ? { ...n, title } : n)));
  };

  const updateNodePageStart = (id: string, rawVal: string) => {
    const num = Number(rawVal);
    onChange(
      nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              pageStart: Number.isFinite(num) && num > 0 ? Math.round(num) : undefined,
            }
          : n
      )
    );
  };

  const removeNode = (id: string) => {
    onChange(nodes.filter((n) => n.id !== id));
  };

  const handleAddSingleLine = () => {
    const { title: clean, pageStart } = splitTrailingPage(newLineTitle);
    if (!clean) return;
    onChange([...nodes, createDraftNode(newLineLevel, clean, { pageStart })]);
    setNewLineTitle("");
  };

  const handleLoadSampleGuide = () => {
    onChange([
      createDraftNode(0, "주택관리관계법규"),
      createDraftNode(1, "제1편 주택법", { pageStart: 12 }),
      createDraftNode(2, "제1장 총칙", { pageStart: 14 }),
      createDraftNode(3, "01. 용어의 정의", { pageStart: 14 }),
      createDraftNode(3, "02. 주택의 건설", { pageStart: 28 }),
      createDraftNode(2, "제2장 주택의 공급", { pageStart: 46 }),
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

    // 1. 가로(좌/우) 드래그로 4단계(0~3) 깊이 조절
    const deltaX = e.clientX - ds.startX;
    const levelShift = Math.round(deltaX / 24);
    const targetLevel = Math.max(0, Math.min(3, ds.startLevel + levelShift)) as TocLevel;
    if (currentNodes[fromIdx].level !== targetLevel) {
      currentNodes[fromIdx] = { ...currentNodes[fromIdx], level: targetLevel };
      changed = true;
    }

    // 2. 세로(위/아래) 드래그로 순서 재배치
    const container = listRef.current;
    if (container) {
      const cRect = container.getBoundingClientRect();
      if (e.clientY < cRect.top + 28) container.scrollTop -= 12;
      else if (e.clientY > cRect.bottom - 28) container.scrollTop += 12;

      const rowEls = Array.from(
        container.querySelectorAll<HTMLElement>("[data-toc-row-id]")
      );
      let targetIdx = fromIdx;
      for (let i = 0; i < rowEls.length; i += 1) {
        const rect = rowEls[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (i < fromIdx && e.clientY < midY) {
          targetIdx = i;
          break;
        }
        if (i > fromIdx && e.clientY > midY) targetIdx = i;
      }

      if (targetIdx !== fromIdx) {
        const [moved] = currentNodes.splice(fromIdx, 1);
        currentNodes.splice(targetIdx, 0, moved);
        changed = true;
      }
    }

    if (changed) onChange(currentNodes);
  };

  const handlePointerUpHandle = () => {
    dragStateRef.current = null;
    setDraggingId(null);
  };

  const draggingNode = draggingId ? nodes.find((n) => n.id === draggingId) : null;

  return (
    <div className="space-y-2.5">
      {/* ★ 체크 단위 일괄 스위치 (모바일 1줄 압축 UI) */}
      <div className="p-2.5 rounded-xl bg-[#111118] border border-white/[0.08] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10.5px] font-black text-sky-300 flex items-center gap-1.5 min-w-0">
            <GripVertical className="w-3.5 h-3.5 text-[#FF7A59] shrink-0" />
            {draggingNode ? (
              <span className="truncate text-amber-300">
                이동: [{LEVEL_META[draggingNode.level].shortLabel}]{" "}
                {draggingNode.title || "(제목 없음)"}
              </span>
            ) : (
              <span className="truncate">체크(회독) 기준 단위 선택</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowGuideTip((prev) => !prev)}
            className="text-[9.5px] font-bold text-slate-400 hover:text-white flex items-center gap-0.5 shrink-0"
          >
            <HelpCircle className="w-3 h-3" />
            <span>사용법</span>
          </button>
        </div>

        {/* 체크 단위 일괄 스위치 */}
        {onCheckpointDepthChange && (
          <div className="grid grid-cols-4 gap-1 text-[10px] font-black">
            {(
              [
                { id: "auto" as const, label: "자동(말단)" },
                { id: 1 as const, label: "편 단위" },
                { id: 2 as const, label: "장 단위 ★" },
                { id: 3 as const, label: "절 전체" },
              ] as const
            ).map((opt) => (
              <button
                key={String(opt.id)}
                type="button"
                onClick={() => onCheckpointDepthChange(opt.id)}
                className={`py-1.5 px-1 rounded-lg border transition truncate ${
                  checkpointDepth === opt.id
                    ? "bg-[#FF5A36] border-[#FF5A36] text-white shadow"
                    : "bg-[#181822] border-white/[0.08] text-slate-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* 실시간 요약 칩 */}
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 pt-0.5">
          <span>
            시트 행{" "}
            <strong className="text-emerald-300 font-mono">
              {structureSummary.topicCount}개
            </strong>{" "}
            ({structureSummary.subjectCount}과목)
          </span>
          <span className="font-mono text-slate-400">
            {structureSummary.totalPages > 0 ? `${structureSummary.totalPages}p · ` : ""}
            약 {(structureSummary.totalMinutes / 60).toFixed(1)}h
          </span>
        </div>

        {showGuideTip && (
          <div className="p-2 rounded-lg bg-[#0A0A0F] border border-white/[0.06] text-[10px] text-slate-300 leading-relaxed space-y-1">
            <p>
              • 책마다 목차 깊이(1~4단)가 달라도 <strong>체크 기준 단위</strong>를 누르면
              원하는 굵기로 자동 압축됩니다. (하위 항목은 메모로 안전 보관)
            </p>
            <p>
              • 각 줄의 <strong className="text-amber-300">p.숫자</strong>에 시작 페이지를 넣으면
              분량과 예상 공부시간이 자동 계산됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 4단계 드래그 리스트 */}
      <div
        ref={listRef}
        className="max-h-[265px] overflow-y-auto pr-0.5 space-y-1.5 rounded-xl"
      >
        {nodes.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#13131A] border border-dashed border-white/[0.12] text-center space-y-2">
            <p className="text-[11px] font-bold text-slate-400">
              목차 사진 스캔 · 붙여넣기 또는 아래에서 바로 줄을 추가해 보세요.
            </p>
            <button
              type="button"
              onClick={handleLoadSampleGuide}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10.5px] font-black text-sky-300"
            >
              4단계 예시 불러오기
            </button>
          </div>
        ) : (
          nodes.map((node) => {
            const meta = LEVEL_META[node.level];
            const isDragging = draggingId === node.id;
            const isFoldedBySwitch =
              checkpointDepth !== "auto" && node.level > checkpointDepth;

            return (
              <div
                key={node.id}
                data-toc-row-id={node.id}
                className={`${meta.indentClass} p-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                  meta.rowClass
                } ${isDragging ? "ring-2 ring-[#FF5A36] opacity-90" : ""} ${
                  isFoldedBySwitch ? "opacity-45 border-dashed" : ""
                }`}
              >
                <button
                  type="button"
                  onPointerDown={(e) => handlePointerDownHandle(e, node)}
                  onPointerMove={handlePointerMoveHandle}
                  onPointerUp={handlePointerUpHandle}
                  onPointerCancel={handlePointerUpHandle}
                  className="p-1 rounded text-slate-400 hover:text-white touch-none cursor-grab active:cursor-grabbing shrink-0"
                  title="드래그: 상하 순서 / 좌우 깊이"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => cycleNodeLevel(node.id, node.level)}
                  className={`px-1.5 py-0.5 rounded border text-[9px] font-black shrink-0 ${meta.badgeClass}`}
                  title="탭하여 계층 전환 (과목 → 편 → 장 → 단원)"
                >
                  {isFoldedBySwitch ? "메모" : meta.shortLabel}
                </button>

                <input
                  type="text"
                  value={node.title}
                  onChange={(e) => updateNodeTitle(node.id, e.target.value)}
                  placeholder={meta.placeholder}
                  className="flex-1 min-w-0 bg-transparent text-[11px] font-bold text-white focus:outline-none focus:bg-white/[0.05] rounded px-1 py-0.5"
                />

                {node.level > 0 && (
                  <input
                    type="number"
                    min={1}
                    max={3000}
                    value={node.pageStart ?? ""}
                    onChange={(e) => updateNodePageStart(node.id, e.target.value)}
                    placeholder="p."
                    className="w-11 px-1 py-0.5 rounded bg-[#0A0A0F]/80 border border-white/[0.08] text-[9.5px] font-mono text-amber-200 text-center shrink-0 focus:outline-none focus:border-amber-400"
                    title="시작 페이지 번호 (선택)"
                  />
                )}

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={node.level === 0}
                    onClick={() =>
                      setNodeLevel(node.id, Math.max(0, node.level - 1) as TocLevel)
                    }
                    className="p-0.5 rounded bg-white/[0.05] hover:bg-white/[0.14] disabled:opacity-25 text-slate-300"
                    title="한 단계 위로 (내어쓰기)"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={node.level === 3}
                    onClick={() =>
                      setNodeLevel(node.id, Math.min(3, node.level + 1) as TocLevel)
                    }
                    className="p-0.5 rounded bg-white/[0.05] hover:bg-white/[0.14] disabled:opacity-25 text-slate-300"
                    title="한 단계 아래로 (들여쓰기)"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNode(node.id)}
                    className="p-0.5 rounded text-slate-500 hover:text-rose-400"
                    title="줄 삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 하단 1줄 빠른 추가 바 */}
      <div className="flex items-center gap-1 pt-1 border-t border-white/[0.06]">
        <select
          value={newLineLevel}
          onChange={(e) => setNewLineLevel(Number(e.target.value) as TocLevel)}
          className="px-2 py-1.5 rounded-lg bg-[#0E0E12] border border-white/[0.1] text-[10px] font-black text-white shrink-0"
        >
          <option value={0}>과목</option>
          <option value={1}>편</option>
          <option value={2}>장</option>
          <option value={3}>단원</option>
        </select>
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
          placeholder="새 항목 (예: 제1장 총칙 p.14)"
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#0E0E12] border border-white/[0.1] text-[11px] text-white focus:outline-none focus:border-[#FF5A36]"
        />
        <button
          type="button"
          onClick={handleAddSingleLine}
          className="px-2.5 py-1.5 rounded-lg bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[10.5px] font-black flex items-center gap-0.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>추가</span>
        </button>
      </div>
    </div>
  );
}
