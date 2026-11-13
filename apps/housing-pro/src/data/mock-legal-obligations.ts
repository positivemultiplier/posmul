export interface LegalObligationRule {
  id: string;
  category: "SAFETY" | "FIRE" | "ELECTION" | "FINANCE" | "REPAIR" | "ADMIN";
  title: string;
  cycleRule: "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "ANNUAL" | "TRIENNIAL" | "EVENT";
  cycleLabel: string;
  deadlineDescription: string;
  legalCitation: string;
  lawUrl: string;
  maxFineKrw: number;
  maxFineLabel: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  requiredEvidence: string;
  targetCriteria: string; // 적용 단지 조건
  daysUntilDue: number; // 현재 기준 D-Day
  dueDateString: string; // 마감 예정일자
  lastCompletedDate?: string;
  isCompleted?: boolean;
  relatedExam: {
    round: number;
    year: number;
    subject: "관계법규" | "관리실무";
    questionNumber: number;
    trapSummary: string; // 2차 시험에서 수험생이 외웠던 함정 문장
  };
}

export const MOCK_LEGAL_OBLIGATIONS: LegalObligationRule[] = [
  {
    id: "leg-01",
    category: "SAFETY",
    title: "승강기 자체안전점검 실시 및 결과 입력",
    cycleRule: "MONTHLY",
    cycleLabel: "매월 1회",
    deadlineDescription: "매월 1회 이상 안전관리자가 점검 후 10일 이내 승강기안전종합정보망 입력",
    legalCitation: "승강기안전관리법 제32조 및 시행규칙 제53조",
    lawUrl: "https://www.law.go.kr/법령/승강기안전관리법",
    maxFineKrw: 5000000,
    maxFineLabel: "최대 500만원",
    priority: "CRITICAL",
    requiredEvidence: "승강기 안전관리시스템(승강기안전공단) 점검결과표 및 출력 일지",
    targetCriteria: "승강기 설치 전 단지",
    daysUntilDue: 3,
    dueDateString: "2026-11-16",
    isCompleted: false,
    relatedExam: {
      round: 29,
      year: 2026,
      subject: "관리실무",
      questionNumber: 42,
      trapSummary: "자체안전점검 결과는 '30일 이내'가 아니라 '10일 이내'에 국가종합정보망에 입력해야 함!",
    },
  },
  {
    id: "leg-02",
    category: "FIRE",
    title: "소방시설 자체점검(작동점검·종합정밀점검) 실시 및 관할 소방서 보고",
    cycleRule: "ANNUAL",
    cycleLabel: "연 1회",
    deadlineDescription: "사용승인일이 속한 달의 말일까지 작동점검 실시 후 15일 이내 관할 소방서 제출",
    legalCitation: "소방시설 설치 및 관리에 관한 법률 제22조",
    lawUrl: "https://www.law.go.kr/법령/소방시설설치및관리에관한법률",
    maxFineKrw: 3000000,
    maxFineLabel: "최대 300만원 (미점검 시 1년 이하 징역 또는 1천만원 벌금)",
    priority: "CRITICAL",
    requiredEvidence: "소방시설 자체점검 결과보고서 및 소방서 접수증",
    targetCriteria: "연면적 5,000㎡ 이상 또는 옥내소화전·스프링클러 설치 단지",
    daysUntilDue: 7,
    dueDateString: "2026-11-20",
    isCompleted: false,
    relatedExam: {
      round: 29,
      year: 2026,
      subject: "관리실무",
      questionNumber: 47,
      trapSummary: "소방점검 결과보고서는 점검 완료일로부터 '30일'이 아닌 '15일 이내'에 소방본부장/소방서장에게 보고해야 함!",
    },
  },
  {
    id: "leg-03",
    category: "FINANCE",
    title: "관리비등 부과명세서 동별 게시판 및 K-apt(공동주택관리정보시스템) 공개",
    cycleRule: "MONTHLY",
    cycleLabel: "매월 1회",
    deadlineDescription: "부과 해당 월의 다음 달 말일까지 인터넷 홈페이지 및 K-apt에 47개 세부항목 일괄 공개",
    legalCitation: "공동주택관리법 제23조 제4항 및 시행령 제23조",
    lawUrl: "https://www.law.go.kr/법령/공동주택관리법",
    maxFineKrw: 5000000,
    maxFineLabel: "최대 500만원 과태료 (지자체 감사 1순위 적발)",
    priority: "HIGH",
    requiredEvidence: "K-apt 관리비 공개 캡처본 및 단지 게시판 게시 사진",
    targetCriteria: "100세대 이상 의무관리대상 공동주택",
    daysUntilDue: 17,
    dueDateString: "2026-11-30",
    isCompleted: false,
    relatedExam: {
      round: 29,
      year: 2026,
      subject: "관계법규",
      questionNumber: 8,
      trapSummary: "관리비 내역 공개는 '분기별 1회'가 아닌 '매월 다음 달 말일까지' K-apt에 공개해야 함!",
    },
  },
  {
    id: "leg-04",
    category: "REPAIR",
    title: "장기수선계획 3년 주기 정기 검토 및 조정 의결",
    cycleRule: "TRIENNIAL",
    cycleLabel: "3년마다",
    deadlineDescription: "3년마다 입주자대표회의와 관리주체가 정기 검토 후 입주자대표회의 의결 (조기 조정 시 전체 입주자 과반수 서면동의)",
    legalCitation: "공동주택관리법 제29조 제2항",
    lawUrl: "https://www.law.go.kr/법령/공동주택관리법",
    maxFineKrw: 10000000,
    maxFineLabel: "최대 1,000만원 과태료 (계획 미수립·미검토)",
    priority: "CRITICAL",
    requiredEvidence: "장기수선계획 검토 보고서 및 입대의 정기회의 의결 회의록",
    targetCriteria: "승강기 설치 또는 중앙/지역난방 300세대 이상 공동주택",
    daysUntilDue: 24,
    dueDateString: "2026-12-07",
    isCompleted: false,
    relatedExam: {
      round: 29,
      year: 2026,
      subject: "관계법규",
      questionNumber: 7,
      trapSummary: "장기수선계획 3년 경과 전 조정 시에는 '입대의 의결'만으로 불가하며 '전체 입주자 과반수 서면동의'가 필수임!",
    },
  },
  {
    id: "leg-05",
    category: "ELECTION",
    title: "입주자대표회의 회의록 작성·공고 및 열람 보관",
    cycleRule: "EVENT",
    cycleLabel: "회의 종료 시",
    deadlineDescription: "정기/임시 회의 종료 즉시 회의록을 작성하여 관리소장 및 의장이 서명 날인 후 5일 이내 게시판 공고",
    legalCitation: "공동주택관리법 제14조 및 관리규약 준칙",
    lawUrl: "https://www.law.go.kr/법령/공동주택관리법",
    maxFineKrw: 5000000,
    maxFineLabel: "최대 500만원 과태료",
    priority: "MEDIUM",
    requiredEvidence: "날인 완료 회의록 사본 및 단지 알림판/홈페이지 게시 스크린샷",
    targetCriteria: "입주자대표회의 구성 단지 전체",
    daysUntilDue: 4,
    dueDateString: "2026-11-17",
    isCompleted: false,
    relatedExam: {
      round: 29,
      year: 2026,
      subject: "관계법규",
      questionNumber: 6,
      trapSummary: "입주자대표회의 회의록은 비공개 대상이 아니며, 입주자등이 열람을 청구하거나 복사를 요구할 때 의무적으로 응해야 함!",
    },
  },
  {
    id: "leg-06",
    category: "SAFETY",
    title: "동절기 대비 시설물 안전점검 및 지자체 보고",
    cycleRule: "HALF_YEARLY",
    cycleLabel: "반기 1회",
    deadlineDescription: "매년 10월~11월 중 옹벽, 축대, 변전실, 옥상 방수 등 동절기 대비 정밀 외관 안전점검 완료",
    legalCitation: "공동주택관리법 제32조 (안전점검의 실시)",
    lawUrl: "https://www.law.go.kr/법령/공동주택관리법",
    maxFineKrw: 5000000,
    maxFineLabel: "최대 500만원 과태료",
    priority: "HIGH",
    requiredEvidence: "동절기 시설안전점검 체크리스트 일지 및 조치 결과서",
    targetCriteria: "16층 이상 공동주택 또는 150세대 이상 의무관리대상",
    daysUntilDue: 14,
    dueDateString: "2026-11-27",
    isCompleted: false,
    relatedExam: {
      round: 29,
      year: 2026,
      subject: "관리실무",
      questionNumber: 38,
      trapSummary: "16층 이상 공동주택의 안전점검은 '연 1회'가 아닌 '반기별 1회 이상' 실시해야 함!",
    },
  },
  {
    id: "leg-07",
    category: "SAFETY",
    title: "어린이놀이시설 월간 자체안전점검 및 2년 주기 정기시설검사",
    cycleRule: "MONTHLY",
    cycleLabel: "매월 1회",
    deadlineDescription: "관리주체는 매월 1회 이상 자체 안전점검 실시 후 안전관리시스템 입력, 2년마다 지정기관 정기검사 수검",
    legalCitation: "어린이놀이시설 안전관리법 제12조 및 제15조",
    lawUrl: "https://www.law.go.kr/법령/어린이놀이시설안전관리법",
    maxFineKrw: 5000000,
    maxFineLabel: "최대 500만원 (미수검 운용 시 1년 이하 징역 또는 1천만원 벌금)",
    priority: "HIGH",
    requiredEvidence: "어린이놀이시설 안전관리시스템(어린이안전넷) 월간 점검일지",
    targetCriteria: "어린이놀이터 설치 단지",
    daysUntilDue: 8,
    dueDateString: "2026-11-21",
    isCompleted: false,
    relatedExam: {
      round: 29,
      year: 2026,
      subject: "관리실무",
      questionNumber: 40,
      trapSummary: "어린이놀이시설 정기시설검사 유효기간은 3년이 아닌 '2년'이며, 월간 자체점검 기록은 3년간 보관해야 함!",
    },
  },
  {
    id: "leg-08",
    category: "ADMIN",
    title: "저수조 청소 및 상반기/하반기 먹는물 수질검사",
    cycleRule: "HALF_YEARLY",
    cycleLabel: "반기 1회",
    deadlineDescription: "반기 1회 이상 청소 실시 후 1개월 이내 수질검사 전문기관 의뢰 및 결과 지자체 통보",
    legalCitation: "수도법 제33조 및 시행규칙 제22조의3",
    lawUrl: "https://www.law.go.kr/법령/수도법",
    maxFineKrw: 20000000,
    maxFineLabel: "최대 2년 이하 징역 또는 2천만원 벌금 (형사처벌 규정)",
    priority: "CRITICAL",
    requiredEvidence: "저수조 소독청소 필증 및 공인기관 먹는물 수질검사 성적서 원본",
    targetCriteria: "저수조(지하/옥상 물탱크) 설치 건축물",
    daysUntilDue: 19,
    dueDateString: "2026-12-02",
    isCompleted: false,
    relatedExam: {
      round: 29,
      year: 2026,
      subject: "관리실무",
      questionNumber: 45,
      trapSummary: "저수조 위생점검은 '연 1회'가 아닌 '반기 1회 이상' 소독 및 청소를 실시해야 함!",
    },
  },
];

