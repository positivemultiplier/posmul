"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GitCompareArrows, History, Search, X } from "lucide-react";
import {
  getConceptById,
  KNOWLEDGE_CONCEPT_NODES,
  KNOWLEDGE_CONTRAST_AXES,
} from "@/data/knowledge-graph-housing";
import type { KnowledgeTrailTarget } from "@/components/study/concept-linked-text";

interface GlobalSpotlightSearchProps {
  open: boolean;
  initialQuery?: string;
  recentConceptIds: string[];
  onClose: () => void;
  onSelectTarget: (target: KnowledgeTrailTarget) => void;
}

/**
 * 어느 화면에서나 1초 만에 여는 전역 기출 개념·대조축 검색 (오브시디언 다크 / 페이퍼 라이트 통일)
 */
export function GlobalSpotlightSearch({
  open,
  initialQuery = "",
  recentConceptIds,
  onClose,
  onSelectTarget,
}: GlobalSpotlightSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      const t = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
  }, [open, initialQuery]);

  const topConcepts = useMemo(
    () => KNOWLEDGE_CONCEPT_NODES.filter((n) => n.examStage === "2차").slice(0, 6),
    []
  );

  const recentConcepts = useMemo(
    () =>
      recentConceptIds
        .map((id) => getConceptById(id))
        .filter((n): n is NonNullable<typeof n> => n !== null),
    [recentConceptIds]
  );

  const searchResult = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { axes: [], concepts: [] };

    const axes = KNOWLEDGE_CONTRAST_AXES.filter((a) =>
      [a.title, a.subtitle, a.subjectTag, ...a.triggerTerms]
        .join(" ")
        .toLowerCase()
        .includes(q)
    ).slice(0, 5);

    const concepts = KNOWLEDGE_CONCEPT_NODES.filter((n) =>
      [
        n.title,
        n.englishTitle || "",
        n.category,
        n.subject,
        n.lawRef || "",
        ...n.aliases,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    ).slice(0, 12);

    return { axes, concepts };
  }, [query]);

  if (!open) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[80] bg-[var(--hp-overlay)] backdrop-blur-sm flex items-end sm:items-start justify-center sm:pt-14 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] max-h-[84vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] shadow-2xl overflow-hidden text-[var(--hp-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 검색 입력창 */}
        <div className="px-4 py-3 border-b border-[var(--hp-border)] flex items-center gap-2.5">
          <Search className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-2)] shrink-0" />
          <input
            ref={inputRef}
            id="global-spotlight-input"
            name="spotlightQuery"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="기출 개념 · 조문 · 대조표 검색 (예: 500세대, 장충금)"
            className="flex-1 bg-transparent text-sm text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-[var(--hp-text-3)] hover:text-[var(--hp-text)]"
              aria-label="검색어 지우기"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-md border border-[var(--hp-border)] text-xs text-[var(--hp-text-2)] hover:text-[var(--hp-text)] shrink-0"
          >
            닫기
          </button>
        </div>

        {/* 검색 결과 / 추천 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-safe">
          {!hasQuery ? (
            <>
              {recentConcepts.length > 0 && (
                <section className="space-y-2">
                  <div className="text-[11px] font-medium text-[var(--hp-text-3)] flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>최근 본 개념</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentConcepts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectTarget({ kind: "concept", conceptId: c.id })}
                        className="px-2.5 py-1.5 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-xs text-[var(--hp-text)] transition"
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-2">
                <div className="text-[11px] font-medium text-[var(--hp-text-3)]">
                  빈출 핵심 개념
                </div>
                <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
                  {topConcepts.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onSelectTarget({ kind: "concept", conceptId: c.id })}
                        className="w-full py-2.5 text-left hover:opacity-80 transition"
                      >
                        <div className="text-sm font-medium text-[var(--hp-text)]">{c.title}</div>
                        <div className="text-[11px] text-[var(--hp-text-3)] mt-0.5 truncate">
                          {c.subject} {c.lawRef ? `· ${c.lawRef}` : ""}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : searchResult.axes.length === 0 && searchResult.concepts.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--hp-text-3)]">
              일치하는 개념이나 대조표가 없습니다.
            </div>
          ) : (
            <div className="space-y-5">
              {searchResult.axes.length > 0 && (
                <section className="space-y-2">
                  <div className="text-[11px] font-medium text-[var(--hp-text-3)] flex items-center gap-1.5">
                    <GitCompareArrows className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>A vs B 대조표</span>
                  </div>
                  <ul className="space-y-1.5">
                    {searchResult.axes.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => onSelectTarget({ kind: "axis", axisId: a.id })}
                          className="w-full p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-left transition"
                        >
                          <div className="text-xs font-medium text-[var(--hp-text)]">{a.title}</div>
                          <div className="text-[11px] text-[var(--hp-text-3)] mt-0.5">
                            {a.subtitle}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {searchResult.concepts.length > 0 && (
                <section className="space-y-2">
                  <div className="text-[11px] font-medium text-[var(--hp-text-3)]">
                    개념 ({searchResult.concepts.length})
                  </div>
                  <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
                    {searchResult.concepts.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => onSelectTarget({ kind: "concept", conceptId: c.id })}
                          className="w-full py-2.5 text-left hover:opacity-80 transition"
                        >
                          <div className="text-sm font-medium text-[var(--hp-text)]">{c.title}</div>
                          <div className="text-[11px] text-[var(--hp-text-3)] mt-0.5 truncate">
                            {c.subject} {c.lawRef ? `· ${c.lawRef}` : ""}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
