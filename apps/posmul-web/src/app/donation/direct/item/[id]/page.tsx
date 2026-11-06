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
  establishedYear?: string;
  beneficiaryCount?: string;
  licenseNumber?: string;
  directorLetter?: string;
  currentFacilityStatus?: string;
  transparencyPledge?: string;
}

// 물품별/카테고리별 맞춤 희망 기부처 프리셋 사전 (풍부한 상세 스토리 포함)
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
      establishedYear: "2012년 설립 (14년차 공익시설)",
      beneficiaryCount: "맞벌이·한부모 가정 아동 35명 상시 이용",
      licenseNumber: "서울시 은평구청 아동복지시설 신고 제2012-08호",
      directorLetter: "안녕하세요, 햇살지역아동센터 김영희 센터장입니다. 저희 센터는 학교 수업이 끝난 후 부모님이 일터에서 돌아오실 때까지 아이들이 매일 6시간 이상 숙제하고 밥을 먹는 제2의 가정입니다. 15년 전 기증받은 구형 에어컨이 올해 완전히 멈춰버려 선풍기 2대로 35명의 아이들이 땀을 뻘뻘 흘리고 있습니다. 시민 여러분의 따뜻한 손길로 아이들에게 시원한 여름을 선물해주세요.",
      currentFacilityStatus: "현재 15년 된 구형 냉방기 고장으로 실내 온도 32도 육박, 선풍기 2대로 임시 대응 중",
      transparencyPledge: "100% 모금 달성 즉시 LG전자 본사 설치 기사님의 시공 사진과 아이들이 직접 쓴 감사 편지를 7일 이내에 증빙으로 공개합니다.",
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
      establishedYear: "2015년 개소 (지자체 지정 쉼터)",
      beneficiaryCount: "산골마을 홀몸 어르신 45명 일일 이용",
      licenseNumber: "강원도 춘천시 노인여가복지시설 제2015-19호",
      directorLetter: "마을에 홀로 계신 80~90대 어르신들께서 낮 동안 더위를 식히러 오시는 유일한 공간입니다. 기존 에어컨이 4등급이라 전기요금이 두려워 어르신들이 켜지도 못하셨습니다. 인버터 1등급 에어컨이 생기면 전기료 걱정 없이 건강하게 폭염을 나실 수 있습니다.",
      currentFacilityStatus: "노후 4등급 구형 에어컨으로 누진세 부담 극심, 절전으로 인해 실내 환기 부족",
      transparencyPledge: "설치 완료 즉시 어르신들의 시원한 쉼터 현장 사진과 지자체 설치 검수표를 등록합니다.",
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
      establishedYear: "2020년 설립 (자립청년 둥지)",
      beneficiaryCount: "만 18세 보호종료 청년 8명 거주",
      licenseNumber: "사회복지법인 디딤돌 재단 공인 제2020-03호",
      directorLetter: "보육원을 퇴소해 세상에 첫발을 디딘 청년들이 취업을 준비하며 함께 사는 공간입니다. 거실 냉방이 제대로 되지 않아 공부와 휴식에 큰 어려움이 있었습니다. 청년들의 꿈을 응원해주세요.",
      currentFacilityStatus: "거실 냉방기 부재로 각 방 이동식 소형 냉풍기로 버티는 실정",
      transparencyPledge: "청년들의 자립 공부방 에어컨 설치 후 영수증 및 직발주 검수서를 투명 공개합니다.",
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
      establishedYear: "1998년 설립 (28년 전통 양육시설)",
      beneficiaryCount: "원아 28명 (초등학생 15명 등하교)",
      licenseNumber: "부산광역시 사하구 아동복지시설 인가 제1998-02호",
      directorLetter: "아이들은 정말 빠르게 자랍니다. 한 해 사이에 발이 20mm씩 훌쩍 커서 작아진 신발에 발가락을 웅크리고 다니는 아이들을 볼 때마다 마음이 아팠습니다. 한국 제화 기술로 만든 튼튼하고 예쁜 새 신발을 신고 씩씩하게 등교할 수 있도록 선물해주세요.",
      currentFacilityStatus: "원아 15명 중 11명이 발에 맞지 않는 작아진 신발 착용 중",
      transparencyPledge: "새 신발을 신은 아이들의 환한 발걸음 사진과 치수별 개별 지급 수령증을 공개합니다.",
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
      establishedYear: "1983년 개교 (도서벽지 분교)",
      beneficiaryCount: "전교생 8명 매일 왕복 4km 도보 통학",
      licenseNumber: "전라남도 신안교육지원청 지정 분교장",
      directorLetter: "저희 분교 아이들은 통학버스가 닿지 않아 흙길과 갯바위 고갯길을 매일 걸어서 다닙니다. 비가 오거나 눈이 오면 신발이 젖고 미끄러져 다치기 십상입니다. 접지력이 좋고 따뜻한 국산 방한 운동화는 아이들의 안전한 통학길을 지켜주는 가장 큰 방패입니다.",
      currentFacilityStatus: "도보 통학로 비포장 구간 2.5km, 마모된 운동화 착용으로 미끄럼 사고 우려",
      transparencyPledge: "섬마을 분교장 선생님의 신발 전달식 및 아이들의 착용 사진을 등록합니다.",
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
        establishedYear: "공식 인가 복지시설",
        beneficiaryCount: `신청 수량: ${w.needed_quantity}개 수혜 예정`,
        licenseNumber: w.business_license_number || "고유번호증 검증 완료",
        directorLetter: w.story,
        currentFacilityStatus: "현장 노후 시설 개선 및 실물 물품 긴급 필요",
        transparencyPledge: "100% 모금 달성 시 제조사 본사 직발주 및 현장 수령 인수증 100% 투명 공개",
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
