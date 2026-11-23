"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookCheck,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  ListChecks,
  Loader2,
  Play,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { PracticeHubTabs } from "@/components/study/practice-hub-tabs";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import {
  TheoryBottomSheet,
  type TheorySheetTarget,
} from "@/components/study/theory-bottom-sheet";
import {
  fetchChapterStudyPacketAction,
  recordOxOptionResultAction,
  searchStudyOptionsByKeywordsAction,
  type ChapterStudyPacketResult,
  type KeywordMatchedOption,
} from "@/app/actions/exam-study.actions";
import { grantAppStudyPmpAction } from "@/app/actions/study-economy.actions";
import { getChapterConceptNote } from "@/data/study-concept-notes";
import {
  type StudySubjectNode,
  type StudyTopicNode,
} from "@/data/study-textbooks";

type CenterTab = "smart" | "concept";

const QUICK_TRAINING_KEYWORDS = [
  "장기수선충당금",
  "하자담보책임",
  "입주자대표회의",
  "사용검사",
  "전매제한",
  "감가상각",
  "표현대리",
];

export default function AppStandaloneStudyCenterPage() {
  const {
    todayISO,
    subjects,
    matrixLogs,
    chapterTotals,
  } = useStudyCurriculum();
  const { isLoggedIn, effectiveOwnerKey, adjustLocalPmpBalance, setLocalPmpBalance } =
    useStudyAuth();

  const [centerTab, setCenterTab] = useState<CenterTab>("smart");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 스마트 키워드 매칭 훈련실 상태 (커스텀 책·단원 연동)
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [activeKeywordLabel, setActiveKeywordLabel] = useState<string>("");
  const [keywordLoading, setKeywordLoading] = useState<boolean>(false);
  const [keywordResults, setKeywordResults] = useState<KeywordMatchedOption[]>([]);
  const [usedTokens, setUsedTokens] = useState<string[]>([]);
  const [smartOxAnswers, setSmartOxAnswers] = useState<Record<string, boolean>>({});

  // 선택된 단원 학습 상태
  const [selectedTopic, setSelectedTopic] = useState<{
    subject: StudySubjectNode;
    unitTitle: string;
    topic: StudyTopicNode;
  } | null>(null);
  const [packetLoading, setPacketLoading] = useState(false);
  const [chapterPacket, setChapterPacket] = useState<ChapterStudyPacketResult | null>(null);
  const [miniOxAnswers, setMiniOxAnswers] = useState<Record<string, boolean>>({});
  const [theoryTarget, setTheoryTarget] = useState<TheorySheetTarget | null>(null);

  // 오늘 플래너에 계획/실행 기록이 있는 내 책·커스텀 단원 목록
  const todayPlannedTopics = useMemo(() => {
    const list: Array<{ topicId: string; title: string; subjectTitle: string }> = [];
    for (const subj of subjects) {
      for (const unit of subj.units) {
        for (const t of unit.topics) {
          const log = matrixLogs[`${t.id}::${todayISO}`];
          if (log) {
            list.push({
              topicId: t.id,
              title: t.title,
              subjectTitle: subj.shortTitle,
            });
          }
        }
      }
    }
    return list;
  }, [subjects, matrixLogs, todayISO]);

  const handleRunKeywordMatch = async (queryText: string, subjectHint?: string) => {
    const clean = queryText.trim();
    if (!clean) return;
    setKeywordInput(clean);
    setActiveKeywordLabel(clean);
    setKeywordLoading(true);
    setSmartOxAnswers({});
    const res = await searchStudyOptionsByKeywordsAction(clean, subjectHint);
    if (res.success) {
      setKeywordResults(res.options);
      setUsedTokens(res.keywordsUsed);
    } else {
      setKeywordResults([]);
      setUsedTokens([]);
    }
    setKeywordLoading(false);
  };

  const handleSmartOxSelect = async (
    optId: string,
    questionId: string | undefined,
    selectedTrue: boolean,
    actualTrue: boolean
  ) => {
    if (smartOxAnswers[optId] !== undefined) return;
    const isRight = selectedTrue === actualTrue;
    setSmartOxAnswers((prev) => ({ ...prev, [optId]: selectedTrue }));
    if (questionId && effectiveOwnerKey) {
      void recordOxOptionResultAction({
        clientKey: effectiveOwnerKey,
        optionId: optId,
        questionId,
        isRight,
      });
    }
    if (isRight && isLoggedIn) {
      const rewardRes = await grantAppStudyPmpAction({ kind: "OX" });
      if (rewardRes.success && rewardRes.authenticated) {
        if (typeof rewardRes.newBalance === "number") {
          setLocalPmpBalance(rewardRes.newBalance);
        } else {
          adjustLocalPmpBalance(rewardRes.earnedPmp);
        }
      }
    }
  };

  const handleOpenTopicStudy = async (
    subject: StudySubjectNode,
    unitTitle: string,
    topic: StudyTopicNode
  ) => {
    const isSame = selectedTopic?.topic.id === topic.id;
    if (isSame) {
      setSelectedTopic(null);
      return;
    }

    setSelectedTopic({ subject, unitTitle, topic });
    setMiniOxAnswers({});

    if (!topic.chapterCode) {
      setChapterPacket(null);
      return;
    }

    setPacketLoading(true);
    const pkt = await fetchChapterStudyPacketAction(topic.chapterCode, effectiveOwnerKey);
    setChapterPacket(pkt);
    setPacketLoading(false);
  };

  const handleMiniOxSelect = async (
    optId: string,
    questionId: string | undefined,
    selectedTrue: boolean,
    actualTrue: boolean
  ) => {
    if (miniOxAnswers[optId] !== undefined) return;
    const isRight = selectedTrue === actualTrue;
    setMiniOxAnswers((prev) => ({ ...prev, [optId]: selectedTrue }));
    if (questionId && effectiveOwnerKey) {
      void recordOxOptionResultAction({
        clientKey: effectiveOwnerKey,
        optionId: optId,
        questionId,
        isRight,
      });
    }

    if (isRight && isLoggedIn) {
      const rewardRes = await grantAppStudyPmpAction({ kind: "OX" });
      if (rewardRes.success && rewardRes.authenticated) {
        if (typeof rewardRes.newBalance === "number") {
          setLocalPmpBalance(rewardRes.newBalance);
        } else {
          adjustLocalPmpBalance(rewardRes.earnedPmp);
        }
      }
    }
  };

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subjects
      .filter((s) => subjectFilter === "ALL" || s.id === subjectFilter)
      .map((s) => ({
        ...s,
        units: s.units
          .map((u) => ({
            ...u,
            topics: u.topics.filter(
              (t) =>
                !q ||
                t.title.toLowerCase().includes(q) ||
                t.defaultKeyword.toLowerCase().includes(q) ||
                u.title.toLowerCase().includes(q)
            ),
          }))
          .filter((u) => u.topics.length > 0),
      }))
      .filter((s) => s.units.length > 0);
  }, [subjects, subjectFilter, searchQuery]);

  const activeConceptNote = useMemo(
    () => getChapterConceptNote(selectedTopic?.topic.chapterCode),
    [selectedTopic]
  );

  return (
    <MobileAppShell>
      <PracticeHubTabs />
      {/* 헤더: 학습 허브 (교재 설정은 마이 > 내 서재로 단일화) */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF5A36]" />
          <h1 className="text-sm font-black text-white">학습 센터 · 기출 · O/X · 개념</h1>
        </div>
        <Link
          href="/study/more?tab=library"
          className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] text-[10px] font-black transition"
        >
          내 서재 관리 →
        </Link>
      </header>

      {/* 2대 핵심 탭 스위처 (오늘 매칭·실전훈련 | 69단원 개념·이론서) */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0D0D11] border border-white/[0.08] text-[11px] font-black">
          <button
            type="button"
            onClick={() => setCenterTab("smart")}
            className={`py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              centerTab === "smart"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">실전 훈련 · 키워드 매칭</span>
          </button>
          <button
            type="button"
            onClick={() => setCenterTab("concept")}
            className={`py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              centerTab === "concept"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">69단원 개념 · 이론서</span>
          </button>
        </div>
      </div>

      {centerTab === "smart" ? (
        /* ① 커스텀 단원 키워드 기출 매칭 & 시험 4대 실전 훈련실 */
        <div className="px-4 py-4 space-y-4">
          {/* NEW: 꼬리물기 기출 지식 그래프 & 집단지성 암기 위키 진입 배너 */}
          <Link
            href="/study/graph"
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1A2034] via-[#1B1829] to-[#241819] border border-sky-400/45 hover:border-[#FF5A36] flex items-center justify-between gap-3 shadow-lg transition"
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-[#FF5A36] text-white text-[9px] font-black">
                  NEW
                </span>
                <span className="text-xs font-black text-white truncate">
                  꼬리물기 지식 그래프 · 인기 암기법 위키
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300 truncate">
                지문 속 단어·대조어 클릭 → 연관 개념 · 출제 통계 · 두문자 암기법 투표
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-200 text-[10px] font-black shrink-0">
              체험 →
            </span>
          </Link>

          {/* 실전 훈련 4종 바로가기 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link
              href="/study/ox"
              className="p-3 rounded-2xl bg-[#1A1A21] border border-sky-500/30 hover:border-sky-400 space-y-1 transition"
            >
              <div className="text-xs font-black text-sky-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>3초 컷 O/X</span>
              </div>
              <p className="text-[10px] text-slate-400">핵심 함정 지문 무한 훈련</p>
            </Link>
            <Link
              href="/study/solve"
              className="p-3 rounded-2xl bg-[#1A1A21] border border-[#FF5A36]/30 hover:border-[#FF5A36] space-y-1 transition"
            >
              <div className="text-xs font-black text-[#FF8A6B] flex items-center gap-1.5">
                <ListChecks className="w-4 h-4" />
                <span>기출 20제</span>
              </div>
              <p className="text-[10px] text-slate-400">실전 5지선다 풀이</p>
            </Link>
            <Link
              href="/scan"
              className="p-3 rounded-2xl bg-[#1A1A21] border border-amber-500/30 hover:border-amber-400 space-y-1 transition"
            >
              <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>종이책 스캔</span>
              </div>
              <p className="text-[10px] text-slate-400">내 책 문제 AI 오답노트</p>
            </Link>
            <Link
              href="/study/ox?mode=amended"
              className="p-3 rounded-2xl bg-[#1A1A21] border border-emerald-500/30 hover:border-emerald-400 space-y-1 transition"
            >
              <div className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>개정법령 공략</span>
              </div>
              <p className="text-[10px] text-slate-400">2026 최신 변경 조문</p>
            </Link>
          </div>

          {/* 커스텀 책·단원 키워드 → 기출 O/X 자동 매칭 */}
          <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-3">
            <div>
              <h2 className="text-xs font-black text-white flex items-center gap-1.5">
                <Search className="w-4 h-4 text-[#FF5A36]" />
                <span>내 공부 키워드 → 기출 O/X 자동 매칭</span>
              </h2>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                커스텀 책·단원을 선택하거나 아무 용어를 입력하면 실제 기출 O/X 지문을 뽑아드립니다.
              </p>
            </div>

            {/* 자유 키워드 입력 */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleRunKeywordMatch(keywordInput);
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="키워드 입력 (예: 장기수선충당금, 감가상각, 주택법)"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#0D0D12] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#FF5A36]"
              />
              <button
                type="submit"
                disabled={keywordLoading || !keywordInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] disabled:opacity-40 text-white text-xs font-black shrink-0"
              >
                {keywordLoading ? "검색중" : "O/X 뽑기"}
              </button>
            </form>

            {/* 오늘 내 플래너 단원 칩 */}
            {todayPlannedTopics.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-black text-emerald-300">
                  오늘 플래너 단원에서 바로 뽑기
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todayPlannedTopics.slice(0, 8).map((item) => (
                    <button
                      key={item.topicId}
                      type="button"
                      onClick={() =>
                        void handleRunKeywordMatch(item.title, item.subjectTitle)
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[10.5px] font-bold transition ${
                        activeKeywordLabel === item.title
                          ? "bg-[#FF5A36] border-[#FF5A36] text-white"
                          : "bg-[#111116] border-white/[0.1] text-slate-200 hover:border-[#FF5A36]/60"
                      }`}
                    >
                      [{item.subjectTitle}] {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 빈출 핵심 추천 키워드 칩 */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400">
                핵심 빈출 테마 빠른 선택
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TRAINING_KEYWORDS.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => void handleRunKeywordMatch(kw)}
                    className={`px-2.5 py-1 rounded-full border text-[10px] font-bold transition ${
                      activeKeywordLabel === kw
                        ? "bg-sky-500 border-sky-400 text-white"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-300 hover:text-white"
                    }`}
                  >
                    #{kw}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 매칭 결과 O/X 카드 */}
          {keywordLoading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF5A36]" />
              <span>관련 기출 지문 검색 중...</span>
            </div>
          ) : activeKeywordLabel ? (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="font-black text-white">
                  &quot;{activeKeywordLabel}&quot; 매칭 O/X ({keywordResults.length}개)
                </span>
                {usedTokens.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    키워드: {usedTokens.join(", ")}
                  </span>
                )}
              </div>

              {keywordResults.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#1A1A21] border border-dashed border-white/[0.12] text-center space-y-2">
                  <p className="text-xs font-bold text-slate-300">
                    &quot;{activeKeywordLabel}&quot;와 정확히 일치하는 기출 지문이 아직 없습니다.
                  </p>
                  <p className="text-[10.5px] text-slate-400">
                    더 짧은 핵심 명사(예: 장기수선, 하자, 사용검사, 감가상각)로 검색하거나 종이책 스캔을 이용해 보세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {keywordResults.map((opt) => {
                    const userChoice = smartOxAnswers[opt.id];
                    const isAnswered = userChoice !== undefined;
                    const isRight = isAnswered && userChoice === opt.isCorrect;

                    return (
                      <div
                        key={opt.id}
                        className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 font-black">
                            {opt.subject}
                            {opt.chapterTitle ? ` · ${opt.chapterTitle}` : ""}
                          </span>
                          <span className="font-mono text-slate-400">
                            {opt.examYear}년 {opt.questionNumber}번
                            {opt.repeatCount >= 2 && ` ·${opt.repeatCount}회`}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-white leading-relaxed">
                          &quot;{opt.statement}&quot;
                        </p>

                        {!isAnswered ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void handleSmartOxSelect(
                                  opt.id,
                                  opt.questionId,
                                  true,
                                  opt.isCorrect
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/35 text-emerald-300 text-[11px] font-black"
                            >
                              O (옳음)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleSmartOxSelect(
                                  opt.id,
                                  opt.questionId,
                                  false,
                                  opt.isCorrect
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/35 text-rose-300 text-[11px] font-black"
                            >
                              X (틀림)
                            </button>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-white/[0.08] space-y-1 text-[11px]">
                            <div className="flex items-center justify-between font-black">
                              <span
                                className={
                                  isRight ? "text-emerald-300" : "text-rose-300"
                                }
                              >
                                {isRight ? "정답! (+PMP)" : "오답!"}{" "}
                                (정답: {opt.isCorrect ? "O" : "X"})
                              </span>
                              {opt.citation && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {opt.citation}
                                </span>
                              )}
                            </div>
                            {opt.trapSummary && (
                              <div className="text-amber-300 font-bold">
                                {opt.trapSummary}
                              </div>
                            )}
                            {opt.amendedNote && (
                              <div className="text-emerald-300">
                                {opt.amendedNote}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* 상단 안내 카드 */}
          <section className="p-4 rounded-2xl bg-gradient-to-br from-[#23191A] to-[#15151B] border border-[#FF5A36]/40 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#FF5A36]/20 text-[#FF7A59] text-[10px] font-black">
                책 없이 앱 하나로 합격 완주
              </span>
              {!isLoggedIn && (
                <Link
                  href="/auth/login?next=/study/books"
                  className="text-[10.5px] font-black text-amber-300 hover:underline"
                >
                  로그인 시 기록·PMP 연동 →
                </Link>
              )}
            </div>
            <p className="text-xs text-slate-200 font-bold leading-relaxed">
              단원을 누르면 <span className="text-[#FF7A59]">핵심 이론·암기 수치·출제 함정·실제 기출 조문 O/X</span>가 바로 열립니다.
            </p>
          </section>

          {/* 과목 필터 & 검색 */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="단원명·키워드 검색 (예: 유치권, 장기수선, 하자)"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#16161C] border border-white/[0.08] text-xs text-white focus:border-[#FF5A36] focus:outline-none"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSubjectFilter("ALL")}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-black shrink-0 border transition ${
                  subjectFilter === "ALL"
                    ? "bg-[#FF5A36] text-white border-[#FF5A36]"
                    : "bg-[#1A1A21] text-slate-400 border-white/[0.08]"
                }`}
              >
                전체 (69)
              </button>
              {subjects.map((subj) => (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => setSubjectFilter(subj.id)}
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-black shrink-0 border transition ${
                    subjectFilter === subj.id
                      ? "bg-[#FF5A36] text-white border-[#FF5A36]"
                      : "bg-[#1A1A21] text-slate-400 border-white/[0.08]"
                  }`}
                >
                  [{subj.examStage}] {subj.shortTitle}
                </button>
              ))}
            </div>
          </div>

          {/* 과목 · 단원 트리 및 즉시 학습 아코디언 */}
          <div className="space-y-3">
            {filteredSubjects.map((subj) => (
              <section
                key={subj.id}
                className="rounded-2xl bg-[#1A1A21] border border-white/[0.06] overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-[#16161C] border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: subj.color }}
                    />
                    <span className="text-[10px] font-bold text-slate-400">
                      {subj.examStage}
                    </span>
                    <span className="text-xs font-black text-white">{subj.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {subj.units.reduce((acc, u) => acc + u.topics.length, 0)}단원
                  </span>
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {subj.units.map((unit) => (
                    <div key={unit.id} className="p-3 space-y-2">
                      <div className="text-[10.5px] font-extrabold text-slate-400 px-1">
                        {unit.title}
                      </div>

                      <div className="space-y-1.5">
                        {unit.topics.map((topic) => {
                          const isOpen = selectedTopic?.topic.id === topic.id;
                          const dbProg = topic.chapterCode
                            ? chapterTotals[topic.chapterCode]
                            : undefined;
                          const totalQ = topic.questionCount ?? 0;
                          const solvedQ = dbProg?.solvedCount ?? 0;
                          const hasNote = Boolean(getChapterConceptNote(topic.chapterCode));

                          return (
                            <div
                              key={topic.id}
                              className={`rounded-xl border transition ${
                                isOpen
                                  ? "bg-[#121218] border-[#FF5A36]/60 shadow-lg"
                                  : "bg-[#131318] border-white/[0.05] hover:border-white/[0.15]"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  void handleOpenTopicStudy(subj, unit.title, topic)
                                }
                                className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left"
                              >
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    {topic.topicNo && (
                                      <span
                                        className="text-[10.5px] font-mono font-black shrink-0"
                                        style={{ color: subj.color }}
                                      >
                                        {topic.topicNo}.
                                      </span>
                                    )}
                                    <span className="text-xs font-bold text-white truncate">
                                      {topic.title}
                                    </span>
                                    {hasNote && (
                                      <span className="px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 text-[9px] font-black shrink-0">
                                        핵심노트
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span>키워드: {topic.defaultKeyword}</span>
                                    {totalQ > 0 && (
                                      <span className="font-mono text-amber-300/90">
                                        기출 {totalQ}제 · 내풀이 {solvedQ}제
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {isOpen ? (
                                  <ChevronDown className="w-4 h-4 text-[#FF7A59] shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                                )}
                              </button>

                              {/* 확장된 단원 완결 학습 패널 */}
                              {isOpen && (
                                <div className="px-3 pb-3.5 pt-2 border-t border-white/[0.08] space-y-3">
                                  {/* 1. 핵심 개념 & 필수 암기 수치 */}
                                  {activeConceptNote ? (
                                    <div className="space-y-2.5">
                                      <div className="p-3 rounded-xl bg-[#1A1A23] border border-sky-500/30 space-y-2">
                                        <div className="text-[11px] font-black text-sky-300 flex items-center gap-1.5">
                                          <BookOpen className="w-3.5 h-3.5" />
                                          <span>핵심 이론 요약 (교재 기본서 대체)</span>
                                        </div>
                                        <ul className="space-y-1.5 text-[11.5px] text-slate-200 leading-relaxed">
                                          {activeConceptNote.corePoints.map((pt, i) => (
                                            <li key={i} className="flex items-start gap-1.5">
                                              <span className="text-sky-400 font-black mt-0.5">
                                                •
                                              </span>
                                              <span>{pt}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className="p-3 rounded-xl bg-[#1A1A23] border border-amber-500/30 space-y-2">
                                        <div className="text-[11px] font-black text-amber-300">
                                          시험 직전 필수 암기 수치 · 요건
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {activeConceptNote.mustNumbers.map((num, idx) => (
                                            <span
                                              key={idx}
                                              className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10.5px] font-bold text-amber-200"
                                            >
                                              {num}
                                            </span>
                                          ))}
                                        </div>
                                        <div className="pt-1.5 border-t border-white/[0.06] text-[11px] text-rose-200 flex items-start gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                          <span>
                                            <strong className="text-rose-300">함정주의: </strong>
                                            {activeConceptNote.examTrap}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-3 rounded-xl bg-[#1A1A23] border border-white/[0.08] text-[11px] text-slate-300">
                                      이 단원의 주요 출제 기출과 선지를 아래에서 바로 학습할 수 있습니다.
                                    </div>
                                  )}

                                  {/* 1-2. 2차 상세 이론서(.md) 전체 보기 버튼 */}
                                  {subj.examStage === "2차" && topic.chapterCode && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTheoryTarget({
                                          subject: subj.shortTitle,
                                          detailCode: topic.chapterCode,
                                          chapterTitle: topic.title,
                                        })
                                      }
                                      className="w-full py-2.5 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/35 text-xs font-bold text-indigo-200 flex items-center justify-center gap-2 transition"
                                    >
                                      <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                                      <span>2차 상세 이론서(.md 비교표·조문) 열기</span>
                                    </button>
                                  )}

                                  {/* 2. 실제 DB 기출 법령·함정 지문 O/X 즉시 훈련 */}
                                  {topic.chapterCode && (
                                    <div className="p-3 rounded-xl bg-[#171720] border border-white/[0.08] space-y-2.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-black text-[#FF7A59]">
                                          이 단원 실제 기출 핵심 지문 바로 점검
                                        </span>
                                        {chapterPacket && (
                                          <span className="text-[10px] font-mono text-slate-400">
                                            총 {chapterPacket.totalQuestions}제 · 개정{" "}
                                            {chapterPacket.amendedCount}건
                                          </span>
                                        )}
                                      </div>

                                      {packetLoading ? (
                                        <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                                          <Loader2 className="w-4 h-4 animate-spin text-[#FF5A36]" />
                                          <span>DB 기출 조문·지문 불러오는 중...</span>
                                        </div>
                                      ) : chapterPacket && chapterPacket.keyOptions.length > 0 ? (
                                        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                                          {chapterPacket.keyOptions.map((opt, idx) => {
                                            const userPick = miniOxAnswers[opt.id];
                                            const isAnswered = userPick !== undefined;
                                            const isRight = isAnswered && userPick === opt.isCorrect;

                                            return (
                                              <div
                                                key={opt.id}
                                                className={`p-2.5 rounded-xl border space-y-2 ${
                                                  isAnswered
                                                    ? isRight
                                                      ? "bg-emerald-950/35 border-emerald-500/40"
                                                      : "bg-rose-950/35 border-rose-500/40"
                                                    : "bg-[#111116] border-white/[0.06]"
                                                }`}
                                              >
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="text-[11px] text-slate-100 leading-relaxed flex-1">
                                                    <span className="font-mono font-black text-slate-400 mr-1">
                                                      {idx + 1}.
                                                    </span>
                                                    {opt.statement}
                                                  </div>
                                                  {opt.isAmended && (
                                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black shrink-0 flex items-center gap-0.5">
                                                      <BookCheck className="w-2.5 h-2.5" />
                                                      개정
                                                    </span>
                                                  )}
                                                </div>

                                                {!isAnswered ? (
                                                  <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[9.5px] text-slate-500 font-mono">
                                                      {opt.citation || `${opt.examYear}년 ${opt.questionNumber}번`}
                                                      {opt.repeatCount >= 2 && ` ·${opt.repeatCount}회 반복`}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          void handleMiniOxSelect(
                                                            opt.id,
                                                            opt.questionId,
                                                            true,
                                                            opt.isCorrect
                                                          )
                                                        }
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/35 text-emerald-300 text-[10px] font-black"
                                                      >
                                                        O (옳음)
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          void handleMiniOxSelect(
                                                            opt.id,
                                                            opt.questionId,
                                                            false,
                                                            opt.isCorrect
                                                          )
                                                        }
                                                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/35 text-rose-300 text-[10px] font-black"
                                                      >
                                                        X (틀림)
                                                      </button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="pt-1.5 border-t border-white/[0.08] space-y-1 text-[10.5px]">
                                                    <div className="flex items-center justify-between font-black">
                                                      <span
                                                        className={
                                                          isRight
                                                            ? "text-emerald-300"
                                                            : "text-rose-300"
                                                        }
                                                      >
                                                        {isRight ? "정답!" : "오답!"}{" "}
                                                        (정답: {opt.isCorrect ? "O" : "X"})
                                                      </span>
                                                      <span className="text-slate-400 font-mono">
                                                        {opt.citation}
                                                      </span>
                                                    </div>
                                                    {opt.trapSummary && (
                                                      <div className="text-amber-300 font-bold">
                                                        {opt.trapSummary}
                                                      </div>
                                                    )}
                                                    {opt.amendedNote && (
                                                      <div className="text-emerald-300">
                                                        {opt.amendedNote}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-slate-500">
                                          등록된 대표 지문이 없습니다. 아래 문제풀이로 이동해 학습해 보세요.
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* 3. 다음 학습 단계 원클릭 이동 */}
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {topic.chapterCode ? (
                                      <>
                                        <Link
                                          href={`/study/solve?chapter=${encodeURIComponent(
                                            topic.chapterCode
                                          )}`}
                                          className="py-2 px-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[10.5px] font-black flex items-center justify-center gap-1 text-center transition"
                                        >
                                          <ListChecks className="w-3.5 h-3.5 shrink-0" />
                                          <span>기출 20제</span>
                                        </Link>
                                        <Link
                                          href={`/study/ox?chapter=${encodeURIComponent(
                                            topic.chapterCode
                                          )}`}
                                          className="py-2 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-[10.5px] font-black flex items-center justify-center gap-1 text-center transition"
                                        >
                                          <Zap className="w-3.5 h-3.5 shrink-0" />
                                          <span>단원 O/X</span>
                                        </Link>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCenterTab("smart");
                                          void handleRunKeywordMatch(
                                            topic.title,
                                            subj.shortTitle
                                          );
                                        }}
                                        className="col-span-2 py-2 px-2 rounded-xl bg-[#FF5A36]/20 hover:bg-[#FF5A36]/30 border border-[#FF5A36]/45 text-[#FF8A6B] text-[10.5px] font-black flex items-center justify-center gap-1 transition"
                                      >
                                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                        <span>키워드 기출 O/X 매칭</span>
                                      </button>
                                    )}
                                    <Link
                                      href={`/?topic=${encodeURIComponent(topic.id)}`}
                                      className="py-2 px-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-[10.5px] font-black flex items-center justify-center gap-1 text-center transition"
                                    >
                                      <Play className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                                      <span>타이머</span>
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      <TheoryBottomSheet
        target={theoryTarget}
        onClose={() => setTheoryTarget(null)}
      />
    </MobileAppShell>
  );
}
