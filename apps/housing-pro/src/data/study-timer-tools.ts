export type TimerThemeId = "posmul-coral" | "midnight-navy" | "forest-emerald" | "warm-sepia";

export interface TimerThemeSpec {
  id: TimerThemeId;
  name: string;
  desc: string;
  bgClass: string;
  cardBgClass: string;
  accentHex: string;
  accentSoftClass: string;
  ringClass: string;
}

export const TIMER_THEME_PRESETS: TimerThemeSpec[] = [
  {
    id: "posmul-coral",
    name: "포스멀 코럴 다크",
    desc: "시그니처 열공 오렌지 & 딥 차콜",
    bgClass: "bg-[#0A0A0D]",
    cardBgClass: "bg-[#14141B]",
    accentHex: "#FF5A36",
    accentSoftClass: "bg-[#FF5A36]/15 text-[#FF8A6B] border-[#FF5A36]/40",
    ringClass: "ring-[#FF5A36]",
  },
  {
    id: "midnight-navy",
    name: "심야 독서실 네이비",
    desc: "눈의 피로를 줄여주는 딥 블루",
    bgClass: "bg-[#070B14]",
    cardBgClass: "bg-[#101726]",
    accentHex: "#38BDF8",
    accentSoftClass: "bg-sky-500/15 text-sky-300 border-sky-400/40",
    ringClass: "ring-sky-400",
  },
  {
    id: "forest-emerald",
    name: "새벽 숲 에메랄드",
    desc: "장기 암기에 좋은 차분한 딥 그린",
    bgClass: "bg-[#07100D]",
    cardBgClass: "bg-[#0F1B17]",
    accentHex: "#10B981",
    accentSoftClass: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
    ringClass: "ring-emerald-400",
  },
  {
    id: "warm-sepia",
    name: "종이책 웜 세피아",
    desc: "부드러운 스탠드 조명 감성",
    bgClass: "bg-[#120F0B]",
    cardBgClass: "bg-[#1D1812]",
    accentHex: "#F59E0B",
    accentSoftClass: "bg-amber-500/15 text-amber-300 border-amber-400/40",
    ringClass: "ring-amber-400",
  },
];

export interface HousingGlossaryItem {
  id: string;
  term: string;
  subject: "주택법" | "공동주택관리법" | "민법" | "회계원리" | "시설개론";
  summary: string;
  keyNumbers?: string;
}

export const HOUSING_GLOSSARY_ITEMS: HousingGlossaryItem[] = [
  {
    id: "g-1",
    term: "의무관리대상 공동주택",
    subject: "공동주택관리법",
    summary:
      "300세대 이상, 150세대 이상(승강기 또는 중앙/지역난방), 150세대 이상 주상복합, 또는 입주자 2/3 이상 서면동의 전환 단지.",
    keyNumbers: "300세대 · 150세대 · 동의 2/3",
  },
  {
    id: "g-2",
    term: "장기수선충당금 요율·적립",
    subject: "공동주택관리법",
    summary:
      "사용검사일(임시사용승인일)부터 1년 경과한 날이 속하는 달부터 매월 적립. 소유자 부담 원칙(임차인 납부 시 반환 청구 가능).",
    keyNumbers: "1년 경과 · 매월 · 3년마다 검토",
  },
  {
    id: "g-3",
    term: "하자담보책임기간 (내력구조부 vs 시설공사)",
    subject: "공동주택관리법",
    summary:
      "내력구조부 중대한 하자는 10년, 마감공사는 2년, 방수·지붕 등 3년, 철근콘크리트/대지조성 등 5년.",
    keyNumbers: "마감 2년 · 방수 3년 · 구조 5~10년",
  },
  {
    id: "g-4",
    term: "입주자대표회의 의결 및 임기",
    subject: "공동주택관리법",
    summary:
      "동별 대표자 임기는 2년이며 한 번만 중임 가능(보궐 임기 6개월 미만 미산입). 정원 4명 이상, 구성원 과반수 찬성 의결.",
    keyNumbers: "임기 2년 · 1회 중임 · 과반수 의결",
  },
  {
    id: "g-5",
    term: "사용검사와 사용승인의 차이",
    subject: "주택법",
    summary:
      "주택법상 사업계획승인 대상은 시장·군수·구청장의 '사용검사(15일 이내)', 건축법 허가 대상은 '사용승인(7일 이내)'.",
    keyNumbers: "사용검사 15일 · 사용승인 7일",
  },
  {
    id: "g-6",
    term: "전매제한 기산일",
    subject: "주택법",
    summary:
      "당첨자 발표일부터 기산. 상속·이혼·배우자 일부 증여 등 불가피한 사유는 LH 등 사업주체 동의 시 예외 인정.",
    keyNumbers: "최초 입주자선정일(당첨일) 기준",
  },
  {
    id: "g-7",
    term: "분양가상한제 적용 주택의 거주의무",
    subject: "주택법",
    summary:
      "공공택지 또는 민간택지 분양가상한제 적용 주택은 인근 매매가 비율에 따라 2~5년 최초 입주가능일부터 거주의무 부과.",
    keyNumbers: "최대 5년 · 최초 입주가능일",
  },
  {
    id: "g-8",
    term: "감가상각 연수합계법 · 정률법",
    subject: "회계원리",
    summary:
      "취득초기 감가상각비가 크게 계상되는 가속상각법. 정률법은 (장부금액 × 상각률)로 잔존가치를 마지막 연도 외 직접 차감하지 않음.",
    keyNumbers: "연수합계 n(n+1)/2 · 기초장부가액",
  },
  {
    id: "g-9",
    term: "현금흐름표 영업활동(간접법)",
    subject: "회계원리",
    summary:
      "당기순이익 + 비현금비용(감가상각비·사채상환손실) - 비현금수익(유형자산처분이익) ± 운전자본 증감.",
    keyNumbers: "자산 증가는 (-) · 부채 증가는 (+)",
  },
  {
    id: "g-10",
    term: "표준관입시험(N값)과 사질토·점성토",
    subject: "시설개론",
    summary:
      "63.5kg 추를 76cm 높이에서 낙하시켜 30cm 관입 타격 횟수(N값). 사질토는 내부마찰각, 점성토는 일축압축강도 판정.",
    keyNumbers: "63.5kg · 76cm · 30cm 관입",
  },
  {
    id: "g-11",
    term: "표현대리 (민법 제125·126·129조)",
    subject: "민법",
    summary:
      "수권행위의 표시, 권한을 넘은 표현대리(기본대리권 존재 + 정당한 이유), 대리권 소멸 후 표현대리. 무권대리이나 본인 책임 성립.",
    keyNumbers: "상대방 선의·무과실 필수",
  },
];

export interface StudyGroupMemberItem {
  id: string;
  nickname: string;
  emoji: string;
  todaySeconds: number;
  isStudying: boolean;
  subject: string;
  weeklySeconds: number[]; // 월~일 7일 (초 단위)
  isMe?: boolean;
}

export interface StudyGroupChatMessage {
  id: string;
  sender: string;
  emoji: string;
  text: string;
  timeLabel: string;
  isMe?: boolean;
}

export interface StudyGroupRoom {
  id: string;
  title: string;
  category: string;
  notice: string;
  leaderName: string;
  goalHours: number;
  capacity: number;
  memberCount: number;
  attendancePct: number;
  isPublic: boolean;
  requiresCam?: boolean;
  createdLabel: string;
  members: StudyGroupMemberItem[];
  chats: StudyGroupChatMessage[];
}

export const INITIAL_STUDY_GROUPS: StudyGroupRoom[] = [
  {
    id: "grp-29th-pass",
    title: "주택관리사(보) 29회 동차합격방",
    category: "자격증",
    notice: "매일 최소 4시간 인증 · 법규/실무 오답 공유 환영! 주말 모의고사 필참 💪",
    leaderName: "합격소장박",
    goalHours: 6,
    capacity: 50,
    memberCount: 43,
    attendancePct: 86,
    isPublic: true,
    createdLabel: "2026. 09. 01.",
    members: [
      {
        id: "m1",
        nickname: "수석합격박",
        emoji: "🐉",
        todaySeconds: 18862,
        isStudying: true,
        subject: "공동주택관리법",
        weeklySeconds: [27180, 26400, 27000, 0, 0, 0, 0],
      },
      {
        id: "m2",
        nickname: "동차킹송",
        emoji: "🦁",
        todaySeconds: 17469,
        isStudying: true,
        subject: "관리실무",
        weeklySeconds: [23100, 32460, 29640, 0, 0, 0, 0],
      },
      {
        id: "m3",
        nickname: "기출파괴자",
        emoji: "🦉",
        todaySeconds: 11925,
        isStudying: true,
        subject: "건축법·설비",
        weeklySeconds: [35340, 41880, 27480, 0, 0, 0, 0],
      },
      {
        id: "m4",
        nickname: "아침형소장",
        emoji: "🐱",
        todaySeconds: 10511,
        isStudying: true,
        subject: "안전소방",
        weeklySeconds: [24420, 35400, 23520, 0, 0, 0, 0],
      },
      {
        id: "m5",
        nickname: "서초예비장",
        emoji: "🦉",
        todaySeconds: 9750,
        isStudying: true,
        subject: "주택법 총칙",
        weeklySeconds: [14160, 19620, 18060, 0, 0, 0, 0],
      },
      {
        id: "m6",
        nickname: "회독장인",
        emoji: "🐉",
        todaySeconds: 7804,
        isStudying: true,
        subject: "임대정비법",
        weeklySeconds: [6180, 11580, 9000, 0, 0, 0, 0],
      },
      {
        id: "m7",
        nickname: "퇴근후열공",
        emoji: "🦁",
        todaySeconds: 6558,
        isStudying: true,
        subject: "O/X 3초복습",
        weeklySeconds: [11200, 13400, 12800, 0, 0, 0, 0],
      },
      {
        id: "m8",
        nickname: "직장인45",
        emoji: "🦉",
        todaySeconds: 5630,
        isStudying: false,
        subject: "휴식 중",
        weeklySeconds: [8400, 10200, 7200, 0, 0, 0, 0],
      },
      {
        id: "m9",
        nickname: "주말몰입",
        emoji: "🐱",
        todaySeconds: 4328,
        isStudying: false,
        subject: "오프라인",
        weeklySeconds: [6800, 9100, 4328, 0, 0, 0, 0],
      },
      {
        id: "m10",
        nickname: "법규마스터",
        emoji: "🦉",
        todaySeconds: 3252,
        isStudying: false,
        subject: "휴식 중",
        weeklySeconds: [5400, 4800, 3252, 0, 0, 0, 0],
      },
      {
        id: "m11",
        nickname: "내년합격",
        emoji: "🐱",
        todaySeconds: 2324,
        isStudying: false,
        subject: "오프라인",
        weeklySeconds: [3600, 4200, 2324, 0, 0, 0, 0],
      },
    ],
    chats: [
      {
        id: "c1",
        sender: "수석합격박",
        emoji: "🐉",
        text: "장기수선충당금 3년마다 검토 조문 시험에 자주 나오니 꼭 체크하세요!",
        timeLabel: "10:42",
      },
      {
        id: "c2",
        sender: "아침형소장",
        emoji: "🐱",
        text: "오늘 관계법규 3회독 달립니다 다들 화이팅 🔥",
        timeLabel: "10:55",
      },
    ],
  },
  {
    id: "grp-2nd-focus",
    title: "2차 관계법규·관리실무 뽀개기",
    category: "자격증",
    notice: "2차 주관식·법령 숫자 암기 집중 스터디방입니다.",
    leaderName: "법령요정",
    goalHours: 4,
    capacity: 30,
    memberCount: 24,
    attendancePct: 79,
    isPublic: true,
    createdLabel: "2026. 10. 12.",
    members: [
      {
        id: "f1",
        nickname: "법령요정",
        emoji: "🦉",
        todaySeconds: 14520,
        isStudying: true,
        subject: "주택법",
        weeklySeconds: [18000, 21600, 14520, 0, 0, 0, 0],
      },
      {
        id: "f2",
        nickname: "실무만점",
        emoji: "🦁",
        todaySeconds: 11200,
        isStudying: true,
        subject: "관리실무",
        weeklySeconds: [15200, 16800, 11200, 0, 0, 0, 0],
      },
      {
        id: "f3",
        nickname: "하자보수왕",
        emoji: "🐉",
        todaySeconds: 8940,
        isStudying: true,
        subject: "하자담보",
        weeklySeconds: [12400, 9600, 8940, 0, 0, 0, 0],
      },
      {
        id: "f4",
        nickname: "주말전사",
        emoji: "🐱",
        todaySeconds: 3600,
        isStudying: false,
        subject: "휴식 중",
        weeklySeconds: [7200, 5400, 3600, 0, 0, 0, 0],
      },
    ],
    chats: [
      {
        id: "c3",
        sender: "법령요정",
        emoji: "🦉",
        text: "오늘 밤 10시 OX 3초 퀴즈 챌린지 같이 달려요!",
        timeLabel: "09:18",
      },
    ],
  },
  {
    id: "grp-office-worker",
    title: "직장인 퇴근후 2시간 인증방",
    category: "직장인",
    notice: "매일 최소 2시간만 채워도 출석 인정! 무리하지 말고 꾸준히 갑시다.",
    leaderName: "야근탈출",
    goalHours: 2,
    capacity: 25,
    memberCount: 19,
    attendancePct: 91,
    isPublic: true,
    createdLabel: "2026. 11. 01.",
    members: [
      {
        id: "w1",
        nickname: "야근탈출",
        emoji: "🐱",
        todaySeconds: 7620,
        isStudying: true,
        subject: "회계원리",
        weeklySeconds: [7500, 8100, 7620, 0, 0, 0, 0],
      },
      {
        id: "w2",
        nickname: "지하철암기",
        emoji: "🦉",
        todaySeconds: 5100,
        isStudying: false,
        subject: "이동 중",
        weeklySeconds: [6900, 7200, 5100, 0, 0, 0, 0],
      },
    ],
    chats: [],
  },
];
