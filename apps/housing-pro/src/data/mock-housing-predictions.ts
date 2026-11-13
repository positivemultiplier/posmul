export interface HousingPredictionGame {
  id: string;
  slug: string;
  title: string;
  category: "LAW_AMENDMENT" | "EXAM_RATE" | "KAPT_EXPENSE";
  categoryLabel: string;
  description: string;
  dueDate: string;
  oracleSource: string; // 공인 판정 기준 오라클
  totalPoolPmc: number; // 적립된 PMC 보상 풀
  totalParticipants: number;
  options: Array<{
    id: string;
    label: string;
    probabilityPct: number;
    multiplier: number; // 예상 리워드 배율
    stakedPmp: number;
  }>;
}

export const HOUSING_PREDICTION_GAMES: HousingPredictionGame[] = [
  {
    id: "pred-housing-01",
    slug: "2026-housing-act-amendment-reserve-fund",
    title: "장기수선충당금 적립요율 법정 하한선 신설 조항, 상반기 국회 통과할까?",
    category: "LAW_AMENDMENT",
    categoryLabel: "공동주택관리법 개정안",
    description: "노후 아파트 승강기 교체 지연 및 안전사고 방지를 위해 법정 최소 충당금 적립 기준을 법률에 명시하는 개정안의 2026년 6월 30일 이전 국회 본회의 통과 여부",
    dueDate: "2026-06-30",
    oracleSource: "대한민국 국회 의안정보시스템 (의안번호 제2204912호 본회의 가결 여부)",
    totalPoolPmc: 15400,
    totalParticipants: 342,
    options: [
      {
        id: "opt-pass",
        label: "통과된다 (찬성)",
        probabilityPct: 68,
        multiplier: 1.47,
        stakedPmp: 23800,
      },
      {
        id: "opt-fail",
        label: "부결/계류 (반대)",
        probabilityPct: 32,
        multiplier: 3.12,
        stakedPmp: 11200,
      },
    ],
  },
  {
    id: "pred-housing-02",
    slug: "2026-exam-round29-pass-rate-over-20pct",
    title: "제29회 주택관리사보 2차 시험 전국 최종 합격률 20% 초과할까?",
    category: "EXAM_RATE",
    categoryLabel: "2026 시험 통계",
    description: "2026년 9월 시행 제29회 주택관리사보 2차 시험의 전국 최종 합격률이 전년 대비 상대평가 선발예정인원 변동에 따라 20.00%를 초과할지 예측",
    dueDate: "2026-11-30",
    oracleSource: "한국산업인력공단 Q-Net 공지사항 (제29회 2차 시험 최종 합격자 공고 통계)",
    totalPoolPmc: 28500,
    totalParticipants: 512,
    options: [
      {
        id: "opt-over",
        label: "20% 초과 (상승)",
        probabilityPct: 41,
        multiplier: 2.44,
        stakedPmp: 18900,
      },
      {
        id: "opt-under",
        label: "20% 이하 (하락/유지)",
        probabilityPct: 59,
        multiplier: 1.69,
        stakedPmp: 27200,
      },
    ],
  },
  {
    id: "pred-housing-03",
    slug: "2026-kapt-winter-heating-cost-rise",
    title: "K-apt 전국 아파트 ㎡당 공용 난방비, 올겨울 12% 이상 상승할까?",
    category: "KAPT_EXPENSE",
    categoryLabel: "K-apt 실무 지표",
    description: "LNG 및 열요금 단가 인상에 따라 2026년 12월~2027년 1월 기준 전국 의무관리대상 공동주택 평균 ㎡당 난방비가 전년 동기 대비 12% 이상 상승할지 예측",
    dueDate: "2027-02-28",
    oracleSource: "공동주택관리정보시스템(K-apt) 전국 월별 관리비 통계 데이터",
    totalPoolPmc: 12000,
    totalParticipants: 215,
    options: [
      {
        id: "opt-rise",
        label: "12% 이상 상승",
        probabilityPct: 54,
        multiplier: 1.85,
        stakedPmp: 14500,
      },
      {
        id: "opt-steady",
        label: "12% 미만 유지",
        probabilityPct: 46,
        multiplier: 2.17,
        stakedPmp: 12300,
      },
    ],
  },
];

