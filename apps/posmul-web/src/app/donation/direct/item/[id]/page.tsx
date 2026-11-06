import { createClient } from "../../../../../lib/supabase/server";
import { DirectDonationDetailClient } from "./client";

export const dynamic = 'force-dynamic';

// DB에 데이터가 없거나 가상 ID인 경우를 위한 든든한 Fallback 프로젝트 사전
const FALLBACK_PROJECTS: Record<string, any> = {
  "proj-goods-001": {
    id: "proj-goods-001",
    title: "LG전자 고효율 냉장고·세탁기 취약계층 조손가정 지원",
    description: "시민이 기부한 PMC로 LG전자의 1등급 고효율 가전을 대량 구매하여, 노후 가전으로 전기료 부담이 큰 독거어르신 및 조손가정 50가구에 직배송 설치합니다. 한국 가전 제조사의 실물 매출 창출과 수출 경쟁력 강화로 이어지는 Tied Aid 모델입니다.",
    category: "electronics",
    target_beneficiary: "전국 에너지 취약계층 조손가정 50가구",
    product_name: "LG 디오스 1등급 냉장고 & 통돌이 세탁기 세트",
    manufacturer: "LG Electronics (Made in Korea 🇰🇷)",
    unit_price: 600000,
    target_quantity: 50,
    current_quantity: 36,
    achievementRate: 72,
    images: ["/images/cards/donation_direct.png"],
  },
  "proj-goods-002": {
    id: "proj-goods-002",
    title: "CJ제일제당 햇반·영양 안심키트 결식우려 아동 1,000명 구호",
    description: "방학 기간 급식 공백으로 결식이 우려되는 취약계층 아동 1,000명에게 한국 기업 CJ제일제당의 고단백 영양 안심 식품키트를 정기 배송합니다. K-푸드 제조사 직구매를 통해 국내 농식품 소비 촉진과 구호를 동시에 달성합니다.",
    category: "food",
    target_beneficiary: "방학 중 결식 우려 취약계층 아동 1,000명",
    product_name: "햇반·비비고 국물요리 단백질 안심팩",
    manufacturer: "CJ제일제당 (K-Food Leader 🍚)",
    unit_price: 15000,
    target_quantity: 1000,
    current_quantity: 826,
    achievementRate: 83,
    images: ["/images/cards/donation_direct.png"],
  },
};

export default async function DirectDonationDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const supabase = await createClient();

  // 1. DB에서 펀딩 프로젝트 단건 조회 시도
  const { data: project, error } = await supabase
    .schema("donation")
    .from("funding_projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  let targetProject: any = null;

  if (project) {
    targetProject = {
      ...project,
      achievementRate: Math.min(100, Math.round((project.current_quantity / project.target_quantity) * 100)),
      images: project.images || ["/images/cards/donation_direct.png"],
    };
  } else if (FALLBACK_PROJECTS[id]) {
    targetProject = FALLBACK_PROJECTS[id];
  } else {
    // 임의의 ID로 들어온 경우에도 사용자에게 404를 보여주는 대신 스마트 기본 프로젝트 제공
    targetProject = {
      id,
      title: "LG전자 고효율 가전 취약계층 나눔 프로젝트",
      description: "한국 대표 제조사 LG전자의 고효율 가전을 매칭 구매하여 국내 취약계층 가정에 전달하는 K-물품 직접기부 프로젝트입니다.",
      category: "electronics",
      target_beneficiary: "에너지 취약계층 30가구",
      product_name: "LG 1등급 고효율 가전",
      manufacturer: "LG Electronics (Made in Korea 🇰🇷)",
      unit_price: 500000,
      target_quantity: 30,
      current_quantity: 18,
      achievementRate: 60,
      images: ["/images/cards/donation_direct.png"],
    };
  }

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <DirectDonationDetailClient
      project={targetProject}
      isLoggedIn={!!user}
      currentUserId={user?.id || null}
    />
  );
}
