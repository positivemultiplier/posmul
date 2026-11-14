"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Music,
  Plus,
  Upload,
  Play,
  Square,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowUpDown,
  Disc3,
  Home,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardHeader,
  AdminCardTitle,
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from "../components/shadcn-admin-ui";

interface BgmTrackRecord {
  id: string;
  label: string;
  artist: string;
  mood_desc: string;
  audio_url: string | null;
  storage_path: string | null;
  waveform: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface HealingRoomStats {
  totalTracks: number;
  activeTracks: number;
  mp3Tracks: number;
  totalRooms: number;
}

function deriveTitleFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export default function AdminHealingRoomPage() {
  const [tracks, setTracks] = useState<BgmTrackRecord[]>([]);
  const [stats, setStats] = useState<HealingRoomStats>({
    totalTracks: 0,
    activeTracks: 0,
    mp3Tracks: 0,
    totalRooms: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // 추가 폼 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [artist, setArtist] = useState("PosMul Studio");
  const [moodDesc, setMoodDesc] = useState("");
  const [manualAudioUrl, setManualAudioUrl] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(5);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 미리듣기 오디오 상태
  const [playingId, setPlayingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  async function fetchBgmList() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/healing-room/bgm", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setTracks(data.tracks ?? []);
        if (data.stats) setStats(data.stats);
      } else {
        setFeedback({
          type: "error",
          message: data.error || "BGM 목록을 불러오지 못했습니다.",
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "네트워크 오류",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchBgmList();
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  function stopPreview() {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }
    setPlayingId(null);
  }

  function handleTogglePreview(track: BgmTrackRecord) {
    if (playingId === track.id) {
      stopPreview();
      return;
    }
    stopPreview();

    if (!track.audio_url) {
      setFeedback({
        type: "error",
        message: "이 트랙은 MP3 파일이 없는 Web Audio Lo-Fi 기본 트랙입니다.",
      });
      return;
    }

    const audio = new Audio(track.audio_url);
    audio.volume = 0.65;
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      setPlayingId(null);
      setFeedback({
        type: "error",
        message: `'${track.label}' 음원을 재생할 수 없습니다. URL을 확인해주세요.`,
      });
    };
    previewAudioRef.current = audio;
    setPlayingId(track.id);
    void audio.play().catch(() => {
      setPlayingId(null);
    });
  }

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    if (file && !label.trim()) {
      setLabel(deriveTitleFromFileName(file.name));
    }
  }

  async function handleAddBgm(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (!label.trim()) {
      setFeedback({ type: "error", message: "트랙 제목을 입력해주세요." });
      return;
    }

    if (!selectedFile && !manualAudioUrl.trim()) {
      setFeedback({
        type: "error",
        message: "MP3 오디오 파일을 선택하거나 오디오 URL을 입력해주세요.",
      });
      return;
    }

    setSubmitting(true);
    try {
      let finalAudioUrl = manualAudioUrl.trim() || null;
      let storagePath: string | null = null;

      if (selectedFile) {
        setUploadStage("1/3 업로드 서명 URL 발급 중...");
        const signRes = await fetch("/api/admin/healing-room/bgm/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: selectedFile.name }),
        });
        const signData = await signRes.json();
        if (!signRes.ok || !signData.success) {
          throw new Error(signData.error || "업로드 URL 발급 실패");
        }

        setUploadStage("2/3 Supabase Storage에 음원 업로드 중...");
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from(signData.bucket)
          .uploadToSignedUrl(signData.storagePath, signData.token, selectedFile);

        if (uploadError) {
          throw new Error(`파일 업로드 실패: ${uploadError.message}`);
        }

        finalAudioUrl = signData.publicUrl;
        storagePath = signData.storagePath;
      }

      setUploadStage("3/3 DB에 BGM 트랙 등록 중...");
      const saveRes = await fetch("/api/admin/healing-room/bgm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          artist: artist.trim() || "PosMul Studio",
          moodDesc: moodDesc.trim() || "PosMul 힐링룸 오리지널 감성 BGM",
          audioUrl: finalAudioUrl,
          storagePath,
          sortOrder: Number(sortOrder) || 5,
          isActive,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || "BGM DB 저장 실패");
      }

      setFeedback({
        type: "success",
        message: `새 BGM '${label.trim()}'이(가) DB에 등록되었습니다. 힐링룸 주크박스에 즉시 반영됩니다!`,
      });
      setSelectedFile(null);
      setLabel("");
      setMoodDesc("");
      setManualAudioUrl("");
      setShowAddForm(false);
      await fetchBgmList();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "BGM 등록 중 오류가 발생했습니다.",
      });
    } finally {
      setSubmitting(false);
      setUploadStage(null);
    }
  }

  async function handleToggleActive(track: BgmTrackRecord) {
    try {
      const res = await fetch("/api/admin/healing-room/bgm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: track.id, isActive: !track.is_active }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "상태 변경 실패");
      }
      setFeedback({
        type: "success",
        message: `'${track.label}' 상태를 ${!track.is_active ? "공개" : "숨김"}(으)로 변경했습니다.`,
      });
      await fetchBgmList();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "상태 변경 오류",
      });
    }
  }

  async function handleChangeSortOrder(track: BgmTrackRecord, nextOrder: number) {
    try {
      const res = await fetch("/api/admin/healing-room/bgm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: track.id, sortOrder: nextOrder }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "정렬 순서 변경 실패");
      }
      await fetchBgmList();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "정렬 순서 변경 오류",
      });
    }
  }

  async function handleDeleteTrack(track: BgmTrackRecord) {
    if (!confirm(`'${track.label}' BGM을 삭제하시겠습니까?\n(업로드된 음원 파일도 함께 삭제됩니다)`)) {
      return;
    }
    if (playingId === track.id) stopPreview();

    try {
      const res = await fetch(
        `/api/admin/healing-room/bgm?id=${encodeURIComponent(track.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "삭제 실패");
      }
      setFeedback({
        type: "success",
        message: `'${track.label}' BGM이 삭제되었습니다.`,
      });
      await fetchBgmList();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "삭제 오류",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              힐링룸 & BGM 관리
            </h1>
            <AdminBadge variant="purple">DB + Storage</AdminBadge>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            미니홈피 주크박스 BGM을 DB에서 직접 추가·업로드·정렬·공개 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/healing-room" target="_blank" rel="noopener noreferrer">
            <AdminButton variant="outline" size="sm" className="gap-1.5">
              <Home className="h-3.5 w-3.5" />
              힐링룸 열기
              <ExternalLink className="h-3 w-3 opacity-70" />
            </AdminButton>
          </Link>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => void fetchBgmList()}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </AdminButton>
          <AdminButton
            variant="default"
            size="sm"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? "등록 창 닫기" : "BGM 추가"}
          </AdminButton>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            닫기
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminCard>
          <AdminCardHeader className="pb-2">
            <AdminCardDescription>전체 등록 BGM</AdminCardDescription>
            <AdminCardTitle className="text-2xl text-white">
              {stats.totalTracks}곡
            </AdminCardTitle>
          </AdminCardHeader>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader className="pb-2">
            <AdminCardDescription>주크박스 공개 중</AdminCardDescription>
            <AdminCardTitle className="text-2xl text-emerald-400">
              {stats.activeTracks}곡
            </AdminCardTitle>
          </AdminCardHeader>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader className="pb-2">
            <AdminCardDescription>MP3 오리지널 음원</AdminCardDescription>
            <AdminCardTitle className="text-2xl text-indigo-400">
              {stats.mp3Tracks}곡
            </AdminCardTitle>
          </AdminCardHeader>
        </AdminCard>
        <AdminCard>
          <AdminCardHeader className="pb-2">
            <AdminCardDescription>개설된 힐링룸</AdminCardDescription>
            <AdminCardTitle className="text-2xl text-amber-300">
              {stats.totalRooms}개
            </AdminCardTitle>
          </AdminCardHeader>
        </AdminCard>
      </div>

      {/* Add BGM Form */}
      {showAddForm && (
        <AdminCard className="border-indigo-500/40 bg-[#0e111a]">
          <AdminCardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-indigo-400" />
              <AdminCardTitle>새 BGM 업로드 및 DB 등록</AdminCardTitle>
            </div>
            <AdminCardDescription>
              직접 만드신 MP3/WAV/M4A 음원 파일을 올리면 Supabase Storage에 업로드되고 즉시
              힐링룸 주크박스에 추가됩니다. (최대 50MB)
            </AdminCardDescription>
          </AdminCardHeader>
          <AdminCardContent>
            <form onSubmit={handleAddBgm} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* 파일 업로드 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    오디오 파일 업로드 (MP3, WAV, M4A, OGG)
                  </label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 px-4 py-5 text-center transition hover:border-indigo-500/70 hover:bg-zinc-900">
                    <Music className="mb-1.5 h-6 w-6 text-indigo-400" />
                    <span className="text-xs font-semibold text-zinc-200">
                      {selectedFile
                        ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
                        : "여기를 클릭하여 MP3 파일 선택"}
                    </span>
                    <span className="mt-1 text-[11px] text-zinc-500">
                      선택 시 제목이 자동으로 채워집니다
                    </span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                {/* 외부 URL 직접 입력 */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      또는 오디오 URL 직접 입력 (선택)
                    </label>
                    <input
                      type="text"
                      value={manualAudioUrl}
                      onChange={(e) => setManualAudioUrl(e.target.value)}
                      placeholder="https://... 또는 /audio/healing-room/..."
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        노출 순서 (낮을수록 상단)
                      </label>
                      <input
                        type="number"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(Number(e.target.value))}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-zinc-200">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-indigo-500"
                        />
                        등록 즉시 힐링룸 공개
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    곡 제목 *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="예: 얼어붙은 온기 (Original)"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    아티스트 / 제작자
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="PosMul Studio"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    감성 한줄 설명
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={moodDesc}
                    onChange={(e) => setMoodDesc(e.target.value)}
                    placeholder="겨울 감성과 잔잔한 여운이 어우러진 멜로디"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-indigo-300">
                  {uploadStage ?? ""}
                </span>
                <div className="flex items-center gap-2">
                  <AdminButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                    disabled={submitting}
                  >
                    취소
                  </AdminButton>
                  <AdminButton
                    type="submit"
                    variant="default"
                    size="sm"
                    disabled={submitting}
                    className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {submitting ? "업로드 및 등록 중..." : "업로드 및 BGM 등록"}
                  </AdminButton>
                </div>
              </div>
            </form>
          </AdminCardContent>
        </AdminCard>
      )}

      {/* BGM Table */}
      <AdminCard>
        <AdminCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Disc3 className="h-4 w-4 text-indigo-400" />
              <AdminCardTitle>힐링룸 BGM 라이브러리</AdminCardTitle>
            </div>
            <span className="text-[11px] text-zinc-500">
              테이블: user.healing_room_bgm_tracks
            </span>
          </div>
          <AdminCardDescription>
            노출 순서가 낮은 트랙이 주크박스 상단에 먼저 노출됩니다.
          </AdminCardDescription>
        </AdminCardHeader>
        <AdminCardContent>
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead className="w-20">순서</AdminTableHead>
                <AdminTableHead>트랙 / 설명</AdminTableHead>
                <AdminTableHead>유형</AdminTableHead>
                <AdminTableHead>미리듣기</AdminTableHead>
                <AdminTableHead>공개 상태</AdminTableHead>
                <AdminTableHead className="text-right">관리</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {tracks.length === 0 && !loading && (
                <AdminTableRow>
                  <AdminTableCell colSpan={6} className="py-8 text-center text-zinc-500">
                    등록된 BGM이 없습니다. 우측 상단 &apos;BGM 추가&apos; 버튼으로 첫 곡을 올려보세요.
                  </AdminTableCell>
                </AdminTableRow>
              )}

              {tracks.map((track) => {
                const isPlaying = playingId === track.id;
                return (
                  <AdminTableRow key={track.id}>
                    <AdminTableCell>
                      <div className="flex items-center gap-1">
                        <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                        <input
                          type="number"
                          defaultValue={track.sort_order}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (Number.isFinite(val) && val !== track.sort_order) {
                              void handleChangeSortOrder(track, val);
                            }
                          }}
                          className="w-14 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1 text-center text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-100">
                            {track.label}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            · {track.artist}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {track.mood_desc || "설명 없음"}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-600">
                          id: {track.id}
                        </p>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      {track.audio_url ? (
                        <AdminBadge variant="info">MP3 / 음원</AdminBadge>
                      ) : (
                        <AdminBadge variant="secondary">Lo-Fi 신스</AdminBadge>
                      )}
                    </AdminTableCell>
                    <AdminTableCell>
                      {track.audio_url ? (
                        <AdminButton
                          size="sm"
                          variant={isPlaying ? "default" : "outline"}
                          onClick={() => handleTogglePreview(track)}
                          className="gap-1 text-[11px]"
                        >
                          {isPlaying ? (
                            <>
                              <Square className="h-3 w-3 fill-current" />
                              정지
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 fill-current" />
                              재생
                            </>
                          )}
                        </AdminButton>
                      ) : (
                        <span className="text-[11px] text-zinc-500">Web Audio</span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(track)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium transition hover:border-zinc-500"
                      >
                        {track.is_active ? (
                          <>
                            <Eye className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-300">공개 중</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 text-zinc-500" />
                            <span className="text-zinc-400">숨김</span>
                          </>
                        )}
                      </button>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleDeleteTrack(track)}
                        className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </AdminButton>
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </AdminTableBody>
          </AdminTable>
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
