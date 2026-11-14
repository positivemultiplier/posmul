/**
 * PosMul 힐링룸 (싸이월드 감성 미니홈피) 카탈로그 & 명예 트로피 계산기
 * - 경제 불변식: 모든 상점 아이템은 무위험 활동 재화 PMP로만 구매하며 PMC는 소비하지 않습니다.
 * - 명예 트로피(Honor Shelf)는 구매 불가하며 실제 기부·예측·게임 개설 실적으로만 해금됩니다.
 */

export type HealingItemCategory = "theme" | "minimi" | "prop";

export interface RoomThemeItem {
  id: string;
  category: "theme";
  name: string;
  description: string;
  pricePmp: number;
  icon: string;
  gradientClass: string;
  windowLabel: string;
  windowBgClass: string;
  floorClass: string;
  accentHex: string;
}

export interface MinimiStyleItem {
  id: string;
  category: "minimi";
  name: string;
  description: string;
  pricePmp: number;
  avatarEmoji: string;
  accessoryEmoji: string;
  auraClass: string;
  badgeLabel: string;
}

export interface RoomPropItem {
  id: string;
  category: "prop";
  name: string;
  description: string;
  pricePmp: number;
  emoji: string;
  badgeText: string;
  /** 미니룸 캔버스 내 절대 위치(%) */
  posLeftPct: number;
  posBottomPct: number;
}

export type AnyHealingItem = RoomThemeItem | MinimiStyleItem | RoomPropItem;

export interface BgmTrackOption {
  id: string;
  label: string;
  moodDesc: string;
  /** 정적 MP3 음원 경로 (없을 경우 Web Audio API 화음으로 재생) */
  audioUrl?: string;
  /** Web Audio API 앰비언트 화음 주파수 */
  frequencies: number[];
  waveform: OscillatorType;
}

export interface HonorStatsInput {
  donationCount: number;
  totalDonatedPmc: number;
  createdGamesCount: number;
  predictionCount: number;
  totalVisits: number;
  guestbookCount: number;
}

export interface HonorTrophyItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progressText: string;
}

export const ROOM_THEMES: ReadonlyArray<RoomThemeItem> = [
  {
    id: "sunset-attic",
    category: "theme",
    name: "노을빛 다락방",
    description: "창밖으로 따뜻한 저녁노을이 스며드는 아늑한 기본 다락방",
    pricePmp: 0,
    icon: "🌇",
    gradientClass: "from-[#2d1e2f] via-[#4a2c40] to-[#1e1726]",
    windowLabel: "저녁 노을 창가",
    windowBgClass: "from-amber-400/70 via-orange-500/60 to-rose-700/70",
    floorClass: "from-[#4e342e] to-[#2e1f1b]",
    accentHex: "#f59e0b",
  },
  {
    id: "seongsu-bookcafe",
    category: "theme",
    name: "성수 우드 북카페",
    description: "원목 서가와 커피 향기가 은은하게 감도는 감성 북카페",
    pricePmp: 300,
    icon: "📚",
    gradientClass: "from-[#1f2924] via-[#2b3a32] to-[#131a17]",
    windowLabel: "초록 가로수 창가",
    windowBgClass: "from-emerald-300/60 via-teal-500/50 to-slate-800/70",
    floorClass: "from-[#5c4033] to-[#3b2820]",
    accentHex: "#34d399",
  },
  {
    id: "starry-terrace",
    category: "theme",
    name: "별빛 루프탑 테라스",
    description: "은하수와 도시 야경 아래 조용히 사색하기 좋은 밤 테라스",
    pricePmp: 500,
    icon: "🌌",
    gradientClass: "from-[#0f172a] via-[#1e1b4b] to-[#090d16]",
    windowLabel: "은하수 밤하늘",
    windowBgClass: "from-indigo-400/50 via-purple-700/60 to-slate-950/90",
    floorClass: "from-[#272b3f] to-[#161925]",
    accentHex: "#818cf8",
  },
  {
    id: "forest-cabin",
    category: "theme",
    name: "숲속 통나무 오두막",
    description: "피톤치드 가득한 숲속에서 완전히 쉬어가는 치유 오두막",
    pricePmp: 700,
    icon: "🌲",
    gradientClass: "from-[#172b20] via-[#23402e] to-[#101c15]",
    windowLabel: "안개 숲 전망창",
    windowBgClass: "from-lime-300/50 via-emerald-700/60 to-green-950/90",
    floorClass: "from-[#543d2b] to-[#36261a]",
    accentHex: "#4ade80",
  },
];

export const MINIMI_STYLES: ReadonlyArray<MinimiStyleItem> = [
  {
    id: "warm-knit",
    category: "minimi",
    name: "포근 니트 시민",
    description: "편안한 베이지 니트와 따뜻한 커피를 든 기본 미니미",
    pricePmp: 0,
    avatarEmoji: "🧑🏻‍💻",
    accessoryEmoji: "☕",
    auraClass: "from-amber-400/25 to-orange-500/20 border-amber-300/40",
    badgeLabel: "힐링 기본",
  },
  {
    id: "detective-owl",
    category: "minimi",
    name: "예측 탐정 부엉이",
    description: "밤낮없이 흐름을 읽고 날카롭게 예측하는 귀여운 지성 탐정",
    pricePmp: 250,
    avatarEmoji: "🦉",
    accessoryEmoji: "🔎",
    auraClass: "from-sky-400/30 to-indigo-500/25 border-sky-300/50",
    badgeLabel: "예측 스페셜",
  },
  {
    id: "cozy-camper",
    category: "minimi",
    name: "모닥불 캠퍼",
    description: "주말이면 동네 공원과 캠핑장에서 충전하는 여유로운 여행자",
    pricePmp: 350,
    avatarEmoji: "🦊",
    accessoryEmoji: "🎒",
    auraClass: "from-emerald-400/30 to-teal-500/25 border-emerald-300/50",
    badgeLabel: "아웃도어",
  },
  {
    id: "angel-wings",
    category: "minimi",
    name: "나눔 천사 코디",
    description: "기부의 기쁨을 전하는 반짝이는 날개와 온기 아우라",
    pricePmp: 400,
    avatarEmoji: "👼🏻",
    accessoryEmoji: "🕊️",
    auraClass: "from-rose-400/30 to-pink-500/25 border-rose-300/50",
    badgeLabel: "기부 스페셜",
  },
  {
    id: "golden-sage",
    category: "minimi",
    name: "집단지성 현자",
    description: "차분한 황금빛 후광을 두른 PosMul 아고라의 지혜로운 시민",
    pricePmp: 600,
    avatarEmoji: "🧙🏻",
    accessoryEmoji: "✨",
    auraClass: "from-yellow-400/35 to-amber-500/30 border-yellow-300/60",
    badgeLabel: "프리미엄",
  },
];

export const ROOM_PROPS: ReadonlyArray<RoomPropItem> = [
  {
    id: "plant-pot",
    category: "prop",
    name: "행운 몬스테라 화분",
    description: "방에 싱그러운 생기를 불어넣는 초록 식물",
    pricePmp: 0,
    emoji: "🪴",
    badgeText: "공기정화",
    posLeftPct: 12,
    posBottomPct: 22,
  },
  {
    id: "wood-desk",
    category: "prop",
    name: "원목 독서 테이블",
    description: "뉴스를 읽고 미래 예측 아이디어를 적는 책상",
    pricePmp: 0,
    emoji: "🪵",
    badgeText: "사색 공간",
    posLeftPct: 76,
    posBottomPct: 18,
  },
  {
    id: "tea-table",
    category: "prop",
    name: "캐모마일 티세트",
    description: "마음이 복잡할 때 마음을 가라앉히는 따뜻한 허브티",
    pricePmp: 150,
    emoji: "🍵",
    badgeText: "릴렉스",
    posLeftPct: 68,
    posBottomPct: 29,
  },
  {
    id: "sleeping-cat",
    category: "prop",
    name: "낮잠 치즈냥",
    description: "방석 위에서 가르랑거리며 낮잠 자는 치유 고양이",
    pricePmp: 200,
    emoji: "🐱",
    badgeText: "심신안정",
    posLeftPct: 27,
    posBottomPct: 14,
  },
  {
    id: "mood-lamp",
    category: "prop",
    name: "오렌지 무드 스탠드",
    description: "방 전체에 포근한 노란빛을 채워주는 빈티지 스탠드",
    pricePmp: 250,
    emoji: "🛋️",
    badgeText: "감성조명",
    posLeftPct: 84,
    posBottomPct: 33,
  },
  {
    id: "vinyl-player",
    category: "prop",
    name: "빈티지 LP 턴테이블",
    description: "로파이 선율이 흘러나오는 나만의 음악 감상 코너",
    pricePmp: 350,
    emoji: "📻",
    badgeText: "BGM 감성",
    posLeftPct: 18,
    posBottomPct: 36,
  },
  {
    id: "warm-fireplace",
    category: "prop",
    name: "장작 벽난로",
    description: "타닥타닥 장작 소리와 온기가 퍼지는 겨울 힐링 오브제",
    pricePmp: 450,
    emoji: "🔥",
    badgeText: "온기 가득",
    posLeftPct: 88,
    posBottomPct: 16,
  },
  {
    id: "telescope",
    category: "prop",
    name: "미래 관측 망원경",
    description: "별빛 너머 내일과 세상의 변화를 읽는 황동 망원경",
    pricePmp: 500,
    emoji: "🔭",
    badgeText: "통찰 상징",
    posLeftPct: 34,
    posBottomPct: 38,
  },
];

export const ALL_HEALING_ITEMS: ReadonlyArray<AnyHealingItem> = [
  ...ROOM_THEMES,
  ...MINIMI_STYLES,
  ...ROOM_PROPS,
];

export function findHealingItemById(itemId: string): AnyHealingItem | undefined {
  return ALL_HEALING_ITEMS.find((item) => item.id === itemId);
}

export const BGM_TRACKS: ReadonlyArray<BgmTrackOption> = [
  {
    id: "frozen-warmth",
    label: "얼어붙은 온기 (Original)",
    moodDesc: "겨울 감성과 잔잔한 여운이 어우러진 PosMul 오리지널 BGM",
    audioUrl: "/audio/healing-room/frozen-warmth.mp3",
    frequencies: [220, 261.63, 329.63, 392.0],
    waveform: "sine",
  },
  {
    id: "snowflakes-stayed",
    label: "눈꽃이 머문 자리 (Original)",
    moodDesc: "눈꽃처럼 포근하게 마음을 감싸는 힐링 멜로디",
    audioUrl: "/audio/healing-room/where-snowflakes-stayed.mp3",
    frequencies: [246.94, 293.66, 369.99, 440.0],
    waveform: "sine",
  },
  {
    id: "lofi-rain",
    label: "빗소리 Lo-Fi 다락방",
    moodDesc: "잔잔한 로파이 화음과 차분한 저녁 감성",
    frequencies: [220, 277.18, 329.63, 415.3],
    waveform: "sine",
  },
  {
    id: "cafe-guitar",
    label: "성수 어쿠스틱 기타",
    moodDesc: "따뜻한 오후 햇살 같은 어쿠스틱 톤",
    frequencies: [261.63, 329.63, 392.0, 493.88],
    waveform: "triangle",
  },
  {
    id: "fireplace-crack",
    label: "벽난로 밤 피아노",
    moodDesc: "깊은 밤 온기가 느껴지는 미니멀 화음",
    frequencies: [196.0, 246.94, 293.66, 369.99],
    waveform: "sine",
  },
  {
    id: "morning-birds",
    label: "아침 숲속 피톤치드",
    moodDesc: "맑고 청량한 아침 공기를 닮은 멜로디",
    frequencies: [293.66, 369.99, 440.0, 554.37],
    waveform: "sine",
  },
];

export const MOOD_TAGS: ReadonlyArray<string> = [
  "평온 ☕",
  "뿌듯 🌱",
  "집중 🔮",
  "설렘 ✨",
  "충전중 🌙",
];

/**
 * 실제 DB 활동 실적을 기반으로 영광의 선반(Honor Shelf) 트로피 해금 상태를 계산합니다.
 */
export function computeHonorTrophies(stats: HonorStatsInput): HonorTrophyItem[] {
  const donatedPmc = Math.max(0, Math.round(stats.totalDonatedPmc));

  return [
    {
      id: "first-donation",
      title: "첫 나눔의 씨앗",
      icon: "🌱",
      description: "PosMul에서 PMC 기부를 1회 이상 실천했습니다.",
      unlocked: stats.donationCount >= 1 || donatedPmc >= 100,
      progressText:
        stats.donationCount >= 1 || donatedPmc >= 100
          ? `달성 완료 (${donatedPmc.toLocaleString()} PMC 나눔)`
          : "기부 1회 달성 시 해금",
    },
    {
      id: "warm-sharer",
      title: "선한 영향력 서포터",
      icon: "🕊️",
      description: "누적 1,000 PMC 이상을 세상에 나누었습니다.",
      unlocked: donatedPmc >= 1000,
      progressText:
        donatedPmc >= 1000
          ? `달성 완료 (${donatedPmc.toLocaleString()} PMC)`
          : `${donatedPmc.toLocaleString()} / 1,000 PMC`,
    },
    {
      id: "game-creator",
      title: "미래 설계자",
      icon: "🎯",
      description: "직접 예측게임을 제안·개설해 집단지성 장을 열었습니다.",
      unlocked: stats.createdGamesCount >= 1,
      progressText:
        stats.createdGamesCount >= 1
          ? `개설 ${stats.createdGamesCount}개 달성`
          : "예측게임 1개 생성 시 해금",
    },
    {
      id: "prophet-rookie",
      title: "집단지성 탐색가",
      icon: "🔮",
      description: "예측게임에 3회 이상 참여하며 세상을 읽는 눈을 길렀습니다.",
      unlocked: stats.predictionCount >= 3,
      progressText:
        stats.predictionCount >= 3
          ? `참여 ${stats.predictionCount}회 달성`
          : `${stats.predictionCount} / 3회 참여`,
    },
    {
      id: "prophet-veteran",
      title: "통찰의 마스터",
      icon: "🏆",
      description: "예측게임 10회 이상 참여한 베테랑 시민입니다.",
      unlocked: stats.predictionCount >= 10,
      progressText:
        stats.predictionCount >= 10
          ? `참여 ${stats.predictionCount}회 달성`
          : `${stats.predictionCount} / 10회 참여`,
    },
    {
      id: "neighborhood-star",
      title: "따뜻한 동네 사랑방",
      icon: "🏡",
      description: "방문자 50회 이상 또는 일촌평 3개 이상을 모았습니다.",
      unlocked: stats.totalVisits >= 50 || stats.guestbookCount >= 3,
      progressText:
        stats.totalVisits >= 50 || stats.guestbookCount >= 3
          ? `방문 ${stats.totalVisits} · 방명록 ${stats.guestbookCount}`
          : `방문 ${stats.totalVisits}/50 · 방명록 ${stats.guestbookCount}/3`,
    },
  ];
}
