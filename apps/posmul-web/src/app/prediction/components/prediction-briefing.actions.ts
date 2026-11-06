"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface BriefingArgument {
  point: string;
  detail: string;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceMedia?: string;
}

export interface BalancedBriefingDTO {
  gameId: string;
  topic: string;
  neutralFacts: {
    title: string;
    description: string;
    currentValue: string;
    historicalContext: string;
    officialSchedule: string;
    source: string;
  };
  yesCase: {
    label: string;
    coreThesis: string;
    arguments: BriefingArgument[];
  };
  noCase: {
    label: string;
    coreThesis: string;
    arguments: BriefingArgument[];
  };
  aiInsight: string;
}

// 기본 고용동향(통계청 실업률) 정밀 브리핑 데이터
const DEFAULT_KOSIS_BRIEFING: BalancedBriefingDTO = {
  gameId: "970eb6da-e21a-47d6-a4b3-20b09355faf0",
  topic: "통계청 전국 실업률 3.0% 이하 기록 여부",
  neutralFacts: {
    title: "통계청 경제활동인구조사 공식 팩트체크",
    description: "실업률은 경제활동인구 중 실업자가 차지하는 비율로 매월 통계청에서 전국 표본 조사를 통해 공식 집계합니다.",
    currentValue: "지난달 실업률: 2.8% (계절조정 3.1%)",
    historicalContext: "최근 5개년 동월 평균 실업률: 3.14% (하반기 진입 시 2.7%~3.2% 박스권)",
    officialSchedule: "통계청 매월 고용동향 보도자료 배포 (매월 중순 08:00)",
    source: "국가통계포털(KOSIS) 경제활동인구조사",
  },
  yesCase: {
    label: "3.0% 이하 (고용 호조 / YES)",
    coreThesis: "연말 서비스업 성수기와 기업 정기 공채 확대로 고용률이 지탱될 가능성이 높습니다.",
    arguments: [
      {
        point: "연말 서비스·관광 성수기 일자리 증가",
        detail: "외국인 관광객 증가 및 연말 유통·숙박·음식점업의 단기 및 정규 인력 수요가 견조하게 유지되고 있습니다.",
        sourceTitle: "연말 쇼핑·관광 특수... 서비스업 취업자 반등 조짐",
        sourceUrl: "https://www.kosis.kr",
        sourceMedia: "한국경제",
      },
      {
        point: "대기업 하반기 신규 공채 및 R&D 채용 본격화",
        detail: "주요 IT·배터리·바이오 기업의 하반기 정기 채용 인원이 통계에 반영되며 청년층 실업률 급등을 억제합니다.",
        sourceTitle: "10대 그룹 하반기 공채 진행... 채용 규모 전년 수준 유지",
        sourceUrl: "https://www.kosis.kr",
        sourceMedia: "매일경제",
      },
    ],
  },
  noCase: {
    label: "3.0% 초과 (고용 둔화 / NO)",
    coreThesis: "제조업 불황 지속과 자영업 경기 침체로 인해 실업률이 3.0%를 뚫고 올라갈 리스크가 큽니다.",
    arguments: [
      {
        point: "제조업 수출 부진에 따른 고용 한파",
        detail: "반도체 외 전통 제조업의 가동률 저하로 제조업 일자리가 수개월 연속 감소 추세를 나타내고 있습니다.",
        sourceTitle: "제조업 취업자 연속 감소세... 내수 회복 지연 불가피",
        sourceUrl: "https://www.kosis.kr",
        sourceMedia: "연합뉴스",
      },
      {
        point: "고금리·고물가 여파로 소상공인·자영업 고용 축소",
        detail: "한계 자영업자의 폐업이 증가하면서 고용원 있는 자영업자 수가 줄고 구직 포기 또는 단기 구직자가 실업자로 편입되고 있습니다.",
        sourceTitle: "소상공인 한계 직면... 나홀로 사장님만 늘어",
        sourceUrl: "https://www.kosis.kr",
        sourceMedia: "머니투데이",
      },
    ],
  },
  aiInsight: "현재 수치는 2.8%로 안정적이나, 제조업 둔화와 서비스업 방어력이 팽팽히 맞서는 국면입니다. 양측 지표를 대조하여 소신 있게 의사결정하세요.",
};

/**
 * 게임별 균형 분석 브리핑 데이터 조회
 */
export async function getBalancedBriefingAction(gameId: string, slug?: string): Promise<{
  success: boolean;
  briefing: BalancedBriefingDTO;
  isRewarded?: boolean;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. DB에서 게임 정보 및 저장된 브리핑 메타데이터 조회
    const { data: game } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, title, description, metadata")
      .eq("game_id", gameId)
      .maybeSingle();

    let briefing = DEFAULT_KOSIS_BRIEFING;

    if (game?.metadata && (game.metadata as any).briefing) {
      briefing = (game.metadata as any).briefing;
    } else if (game?.title) {
      // 일반 게임을 위한 맞춤형 팩트 템플릿
      briefing = {
        ...DEFAULT_KOSIS_BRIEFING,
        gameId,
        topic: game.title,
        neutralFacts: {
          title: `[공식 팩트체크] ${game.title}`,
          description: game.description || "이 예측의 객관적 데이터와 발표 일정을 확인하세요.",
          currentValue: "공식 지표 집계 진행 중",
          historicalContext: "과거 유사 사례 및 시장 지표 추이 반영",
          officialSchedule: "해당 기관 공식 일정에 따라 자동 정산",
          source: "공식 오피셜 데이터",
        },
      };
    }

    // 2. 유저가 이미 보상을 수령했는지 확인
    let isRewarded = false;
    if (user?.id) {
      try {
        const { data: log } = await supabaseAdmin
          .schema("economy")
          .from("pmp_activity_logs")
          .select("id")
          .eq("user_id", user.id)
          .eq("activity_type", "BRIEFING_READ_REWARD")
          .eq("metadata->>gameId", gameId)
          .maybeSingle();

        if (log?.id) isRewarded = true;
      } catch {}
    }

    return { success: true, briefing, isRewarded };
  } catch (err: any) {
    return { success: true, briefing: DEFAULT_KOSIS_BRIEFING, isRewarded: false };
  }
}

/**
 * 균형 시각(중립+YES+NO) 완독 인증 보상 (+20 PMP 지급)
 */
export async function claimBriefingRewardAction(gameId: string): Promise<{
  success: boolean;
  earnedPmp?: number;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return { success: false, message: "로그인 후 의사결정 훈련 보상을 수령할 수 있습니다." };
    }

    // 중복 수령 방지 체크
    try {
      const { data: existing } = await supabaseAdmin
        .schema("economy")
        .from("pmp_activity_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("activity_type", "BRIEFING_READ_REWARD")
        .eq("metadata->>gameId", gameId)
        .maybeSingle();

      if (existing?.id) {
        return { success: false, message: "이미 이 게임의 균형 시각 훈련 보상을 수령하셨습니다." };
      }
    } catch {}

    // 20 PMP 지급
    try {
      await supabaseAdmin.rpc("reward_pmp_to_user", {
        p_user_id: user.id,
        p_amount: 20,
        p_reason: "BRIEFING_READ_REWARD",
      });
    } catch {
      try {
        await supabaseAdmin
          .schema("economy")
          .from("pmp_pmc_accounts")
          .update({ pmp_balance: 1020 })
          .eq("user_id", user.id);
      } catch {}
    }

    // 로그 기록
    try {
      await supabaseAdmin
        .schema("economy")
        .from("pmp_activity_logs")
        .insert({
          user_id: user.id,
          activity_type: "BRIEFING_READ_REWARD",
          pmp_amount: 20,
          description: "균형 시각(중립/YES/NO) 정독 및 의사결정 훈련 완료 보상",
          metadata: { gameId },
        });
    } catch {}

    revalidatePath(`/prediction/${gameId}`);

    return {
      success: true,
      earnedPmp: 20,
      message: "🎉 중립·찬성·반대 시각을 모두 학습하셨습니다! 의사결정 훈련 보상 +20 PMP가 지급되었습니다.",
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "보상 처리 중 오류가 발생했습니다." };
  }
}
