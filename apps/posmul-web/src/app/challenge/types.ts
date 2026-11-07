export interface ChallengeOption {
  id: string; // "A", "B", "C", "D"
  label: string;
  votes: number;
  pmp: number;
  ratio: number;
}

export interface UserChallengeDTO {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  options: ChallengeOption[];
  category: "CASUAL" | "SPORTS" | "FANDOM" | "COMPANY" | "COUPLE" | "STUDY";
  visibility: "PRIVATE" | "PUBLIC";
  eventStartAt: string; // 베팅 마감 시각 (ISO)
  settlementAt: string; // 결과 발표 예정 시각 (ISO)
  settledAt?: string | null;
  status: "OPEN" | "LOCKED" | "SETTLED" | "VOID";
  winningOptionId?: string | null;
  winningOptionLabel?: string | null;
  totalPoolPmp: number;
  hostFeePmp: number;
  disputeCount: number;
  createdAt: string;
  myBet?: {
    optionId: string;
    amountPmp: number;
  };
}

export interface ChallengeCommentDTO {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  optionId?: string | null;
  optionLabel?: string | null;
  message: string;
  createdAt: string;
}

export interface ChallengePreset {
  id: string;
  icon: string;
  category: "CASUAL" | "SPORTS" | "FANDOM" | "COMPANY" | "COUPLE" | "STUDY";
  categoryLabel: string;
  title: string;
  options: string[];
  defaultDurationHours: number;
}

export const CHALLENGE_PRESETS: ChallengePreset[] = [
  {
    id: "coffee",
    icon: "☕",
    category: "COMPANY",
    categoryLabel: "오후 커피 쏘기",
    title: "오늘 오후 3시 커피 쏘기! 오늘의 코스피 종가 끝자리?",
    options: ["홀수로 끝난다", "짝수로 끝난다"],
    defaultDurationHours: 3,
  },
  {
    id: "lunch",
    icon: "🍱",
    category: "COMPANY",
    categoryLabel: "점심 메뉴 대결",
    title: "오늘 점심 메뉴 어디로 갈까?",
    options: ["든든한 국밥·한식", "화끈한 중식·짜장", "깔끔한 일식·초밥", "가벼운 샌드위치"],
    defaultDurationHours: 2,
  },
  {
    id: "son-goal",
    icon: "⚽",
    category: "SPORTS",
    categoryLabel: "손흥민 골 배틀",
    title: "오늘 밤 손흥민 공격포인트 기록할까?",
    options: ["골/어시스트 기록 (Yes)", "무득점 (No)"],
    defaultDurationHours: 5,
  },
  {
    id: "kdy-hr",
    icon: "⚾",
    category: "FANDOM",
    categoryLabel: "김도영 홈런",
    title: "오늘 김도영 49호 홈런 터질까?",
    options: ["홈런 터진다 (Yes)", "안 터진다 (No)"],
    defaultDurationHours: 4,
  },
  {
    id: "dinner-after",
    icon: "🍻",
    category: "COMPANY",
    categoryLabel: "회식 2차 여부",
    title: "오늘 금요일 회식, 부장님 2차 가자고 하실까?",
    options: ["1차 끝나고 칼퇴 허락", "2차 치맥 강행"],
    defaultDurationHours: 4,
  },
  {
    id: "late-dating",
    icon: "⏰",
    category: "COUPLE",
    categoryLabel: "데이트 지각 배틀",
    title: "이번 주말 데이트 약속, 누가 5분 이상 늦을까?",
    options: ["오빠가 늦는다", "자기가 늦는다", "둘 다 정시 도착"],
    defaultDurationHours: 24,
  },
  {
    id: "lol-rank",
    icon: "🎮",
    category: "CASUAL",
    categoryLabel: "롤 승급전",
    title: "오늘 철수 롤 골드 승급전 성공할까?",
    options: ["골드 승급 성공!", "연패 박고 강등"],
    defaultDurationHours: 4,
  },
];

