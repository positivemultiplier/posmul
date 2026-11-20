"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Flame,
  GitCompareArrows,
  History,
  Search,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
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
 * 어느 화면에서나 1초 만에 여는 전역 기출 개념·대조축 Spotlight 검색
 * - 실물 수험서를 보다가 모르는 키워드(예: "500세대", "부싱", "저수조", "층간소음")를 즉시 꼬리물기!
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
    () =>
      KNOWLEDGE_CONCEPT_NODES.filter((n) => n.examStage === "2차")
        .slice(0, 6),
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
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-end sm:items-start justify-center sm:pt-14 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] max-h-[86vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#14151D] border border-white/[0.12] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 네이티브 바텀시트 핸들 */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* 검색 입력창 */}
        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-2.5">
          <Search className="w-5 h-5 text-[#FF7A59] shrink-0" />
          <input
            ref={inputRef}
            id="global-spotlight-input"
            name="spotlightQuery"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="실물 책 키워드 1초 검색 (예: 500세대, 장충금, 부싱)"
            className="flex-1 bg-transparent text-[15px] font-bold text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              aria-label="검색어 지우기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-xs font-black text-slate-200 shrink-0"
          >
            닫기
          </button>
        </div>

        {/* 검색 본문 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-safe">
          {!hasQuery ? (
            <>
              {/* 최근 본 개념 */}
              {recentConcepts.length > 0 && (
                <section className="space-y-2">
                  <div className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>방금 확인한 개념</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentConcepts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectTarget({ kind: "concept", conceptId: c.id })}
                        className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-sky-500/20 border border-white/[0.08] hover:border-sky-400/40 text-xs font-bold text-slate-100 transition"
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* 2차 최다 빈출 TOP 6 */}
              <section className="space-y-2.5">
                <div className="text-xs font-black text-[#FF8A70] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>주택관리사 2차 최다 빈출 TOP 6</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {topConcepts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectTarget({ kind: "concept", conceptId: c.id })}
                      className="p-3 rounded-2xl bg-[#1A1B26] hover:bg-[#222434] border border-white/[0.07] text-left flex items-center justify-between gap-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-black text-white truncate">{c.title}</div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">{c.category}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/35 text-[#FF8A70] text-xs font-mono font-black shrink-0">
                        {c.examCount}문항
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* 단골 대조표 빠른 진입 */}
              <section className="space-y-2.5">
                <div className="text-xs font-black text-sky-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>시험 단골 대조표 (A vs B)</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {KNOWLEDGE_CONTRAST_AXES.slice(0, 4).map((axis) => (
                    <button
                      key={axis.id}
                      type="button"
                      onClick={() => onSelectTarget({ kind: "axis", axisId: axis.id })}
                      className="p-3 rounded-2xl bg-[#1A1B26] hover:bg-[#222434] border border-white/[0.07] text-left transition"
                    >
                      <div className="text-sm font-black text-white">{axis.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {axis.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              {searchResult.axes.length === 0 && searchResult.concepts.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <GitCompareArrows className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">
                    &ldquo;{query}&rdquo;와 일치하는 개념이 없습니다.
                  </p>
                  <p className="text-xs text-slate-500">
                    예: 500세대, 자치관리, 장충금, 하자, 승강기, 층간소음, 부싱
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResult.axes.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-black text-[#FF8A70] flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span>대조 비교표 ({searchResult.axes.length})</span>
                      </div>
                      {searchResult.axes.map((axis) => (
                        <button
                          key={axis.id}
                          type="button"
                          onClick={() => onSelectTarget({ kind: "axis", axisId: axis.id })}
                          className="w-full p-3.5 rounded-2xl bg-[#22191A] hover:bg-[#2B1F20] border border-[#FF5A36]/35 text-left transition"
                        >
                          <div className="text-sm font-black text-white">{axis.title}</div>
                          <div className="text-xs text-slate-300 mt-0.5">{axis.subtitle}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResult.concepts.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-black text-sky-300 flex items-center gap-1">
                        <GitCompareArrows className="w-3.5 h-3.5" />
                        <span>기출 개념 노드 ({searchResult.concepts.length})</span>
                      </div>
                      {searchResult.concepts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onSelectTarget({ kind: "concept", conceptId: c.id })}
                          className="w-full p-3.5 rounded-2xl bg-[#1A1B26] hover:bg-[#222434] border border-white/[0.08] text-left flex items-center justify-between gap-2.5 transition"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-white truncate">
                                {c.title}
                              </span>
                              {c.proFieldTip && (
                                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {c.examStage} · {c.subject} · {c.category}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-[#FF5A36]/15 border border-[#FF5A36]/35 text-[#FF8A70] text-xs font-mono font-black shrink-0">
                            {c.examCount}문항
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
