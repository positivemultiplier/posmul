"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  X,
  Loader2,
  Sparkles,
  Scale,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  fetchTheoryBundleAction,
  type TheorySectionDoc,
} from "@/app/actions/exam-study.actions";
import { getChapterConceptNote } from "@/data/study-concept-notes";
import { TheoryMarkdown } from "@/components/study/theory-markdown";

export interface TheorySheetTarget {
  subject?: string | null;
  detailCode?: string | null;
  sectionCode?: string | null;
  chapterTitle?: string | null;
  statement?: string | null;
  isCorrectStatement?: boolean | null;
  citation?: string | null;
  trapSummary?: string | null;
}

interface TheoryBottomSheetProps {
  target: TheorySheetTarget | null;
  onClose: () => void;
}

export function TheoryBottomSheet({ target, onClose }: TheoryBottomSheetProps) {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<TheorySectionDoc[]>([]);
  const [activeSectionCode, setActiveSectionCode] = useState<string | null>(null);
  const [resolvedDetailCode, setResolvedDetailCode] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [target, onClose]);

  useEffect(() => {
    if (!target) {
      setSections([]);
      setActiveSectionCode(null);
      setResolvedDetailCode(null);
      setFetchError(null);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setFetchError(null);
      const res = await fetchTheoryBundleAction({
        sectionCode: target?.sectionCode ?? null,
        detailCode: target?.detailCode ?? null,
      });
      if (cancelled) return;
      if (!res.success) {
        setFetchError(res.error ?? "이론을 불러오지 못했습니다.");
        setSections([]);
      } else {
        setSections(res.sections);
        setActiveSectionCode(res.targetSectionCode);
        setResolvedDetailCode(res.detailCode);
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [target]);

  if (!target) return null;

  const activeSection =
    sections.find((s) => s.sectionCode === activeSectionCode) ?? sections[0] ?? null;

  const fallbackNote =
    !loading && sections.length === 0 && (resolvedDetailCode || target.detailCode)
      ? getChapterConceptNote((resolvedDetailCode || target.detailCode) as string)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#121218] border border-white/[0.1] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 핸들 & 헤더 */}
        <div className="shrink-0 px-5 pt-3 pb-3 border-b border-white/[0.08] bg-[#16161F]">
          <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-3 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <BookOpen className="w-3 h-3" />
                  관련 핵심 이론
                </span>
                {(activeSection?.subject || target.subject) && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/[0.06] text-zinc-300">
                    {activeSection?.subject || target.subject}
                  </span>
                )}
                {activeSection?.sectionCode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                    {activeSection.sectionCode}
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 text-sm sm:text-base font-bold text-white leading-snug">
                {activeSection?.chapterTitle ||
                  target.chapterTitle ||
                  "단원 이론 노트"}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="shrink-0 p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* 방금 보던 선지 컨텍스트 카드 */}
          {target.statement && (
            <div className="rounded-2xl bg-[#1A1A23] border border-white/[0.08] p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-zinc-400">
                  확인 중인 기출 선지
                </span>
                {typeof target.isCorrectStatement === "boolean" && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      target.isCorrectStatement
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {target.isCorrectStatement ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> 옳은 지문 (O)
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> 틀린 지문 (X)
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
                {target.statement}
              </p>
              {(target.trapSummary || target.citation) && (
                <div className="pt-2 border-t border-white/[0.06] space-y-1.5 text-xs">
                  {target.trapSummary && (
                    <div className="flex items-start gap-1.5 text-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <span>{target.trapSummary}</span>
                    </div>
                  )}
                  {target.citation && (
                    <div className="flex items-start gap-1.5 text-sky-300">
                      <Scale className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-400" />
                      <span>{target.citation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 로딩 상태 */}
          {loading && (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span>단원 이론서를 불러오는 중입니다...</span>
            </div>
          )}

          {/* 에러 표시 */}
          {!loading && fetchError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              {fetchError}
            </div>
          )}

          {/* 2차 .md 이론 섹션 뷰 */}
          {!loading && sections.length > 0 && activeSection && (
            <div className="space-y-3">
              {/* 소주제 탭 전환 */}
              {sections.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {sections.map((sec, idx) => {
                    const isActive = sec.sectionCode === activeSection.sectionCode;
                    return (
                      <button
                        key={sec.sectionCode}
                        type="button"
                        onClick={() => setActiveSectionCode(sec.sectionCode)}
                        className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition text-left ${
                          isActive
                            ? "bg-indigo-500/20 border-indigo-400/50 text-indigo-200"
                            : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="font-mono opacity-75 mr-1">
                          {String(idx + 1).padStart(2, "0")}.
                        </span>
                        {sec.sectionTitle}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 선택된 소주제 본문 카드 */}
              <div className="rounded-2xl bg-[#17171F] border border-white/[0.08] p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {activeSection.sectionTitle}
                  </h4>
                </div>

                {activeSection.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5 pb-1">
                    {activeSection.keywords.slice(0, 8).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[10px] text-zinc-400"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                <TheoryMarkdown markdown={activeSection.bodyMd} />
              </div>
            </div>
          )}

          {/* 1차 과목 등 .md 미구축 단원 폴백 (치트시트 노트) */}
          {!loading && sections.length === 0 && fallbackNote && (
            <div className="rounded-2xl bg-[#17171F] border border-white/[0.08] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  단원 핵심 요약 노트 (2차 이론 .md 우선 구축 · 1차 요약 지원)
                </span>
              </div>
              {fallbackNote.corePoints.length > 0 && (
                <ul className="space-y-1.5">
                  {fallbackNote.corePoints.map((kp, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs sm:text-[13px] text-zinc-200 leading-relaxed"
                    >
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{kp}</span>
                    </li>
                  ))}
                </ul>
              )}
              {fallbackNote.mustNumbers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {fallbackNote.mustNumbers.map((num, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-200"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              )}
              {fallbackNote.examTrap && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                  <strong>⚠️ 함정 주의:</strong> {fallbackNote.examTrap}
                </div>
              )}
            </div>
          )}

          {/* 매핑 정보가 전혀 없을 때 안내 */}
          {!loading && sections.length === 0 && !fallbackNote && !fetchError && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 text-xs text-zinc-400 space-y-2">
              <p>
                현재 2차 과목(주택관리관계법규·공동주택관리실무) 상세 이론 `.md`가 우선
                탑재되어 있으며, 이 단원의 상세 이론 문서는 순차 업데이트 예정입니다.
              </p>
              {target.citation && (
                <p className="text-sky-300">참고 법령·근거: {target.citation}</p>
              )}
            </div>
          )}
        </div>

        {/* 하단 액션 바 */}
        <div className="shrink-0 px-5 py-3 border-t border-white/[0.08] bg-[#16161F] flex items-center justify-between gap-3">
          <Link
            href="/study/books"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            단원별 개념센터 전체 보기
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.18] text-xs font-semibold text-white transition"
          >
            문제로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
