"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  FolderPlus,
  GripVertical,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import {
  CUSTOM_SUBJECT_COLOR_PALETTE,
  type StudySubjectNode,
  type TextbookCatalogItem,
} from "@/data/study-textbooks";
import type { CustomBookSubjectInput } from "@/lib/study-curriculum-store";
import type { ParsedTocSubject } from "@/app/api/books/parse-toc/route";
import {
  TocDragBuilder,
  createDraftNode,
  draftNodesToSubjectInputs,
  parseRawLinesToDraftNodes,
  subjectsToDraftNodes,
  type TocDraftNode,
} from "@/components/study/toc-drag-builder";

export type CurriculumAddStep = "book" | "subject" | "topic" | "organize";

interface CurriculumAddModalProps {
  isOpen: boolean;
  initialStep?: CurriculumAddStep;
  initialBookId?: string;
  initialSubjectId?: string;
  onClose: () => void;
  catalog: TextbookCatalogItem[];
  subjects: StudySubjectNode[];
  categories: string[];
  onAddBook: (params: {
    title: string;
    subtitle?: string;
    badge?: string;
    coverColor: string;
    isbn?: string;
    author?: string;
    publisher?: string;
    coverImageUrl?: string;
    examStage?: "1차" | "2차";
    category?: string;
    subjects?: CustomBookSubjectInput[];
  }) => string;
  onAddSubject: (params: {
    title: string;
    examStage?: "1차" | "2차";
    category?: string;
    color: string;
    bookId?: string;
    topicTitles?: string[];
  }) => { subjectId: string; unitId: string } | null;
  onAddTopicsBulk: (unitId: string, titles: string[], estimatedMinutes?: number) => void;
  onReplaceBookStructure?: (
    bookId: string,
    subjects: CustomBookSubjectInput[],
    category?: string
  ) => void;
}

function parsedSubjectsToDraftNodes(parsed: ParsedTocSubject[]): TocDraftNode[] {
  const list: TocDraftNode[] = [];
  for (const s of parsed) {
    list.push(createDraftNode(0, s.title, { color: s.color }));
    for (const u of s.units) {
      if (u.title && u.title !== "기본 목차") {
        list.push(createDraftNode(1, u.title));
      }
      for (const t of u.topics) {
        list.push(
          createDraftNode(2, t.title, { estimatedMinutes: t.estimatedMinutes })
        );
      }
    }
  }
  return list;
}

export function CurriculumAddModal({
  isOpen,
  initialStep = "book",
  initialBookId,
  initialSubjectId,
  onClose,
  catalog,
  subjects,
  categories,
  onAddBook,
  onAddSubject,
  onAddTopicsBulk,
  onReplaceBookStructure,
}: CurriculumAddModalProps) {
  const [step, setStep] = useState<CurriculumAddStep>(initialStep);

  // ==========================================================
  // STEP 1: 책 추가 (수동 책 생성 기본 + 드래그&드롭 목차 빌더)
  // ==========================================================
  const [tocNotice, setTocNotice] = useState<string | null>(null);
  const [tocError, setTocError] = useState<string | null>(null);

  const [bookTitle, setBookTitle] = useState("");
  const [bookBadge, setBookBadge] = useState("");
  const [bookCategory, setBookCategory] = useState<string>(
    categories[1] || categories[0] || "주택관리사 2차"
  );
  const [bookColor, setBookColor] = useState<string>("#FF5A36");

  const [defaultSubjForBook, setDefaultSubjForBook] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [rawTocText, setRawTocText] = useState("");
  const [tocParsing, setTocParsing] = useState(false);
  const [bookDraftNodes, setBookDraftNodes] = useState<TocDraftNode[]>([]);
  const tocImageInputRef = useRef<HTMLInputElement | null>(null);

  // ==========================================================
  // STEP 2: 과목 추가 (반드시 책 선택)
  // ==========================================================
  const [targetBookIdForSubj, setTargetBookIdForSubj] = useState<string>(
    initialBookId || catalog[0]?.id || ""
  );
  const [newSubjTitle, setNewSubjTitle] = useState("");
  const [newSubjCategory, setNewSubjCategory] = useState<string>(
    categories[1] || categories[0] || "주택관리사 2차"
  );
  const [newSubjColor, setNewSubjColor] = useState<string>(
    CUSTOM_SUBJECT_COLOR_PALETTE[0]
  );
  const [newSubjTopicsRaw, setNewSubjTopicsRaw] = useState("");

  // ==========================================================
  // STEP 3: 단원 추가 (책 -> 과목 -> 대단원 계층 선택)
  // ==========================================================
  const [targetBookIdForTopic, setTargetBookIdForTopic] = useState<string>(
    initialBookId || catalog[0]?.id || ""
  );
  const [targetSubjectIdForTopic, setTargetSubjectIdForTopic] = useState<string>(
    initialSubjectId || ""
  );
  const [targetUnitIdForTopic, setTargetUnitIdForTopic] = useState<string>("");
  const [newTopicsRaw, setNewTopicsRaw] = useState("");
  const [newTopicEstMinutes, setNewTopicEstMinutes] = useState<number>(35);

  // ==========================================================
  // STEP 4: 기존 커스텀 책 목차 구조 드래그&드롭 재편집
  // ==========================================================
  const customBooks = useMemo(
    () => catalog.filter((b) => b.id.startsWith("custom-book-")),
    [catalog]
  );
  const [organizeBookId, setOrganizeBookId] = useState<string>("");
  const [organizeNodes, setOrganizeNodes] = useState<TocDraftNode[]>([]);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // 모달 열릴 때 초기 상태 동기화
  useEffect(() => {
    if (!isOpen) return;
    setStep(initialStep);
    setFeedbackMsg(null);
    setTocError(null);
    setTocNotice(null);
    const defaultBook = initialBookId || catalog[0]?.id || "";
    setTargetBookIdForSubj(defaultBook);
    setTargetBookIdForTopic(defaultBook);
    if (initialSubjectId) {
      setTargetSubjectIdForTopic(initialSubjectId);
    }

    const defaultCustomBook =
      (initialBookId && initialBookId.startsWith("custom-book-")
        ? initialBookId
        : customBooks[0]?.id) || "";
    setOrganizeBookId(defaultCustomBook);
  }, [isOpen, initialStep, initialBookId, initialSubjectId, catalog, customBooks]);

  // organizeBookId가 바뀔 때 해당 책의 현재 과목·대단원·단원을 블록 리스트로 로드
  useEffect(() => {
    if (!isOpen || step !== "organize" || !organizeBookId) return;
    const book = catalog.find((b) => b.id === organizeBookId);
    if (!book) {
      setOrganizeNodes([]);
      return;
    }
    setOrganizeNodes(subjectsToDraftNodes(book.subjects));
  }, [isOpen, step, organizeBookId, catalog]);

  // 선택된 책에 속한 과목들
  const subjectsInSelectedBook = useMemo(() => {
    const activeMatched = subjects.filter((s) => s.bookId === targetBookIdForTopic);
    if (activeMatched.length > 0) return activeMatched;
    const book = catalog.find((b) => b.id === targetBookIdForTopic);
    return book?.subjects || [];
  }, [subjects, catalog, targetBookIdForTopic]);

  useEffect(() => {
    if (subjectsInSelectedBook.length === 0) {
      setTargetSubjectIdForTopic("");
      setTargetUnitIdForTopic("");
      return;
    }
    if (!subjectsInSelectedBook.some((s) => s.id === targetSubjectIdForTopic)) {
      setTargetSubjectIdForTopic(subjectsInSelectedBook[0].id);
    }
  }, [subjectsInSelectedBook, targetSubjectIdForTopic]);

  const unitsInSelectedSubject = useMemo(() => {
    const subj = subjectsInSelectedBook.find((s) => s.id === targetSubjectIdForTopic);
    return subj?.units || [];
  }, [subjectsInSelectedBook, targetSubjectIdForTopic]);

  useEffect(() => {
    if (unitsInSelectedSubject.length === 0) {
      setTargetUnitIdForTopic("");
      return;
    }
    if (!unitsInSelectedSubject.some((u) => u.id === targetUnitIdForTopic)) {
      setTargetUnitIdForTopic(unitsInSelectedSubject[0].id);
    }
  }, [unitsInSelectedSubject, targetUnitIdForTopic]);

  if (!isOpen) return null;

  const handleParseTocTextToBuilder = async () => {
    if (!rawTocText.trim()) return;
    setTocParsing(true);
    setTocError(null);
    setTocNotice(null);
    try {
      const res = await fetch("/api/books/parse-toc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: rawTocText,
          bookTitle,
          defaultSubjectTitle: defaultSubjForBook.trim() || "기본 과목",
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        subjects?: ParsedTocSubject[];
        engine?: "gemini" | "rule";
        error?: string;
      };
      if (data.success && data.subjects && data.subjects.length > 0) {
        setBookDraftNodes(parsedSubjectsToDraftNodes(data.subjects));
        setShowPasteBox(false);
      } else {
        setBookDraftNodes(parseRawLinesToDraftNodes(rawTocText));
        setShowPasteBox(false);
      }
    } catch {
      setBookDraftNodes(parseRawLinesToDraftNodes(rawTocText));
      setShowPasteBox(false);
    } finally {
      setTocParsing(false);
    }
  };

  const handleTocImageUpload = async (file: File) => {
    setTocParsing(true);
    setTocError(null);
    setTocNotice(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          const commaIdx = result.indexOf(",");
          resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
        };
        reader.onerror = () => reject(new Error("파일 읽기 실패"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/books/parse-toc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
          bookTitle,
          defaultSubjectTitle: defaultSubjForBook.trim() || "기본 과목",
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        subjects?: ParsedTocSubject[];
        error?: string;
      };
      if (data.success && data.subjects && data.subjects.length > 0) {
        const converted = parsedSubjectsToDraftNodes(data.subjects);
        setBookDraftNodes(converted);
        setTocNotice(
          `목차 사진에서 ${converted.length}개 블록을 추출했습니다. 드래그하여 순서·단계를 자유롭게 다듬어 보세요.`
        );
      } else {
        setTocError(
          data.error || "목차 사진에서 단원을 추출하지 못했습니다. 직접 줄을 추가해 주세요."
        );
      }
    } catch {
      setTocError("목차 이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setTocParsing(false);
    }
  };

  const handleSubmitBook = async () => {
    if (!bookTitle.trim()) return;

    const effectiveNodes =
      bookDraftNodes.length > 0
        ? bookDraftNodes
        : rawTocText.trim()
          ? parseRawLinesToDraftNodes(rawTocText)
          : [];

    let finalSubjects: CustomBookSubjectInput[] | undefined;

    if (effectiveNodes.length > 0) {
      finalSubjects = draftNodesToSubjectInputs({
        nodes: effectiveNodes,
        defaultSubjectTitle: defaultSubjForBook.trim() || "기본 과목",
        defaultColor: bookColor,
        category: bookCategory,
      });
    } else if (defaultSubjForBook.trim()) {
      finalSubjects = [
        {
          title: defaultSubjForBook.trim(),
          color: bookColor,
          examStage: bookCategory.includes("1차") ? "1차" : "2차",
          category: bookCategory,
          units: [{ title: "기본 목차", topics: [] }],
        },
      ];
    }

    const createdBookId = onAddBook({
      title: bookTitle.trim(),
      badge: bookBadge.trim() || bookTitle.trim().slice(0, 6),
      coverColor: bookColor,
      examStage: bookCategory.includes("1차") ? "1차" : "2차",
      category: bookCategory,
      subjects: finalSubjects,
    });

    const addedTopicCount =
      finalSubjects?.reduce(
        (acc, s) => acc + s.units.reduce((uAcc, u) => uAcc + u.topics.length, 0),
        0
      ) ?? 0;

    const savedBookTitle = bookTitle.trim();
    setBookTitle("");
    setBookBadge("");
    setDefaultSubjForBook("");
    setRawTocText("");
    setBookDraftNodes([]);
    setTocNotice(null);
    setTocError(null);

    if (addedTopicCount > 0) {
      onClose();
      return;
    }

    if (createdBookId) {
      setTargetBookIdForSubj(createdBookId);
      setTargetBookIdForTopic(createdBookId);
      setOrganizeBookId(createdBookId);
    }
    setFeedbackMsg(
      `「${savedBookTitle}」 책이 추가되었습니다! 이어서 과목·단원을 구성해 보세요.`
    );
    setStep(finalSubjects && finalSubjects.length > 0 ? "topic" : "subject");
  };

  const handleSubmitSubject = () => {
    if (!targetBookIdForSubj || !newSubjTitle.trim()) return;
    const topicLines = newSubjTopicsRaw
      .split(/\r?\n|,/)
      .map((l) => l.trim())
      .filter(Boolean);

    const created = onAddSubject({
      title: newSubjTitle.trim(),
      examStage: newSubjCategory.includes("1차") ? "1차" : "2차",
      category: newSubjCategory,
      color: newSubjColor,
      bookId: targetBookIdForSubj,
      topicTitles: topicLines,
    });

    const savedTitle = newSubjTitle.trim();
    setNewSubjTitle("");
    setNewSubjTopicsRaw("");

    if (topicLines.length > 0) {
      onClose();
      return;
    }

    if (created) {
      setTargetBookIdForTopic(targetBookIdForSubj);
      setTargetSubjectIdForTopic(created.subjectId);
      setTargetUnitIdForTopic(created.unitId);
    }
    setFeedbackMsg(`「${savedTitle}」 과목이 추가되었습니다! 이제 단원을 입력해 주세요.`);
    setStep("topic");
  };

  const handleSubmitTopics = () => {
    if (!targetUnitIdForTopic) return;
    const lines = newTopicsRaw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    onAddTopicsBulk(targetUnitIdForTopic, lines, newTopicEstMinutes);
    setNewTopicsRaw("");
    onClose();
  };

  const handleSaveOrganize = () => {
    if (!organizeBookId || !onReplaceBookStructure) return;
    const book = catalog.find((b) => b.id === organizeBookId);
    const firstCat = book?.subjects[0]?.category || categories[1] || "주택관리사 2차";
    const built = draftNodesToSubjectInputs({
      nodes: organizeNodes,
      defaultSubjectTitle: "기본 과목",
      defaultColor: book?.coverColor || "#FF5A36",
      category: firstCat,
    });
    onReplaceBookStructure(organizeBookId, built, firstCat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-[470px] max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0D0D11] border border-white/[0.12] p-4 space-y-4 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#FF5A36]" />
              <span>교재 · 과목 · 단원 구성</span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              책을 직접 만들고, 드래그&amp;드롭으로 과목·대단원·단원 구조를 자유롭게 잡으세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4단계 탭 (책 추가 → 과목 추가 → 단원 추가 | 목차 구조잡기) */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-0.5 p-1 rounded-xl bg-[#16161C] border border-white/[0.06] text-[10px] font-black">
          <button
            type="button"
            onClick={() => setStep("book")}
            className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
              step === "book"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3 h-3 shrink-0" />
            <span className="truncate">1.책추가</span>
          </button>
          <ChevronRight className="w-2.5 h-2.5 text-slate-600" />
          <button
            type="button"
            onClick={() => setStep("subject")}
            className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
              step === "subject"
                ? "bg-sky-500 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FolderPlus className="w-3 h-3 shrink-0" />
            <span className="truncate">2.과목</span>
          </button>
          <ChevronRight className="w-2.5 h-2.5 text-slate-600" />
          <button
            type="button"
            onClick={() => setStep("topic")}
            className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
              step === "topic"
                ? "bg-emerald-500 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3 h-3 shrink-0" />
            <span className="truncate">3.단원</span>
          </button>
          <span className="w-[1px] h-4 bg-white/[0.08] mx-0.5" />
          <button
            type="button"
            onClick={() => setStep("organize")}
            className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
              step === "organize"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GripVertical className="w-3 h-3 shrink-0" />
            <span className="truncate">구조잡기</span>
          </button>
        </div>

        {feedbackMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 1: 책 추가 (수동 입력 기본 + 드래그&드롭 목차 빌더) */}
        {/* ========================================================== */}
        {step === "book" && (
          <div className="space-y-3">
            {/* 책 기본 정보 (수동 생성 기본) */}
            <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5">
              <div className="text-[11px] font-black text-white flex items-center justify-between">
                <span>책 기본 정보</span>
                <span className="text-[9.5px] font-bold text-slate-400">
                  제목만 입력해도 바로 추가 가능
                </span>
              </div>

              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="책 제목 (예: 2026 에듀윌 주택관리사 2차 기출문제집)"
                className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36]"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={bookBadge}
                  onChange={(e) => setBookBadge(e.target.value)}
                  placeholder="짧은 이름 (예: 에듀윌2차)"
                  className="px-3 py-1.5 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-[11px] text-white"
                />
                <select
                  value={bookCategory}
                  onChange={(e) => setBookCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-[11px] font-bold text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">표지 색:</span>
                {CUSTOM_SUBJECT_COLOR_PALETTE.slice(0, 7).map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setBookColor(hex)}
                    className={`w-4 h-4 rounded-full border ${
                      bookColor === hex
                        ? "border-white scale-110 ring-1 ring-white"
                        : "border-white/20"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <input
                  type="color"
                  value={bookColor}
                  onChange={(e) => setBookColor(e.target.value)}
                  className="w-6 h-5 bg-transparent cursor-pointer"
                />
              </div>
            </div>

            {/* 목차 구조 잡기 (드래그&드롭 빌더 + 붙여넣기/사진스캔) */}
            <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[11px] font-black text-white">
                  목차 구조 잡기 (선택 · 나중에 편집 가능)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPasteBox((prev) => !prev)}
                    className="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-200 text-[10px] font-black transition"
                  >
                    {showPasteBox ? "붙여넣기 닫기" : "텍스트 붙여넣기"}
                  </button>
                  <input
                    ref={tocImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleTocImageUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => tocImageInputRef.current?.click()}
                    disabled={tocParsing}
                    className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-[10px] font-black flex items-center gap-1 transition"
                  >
                    {tocParsing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                    <span>목차 사진 스캔</span>
                  </button>
                </div>
              </div>

              {tocNotice && (
                <div className="p-2 rounded-xl bg-sky-950/50 border border-sky-500/30 text-[10px] text-sky-200 leading-relaxed">
                  {tocNotice}
                </div>
              )}
              {tocError && (
                <div className="p-2 rounded-xl bg-rose-950/50 border border-rose-500/30 text-[10px] text-rose-200 leading-relaxed">
                  {tocError}
                </div>
              )}

              {showPasteBox && (
                <div className="p-2.5 rounded-xl bg-[#0E0E12] border border-sky-500/30 space-y-2">
                  <input
                    type="text"
                    value={defaultSubjForBook}
                    onChange={(e) => setDefaultSubjForBook(e.target.value)}
                    placeholder="기본 과목명 (선택 · 예: 주택관리관계법규)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#16161D] border border-white/[0.1] text-[10.5px] text-white"
                  />
                  <textarea
                    rows={4}
                    value={rawTocText}
                    onChange={(e) => setRawTocText(e.target.value)}
                    placeholder={`서점 목차를 복사해 붙여넣거나 한 줄씩 입력한 뒤 [블록으로 변환]을 누르세요.\n예:\n주택관리관계법규\nPART 01 주택법\n01. 총칙`}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#16161D] border border-white/[0.1] text-[10.5px] text-white font-mono"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={!rawTocText.trim() || tocParsing}
                      onClick={handleParseTocTextToBuilder}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-[10.5px] font-black flex items-center gap-1"
                    >
                      {tocParsing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>드래그 블록으로 변환</span>
                    </button>
                  </div>
                </div>
              )}

              <TocDragBuilder
                nodes={bookDraftNodes}
                onChange={setBookDraftNodes}
                defaultSubjectTitle={defaultSubjForBook.trim() || "기본 과목"}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!bookTitle.trim()}
                onClick={() => void handleSubmitBook()}
                className="px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] disabled:opacity-40 text-xs font-black text-white transition"
              >
                {bookDraftNodes.length > 0 || rawTocText.trim()
                  ? "책 + 목차 함께 추가"
                  : "책 추가 → 과목/단원 설정"}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 2: 과목 추가 (반드시 책 선택 필수) */}
        {/* ========================================================== */}
        {step === "subject" && (
          <div className="space-y-3">
            {catalog.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#16161D] border border-white/[0.08] text-center space-y-2">
                <p className="text-xs font-bold text-slate-300">
                  과목을 추가하려면 먼저 책이 등록되어 있어야 합니다.
                </p>
                <button
                  type="button"
                  onClick={() => setStep("book")}
                  className="px-3.5 py-2 rounded-xl bg-[#FF5A36] text-xs font-black text-white"
                >
                  1. 책 먼저 추가하기
                </button>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-sky-300">
                      1) 어느 책에 과목을 추가할까요? (필수)
                    </label>
                    <select
                      value={targetBookIdForSubj}
                      onChange={(e) => setTargetBookIdForSubj(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.12] text-xs font-bold text-white"
                    >
                      {catalog.map((b) => (
                        <option key={b.id} value={b.id}>
                          [{b.badge}] {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      type="text"
                      value={newSubjTitle}
                      onChange={(e) => setNewSubjTitle(e.target.value)}
                      placeholder="과목명 (책 제목과 별개, 예: 민법, 관계법규)"
                      className="px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs text-white"
                    />
                    <select
                      value={newSubjCategory}
                      onChange={(e) => setNewSubjCategory(e.target.value)}
                      className="px-2.5 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs font-bold text-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400">과목 색:</span>
                    {CUSTOM_SUBJECT_COLOR_PALETTE.slice(0, 8).map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setNewSubjColor(hex)}
                        className={`w-4 h-4 rounded-full border ${
                          newSubjColor === hex
                            ? "border-white scale-110 ring-1 ring-white"
                            : "border-white/20"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                    <input
                      type="color"
                      value={newSubjColor}
                      onChange={(e) => setNewSubjColor(e.target.value)}
                      className="w-6 h-5 bg-transparent cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[10.5px] font-bold text-slate-400">
                      초기 단원 바로 추가 (선택 · 한 줄에 하나씩, 비워두면 다음 단계에서 입력)
                    </label>
                    <textarea
                      rows={3}
                      value={newSubjTopicsRaw}
                      onChange={(e) => setNewSubjTopicsRaw(e.target.value)}
                      placeholder={`예:\n01. 총칙\n02. 물권법\n03. 채권법`}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-[11px] text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={!newSubjTitle.trim() || !targetBookIdForSubj}
                    onClick={handleSubmitSubject}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-xs font-black text-white transition"
                  >
                    {newSubjTopicsRaw.trim()
                      ? "과목 + 단원 함께 추가"
                      : "과목 추가 → 단원 입력"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 3: 단원 추가 (책 > 과목 > 대단원 계층 선택) */}
        {/* ========================================================== */}
        {step === "topic" && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5">
              <div className="space-y-1">
                <label className="text-[10.5px] font-black text-emerald-300">
                  1) 책 선택
                </label>
                <select
                  value={targetBookIdForTopic}
                  onChange={(e) => setTargetBookIdForTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.12] text-xs font-bold text-white"
                >
                  {catalog.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.badge}] {b.title}
                    </option>
                  ))}
                </select>
              </div>

              {subjectsInSelectedBook.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#0E0E12] border border-dashed border-sky-500/40 text-center space-y-2">
                  <p className="text-[11px] text-slate-300">
                    선택한 책에 아직 등록된 과목이 없습니다. 먼저 과목을 추가해 주세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetBookIdForSubj(targetBookIdForTopic);
                      setStep("subject");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 text-[11px] font-black text-white inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>이 책에 과목 추가하기</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">
                        2) 과목
                      </label>
                      <select
                        value={targetSubjectIdForTopic}
                        onChange={(e) => setTargetSubjectIdForTopic(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.12] text-xs font-bold text-white"
                      >
                        {subjectsInSelectedBook.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">
                        3) 대단원
                      </label>
                      <select
                        value={targetUnitIdForTopic}
                        onChange={(e) => setTargetUnitIdForTopic(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.12] text-xs font-bold text-white"
                      >
                        {unitsInSelectedSubject.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] font-bold text-slate-300">
                        추가할 단원명 (한 줄에 여러 개 일괄 입력 가능)
                      </label>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span>예상</span>
                        <input
                          type="number"
                          min={5}
                          max={180}
                          step={5}
                          value={newTopicEstMinutes}
                          onChange={(e) =>
                            setNewTopicEstMinutes(Math.max(5, Number(e.target.value) || 30))
                          }
                          className="w-12 px-1.5 py-0.5 rounded bg-[#0E0E12] border border-white/[0.1] text-center font-mono text-white"
                        />
                        <span>분</span>
                      </div>
                    </div>
                    <textarea
                      rows={4}
                      value={newTopicsRaw}
                      onChange={(e) => setNewTopicsRaw(e.target.value)}
                      placeholder={`예:\n01. 주택법 총칙\n02. 주택의 건설\n03. 주택의 공급`}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs text-white"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!targetUnitIdForTopic || !newTopicsRaw.trim()}
                onClick={handleSubmitTopics}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-xs font-black text-white transition"
              >
                단원 추가 완료
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 4: 기존 커스텀 책 목차 구조 드래그&드롭 재편집 */}
        {/* ========================================================== */}
        {step === "organize" && (
          <div className="space-y-3">
            {customBooks.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#16161D] border border-white/[0.08] text-center space-y-2">
                <p className="text-xs font-bold text-slate-300">
                  직접 추가한 커스텀 책이 아직 없습니다. 먼저 책을 추가해 보세요!
                </p>
                <button
                  type="button"
                  onClick={() => setStep("book")}
                  className="px-3.5 py-2 rounded-xl bg-[#FF5A36] text-xs font-black text-white"
                >
                  1. 책 추가하러 가기
                </button>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-amber-300">
                      목차 구조를 재편집할 커스텀 책 선택
                    </label>
                    <select
                      value={organizeBookId}
                      onChange={(e) => setOrganizeBookId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.12] text-xs font-bold text-white"
                    >
                      {customBooks.map((b) => (
                        <option key={b.id} value={b.id}>
                          [{b.badge}] {b.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <TocDragBuilder
                    nodes={organizeNodes}
                    onChange={setOrganizeNodes}
                    defaultSubjectTitle="기본 과목"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={!organizeBookId || !onReplaceBookStructure}
                    onClick={handleSaveOrganize}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-xs font-black text-slate-950 transition"
                  >
                    목차 구조 저장 (기록 보존)
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
