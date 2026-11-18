"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookCheck,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  KeyRound,
  Lightbulb,
  ListChecks,
  Loader2,
  Play,
  Plus,
  Search,
  Sparkles,
  X,
  Zap,
  Check,
  Trash2,
  Archive,
  ArchiveRestore,
  Palette,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { useStudyAuth } from "@/components/auth/study-auth-provider";
import { SerialRegisterModal } from "@/components/auth/serial-register-modal";
import { getUserSerialStatusAction } from "@/app/actions/serial.actions";
import {
  TheoryBottomSheet,
  type TheorySheetTarget,
} from "@/components/study/theory-bottom-sheet";
import {
  CurriculumAddModal,
  type CurriculumAddStep,
} from "@/components/study/curriculum-add-modal";
import {
  fetchChapterStudyPacketAction,
  type ChapterStudyPacketResult,
} from "@/app/actions/exam-study.actions";
import { grantAppStudyPmpAction } from "@/app/actions/study-economy.actions";
import { getChapterConceptNote } from "@/data/study-concept-notes";
import {
  type StudySubjectNode,
  type StudyTopicNode,
} from "@/data/study-textbooks";

type CenterTab = "concept" | "settings";

export default function AppStandaloneStudyCenterPage() {
  const {
    activeBook,
    activeBooks,
    activeBookIds,
    catalog,
    subjects,
    archivedSubjects,
    categories,
    examDate,
    setExamDate,
    toggleBookActive,
    addCustomBook,
    replaceCustomBookStructure,
    deleteCustomBook,
    addCustomSubject,
    updateSubjectCustomization,
    archiveSubject,
    restoreSubject,
    addCustomTopicsBulk,
    chapterTotals,
  } = useStudyCurriculum();
  const { isLoggedIn, effectiveOwnerKey, adjustLocalPmpBalance, setLocalPmpBalance } =
    useStudyAuth();

  const [centerTab, setCenterTab] = useState<CenterTab>("concept");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // 기존 교재 설정/시리얼/커스텀 과목 보조 상태
  const [previewBookId, setPreviewBookId] = useState<string | null>(activeBook.id);
  const [addModalState, setAddModalState] = useState<{
    open: boolean;
    step: CurriculumAddStep;
    bookId?: string;
    subjectId?: string;
  }>({ open: false, step: "book" });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSerialVerified, setIsSerialVerified] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);

  const openAddModal = (step: CurriculumAddStep, bookId?: string, subjectId?: string) => {
    setAddModalState({
      open: true,
      step,
      bookId: bookId || activeBooks[0]?.id || catalog[0]?.id,
      subjectId,
    });
  };

  useEffect(() => {
    void getUserSerialStatusAction().then((res) => {
      if (res.isRegistered) setIsSerialVerified(true);
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    globalThis.setTimeout(() => setToastMsg(null), 3500);
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
    selectedTrue: boolean,
    actualTrue: boolean
  ) => {
    if (miniOxAnswers[optId] !== undefined) return;
    setMiniOxAnswers((prev) => ({ ...prev, [optId]: selectedTrue }));

    if (selectedTrue === actualTrue && isLoggedIn) {
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

  const handleToggleBook = (bookId: string, title: string) => {
    const isCurrentlyActive = activeBookIds.includes(bookId);
    toggleBookActive(bookId);
    setPreviewBookId(bookId);
    showToast(
      isCurrentlyActive
        ? `「${title}」을(를) 서재로 뺐습니다 (기록·단원 보존됨).`
        : `「${title}」이(가) 다중 교재에 추가 적용되었습니다!`
    );
  };

  return (
    <MobileAppShell>
      {/* 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#FF5A36]" />
          <h1 className="text-sm font-black text-white">교재없는 단원별 학습센터</h1>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 text-[10px] font-black">
          앱 단독 100% 무료
        </span>
      </header>

      {/* 서브 탭 스위처 */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0D0D11] border border-white/[0.08] text-[11px] font-black">
          <button
            type="button"
            onClick={() => setCenterTab("concept")}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1 ${
              centerTab === "concept"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>69단원 개념·기출 학습</span>
          </button>
          <button
            type="button"
            onClick={() => setCenterTab("settings")}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1 ${
              centerTab === "settings"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>시험일 · 교재설정(선택)</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {centerTab === "concept" ? (
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
                                          🔢 시험 직전 필수 암기 수치 · 요건
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
                                          ⚖️ 이 단원 실제 기출 핵심 지문 바로 점검
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
                                                      {opt.repeatCount >= 2 && ` · 🔥${opt.repeatCount}회 반복`}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          void handleMiniOxSelect(
                                                            opt.id,
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
                                                        {isRight ? "✅ 정답!" : "❌ 오답!"}{" "}
                                                        (정답: {opt.isCorrect ? "O" : "X"})
                                                      </span>
                                                      <span className="text-slate-400 font-mono">
                                                        {opt.citation}
                                                      </span>
                                                    </div>
                                                    {opt.trapSummary && (
                                                      <div className="text-amber-300 font-bold">
                                                        💡 {opt.trapSummary}
                                                      </div>
                                                    )}
                                                    {opt.amendedNote && (
                                                      <div className="text-emerald-300">
                                                        🔄 {opt.amendedNote}
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
                                      <div className="col-span-2" />
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
      ) : (
        /* ② 시험일 · 교재 연동 설정(선택 사항) */
        <div className="px-4 py-4 space-y-5">
          <section className="p-4 rounded-2xl bg-gradient-to-br from-[#1E1B24] to-[#15151B] border border-[#FF5A36]/40 space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#FF5A36]/20 text-[#FF7A59] text-[10px] font-black">
                현재 커리큘럼 &amp; D-Day
              </span>
              <Link
                href="/study/planner"
                className="text-[11px] font-black text-[#FF7A59] flex items-center gap-1 hover:underline"
              >
                <span>플래너 매트릭스 열기</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                {activeBooks.map((b) => b.badge).join(" + ")} ({activeBooks.length}권 동시 적용중)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                대표 교재: {activeBook.title}
              </p>
            </div>
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span>목표 시험일 (로그인 시 DB 동기화)</span>
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.12] text-[11px] font-mono font-bold text-white"
              />
            </div>
          </section>

          <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>종이 교재 정품 시리얼 (선택 사항)</span>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                시리얼이 없어도 앱 내 개념·O/X·1,400제 모두 100% 학습 가능합니다.
              </p>
            </div>
            {isSerialVerified ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[10px] font-black shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                인증됨
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsSerialModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-amber-300 text-[10.5px] font-black shrink-0"
              >
                시리얼 등록
              </button>
            )}
          </section>

          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white">
                  다중 교재 선택 &amp; 커스텀 교재 추가
                </h3>
                <p className="text-[10px] text-emerald-300/90 mt-0.5">
                  교재를 해제(서재로 빼기)해도 기존 회독·계획 기록과 추가 단원은 안전하게 보존됩니다.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-bold shrink-0">
                {activeBookIds.length}권 선택 / 총 {catalog.length}종
              </span>
            </div>

            {/* 계층형 책 · 과목 · 단원 추가 바 */}
            <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black text-white flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>ISBN 책 검색 · 계층형 목차 추가</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  책 → 과목 → 단원
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => openAddModal("book")}
                  className="py-2.5 px-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[11px] font-black flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>책 추가(ISBN)</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAddModal("subject")}
                  className="py-2.5 px-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-200 text-[11px] font-black flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>과목 추가</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAddModal("topic")}
                  className="py-2.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 text-[11px] font-black flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>단원 추가</span>
                </button>
              </div>
            </div>

            {catalog.map((book) => {
              const isActive = activeBookIds.includes(book.id);
              const isCustomBook = book.id.startsWith("custom-book-");
              const isPreviewOpen = previewBookId === book.id;
              const topicCount = book.subjects.reduce(
                (acc, s) => acc + s.units.reduce((uAcc, u) => uAcc + u.topics.length, 0),
                0
              );

              return (
                <div
                  key={book.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    isActive
                      ? "bg-[#1B1922] border-[#FF5A36]/60 shadow-md"
                      : "bg-[#1A1A21] border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {book.coverImageUrl && (
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="w-11 h-15 object-cover rounded-lg border border-white/15 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded-md text-[9.5px] font-black text-white"
                            style={{ backgroundColor: book.coverColor }}
                          >
                            {book.badge}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {book.subjects.length}과목 · {topicCount}세부목차
                          </span>
                          {book.isbn && (
                            <span className="text-[9.5px] font-mono text-slate-500">
                              ISBN {book.isbn}
                            </span>
                          )}
                        </div>
                        {isCustomBook && (
                          <button
                            type="button"
                            onClick={() => deleteCustomBook(book.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400"
                            title="커스텀 교재 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-white">{book.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-snug">{book.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewBookId(isPreviewOpen ? null : book.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#111116] border border-white/[0.08] text-[10.5px] font-bold text-slate-300 hover:text-white flex items-center gap-1"
                      >
                        {isPreviewOpen ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        <span>목차</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddModal("subject", book.id)}
                        className="px-2 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-[10px] font-black text-sky-200 hover:bg-sky-500/25"
                      >
                        + 과목
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddModal("topic", book.id)}
                        className="px-2 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-emerald-200 hover:bg-emerald-500/25"
                      >
                        + 단원
                      </button>
                      {isCustomBook && (
                        <button
                          type="button"
                          onClick={() => openAddModal("organize", book.id)}
                          className="px-2 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[10px] font-black text-amber-200 hover:bg-amber-500/25"
                        >
                          구조잡기
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBook(book.id, book.title)}
                      className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 border transition ${
                        isActive
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : "bg-[#FF5A36] hover:bg-[#ff6d4d] border-[#FF5A36] text-white"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>함께 적용중 (해제)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>교재 추가 적용</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isPreviewOpen && (
                    <div className="pt-2.5 border-t border-white/[0.06] space-y-2">
                      {book.subjects.map((subj) => (
                        <div key={subj.id} className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10.5px] font-black text-white">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: subj.color }}
                            />
                            <span className="text-slate-400">[{subj.examStage}]</span>
                            <span>{subj.title}</span>
                          </div>
                          <div className="pl-3 flex flex-wrap gap-1">
                            {subj.units.flatMap((u) => u.topics).map((t) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded-md bg-[#111116] border border-white/[0.06] text-[9.5px] text-slate-300"
                              >
                                {t.topicNo ? `${t.topicNo}. ` : ""}
                                {t.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-white">
                <Palette className="w-4 h-4 text-[#FF5A36]" />
                <span>과목 색상 커스텀 · 보관함 관리</span>
              </div>
              <Link
                href="/study/planner"
                className="text-[10.5px] font-bold text-[#FF7A59] hover:underline"
              >
                플래너에서 상세편집 →
              </Link>
            </div>

            <div className="space-y-1.5">
              {subjects.map((subj) => (
                <div
                  key={subj.id}
                  className="px-3 py-2 rounded-xl bg-[#111116] border border-white/[0.06] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="color"
                      value={subj.color}
                      onChange={(e) =>
                        updateSubjectCustomization(subj.id, { color: e.target.value })
                      }
                      className="w-5 h-5 rounded-full bg-transparent cursor-pointer shrink-0"
                      title="과목 색상 변경"
                    />
                    <span className="text-xs font-bold text-white truncate">
                      {subj.title}
                    </span>
                    <select
                      value={
                        subj.category ||
                        (subj.examStage === "1차" ? "주택관리사 1차" : "주택관리사 2차")
                      }
                      onChange={(e) =>
                        updateSubjectCustomization(subj.id, { category: e.target.value })
                      }
                      className="px-1.5 py-0.5 rounded bg-[#181822] border border-white/[0.1] text-[9.5px] font-bold text-slate-300 shrink-0"
                      title="과목 분류 변경"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => archiveSubject(subj.id)}
                    className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[10px] font-bold text-slate-300 flex items-center gap-1 shrink-0"
                  >
                    <Archive className="w-3 h-3" />
                    <span>보관</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAddModal("subject")}
                className="flex-1 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-200 text-xs font-black flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>책에 과목 추가</span>
              </button>
              <button
                type="button"
                onClick={() => openAddModal("topic")}
                className="flex-1 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 text-xs font-black flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>과목에 단원 추가</span>
              </button>
            </div>

            {archivedSubjects.length > 0 && (
              <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                <div className="text-[10.5px] font-black text-slate-400">
                  보관함 ({archivedSubjects.length})
                </div>
                {archivedSubjects.map((subj) => (
                  <div
                    key={subj.id}
                    className="px-3 py-1.5 rounded-xl bg-[#101015] border border-white/[0.05] flex items-center justify-between gap-2"
                  >
                    <span className="text-[11px] font-bold text-slate-400 truncate">
                      {subj.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => restoreSubject(subj.id)}
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-black flex items-center gap-1"
                    >
                      <ArchiveRestore className="w-3 h-3" />
                      <span>꺼내기</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <CurriculumAddModal
        isOpen={addModalState.open}
        initialStep={addModalState.step}
        initialBookId={addModalState.bookId}
        initialSubjectId={addModalState.subjectId}
        onClose={() => setAddModalState((prev) => ({ ...prev, open: false }))}
        catalog={catalog}
        subjects={subjects}
        categories={categories}
        onAddBook={(params) => {
          const newId = addCustomBook(params);
          showToast(`교재 「${params.title}」이(가) 추가되었습니다.`);
          return newId;
        }}
        onAddSubject={(params) => {
          const res = addCustomSubject(params);
          showToast(`과목 「${params.title}」이(가) 책에 연결되었습니다.`);
          return res;
        }}
        onAddTopicsBulk={(unitId, titles, estMin) => {
          addCustomTopicsBulk(unitId, titles, estMin);
          showToast(`${titles.length}개 단원이 목차에 추가되었습니다.`);
        }}
        onReplaceBookStructure={(bookId, nextSubjects, cat) => {
          replaceCustomBookStructure(bookId, nextSubjects, cat);
          showToast("드래그&드롭으로 편집한 목차 구조가 저장되었습니다.");
        }}
      />

      <SerialRegisterModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        onSuccess={() => {
          setIsSerialVerified(true);
          showToast("정품 교재 시리얼이 인증되었습니다!");
        }}
      />

      <TheoryBottomSheet
        target={theoryTarget}
        onClose={() => setTheoryTarget(null)}
      />
    </MobileAppShell>
  );
}
