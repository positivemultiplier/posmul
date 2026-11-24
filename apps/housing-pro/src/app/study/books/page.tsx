"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import {
  recordOxOptionResultAction,
  searchStudyOptionsByKeywordsAction,
  type KeywordMatchedOption,
} from "@/app/actions/exam-study.actions";
import { getChapterConceptNote } from "@/data/study-concept-notes";
import { getTopicCompletedRoundCount } from "@/lib/study-metrics";
import { getMutedSubjectColor } from "@/lib/study-theme";

const QUICK_KEYWORDS = [
  "장기수선충당금",
  "하자담보책임",
  "입주자대표회의",
  "사용검사",
  "표현대리",
  "감가상각",
] as const;

export default function StudyConceptBooksPage() {
  const { todayISO, subjects, roundsByTopic, chapterTotals, addTodo } = useStudyCurriculum();
  const { effectiveOwnerKey } = useStudyAuth();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [addedTopicIds, setAddedTopicIds] = useState<Set<string>>(new Set());

  // 키워드 기출 O/X 즉시 검색
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [matchedOptions, setMatchedOptions] = useState<KeywordMatchedOption[]>([]);
  const [pickedOx, setPickedOx] = useState<Record<string, boolean>>({});

  const visibleSubjects = useMemo(() => {
    if (selectedSubjectId === "ALL") return subjects;
    return subjects.filter((s) => s.id === selectedSubjectId);
  }, [subjects, selectedSubjectId]);

  const handleKeywordSearch = async (query: string) => {
    const clean = query.trim();
    if (!clean) {
      setMatchedOptions([]);
      return;
    }
    setKeyword(clean);
    setSearching(true);
    setPickedOx({});
    try {
      const res = await searchStudyOptionsByKeywordsAction(clean);
      setMatchedOptions(res.success ? res.options.slice(0, 12) : []);
    } finally {
      setSearching(false);
    }
  };

  const handleJudgeMatched = (opt: KeywordMatchedOption, choice: boolean) => {
    if (pickedOx[opt.id] !== undefined) return;
    setPickedOx((prev) => ({ ...prev, [opt.id]: choice }));
    const isRight = choice === opt.isCorrect;
    if (opt.questionId && effectiveOwnerKey) {
      void recordOxOptionResultAction({
        clientKey: effectiveOwnerKey,
        optionId: opt.id,
        questionId: opt.questionId,
        isRight,
      }).catch(() => {
        // 비동기 오류 무시
      });
    }
  };

  return (
    <MobileAppShell>
      {/* 상단 키워드 즉시 검색 + 과목 필터 */}
      <div className="px-4 py-3 border-b border-[var(--hp-border)] space-y-3 bg-[var(--hp-bg)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleKeywordSearch(keyword);
          }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 h-9 px-3 rounded-lg bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 stroke-[1.5] text-[var(--hp-text-3)] shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="키워드로 관련 기출 O/X 즉시 찾기..."
              className="flex-1 bg-transparent text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] outline-none"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setKeyword("");
                  setMatchedOptions([]);
                }}
                className="text-[var(--hp-text-3)] hover:text-[var(--hp-text)]"
                aria-label="검색 지우기"
              >
                <X className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="h-9 px-3 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-xs font-medium shrink-0"
          >
            검색
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => void handleKeywordSearch(kw)}
              className="px-2.5 py-1 rounded-md bg-[var(--hp-surface)] border border-[var(--hp-border)] hover:border-[var(--hp-border-strong)] text-[11px] text-[var(--hp-text-2)] whitespace-nowrap"
            >
              {kw}
            </button>
          ))}
        </div>

        {/* 과목 필터 */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setSelectedSubjectId("ALL")}
            className={`px-2.5 py-1 rounded-md text-[11px] border whitespace-nowrap ${
              selectedSubjectId === "ALL"
                ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                : "border-transparent text-[var(--hp-text-2)]"
            }`}
          >
            전체
          </button>
          {subjects.map((s, idx) => {
            const color = getMutedSubjectColor(s.title, s.color, idx);
            const selected = selectedSubjectId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubjectId(s.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1.5 border whitespace-nowrap ${
                  selected
                    ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)] text-[var(--hp-text)] font-medium"
                    : "border-transparent text-[var(--hp-text-2)]"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{s.shortTitle || s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* 키워드 매칭 O/X 결과 */}
        {searching ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-[var(--hp-text-3)]">
            <Loader2 className="w-4 h-4 animate-spin stroke-[1.5]" />
            <span>관련 기출 선지 찾는 중...</span>
          </div>
        ) : (
          matchedOptions.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--hp-text)]">
                  &apos;{keyword}&apos; 관련 기출 O/X ({matchedOptions.length})
                </span>
                <button
                  type="button"
                  onClick={() => setMatchedOptions([])}
                  className="text-[11px] text-[var(--hp-text-3)] hover:text-[var(--hp-text)]"
                >
                  접기
                </button>
              </div>
              <ul className="space-y-2">
                {matchedOptions.map((opt) => {
                  const picked = pickedOx[opt.id];
                  const isJudged = picked !== undefined;
                  const isRight = isJudged && picked === opt.isCorrect;

                  return (
                    <li
                      key={opt.id}
                      className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2.5"
                    >
                      <div className="text-[11px] hp-tabular text-[var(--hp-text-3)]">
                        {opt.examYear}년 · {opt.subject} {opt.questionNumber}번
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--hp-text)]">
                        {opt.statement}
                      </p>
                      {!isJudged ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleJudgeMatched(opt, true)}
                            className="flex-1 py-1.5 rounded-md border border-[var(--hp-border-strong)] text-xs font-medium flex items-center justify-center gap-1 hover:bg-[var(--hp-surface-2)]"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[1.75]" />
                            <span>O</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleJudgeMatched(opt, false)}
                            className="flex-1 py-1.5 rounded-md border border-[var(--hp-border-strong)] text-xs font-medium flex items-center justify-center gap-1 hover:bg-[var(--hp-surface-2)]"
                          >
                            <X className="w-3.5 h-3.5 stroke-[1.75]" />
                            <span>X</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs pt-1 border-t border-[var(--hp-border)] space-y-1">
                          <div
                            className={
                              isRight ? "text-[var(--hp-success)]" : "text-[var(--hp-danger)]"
                            }
                          >
                            {isRight ? "정답" : "오답"} · 정해: {opt.isCorrect ? "O" : "X"}
                          </div>
                          {opt.trapSummary && (
                            <p className="text-[var(--hp-text-2)] leading-relaxed">
                              {opt.trapSummary}
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )
        )}

        {/* 과목별 단원 개념서 리스트 */}
        {visibleSubjects.map((subj, sIdx) => {
          const color = getMutedSubjectColor(subj.title, subj.color, sIdx);
          const flatTopics = subj.units.flatMap((u) => u.topics);

          return (
            <section key={subj.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <h2 className="text-xs font-medium text-[var(--hp-text-2)]">
                  {subj.title} ({flatTopics.length}단원)
                </h2>
              </div>

              <ul className="divide-y divide-[var(--hp-border)] border-y border-[var(--hp-border)]">
                {flatTopics.map((topic) => {
                  const isOpen = expandedTopicId === topic.id;
                  const rounds = getTopicCompletedRoundCount(roundsByTopic, topic.id);
                  const prog = topic.chapterCode ? chapterTotals[topic.chapterCode] : undefined;
                  const note = topic.chapterCode ? getChapterConceptNote(topic.chapterCode) : null;
                  const isAdded = addedTopicIds.has(topic.id);

                  return (
                    <li key={topic.id} className="py-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedTopicId(isOpen ? null : topic.id)}
                          className="flex items-start gap-2 min-w-0 flex-1 text-left"
                        >
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-3)] mt-0.5 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 stroke-[1.5] text-[var(--hp-text-3)] mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm text-[var(--hp-text)] leading-snug">
                              {topic.topicNo ? `${topic.topicNo}. ` : ""}
                              {topic.title}
                            </div>
                            <div className="text-[11px] hp-tabular text-[var(--hp-text-3)] mt-0.5">
                              {rounds}회독
                              {topic.questionCount
                                ? ` · 기출 ${prog?.solvedCount ?? 0}/${topic.questionCount}제`
                                : ""}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          {topic.chapterCode && (
                            <Link
                              href={`/study/solve?chapter=${encodeURIComponent(topic.chapterCode)}`}
                              className="px-2 py-1 rounded-md border border-[var(--hp-border)] text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-0.5"
                            >
                              <span>기출</span>
                              <ArrowUpRight className="w-3 h-3 stroke-[1.5]" />
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              addTodo({
                                title: `${topic.topicNo ? `${topic.topicNo}. ` : ""}${topic.title}`,
                                subjectId: subj.id,
                                subjectTitle: subj.shortTitle || subj.title,
                                subjectColor: color,
                                topicId: topic.id,
                                dueDate: todayISO,
                              });
                              setAddedTopicIds((prev) => {
                                const next = new Set(prev);
                                next.add(topic.id);
                                return next;
                              });
                            }}
                            className="px-2 py-1 rounded-md border border-[var(--hp-border)] text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3 stroke-[1.75]" />
                            <span>{isAdded ? "담김" : "오늘"}</span>
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="ml-6 p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-2.5 text-xs">
                          {note ? (
                            <>
                              {note.corePoints.length > 0 && (
                                <ul className="space-y-1.5 text-[var(--hp-text)] list-disc pl-4 leading-relaxed">
                                  {note.corePoints.map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                                </ul>
                              )}
                              {note.mustNumbers.length > 0 && (
                                <div className="pt-2 border-t border-[var(--hp-border)] flex flex-wrap gap-1.5">
                                  {note.mustNumbers.map((num, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded bg-[var(--hp-bg)] border border-[var(--hp-border)] text-[11px] text-[var(--hp-text-2)]"
                                    >
                                      {num}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {note.examTrap && (
                                <div className="pt-2 border-t border-[var(--hp-border)] text-[11px] text-[var(--hp-text-2)]">
                                  출제 함정: {note.examTrap}
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-[var(--hp-text-2)]">
                              핵심 키워드: {topic.defaultKeyword} · 상단 검색창에 키워드를 입력해
                              관련 기출 O/X를 바로 확인할 수 있습니다.
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </MobileAppShell>
  );
}
