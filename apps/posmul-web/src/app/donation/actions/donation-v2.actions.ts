"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type DonationPillar = "TIED_GOODS" | "NGO_MILESTONE" | "HERO_BOUNTY" | "DREAM_LADDER";

export interface DonationProjectDTO {
  id: string;
  pillar: DonationPillar;
  title: string;
  subtitle: string;
  description: string;
  imageUrl?: string;
  targetAmount: number;
  currentAmount: number;
  donorCount: number;
  partnerOrBrand?: string; // 제조사 (LG, CJ 등) 또는 협력기관
  // Pillar 1 전용 (물품 상세)
  goodsDetail?: {
    itemSpec: string;
    unitPricePmc: number;
    targetQuantity: number;
    currentQuantity: number;
    beneficiaryGroup: string;
  };
  // Pillar 2 전용 (마일스톤)
  milestones?: Array<{
    step: number;
    title: string;
    percentage: number;
    status: "COMPLETED" | "VOTING" | "UPCOMING";
    proofNote?: string;
  }>;
  // Pillar 3 전용 (의인 포상)
  heroDetail?: {
    scoutName: string;
    heroStory: string;
    taxExemptLawNote: string;
  };
  // Pillar 4 전용 (꿈사다리)
  dreamDetail?: {
    dreamerCategory: string;
    pledgeNote: string;
    repaidPmc: number;
  };
  createdAt: string;
}

// 4대 필러 기본 프로젝트 목업 및 DB 연동 데이터
const DEFAULT_V2_PROJECTS: DonationProjectDTO[] = [
  {
    id: "proj-goods-001",
    pillar: "TIED_GOODS",
    title: "LG전자 고효율 냉장고·세탁기 취약계층 조손가정 지원",
    subtitle: "한국 기업 실물 매출 창출 ➔ 수출 승수 효과 연계",
    description: "시민이 기부한 PMC로 LG전자의 1등급 고효율 가전을 대량 구매하여, 노후 가전으로 전기료 부담이 큰 독거어르신 및 조손가정 50가구에 직배송 설치합니다.",
    imageUrl: "/images/cards/donation_direct.png",
    targetAmount: 300000,
    currentAmount: 218500,
    donorCount: 412,
    partnerOrBrand: "LG전자 (K-가전)",
    goodsDetail: {
      itemSpec: "LG 디오스 1등급 고효율 냉장고 & 통돌이 세탁기 세트",
      unitPricePmc: 6000,
      targetQuantity: 50,
      currentQuantity: 36,
      beneficiaryGroup: "전국 에너지 취약계층 조손가정 50가구",
    },
    createdAt: "2026-11-01T00:00:00Z",
  },
  {
    id: "proj-goods-002",
    pillar: "TIED_GOODS",
    title: "CJ제일제당 햇반·영양 안심키트 결식우려 아동 1,000명 구호",
    subtitle: "K-푸드 제조사 직구매 ➔ 국내 농식품 소비 촉진",
    description: "방학 기간 급식 공백으로 결식이 우려되는 아동 1,000명에게 한국 기업 CJ제일제당의 고단백 영양 안심 식품키트를 정기 배송합니다.",
    imageUrl: "/images/cards/donation_direct.png",
    targetAmount: 150000,
    currentAmount: 124000,
    donorCount: 289,
    partnerOrBrand: "CJ제일제당 (K-푸드)",
    goodsDetail: {
      itemSpec: "햇반, 비비고 국물요리, 단백질 영양바 1개월 구호팩",
      unitPricePmc: 150,
      targetQuantity: 1000,
      currentQuantity: 826,
      beneficiaryGroup: "방학 중 결식 우려 취약계층 아동 1,000명",
    },
    createdAt: "2026-11-02T00:00:00Z",
  },
  {
    id: "proj-ngo-001",
    pillar: "NGO_MILESTONE",
    title: "초록우산 어린이재단: 반지하 취약아동 주거 개보수 프로젝트",
    subtitle: "스마트 에스크로 3단계 검증 (영수증 확인 후 다음 단계 집행)",
    description: "침수 위험과 곰팡이에 노출된 취약계층 아동 가정의 단열·방수 시공을 지원합니다. 영수증과 현장 사진이 시민 투표를 통과해야 다음 기부금이 릴리즈됩니다.",
    imageUrl: "/images/cards/donation_institute.png",
    targetAmount: 200000,
    currentAmount: 145000,
    donorCount: 335,
    partnerOrBrand: "초록우산 어린이재단",
    milestones: [
      { step: 1, title: "1차 대상가구 10곳 실사 및 단열 자재 구매", percentage: 30, status: "COMPLETED", proofNote: "자재 구매 영수증 및 현장 실사 사진 검증 완료" },
      { step: 2, title: "2차 창호 교체 및 방수 공사 시공", percentage: 40, status: "VOTING", proofNote: "시공 중간 감리 리포트 등록됨 (시민 찬성율 92%)" },
      { step: 3, title: "3차 입주 점검 및 최종 감사 보고서", percentage: 30, status: "UPCOMING" },
    ],
    createdAt: "2026-11-03T00:00:00Z",
  },
  {
    id: "proj-hero-001",
    pillar: "HERO_BOUNTY",
    title: "이달의 의인상: 화재 현장에서 이웃 5명을 구한 청년 의인 포상",
    subtitle: "청년 소셜 스카우터 발굴 ➔ 소득세법 시행령 제18조 100% 비과세 상금",
    description: "새벽 빌라 화재 속에서 위험을 무릅쓰고 창문을 깨 이웃 일가족 5명을 구출한 의인에게 시민의 이름으로 비과세 공익 포상금을 전달합니다.",
    imageUrl: "/images/cards/donation_leader.png",
    targetAmount: 100000,
    currentAmount: 89000,
    donorCount: 512,
    partnerOrBrand: "PosMul 공익의인심사위원회",
    heroDetail: {
      scoutName: "김청년 스카우터 (24세, 사회혁신 청년인턴)",
      heroStory: "소방차가 도착하기 전 골든타임을 확보하여 5명의 소중한 생명을 지켜낸 숨은 시민 영웅입니다.",
      taxExemptLawNote: "소득세법 시행령 제18조 제1항 제1호에 따른 공익 포상금으로 증여세 및 소득세 전액 비과세 처리됩니다.",
    },
    createdAt: "2026-11-04T00:00:00Z",
  },
  {
    id: "proj-dream-001",
    pillar: "DREAM_LADDER",
    title: "보육원 자립준비청년 '첫 카페 창업' 무이자 꿈의 사다리",
    subtitle: "그라민-Kiva식 Pay-it-Forward (성공 시 다음 후배에게 자발적 상환)",
    description: "만 18세로 보육원을 퇴소한 자립준비청년의 바리스타 창업 초기 설비 비용을 무이자로 펀딩합니다. 대출이 아니며, 꿈을 이룬 후 다음 청년에게 자발적으로 돌려줍니다.",
    imageUrl: "/images/cards/donation_direct.png",
    targetAmount: 250000,
    currentAmount: 182000,
    donorCount: 380,
    partnerOrBrand: "그라민-PosMul 꿈사다리 펀드",
    dreamDetail: {
      dreamerCategory: "자립준비청년 (만 20세, 바리스타 자격증 보유)",
      pledgeNote: "자립에 성공하여 매장이 안정화되면, 2년 내 같은 금액을 다음 자립준비청년의 꿈에 자발적으로 되갚을 것을 서약합니다.",
      repaidPmc: 45000,
    },
    createdAt: "2026-11-05T00:00:00Z",
  },
];

/**
 * 기부 프로젝트 목록 조회
 */
export async function getDonationProjectsAction(
  pillar?: DonationPillar
): Promise<{ success: boolean; projects: DonationProjectDTO[]; userPmcBalance: number; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. 유저 PMC 잔액 조회
    let userPmcBalance = 500;
    if (user?.id) {
      const { data: account } = await supabaseAdmin
        .schema("economy")
        .from("pmp_pmc_accounts")
        .select("pmc_balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (account?.pmc_balance !== undefined) {
        userPmcBalance = Number(account.pmc_balance);
      }
    }

    // 2. 필터링된 프로젝트 반환
    const filtered = pillar
      ? DEFAULT_V2_PROJECTS.filter((p) => p.pillar === pillar)
      : DEFAULT_V2_PROJECTS;

    return { success: true, projects: filtered, userPmcBalance };
  } catch (err: any) {
    return { success: false, projects: DEFAULT_V2_PROJECTS, userPmcBalance: 500, error: err?.message };
  }
}

/**
 * PMC 기부 실행 (시민 직접 예산 집행)
 */
export async function donatePmcAction(params: {
  projectId: string;
  amountPmc: number;
  cheerMessage?: string;
}): Promise<{
  success: boolean;
  message: string;
  newBalance?: number;
  project?: DonationProjectDTO;
  error?: string;
}> {
  try {
    const { projectId, amountPmc, cheerMessage } = params;
    if (amountPmc <= 0) {
      return { success: false, message: "기부할 PMC 금액은 1 이상이어야 합니다." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return { success: false, message: "기부에 참여하시려면 먼저 로그인해주세요." };
    }

    // 1. PMC 잔액 확인
    const { data: account } = await supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("pmc_balance")
      .eq("user_id", user.id)
      .single();

    const currentPmc = Number(account?.pmc_balance || 0);
    if (currentPmc < amountPmc) {
      return { success: false, message: `보유 PMC(${currentPmc.toLocaleString()})가 부족합니다.` };
    }

    // 2. PMC 차감 (기부 집행)
    const newBalance = currentPmc - amountPmc;
    await supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .update({ pmc_balance: newBalance })
      .eq("user_id", user.id);

    // 3. 기부 활동 로그 기록
    try {
      await supabaseAdmin
        .schema("donation")
        .from("donation_activity_logs")
        .insert({
          donation_id: projectId,
          activity_type: "PMC_DONATION",
          description: `시민 예산 집행 기부: ${amountPmc.toLocaleString()} PMC (${cheerMessage || "따뜻한 응원"})`,
          metadata: {
            donorUserId: user.id,
            amountPmc,
            cheerMessage,
          },
        });
    } catch {}

    // 4. 프로젝트 통계 가상 반영 (목업 업데이트)
    const targetProj = DEFAULT_V2_PROJECTS.find((p) => p.id === projectId);
    if (targetProj) {
      targetProj.currentAmount += amountPmc;
      targetProj.donorCount += 1;
      if (targetProj.goodsDetail) {
        targetProj.goodsDetail.currentQuantity = Math.min(
          targetProj.goodsDetail.targetQuantity,
          targetProj.goodsDetail.currentQuantity + Math.floor(amountPmc / targetProj.goodsDetail.unitPricePmc)
        );
      }
    }

    revalidatePath("/donation");

    return {
      success: true,
      message: `🎉 ${amountPmc.toLocaleString()} PMC 기부가 성공적으로 집행되었습니다! 소셜 임팩트 점수가 상승했습니다.`,
      newBalance,
      project: targetProj,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "기부 처리 중 오류가 발생했습니다." };
  }
}

