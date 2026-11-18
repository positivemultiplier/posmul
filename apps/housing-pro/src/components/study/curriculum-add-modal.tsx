"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
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
  DEFAULT_BASE_SUBJECT_COLOR,
  getDistinctSubjectColor,
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

interface SavedAlertState {
  title: string;
  detail: string;
  nextStep?: CurriculumAddStep;
  nextLabel?: string;
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
  const [savedAlert, setSavedAlert] = useState<SavedAlertState | null>(null);

  // ==========================================================
  // STEP 1: 책 추가 (책 기본정보만 명확히 설정)
  // ==========================================================
  const [bookTitle, setBookTitle] = useState("");
  const [bookBadge, setBookBadge] = useState("");
  const [bookCategory, setBookCategory] = useState<string>(
    categories[1] || categories[0] || "주택관리사 2차"
  );
  const [bookColor, setBookColor] = useState<string>(DEFAULT_BASE_SUBJECT_COLOR);
  const [createBaseSubject, setCreateBaseSubject] = useState<boolean>(false);

  // ==========================================================
  // STEP 2: 과목 추가 (과목마다 서로 다른 기본 색 자동 배정)
  // ==========================================================
  const [targetBookIdForSubj, setTargetBookIdForSubj] = useState<string>(
    initialBookId || catalog[0]?.id || ""
  );
  const [newSubjTitle, setNewSubjTitle] = useState("");
  const [newSubjCategory, setNewSubjCategory] = useState<string>(
    categories[1] || categories[0] || "주택관리사 2차"
  );
  const [newSubjColor, setNewSubjColor] = useState<string>(
    getDistinctSubjectColor(subjects.length)
  );

  // ==========================================================
  // STEP 3: 단원 추가 (책 -> 과목 -> 대단원 + 예상 분)
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
  // STEP 4: 구조잡기 (드래그&드롭 + 텍스트 붙여넣기 + 사진 스캔 전담)
  // ==========================================================
  const customBooks = useMemo(
    () => catalog.filter((b) => b.id.startsWith("custom-book-")),
    [catalog]
  );
  const [organizeBookId, setOrganizeBookId] = useState<string>("");
  const [organizeNodes, setOrganizeNodes] = useState<TocDraftNode[]>([]);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [rawTocText, setRawTocText] = useState("");
  const [tocParsing, setTocParsing] = useState(false);
  const [tocNotice, setTocNotice] = useState<string | null>(null);
  const [tocError, setTocError] = useState<string | null>(null);
  const tocImageInputRef = useRef<HTMLInputElement | null>(null);

  // 모달 열릴 때 초기화 (과목 기본 색도 기존 과목과 다르게 자동 선택)
  useEffect(() => {
    if (!isOpen) return;
    setStep(initialStep);
    setSavedAlert(null);
    setTocError(null);
    setTocNotice(null);
    const defaultBook = initialBookId || catalog[0]?.id || "";
    setTargetBookIdForSubj(defaultBook);
    setTargetBookIdForTopic(defaultBook);
    if (initialSubjectId) {
      setTargetSubjectIdForTopic(initialSubjectId);
    }
    setNewSubjColor(getDistinctSubjectColor(subjects.length));

    const defaultCustomBook =
      (initialBookId && initialBookId.startsWith("custom-book-")
        ? initialBookId
        : customBooks[0]?.id) || "";
    setOrganizeBookId(defaultCustomBook);
  }, [
    isOpen,
    initialStep,
    initialBookId,
    initialSubjectId,
    catalog,
    customBooks,
    subjects.length,
  ]);

  // organizeBookId 변경 시 블록 목록 동기화
  useEffect(() => {
    if (!isOpen || step !== "organize" || !organizeBookId) return;
    const book = catalog.find((b) => b.id === organizeBookId);
    if (!book) {
      setOrganizeNodes([]);
      return;
    }
    setOrganizeNodes(subjectsToDraftNodes(book.subjects));
  }, [isOpen, step, organizeBookId, catalog]);

  // 선택된 책에 속한 과목 목록
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

  const handleStepChange = (next: CurriculumAddStep) => {
    setSavedAlert(null);
    setStep(next);
  };

  // STEP 1 저장
  const handleSaveBook = () => {
    const cleanTitle = bookTitle.trim();
    if (!cleanTitle) return;

    const initialSubjects: CustomBookSubjectInput[] | undefined = createBaseSubject
      ? [
          {
            title: "기본 과목",
            color: DEFAULT_BASE_SUBJECT_COLOR, // 기본과목 색은 통일
            examStage: bookCategory.includes("1차") ? "1차" : "2차",
            category: bookCategory,
            units: [{ title: "기본 목차", topics: [] }],
          },
        ]
      : undefined;

    const createdBookId = onAddBook({
      title: cleanTitle,
      badge: bookBadge.trim() || cleanTitle.slice(0, 6),
      coverColor: bookColor,
      examStage: bookCategory.includes("1차") ? "1차" : "2차",
      category: bookCategory,
      subjects: initialSubjects,
    });

    if (createdBookId) {
      setTargetBookIdForSubj(createdBookId);
      setTargetBookIdForTopic(createdBookId);
      setOrganizeBookId(createdBookId);
    }

    setBookTitle("");
    setBookBadge("");
    setCreateBaseSubject(false);

    setSavedAlert({
      title: `「${cleanTitle}」 책이 저장되었습니다.`,
      detail: createBaseSubject
        ? "통일된 기본 과목이 함께 생성되었습니다. 바로 단원을 추가하거나 목차 구조를 잡을 수 있습니다."
        : "다음 단계에서 이 책에 과목을 추가하거나 드래그&드롭으로 목차 구조를 구성하세요.",
      nextStep: createBaseSubject ? "topic" : "subject",
      nextLabel: createBaseSubject ? "3. 단원 추가하기" : "2. 과목 추가하기",
    });
  };

  // STEP 2 저장
  const handleSaveSubject = () => {
    const cleanTitle = newSubjTitle.trim();
    if (!targetBookIdForSubj || !cleanTitle) return;

    const resolvedColor =
      cleanTitle === "기본 과목" || cleanTitle === "기본과목"
        ? DEFAULT_BASE_SUBJECT_COLOR
        : newSubjColor;

    const created = onAddSubject({
      title: cleanTitle,
      examStage: newSubjCategory.includes("1차") ? "1차" : "2차",
      category: newSubjCategory,
      color: resolvedColor,
      bookId: targetBookIdForSubj,
    });

    if (created) {
      setTargetBookIdForTopic(targetBookIdForSubj);
      setTargetSubjectIdForTopic(created.subjectId);
      setTargetUnitIdForTopic(created.unitId);
    }

    setNewSubjTitle("");
    setNewSubjColor(getDistinctSubjectColor(subjects.length + 1));

    setSavedAlert({
      title: `「${cleanTitle}」 과목이 저장되었습니다.`,
      detail: "과목 색상이 저장되었습니다. 이어서 단원을 추가해 보세요.",
      nextStep: "topic",
      nextLabel: "3. 단원 추가하기",
    });
  };

  // STEP 3 저장
  const handleSaveTopics = () => {
    if (!targetUnitIdForTopic) return;
    const lines = newTopicsRaw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    onAddTopicsBulk(targetUnitIdForTopic, lines, newTopicEstMinutes);
    setNewTopicsRaw("");

    setSavedAlert({
      title: `${lines.length}개 단원이 저장되었습니다.`,
      detail: "플래너 매트릭스와 일정표에 즉시 반영되었습니다.",
      nextStep: "organize",
      nextLabel: "구조잡기에서 순서 다듬기",
    });
  };

  // STEP 4: 텍스트/이미지 파싱 & 목차 구조 저장
  const handleParseTocTextToBuilder = async () => {
    if (!rawTocText.trim()) return;
    setTocParsing(true);
    setTocError(null);
    setTocNotice(null);
    const targetBook = catalog.find((b) => b.id === organizeBookId);
    try {
      const res = await fetch("/api/books/parse-toc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: rawTocText,
          bookTitle: targetBook?.title || "",
          defaultSubjectTitle: "기본 과목",
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        subjects?: ParsedTocSubject[];
      };
      if (data.success && data.subjects && data.subjects.length > 0) {
        setOrganizeNodes(parsedSubjectsToDraftNodes(data.subjects));
      } else {
        setOrganizeNodes(parseRawLinesToDraftNodes(rawTocText));
      }
      setShowPasteBox(false);
    } catch {
      setOrganizeNodes(parseRawLinesToDraftNodes(rawTocText));
      setShowPasteBox(false);
    } finally {
      setTocParsing(false);
    }
  };

  const handleTocImageUpload = async (file: File) => {
    setTocParsing(true);
    setTocError(null);
    setTocNotice(null);
    const targetBook = catalog.find((b) => b.id === organizeBookId);
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
          bookTitle: targetBook?.title || "",
          defaultSubjectTitle: "기본 과목",
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        subjects?: ParsedTocSubject[];
        error?: string;
      };
      if (data.success && data.subjects && data.subjects.length > 0) {
        const converted = parsedSubjectsToDraftNodes(data.subjects);
        setOrganizeNodes(converted);
        setTocNotice(
          `목차 사진에서 ${converted.length}개 블록을 불러왔습니다. 드래그하여 다듬은 뒤 저장하세요.`
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

  const handleSaveOrganize = () => {
    if (!organizeBookId || !onReplaceBookStructure) return;
    const book = catalog.find((b) => b.id === organizeBookId);
    const firstCat = book?.subjects[0]?.category || categories[1] || "주택관리사 2차";
    const built = draftNodesToSubjectInputs({
      nodes: organizeNodes,
      defaultSubjectTitle: "기본 과목",
      defaultColor: DEFAULT_BASE_SUBJECT_COLOR,
      category: firstCat,
    });
    onReplaceBookStructure(organizeBookId, built, firstCat);
    setSavedAlert({
      title: `「${book?.badge || "교재"}」 목차 구조가 저장되었습니다.`,
      detail: "기존 공부·회독 기록은 유지된 채 새 목차 구조가 매트릭스에 반영되었습니다.",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-[470px] max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0D0D11] border border-white/[0.12] p-4 space-y-3.5 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#FF5A36]" />
              <span>교재 · 과목 · 단원 구성</span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              각 단계에서 필요한 항목만 설정하고 저장 알림을 확인하세요.
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

        {/* 4단계 스텝 네비게이션 */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-0.5 p-1 rounded-xl bg-[#16161C] border border-white/[0.06] text-[10px] font-black">
          <button
            type="button"
            onClick={() => handleStepChange("book")}
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
            onClick={() => handleStepChange("subject")}
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
            onClick={() => handleStepChange("topic")}
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
            onClick={() => handleStepChange("organize")}
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

        {/* 뚜렷한 저장 완료 Alert 배너 */}
        {savedAlert && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-emerald-950/75 border border-emerald-400/50 space-y-2.5 shadow-lg"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-black text-emerald-200">
                  {savedAlert.title}
                </div>
                <p className="text-[10.5px] text-emerald-100/80 leading-relaxed">
                  {savedAlert.detail}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[10.5px] font-bold text-slate-200"
              >
                완료 후 닫기
              </button>
              {savedAlert.nextStep && savedAlert.nextLabel && (
                <button
                  type="button"
                  onClick={() => handleStepChange(savedAlert.nextStep!)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10.5px] font-black flex items-center gap-1"
                >
                  <span>{savedAlert.nextLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 1: 책 추가 (책 기본정보만 집중 설정) */}
        {/* ========================================================== */}
        {step === "book" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">
                  1단계 · 새 책 등록
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  책 정보만 먼저 저장합니다
                </span>
              </div>

              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="책 제목 (예: 2026 에듀윌 주택관리사 2차 기출문제집)"
                className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36]"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={bookBadge}
                  onChange={(e) => setBookBadge(e.target.value)}
                  placeholder="짧은 이름 (예: 에듀윌2차)"
                  className="px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-[11px] text-white"
                />
                <select
                  value={bookCategory}
                  onChange={(e) => setBookCategory(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-[11px] font-bold text-white"
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

              <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createBaseSubject}
                  onChange={(e) => setCreateBaseSubject(e.target.checked)}
                  className="accent-[#FF5A36]"
                />
                <span>과목 구분 없이 &quot;기본 과목&quot;을 바로 함께 생성</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={!bookTitle.trim()}
                onClick={handleSaveBook}
                className="px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] disabled:opacity-40 text-xs font-black text-white transition"
              >
                책 저장하기
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 2: 과목 추가 (과목마다 서로 다른 기본 색 자동 제안) */}
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
                  onClick={() => handleStepChange("book")}
                  className="px-3.5 py-2 rounded-xl bg-[#FF5A36] text-xs font-black text-white"
                >
                  1. 책 먼저 추가하기
                </button>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-sky-300">
                      2단계 · 과목 추가
                    </span>
                    <span className="text-[10px] text-slate-400">
                      과목별 기본 색상이 자동으로 다르게 배정됩니다
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-400">
                      소속 책 선택
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
                      placeholder="과목명 (예: 민법, 주택관리관계법규)"
                      className="px-3 py-2 rounded-xl bg-[#0E0E12] border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-sky-400"
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

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400">
                      과목 기본 색 (나중에 매트릭스 수정 버튼에서도 변경 가능)
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {CUSTOM_SUBJECT_COLOR_PALETTE.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setNewSubjColor(hex)}
                          className={`w-5 h-5 rounded-full border ${
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
                        className="w-7 h-5 bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    disabled={!newSubjTitle.trim() || !targetBookIdForSubj}
                    onClick={handleSaveSubject}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-xs font-black text-white transition"
                  >
                    과목 저장하기
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 3: 단원 추가 (책 > 과목 > 대단원 선택 + 단원 일괄 입력) */}
        {/* ========================================================== */}
        {step === "topic" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5">
              <div className="text-xs font-black text-emerald-300">
                3단계 · 단원 추가
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">
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
                      handleStepChange("subject");
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
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={!targetUnitIdForTopic || !newTopicsRaw.trim()}
                onClick={handleSaveTopics}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-xs font-black text-white transition"
              >
                단원 저장하기
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* STEP 4: 구조잡기 (드래그&드롭 + 텍스트 붙여넣기 + 사진 스캔 전담) */}
        {/* ========================================================== */}
        {step === "organize" && (
          <div className="space-y-3">
            {customBooks.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#16161D] border border-white/[0.08] text-center space-y-2">
                <p className="text-xs font-bold text-slate-300">
                  목차 구조를 잡으려면 먼저 1단계에서 책을 추가해 주세요.
                </p>
                <button
                  type="button"
                  onClick={() => handleStepChange("book")}
                  className="px-3.5 py-2 rounded-xl bg-[#FF5A36] text-xs font-black text-white"
                >
                  1. 책 추가하러 가기
                </button>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="text-[11px] font-black text-amber-300">
                      목차 구조를 편집할 책 선택
                    </label>
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
                        <span>사진 스캔</span>
                      </button>
                    </div>
                  </div>

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

                  {tocNotice && (
                    <div className="p-2 rounded-xl bg-sky-950/50 border border-sky-500/30 text-[10px] text-sky-200">
                      {tocNotice}
                    </div>
                  )}
                  {tocError && (
                    <div className="p-2 rounded-xl bg-rose-950/50 border border-rose-500/30 text-[10px] text-rose-200">
                      {tocError}
                    </div>
                  )}

                  {showPasteBox && (
                    <div className="p-2.5 rounded-xl bg-[#0E0E12] border border-sky-500/30 space-y-2">
                      <textarea
                        rows={4}
                        value={rawTocText}
                        onChange={(e) => setRawTocText(e.target.value)}
                        placeholder={`서점 목차를 복사해 붙여넣은 뒤 [블록으로 변환]을 누르세요.\n예:\n주택관리관계법규\nPART 01 주택법\n01. 총칙`}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#16161D] border border-white/[0.1] text-[10.5px] text-white font-mono"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={!rawTocText.trim() || tocParsing}
                          onClick={() => void handleParseTocTextToBuilder()}
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
                    nodes={organizeNodes}
                    onChange={setOrganizeNodes}
                    defaultSubjectTitle="기본 과목"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    disabled={!organizeBookId || !onReplaceBookStructure}
                    onClick={handleSaveOrganize}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-xs font-black text-slate-950 transition"
                  >
                    목차 구조 저장하기
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
