export interface StudyConeSpec {
  coneType: "FIRE_OWL" | "BLUE_DRAGON" | "LUCKY_CAT" | "GOLD_LION";
  name: string;
  badgeEmoji: string;
  description: string;
  themeColor: string;
  priceKrw: number; // 0원은 기본 지급, 1100~3300원은 유료
  isPremium: boolean;
  levels: Array<{
    level: number;
    title: string;
    requiredMinutes: number; // 해당 레벨 도달에 필요한 누적 유효 집중 시간
    perk: string; // 버프/시각 효과
  }>;
}

export interface UserStudyConeItem {
  id: string;
  coneType: StudyConeSpec["coneType"];
  currentLevel: number;
  totalFocusMinutes: number;
  isEquipped: boolean;
  purchasedPriceKrw: number;
  unlockedAt: string;
}

export const STUDY_CONE_CATALOG: StudyConeSpec[] = [
  {
    coneType: "FIRE_OWL",
    name: "불꽃 열공 부엉이",
    badgeEmoji: "🦉",
    description: "밤낮을 가리지 않고 법조문을 파고드는 끈기의 상징",
    themeColor: "from-amber-500 to-rose-600",
    priceKrw: 0,
    isPremium: false,
    levels: [
      { level: 1, title: "갓 부화한 아기 부엉이", requiredMinutes: 0, perk: "기본 타이머 효과음" },
      { level: 2, title: "형광펜 쥔 열공 부엉이", requiredMinutes: 60, perk: "O/X 복습 덱 10% 추가 경험치" },
      { level: 3, title: "독서실 총무 부엉이", requiredMinutes: 180, perk: "연속 집중 45분 달성 배지" },
      { level: 4, title: "기출 정복 펠로우 부엉이", requiredMinutes: 360, perk: "AI 스캔 결과창 골드 테두리" },
      { level: 5, title: "주택관리사 수석합격 마스터", requiredMinutes: 600, perk: "전국 스터디콘 랭킹 전당 등재" },
    ],
  },
  {
    coneType: "BLUE_DRAGON",
    name: "2026 합격기원 청룡 소장",
    badgeEmoji: "🐉",
    description: "2차 합격의 기운을 불어넣는 한정판 영물 스터디콘",
    themeColor: "from-sky-400 to-indigo-600",
    priceKrw: 3300,
    isPremium: true,
    levels: [
      { level: 1, title: "청룡의 여의주 알", requiredMinutes: 0, perk: "푸른 불꽃 집중 타이머 UI" },
      { level: 2, title: "구름을 가르는 아기 청룡", requiredMinutes: 60, perk: "스캔 성공 시 청룡 이펙트" },
      { level: 3, title: "법정 점검 수호 청룡", requiredMinutes: 180, perk: "플래너 히트맵 네온 블루 테마" },
      { level: 4, title: "과태료 방어 마스터 드래곤", requiredMinutes: 360, perk: "Pro View 자동 전환 혜택" },
      { level: 5, title: "전지전능 주택관리 총괄용", requiredMinutes: 600, perk: "PosMul 현금 EAT 서포터 훈장" },
    ],
  },
  {
    coneType: "LUCKY_CAT",
    name: "합격 보증 마네키네코",
    badgeEmoji: "🐱",
    description: "헷갈리는 5지선다 오답을 귀신같이 피하게 해주는 행운의 고양이",
    themeColor: "from-emerald-400 to-teal-600",
    priceKrw: 1100,
    isPremium: true,
    levels: [
      { level: 1, title: "방울 단 아기 냥이", requiredMinutes: 0, perk: "산뜻한 민트 타이머 테마" },
      { level: 2, title: "앞발 든 복냥이", requiredMinutes: 60, perk: "O/X 3연속 정답 시 냥이 애니메이션" },
      { level: 3, title: "단지 순찰 골목대장", requiredMinutes: 180, perk: "망각곡선 복습 알림 요정" },
      { level: 4, title: "하자보수 감리냥이", requiredMinutes: 360, perk: "단원별 WBS 완료 스탬프" },
      { level: 5, title: "평생 안락 관리냥이", requiredMinutes: 600, perk: "합격 축하 전용 스터디콘 이펙트" },
    ],
  },
  {
    coneType: "GOLD_LION",
    name: "과태료 철통방어 황금 사자",
    badgeEmoji: "🦁",
    description: "지자체 합동 감사와 과태료 리스크를 한 방에 물리치는 백수의 왕",
    themeColor: "from-amber-400 to-yellow-600",
    priceKrw: 2200,
    isPremium: true,
    levels: [
      { level: 1, title: "용맹한 아기 사자", requiredMinutes: 0, perk: "황금색 게이지 바" },
      { level: 2, title: "갈기 돋은 순찰 사자", requiredMinutes: 60, perk: "법정 의무 D-3 긴급 포효 알림" },
      { level: 3, title: "관리규약 수호 라이언", requiredMinutes: 180, perk: "동대표 회의록 작성 부스터" },
      { level: 4, title: "K-apt 감사 무결점 사자", requiredMinutes: 360, perk: "회계 결산 캘린더 전용 스킨" },
      { level: 5, title: "1등 아파트 대단지 총괄소장", requiredMinutes: 600, perk: "영구 과태료 방어 마크" },
    ],
  },
];

