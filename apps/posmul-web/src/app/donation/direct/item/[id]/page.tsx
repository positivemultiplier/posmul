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

// 물품별/카테고리별 맞춤 희망 기부처 프리셋 사전
const RECIPIENTS_CATALOG: Record<string, RecipientCenter[]> = {
  // 1. LG 휘센 에어컨 (4a56aa1a-... 또는 electronics)
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
    {
      id: "rec-air-004",
      name: "새싹 영아일시보호소",
      type: "영아 일시보호 (영유아 12명)",
      region: "대구 중구",
      story: "온도와 습도에 민감한 생후 12개월 미만 신생아들이 생활하는 영아실에 24시간 안심 항온항습 에어컨을 지원합니다.",
      targetQuantity: 1,
      currentQuantity: 0,
      targetAmount: 850000,
      currentAmount: 425000,
      verifiedBadge: "영유아 전문 보호기관",
      avatarIcon: "👶",
    },
  ],

  // 2. 키즈 웜 패딩부츠 / 운동화 (6daddc20-... - 부산 A제화)
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
    {
      id: "rec-shoes-003",
      name: "무지개 다문화 돌봄터",
      type: "다문화가정 아동쉼터 (아동 20명)",
      region: "인천 미추홀구",
      story: "성장기 다문화가정 아이들 12명이 마음껏 뛰어놀 수 있도록 발볼이 편하고 내구성이 뛰어난 한국 제화 신발을 지원합니다.",
      targetQuantity: 12,
      currentQuantity: 6,
      targetAmount: 420000,
      currentAmount: 210000,
      verifiedBadge: "여성가족부 공인 다문화센터",
      avatarIcon: "🌈",
    },
  ],

  // 3. 철원 오대쌀 햅쌀 (edeb5889-...)
  "edeb5889-f979-4f63-a9d9-56fa0529f1e0": [
    {
      id: "rec-rice-001",
      name: "탑골 어르신 무료급식소",
      type: "무료급식소 (일 150명 급식)",
      region: "서울 종로구",
      story: "하루 150분의 결식 어르신께 따뜻한 점심 진지를 대접해 드리는 곳입니다. 대한민국 농민이 땀 흘려 재배한 햅쌀 50포대로 온기 가득한 식사를 채워주세요.",
      targetQuantity: 50,
      currentQuantity: 45,
      targetAmount: 2100000,
      currentAmount: 1890000,
      verifiedBadge: "비영리 공익 급식단체",
      avatarIcon: "🍚",
    },
    {
      id: "rec-rice-002",
      name: "홀몸 어르신 공동식당",
      type: "농촌 노인회관 (어르신 30명)",
      region: "경북 의성군",
      story: "혼자 밥 챙겨 드시기 힘든 시골 어르신들이 마을회관에 모여 함께 따뜻한 밥을 지어 나누는 사랑방 햅쌀 지원입니다.",
      targetQuantity: 20,
      currentQuantity: 12,
      targetAmount: 840000,
      currentAmount: 504000,
      verifiedBadge: "의성군 지정 공동체 식당",
      avatarIcon: "🌾",
    },
    {
      id: "rec-rice-003",
      name: "청소년 드림쉼터",
      type: "가정 밖 청소년 쉼터 (청소년 15명)",
      region: "충남 천안시",
      story: "거리의 위기 청소년들이 안전하게 머물며 건강을 회복할 수 있도록 영양가 높은 철원 오대쌀 햅쌀 30포대를 식단에 지원합니다.",
      targetQuantity: 30,
      currentQuantity: 15,
      targetAmount: 1260000,
      currentAmount: 630000,
      verifiedBadge: "여성가족부 등록 청소년 쉼터",
      avatarIcon: "🏡",
    },
  ],

  // 4. 삼성 세탁기 (d69fd152-...)
  "d69fd152-5416-478a-9112-4c9a99fa15a3": [
    {
      id: "rec-washer-001",
      name: "고려인 다문화 청소년 쉼터",
      type: "다문화 청소년 생활관 (20명)",
      region: "경기 안산시",
      story: "20여 명의 청소년들이 매일 빨래를 돌릴 수 있는 고용량 통돌이 세탁기가 노후되어 자주 멈춥니다. 삼성 고효율 세탁기로 청결한 생활을 지원합니다.",
      targetQuantity: 1,
      currentQuantity: 0,
      targetAmount: 750000,
      currentAmount: 600000,
      verifiedBadge: "안산시 공인 다문화 쉼터",
      avatarIcon: "🧺",
    },
    {
      id: "rec-washer-002",
      name: "모자원 희망둥지",
      type: "한부모가족 복지시설 (12가구)",
      region: "광주 북구",
      story: "홀로 아이를 키우는 미혼모와 아기들이 쾌적하고 위생적인 아기 옷 세탁과 살균 관리를 할 수 있는 AI 버블 세탁기를 지원합니다.",
      targetQuantity: 1,
      currentQuantity: 0,
      targetAmount: 750000,
      currentAmount: 450000,
      verifiedBadge: "보건복지부 인가 모자복지관",
      avatarIcon: "🤱",
    },
  ],

  // 5. 삼성 태블릿 (6ac58185-...)
  "6ac58185-082d-43b3-b9cb-b31d4f15d6f6": [
    {
      id: "rec-tab-001",
      name: "탄광촌 꿈터 공부방",
      type: "폐광지역 아동센터 (25명)",
      region: "강원 태백시",
      story: "도시와의 교육 격차 해소를 위해 온라인 EBS 인강 및 코딩 교육을 수강할 수 있는 삼성 갤럭시 탭 10대를 지원합니다.",
      targetQuantity: 10,
      currentQuantity: 8,
      targetAmount: 4500000,
      currentAmount: 3600000,
      verifiedBadge: "태백시 공인 지역아동센터",
      avatarIcon: "💻",
    },
    {
      id: "rec-tab-002",
      name: "바다마을 야간돌봄교실",
      type: "어촌 야간돌봄센터 (15명)",
      region: "제주 서귀포시",
      story: "부모님의 조업 시간 동안 늦은 밤까지 공부하는 어촌 아이들에게 디지털 교재와 스마트 독서를 할 수 있는 태블릿을 전달합니다.",
      targetQuantity: 5,
      currentQuantity: 3,
      targetAmount: 2250000,
      currentAmount: 1350000,
      verifiedBadge: "제주도 지정 거점 돌봄센터",
      avatarIcon: "🌊",
    },
  ],
};

// 기본 범용 Fallback 프로젝트
const FALLBACK_PROJECTS: Record<string, any> = {
  "proj-goods-001": {
    id: "proj-goods-001",
    title: "LG전자 고효율 가전 취약계층 조손가정 지원",
    description: "시민이 기부한 PMC로 LG전자의 1등급 고효율 가전을 대량 구매하여 노후 가전으로 전기료 부담이 큰 독거어르신 및 조손가정에 직배송 설치합니다. 한국 가전 제조사의 실물 매출 창출과 수출 경쟁력 강화로 이어지는 Tied Aid 모델입니다.",
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
  "proj-goods-002": {
    id: "proj-goods-002",
    title: "CJ제일제당 햇반·영양 안심키트 결식우려 아동 구호",
    description: "방학 기간 급식 공백으로 결식이 우려되는 취약계층 아동에게 한국 기업 CJ제일제당의 고단백 영양 안심 식품키트를 정기 배송합니다.",
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

  // 2. 이 물품을 희망하는 복지시설/기부처 목록 매칭
  // ID에 해당하는 전용 리스트가 없으면 카테고리 기반 또는 에어컨 기본 리스트 제공
  const recipients: RecipientCenter[] =
    RECIPIENTS_CATALOG[id] ||
    RECIPIENTS_CATALOG["4a56aa1a-b59e-47a2-a260-c6179519d7f5"] ||
    [];

  // 3. 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <DirectDonationDetailClient
      project={targetProject}
      recipients={recipients}
      isLoggedIn={!!user}
      currentUserId={user?.id || null}
    />
  );
}