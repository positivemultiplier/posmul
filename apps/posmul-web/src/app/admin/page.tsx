import React from "react";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/shared/lib/security/admin-auth";
import { getLiveRoomsWithStatusAction } from "@/app/live/actions/live.actions";
import { parseGameOptions } from "@/bounded-contexts/prediction/infrastructure/repositories/prediction-query.repository";
import {
  AdminOverviewClient,
  type AdminGameRow,
  type AdminSettlementSourceRow,
  type AdminLiveRoomSummary,
} from "./components/AdminOverviewClient";

export const revalidate = 0;

export default async function AdminMainPage() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    if (auth.reason === "UNAUTHORIZED") {
      redirect("/auth/login?redirect=/admin");
    }
    return null;
  }

  // Supabase 실데이터 병렬 조회
  const [
    gamesRes,
    settledCountRes,
    predictionsRes,
    feedCountRes,
    billsCountRes,
    forumCountRes,
    liveMsgCountRes,
    settlementSourcesRes,
    liveRoomsRes,
  ] = await Promise.all([
    supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select(
        "game_id, slug, title, category, subcategory, status, data_source, external_id, settlement_type, registration_end, settlement_date, game_options, created_at"
      )
      .in("status", ["ACTIVE", "SETTLED"])
      .order("created_at", { ascending: false })
      .limit(60),
    supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("*", { count: "exact", head: true })
      .eq("status", "SETTLED"),
    supabaseAdmin
      .schema("prediction")
      .from("predictions")
      .select("bet_amount")
      .eq("is_active", true),
    supabaseAdmin
      .schema("feed")
      .from("feed_items")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .schema("feed")
      .from("assembly_bills")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .schema("forum")
      .from("forum_posts")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .schema("forum")
      .from("live_room_messages")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .schema("prediction")
      .from("settlement_sources")
      .select("id, game_id, source_type, source_config, external_id, scheduled_at")
      .order("scheduled_at", { ascending: true }),
    getLiveRoomsWithStatusAction(),
  ]);

  const rawGames = gamesRes.data || [];
  const activeGames = rawGames.filter((g) => g.status === "ACTIVE");
  const predictions = predictionsRes.data || [];
  const totalStakePmp = predictions.reduce(
    (acc, row) => acc + (Number(row.bet_amount) || 0),
    0
  );

  // 게임 ID -> 제목 맵
  const gameTitleMap = new Map<string, string>();
  rawGames.forEach((g) => {
    gameTitleMap.set(g.game_id, g.title);
  });

  const mappedGames: AdminGameRow[] = rawGames.map((g) => {
    const parsed = parseGameOptions(g.game_options);
    return {
      game_id: g.game_id,
      slug: g.slug,
      title: g.title,
      category: g.category || "ECONOMY",
      subcategory: g.subcategory,
      status: g.status,
      data_source: g.data_source,
      external_id: g.external_id,
      settlement_type: g.settlement_type,
      registration_end: g.registration_end,
      settlement_date: g.settlement_date,
      options:
        parsed.length >= 2
          ? parsed.map((o: any, i: number) => ({
              id: o.id || `opt_${i + 1}`,
              label: o.label || o.text || `옵션 ${i + 1}`,
            }))
          : [
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
            ],
    };
  });

  const mappedSettlementSources: AdminSettlementSourceRow[] = (
    settlementSourcesRes.data || []
  ).map((s: any) => ({
    id: s.id,
    game_id: s.game_id,
    game_title: gameTitleMap.get(s.game_id) || `Game ${String(s.game_id).slice(0, 8)}`,
    source_type: s.source_type,
    external_id: s.external_id,
    scheduled_at: s.scheduled_at,
    config_summary: JSON.stringify(s.source_config || {}),
  }));

  // 카테고리별 분포 집계
  const catMeta: Array<{
    category: string;
    label: string;
    colorClass: string;
  }> = [
    {
      category: "ECONOMY",
      label: "📈 경제 · 증시 · 실적 · 거시지표",
      colorClass: "bg-gradient-to-r from-sky-500 to-blue-600",
    },
    {
      category: "ENTERTAINMENT",
      label: "🎬 엔터 · 박스오피스 · 드라마 시청률 · 음원",
      colorClass: "bg-gradient-to-r from-fuchsia-500 to-purple-600",
    },
    {
      category: "SPORTS",
      label: "⚽ 스포츠 · 프로야구(KBO) · 해외축구(EPL)",
      colorClass: "bg-gradient-to-r from-emerald-500 to-teal-600",
    },
    {
      category: "POLITICS",
      label: "🏛️ 정치 · 국회 본회의 입법 · 정책",
      colorClass: "bg-gradient-to-r from-amber-500 to-orange-600",
    },
    {
      category: "INVEST",
      label: "💳 소비 · 트렌드 · 소셜 임팩트",
      colorClass: "bg-gradient-to-r from-indigo-500 to-violet-600",
    },
  ];

  const categoryBreakdown = catMeta.map((m) => ({
    ...m,
    count: activeGames.filter((g) => g.category === m.category).length,
  }));

  const liveRoomsSummary: AdminLiveRoomSummary[] = (liveRoomsRes.rooms || [])
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      categoryLabel: r.categoryLabel,
      title: r.title,
      viewerCount: r.viewerCount,
      statusText:
        r.matchScore?.statusText ||
        (r.status === "ENDED" ? "정산완료" : r.status === "CLOSED" ? "마감" : "LIVE"),
      linkedGameSlug: r.predictionGame?.slug || r.predictionGame?.id || "",
      linkedGameQuestion: r.predictionGame?.question || "",
      oracleLabel: r.predictionGame?.oracleLabel || "공인 오라클",
      totalPoolPmc: r.predictionGame?.totalPoolPmc || 2500,
    }));

  return (
    <AdminOverviewClient
      metrics={{
        activeGamesCount: activeGames.length,
        settledGamesCount: settledCountRes.count || 0,
        totalBetsCount: predictions.length,
        totalStakePmp,
        feedItemsCount: feedCountRes.count || 0,
        billsCount: billsCountRes.count || 0,
        forumPostsCount: forumCountRes.count || 0,
        liveMessagesCount: liveMsgCountRes.count || 0,
        settlementQueueCount: mappedSettlementSources.length,
      }}
      categoryBreakdown={categoryBreakdown}
      games={mappedGames}
      settlementSources={mappedSettlementSources}
      liveRooms={liveRoomsSummary}
    />
  );
}
