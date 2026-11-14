"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Layers,
  Play,
  RefreshCw,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardHeader,
  AdminCardTitle,
} from "../../components/shadcn-admin-ui";

type RecurrenceType = "once" | "daily" | "weekly" | "monthly";

interface TemplateViewItem {
  id: string;
  title: string;
  category: string;
  rawCategory: string;
  predictionType: string;
  recurrence: RecurrenceType;
  oracleType: string;
  durationHours: number;
  settlementDelayHours: number;
  minimumStake: number;
  maximumStake: number;
  importance: string;
  isActive: boolean;
  scheduledAt: string;
  hasOverride: boolean;
  hasActiveGame: boolean;
  activeGameId: string | null;
}

interface TemplateDraftEdit {
  isActive: boolean;
  recurrence: RecurrenceType;
  durationHours: number;
  settlementDelayHours: number;
  minimumStake: number;
  maximumStake: number;
}

export default function AdminPredictionTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateViewItem[]>([]);
  const [edits, setEdits] = useState<Record<string, TemplateDraftEdit>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/scheduler/config", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "템플릿 목록을 불러오지 못했습니다.");
      }

      const list: TemplateViewItem[] = Array.isArray(data.templates)
        ? data.templates
        : [];
      setTemplates(list);

      const initialEdits: Record<string, TemplateDraftEdit> = {};
      for (const tpl of list) {
        initialEdits[tpl.id] = {
          isActive: tpl.isActive,
          recurrence: tpl.recurrence,
          durationHours: tpl.durationHours,
          settlementDelayHours: tpl.settlementDelayHours,
          minimumStake: tpl.minimumStake,
          maximumStake: tpl.maximumStake,
        };
      }
      setEdits(initialEdits);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBanner({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const categories = useMemo(() => {
    const set = new Set<string>(templates.map((t) => t.category));
    return ["ALL", ...Array.from(set)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((tpl) => {
      if (categoryFilter !== "ALL" && tpl.category !== categoryFilter) {
        return false;
      }
      if (
        q &&
        !tpl.title.toLowerCase().includes(q) &&
        !tpl.id.toLowerCase().includes(q) &&
        !tpl.oracleType.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [templates, categoryFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = templates.length;
    const activeTpl = templates.filter((t) => edits[t.id]?.isActive ?? t.isActive).length;
    const liveGames = templates.filter((t) => t.hasActiveGame).length;
    const customized = templates.filter((t) => t.hasOverride).length;
    return { total, activeTpl, liveGames, customized };
  }, [templates, edits]);

  const updateEdit = (
    id: string,
    patch: Partial<TemplateDraftEdit>
  ) => {
    setEdits((prev) => {
      const base = prev[id];
      if (!base) return prev;
      return {
        ...prev,
        [id]: { ...base, ...patch },
      };
    });
  };

  const handleSaveTemplate = async (tpl: TemplateViewItem) => {
    const draft = edits[tpl.id];
    if (!draft) return;
    setSavingId(tpl.id);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/scheduler/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-template",
          templateId: tpl.id,
          override: draft,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "템플릿 설정 저장 실패");
      }
      setBanner({
        type: "success",
        text: `[${tpl.id}] 템플릿 설정이 DB 오버라이드에 저장되었습니다.`,
      });
      await fetchTemplates();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBanner({ type: "error", text: message });
    } finally {
      setSavingId(null);
    }
  };

  const handlePublishTemplate = async (tpl: TemplateViewItem) => {
    setPublishingId(tpl.id);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/scheduler/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish-template",
          templateId: tpl.id,
          force: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "템플릿 강제 발행 실패");
      }
      const createdCount = Array.isArray(data.syncResult?.createdGameIds)
        ? data.syncResult.createdGameIds.length
        : 0;
      setBanner({
        type: createdCount > 0 ? "success" : "error",
        text:
          createdCount > 0
            ? `'${tpl.title}' 게임이 신규 발행되었습니다 (ID: ${data.syncResult.createdGameIds[0]}).`
            : `'${tpl.title}' 발행 결과 생성된 게임이 없습니다 (중복 혹은 DB 확인 필요).`,
      });
      await fetchTemplates();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBanner({ type: "error", text: message });
    } finally {
      setPublishingId(null);
    }
  };

  const handleSyncAllActive = async () => {
    setSyncingAll(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/scheduler/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run-manual-step",
          step: "template-sync",
          materializeTemplates: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "일괄 발행 실패");
      }
      setBanner({
        type: "success",
        text: `활성 템플릿 일괄 동기화 완료 (신규 발행: ${data.summary?.templateCreatedCount ?? 0}건)`,
      });
      await fetchTemplates();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setBanner({ type: "error", text: message });
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AdminBadge variant="info">SCHEDULED TEMPLATES</AdminBadge>
            <AdminBadge variant="success">{stats.activeTpl} / {stats.total} 활성</AdminBadge>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" />
            정기 예측게임 템플릿 카탈로그 & 개별 발행 제어
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            한국은행·통계청·DART·KOBIS·AlphaVantage·CoinGecko·EPL 등 공식 오라클 템플릿별 ON/OFF, 주기, 마감/정산 지연, 베팅 한도를 개별 커스터마이징하고 즉시 발행할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/prediction/scheduler">
            <AdminButton variant="secondary" size="sm">
              <CalendarClock className="w-3.5 h-3.5 text-sky-400" />
              마스터 스케줄러
            </AdminButton>
          </Link>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => void fetchTemplates()}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </AdminButton>
          <AdminButton
            variant="amber"
            size="sm"
            onClick={() => void handleSyncAllActive()}
            disabled={syncingAll}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {syncingAll ? "활성 템플릿 발행 중..." : "미발행 활성 템플릿 일괄 발행"}
          </AdminButton>
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-semibold flex items-center justify-between ${
            banner.type === "success"
              ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/50 border-rose-500/40 text-rose-300"
          }`}
        >
          <span className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            {banner.text}
          </span>
          <button
            onClick={() => setBanner(null)}
            className="text-zinc-400 hover:text-white ml-4"
          >
            닫기
          </button>
        </div>
      )}

      {/* 요약 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminCard>
          <AdminCardContent className="p-4">
            <div className="text-[11px] text-zinc-400 font-semibold">전체 등록 템플릿</div>
            <div className="text-2xl font-black text-white mt-1">{stats.total}개</div>
          </AdminCardContent>
        </AdminCard>
        <AdminCard>
          <AdminCardContent className="p-4">
            <div className="text-[11px] text-zinc-400 font-semibold">자동 발행 활성(ON)</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.activeTpl}개</div>
          </AdminCardContent>
        </AdminCard>
        <AdminCard>
          <AdminCardContent className="p-4">
            <div className="text-[11px] text-zinc-400 font-semibold">현재 마켓 진행 중(ACTIVE)</div>
            <div className="text-2xl font-black text-sky-400 mt-1">{stats.liveGames}개</div>
          </AdminCardContent>
        </AdminCard>
        <AdminCard>
          <AdminCardContent className="p-4">
            <div className="text-[11px] text-zinc-400 font-semibold">DB 커스텀 오버라이드</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{stats.customized}개</div>
          </AdminCardContent>
        </AdminCard>
      </div>

      {/* 필터 & 검색 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <AdminButton
              key={cat}
              variant={categoryFilter === cat ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === "ALL" ? `전체 (${templates.length})` : cat}
            </AdminButton>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목, 템플릿 ID, 오라클 검색..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* 템플릿 카드 리스트 */}
      {loading && templates.length === 0 ? (
        <AdminCard>
          <AdminCardContent className="p-10 text-center text-xs text-zinc-500">
            템플릿 카탈로그를 불러오는 중입니다...
          </AdminCardContent>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredTemplates.map((tpl) => {
            const draft = edits[tpl.id] ?? {
              isActive: tpl.isActive,
              recurrence: tpl.recurrence,
              durationHours: tpl.durationHours,
              settlementDelayHours: tpl.settlementDelayHours,
              minimumStake: tpl.minimumStake,
              maximumStake: tpl.maximumStake,
            };

            const isDirty =
              draft.isActive !== tpl.isActive ||
              draft.recurrence !== tpl.recurrence ||
              draft.durationHours !== tpl.durationHours ||
              draft.settlementDelayHours !== tpl.settlementDelayHours ||
              draft.minimumStake !== tpl.minimumStake ||
              draft.maximumStake !== tpl.maximumStake;

            return (
              <AdminCard
                key={tpl.id}
                className={
                  draft.isActive
                    ? "border-zinc-800"
                    : "border-zinc-800/50 opacity-75"
                }
              >
                <AdminCardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AdminBadge variant="purple">{tpl.category}</AdminBadge>
                      <AdminBadge variant="secondary">{tpl.predictionType}</AdminBadge>
                      <AdminBadge variant="info">
                        Oracle: {tpl.oracleType}
                      </AdminBadge>
                      {tpl.hasOverride && (
                        <AdminBadge variant="warning">커스텀 적용됨</AdminBadge>
                      )}
                      {tpl.hasActiveGame ? (
                        <AdminBadge variant="success">현재 ACTIVE 진행 중</AdminBadge>
                      ) : (
                        <AdminBadge variant="outline">대기 중 (미발행)</AdminBadge>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateEdit(tpl.id, { isActive: !draft.isActive })
                      }
                      className={`px-3 py-1 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
                        draft.isActive
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {draft.isActive ? "자동 ON" : "자동 OFF"}
                    </button>
                  </div>

                  <AdminCardTitle className="text-sm font-bold text-white leading-snug">
                    {tpl.title}
                  </AdminCardTitle>
                  <AdminCardDescription className="font-mono text-[11px] text-zinc-500">
                    ID: {tpl.id} · 중요도: {tpl.importance}
                    {tpl.activeGameId && ` · 활성 Game: ${tpl.activeGameId}`}
                  </AdminCardDescription>
                </AdminCardHeader>

                <AdminCardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold text-zinc-400">
                        반복 주기
                      </span>
                      <select
                        value={draft.recurrence}
                        onChange={(e) =>
                          updateEdit(tpl.id, {
                            recurrence: e.target.value as RecurrenceType,
                          })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[11px] text-zinc-100"
                      >
                        <option value="daily">daily (매일)</option>
                        <option value="weekly">weekly (매주)</option>
                        <option value="monthly">monthly (매월)</option>
                        <option value="once">once (1회)</option>
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold text-zinc-400">
                        베팅 기간(시간)
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={720}
                        value={draft.durationHours}
                        onChange={(e) =>
                          updateEdit(tpl.id, {
                            durationHours: Number(e.target.value) || 1,
                          })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[11px] text-white"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold text-zinc-400">
                        정산 지연(시간)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={168}
                        value={draft.settlementDelayHours}
                        onChange={(e) =>
                          updateEdit(tpl.id, {
                            settlementDelayHours: Math.max(
                              0,
                              Number(e.target.value) || 0
                            ),
                          })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[11px] text-white"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold text-zinc-400">
                        최소 베팅
                      </span>
                      <input
                        type="number"
                        min={10}
                        step={100}
                        value={draft.minimumStake}
                        onChange={(e) =>
                          updateEdit(tpl.id, {
                            minimumStake: Number(e.target.value) || 100,
                          })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[11px] text-white"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold text-zinc-400">
                        최대 베팅
                      </span>
                      <input
                        type="number"
                        min={100}
                        step={1000}
                        value={draft.maximumStake}
                        onChange={(e) =>
                          updateEdit(tpl.id, {
                            maximumStake: Number(e.target.value) || 10000,
                          })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[11px] text-white"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/70">
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      예정 시각: {new Date(tpl.scheduledAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                    </span>

                    <div className="flex items-center gap-2">
                      <AdminButton
                        variant={isDirty ? "amber" : "secondary"}
                        size="sm"
                        onClick={() => void handleSaveTemplate(tpl)}
                        disabled={savingId === tpl.id}
                      >
                        <Save className="w-3 h-3" />
                        {savingId === tpl.id
                          ? "저장 중..."
                          : isDirty
                            ? "변경 저장"
                            : "설정 저장"}
                      </AdminButton>

                      <AdminButton
                        variant="emerald"
                        size="sm"
                        onClick={() => void handlePublishTemplate(tpl)}
                        disabled={publishingId === tpl.id}
                      >
                        <Play className="w-3 h-3" />
                        {publishingId === tpl.id ? "발행 중..." : "지금 1회 발행"}
                      </AdminButton>
                    </div>
                  </div>
                </AdminCardContent>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
