"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  KeyRound,
  Palette,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { SerialRegisterModal } from "@/components/auth/serial-register-modal";
import { getUserSerialStatusAction } from "@/app/actions/serial.actions";
import {
  CurriculumAddModal,
  type CurriculumAddStep,
} from "@/components/study/curriculum-add-modal";

/**
 * 마이(/study/more) > [내 서재] 통합 관리 패널
 * 시험일 D-Day · 정품 시리얼 · 다중 교재 선택 · 커스텀 책/과목/단원 구성 · 색상/보관함 단일 관리
 */
export function MyLibraryPanel() {
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
  } = useStudyCurriculum();

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

  const handleToggleBook = (bookId: string, title: string) => {
    const isCurrentlyActive = activeBookIds.includes(bookId);
    toggleBookActive(bookId);
    setPreviewBookId(bookId);
    showToast(
      isCurrentlyActive
        ? `「${title}」을(를) 서재로 뺐습니다 (기록·단원 보존됨).`
        : `「${title}」이(가) 플래너에 추가 적용되었습니다!`
    );
  };

  return (
    <div className="space-y-4">
      {toastMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 현재 커리큘럼 & 목표 시험일 */}
      <section className="p-4 rounded-2xl bg-gradient-to-br from-[#1E1B24] to-[#15151B] border border-[#FF5A36]/40 space-y-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2 py-0.5 rounded-full bg-[#FF5A36]/20 text-[#FF7A59] text-[10px] font-black">
            활성 서재 &amp; 시험 D-Day
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
          <p className="text-[11px] text-slate-400 mt-0.5">대표 교재: {activeBook.title}</p>
        </div>
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>목표 시험일 (DB 동기화)</span>
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.12] text-[11px] font-mono font-bold text-white"
          />
        </div>
      </section>

      {/* 종이 교재 정품 시리얼 (선택 사항) */}
      <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.08] flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-black text-white flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>종이 교재 정품 시리얼 (선택)</span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-0.5">
            시리얼 없이도 앱 내 개념·O/X·1,400제 모두 100% 이용 가능합니다.
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

      {/* 계층형 책 · 과목 · 단원 수동 구성 바 */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-white">다중 교재 선택 &amp; 커스텀 교재 추가</h3>
            <p className="text-[10px] text-emerald-300/90 mt-0.5">
              교재를 해제해도 기존 회독·계획 기록과 커스텀 단원은 안전하게 보존됩니다.
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-bold shrink-0">
            {activeBookIds.length}권 선택 / 총 {catalog.length}종
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1A1A21] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-black text-white flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>교재 · 과목 · 단원 직접 구성</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">드래그&amp;드롭 지원</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => openAddModal("book")}
              className="py-2.5 px-1.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[11px] font-black flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>책 추가</span>
            </button>
            <button
              type="button"
              onClick={() => openAddModal("subject")}
              className="py-2.5 px-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-200 text-[11px] font-black flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>과목</span>
            </button>
            <button
              type="button"
              onClick={() => openAddModal("topic")}
              className="py-2.5 px-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 text-[11px] font-black flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>단원</span>
            </button>
            <button
              type="button"
              onClick={() => openAddModal("organize")}
              className="py-2.5 px-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-200 text-[11px] font-black flex items-center justify-center gap-1 transition"
            >
              <GripVertical className="w-3.5 h-3.5 shrink-0" />
              <span>구조잡기</span>
            </button>
          </div>
        </div>

        {/* 교재 카탈로그 리스트 */}
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
                        {book.subjects.length}과목 · {topicCount}단원
                      </span>
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
                      <span>적용중 (해제)</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>플래너에 추가</span>
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
                        {subj.units
                          .flatMap((u) => u.topics)
                          .map((t) => (
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

      {/* 과목 색상 커스텀 · 보관함 */}
      <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-white">
            <Palette className="w-4 h-4 text-[#FF5A36]" />
            <span>과목 색상 · 분류 · 보관함</span>
          </div>
          <Link
            href="/study/planner"
            className="text-[10.5px] font-bold text-[#FF7A59] hover:underline"
          >
            플래너 보기 →
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
                <span className="text-xs font-bold text-white truncate">{subj.title}</span>
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

        {archivedSubjects.length > 0 && (
          <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
            <div className="text-[10.5px] font-black text-slate-400">
              보관된 과목 ({archivedSubjects.length})
            </div>
            {archivedSubjects.map((subj) => (
              <div
                key={subj.id}
                className="px-3 py-2 rounded-xl bg-[#111116]/60 border border-white/[0.04] flex items-center justify-between gap-2"
              >
                <span className="text-xs font-bold text-slate-400 truncate">{subj.title}</span>
                <button
                  type="button"
                  onClick={() => restoreSubject(subj.id)}
                  className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[10px] font-black flex items-center gap-1 shrink-0"
                >
                  <ArchiveRestore className="w-3 h-3" />
                  <span>복구</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <CurriculumAddModal
        isOpen={addModalState.open}
        initialStep={addModalState.step}
        initialBookId={addModalState.bookId}
        initialSubjectId={addModalState.subjectId}
        catalog={catalog}
        activeBookIds={activeBookIds}
        onToggleBookActive={toggleBookActive}
        subjects={subjects}
        categories={categories}
        onClose={() => setAddModalState((prev) => ({ ...prev, open: false }))}
        onAddBook={(params) => {
          const newId = addCustomBook(params);
          showToast(`「${params.title}」 교재가 추가되어 플래너에 적용되었습니다!`);
          return newId;
        }}
        onAddSubject={(params) => {
          const res = addCustomSubject(params);
          showToast(`「${params.title}」 과목이 추가되었습니다!`);
          return res;
        }}
        onAddTopicsBulk={(unitId, titles, estMin) => {
          addCustomTopicsBulk(unitId, titles, estMin);
          showToast(`단원 ${titles.length}개가 추가되었습니다!`);
        }}
        onReplaceBookStructure={(bookId, nextSubjects, cat) => {
          replaceCustomBookStructure(bookId, nextSubjects, cat);
          showToast("커스텀 교재의 과목·단원 구조가 업데이트되었습니다!");
        }}
      />

      <SerialRegisterModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        onSuccess={() => {
          setIsSerialVerified(true);
          showToast("정품 시리얼 인증이 완료되었습니다!");
        }}
      />
    </div>
  );
}
