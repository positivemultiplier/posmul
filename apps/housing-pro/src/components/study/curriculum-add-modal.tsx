"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Camera,
  Check,
  FileText,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  CUSTOM_SUBJECT_COLOR_PALETTE,
  DEFAULT_BASE_SUBJECT_COLOR,
  getDistinctSubjectColor,
  getTopicPageCount,
  type StudySubjectNode,
  type TextbookCatalogItem,
} from "@/data/study-textbooks";
import type { CustomBookSubjectInput } from "@/lib/study-curriculum-store";
import type {
  ParsedTocNode,
  ParsedTocSubject,
} from "@/app/api/books/parse-toc/route";
import {
  TocDragBuilder,
  createDraftNode,
  draftNodesToSubjectInputs,
  parseRawLinesToDraftNodes,
  subjectsToDraftNodes,
  type CheckpointDepthMode,
  type TocDraftNode,
} from "@/components/study/toc-drag-builder";

export type CurriculumAddStep =
  | "search"
  | "create"
  | "organize"
  | "book"
  | "subject"
  | "topic";

type ModalTab = "search" | "create" | "organize";

const PRESET_FILTER_TAGS = [
  "전체",
  "주택관리사",
  "과학",
  "영어",
  "수학",
  "공인중개사",
  "한국사",
  "IT",
  "내 서재",
] as const;

interface CurriculumAddModalProps {
  isOpen: boolean;
  initialStep?: CurriculumAddStep;
  initialBookId?: string;
  initialSubjectId?: string;
  onClose: () => void;
  catalog: TextbookCatalogItem[];
  activeBookIds?: string[];
  onToggleBookActive?: (bookId: string) => void;
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
  onAddSubject?: (params: {
    title: string;
    examStage?: "1차" | "2차";
    category?: string;
    color: string;
    bookId?: string;
    topicTitles?: string[];
  }) => { subjectId: string; unitId: string } | null;
  onAddTopicsBulk?: (unitId: string, titles: string[], estimatedMinutes?: number) => void;
  onReplaceBookStructure?: (
    bookId: string,
    subjects: CustomBookSubjectInput[],
    category?: string
  ) => void;
}

function mapStepToTab(step: CurriculumAddStep): ModalTab {
  if (step === "organize") return "organize";
  if (step === "create" || step === "subject" || step === "topic") return "create";
  return "search";
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
          createDraftNode(2, t.title, {
            estimatedMinutes: t.estimatedMinutes,
            pageStart: t.pageStart,
            pageEnd: t.pageEnd,
          })
        );
      }
    }
  }
  return list;
}

export function CurriculumAddModal({
  isOpen,
  initialStep = "search",
  initialBookId,
  onClose,
  catalog,
  activeBookIds = [],
  onToggleBookActive,
  subjects,
  categories,
  onAddBook,
  onReplaceBookStructure,
}: CurriculumAddModalProps) {
  const [tab, setTab] = useState<ModalTab>(mapStepToTab(initialStep));

  // ① 책 검색·가져오기 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("전체");

  // ② 새 커스텀 책 만들기 상태
  const [bookTitle, setBookTitle] = useState("");
  const [bookCategory, setBookCategory] = useState<string>(
    categories[1] || categories[0] || "주택관리사 2차"
  );
  const [bookColor, setBookColor] = useState<string>(
    getDistinctSubjectColor(subjects.length)
  );
  const [createInitMode, setCreateInitMode] = useState<"instant" | "paste">("instant");
  const [bookPasteRaw, setBookPasteRaw] = useState("");

  // ③ 목차 구조잡기 상태
  const customBooks = useMemo(
    () => catalog.filter((b) => b.id.startsWith("custom-book-")),
    [catalog]
  );
  const [organizeBookId, setOrganizeBookId] = useState<string>("");
  const [organizeNodes, setOrganizeNodes] = useState<TocDraftNode[]>([]);
  const [checkpointDepth, setCheckpointDepth] = useState<CheckpointDepthMode>("auto");
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [rawTocText, setRawTocText] = useState("");
  const [tocParsing, setTocParsing] = useState(false);
  const [tocNotice, setTocNotice] = useState<string | null>(null);
  const [tocError, setTocError] = useState<string | null>(null);
  const tocImageInputRef = useRef<HTMLInputElement | null>(null);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (!isOpen) return;
    setTab(mapStepToTab(initialStep));
    setSearchQuery("");
    setSelectedTag("전체");
    setTocError(null);
    setTocNotice(null);
    setBookColor(getDistinctSubjectColor(subjects.length));

    const defaultCustomBook =
      (initialBookId && initialBookId.startsWith("custom-book-")
        ? initialBookId
        : customBooks[0]?.id) || "";
    setOrganizeBookId(defaultCustomBook);
  }, [isOpen, initialStep, initialBookId, customBooks, subjects.length]);

  // organize 탭에서 책 변경 시 블록 동기화
  useEffect(() => {
    if (!isOpen || tab !== "organize" || !organizeBookId) return;
    const book = catalog.find((b) => b.id === organizeBookId);
    setOrganizeNodes(book ? subjectsToDraftNodes(book.subjects) : []);
  }, [isOpen, tab, organizeBookId, catalog]);

  // 태그 & 검색어 기반 책 필터링
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = catalog.filter((book) => {
      const isCustom = book.id.startsWith("custom-book-");
      if (selectedTag === "내 서재") {
        if (!isCustom && !activeBookIds.includes(book.id)) return false;
      } else if (selectedTag !== "전체") {
        const tagPool = [
          ...(book.tags || []),
          book.title,
          book.subtitle,
          ...book.subjects.map((s) => `${s.title} ${s.category || ""}`),
        ]
          .join(" ")
          .toLowerCase();
        if (!tagPool.includes(selectedTag.toLowerCase())) return false;
      }

      if (!q) return true;
      const haystack = [
        book.title,
        book.subtitle,
        book.badge,
        book.author || "",
        ...(book.tags || []),
        ...book.subjects.map((s) => `${s.title} ${s.category || ""}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    // 아직 안 꺼낸 책 우선, 그다음 적용중인 책
    return [...list].sort((a, b) => {
      const aAct = activeBookIds.includes(a.id) ? 1 : 0;
      const bAct = activeBookIds.includes(b.id) ? 1 : 0;
      return aAct - bAct;
    });
  }, [catalog, searchQuery, selectedTag, activeBookIds]);

  if (!isOpen) return null;

  // 새 커스텀 책 저장 (바로 시작 | 붙여넣기 파싱 | 저장 후 사진 스캔)
  const handleCreateCustomBook = (goToOrganizeScan = false) => {
    const cleanTitle = bookTitle.trim();
    if (!cleanTitle) return;

    let builtSubjects: CustomBookSubjectInput[];
    if (createInitMode === "paste" && bookPasteRaw.trim()) {
      const draftNodes = parseRawLinesToDraftNodes(bookPasteRaw);
      builtSubjects = draftNodesToSubjectInputs({
        nodes: draftNodes,
        defaultSubjectTitle: cleanTitle,
        defaultColor: bookColor,
        category: bookCategory,
        checkpointDepth: "auto",
      });
    } else {
      builtSubjects = [
        {
          title: cleanTitle,
          color: bookColor,
          examStage: bookCategory.includes("1차") ? "1차" : "2차",
          category: bookCategory,
          units: [{ title: "기본 목차", topics: [] }],
        },
      ];
    }

    const createdBookId = onAddBook({
      title: cleanTitle,
      badge: cleanTitle.slice(0, 8),
      coverColor: bookColor,
      examStage: bookCategory.includes("1차") ? "1차" : "2차",
      category: bookCategory,
      subjects: builtSubjects,
    });

    setBookTitle("");
    setBookPasteRaw("");
    setCreateInitMode("instant");

    if (goToOrganizeScan && createdBookId) {
      setOrganizeBookId(createdBookId);
      setTab("organize");
      setTocNotice(
        `「${cleanTitle}」 책이 생성되었습니다. 아래 [사진 스캔] 또는 [붙여넣기]로 목차를 불러오세요.`
      );
    } else {
      onClose();
    }
  };

  // 구조잡기: 텍스트 파싱
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
          defaultSubjectTitle: targetBook?.title || "기본 과목",
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        nodes?: ParsedTocNode[];
        subjects?: ParsedTocSubject[];
      };
      if (data.success && data.nodes && data.nodes.length > 0) {
        setOrganizeNodes(
          data.nodes.map((n) =>
            createDraftNode(n.level, n.title, {
              pageStart: n.pageStart,
              pageEnd: n.pageEnd,
              estimatedMinutes: n.estimatedMinutes,
            })
          )
        );
      } else if (data.success && data.subjects && data.subjects.length > 0) {
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

  // 구조잡기: 목차 사진 스캔
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
          defaultSubjectTitle: targetBook?.title || "기본 과목",
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        nodes?: ParsedTocNode[];
        subjects?: ParsedTocSubject[];
        error?: string;
      };
      if (data.success && data.nodes && data.nodes.length > 0) {
        const converted = data.nodes.map((n) =>
          createDraftNode(n.level, n.title, {
            pageStart: n.pageStart,
            pageEnd: n.pageEnd,
            estimatedMinutes: n.estimatedMinutes,
          })
        );
        setOrganizeNodes(converted);
        setTocNotice(
          `목차 사진에서 ${converted.length}개 블록(페이지 포함)을 추출했습니다. 위 '체크 기준 단위'로 굵기를 맞춰 저장하세요.`
        );
      } else if (data.success && data.subjects && data.subjects.length > 0) {
        setOrganizeNodes(parsedSubjectsToDraftNodes(data.subjects));
      } else {
        setTocError(data.error || "목차 사진에서 단원을 추출하지 못했습니다.");
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
      defaultSubjectTitle: book?.title || "기본 과목",
      defaultColor: DEFAULT_BASE_SUBJECT_COLOR,
      category: firstCat,
      checkpointDepth,
    });
    onReplaceBookStructure(organizeBookId, built, firstCat);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-2.5 sm:p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0D0D11] border border-white/[0.12] p-4 space-y-3.5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#FF5A36]" />
            <span>책 추가 · 목차 설정</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 단일 1줄 3탭 (2중 탭·억지 화살표 완전 제거!) */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#16161C] border border-white/[0.07] text-[11px] font-black">
          <button
            type="button"
            onClick={() => setTab("search")}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition ${
              tab === "search"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>책 검색</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("create")}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition ${
              tab === "create"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Pencil className="w-3.5 h-3.5 shrink-0" />
            <span>새 책 만들기</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("organize")}
            className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition ${
              tab === "organize"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GripVertical className="w-3.5 h-3.5 shrink-0" />
            <span>목차 구조잡기</span>
          </button>
        </div>

        {/* ========================================================== */}
        {/* TAB 1: 🔍 책 검색 · 태그 필터 · 원탭 가져오기               */}
        {/* ========================================================== */}
        {tab === "search" && (
          <div className="space-y-3">
            {/* 검색 인풋 */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="책·과목·태그 검색 (예: 과학, 토익, 수학, 주택관리사)"
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#16161D] border border-white/[0.1] text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-slate-400 hover:text-white absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 태그 필터 칩 (가로 스크롤) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {PRESET_FILTER_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-black border shrink-0 transition ${
                    selectedTag === tag
                      ? "bg-white text-slate-950 border-white"
                      : "bg-[#15151C] text-slate-400 border-white/[0.08] hover:text-white"
                  }`}
                >
                  {tag === "전체" || tag === "내 서재" ? tag : `#${tag}`}
                </button>
              ))}
            </div>

            {/* 검색 결과 리스트 */}
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-0.5">
              {filteredCatalog.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#15151C] border border-dashed border-white/[0.14] text-center space-y-2.5">
                  <p className="text-xs font-bold text-slate-300">
                    &quot;{searchQuery || selectedTag}&quot;에 맞는 프리셋 책이 아직 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery.trim()) setBookTitle(searchQuery.trim());
                      setTab("create");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-xs font-black transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {searchQuery.trim()
                        ? `「${searchQuery.trim()}」 커스텀 책 만들기`
                        : "직접 커스텀 책 만들기"}
                    </span>
                  </button>
                </div>
              ) : (
                filteredCatalog.map((book) => {
                  const isActive = activeBookIds.includes(book.id);
                  const topicCount = book.subjects.reduce(
                    (acc, s) =>
                      acc + s.units.reduce((uAcc, u) => uAcc + u.topics.length, 0),
                    0
                  );
                  let totalPages = 0;
                  for (const s of book.subjects) {
                    for (const u of s.units) {
                      for (const t of u.topics) totalPages += getTopicPageCount(t);
                    }
                  }

                  return (
                    <div
                      key={book.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition ${
                        isActive
                          ? "bg-[#1A1A22] border-emerald-500/35"
                          : "bg-[#15151C] border-white/[0.08] hover:border-[#FF5A36]/50"
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-black text-white shrink-0"
                            style={{ backgroundColor: book.coverColor }}
                          >
                            {book.badge}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {book.subjects.length}과목 · {topicCount}단원
                            {totalPages > 0 ? ` · ${totalPages}p` : ""}
                          </span>
                        </div>
                        <div className="text-xs font-black text-white truncate">
                          {book.title}
                        </div>
                        {book.tags && book.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {book.tags.slice(0, 4).map((tg) => (
                              <span
                                key={tg}
                                className="text-[9px] font-bold text-slate-400 bg-white/[0.04] px-1.5 py-0.2 rounded"
                              >
                                #{tg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {onToggleBookActive && (
                        <button
                          type="button"
                          onClick={() => onToggleBookActive(book.id)}
                          className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black flex items-center gap-1 shrink-0 border transition ${
                            isActive
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-rose-500/15 hover:border-rose-400/40 hover:text-rose-200"
                              : "bg-[#FF5A36] hover:bg-[#ff6d4d] border-[#FF5A36] text-white"
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>적용중</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>가져오기</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  if (searchQuery.trim()) setBookTitle(searchQuery.trim());
                  setTab("create");
                }}
                className="text-[11px] font-black text-[#FF7A59] hover:underline flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                <span>직접 커스텀 책 만들기</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-black text-white transition"
              >
                완료
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 2: ✏️ 새 커스텀 책 만들기 (원스톱 생성 + 목차 방식 선택) */}
        {/* ========================================================== */}
        {tab === "create" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">새 책 기본 정보</span>
                <span className="text-[10px] text-emerald-300 font-bold">
                  과목·단원은 시트에서 +로 자유 편집
                </span>
              </div>

              <input
                type="text"
                autoFocus
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    createInitMode === "instant" &&
                    bookTitle.trim()
                  ) {
                    e.preventDefault();
                    handleCreateCustomBook(false);
                  }
                }}
                placeholder="책 이름 (예: 완자 통합과학, 해커스 토익 RC)"
                className="w-full px-3 py-2.5 rounded-xl bg-[#0E0E12] border border-[#FF5A36]/40 text-xs font-bold text-white focus:outline-none focus:border-[#FF5A36]"
              />

              <div className="flex items-center justify-between gap-2 flex-wrap">
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

                <div className="flex items-center gap-1.5">
                  {CUSTOM_SUBJECT_COLOR_PALETTE.slice(0, 6).map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setBookColor(hex)}
                      className={`w-4 h-4 rounded-full border transition ${
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
                    className="w-5 h-5 bg-transparent cursor-pointer"
                    title="직접 색상 선택"
                  />
                </div>
              </div>

              {/* 목차 입력 방식 선택 (심플 2버튼) */}
              <div className="pt-1 border-t border-white/[0.06] space-y-2">
                <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-black">
                  <button
                    type="button"
                    onClick={() => setCreateInitMode("instant")}
                    className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1 transition ${
                      createInitMode === "instant"
                        ? "bg-white/10 border-white/30 text-white"
                        : "bg-[#0E0E12] border-white/[0.06] text-slate-400 hover:text-white"
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-[#FF7A59]" />
                    <span>바로 만들고 시트 편집</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateInitMode("paste")}
                    className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1 transition ${
                      createInitMode === "paste"
                        ? "bg-sky-500/20 border-sky-400/50 text-sky-200"
                        : "bg-[#0E0E12] border-white/[0.06] text-slate-400 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3 h-3 text-sky-300" />
                    <span>서점 목차 붙여넣기</span>
                  </button>
                </div>

                {createInitMode === "paste" && (
                  <textarea
                    rows={5}
                    value={bookPasteRaw}
                    onChange={(e) => setBookPasteRaw(e.target.value)}
                    placeholder={
                      "서점 목차를 그대로 복사해 붙여넣으세요 (페이지 번호 자동 인식)\n예:\nPART 01 물질과 규칙성 p.12\n01. 우주의 시작과 원소 p.14\n02. 주기율표와 화학결합 p.28"
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0E0E12] border border-sky-500/35 text-[11px] text-white font-mono leading-relaxed focus:outline-none focus:border-sky-400"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!bookTitle.trim()}
                onClick={() => handleCreateCustomBook(true)}
                className="px-3 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-35 border border-amber-500/35 text-[11px] font-black text-amber-200 flex items-center gap-1 shrink-0 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>만들고 사진 스캔</span>
              </button>

              <button
                type="button"
                disabled={!bookTitle.trim()}
                onClick={() => handleCreateCustomBook(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] disabled:opacity-40 text-xs font-black text-white transition"
              >
                책 만들고 바로 시작
              </button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 3: ⊞ 목차 구조잡기 (4단계 Depth · 체크단위 · 사진스캔) */}
        {/* ========================================================== */}
        {tab === "organize" && (
          <div className="space-y-3">
            {customBooks.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#16161D] border border-white/[0.08] text-center space-y-2.5">
                <p className="text-xs font-bold text-slate-300">
                  구조잡기할 커스텀 책이 아직 없습니다. 먼저 책을 만들어 보세요.
                </p>
                <button
                  type="button"
                  onClick={() => setTab("create")}
                  className="px-4 py-2 rounded-xl bg-[#FF5A36] text-xs font-black text-white"
                >
                  새 책 만들기 →
                </button>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <select
                      value={organizeBookId}
                      onChange={(e) => setOrganizeBookId(e.target.value)}
                      className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-xl bg-[#0E0E12] border border-white/[0.12] text-xs font-bold text-white truncate"
                    >
                      {customBooks.map((b) => (
                        <option key={b.id} value={b.id}>
                          [{b.badge}] {b.title}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowPasteBox((prev) => !prev)}
                        className="px-2 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-200 text-[10px] font-black transition"
                      >
                        붙여넣기
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
                        className="px-2 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-[10px] font-black flex items-center gap-1 transition"
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
                        placeholder={
                          "서점 목차를 붙여넣은 뒤 [변환]을 누르세요 (페이지 자동 인식)\n예:\nPART 01 주택법 p.12\n01. 총칙 p.14"
                        }
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
                          <span>블록으로 변환</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <TocDragBuilder
                    nodes={organizeNodes}
                    onChange={setOrganizeNodes}
                    defaultSubjectTitle="기본 과목"
                    checkpointDepth={checkpointDepth}
                    onCheckpointDepthChange={setCheckpointDepth}
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
