"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Disc3,
  Heart,
  Image as ImageIcon,
  Loader2,
  Music,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  AlbumTrackItem,
  CreationKind,
  CreationPayloadItem,
  ExhibitionPieceItem,
  HealingCreationItem,
  NovelChapterItem,
  SaveCreationInput,
} from "../healing-room-service";

interface CreationsTabPanelProps {
  creations: HealingCreationItem[];
  ownerNickname: string;
  universeTitle?: string | null;
  isOwner: boolean;
  isBusy: boolean;
  viewerPmpBalance: number;
  nextCreationPmpCost: number;
  titleColorClass: string;
  onSaveCreation: (input: SaveCreationInput) => Promise<boolean>;
  onDeleteCreation: (creationId: string) => Promise<boolean>;
  onResonateCreation: (creationId: string) => Promise<void>;
  onPlayAlbumTrack: (bgmId: string) => void;
}

const KIND_META: Record<
  CreationKind,
  { label: string; icon: string; badgeClass: string; unitLabel: string }
> = {
  album: {
    label: "자작 앨범",
    icon: "💿",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    unitLabel: "트랙",
  },
  exhibition: {
    label: "그림 전시회",
    icon: "🖼️",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    unitLabel: "점",
  },
  novel: {
    label: "출판 서재",
    icon: "📖",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    unitLabel: "화",
  },
};

const ART_FALLBACK_PALETTES = [
  "from-sky-900 via-indigo-900 to-purple-900",
  "from-amber-900 via-rose-900 to-slate-900",
  "from-emerald-900 via-teal-900 to-cyan-950",
];

async function uploadCreativeMedia(
  file: File,
  mediaType: "audio" | "image"
): Promise<string> {
  const urlRes = await fetch("/api/healing-room/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, mediaType }),
  });
  const urlJson = (await urlRes.json()) as {
    success?: boolean;
    signedUrl?: string;
    publicUrl?: string;
    error?: string;
  };
  if (!urlRes.ok || !urlJson.success || !urlJson.signedUrl || !urlJson.publicUrl) {
    throw new Error(urlJson.error ?? "업로드 URL 발급 실패");
  }

  const putRes = await fetch(urlJson.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error("스토리지 파일 업로드에 실패했습니다.");
  }

  return urlJson.publicUrl;
}

export function CreationsTabPanel({
  creations,
  ownerNickname,
  universeTitle,
  isOwner,
  isBusy,
  viewerPmpBalance,
  nextCreationPmpCost,
  titleColorClass,
  onSaveCreation,
  onDeleteCreation,
  onResonateCreation,
  onPlayAlbumTrack,
}: CreationsTabPanelProps) {
  const [kindFilter, setKindFilter] = useState<"all" | CreationKind>("all");
  const [viewingCreation, setViewingCreation] = useState<HealingCreationItem | null>(null);
  const [activeSubIdx, setActiveSubIdx] = useState(0);

  // 출판/등록 스튜디오 상태
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [kind, setKind] = useState<CreationKind>("album");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loreConnection, setLoreConnection] = useState("");
  const [creatorNote, setCreatorNote] = useState("");
  const [aiToolsText, setAiToolsText] = useState("Suno, Midjourney, 직접 창작");
  const [tracks, setTracks] = useState<AlbumTrackItem[]>([
    { title: "", audioUrl: "", lyricsOrMood: "" },
  ]);
  const [pieces, setPieces] = useState<ExhibitionPieceItem[]>([
    { title: "", imageUrl: "", docentNote: "" },
  ]);
  const [chapters, setChapters] = useState<NovelChapterItem[]>([
    { chapterTitle: "제1화.", body: "" },
  ]);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const filteredCreations =
    kindFilter === "all" ? creations : creations.filter((c) => c.kind === kindFilter);

  const openComposer = (initialKind: CreationKind = "album") => {
    setKind(initialKind);
    setTitle("");
    setSubtitle("");
    setCoverUrl("");
    setLoreConnection(
      universeTitle ? `<${universeTitle}> 세계관 속 장면을 표현했습니다.` : ""
    );
    setCreatorNote("");
    setAiToolsText(
      initialKind === "album"
        ? "Suno, 직접 작사"
        : initialKind === "exhibition"
          ? "Midjourney, 도슨트 해설"
          : "Claude, 직접 집필"
    );
    setTracks([{ title: "", audioUrl: "", lyricsOrMood: "" }]);
    setPieces([{ title: "", imageUrl: "", docentNote: "" }]);
    setChapters([{ chapterTitle: "제1화.", body: "" }]);
    setUploadError(null);
    setIsComposerOpen(true);
  };

  const handleFileUpload = async (
    file: File | undefined,
    mediaType: "audio" | "image",
    slotKey: string,
    onDone: (publicUrl: string) => void
  ) => {
    if (!file) return;
    setUploadingSlot(slotKey);
    setUploadError(null);
    try {
      const publicUrl = await uploadCreativeMedia(file, mediaType);
      onDone(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "파일 업로드 오류");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    let items: CreationPayloadItem[] = [];
    if (kind === "album") {
      items = tracks.filter((t) => t.title.trim().length > 0);
    } else if (kind === "exhibition") {
      items = pieces.filter((p) => p.title.trim().length > 0);
    } else {
      items = chapters.filter((c) => c.chapterTitle.trim().length > 0 && c.body.trim().length > 0);
    }

    if (items.length === 0) {
      setUploadError("최소 1개 이상의 트랙·작품·챕터 내용을 입력해주세요.");
      return;
    }

    const ok = await onSaveCreation({
      kind,
      title,
      subtitle,
      coverUrl: coverUrl || null,
      loreConnection,
      creatorNote,
      aiTools: aiToolsText
        .split(/[,，#]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      items,
    });

    if (ok) {
      setIsComposerOpen(false);
    }
  };

  const activeViewing = viewingCreation
    ? creations.find((c) => c.id === viewingCreation.id) ?? viewingCreation
    : null;

  return (
    <div className="space-y-4">
      {/* 상단 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div>
          <h3 className={`text-sm font-black ${titleColorClass}`}>
            🎨 {ownerNickname}의 창작 작품관 (앨범 · 전시 · 서재)
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            수익화 없는 순수 취향 생성 공간 — 음악 앨범을 내고, 그림 전시회를 열고, 소설을 출판합니다.
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => openComposer("album")}
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>새 작품 출판/개최</span>
          </button>
        )}
      </div>

      {/* 필터 & 비상업 안내 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {[
            { key: "all", label: `전체 (${creations.length})` },
            {
              key: "album",
              label: `💿 앨범 (${creations.filter((c) => c.kind === "album").length})`,
            },
            {
              key: "exhibition",
              label: `🖼️ 전시회 (${creations.filter((c) => c.kind === "exhibition").length})`,
            },
            {
              key: "novel",
              label: `📖 소설 (${creations.filter((c) => c.kind === "novel").length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setKindFilter(tab.key as "all" | CreationKind)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                kindFilter === tab.key
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
          <ShieldCheck className="h-3 w-3" />
          Non-Commercial · 공명으로 소통
        </span>
      </div>

      {/* 작품 목록 그리드 */}
      {filteredCreations.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredCreations.map((cr, idx) => {
            const meta = KIND_META[cr.kind];
            const palette = ART_FALLBACK_PALETTES[idx % ART_FALLBACK_PALETTES.length];
            return (
              <article
                key={cr.id}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                {/* 커버 배너 */}
                <div
                  onClick={() => {
                    setViewingCreation(cr);
                    setActiveSubIdx(0);
                  }}
                  className="relative h-28 cursor-pointer overflow-hidden bg-slate-900"
                >
                  {cr.coverUrl ? (
                    <img
                      src={cr.coverUrl}
                      alt={cr.title}
                      className="h-full w-full object-cover opacity-85 transition hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${palette} p-3 text-white`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                        {meta.icon} {meta.label}
                      </span>
                      <div className="line-clamp-2 text-sm font-black leading-snug text-white">
                        {cr.title}
                      </div>
                    </div>
                  )}

                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold shadow-sm ${meta.badgeClass}`}
                    >
                      {meta.icon} {cr.items.length}
                      {meta.unitLabel}
                    </span>
                  </div>
                </div>

                {/* 본문 */}
                <div className="flex flex-1 flex-col justify-between p-3 space-y-2.5">
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setViewingCreation(cr);
                        setActiveSubIdx(0);
                      }}
                      className="text-left text-xs font-black text-slate-900 hover:text-indigo-700"
                    >
                      {cr.title}
                    </button>
                    {cr.subtitle && (
                      <p className="line-clamp-1 text-[11px] text-slate-500">{cr.subtitle}</p>
                    )}
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 px-2 py-1 text-[10.5px] leading-snug text-indigo-900">
                      <span className="font-bold">🌌 세계관 연결:</span> {cr.loreConnection}
                    </div>
                  </div>

                  {/* AI 툴 태그 & 액션 */}
                  <div className="space-y-2 pt-1">
                    {cr.aiTools.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cr.aiTools.map((tool) => (
                          <span
                            key={tool}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-600"
                          >
                            #{tool}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void onResonateCreation(cr.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10.5px] font-bold text-rose-700 hover:bg-rose-100"
                      >
                        <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                        <span>공명 {cr.resonanceCount}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {cr.kind === "album" && (
                          <button
                            type="button"
                            onClick={() => onPlayAlbumTrack(`custom-${cr.id}-0`)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[10.5px] font-bold text-amber-800 hover:bg-amber-100"
                          >
                            <Play className="h-3 w-3" />
                            <span>주크박스 재생</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setViewingCreation(cr);
                            setActiveSubIdx(0);
                          }}
                          className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10.5px] font-bold text-white hover:bg-slate-700"
                        >
                          감상하기
                        </button>
                        {isOwner && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void onDeleteCreation(cr.id)}
                            title="작품 삭제"
                            className="rounded-lg border border-slate-200 p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-2">
          <div className="text-2xl">🎨</div>
          <div className="text-xs font-black text-slate-700">
            아직 등록된 {kindFilter === "all" ? "창작물" : KIND_META[kindFilter].label}이 없습니다.
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() =>
                openComposer(kindFilter === "all" ? "album" : kindFilter)
              }
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>첫 작품 올리기 (3작품까지 무료)</span>
            </button>
          )}
        </div>
      )}

      {/* === 작품 상세 감상 모달 === */}
      {activeViewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
          onClick={() => setViewingCreation(null)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0f172a] text-slate-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                    {KIND_META[activeViewing.kind].icon}{" "}
                    {KIND_META[activeViewing.kind].label}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-semibold">
                    비상업 순수 창작
                  </span>
                </div>
                <h4 className="mt-1 text-base font-black text-white">
                  {activeViewing.title}
                </h4>
                {activeViewing.subtitle && (
                  <p className="text-[11px] text-slate-400">{activeViewing.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewingCreation(null)}
                className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 세계관 연결 & 작가의 말 */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3 text-xs space-y-1.5">
                <div className="font-bold text-indigo-200">
                  🌌 세계관 연결: {activeViewing.loreConnection}
                </div>
                {activeViewing.creatorNote && (
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    💬 작가 노트: {activeViewing.creatorNote}
                  </p>
                )}
              </div>

              {/* 1. 앨범 뷰어 */}
              {activeViewing.kind === "album" && (
                <div className="space-y-2">
                  {(activeViewing.items as AlbumTrackItem[]).map((track, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                          <Disc3 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-white">
                            {track.title}
                          </div>
                          {track.lyricsOrMood && (
                            <p className="truncate text-[11px] text-slate-400">
                              {track.lyricsOrMood}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPlayAlbumTrack(`custom-${activeViewing.id}-${idx}`)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-black text-slate-950 hover:bg-amber-400"
                      >
                        <Play className="h-3 w-3" />
                        <span>재생</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. 전시회 뷰어 */}
              {activeViewing.kind === "exhibition" && (
                <div className="space-y-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {(activeViewing.items as ExhibitionPieceItem[]).map((piece, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveSubIdx(idx)}
                        className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                          activeSubIdx === idx
                            ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                            : "border-slate-700 bg-slate-800 text-slate-400"
                        }`}
                      >
                        {idx + 1}. {piece.title}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const piecesList = activeViewing.items as ExhibitionPieceItem[];
                    const curPiece = piecesList[activeSubIdx] ?? piecesList[0];
                    if (!curPiece) return null;
                    const palette =
                      ART_FALLBACK_PALETTES[activeSubIdx % ART_FALLBACK_PALETTES.length];
                    return (
                      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                        {curPiece.imageUrl ? (
                          <img
                            src={curPiece.imageUrl}
                            alt={curPiece.title}
                            className="max-h-[340px] w-full object-contain bg-black/50"
                          />
                        ) : (
                          <div
                            className={`flex h-52 flex-col items-center justify-center bg-gradient-to-br ${palette} p-6 text-center`}
                          >
                            <ImageIcon className="mb-2 h-8 w-8 text-white/60" />
                            <div className="text-sm font-black text-white">
                              {curPiece.title}
                            </div>
                            <span className="mt-1 text-[10px] text-white/70">
                              Gallery Artwork Concept Canvas
                            </span>
                          </div>
                        )}
                        <div className="p-3.5 space-y-1">
                          <div className="text-xs font-black text-emerald-300">
                            🖼️ {curPiece.title}
                          </div>
                          {curPiece.docentNote && (
                            <p className="text-xs leading-relaxed text-slate-300">
                              {curPiece.docentNote}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 3. 출판 서재(소설) 리더 */}
              {activeViewing.kind === "novel" && (
                <div className="space-y-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {(activeViewing.items as NovelChapterItem[]).map((ch, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveSubIdx(idx)}
                        className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                          activeSubIdx === idx
                            ? "border-purple-400 bg-purple-500/25 text-purple-100"
                            : "border-slate-700 bg-slate-800 text-slate-400"
                        }`}
                      >
                        {ch.chapterTitle}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const chList = activeViewing.items as NovelChapterItem[];
                    const curCh = chList[activeSubIdx] ?? chList[0];
                    if (!curCh) return null;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-[#171e30] p-4 space-y-2.5">
                        <h5 className="border-b border-slate-700 pb-2 text-sm font-black text-purple-200">
                          {curCh.chapterTitle}
                        </h5>
                        <div className="whitespace-pre-wrap text-[13px] leading-7 text-slate-200">
                          {curCh.body}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-4 py-2.5">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void onResonateCreation(activeViewing.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-400/40 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-500/30"
              >
                <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />
                <span>작품에 공명하기 ({activeViewing.resonanceCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingCreation(null)}
                className="rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === 방 주인 전용 작품 출판/개최 스튜디오 모달 === */}
      {isComposerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
          onClick={() => setIsComposerOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-indigo-400/35 bg-white text-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-50 px-4 py-3">
              <div>
                <h4 className="text-sm font-black text-indigo-950">
                  ✨ 나만의 취향 출판 · 개최 스튜디오
                </h4>
                <p className="text-[11px] text-indigo-700">
                  {nextCreationPmpCost === 0
                    ? `첫 3작품까지 무료 출판! (무분별한 스팸 방지를 위해 4번째 작품부터 ${20} PMP 소모 · 보유 ${viewerPmpBalance} PMP)`
                    : `추가 작품 출판 시 ${nextCreationPmpCost} PMP 가 사용됩니다. (보유: ${viewerPmpBalance} PMP)`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => void handlePublishSubmit(e)}
              className="flex-1 overflow-y-auto p-4 space-y-3 text-xs"
            >
              {/* 형식 선택 */}
              <div className="grid grid-cols-3 gap-2">
                {(["album", "exhibition", "novel"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-black transition ${
                      kind === k
                        ? "border-indigo-600 bg-indigo-600 text-white shadow"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {k === "album" && <Music className="h-3.5 w-3.5" />}
                    {k === "exhibition" && <ImageIcon className="h-3.5 w-3.5" />}
                    {k === "novel" && <BookOpen className="h-3.5 w-3.5" />}
                    <span>{KIND_META[k].label}</span>
                  </button>
                ))}
              </div>

              {uploadError && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">작품 제목 *</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="앨범명 / 전시회명 / 책 제목"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">한 줄 부제</label>
                  <input
                    type="text"
                    maxLength={120}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="예: 비 오는 밤의 3곡 미니앨범"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  🌌 내 세계관과의 연결 설명 * (최소 8자 · 단순 도배 방지)
                </label>
                <input
                  type="text"
                  required
                  minLength={8}
                  maxLength={500}
                  value={loreConnection}
                  onChange={(e) => setLoreConnection(e.target.value)}
                  placeholder="이 작품이 내 세계관의 어느 장면/캐릭터와 이어지는지 적어주세요."
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    대표 커버 이미지 URL (선택 · 직접 업로드 가능)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://... 또는 우측 업로드"
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200">
                      {uploadingSlot === "cover" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                      <span>업로드</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          void handleFileUpload(
                            e.target.files?.[0],
                            "image",
                            "cover",
                            (url) => setCoverUrl(url)
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    활용한 AI 툴 · 창작 방식 (쉼표 구분)
                  </label>
                  <input
                    type="text"
                    value={aiToolsText}
                    onChange={(e) => setAiToolsText(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  💬 창작 의도 · 프롬프트 비하인드
                </label>
                <textarea
                  rows={2}
                  maxLength={1500}
                  value={creatorNote}
                  onChange={(e) => setCreatorNote(e.target.value)}
                  placeholder="어떤 내면의 감정과 상상력으로 이 작품을 빚었는지 남겨보세요."
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                />
              </div>

              {/* 형식별 세부 항목 */}
              {kind === "album" && (
                <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-900">💿 앨범 수록곡 목록</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTracks((p) => [...p, { title: "", audioUrl: "", lyricsOrMood: "" }])
                      }
                      className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900"
                    >
                      + 트랙 추가
                    </button>
                  </div>
                  {tracks.map((tr, i) => (
                    <div key={i} className="space-y-1.5 rounded-lg border border-amber-200/70 bg-white p-2.5">
                      <input
                        type="text"
                        value={tr.title}
                        onChange={(e) =>
                          setTracks((p) => p.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))
                        }
                        placeholder={`트랙 ${i + 1} 제목`}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={tr.audioUrl}
                          onChange={(e) =>
                            setTracks((p) =>
                              p.map((r, idx) => (idx === i ? { ...r, audioUrl: e.target.value } : r))
                            )
                          }
                          placeholder="음원 URL 또는 mp3/wav/m4a 직접 업로드"
                          className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                        />
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                          {uploadingSlot === `track-${i}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          <span>음원 업로드</span>
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) =>
                              void handleFileUpload(
                                e.target.files?.[0],
                                "audio",
                                `track-${i}`,
                                (url) =>
                                  setTracks((p) =>
                                    p.map((r, idx) => (idx === i ? { ...r, audioUrl: url } : r))
                                  )
                              )
                            }
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={tr.lyricsOrMood}
                        onChange={(e) =>
                          setTracks((p) =>
                            p.map((r, idx) => (idx === i ? { ...r, lyricsOrMood: e.target.value } : r))
                          )
                        }
                        placeholder="곡 분위기 · 가사 한 줄"
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              {kind === "exhibition" && (
                <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-900">🖼️ 전시 작품 목록</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPieces((p) => [...p, { title: "", imageUrl: "", docentNote: "" }])
                      }
                      className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900"
                    >
                      + 작품 추가
                    </button>
                  </div>
                  {pieces.map((pc, i) => (
                    <div key={i} className="space-y-1.5 rounded-lg border border-emerald-200/70 bg-white p-2.5">
                      <input
                        type="text"
                        value={pc.title}
                        onChange={(e) =>
                          setPieces((p) => p.map((r, idx) => (idx === i ? { ...r, title: e.target.value } : r)))
                        }
                        placeholder={`작품 ${i + 1} 제목`}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={pc.imageUrl}
                          onChange={(e) =>
                            setPieces((p) =>
                              p.map((r, idx) => (idx === i ? { ...r, imageUrl: e.target.value } : r))
                            )
                          }
                          placeholder="그림 URL 또는 png/jpg/webp 업로드"
                          className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                        />
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                          {uploadingSlot === `piece-${i}` ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          <span>그림 업로드</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              void handleFileUpload(
                                e.target.files?.[0],
                                "image",
                                `piece-${i}`,
                                (url) =>
                                  setPieces((p) =>
                                    p.map((r, idx) => (idx === i ? { ...r, imageUrl: url } : r))
                                  )
                              )
                            }
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={pc.docentNote}
                        onChange={(e) =>
                          setPieces((p) =>
                            p.map((r, idx) => (idx === i ? { ...r, docentNote: e.target.value } : r))
                          )
                        }
                        placeholder="도슨트 해설 (그림 속 의미)"
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              {kind === "novel" && (
                <div className="space-y-2 rounded-xl border border-purple-200 bg-purple-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-purple-900">📖 출판 챕터 목록</span>
                    <button
                      type="button"
                      onClick={() =>
                        setChapters((p) => [...p, { chapterTitle: `제${p.length + 1}화.`, body: "" }])
                      }
                      className="rounded bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-900"
                    >
                      + 챕터 추가
                    </button>
                  </div>
                  {chapters.map((ch, i) => (
                    <div key={i} className="space-y-1.5 rounded-lg border border-purple-200/70 bg-white p-2.5">
                      <input
                        type="text"
                        value={ch.chapterTitle}
                        onChange={(e) =>
                          setChapters((p) =>
                            p.map((r, idx) => (idx === i ? { ...r, chapterTitle: e.target.value } : r))
                          )
                        }
                        placeholder="챕터 제목"
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-bold"
                      />
                      <textarea
                        rows={4}
                        value={ch.body}
                        onChange={(e) =>
                          setChapters((p) =>
                            p.map((r, idx) => (idx === i ? { ...r, body: e.target.value } : r))
                          )
                        }
                        placeholder="소설 본문을 적어주세요."
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isBusy || uploadingSlot !== null}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-black text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>비상업 순수 창작 출판하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
