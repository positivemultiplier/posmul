import { createClient } from "../../../../../lib/supabase/server";
import { DirectDonationDetailClient } from "./client";

export const dynamic = 'force-dynamic';

export interface RecipientCenter {
  id: string;
  name: string;
  type: string;
  region: string;
  story: string;
  targetQuantity: number;
  currentQuantity: number;
  targetAmount: number;
  currentAmount: number;
  verifiedBadge: string;
  avatarIcon: string;
}

// 물품별/카테고리별 맞춤 희망 기부처 프리셋 사전 (Fallback 겸 기본 데이터)
const RECIPIENTS_CATALOG: Record<string, RecipientCenter[]> = {
  // 1. LG 휘센 에어컨 (4a56aa1a-...)
  "4a56aa1a-b59e-47a2-a260-c6179519d7f5": [
    {
      id: "rec-air-001",
      name: "햇살지역아동센터",
      type: "지역아동센터 (아동 35명)",
      region: "서울 은평구",
      story: "방과 후 35명의 취약계층 아이들이 이용하는 공부방에 15년 된 에어컨이 고장 나 찜통더위 속에 있습니다. 고효율 에어컨으로 아이들에게 시원하고 쾌적한 배움터를 선물해주세요.",
      targetQuantity: 1,
      currentQuantity: 0,
      targetAmount: 850000,
      currentAmount: 620000,
      verifiedBadge: "보건복지부 인가 아동복지시설",
      avatarIcon: "👧",
    },
    {
      id: "rec-air-002",
      name: "은빛사랑 노인복지관",
      type: "노인 쉼터 (독거 어르신 45명)",
      region: "강원 춘천시",
      story: "폭염 취약 독거 어르신 45명이 매일 낮 무더위를 피하는 유일한 사랑방입니다. 노후 에어컨의 전기료 부담을 덜어주는 1등급 고효율 에어컨이 절실합니다.",
      targetQuantity: 1,
      currentQuantity: 0,
      targetAmount: 850000,
      currentAmount: 780000,
      verifiedBadge: "지자체 지정 무더위 쉼터",
      avatarIcon: "👵",
    },
    {
      id: "rec-air-003",
      name: "디딤돌 자립생활관",
      type: "자립준비청년관 (청년 8명)",
      region: "경기 수원시",
      story: "보호종료 후 홀로서기를 시작한 자립준비청년 8명이 공동 거주하는 생활관 거실에 냉방기기를 지원하여 건강한 자립을 응원합니다.",
      targetQuantity: 1,
      currentQuantity: 0,
      targetAmount: 850000,
      currentAmount: 340000,
      verifiedBadge: "사회복지법인 공인 기관",
      avatarIcon: "🌱",
    },
  ],

  // 2. 키즈 웜 패딩부츠 / 운동화 (6daddc20-...)
  "6daddc20-92cc-4f09-94d2-3b6d3d4f1991": [
    {
      id: "rec-shoes-001",
      name: "해맑은 보육원",
      type: "아동양육시설 (원아 28명)",
      region: "부산 사하구",
      story: "새 학기를 맞아 발이 훌쩍 큰 초등학생 15명에게 꼭 맞는 튼튼하고 따뜻한 국산 운동화와 방한화를 선물하여 아이들의 첫 등굣길을 응원합니다.",
      targetQuantity: 15,
      currentQuantity: 13,
      targetAmount: 525000,
      currentAmount: 455000,
      verifiedBadge: "보건복지부 인가 양육시설",
      avatarIcon: "👟",
    },
    {
      id: "rec-shoes-002",
      name: "섬마을 꿈나무 분교",
      type: "도서벽지 초등학교 (전교생 8명)",
      region: "전남 신안군",
      story: "비포장 흙길과 갯바윗길을 매일 걸어서 통학하는 섬마을 분교 아이들 8명에게 미끄럼 방지 기능의 안전한 국산 방한 신발을 전달합니다.",
      targetQuantity: 8,
      currentQuantity: 5,
      targetAmount: 280000,
      currentAmount: 175000,
      verifiedBadge: "교육청 지정 도서벽지 학교",
      avatarIcon: "🏝️",
    },
  ],
};

const FALLBACK_PROJECTS: Record<string, any> = {
  "proj-goods-001": {
    id: "proj-goods-001",
    title: "LG전자 고효율 가전 취약계층 조손가정 지원",
    description: "시민이 기부한 PMC로 LG전자의 1등급 고효율 가전을 대량 구매하여 노후 가전으로 전기료 부담이 큰 독거어르신 및 조손가정에 직배송 설치합니다.",
    category: "electronics",
    target_beneficiary: "전국 에너지 취약계층 조손가정 50가구",
    product_name: "LG 디오스 1등급 고효율 가전",
    manufacturer: "LG Electronics (Made in Korea 🇰🇷)",
    unit_price: 600000,
    target_quantity: 50,
    current_quantity: 36,
    achievementRate: 72,
    images: ["/images/cards/donation_direct.png"],
  },
};

export default async function DirectDonationDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const supabase = await createClient();

  // 1. DB에서 펀딩 프로젝트 단건 조회 시도
  const { data: project } = await supabase
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

  // 2. DB에서 실제 승인된 위시리스트 신청(funding_wishlist_requests) 조회
  const { data: dbWishlists } = await supabase
    .schema("donation")
    .from("funding_wishlist_requests")
    .select("*")
    .eq("project_id", id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  let dynamicRecipients: RecipientCenter[] = [];

  if (dbWishlists && dbWishlists.length > 0) {
    dynamicRecipients = dbWishlists.map((w: any) => {
      const targetAmt = w.needed_quantity * targetProject.unit_price;
      return {
        id: w.id,
        name: w.facility_name,
        type: w.facility_type,
        region: `${w.region_city} ${w.region_district}`.trim(),
        story: w.story,
        targetQuantity: w.needed_quantity,
        currentQuantity: Math.min(w.needed_quantity, Math.floor((w.current_funded_amount || 0) / targetProject.unit_price)),
        targetAmount: targetAmt,
        currentAmount: w.current_funded_amount || 0,
        verifiedBadge: "보건복지부 / 고유번호증 공인 검증 완료 ✓",
        avatarIcon: targetProject.category === "clothing" ? "👟" : targetProject.category === "food" ? "🍚" : "🏢",
      };
    });
  }

  // 기본 프리셋과 병합 (중복 방지)
  const defaultPresets = RECIPIENTS_CATALOG[id] || RECIPIENTS_CATALOG["4a56aa1a-b59e-47a2-a260-c6179519d7f5"] || [];
  const mergedRecipients = dynamicRecipients.length > 0 ? dynamicRecipients : defaultPresets;

  // 3. 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <DirectDonationDetailClient
      project={targetProject}
      recipients={mergedRecipients}
      isLoggedIn={!!user}
      currentUserId={user?.id || null}
    />
  );
}
