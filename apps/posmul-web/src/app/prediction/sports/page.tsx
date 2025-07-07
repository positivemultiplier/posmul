/**
 * Sports Predictions Overview Page
 *
 * Shows all sports subcategories with quick access to different sports
 * Based on the 3-tier navigation: predictions/sports
 *
 * @author PosMul Development Team
 * @since 2024-12
 */

import {
  CategoryOverviewLayout,
  type CategoryStatistics,
  type GameCardProps,
  type PopularSubcategory,
} from "../../../shared/ui";

// 실제 스포츠 예측 게임들 (EnhancedGameCard 형식)
const sportsGames: GameCardProps[] = [
  {
    id: "game-001",
    title: "2024 챔피언스리그 결승 - 맨시티 vs 레알 마드리드",
    description:
      "유럽 최고의 클럽들이 만나는 운명의 대결! 누가 트로피를 들어올릴까요?",
    category: "축구",
    gameType: "wdl",
    status: "active",
    difficulty: "medium",
    participants: 3420,
    maxParticipants: 5000,
    totalStake: 125000,
    minStake: 100,
    maxStake: 10000,
    expectedReturn: 2.8,
    endTime: "2024-12-20T19:00:00Z",
    href: "/prediction/sports/soccer/champions-league-final",
    moneyWave: {
      allocatedPool: 300000,
      currentPool: 125000,
      waveMultiplier: 2.4,
      distributionDate: "2024-12-21",
    },
    options: [
      { id: "home", label: "맨시티 승리", probability: 0.45, odds: 2.2 },
      { id: "draw", label: "무승부", probability: 0.25, odds: 4.0 },
      { id: "away", label: "레알 마드리드 승리", probability: 0.3, odds: 3.3 },
    ],
    imagePlaceholder: "챔피언스리그 결승",
    tags: ["챔피언스리그", "유럽축구", "결승전"],
    isHot: true,
    isFeatured: true,
  },
  {
    id: "game-002",
    title: "LOL 월드 챔피언십 2024 - T1 vs JDG",
    description: "세계 최강팀들의 치열한 대결! 페이커의 전설이 계속될까요?",
    category: "e스포츠",
    gameType: "binary",
    status: "active",
    difficulty: "high",
    participants: 2890,
    maxParticipants: 4000,
    totalStake: 98000,
    minStake: 50,
    maxStake: 5000,
    expectedReturn: 3.2,
    endTime: "2024-12-18T14:00:00Z",
    href: "/prediction/sports/esports/lol-worlds-2024",
    moneyWave: {
      allocatedPool: 200000,
      currentPool: 98000,
      waveMultiplier: 2.0,
      distributionDate: "2024-12-19",
    },
    options: [
      { id: "t1", label: "T1 승리", probability: 0.55, odds: 1.8 },
      { id: "jdg", label: "JDG 승리", probability: 0.45, odds: 2.2 },
    ],
    imagePlaceholder: "LOL 월드 챔피언십",
    tags: ["리그오브레전드", "월드챔피언십", "T1"],
    isHot: true,
  },
  {
    id: "game-003",
    title: "2024 KBO 정규시즌 우승팀 예측",
    description: "치열한 KBO 리그! 올해는 어느 팀이 정규시즌 1위를 차지할까요?",
    category: "야구",
    gameType: "ranking",
    status: "active",
    difficulty: "medium",
    participants: 1560,
    maxParticipants: 3000,
    totalStake: 67000,
    minStake: 100,
    maxStake: 3000,
    expectedReturn: 4.5,
    endTime: "2024-12-25T23:59:00Z",
    href: "/prediction/sports/baseball/kbo-season-winner",
    moneyWave: {
      allocatedPool: 150000,
      currentPool: 67000,
      waveMultiplier: 2.2,
      distributionDate: "2024-12-26",
    },
    options: [
      { id: "kia", label: "KIA 타이거즈", probability: 0.25, odds: 4.0 },
      { id: "lg", label: "LG 트윈스", probability: 0.22, odds: 4.5 },
      { id: "doosan", label: "두산 베어스", probability: 0.2, odds: 5.0 },
      { id: "samsung", label: "삼성 라이온즈", probability: 0.18, odds: 5.5 },
      { id: "lotte", label: "롯데 자이언츠", probability: 0.15, odds: 6.7 },
    ],
    imagePlaceholder: "KBO 리그",
    tags: ["KBO", "한국야구", "정규시즌"],
  },
  {
    id: "game-004",
    title: "NBA 2024-25 시즌 MVP 예측",
    description:
      "새 시즌 NBA의 가장 가치 있는 선수는 누가 될까요? 치열한 경쟁이 예상됩니다!",
    category: "농구",
    gameType: "multichoice",
    status: "active",
    difficulty: "high",
    participants: 2100,
    maxParticipants: 4000,
    totalStake: 89000,
    minStake: 200,
    maxStake: 8000,
    expectedReturn: 5.2,
    endTime: "2025-04-15T23:59:00Z",
    href: "/prediction/sports/basketball/nba-mvp-2025",
    moneyWave: {
      allocatedPool: 250000,
      currentPool: 89000,
      waveMultiplier: 2.8,
      distributionDate: "2025-04-16",
    },
    options: [
      { id: "luka", label: "루카 돈치치", probability: 0.28, odds: 3.6 },
      {
        id: "giannis",
        label: "야니스 아데토쿤보",
        probability: 0.25,
        odds: 4.0,
      },
      { id: "jokic", label: "니콜라 요키치", probability: 0.22, odds: 4.5 },
      { id: "tatum", label: "제이슨 테이텀", probability: 0.15, odds: 6.7 },
      {
        id: "sga",
        label: "샤이 길저스-알렉산더",
        probability: 0.1,
        odds: 10.0,
      },
    ],
    imagePlaceholder: "NBA MVP",
    tags: ["NBA", "MVP", "농구"],
    isFeatured: true,
  },
  {
    id: "game-005",
    title: "발로란트 챔피언스 2024 - 한국팀 4강 진출 여부",
    description:
      "한국 발로란트의 자존심을 건 대회! 한국팀이 4강에 진출할 수 있을까요?",
    category: "e스포츠",
    gameType: "binary",
    status: "pending",
    difficulty: "medium",
    participants: 890,
    maxParticipants: 2000,
    totalStake: 34000,
    minStake: 50,
    maxStake: 2000,
    expectedReturn: 2.1,
    endTime: "2024-12-22T10:00:00Z",
    href: "/prediction/sports/esports/valorant-champions-2024",
    moneyWave: {
      allocatedPool: 80000,
      currentPool: 34000,
      waveMultiplier: 1.8,
      distributionDate: "2024-12-23",
    },
    options: [
      { id: "yes", label: "4강 진출", probability: 0.35, odds: 2.9 },
      { id: "no", label: "4강 진출 실패", probability: 0.65, odds: 1.5 },
    ],
    imagePlaceholder: "발로란트 챔피언스",
    tags: ["발로란트", "한국팀", "e스포츠"],
  },
  {
    id: "game-006",
    title: "2024 피겨 스케이팅 그랑프리 파이널 - 김연아 해설 등장 여부",
    description:
      "피겨 여왕 김연아가 해설진으로 등장할까요? 팬들의 관심이 집중되고 있습니다!",
    category: "기타스포츠",
    gameType: "binary",
    status: "active",
    difficulty: "low",
    participants: 1200,
    maxParticipants: 2500,
    totalStake: 28000,
    minStake: 10,
    maxStake: 1000,
    expectedReturn: 1.8,
    endTime: "2024-12-19T18:00:00Z",
    href: "/prediction/sports/other/figure-skating-yuna-kim",
    moneyWave: {
      allocatedPool: 50000,
      currentPool: 28000,
      waveMultiplier: 1.5,
      distributionDate: "2024-12-20",
    },
    options: [
      { id: "yes", label: "해설 등장", probability: 0.6, odds: 1.7 },
      { id: "no", label: "해설 불참", probability: 0.4, odds: 2.5 },
    ],
    imagePlaceholder: "피겨 스케이팅",
    tags: ["피겨스케이팅", "김연아", "해설"],
  },
];

// 스포츠 통계 데이터
const sportsStatistics: CategoryStatistics = {
  totalRewardPool: 2500000, // 250만 PMC
  totalParticipants: 45678,
  activeGames: 89,
  subcategoryCount: 8,
};

// 인기 스포츠 서브카테고리 TOP 3
const popularSportsSubcategories: PopularSubcategory[] = [
  {
    id: "soccer",
    title: "축구",
    icon: "⚽",
    participantCount: 15420,
    rank: 1,
  },
  {
    id: "esports",
    title: "e스포츠",
    icon: "🎮",
    participantCount: 12456,
    rank: 2,
  },
  {
    id: "baseball",
    title: "야구",
    icon: "⚾",
    participantCount: 8934,
    rank: 3,
  },
];

export default function SportsOverviewPage() {
  return (
    <CategoryOverviewLayout
      category="스포츠"
      title="스포츠 예측"
      description="축구, 야구, 농구, e스포츠 등 다양한 스포츠 경기 결과를 예측하고 보상을 획득하세요!"
      icon="⚽"
      statistics={sportsStatistics}
      popularSubcategories={popularSportsSubcategories}
      games={sportsGames}
      maxGamesDisplay={6}
    />
  );
}
