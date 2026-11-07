export interface LiveEventRoom {
  id: string;
  category: "SPORTS" | "ECONOMY" | "ENTERTAINMENT" | "POLITICS";
  categoryLabel: string;
  title: string;
  subtitle: string;
  status: "LIVE" | "UPCOMING" | "ENDED";
  viewerCount: number;
  matchScore?: {
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
    statusText: string; // 예: "9회말 투아웃 주자 2,3루"
  };
  predictionGame?: {
    id: string;
    question: string;
    optionA: { id: string; label: string; ratio: number; count: number };
    optionB: { id: string; label: string; ratio: number; count: number };
    totalPoolPmc: number;
  };
}

export const LIVE_ROOMS: LiveEventRoom[] = [
  {
    id: "kbo-final-game7",
    category: "SPORTS",
    categoryLabel: "⚾ 야구 한국시리즈 결승",
    title: "2026 KBO 한국시리즈 7차전",
    subtitle: "우승을 결정짓는 운명의 7차전! 실시간 승부예측 & 응원톡",
    status: "LIVE",
    viewerCount: 1482,
    matchScore: {
      teamA: "KIA 타이거즈",
      teamB: "삼성 라이온즈",
      scoreA: 5,
      scoreB: 4,
      statusText: "8회말 2사 주자 1,2루",
    },
    predictionGame: {
      id: "859136e0-2f6e-4cc6-b354-3553eab0f1aa",
      question: "2026 한국시리즈 우승 트로피의 주인공은?",
      optionA: { id: "kia", label: "KIA 우승", ratio: 62, count: 894 },
      optionB: { id: "samsung", label: "삼성 역전우승", ratio: 38, count: 588 },
      totalPoolPmc: 18450,
    },
  },
  {
    id: "nasdaq-open-bell",
    category: "ECONOMY",
    categoryLabel: "📈 미국증시 개장 라이브",
    title: "오늘 밤 뉴욕증시(나스닥) 개장 라이브 톡",
    subtitle: "CPI 지표 발표 직후 정규장 시작! 지수 상승 vs 하락 실시간 배틀",
    status: "LIVE",
    viewerCount: 924,
    matchScore: {
      teamA: "QQQ (나스닥 100)",
      teamB: "전일 종가 대비",
      scoreA: 20450,
      scoreB: 20380,
      statusText: "정규장 거래 진행 중 (+0.84%)",
    },
    predictionGame: {
      id: "1d312552-313d-40ab-a124-5b642671d1ee",
      question: "오늘 밤 나스닥 100 전일 대비 상승 마감할까?",
      optionA: { id: "up", label: "상승 마감 (Up)", ratio: 71, count: 656 },
      optionB: { id: "down", label: "하락 마감 (Down)", ratio: 29, count: 268 },
      totalPoolPmc: 24200,
    },
  },
  {
    id: "epl-son-supermatch",
    category: "SPORTS",
    categoryLabel: "⚽ 프리미어리그 빅매치",
    title: "토트넘 vs 아스날 북런던 더비",
    subtitle: "손흥민 선발 출격! 북런던 더비 실시간 라이브 중계톡",
    status: "UPCOMING",
    viewerCount: 312,
    matchScore: {
      teamA: "토트넘",
      teamB: "아스날",
      scoreA: 0,
      scoreB: 0,
      statusText: "오늘 밤 23:30 킥오프",
    },
    predictionGame: {
      id: "5ba2906b-f792-4e10-897d-eb18953ee501",
      question: "손흥민 이번 경기 공격포인트 기록할까?",
      optionA: { id: "yes", label: "공격포인트 기록 (Yes)", ratio: 65, count: 204 },
      optionB: { id: "no", label: "무득점 (No)", ratio: 35, count: 108 },
      totalPoolPmc: 12000,
    },
  },
];

