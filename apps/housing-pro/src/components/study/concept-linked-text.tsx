"use client";

import { useMemo } from "react";
import { GitCompareArrows } from "lucide-react";
import { tokenizeTextWithKnowledgeGraph } from "@/data/knowledge-graph-housing";

export type KnowledgeTrailTarget =
  | { kind: "concept"; conceptId: string }
  | { kind: "axis"; axisId: string; triggerWord?: string };

interface ConceptLinkedTextProps {
  text: string;
  /** 대조어 오매칭 방지를 위한 주변 문맥 텍스트 (예: 문제 본문 + 선지 합본) */
  contextText?: string;
  /** 풀이 중에는 false(클린 텍스트), 채점/해설 모드에서만 true */
  enabled?: boolean;
  onSelectTarget: (target: KnowledgeTrailTarget) => void;
  className?: string;
}

/**
 * 기출 문항·선지 텍스트 안의 핵심 개념어와 반대어·대조어를
 * 클릭 가능한 꼬리물기 링크로 변환하는 경량 렌더러 (다크/라이트 시맨틱 대응)
 */
export function ConceptLinkedText({
  text,
  contextText,
  enabled = true,
  onSelectTarget,
  className = "",
}: ConceptLinkedTextProps) {
  const tokens = useMemo(() => {
    if (!enabled) return [{ text, kind: "plain" as const }];
    return tokenizeTextWithKnowledgeGraph(text, contextText);
  }, [text, contextText, enabled]);

  if (!enabled) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {tokens.map((tok, idx) => {
        if (tok.kind === "concept" && tok.conceptId) {
          return (
            <button
              key={`${tok.conceptId}-${idx}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTarget({ kind: "concept", conceptId: tok.conceptId! });
              }}
              className="inline px-1 mx-0.5 rounded bg-[#4F7CAC]/15 hover:bg-[#4F7CAC]/25 border-b border-dashed border-[#4F7CAC] text-[var(--hp-text)] font-semibold transition cursor-pointer"
              title={`「${tok.text}」 개념·출제통계·암기법 보기`}
            >
              {tok.text}
            </button>
          );
        }

        if (tok.kind === "contrast" && tok.axisId) {
          return (
            <button
              key={`${tok.axisId}-${idx}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectTarget({
                  kind: "axis",
                  axisId: tok.axisId!,
                  triggerWord: tok.text,
                });
              }}
              className="inline-flex items-center gap-0.5 px-1 mx-0.5 rounded bg-[#C97B63]/18 hover:bg-[#C97B63]/30 border-b border-dashed border-[#C97B63] text-[var(--hp-text)] font-semibold transition cursor-pointer align-baseline"
              title={`「${tok.text}」 반대어·대조 개념 비교`}
            >
              <GitCompareArrows className="w-2.5 h-2.5 inline shrink-0 text-[#C97B63]" />
              <span>{tok.text}</span>
            </button>
          );
        }

        return <span key={idx}>{tok.text}</span>;
      })}
    </span>
  );
}
