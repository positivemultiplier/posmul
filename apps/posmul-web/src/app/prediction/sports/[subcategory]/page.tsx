import { createClient } from "../../../../lib/supabase/server";
import { FadeIn } from "../../../../shared/ui/components/animations";
import Link from "next/link";
import { CompactMoneyWaveCard } from "../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { ClientPredictionGamesGrid } from "../../components/ClientPredictionGamesGrid";
import { PredictionType, GameStatus } from "../../../../bounded-contexts/prediction/domain/value-objects/prediction-types";
import { getAggregatedPrizePool } from "../../../../bounded-contexts/prediction/application/prediction-pool.service";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    subcategory: string;
  }>;
}

interface UserPrediction {
  prediction_id: string;
  game_id: string;
  bet_amount: number | null;
  is_active: boolean;
  prediction_data: Record<string, unknown> | null;
}

const SPORT_WHITELIST = [
  "soccer",
  "baseball",
  "basketball",
  "esports",
  "other",
] as const;

export default async function PredictionSportsSubcategoryPage({
  params,
}: PageProps) {
  const { subcategory } = await params;
  const decodedSubcategory = decodeURIComponent(subcategory).toLowerCase();

  // Validate subcategory
  if (!SPORT_WHITELIST.includes(decodedSubcategory as any)) {
    notFound();
  }

  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  // Get active prize pool for this subcategory
  const subcategoryPool = await getAggregatedPrizePool(supabase, 'SPORTS', decodedSubcategory);

  // Fetch games for this subcategory
  let query = supabase
    .schema("prediction")
    .from("prediction_games")
    .select("id, slug, title, description, category, prediction_type, start_time, end_time, settlement_time, minimum_stake, maximum_stake, max_participants, status, created_at, metadata")
    .eq("category", "SPORTS")
    .in("status", ["ACTIVE", "DRAFT"])
    .order("created_at", { ascending: false })
    .or(`metadata->>sport.eq.${decodedSubcategory},tags.cs.{${decodedSubcategory}}`)
    .limit(12);

  const { data, error } = await query;

  const games = data ?? [];

  // User predictions
  let userPredictions: UserPrediction[] = [];
  if (user && games.length > 0) {
    const gameIds = games.map(g => g.id);
    const { data: predictions } = await supabase
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, game_id, bet_amount, is_active, prediction_data")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("game_id", gameIds);

    userPredictions = predictions || [];
  }

  // Filters navigation
  const filters = [
    { label: "전체", value: undefined },
    { label: "축구", value: "soccer" },
    { label: "야구", value: "baseball" },
    { label: "농구", value: "basketball" },
    { label: "e스포츠", value: "esports" },
  ];

  const titleMap: Record<string, string> = {
    soccer: "축구",
    baseball: "야구",
    basketball: "농구",
    esports: "e스포츠",
  };

  const displayTitle = titleMap[decodedSubcategory] || decodedSubcategory;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-12">
            <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {displayTitle} 예측
            </h1>
            <p className="text-xl text-gray-400">
              {displayTitle} 경기 결과를 예측하고 PMC를 획득하세요
            </p>
          </div>

          {/* MoneyWave Card (Level 2: Subcategory) */}
          <div className="mb-8">
            <CompactMoneyWaveCard
              depthLevel={3}
              category="sports"
              subcategory={decodedSubcategory}
              initialPool={subcategoryPool}
            />
          </div>

          {/* Filters */}
          <div className="mb-8 flex gap-4">
            {filters.map((filter) => (
              <Link
                key={filter.label}
                href={
                  filter.value
                    ? `/prediction/sports/${filter.value}`
                    : "/prediction/sports"
                }
                className={`px-4 py-2 rounded-lg border transition-all ${decodedSubcategory === filter.value
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400"
                  }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>

          <ClientPredictionGamesGrid
            games={games.map((game: any) => {
              const gameOptions = game.metadata?.options || [
                { id: '1', text: '예', currentOdds: 0.5 },
                { id: '2', text: '아니오', currentOdds: 0.5 }
              ];
              return {
                id: game.id,
                slug: game.slug || game.id,
                title: game.title,
                description: game.description,
                predictionType: game.prediction_type?.toUpperCase() || PredictionType.BINARY,
                options: gameOptions,
                startTime: new Date(game.start_time),
                endTime: new Date(game.end_time),
                settlementTime: new Date(game.settlement_time),
                minimumStake: game.minimum_stake || 100,
                maximumStake: game.maximum_stake || 10000,
                maxParticipants: game.max_participants,
                currentParticipants: 0,
                status: game.status || GameStatus.ACTIVE,
                totalStake: 0,
                gameImportanceScore: 1.0,
                allocatedPrizePool: 0,
                createdAt: new Date(game.created_at),
              };
            })}
            userId={user?.id}
            userPredictions={userPredictions}
            basePath={`/prediction/sports/${decodedSubcategory}`}
          />
        </FadeIn>
      </div>
    </div>
  );
}
