/**
 * 예측 게임 정산 관리자 페이지
 * 
 * 관리자가 예측 게임의 정답을 선택하고 정산을 실행하는 페이지
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { notFound } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";
import { SettlementClient } from "./client";

interface SettlePageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default async function SettlePage({ params }: SettlePageProps) {
  const { gameId } = await params;
  const supabase = await createClient();

  // 현재 사용자 확인 (인증 필요)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-2">🔒 인증 필요</h1>
            <p className="text-gray-300">정산 페이지에 접근하려면 로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  // 게임 정보 조회
  const { data: game, error: gameError } = await supabase
    .schema("prediction")
    .from("prediction_games")
    .select("*")
    .eq("game_id", gameId)
    .single();

  if (gameError || !game) {
    notFound();
  }

  // 이미 정산된 게임인 경우 Array 방어
  const gameData = Array.isArray(game) ? game[0] : game;

  // 참여자 정보 조회
  const { data: predictions } = await supabase
    .schema("prediction")
    .from("predictions")
    .select("*")
    .eq("game_id", gameId)
    .eq("is_active", true);

  const predictionList = predictions || [];

  // 옵션별 통계 계산
  const options = (gameData.game_options as Array<{ id: string; label: string; currentOdds?: number }>) || [];
  const optionStats = options.map((opt) => {
    const optPredictions = predictionList.filter((p: any) => p.selected_option_id === opt.id);
    const totalStake = optPredictions.reduce((sum: number, p: any) => sum + (p.stake_amount || 0), 0);
    return {
      id: opt.id,
      label: opt.label,
      participantCount: optPredictions.length,
      totalStake,
      currentOdds: opt.currentOdds || 0.5,
    };
  });

  const totalPool = predictionList.reduce((sum: number, p: any) => sum + (p.stake_amount || 0), 0);

  return (
    <SettlementClient
      gameId={gameId}
      game={{
        title: gameData.title || "제목 없음",
        description: gameData.description || "",
        status: gameData.status,
        endTime: gameData.registration_end,
        settlementTime: gameData.settlement_date,
        category: gameData.category,
      }}
      options={optionStats}
      totalPool={totalPool}
      totalParticipants={predictionList.length}
      predictions={predictionList.map((p: any) => ({
        id: p.prediction_id,
        userId: p.user_id,
        selectedOptionId: p.selected_option_id,
        stakeAmount: p.stake_amount,
        confidence: p.confidence,
      }))}
      adminUserId={user.id}
    />
  );
}
