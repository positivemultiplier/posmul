export interface LiveEventRoom {
  id: string;
  category: "SPORTS" | "ECONOMY" | "ENTERTAINMENT" | "POLITICS";
  categoryLabel: string;
  title: string;
  subtitle: string;
  status: "LIVE" | "UPCOMING" | "CLOSED" | "ENDED";
  viewerCount: number;
  registrationEnd?: string; // 마감 시간 (ISO 문자열)
  settlementDate?: string; // 정산 예정일 (ISO 문자열)
  settledAt?: string | null; // 실제 정산 완료 일시
  winningOptionId?: string | null; // 정산 승리 옵션 ID
  winningOptionLabel?: string | null; // 정산 승리 옵션 텍스트
  matchScore?: {
    teamA: string;
    teamB: string;
    scoreA: number | string;
    scoreB: number | string;
    statusText: string;
  };
  predictionGame?: {
    id: string;
    slug: string;
    question: string;
    oracleLabel: string;
    optionA: { id: string; label: string; ratio: number; count: number };
    optionB: { id: string; label: string; ratio: number; count: number };
    totalPoolPmc: number;
  };
  initialMessages?: Array<{
    id: string;
    sender: string;
    teamTag: string;
    teamColor: string;
    message: string;
    time: string;
  }>;
}

export const LIVE_ROOMS: LiveEventRoom[] = [
  {
    id: "kbo-final-game7",
    category: "SPORTS",
    categoryLabel: "⚾ 프로야구 한국시리즈 결승",
    title: "2026 KBO 한국시리즈 운명의 7차전",
    subtitle: "우승 트로피를 결정짓는 마지막 승부! 이닝별 실시간 응원톡 & 승부예측",
    status: "LIVE",
    viewerCount: 1482,
    registrationEnd: "2026-11-11T05:18:04.160Z",
    settlementDate: "2026-11-12T05:18:04.160Z",
    matchScore: {
      teamA: "KIA 타이거즈",
      teamB: "삼성 라이온즈",
      scoreA: 5,
      scoreB: 4,
      statusText: "8회말 2사 주자 1,2루",
    },
    predictionGame: {
      id: "a1111111-2222-4333-8444-555555550002",
      slug: "sports-kbo-ks-game7-2026",
      question: "2026 KBO 한국시리즈 최종 우승 구단은?",
      oracleLabel: "KBO 공식 기록실 최종 스코어",
      optionA: { id: "kia", label: "KIA 우승", ratio: 62, count: 894 },
      optionB: { id: "samsung", label: "삼성 역전우승", ratio: 38, count: 588 },
      totalPoolPmc: 35000,
    },
    initialMessages: [
      {
        id: "kbo-init-1",
        sender: "타이거즈v12",
        teamTag: "KIA 우승",
        teamColor: "bg-sky-500/20 text-sky-300 border-sky-400/40",
        message: "오늘 8회말 투아웃만 막으면 한국시리즈 우승 확정이다 가자아아!!",
        time: "20:42",
      },
      {
        id: "kbo-init-2",
        sender: "푸른피의사자",
        teamTag: "삼성 역전우승",
        teamColor: "bg-rose-500/20 text-rose-300 border-rose-400/40",
        message: "아직 9회초 중심타선 남아있음!! 역전 쓰리런 홈런 각이다 ㅋㅋ",
        time: "20:43",
      },
    ],
  },
  {
    id: "drama-weekend-live",
    category: "ENTERTAINMENT",
    categoryLabel: "📺 주말 드라마 본방사수 톡",
    title: "금토·주말 미니시리즈 본방사수 & 시청률 12% 돌파 배틀",
    subtitle: "지금 TV 보면서 실시간 엔딩 장면 같이 떠들어요! 내일 아침 닐슨 시청률 12% 넘을까?",
    status: "LIVE",
    viewerCount: 1165,
    registrationEnd: "2026-11-14T12:00:00.000Z",
    settlementDate: "2026-11-15T00:00:00.000Z",
    matchScore: {
      teamA: "전회차 시청률",
      teamB: "목표 돌파 기준",
      scoreA: "11.4%",
      scoreB: "12.0%",
      statusText: "본방송 2부 클라이맥스 방영 중",
    },
    predictionGame: {
      id: "630bd8c0-cb0d-45be-935e-93da54dea935",
      slug: "kcontent-weekend-drama-rating-20261114",
      question: "이번 주 주말 미니시리즈 최고 시청률 12.0% 돌파할까?",
      oracleLabel: "닐슨코리아 전국 가구 시청률 (익일 07:00 공시)",
      optionA: { id: "yes", label: "12.0% 돌파 (Yes)", ratio: 68, count: 792 },
      optionB: { id: "no", label: "12.0% 미달 (No)", ratio: 32, count: 373 },
      totalPoolPmc: 28500,
    },
    initialMessages: [
      {
        id: "drama-init-1",
        sender: "드라마광팬",
        teamTag: "12.0% 돌파 (Yes)",
        teamColor: "bg-sky-500/20 text-sky-300 border-sky-400/40",
        message: "와 방금 법정 반전 소름 돋았음 ㄷㄷ 오늘 무조건 자체최고 13% 찍는다!",
        time: "21:51",
      },
      {
        id: "drama-init-2",
        sender: "닐슨분석러",
        teamTag: "12.0% 미달 (No)",
        teamColor: "bg-rose-500/20 text-rose-300 border-rose-400/40",
        message: "오늘 동시간대 야구 중계 겹쳐서 11.8% 정도에서 아슬아슬하게 멈출 듯!",
        time: "21:52",
      },
    ],
  },
  {
    id: "nasdaq-open-bell",
    category: "ECONOMY",
    categoryLabel: "📈 미국증시 개장 라이브",
    title: "오늘 밤 뉴욕증시(나스닥 100) 개장 라이브 톡",
    subtitle: "거시지표 발표 직후 정규장 개장! QQQ 상승 마감 vs 하락 마감 실시간 배틀",
    status: "LIVE",
    viewerCount: 924,
    registrationEnd: "2026-11-13T13:57:48.242Z",
    settlementDate: "2026-11-14T13:57:48.242Z",
    matchScore: {
      teamA: "QQQ (나스닥 100)",
      teamB: "전일 종가 대비",
      scoreA: "$512.40",
      scoreB: "+0.84%",
      statusText: "미국 정규장 프리마켓·본장 거래 중",
    },
    predictionGame: {
      id: "1d312552-313d-40ab-a124-5b642671d1ee",
      slug: "us-nasdaq-daily-20261106",
      question: "오늘 밤 나스닥 100(QQQ) 전일 대비 상승 마감할까?",
      oracleLabel: "Alpha Vantage US Market 정규장 공식 종가",
      optionA: { id: "up", label: "상승 마감 (Up)", ratio: 71, count: 656 },
      optionB: { id: "down", label: "하락 마감 (Down)", ratio: 29, count: 268 },
      totalPoolPmc: 29400,
    },
    initialMessages: [
      {
        id: "nasdaq-init-1",
        sender: "서학개미대장",
        teamTag: "상승 마감 (Up)",
        teamColor: "bg-sky-500/20 text-sky-300 border-sky-400/40",
        message: "엔비디아랑 빅테크 선물 다 초록불 켜졌다 오늘 나스닥 불기둥 가자 🚀",
        time: "22:31",
      },
      {
        id: "nasdaq-init-2",
        sender: "월가숏포지션",
        teamTag: "하락 마감 (Down)",
        teamColor: "bg-rose-500/20 text-rose-300 border-rose-400/40",
        message: "국채금리 슬금슬금 오르는 중이라 새벽 3시쯤 차익실현 매물 나올 수 있음",
        time: "22:32",
      },
    ],
  },
  {
    id: "crypto-btc-95k-live",
    category: "ECONOMY",
    categoryLabel: "₿ 비트코인 시세 워치",
    title: "비트코인(BTC) $95,000 돌파 카운트다운 라이브",
    subtitle: "CoinGecko 글로벌 시세 연동! 기관 ETF 자금 유입 속 $95K 저항선 뚫을까?",
    status: "LIVE",
    viewerCount: 840,
    registrationEnd: "2026-11-13T02:58:15.718Z",
    settlementDate: "2026-11-14T02:58:15.718Z",
    matchScore: {
      teamA: "BTC 현재가",
      teamB: "돌파 목표가",
      scoreA: "$93,850",
      scoreB: "$95,000",
      statusText: "24시간 실시간 온체인 거래 중 (+2.4%)",
    },
    predictionGame: {
      id: "859136e0-2f6e-4cc6-b354-3553eab0f1aa",
      slug: "btc-weekly-target-202611",
      question: "비트코인(BTC) 이번 주 $95,000 돌파할까?",
      oracleLabel: "CoinGecko 글로벌 인덱스 실시간 API",
      optionA: { id: "yes", label: "$95,000 돌파 (Yes)", ratio: 64, count: 538 },
      optionB: { id: "no", label: "$95,000 미달 (No)", ratio: 36, count: 302 },
      totalPoolPmc: 32000,
    },
    initialMessages: [
      {
        id: "btc-init-1",
        sender: "사토시나카모토",
        teamTag: "$95,000 돌파 (Yes)",
        teamColor: "bg-sky-500/20 text-sky-300 border-sky-400/40",
        message: "94K 매도벽 얇아지고 있다 오늘 새벽에 95K 한 번에 뚫는다!!",
        time: "21:15",
      },
      {
        id: "btc-init-2",
        sender: "차트기술자",
        teamTag: "$95,000 미달 (No)",
        teamColor: "bg-rose-500/20 text-rose-300 border-rose-400/40",
        message: "95K 심리적 저항선이라 한 번은 눌림목 주고 갈 가능성도 봐야 함",
        time: "21:16",
      },
    ],
  },
  {
    id: "epl-son-supermatch",
    category: "SPORTS",
    categoryLabel: "⚽ 프리미어리그 빅매치",
    title: "토트넘 vs 아스날 북런던 더비 (손흥민 선발)",
    subtitle: "손흥민 주장 선발 출격! 북런던 더비 실시간 중계 응원톡 & 공격포인트 내기",
    status: "LIVE",
    viewerCount: 1054,
    registrationEnd: "2026-11-11T02:59:19.655Z",
    settlementDate: "2026-11-12T02:59:19.655Z",
    matchScore: {
      teamA: "토트넘 (SON 7)",
      teamB: "아스날",
      scoreA: 1,
      scoreB: 1,
      statusText: "후반 64분 진행 중",
    },
    predictionGame: {
      id: "5ba2906b-f792-4e10-897d-eb18953ee501",
      slug: "epl-son-attack-point-2026",
      question: "손흥민 이번 주말 프리미어리그 경기에서 공격포인트 기록할까?",
      oracleLabel: "EPL / Football-Data 공식 경기 기록",
      optionA: { id: "yes", label: "공격포인트 기록 (Yes)", ratio: 67, count: 706 },
      optionB: { id: "no", label: "무득점 (No)", ratio: 33, count: 348 },
      totalPoolPmc: 26800,
    },
    initialMessages: [
      {
        id: "epl-init-1",
        sender: "쏘니캡틴7",
        teamTag: "공격포인트 기록 (Yes)",
        teamColor: "bg-sky-500/20 text-sky-300 border-sky-400/40",
        message: "방금 왼쪽 라인 침투 지렸다 ㅋㅋ 후반 75분쯤 감아차기 골 무조건 나온다!",
        time: "23:40",
      },
      {
        id: "epl-init-2",
        sender: "구너스의심장",
        teamTag: "무득점 (No)",
        teamColor: "bg-rose-500/20 text-rose-300 border-rose-400/40",
        message: "오늘 살리바가 전담 마크 중이라 쉽게 슈팅 각 안 줄 듯!",
        time: "23:41",
      },
    ],
  },
  {
    id: "ott-netflix-drama-live",
    category: "ENTERTAINMENT",
    categoryLabel: "🎬 넷플릭스 정주행 톡",
    title: "주말 넷플릭스 한국 시리즈 TOP 10 1위 정주행 라운지",
    subtitle: "주말 화제작 정주행하면서 명장면 토크! 이번 주 넷플릭스 한국 1위 수성할까?",
    status: "LIVE",
    viewerCount: 645,
    registrationEnd: "2026-11-12T05:18:04.160Z",
    settlementDate: "2026-11-13T05:18:04.160Z",
    matchScore: {
      teamA: "현재 한국 순위",
      teamB: "글로벌 비영어권",
      scoreA: "TOP 1",
      scoreB: "TOP 3",
      statusText: "Netflix Tudum 일간 순위 집계 중",
    },
    predictionGame: {
      id: "a1111111-2222-4333-8444-555555550001",
      slug: "kcontent-ott-netflix-top1-20261115",
      question: "금주 화제작 한국 드라마, 넷플릭스 한국 TOP 10 1위 수성할까?",
      oracleLabel: "Netflix Tudum / FlixPatrol 공식 집계",
      optionA: { id: "yes", label: "한국 드라마 1위 (Yes)", ratio: 74, count: 477 },
      optionB: { id: "no", label: "해외·예능 1위 (No)", ratio: 26, count: 168 },
      totalPoolPmc: 24000,
    },
    initialMessages: [
      {
        id: "ott-init-1",
        sender: "넷플정주행러",
        teamTag: "한국 드라마 1위 (Yes)",
        teamColor: "bg-sky-500/20 text-sky-300 border-sky-400/40",
        message: "4화 엔딩 보고 잠 못 자는 중 ㅋㅋ 입소문 타서 이번 주 내내 1위 고정일 듯!",
        time: "22:10",
      },
      {
        id: "ott-init-2",
        sender: "OTT평론가",
        teamTag: "해외·예능 1위 (No)",
        teamColor: "bg-rose-500/20 text-rose-300 border-rose-400/40",
        message: "신규 요리 서바이벌 예능 화제성도 만만치 않아서 주말 순위 박빙일 듯!",
        time: "22:12",
      },
    ],
  },
];

/**
 * 마감 시간(registrationEnd) 및 정산(settledAt) 기준 라이브 룸의 실효 상태 판정
 * - SETTLED / settledAt 존재: ENDED (정산 완료)
 * - CLOSED 또는 현재 시간이 registrationEnd 초과 시: CLOSED (마감 완료)
 * - 그 외: LIVE 또는 UPCOMING
 */
export function getLiveRoomEffectiveStatus(room: LiveEventRoom): "LIVE" | "UPCOMING" | "CLOSED" | "ENDED" {
  if (room.settledAt || room.status === "ENDED") {
    return "ENDED";
  }
  if (room.status === "CLOSED") {
    return "CLOSED";
  }
  if (room.registrationEnd) {
    const endMs = new Date(room.registrationEnd).getTime();
    if (!isNaN(endMs) && endMs <= Date.now()) {
      return "CLOSED";
    }
  }
  return room.status;
}

/**
 * 특정 예측 게임 ID 또는 slug로 연동된 라이브 응원톡 룸 찾기
 */
export function findLiveRoomByGame(gameIdOrSlug?: string | null): LiveEventRoom | undefined {
  if (!gameIdOrSlug) return undefined;
  return LIVE_ROOMS.find(
    (r) =>
      r.predictionGame?.id === gameIdOrSlug ||
      r.predictionGame?.slug === gameIdOrSlug
  );
}
