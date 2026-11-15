/**
 * 현직 관리소장(Pro) 전용 커뮤니티 · 집단지성 투표 · 실무 문서 템플릿 데이터
 * PosMul 플랫폼의 포럼/예측/PMP 경제 생태계와 연계됩니다.
 */

export interface ProCommunityPollOption {
  id: string;
  label: string;
  votes: number;
}

export interface ProCommunityPost {
  id: string;
  category: "DISPUTE" | "REPAIR" | "LABOR" | "TENDER" | "TIP";
  categoryLabel: string;
  authorName: string;
  complexBadge: string; // 예: "1,200세대 · 지역난방"
  createdAt: string;
  title: string;
  content: string;
  pmpReward: number;
  likes: number;
  commentCount: number;
  comments: Array<{
    id: string;
    author: string;
    badge: string;
    text: string;
    lawRef?: string;
  }>;
  poll?: {
    question: string;
    options: ProCommunityPollOption[];
  };
}

export const INITIAL_PRO_COMMUNITY_POSTS: ProCommunityPost[] = [
  {
    id: "pro-post-1",
    category: "REPAIR",
    categoryLabel: "장충금 vs 수선비",
    authorName: "박소장 (18년차)",
    complexBadge: "1,240세대 · 지역난방",
    createdAt: "18분 전",
    title: "지하주차장 LED 디밍 제어기 부분 교체, 장충금 집행 가능할까요?",
    content:
      "지하주차장 B2 구역 디밍 센서·제어기 약 35%가 노후로 오작동 중입니다. 전체 전면교체가 아닌 구역별 부분 교체인데, 지자체 감사에서 장충금 목적 외 사용 지적받을지 의견 여쭙습니다.",
    pmpReward: 15,
    likes: 24,
    commentCount: 3,
    comments: [
      {
        id: "c-1",
        author: "김소장 (서울 송파)",
        badge: "법령검증",
        text: "장기수선계획 수선항목에 '주차장 조명설비(제어장치 포함)'가 명시되어 있고 부분수선 계획이 수립되어 있다면 장충금 집행 가능합니다.",
        lawRef: "공동주택관리법 제30조 제2항",
      },
      {
        id: "c-2",
        author: "이소장 (경기 분당)",
        badge: "감사대응",
        text: "장기수선계획서에 수선항목으로 안 들어가 있으면 수선유지비로 처리하거나, 차기 정기검토 시 항목 추가 후 집행하시는 게 안전합니다.",
      },
    ],
    poll: {
      question: "우리 단지 감사 기준, 이 건 어떻게 집행하시나요?",
      options: [
        { id: "opt-lt", label: "장기수선계획 반영 후 장충금 집행", votes: 48 },
        { id: "opt-maint", label: "소모·부분 수선으로 수선유지비 집행", votes: 31 },
        { id: "opt-hold", label: "지자체 유권해석 서면 질의 후 결정", votes: 19 },
      ],
    },
  },
  {
    id: "pro-post-2",
    category: "LABOR",
    categoryLabel: "노무·경비원",
    authorName: "정소장 (9년차)",
    complexBadge: "680세대 · 개별난방",
    createdAt: "2시간 전",
    title: "경비원 휴게시간 분리수거 보조 업무, 감시단속직 승인 취소 사례 공유",
    content:
      "야간 휴게시간 중 택배 민원 응대 일지가 발견되어 노동청 점검 시 감시단속직 적용 제외 경고를 받았습니다. 휴게실 안내문 및 무전기 OFF 서약서 양식 공유드립니다.",
    pmpReward: 20,
    likes: 41,
    commentCount: 2,
    comments: [
      {
        id: "c-3",
        author: "최소장 (인천 연수)",
        badge: "대단지",
        text: "휴게시간 안내문 엘리베이터 부착 + 비상연락은 관리과 당직으로 돌린 증빙이 핵심입니다. 자료 감사합니다!",
        lawRef: "근로기준법 제63조 제3호",
      },
    ],
  },
  {
    id: "pro-post-3",
    category: "TENDER",
    categoryLabel: "사업자선정",
    authorName: "한소장 (12년차)",
    complexBadge: "950세대 · 중앙난방",
    createdAt: "어제",
    title: "승강기 유지관리 업체 적격심사 시 '행정처분 확인서' 유효기간 기준",
    content:
      "입찰공고일 기준 최근 1년 행정처분 확인서 제출 시, 공고일 5일 전 발급본도 인정해야 하는지 입대의에서 이견이 있어 국토부 질의 회신 내용 정리했습니다.",
    pmpReward: 15,
    likes: 33,
    commentCount: 1,
    comments: [
      {
        id: "c-4",
        author: "오소장 (부산 해운대)",
        badge: "입찰실무",
        text: "주택관리업자 및 사업자 선정지침상 입찰공고일 전일 기준 1개월 이내 발급분이면 유효로 보는 것이 표준입니다.",
        lawRef: "사업자선정지침 별표7",
      },
    ],
    poll: {
      question: "적격심사 세부배점표 중 입대의와 가장 마찰이 큰 항목은?",
      options: [
        { id: "opt-1", label: "기술능력(장비·기술인력 보유)", votes: 27 },
        { id: "opt-2", label: "업무수행실적(동일 세대수 실적)", votes: 44 },
        { id: "opt-3", label: "신용평가등급 및 행정처분", votes: 15 },
      ],
    },
  },
];

export interface ProDocumentTemplate {
  id: string;
  category: "입대의 안건" | "장기수선" | "사업자공고" | "민원회신";
  title: string;
  legalBasis: string;
  checklist: string[];
  draftTemplate: string;
}

export const PRO_DOCUMENT_TEMPLATES: ProDocumentTemplate[] = [
  {
    id: "doc-agenda-lt",
    category: "장기수선",
    title: "장기수선계획 정기검토 및 조정 의결 안건지",
    legalBasis: "공동주택관리법 제29조 제2항 (3년마다 정기검토, 미이행 시 최대 1,000만원 과태료)",
    checklist: [
      "직전 검토일로부터 3년 경과 여부 확인",
      "주요 시설물(승강기·옥상방수·급배수관) 단가 시세 반영",
      "입주자대표회의 과반수 찬성 의결 회의록 첨부",
    ],
    draftTemplate: `[입주자대표회의 제○차 정기회의 안건]

1. 안 건 명: 2026년도 장기수선계획 정기검토 및 조정(안) 심의·의결의 건
2. 제안사유: 공동주택관리법 제29조 제2항에 따라 수립·조정된 날부터 3년이 경과하여, 단지 주요 공용부 시설의 노후도 및 물가변동을 반영한 정기검토를 실시하고자 함.
3. 주요 검토내용:
   - 승강기 제어반 및 로프 수선주기 현실화
   - 지하주차장 LED 및 방수공사 예정단가 현행화
   - 세대당 장기수선충당금 월 부과액 적정성 검토
4. 근거법령: 공동주택관리법 제29조 제2항 및 동법 시행규칙 제7조`,
  },
  {
    id: "doc-tender-notice",
    category: "사업자공고",
    title: "주택관리업자 및 사업자 선정 적격심사 입찰 공고 체크문",
    legalBasis: "국토교통부 고시「주택관리업자 및 사업자 선정지침」제16조·제24조",
    checklist: [
      "K-apt 공동주택관리정보시스템 전자입찰 공고 등록",
      "현장설명회 참석 의무 여부(선택사항) 명확화",
      "입찰보증금 5% 이상 및 참가자격 제한 법정 기준 준수",
    ],
    draftTemplate: `[입찰공고 요약 초안]

1. 단지개요: {COMPLEX_NAME} ({HOUSEHOLDS}세대 / {HEATING})
2. 입찰에 부치는 사항: 공용부 유지보수 및 법정 점검 용역 사업자 선정
3. 입찰방법: 제한경쟁입찰 / 적격심사제 / 전자입찰(K-apt)
4. 제출서류: 사업자등록증 사본, 법인등기부등본, 국세·지방세 완납증명서, 최근 1년간 행정처분 확인서, 적격심사 자기평가표 및 증빙일체
5. 유의사항: 선정지침 제6조(입찰의 무효)에 해당하는 경우 무효 처리하며, 무효 사유는 유선 또는 팩스로 통보함.`,
  },
  {
    id: "doc-civil-reply",
    category: "민원회신",
    title: "세대 누수(공용부 vs 전유부) 책임구분 공식 안내문",
    legalBasis: "공동주택관리법 시행령 제19조 및 표준관리규약 별표3(전유·공용부분의 범위)",
    checklist: [
      "관리사무소 1차 육안·청음 점검 일지 작성",
      "주배관(PD 내 입상관) vs 세대 분기밸브 이후 가지배관 구분 사진 확보",
      "일상배상책임보험 안내 및 표준관리규약 조항 명시",
    ],
    draftTemplate: `[민원 검토 회신서]

수 신: {COMPLEX_NAME} ○○동 ○○○○호 입주자 귀하
제 목: 세대 내 누수 원인 점검 및 공용·전유부 책임구분 안내

1. 귀 세대의 쾌적한 주거환경을 위해 협조해 주심에 감사드립니다.
2. 요청하신 누수 민원에 대하여 관리사무소 시설팀이 현장 점검을 실시한 결과, 본 누수 부위는 우리 단지 관리규약 별표3(전유부분과 공용부분의 범위)상 세대 분기계량기 이후 전유부 배관에 해당하는 것으로 확인되었습니다.
3. 이에 따라 보수 공사는 세대 부담으로 진행하셔야 하며, 가입하신 주택화재보험(일상생활배상책임 특약)을 통한 보상 가능 여부를 확인해 보실 것을 안내드립니다.`,
  },
  {
    id: "doc-agenda-budget",
    category: "입대의 안건",
    title: "K-apt 관리비 공개 및 외부회계감사 결과 보고 안건",
    legalBasis: "공동주택관리법 제23조 제4항 & 제26조 (300세대 이상 매년 외부회계감사 의무)",
    checklist: [
      "부과 익월 말일까지 K-apt 47개 항목 공개 완료 확인",
      "외부회계감사 감사보고서 1개월 이내 입대의 제출 및 공개",
      "예비비·잡수입 집행내역 관리규약 준수 확인",
    ],
    draftTemplate: `[입주자대표회의 보고 안건]

1. 안 건 명: 월간 관리비 부과명세 K-apt 공개 및 회계결산 보고
2. 법적근거: 공동주택관리법 제23조 제4항 및 제26조 제1항
3. 주요내용:
   - 당월 관리비 47개 세부 비목 K-apt 시스템 및 동별 게시판 공개 완료
   - 장기수선충당금 적립 및 예치 계좌 잔액 대사 결과 이상 없음
   - 승강기·소방 등 법정 점검 비용 집행 내역 첨부`,
  },
];
