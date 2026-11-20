/**
 * 기출 한정 옵시디언 지식 그래프 (Exam-Bounded Knowledge Graph) — 주택관리사 2차 MVP + 1차 배관 PoC
 * 원본 Vault: apps/housing-pro/content/vault/housing/{02-stage2|01-stage1}/.../*.md
 * 빌드 파이프라인: pnpm --filter @posmul/housing-pro build:vault → generated-vault-graph.json
 *
 * - 라이브 DB 기출 1,400제에서 자동 집계된 실제 출제 문항 수·연도를 정적 0ms 조회로 제공
 * - 모든 텍스트 내 핵심 키워드·대조어를 문맥 기반 자동 스팬 매칭하여 꼬리물기 탐색 지원
 */
import generatedVaultGraph from "@/data/generated-vault-graph.json";

export interface KnowledgeConceptNode {
  id: string;
  vaultPath: string;
  title: string;
  englishTitle?: string;
  aliases: string[];
  examStage: "1차" | "2차";
  subject: string;
  chapterCode?: string;
  category: string;
  tags: string[];
  /** 3줄 핵심 특징 */
  summaryBullets: string[];
  /** 기출 단골 함정 포인트 */
  trapWarning: string;
  /** 역대 실제 DB 기출 출제 통계 (Exam-Bounded) */
  examCount: number;
  examYears: number[];
  recent3YCount: number;
  recentTrend: "UP" | "FLAT" | "DOWN";
  /** 소속 대조 축 ID */
  contrastAxisId?: string;
  /** 대조 축 내 어느 쪽인지 */
  contrastSide?: string;
  /** 같은 분류 연관 개념 ID */
  sameGroupIds: string[];
  /** 정반대/비교 대조 개념 ID */
  contrastIds: string[];
  /** DB 기출 검색용 대표 키워드 */
  dbSearchKeyword: string;
  /** 관련 법령 조항 */
  lawRef?: string;
  /** 현직 소장(Pro View) 현장 실무 팁 */
  proFieldTip?: string;
}

export interface KnowledgeContrastAxis {
  id: string;
  examStage: "1차" | "2차";
  subjectTag: string;
  title: string;
  subtitle: string;
  /** 문제 문장 속에서 클릭 트리거가 되는 대조어 (예: "500세대", "동일한", "소유자") */
  triggerTerms: string[];
  /** 이 트리거가 어떤 과목/키워드 문맥에서만 발동할지 (오매칭 방지 가드!) */
  contextKeywords: string[];
  leftSide: {
    label: string;
    description: string;
    conceptIds: string[];
  };
  rightSide: {
    label: string;
    description: string;
    conceptIds: string[];
  };
  examTip: string;
}

export interface DemoGraphQuestion {
  id: string;
  shortTabLabel: string;
  examStage: "1차" | "2차";
  examLabel: string;
  subject: string;
  questionText: string;
  options: Array<{ number: number; text: string }>;
  correctOption: number;
  explanation: string;
}

export const VAULT_GRAPH_META = {
  generatedAt: generatedVaultGraph.generatedAt,
  totalQuestionsScanned: generatedVaultGraph.totalQuestionsScanned,
  totalNodes: generatedVaultGraph.totalNodes,
  stage2TotalQuestions: generatedVaultGraph.stage2TotalQuestions,
  stage2CoveredQuestions: generatedVaultGraph.stage2CoveredQuestions,
  stage2CoveragePercent: generatedVaultGraph.stage2CoveragePercent,
};

export const KNOWLEDGE_CONCEPT_NODES: KnowledgeConceptNode[] =
  generatedVaultGraph.nodes as KnowledgeConceptNode[];

export const KNOWLEDGE_CONTRAST_AXES: KnowledgeContrastAxis[] = [
  {
    id: "AXIS_2ND_500_THRESHOLD",
    examStage: "2차",
    subjectTag: "관계법규",
    title: "500세대 기준 대조: 500세대 이상 vs 500세대 미만",
    subtitle: "입대의 회장·감사 직선/간선, 선관위 인원, 관리사무소장 배치 자격이 갈리는 핵심 분기선!",
    triggerTerms: ["500세대 이상", "500세대 미만", "500세대", "직선", "간선"],
    contextKeywords: ["입주자대표회의", "동별 대표자", "회장", "감사", "선거관리위원회", "의무관리대상", "선출"],
    leftSide: {
      label: "500세대 이상 (직선제 · 선관위 5~9명)",
      description: "회장·감사 전체 입주자등 직선 / 선관위 5명 이상 9명 이하 / 주택관리사 배치",
      conceptIds: ["LAW_02A_REP_COUNCIL", "LAW_02A_ELECTION_COMM"],
    },
    rightSide: {
      label: "500세대 미만 (원칙 간선 · 선관위 3~9명)",
      description: "입대의 구성원 과반수 찬성 간선(규약으로 직선 가능) / 선관위 3~9명 / 주택관리사보 가능",
      conceptIds: ["LAW_02A_MANDATORY_APT", "LAW_02A_REP_COUNCIL", "LAW_02A_ELECTION_COMM"],
    },
    examTip:
      "단골 함정: 500세대 미만에서도 '관리규약으로 정하면' 직선 선출이 가능하며, 선관위 인원은 '500↑ 5~9명 / 500↓ 3~9명'으로 외우세요!",
  },
  {
    id: "AXIS_2ND_MANAGE_METHOD",
    examStage: "2차",
    subjectTag: "관리실무",
    title: "관리방식 대조: 자치관리 vs 위탁관리",
    subtitle: "입대의가 직접 직원을 채용·지휘하느냐, 주택관리업자에게 위탁하느냐에 따라 권한과 기한이 정반대!",
    triggerTerms: ["자치관리", "위탁관리", "주택관리업자", "자치관리기구"],
    contextKeywords: ["관리방식", "자치관리", "위탁관리", "입주자대표회의", "관리사무소장", "구성", "선임"],
    leftSide: {
      label: "자치관리 (6개월 내 기구 구성 · 입대의 선임)",
      description: "입대의 구성원 과반수 찬성으로 소장 선임 / 입대의가 직원 임면·지휘",
      conceptIds: ["PRA_01A_MANAGE_METHOD", "LAW_02A_REP_COUNCIL"],
    },
    rightSide: {
      label: "위탁관리 (경쟁입찰 선정 · 주택관리업자 배치)",
      description: "전자입찰로 주택관리업자 선정 / 입대의는 업자 직원의 인사에 부당간섭 금지",
      conceptIds: ["PRA_01A_MANAGE_METHOD", "PRA_04_BIDDING_GUIDE", "PRA_01B_MANAGE_RULES"],
    },
    examTip:
      "자치관리기구 구성 기한은 '6개월 이내'(3개월 아님!), 위탁→자치 변경이나 자치→위탁 변경 결정은 입대의 의결 또는 전체 입주자등 1/10 제안 + 전체 과반수 찬성입니다.",
  },
  {
    id: "AXIS_2ND_ACT_PERMIT",
    examStage: "2차",
    subjectTag: "관리실무",
    title: "행위 통제 대조: 행위허가 vs 행위신고 vs 관리주체 동의",
    subtitle: "시장·군수·구청장의 허가·신고 사항과, 관리주체의 동의만으로 가능한 경미한 행위를 반드시 구분!",
    triggerTerms: ["행위허가", "행위신고", "관리주체의 동의", "용도변경", "파손·철거"],
    contextKeywords: ["행위허가", "행위신고", "공동주택", "입주자", "부대시설", "복리시설", "리모델링", "동의"],
    leftSide: {
      label: "시장·군수·구청장 허가 / 신고",
      description: "용도변경·증축·대수선·비내력벽 철거(신고) 등은 동의 정족수(2/3, 1/2 등) 충족 후 지자체 절차",
      conceptIds: ["PRA_01B_ACT_PERMIT", "LAW_06_BLDG_REMODEL"],
    },
    rightSide: {
      label: "관리주체 동의 사항 (허가·신고 불요)",
      description: "가축 사육·방송시설·광고물 부착·전기차 이동형 충전 콘센트 등 생활질서 사항",
      conceptIds: ["PRA_01B_ACT_PERMIT", "PRA_01B_MANAGE_RULES"],
    },
    examTip:
      "기출 함정: '비내력벽 철거'는 허가가 아니라 '신고' 대상이고, '내력벽 철거(세대 통합 등)'는 원칙 금지(리모델링·구조안전 예외)입니다!",
  },
  {
    id: "AXIS_REPAIR_FUND",
    examStage: "2차",
    subjectTag: "관계법규",
    title: "비용 부담 주체 대조: 장기수선충당금 vs 수선유지비",
    subtitle: "소유자 부담(주요시설 교체·계획 필수) vs 입주자등 부담(경미·소모성 보수)",
    triggerTerms: ["소유자", "사용자", "임차인", "징수", "부담"],
    contextKeywords: ["장기수선", "수선유지비", "충당금", "관리비", "징수", "반환"],
    leftSide: {
      label: "장기수선충당금 (소유자 부담)",
      description: "장기수선계획에 따른 주요 시설 교체·보수 · 사용검사일 1년 경과한 날이 속하는 달부터 적립",
      conceptIds: ["LAW_03_LONG_TERM_RESERVE", "LAW_03_LONG_TERM_PLAN"],
    },
    rightSide: {
      label: "수선유지비 (입주자등·거주자 부담)",
      description: "장기수선계획 제외 항목의 소모성 보수·냉난방 청소 등 경미한 수선",
      conceptIds: ["LAW_03_REPAIR_MAINT", "PRA_04_BUDGET_SETTLE"],
    },
    examTip:
      "세입자(사용자)가 대신 납부한 장충금은 퇴거 시 소유자에게 반환 청구! 수선유지비와 장충금을 임의 혼용 집행하면 과태료 대상입니다.",
  },
  {
    id: "AXIS_2ND_DEFECT_PERIOD",
    examStage: "2차",
    subjectTag: "관계법규",
    title: "하자담보책임 대조: 전유(인도일) vs 공용(사용검사일) · 2/3/5/10년",
    subtitle: "기산일 바꿔치기 + 마감(2)·설비(3)·방수/철콘(5)·내력구조부(10) 연수 섞기가 매년 출제!",
    triggerTerms: ["인도일", "사용검사일", "임시사용승인일", "전유부분", "공용부분", "내력구조부"],
    contextKeywords: ["하자", "하자담보책임", "하자보수", "보증금", "사용검사", "기산일"],
    leftSide: {
      label: "전유부분 (인도일 기산) · 시설공사별 2/3/5년",
      description: "마감 2년 / 설비·조경 3년 / 방수·철근콘크리트·지붕 5년",
      conceptIds: ["LAW_02B_DEFECT_WARRANTY", "LAW_01A_USE_INSPECTION"],
    },
    rightSide: {
      label: "공용부분 (사용검사일 기산) · 내력구조부 10년 & 보증금 3%",
      description: "기둥·내력벽·보·바닥슬래브·지붕틀·주계단 10년 / 총공사비 3% 예치(2·3·5·10년 분할 반환)",
      conceptIds: ["LAW_02B_DEFECT_WARRANTY", "LAW_02B_DEFECT_DEPOSIT"],
    },
    examTip:
      "하자보수보증금 순차 반환 비율: 2년(15%) → 3년(40%) → 5년(25%) → 10년(20%)! '이일오·삼사공·오이오·십이공'으로 암기!",
  },
  {
    id: "AXIS_2ND_BIDDING",
    examStage: "2차",
    subjectTag: "관리실무",
    title: "사업자 선정 대조: 경쟁입찰(일반·제한·지명) vs 수의계약",
    subtitle: "300만 원 이하 수의계약 기준과, 제한경쟁(3인 이상) vs 지명경쟁(5인 지명·2인 입찰) 성립 요건!",
    triggerTerms: ["수의계약", "경쟁입찰", "일반경쟁", "제한경쟁", "지명경쟁", "300만 원"],
    contextKeywords: ["입찰", "수의계약", "선정지침", "주택관리업자", "사업자", "유찰", "낙찰"],
    leftSide: {
      label: "경쟁입찰 (원칙 · 전자입찰)",
      description: "일반경쟁(2인↑) / 제한경쟁(3인↑ 유효) / 지명경쟁(5인↑ 지명·2인↑ 입찰)",
      conceptIds: ["PRA_04_BIDDING_GUIDE", "PRA_01A_MANAGE_METHOD"],
    },
    rightSide: {
      label: "수의계약 (예외 · 300만 원 이하)",
      description: "부가가치세 제외 300만 원 이하 공사·용역 / 2회 유찰 시 / 공산품 등 예외 사유",
      conceptIds: ["PRA_04_BIDDING_GUIDE", "PRA_04_BUDGET_SETTLE"],
    },
    examTip:
      "300만 원 기준은 '부가가치세 제외(별도)' 금액입니다! 제한경쟁 3인, 지명경쟁 5인 지명·2인 입찰 숫자를 바꿔치기하는 함정에 주의하세요.",
  },
  {
    id: "AXIS_2ND_INSPECT_CYCLE",
    examStage: "2차",
    subjectTag: "2차 통합",
    title: "2차 법정 점검·검토 주기 대조: 월1회 · 반기1회 · 연1회 · 3년",
    subtitle: "승강기·저수조·소방·시설물안전·외부회계감사·장기수선계획 검토 주기를 한눈에 비교!",
    triggerTerms: ["월 1회", "반기 1회", "연 1회", "3년마다", "자체점검", "정기검사", "정밀안전검사"],
    contextKeywords: ["점검", "검사", "청소", "수질검사", "승강기", "저수조", "소방", "장기수선계획", "회계감사"],
    leftSide: {
      label: "단기 주기 (월 1회 · 반기 1회)",
      description: "승강기 자체점검(월1회) · 저수조 청소(반기1회) · 시설물 정기안전점검(반기1회) · 소방 작동점검",
      conceptIds: ["LAW_08_ELEVATOR_INSPECT", "PRA_05B_WATER_TANK", "LAW_10_FACIL_SAFETY", "LAW_07_FIRE_INSPECT"],
    },
    rightSide: {
      label: "중·장기 주기 (연 1회 · 3년마다)",
      description: "저수조 수질검사(연1회) · 외부회계감사(매년 10월31일) · 승강기 정기검사(1년) · 장기수선계획 검토(3년) · 승강기 정밀(15년→3년)",
      conceptIds: ["LAW_03_EXT_AUDIT", "LAW_03_LONG_TERM_PLAN", "LAW_08_ELEVATOR_INSPECT", "PRA_05B_WATER_TANK"],
    },
    examTip:
      "저수조 '청소=반기 1회(6개월)', '수질검사=연 1회'! 둘을 바꿔 내는 문제가 거의 매년 출제됩니다.",
  },
  {
    id: "AXIS_2ND_SPRINKLER",
    examStage: "2차",
    subjectTag: "관리실무",
    title: "스프링클러 설비 대조: 습식 vs 준비작동식 vs 건식",
    subtitle: "지하주차장 동파 방지에 쓰는 '준비작동식'과 일반 실내 '습식'의 배관 충전물·작동 원리 대조!",
    triggerTerms: ["습식", "준비작동식", "건식", "일제살수식", "폐쇄형 헤드", "개방형 헤드"],
    contextKeywords: ["스프링클러", "소화설비", "감지기", "동파", "알람밸브", "프리액션", "배관"],
    leftSide: {
      label: "습식 스프링클러 (가압수 상시 충전)",
      description: "폐쇄형 헤드 · 알람밸브(유수검지장치) · 작동 빠르나 동결 우려 구역 부적합",
      conceptIds: ["PRA_05E_FIRE_EXTINGUISH", "LAW_07_FIRE_INSPECT"],
    },
    rightSide: {
      label: "준비작동식 · 건식 (2차측 대기압/압축공기 · 동파방지)",
      description: "준비작동식: 교차회로 감지기 작동 시 2차측 가압수 진입(지하주차장) / 건식: 압축공기 유지",
      conceptIds: ["PRA_05E_FIRE_EXTINGUISH", "LAW_07_FIRE_INSPECT"],
    },
    examTip:
      "아파트 지하주차장은 동파 방지 + 오작동 수손 방지를 위해 반드시 '준비작동식(폐쇄형 헤드 + 교차회로 감지기)'을 적용합니다!",
  },
  {
    id: "AXIS_2ND_SUBSIDIARY_WELFARE",
    examStage: "2차",
    subjectTag: "관계법규",
    title: "시설 유형 대조: 부대시설 vs 복리시설 vs 간선시설",
    subtitle: "주차장·관리사무소는 부대시설, 경로당·놀이터·유치원은 복리시설 — 주택법 제2조 단골!",
    triggerTerms: ["부대시설", "복리시설", "간선시설"],
    contextKeywords: ["주택법", "주택단지", "주차장", "관리사무소", "경로당", "어린이놀이터", "생활복리"],
    leftSide: {
      label: "부대시설 (주택에 딸린 시설)",
      description: "주차장 · 관리사무소 · 담장 · 주택단지 안의 도로 · 건축설비 · 보안등 · 안내표지판",
      conceptIds: ["LAW_01A_FACILITY_TYPES", "LAW_01A_HOUSING_TYPE"],
    },
    rightSide: {
      label: "복리시설 (생활복리) · 간선시설 (단지 외 연결)",
      description: "복리: 경로당·놀이터·근린생활·유치원·주민운동시설 / 간선: 단지 안팎 기간시설 연결",
      conceptIds: ["LAW_01A_FACILITY_TYPES", "PRA_01B_ACT_PERMIT"],
    },
    examTip:
      "암기 공식: '관리사무소·주차장·담장=부대시설' / '놀이터·경로당·유치원·근생·운동=복리시설'! '생활복리'가 보이면 복리시설!",
  },
  {
    id: "AXIS_2ND_HOUSING_ASSOC",
    examStage: "2차",
    subjectTag: "관계법규",
    title: "주택조합 대조: 지역·직장주택조합(인가/신고) vs 리모델링주택조합",
    subtitle: "토지사용권원 80%+소유권 15% 요건과, 국민주택 직장조합의 '신고' 예외가 단골!",
    triggerTerms: ["지역주택조합", "직장주택조합", "리모델링주택조합", "수직증축"],
    contextKeywords: ["주택조합", "리모델링", "설립인가", "토지사용권원", "조합원", "증축"],
    leftSide: {
      label: "지역 · 직장주택조합 (80% 사용권원 + 15% 소유권)",
      description: "조합원 20명 이상 / 단, 국민주택 공급받는 직장주택조합은 인가가 아니라 '신고'",
      conceptIds: ["LAW_01A_HOUSING_ASSOC", "LAW_01A_BIZ_APPROVAL"],
    },
    rightSide: {
      label: "리모델링주택조합 (대수선 10년 · 증축 15년)",
      description: "수직증축 15층↑ 3개층(14층↓ 2개층) · 세대수 15%↑ · 전체 75% + 각 동 50% 동의",
      conceptIds: ["LAW_01B_REMODEL_PERMIT", "LAW_05_URBAN_REDEV"],
    },
    examTip:
      "국민주택 직장주택조합 = '신고' (인가 아님!), 리모델링 수직증축 = 15층 이상 3개층 / 14층 이하 2개층!",
  },
  {
    id: "AXIS_2ND_BLDG_PERMIT",
    examStage: "2차",
    subjectTag: "관계법규",
    title: "건축법 대조: 건축허가(2년) vs 건축신고(1년) · 대지/조경(200㎡)",
    subtitle: "주택법 사업계획승인(5년)과 건축법 허가(2년)·신고(1년) 착공기한을 반드시 구분!",
    triggerTerms: ["건축허가", "건축신고", "공개공지", "대지에 조경", "접도"],
    contextKeywords: ["건축법", "건축물", "대지", "조경", "도로", "착공", "바닥면적"],
    leftSide: {
      label: "건축허가 (2년 내 착공) · 건축신고 (1년 내 착공)",
      description: "신고: 바닥면적 합계 85㎡ 이내 증·개·재축 / 21층↑ 또는 10만㎡↑는 특·광역시장 허가",
      conceptIds: ["LAW_06_BLDG_PERMIT", "LAW_06_BLDG_REMODEL"],
    },
    rightSide: {
      label: "대지·조경·도로·면적 (200㎡ 조경 · 2m 접도)",
      description: "공개공지 10% 이하 → 용적률·높이 1.2배 완화 / 용적률 연면적에서 지하층·지상주차 제외",
      conceptIds: ["LAW_06_BLDG_SITE", "LAW_06_BLDG_AREA", "LAW_06_BLDG_USE_DOOR"],
    },
    examTip:
      "착공기한 3단 비교: 건축신고 1년 < 건축허가 2년(공장 3년) < 주택법 사업계획승인 5년!",
  },
  {
    id: "AXIS_2ND_FIRE_GRADE",
    examStage: "2차",
    subjectTag: "2차 통합",
    title: "소방 등급 · 소화전 대조: 특급(50층/200m) vs 1급(30층/120m) & 옥내 vs 옥외",
    subtitle: "아파트 소방안전관리대상물 층수/높이 기준과 옥내(25m·130L) vs 옥외(40m·350L) 수치 대조!",
    triggerTerms: ["특급", "1급", "옥내소화전", "옥외소화전", "소방안전관리대상물"],
    contextKeywords: ["소방", "소화전", "아파트", "층", "미터", "방수압력", "방수량", "수평거리"],
    leftSide: {
      label: "소방 등급 (특급 50층/200m · 1급 30층/120m)",
      description: "분말소화기 내용연수 10년(3년 연장) / 소방훈련 연 1회 / 40층·135m 아파트 = 1급!",
      conceptIds: ["LAW_07_FIRE_GRADE", "LAW_07_FIRE_INSPECT", "PRA_05E_FIRE_ESCAPE"],
    },
    rightSide: {
      label: "옥내소화전 (25m·0.17MPa·130L) vs 옥외소화전 (40m·0.25MPa·350L)",
      description: "저수량: 옥내 N×2.6㎥ vs 옥외 N×7㎥ (최대 2개 기준, 20분 방사)",
      conceptIds: ["PRA_05E_FIRE_HYDRANT", "PRA_05E_FIRE_EXTINGUISH"],
    },
    examTip:
      "아파트 등급 함정: 40층 135m 아파트는 50층/200m 미만이므로 특급이 아니라 '1급' 소방안전관리대상물입니다!",
  },
  {
    id: "AXIS_2ND_FLOOR_NOISE",
    examStage: "2차",
    subjectTag: "관리실무",
    title: "층간소음 기준 대조: 직접충격음(39/34dB) vs 공기전달음(45/40dB)",
    subtitle: "강화된 직접충격 소음 주간 39·야간 34dB 수치와 급배수 소음 제외 규칙!",
    triggerTerms: ["직접충격", "공기전달", "주간", "야간", "층간소음"],
    contextKeywords: ["층간소음", "소음", "데시벨", "dB", "등가소음도", "최고소음도"],
    leftSide: {
      label: "직접충격 소음 (뛰거나 걷는 소리 · 1분 Leq)",
      description: "주간(06~22시) 39dB / 야간(22~06시) 34dB · 최고소음도 Lmax 57dB / 52dB",
      conceptIds: ["PRA_02_FLOOR_NOISE"],
    },
    rightSide: {
      label: "공기전달 소음 (TV·악기 · 5분 Leq) & 제외 대상",
      description: "주간 45dB / 야간 40dB · 욕실/화장실/다용도실 급배수 소음은 층간소음 제외!",
      conceptIds: ["PRA_02_FLOOR_NOISE", "LAW_02A_DISPUTE_COMM"],
    },
    examTip:
      "직접충격(39/34 · 최고 57/52) vs 공기전달(45/40) 모두 주·야간 차이는 정확히 '5dB'입니다!",
  },
  {
    id: "AXIS_2ND_MANAGER_BOND",
    examStage: "2차",
    subjectTag: "관계법규",
    title: "관리사무소장 보증 · 자격 대조: 500세대↑(5천만·관리사) vs 500세대↓(3천만·사보)",
    subtitle: "배치 자격, 손해배상책임 보증금, 실무경력(3년 vs 5년), 자격취소 vs 자격정지 비교!",
    triggerTerms: ["손해배상책임", "보증보험", "실무경력", "자격취소", "자격정지"],
    contextKeywords: ["관리사무소장", "주택관리사", "보증", "공탁", "배치", "경력"],
    leftSide: {
      label: "500세대 이상 (주택관리사 · 보증 5천만 원)",
      description: "소장 경력 3년↑ 또는 관리직원(경비·청소·소독 제외) 5년↑ / 재가입 15일 이내",
      conceptIds: ["LAW_02C_MANAGER_BOND", "LAW_02C_LICENSE_ADMIN"],
    },
    rightSide: {
      label: "500세대 미만 (관리사보 가능 · 보증 3천만 원)",
      description: "퇴직·사망 후 공탁금 3년 회수 제한 / 명의대여·부정취득은 필요적 자격취소",
      conceptIds: ["LAW_02C_MANAGER_BOND", "LAW_02A_MANDATORY_APT"],
    },
    examTip:
      "보증금액 '500↑ 5천만 / 500↓ 3천만', 보증금 지급 후 재가입 '15일 이내', 경비·청소·소독원 경력은 5년 실무경력 제외!",
  },
  {
    id: "AXIS_2ND_LNG_LPG",
    examStage: "2차",
    subjectTag: "관리실무",
    title: "가스설비 대조: LNG(도시가스·천장) vs LPG(프로판·바닥)",
    subtitle: "공기 대비 비중 차이로 인해 누설경보기 설치 위치가 천장 vs 바닥으로 정반대!",
    triggerTerms: ["LNG", "LPG", "천연가스", "액화석유가스"],
    contextKeywords: ["가스", "LNG", "LPG", "경보기", "비중", "도시가스", "누설"],
    leftSide: {
      label: "LNG (공기보다 가벼움 · 비중 0.6 · 천장 설치)",
      description: "주성분 메탄(CH4) · 발열량 LPG보다 낮음 · 경보기 천장면 30cm 이내 설치",
      conceptIds: ["PRA_05D_GAS_BOILER", "PRA_05D_HEATING_SYS"],
    },
    rightSide: {
      label: "LPG (공기보다 무거움 · 비중 1.5~2.0 · 바닥 설치)",
      description: "주성분 프로판·부탄 · 발열량 LNG보다 높음 · 경보기 바닥면 30cm 이내 설치",
      conceptIds: ["PRA_05D_GAS_BOILER"],
    },
    examTip:
      "암기 공식: 'L(N)G = 날아간다(가벼움·천장)' vs 'L(P)G = 바닥에 퍼진다(무거움·바닥)'!",
  },
  {
    id: "AXIS_PIPE_DIAMETER",
    examStage: "1차",
    subjectTag: "시설개론",
    title: "배관 관경 대조: 동일한 관경 vs 다른 관경(이경)",
    subtitle: "문제에 '동일한'이 나오면 반대편 '이경(부·이·리)'이 단골 오답!",
    triggerTerms: ["동일한", "같은 관경", "동경", "다른 관경", "서로 다른", "이경"],
    contextKeywords: ["배관", "관경", "이음", "부속품", "유니언", "소켓", "부싱", "니플", "플랜지", "리듀서"],
    leftSide: {
      label: "관경이 동일한 직선 이음 (유·소·플·니)",
      description: "같은 굵기의 배관 두 개를 일직선으로 연결",
      conceptIds: ["FAC_PIPE_UNION", "FAC_PIPE_SOCKET", "FAC_PIPE_FLANGE", "FAC_PIPE_NIPPLE"],
    },
    rightSide: {
      label: "관경이 다른 이경 직선 이음 (부·이·리)",
      description: "굵기가 다른 배관 두 개를 축소·확대 연결",
      conceptIds: ["FAC_PIPE_BUSHING", "FAC_PIPE_REDUCING_NIPPLE", "FAC_PIPE_REDUCER"],
    },
    examTip:
      "암기 공식: 동경 직선 = '유·소·플·니' / 이경(다름) = '부·이·리'! 하나라도 반대 그룹이 섞이면 바로 정답입니다.",
  },
  {
    id: "AXIS_PIPE_DIRECTION",
    examStage: "1차",
    subjectTag: "시설개론",
    title: "배관 연결 형태 대조: 직선 이음 vs 방향 전환·분기·끝막음",
    subtitle: "직선 연결인지, 꺾거나(엘보·벤드) 갈라지는지(티·Y·크로스) 구분",
    triggerTerms: ["직선으로", "직선 이음", "방향 전환", "분기", "끝을 막"],
    contextKeywords: ["배관", "관경", "이음", "부속품", "엘보", "벤드", "티", "캡", "플러그"],
    leftSide: {
      label: "직선 이음 (동경·이경)",
      description: "배관을 일직선 방향으로 이어 붙임",
      conceptIds: [
        "FAC_PIPE_UNION",
        "FAC_PIPE_SOCKET",
        "FAC_PIPE_FLANGE",
        "FAC_PIPE_BUSHING",
        "FAC_PIPE_REDUCER",
      ],
    },
    rightSide: {
      label: "방향 전환 · 분기 · 관말 폐쇄",
      description: "꺾기(엘보·벤드), 분기(티·크로스), 끝막음(캡·플러그)",
      conceptIds: ["FAC_PIPE_ELBOW_TEE", "FAC_PIPE_CAP_PLUG"],
    },
    examTip:
      "직선 이음 문제에 엘보·벤드·티·캡·플러그가 보이면 즉시 소거! 캡(암나사) vs 플러그(수나사) 구분도 빈출입니다.",
  },
];

/** 주택관리사 2차 MVP 중심 실전 기출 꼬리물기 체험 문항 5선 */
export const DEMO_GRAPH_QUESTIONS: DemoGraphQuestion[] = [
  {
    id: "demo-2nd-law-mandatory-500",
    shortTabLabel: "Q1. 2차 법규 · 의무관리·500세대",
    examStage: "2차",
    examLabel: "2차 관계법규 · 최근 7년 68회 최다빈출",
    subject: "주택관리관계법규",
    questionText:
      "공동주택관리법령상 의무관리대상 공동주택 및 500세대 이상 입주자대표회의에 관한 설명으로 옳지 않은 것은?",
    options: [
      {
        number: 1,
        text: "300세대 이상의 공동주택 또는 150세대 이상으로서 승강기가 설치된 공동주택은 의무관리대상 공동주택에 해당한다.",
      },
      {
        number: 2,
        text: "500세대 이상 공동주택의 입주자대표회의 회장과 감사는 전체 입주자등의 직선으로 선출한다.",
      },
      {
        number: 3,
        text: "500세대 이상 공동주택의 선거관리위원회는 5명 이상 9명 이하의 위원으로 구성한다.",
      },
      {
        number: 4,
        text: "입주자대표회의는 출석 구성원 과반수의 찬성으로 의결한다.",
      },
      {
        number: 5,
        text: "동별 대표자의 임기는 2년으로 하며 한 번만 중임할 수 있다.",
      },
    ],
    correctOption: 4,
    explanation:
      "입주자대표회의는 '출석 구성원 과반수'가 아니라 '입주자대표회의 구성원 과반수'의 찬성으로 의결합니다! 문장 속 '500세대 이상', '입주자대표회의', '의무관리대상', '선거관리위원회'를 눌러 꼬리물기로 정복해 보세요.",
  },
  {
    id: "demo-2nd-law-repair-defect",
    shortTabLabel: "Q2. 2차 법규 · 장충금·하자담보",
    examStage: "2차",
    examLabel: "2차 관계법규 · 비용·하자 초빈출",
    subject: "주택관리관계법규",
    questionText:
      "공동주택관리법령상 장기수선충당금, 수선유지비 및 하자담보책임에 관한 설명으로 옳지 않은 것은?",
    options: [
      {
        number: 1,
        text: "장기수선충당금은 해당 주택의 소유자로부터 징수하여 적립한다.",
      },
      {
        number: 2,
        text: "사용자가 소유자를 대신하여 납부한 장기수선충당금은 퇴거 시 소유자에게 반환을 청구할 수 있다.",
      },
      {
        number: 3,
        text: "장기수선계획은 3년마다 검토하고 필요한 경우 이를 조정하여야 한다.",
      },
      {
        number: 4,
        text: "수선유지비는 장기수선계획에 포함된 주요 시설 교체 공사에 우선하여 혼용 집행할 수 있다.",
      },
      {
        number: 5,
        text: "전유부분의 하자담보책임기간은 인도일부터, 공용부분은 사용검사일부터 기산한다.",
      },
    ],
    correctOption: 4,
    explanation:
      "장기수선계획에 포함된 주요 시설 교체·보수는 반드시 소유자 부담인 장기수선충당금으로 집행해야 하며, 입주자등 부담인 수선유지비와 혼용 집행 시 과태료 대상입니다!",
  },
  {
    id: "demo-2nd-pra-manage-permit",
    shortTabLabel: "Q3. 2차 실무 · 자치·위탁·행위허가",
    examStage: "2차",
    examLabel: "2차 관리실무 · 관리방식·행위통제 대조",
    subject: "공동주택관리실무",
    questionText:
      "공동주택의 자치관리·위탁관리 및 행위허가·행위신고에 관한 설명으로 옳지 않은 것은?",
    options: [
      {
        number: 1,
        text: "입주자등이 자치관리를 정한 경우 입주자대표회의는 6개월 이내에 자치관리기구를 구성하여야 한다.",
      },
      {
        number: 2,
        text: "위탁관리로 결정한 경우 주택관리업자는 경쟁입찰 방식으로 선정하는 것이 원칙이다.",
      },
      {
        number: 3,
        text: "부가가치세를 제외한 금액이 300만 원 이하인 공사·용역은 수의계약으로 사업자를 선정할 수 있다.",
      },
      {
        number: 4,
        text: "입주자등이 비내력벽을 철거하려는 경우에는 시장·군수·구청장의 행위허가를 받아야 한다.",
      },
      {
        number: 5,
        text: "관리규약의 제정·개정은 전체 입주자등의 과반수 찬성으로 결정한다.",
      },
    ],
    correctOption: 4,
    explanation:
      "비내력벽 철거는 행위허가가 아니라 '행위신고' 대상입니다! 문장 속 '자치관리', '위탁관리', '300만 원', '수의계약', '행위허가'를 눌러 좌우 대조표를 바로 확인해 보세요.",
  },
  {
    id: "demo-2nd-pra-inspect-cycle",
    shortTabLabel: "Q4. 2차 실무 · 점검주기·스프링클러",
    examStage: "2차",
    examLabel: "2차 관리실무 · 법정 점검주기 총정리",
    subject: "공동주택관리실무",
    questionText:
      "공동주택의 법정 안전점검·위생관리 및 소방설비에 관한 설명으로 옳지 않은 것은?",
    options: [
      {
        number: 1,
        text: "승강기 관리주체는 월 1회 이상 자체점검을 실시하고 그 결과를 국가승강기정보센터에 입력하여야 한다.",
      },
      {
        number: 2,
        text: "저수조는 반기 1회 이상 청소하고, 연 1회 이상 수질검사를 실시하여야 한다.",
      },
      {
        number: 3,
        text: "시설물안전법상 제2종 시설물에 해당하는 공동주택은 반기 1회 이상 정기안전점검을 실시한다.",
      },
      {
        number: 4,
        text: "아파트 지하주차장에는 동파 방지를 위해 가압수가 2차측 배관까지 상시 충전된 습식 스프링클러를 주로 설치한다.",
      },
      {
        number: 5,
        text: "300세대 이상 공동주택은 매년 10월 31일까지 외부회계감사를 받아야 한다.",
      },
    ],
    correctOption: 4,
    explanation:
      "지하주차장은 동파 우려가 있으므로 2차측에 대기압 공기가 차 있고 감지기 작동 시 물이 유입되는 '준비작동식 스프링클러'를 설치합니다! '습식'과 '반기 1회'를 눌러 주기 대조표를 확인해 보세요.",
  },
  {
    id: "demo-pipe-same-diameter",
    shortTabLabel: "Q5. 1차 시설 · 배관 동경·이경",
    examStage: "1차",
    examLabel: "1차 시설개론 · 배관 이음 꼬리물기 PoC",
    subject: "공동주택시설개론",
    questionText:
      "관경이 동일한 배관을 직선으로 이음하는 데 사용하는 배관의 부속품이 아닌 것은?",
    options: [
      { number: 1, text: "유니언 (Union)" },
      { number: 2, text: "소켓 (Socket)" },
      { number: 3, text: "플랜지 (Flange)" },
      { number: 4, text: "니플 (Nipple)" },
      { number: 5, text: "부싱 (Bushing)" },
    ],
    correctOption: 5,
    explanation:
      "유니언·소켓·플랜지·니플(유·소·플·니)은 관경이 동일한 배관의 직선 이음용이며, 부싱은 관경이 서로 다른(이경) 배관을 연결하는 부속품입니다!",
  },
];

const CONCEPT_BY_ID = new Map<string, KnowledgeConceptNode>(
  KNOWLEDGE_CONCEPT_NODES.map((n) => [n.id, n])
);

const AXIS_BY_ID = new Map<string, KnowledgeContrastAxis>(
  KNOWLEDGE_CONTRAST_AXES.map((a) => [a.id, a])
);

export function getConceptById(id: string): KnowledgeConceptNode | null {
  return CONCEPT_BY_ID.get(id) ?? null;
}

export function getContrastAxisById(id: string): KnowledgeContrastAxis | null {
  return AXIS_BY_ID.get(id) ?? null;
}

export interface DetectedTextToken {
  text: string;
  kind: "plain" | "concept" | "contrast";
  conceptId?: string;
  axisId?: string;
}

/**
 * 문항/선지 텍스트에서 기출 지식 그래프 개념어 & 문맥 적합 대조어를 정밀 토큰화
 * - 긴 별칭 우선 매칭 (예: "이경니플" > "니플", "500세대 이상" > "500세대")
 * - 1글자 별칭("티", "캡")은 배관 문맥에서만 활성화하여 오매칭 차단
 * - 대조어("동일한", "소유자", "500세대" 등)는 contextKeywords가 문맥에 있을 때만 발동!
 */
export function tokenizeTextWithKnowledgeGraph(
  text: string,
  contextText?: string
): DetectedTextToken[] {
  if (!text) return [];
  const fullContext = `${contextText || ""} ${text}`;
  const hasPipeContext = fullContext.includes("배관") || fullContext.includes("부속품");

  interface MatchCandidate {
    term: string;
    kind: "concept" | "contrast";
    conceptId?: string;
    axisId?: string;
  }

  const candidates: MatchCandidate[] = [];

  for (const node of KNOWLEDGE_CONCEPT_NODES) {
    for (const alias of node.aliases) {
      if (alias.length >= 2) {
        candidates.push({ term: alias, kind: "concept", conceptId: node.id });
      } else if (alias.length === 1 && hasPipeContext) {
        candidates.push({ term: alias, kind: "concept", conceptId: node.id });
      }
    }
  }

  for (const axis of KNOWLEDGE_CONTRAST_AXES) {
    const contextMatched = axis.contextKeywords.some((kw) => fullContext.includes(kw));
    if (!contextMatched) continue;
    for (const trigger of axis.triggerTerms) {
      candidates.push({ term: trigger, kind: "contrast", axisId: axis.id });
    }
  }

  // 긴 단어 우선 정렬 (긴 복합어/대조어 우선 매칭)
  candidates.sort((a, b) => b.term.length - a.term.length);

  // 중복 term 제거 (대조어가 같은 길이의 개념어보다 문맥상 대조 축으로 우선될 수 있도록 관리)
  const uniqueMap = new Map<string, MatchCandidate>();
  for (const c of candidates) {
    if (!uniqueMap.has(c.term)) {
      uniqueMap.set(c.term, c);
    }
  }
  const uniqueCandidates = Array.from(uniqueMap.values());
  if (uniqueCandidates.length === 0) {
    return [{ text, kind: "plain" }];
  }

  const escaped = uniqueCandidates.map((c) =>
    c.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${escaped.join("|")})`, "g");

  const tokens: DetectedTextToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, match.index), kind: "plain" });
    }
    const hitText = match[0];
    const meta = uniqueMap.get(hitText);
    if (meta) {
      tokens.push({
        text: hitText,
        kind: meta.kind,
        conceptId: meta.conceptId,
        axisId: meta.axisId,
      });
    } else {
      tokens.push({ text: hitText, kind: "plain" });
    }
    lastIndex = match.index + hitText.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), kind: "plain" });
  }

  return tokens;
}
