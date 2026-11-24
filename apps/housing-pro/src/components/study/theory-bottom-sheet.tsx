"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, Loader2, X } from "lucide-react";
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

/**
 * 보기·O/X 카드에서 바로 여는 관련 핵심 이론 바텀시트 (오브시디언 다크 / 페이퍼 라이트 통일)
 */
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
      className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center bg-[var(--hp-overlay)] backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[460px] max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] shadow-2xl overflow-hidden text-[var(--hp-text)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <header className="shrink-0 px-4 py-3 border-b border-[var(--hp-border)] flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--hp-text-3)]">
              <BookOpen className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{activeSection?.subject || target.subject || "핵심 이론"}</span>
              {activeSection?.sectionCode && (
                <span className="hp-tabular">· {activeSection.sectionCode}</span>
              )}
            </div>
            <h3 className="mt-1 text-sm font-semibold leading-snug truncate">
              {activeSection?.chapterTitle || target.chapterTitle || "단원 이론 노트"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-lg hover:bg-[var(--hp-surface)] flex items-center justify-center text-[var(--hp-text-2)] shrink-0"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </header>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs">
          {target.statement && (
            <div className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-[var(--hp-text-3)]">확인 중인 지문</span>
                {typeof target.isCorrectStatement === "boolean" && (
                  <span
                    className={
                      target.isCorrectStatement
                        ? "text-[var(--hp-success)] font-medium"
                        : "text-[var(--hp-danger)] font-medium"
                    }
                  >
                    {target.isCorrectStatement ? "옳은 지문 (O)" : "틀린 지문 (X)"}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-[var(--hp-text)]">{target.statement}</p>
              {(target.trapSummary || target.citation) && (
                <div className="pt-2 border-t border-[var(--hp-border)] space-y-1 text-[11px] text-[var(--hp-text-2)]">
                  {target.trapSummary && <div>{target.trapSummary}</div>}
                  {target.citation && (
                    <div className="text-[var(--hp-text-3)]">근거: {target.citation}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-[var(--hp-text-3)]">
              <Loader2 className="w-5 h-5 animate-spin stroke-[1.5]" />
              <span>이론을 불러오는 중입니다...</span>
            </div>
          )}

          {!loading && fetchError && (
            <div className="rounded-xl border border-[var(--hp-danger)] bg-[var(--hp-surface)] p-3 text-[var(--hp-danger)]">
              {fetchError}
            </div>
          )}

          {!loading && sections.length > 0 && activeSection && (
            <div className="space-y-3">
              {sections.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {sections.map((sec, idx) => {
                    const isActive = sec.sectionCode === activeSection.sectionCode;
                    return (
                      <button
                        key={sec.sectionCode}
                        type="button"
                        onClick={() => setActiveSectionCode(sec.sectionCode)}
                        className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] border transition ${
                          isActive
                            ? "bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] border-transparent font-medium"
                            : "bg-[var(--hp-surface)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
                        }`}
                      >
                        {String(idx + 1).padStart(2, "0")}. {sec.sectionTitle}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] p-4 space-y-2.5">
                <h4 className="text-sm font-semibold pb-2 border-b border-[var(--hp-border)]">
                  {activeSection.sectionTitle}
                </h4>

                {activeSection.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {activeSection.keywords.slice(0, 8).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded bg-[var(--hp-bg)] border border-[var(--hp-border)] text-[10.5px] text-[var(--hp-text-3)]"
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

          {!loading && sections.length === 0 && fallbackNote && (
            <div className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] p-4 space-y-3">
              <div className="text-[11px] font-medium text-[var(--hp-text-2)]">
                단원 핵심 요약 노트
              </div>
              {fallbackNote.corePoints.length > 0 && (
                <ul className="space-y-1.5 list-disc pl-4 text-xs leading-relaxed text-[var(--hp-text)]">
                  {fallbackNote.corePoints.map((kp, i) => (
                    <li key={i}>{kp}</li>
                  ))}
                </ul>
              )}
              {fallbackNote.mustNumbers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {fallbackNote.mustNumbers.map((num, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-[var(--hp-bg)] border border-[var(--hp-border)] text-[11px] text-[var(--hp-text-2)]"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              )}
              {fallbackNote.examTrap && (
                <div className="pt-2 border-t border-[var(--hp-border)] text-xs text-[var(--hp-text-2)]">
                  함정 주의: {fallbackNote.examTrap}
                </div>
              )}
            </div>
          )}

          {!loading && sections.length === 0 && !fallbackNote && !fetchError && (
            <div className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] p-4 text-[var(--hp-text-2)] space-y-1.5">
              <p>이 단원의 상세 이론 문서는 순차 업데이트 예정입니다.</p>
              {target.citation && (
                <p className="text-[var(--hp-text-3)]">참고 근거: {target.citation}</p>
              )}
            </div>
          )}
        </div>

        {/* 하단 바 */}
        <footer className="shrink-0 px-4 py-3 border-t border-[var(--hp-border)] flex items-center justify-between gap-2 pb-safe">
          <Link
            href="/study/books"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs text-[var(--hp-text-2)] hover:text-[var(--hp-text)]"
          >
            <span>개념서 전체 보기</span>
            <ExternalLink className="w-3 h-3 stroke-[1.5]" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium"
          >
            문제로 돌아가기
          </button>
        </footer>
      </div>
    </div>
  );
}
