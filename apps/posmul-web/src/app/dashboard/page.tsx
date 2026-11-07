import { Suspense } from "react";
import { createClient } from "../../lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { LIVE_ROOMS } from "../live/live-rooms.data";
import {
  DEFAULT_PERSONALIZATION,
  type UserPersonalizationSettings,
} from "./personalization-types";
import {
  UserDashboardClient,
  type DashboardGameItem,
  type DashboardPredictionItem,
  type DashboardLiveRoomItem,
  type DashboardTransactionItem,
} from "./components/UserDashboardClient";

export const dynamic = "force-dynamic";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

function parseOptions(raw: any): Array<{ id: string; label: string; odds?: number }> {
  if (!raw) return [];
  try {
    const val = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(val)) {
      return val.map((o: any, idx: number) => ({
        id: String(o.id || `opt-${idx}`),
        label: String(o.label || o.name || o.text || `선택지 ${idx + 1}`),
        odds: typeof o.odds === "number" ? o.odds : undefined,
      }));
    }
    if (val && typeof val === "object" && Array.isArray(val.options)) {
      return val.options.map((o: any, idx: number) => ({
        id: String(o.id || `opt-${idx}`),
        label: String(o.label || o.name || o.text || `선택지 ${idx + 1}`),
        odds: typeof o.odds === "number" ? o.odds : undefined,
      }));
    }
  } catch {
    // 무시
  }
  return [];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const targetUserId = user?.id || DEMO_USER_ID;

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 병렬 서버 조회
  const [
    profileRes,
    accountRes,
    scoreRes,
    activeGamesRes,
    sourcesRes,
    myPredsRes,
  ] = await Promise.all([
    admin
      .schema("user")
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .maybeSingle(),
    admin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmp_balance, pmc_balance")
      .eq("user_id", targetUserId)
      .maybeSingle(),
    admin
      .schema("ranking")
      .from("user_scores")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle(),
    admin
      .schema("prediction")
      .from("prediction_games")
      .select(
        "game_id, slug, title, category, subcategory, status, prize_pool, total_pool, participants_count, end_time, settlement_date, game_options"
      )
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })
      .limit(24),
    admin
      .schema("prediction")
      .from("settlement_sources")
      .select("game_id, source_type"),
    admin
      .schema("prediction")
      .from("predictions")
      .select(
        "prediction_id, game_id, prediction_data, bet_amount, confidence_level, is_active, created_at"
      )
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const profile = profileRes.data;
  const account = accountRes.data;
  const score = scoreRes.data;

  // 개인맞춤 설정 파싱
  const rawNotif = (profile?.notification_preferences || {}) as Record<string, any>;
  const rawPrivacy = (profile?.privacy_settings || {}) as Record<string, any>;
  const savedP = (rawNotif.personalization || {}) as Partial<UserPersonalizationSettings>;

  const personalization: UserPersonalizationSettings = {
    avatarEmoji: savedP.avatarEmoji || DEFAULT_PERSONALIZATION.avatarEmoji,
    sido: score?.sido || savedP.sido || DEFAULT_PERSONALIZATION.sido,
    jobGroup: score?.job_group || savedP.jobGroup || DEFAULT_PERSONALIZATION.jobGroup,
    favoriteDomains:
      Array.isArray(savedP.favoriteDomains) && savedP.favoriteDomains.length > 0
        ? savedP.favoriteDomains
        : DEFAULT_PERSONALIZATION.favoriteDomains,
    favoriteLiveCategories:
      Array.isArray(savedP.favoriteLiveCategories) && savedP.favoriteLiveCategories.length > 0
        ? savedP.favoriteLiveCategories
        : DEFAULT_PERSONALIZATION.favoriteLiveCategories,
    defaultBetPmp: Number(savedP.defaultBetPmp) || DEFAULT_PERSONALIZATION.defaultBetPmp,
    defaultConfidence:
      Number(savedP.defaultConfidence) || DEFAULT_PERSONALIZATION.defaultConfidence,
    defaultLanding: savedP.defaultLanding || DEFAULT_PERSONALIZATION.defaultLanding,
    notifications: {
      settlementAlert:
        savedP.notifications?.settlementAlert ??
        DEFAULT_PERSONALIZATION.notifications.settlementAlert,
      liveRoomAlert:
        savedP.notifications?.liveRoomAlert ??
        DEFAULT_PERSONALIZATION.notifications.liveRoomAlert,
      moneyWaveAlert:
        savedP.notifications?.moneyWaveAlert ??
        DEFAULT_PERSONALIZATION.notifications.moneyWaveAlert,
      forumReplyAlert:
        savedP.notifications?.forumReplyAlert ??
        DEFAULT_PERSONALIZATION.notifications.forumReplyAlert,
    },
    privacy: {
      profilePublic:
        rawPrivacy.profile_public ??
        savedP.privacy?.profilePublic ??
        DEFAULT_PERSONALIZATION.privacy.profilePublic,
      rankingPublic:
        rawPrivacy.ranking_public ??
        savedP.privacy?.rankingPublic ??
        DEFAULT_PERSONALIZATION.privacy.rankingPublic,
      predictionHistoryPublic:
        rawPrivacy.activity_public ??
        savedP.privacy?.predictionHistoryPublic ??
        DEFAULT_PERSONALIZATION.privacy.predictionHistoryPublic,
    },
  };

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "PosMul 주권시민";

  const username = profile?.username || user?.email?.split("@")[0] || "posmul_citizen";
  const bio =
    profile?.bio ||
    "집단지성과 9대 공인 오라클 데이터로 미래를 예측하고 사회에 환원하는 주권시민입니다.";

  // 오라클 소스 맵
  const oracleMap = new Map<string, string>();
  for (const s of sourcesRes.data || []) {
    oracleMap.set(s.game_id, s.source_type);
  }

  // 활성 게임 목록 변환
  const activeGames: DashboardGameItem[] = (activeGamesRes.data || []).map((g: any) => ({
    game_id: g.game_id,
    slug: g.slug || null,
    title: g.title,
    category: g.category || "INVEST",
    subcategory: g.subcategory || null,
    status: g.status || "ACTIVE",
    prize_pool: Number(g.prize_pool || g.total_pool || 5000),
    participants_count: Number(g.participants_count || 12),
    end_time: g.end_time || g.settlement_date || null,
    oracleSourceType: oracleMap.get(g.game_id) || null,
    options: parseOptions(g.game_options),
  }));

  // 내 예측 게임 상세 조회
  const myRawPreds = myPredsRes.data || [];
  const myGameIds = Array.from(new Set(myRawPreds.map((p: any) => p.game_id).filter(Boolean)));
  const myGameMap = new Map<string, any>();

  if (myGameIds.length > 0) {
    const { data: relatedGames } = await admin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, slug, title, category, status, settlement_date, game_options")
      .in("game_id", myGameIds);

    for (const rg of relatedGames || []) {
      myGameMap.set(rg.game_id, rg);
    }
  }

  const myPredictions: DashboardPredictionItem[] = myRawPreds.map((p: any) => {
    const game = myGameMap.get(p.game_id);
    const options = parseOptions(game?.game_options);
    const selectedId = p.prediction_data?.selectedOptionId || "";
    const matchedOpt = options.find((o) => o.id === selectedId);

    return {
      prediction_id: p.prediction_id,
      game_id: p.game_id,
      selectedOptionId: selectedId,
      selectedOptionLabel: matchedOpt?.label || selectedId || "선택 완료",
      bet_amount: Number(p.bet_amount || 0),
      confidence_level: Number(p.confidence_level || 75),
      is_active: Boolean(p.is_active),
      created_at: p.created_at,
      gameTitle: game?.title || "PosMul 예측 마켓",
      gameSlug: game?.slug || null,
      gameCategory: game?.category || "INVEST",
      gameStatus: game?.status || "ACTIVE",
      settlementDate: game?.settlement_date || null,
    };
  });

  // LIVE 응원톡 매핑
  const liveRooms: DashboardLiveRoomItem[] = LIVE_ROOMS.map((r) => {
    const catLower =
      r.category === "SPORTS"
        ? "sports"
        : r.category === "ENTERTAINMENT"
        ? "entertainment"
        : "economy";
    return {
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      category: catLower,
      categoryLabel: r.categoryLabel,
      status: r.status === "LIVE" ? "LIVE" : "UPCOMING",
      viewerCount: r.viewerCount,
      broadcaster: r.predictionGame?.oracleLabel || "PosMul Live",
      linkedPredictionSlug: r.predictionGame?.slug || "/prediction",
      linkedPredictionTitle: r.predictionGame?.question || r.title,
      oracleLabel: r.predictionGame?.oracleLabel,
      scoreBoard: r.matchScore
        ? {
            leftTeam: r.matchScore.teamA,
            leftScore: r.matchScore.scoreA,
            rightTeam: r.matchScore.teamB,
            rightScore: r.matchScore.scoreB,
            statusText: r.matchScore.statusText,
          }
        : undefined,
    };
  });

  // 통합 지갑 트랜잭션 구성
  const rawTransactions: DashboardTransactionItem[] = [
    {
      id: "tx-welcome-pmp",
      type: "reward",
      title: "🎁 주권시민 기본 활동 보너스 적립",
      amount: +10000,
      currency: "PMP",
      status: "completed",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: "tx-don-eco",
      type: "donation",
      title: "🌱 공익 기부 - 초록우산 환경·아동재단",
      amount: -1000,
      currency: "PMC",
      status: "completed",
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: "tx-con-major",
      type: "consume",
      title: "🎬 Major League 공익 캠페인 시청 보상",
      amount: +300,
      currency: "PMP",
      status: "completed",
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    ...myPredictions.slice(0, 12).map(
      (pred): DashboardTransactionItem => ({
        id: `tx-pred-${pred.prediction_id}`,
        type: "prediction",
        title: `🎲 예측 참여: ${pred.gameTitle} (${pred.selectedOptionLabel})`,
        amount: -pred.bet_amount,
        currency: "PMP",
        status: !pred.is_active
          ? "cancelled"
          : pred.gameStatus === "SETTLED"
          ? "completed"
          : "pending",
        createdAt: pred.created_at,
      })
    ),
  ];

  const transactions = rawTransactions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const initialData = {
    isAuthenticated,
    userId: targetUserId,
    email: user?.email || "citizen@posmul.com",
    displayName,
    username,
    bio,
    onboardingCompleted: Boolean(profile?.onboarding_completed),
    balances: {
      pmp: Number(account?.pmp_balance ?? 15000),
      pmc: Number(account?.pmc_balance ?? 3500),
      pmg: 320,
    },
    ranking: {
      overallRank: Number(score?.overall_rank ?? 12),
      expectRank: Number(score?.expect_rank ?? 8),
      donationRank: Number(score?.donation_rank ?? 15),
      contributionScore: Number(score?.contribution_score ?? 2850),
      expectParticipations: Number(score?.expect_participations ?? myPredictions.length),
      expectWins: Number(score?.expect_wins ?? 4),
      totalPmcDonated: Number(score?.total_pmc_donated ?? 1450),
      forumPostsCount: Number(score?.forum_posts_count ?? 6),
    },
    personalization,
    activeGames,
    myPredictions,
    liveRooms,
    transactions,
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080c] text-zinc-400 flex items-center justify-center text-sm">
          개인 맞춤 대시보드를 불러오는 중입니다...
        </div>
      }
    >
      <UserDashboardClient initialData={initialData} />
    </Suspense>
  );
}
