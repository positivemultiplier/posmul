"use client";

import React, { useState } from "react";
import {
  BookOpen,
  CalendarClock,
  Edit3,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type {
  HealingWorldview,
  SaveWorldviewInput,
  WorldviewCharacterItem,
  WorldviewTimelineItem,
} from "../healing-room-service";

interface WorldviewTabPanelProps {
  worldview: HealingWorldview | null;
  ownerNickname: string;
  isOwner: boolean;
  isAuthenticated: boolean;
  isBusy: boolean;
  titleColorClass: string;
  onSaveWorldview: (input: SaveWorldviewInput) => Promise<boolean>;
  onJumpToCreations: () => void;
}

export function WorldviewTabPanel({
  worldview,
  ownerNickname,
  isOwner,
  isAuthenticated,
  isBusy,
  titleColorClass,
  onSaveWorldview,
  onJumpToCreations,
}: WorldviewTabPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [universeTitle, setUniverseTitle] = useState(worldview?.universeTitle ?? "");
  const [tagline, setTagline] = useState(worldview?.tagline ?? "");
  const [genreTagsText, setGenreTagsText] = useState(
    (worldview?.genreTags ?? []).join(", ")
  );
  const [prologueMd, setPrologueMd] = useState(worldview?.prologueMd ?? "");
  const [timeline, setTimeline] = useState<WorldviewTimelineItem[]>(
    worldview?.timeline ?? []
  );
  const [characters, setCharacters] = useState<WorldviewCharacterItem[]>(
    worldview?.characters ?? []
  );

  const openEditor = () => {
    setUniverseTitle(worldview?.universeTitle ?? `${ownerNickname}의 내면 우주`);
    setTagline(
      worldview?.tagline ??
        "현실의 직함 대신 오직 내 취향과 서사로만 살아 숨 쉬는 비상업 세계관"
    );
    setGenreTagsText(
      (worldview?.genreTags ?? ["일상 판타지", "로파이 감성"]).join(", ")
    );
    setPrologueMd(
      worldview?.prologueMd ??
        "### 이 세계가 시작된 이유\n현실에서는 쉽게 드러내지 못했던 나만의 상상력과 분위기를 이곳에 차곡차곡 기록합니다."
    );
    setTimeline(
      worldview?.timeline && worldview.timeline.length > 0
        ? worldview.timeline
        : [{ era: "Chapter 01", title: "첫 번째 영감의 문", summary: "새로운 세계관의 첫 페이지를 펼침" }]
    );
    setCharacters(
      worldview?.characters && worldview.characters.length > 0
        ? worldview.characters
        : [{ name: ownerNickname, role: "세계의 관측자", trait: "호기심 · 수집가", bio: "이 방의 음악과 그림과 이야기를 빚어내는 주인." }]
    );
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const genreTags = genreTagsText
      .split(/[,，#]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const ok = await onSaveWorldview({
      universeTitle,
      tagline,
      genreTags,
      prologueMd,
      timeline,
      characters,
      nonCommercialPledge: true,
    });
    if (ok) {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 상단 세계관 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div>
          <h3 className={`text-sm font-black ${titleColorClass}`}>
            {worldview?.universeTitle ?? `${ownerNickname}의 내면 세계관`}
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            현실의 나를 잠시 내려놓고, AI 음악·그림·소설이 태어나는 나만의 고유한 우주 설정집
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            비상업 순수 창작
          </span>
          {isOwner && !isEditing && (
            <button
              type="button"
              onClick={openEditor}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              <Edit3 className="h-3 w-3" />
              <span>{worldview ? "세계관 편집" : "세계관 열기"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 방 주인 편집 모드 */}
      {isOwner && isEditing ? (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-indigo-900">
              나만의 세계관 바이블 집필
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" /> 취소
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700">
                세계관 이름 *
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={universeTitle}
                onChange={(e) => setUniverseTitle(e.target.value)}
                placeholder="예: 노을빛 다락방 연대기"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700">
                장르·분위기 태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={genreTagsText}
                onChange={(e) => setGenreTagsText(e.target.value)}
                placeholder="예: 사이버펑크, 로파이 감성, 잔잔한 동화"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              한 줄 슬로건 (내면의 선언)
            </label>
            <input
              type="text"
              maxLength={120}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="방문자가 처음 보게 될 세계관의 핵심 문장"
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              세계관 서문 &amp; 핵심 설정 (이 세상의 법칙·배경 이야기)
            </label>
            <textarea
              rows={5}
              maxLength={4000}
              value={prologueMd}
              onChange={(e) => setPrologueMd(e.target.value)}
              placeholder="이 세계는 언제 시작되었고 어떤 분위기인지 자유롭게 들려주세요."
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs leading-relaxed text-slate-800"
            />
          </div>

          {/* 연대기 편집 */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700">
                세계관 연대기 (사건 흐름)
              </span>
              <button
                type="button"
                onClick={() =>
                  setTimeline((prev) => [
                    ...prev,
                    { era: `Chapter 0${prev.length + 1}`, title: "", summary: "" },
                  ])
                }
                className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
              >
                <Plus className="h-3 w-3" /> 사건 추가
              </button>
            </div>
            {timeline.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2 sm:grid-cols-12">
                <input
                  type="text"
                  value={item.era}
                  onChange={(e) =>
                    setTimeline((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, era: e.target.value } : row))
                    )
                  }
                  placeholder="시기 (예: Year 01)"
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] sm:col-span-3"
                />
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) =>
                    setTimeline((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, title: e.target.value } : row))
                    )
                  }
                  placeholder="사건 제목"
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] sm:col-span-4"
                />
                <input
                  type="text"
                  value={item.summary}
                  onChange={(e) =>
                    setTimeline((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, summary: e.target.value } : row))
                    )
                  }
                  placeholder="요약 설명"
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] sm:col-span-4"
                />
                <button
                  type="button"
                  onClick={() => setTimeline((prev) => prev.filter((_, i) => i !== idx))}
                  className="flex items-center justify-center rounded bg-rose-50 px-2 py-1 text-rose-600 hover:bg-rose-100 sm:col-span-1"
                  title="삭제"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {/* 등장인물 도감 편집 */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700">
                등장인물 도감 (이 세계에 사는 존재들)
              </span>
              <button
                type="button"
                onClick={() =>
                  setCharacters((prev) => [
                    ...prev,
                    { name: "", role: "", trait: "", bio: "" },
                  ])
                }
                className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
              >
                <Plus className="h-3 w-3" /> 인물 추가
              </button>
            </div>
            {characters.map((ch, idx) => (
              <div key={idx} className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2">
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-12">
                  <input
                    type="text"
                    value={ch.name}
                    onChange={(e) =>
                      setCharacters((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row))
                      )
                    }
                    placeholder="이름"
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] sm:col-span-4"
                  />
                  <input
                    type="text"
                    value={ch.role}
                    onChange={(e) =>
                      setCharacters((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, role: e.target.value } : row))
                      )
                    }
                    placeholder="역할 (예: 야간 관측사)"
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] sm:col-span-4"
                  />
                  <input
                    type="text"
                    value={ch.trait}
                    onChange={(e) =>
                      setCharacters((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, trait: e.target.value } : row))
                      )
                    }
                    placeholder="성격/시그니처"
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] sm:col-span-3"
                  />
                  <button
                    type="button"
                    onClick={() => setCharacters((prev) => prev.filter((_, i) => i !== idx))}
                    className="flex items-center justify-center rounded bg-rose-50 px-2 py-1 text-rose-600 hover:bg-rose-100 sm:col-span-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={ch.bio}
                  onChange={(e) =>
                    setCharacters((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, bio: e.target.value } : row))
                    )
                  }
                  placeholder="이 캐릭터의 사연과 매력을 한 줄로 적어주세요."
                  className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[11px]"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10.5px] text-indigo-700">
              ※ 순수 비상업 아카이브 서약이 자동 적용됩니다.
            </span>
            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>세계관 저장하기</span>
            </button>
          </div>
        </form>
      ) : worldview ? (
        <div className="space-y-4">
          {/* 세계관 배너 */}
          <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-4 text-white shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                <Sparkles className="h-3 w-3" />
                CREATOR UNIVERSE
              </span>
              <div className="flex flex-wrap gap-1">
                {worldview.genreTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-sky-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <h4 className="mt-2 text-base font-black tracking-tight text-white">
              {worldview.universeTitle}
            </h4>
            {worldview.tagline && (
              <p className="mt-1 text-xs leading-relaxed text-indigo-100/90">
                &ldquo;{worldview.tagline}&rdquo;
              </p>
            )}
          </div>

          {/* 서문 & 세계 규칙 */}
          {worldview.prologueMd && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-slate-800">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                <span>세계관 프롤로그 &amp; 설정 노트</span>
              </div>
              <div className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                {worldview.prologueMd}
              </div>
            </div>
          )}

          {/* 연대기 + 등장인물 2단 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="mb-2.5 flex items-center gap-1.5 text-xs font-black text-slate-800">
                <CalendarClock className="h-3.5 w-3.5 text-amber-600" />
                <span>세계관 연대기</span>
              </div>
              {worldview.timeline.length > 0 ? (
                <div className="space-y-2 border-l-2 border-amber-200 pl-3">
                  {worldview.timeline.map((ev, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <span className="inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-extrabold text-amber-800">
                        {ev.era}
                      </span>
                      <div className="text-xs font-bold text-slate-800">{ev.title}</div>
                      {ev.summary && (
                        <p className="text-[11px] leading-snug text-slate-600">{ev.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">아직 기록된 연대기가 없습니다.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="mb-2.5 flex items-center gap-1.5 text-xs font-black text-slate-800">
                <Users className="h-3.5 w-3.5 text-purple-600" />
                <span>등장인물 도감</span>
              </div>
              {worldview.characters.length > 0 ? (
                <div className="space-y-2">
                  {worldview.characters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-800">{ch.name}</span>
                        {ch.role && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9.5px] font-bold text-purple-800">
                            {ch.role}
                          </span>
                        )}
                      </div>
                      {ch.trait && (
                        <div className="mt-0.5 text-[10px] font-semibold text-indigo-600">
                          {ch.trait}
                        </div>
                      )}
                      {ch.bio && (
                        <p className="mt-1 text-[11px] leading-snug text-slate-600">{ch.bio}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">아직 등록된 등장인물이 없습니다.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-2.5">
            <span className="text-[11px] font-semibold text-indigo-900">
              이 세계관에서 탄생한 음악 앨범 · 그림 전시 · 소설을 확인해 보세요!
            </span>
            <button
              type="button"
              onClick={onJumpToCreations}
              className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700"
            >
              작품관 보기 →
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-2.5">
          <div className="text-2xl"></div>
          <div className="text-xs font-black text-slate-700">
            아직 {ownerNickname}님의 세계관 바이블이 열리지 않았습니다.
          </div>
          <p className="mx-auto max-w-md text-[11px] leading-relaxed text-slate-500">
            현실의 취향을 소비하는 대신, 내가 사랑하는 음악·그림·이야기가 태어나는 나만의 고유한 세계를 정의해 보세요.
          </p>
          {isOwner ? (
            <button
              type="button"
              onClick={openEditor}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>첫 번째 세계관 열기</span>
            </button>
          ) : !isAuthenticated ? (
            <p className="text-[10.5px] text-amber-700 font-semibold">
              로그인하면 나만의 힐링룸과 세계관을 개설할 수 있습니다!
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
