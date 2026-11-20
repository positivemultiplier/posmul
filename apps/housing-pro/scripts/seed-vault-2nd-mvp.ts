/**
 * Housing-Pro 2차 MVP Obsidian Vault 시드 생성기
 * - 41개 핵심 개념 노드(2차 관계법규 18 + 2차 관리실무 14 + 1차 배관 PoC 9)를
 *   체계적인 폴더 격리 구조(01-stage1 / 02-stage2)의 Obsidian 호환 .md 파일로 생성합니다.
 */
import fs from "node:fs";
import path from "node:path";

interface VaultSeedSpec {
  folder: string; // relative to content/vault/housing
  id: string;
  title: string;
  englishTitle?: string;
  aliases: string[];
  examStage: "1차" | "2차";
  subject: string;
  chapterCode: string;
  category: string;
  tags: string[];
  contrastAxisId?: string;
  contrastSide?: string;
  sameGroupIds: string[];
  contrastIds: string[];
  dbSearchKeyword: string;
  lawRef?: string;
  summaryBullets: string[];
  trapWarning: string;
  proFieldTip?: string;
}

const VAULT_SEEDS: VaultSeedSpec[] = [
  // =========================================================================
  // [2차 · 주택관리관계법규] 18개 핵심 빈출 개념
  // =========================================================================
  {
    folder: "02-stage2/04-law/LAW_01_HOUSING",
    id: "LAW_01A_HOUSING_TYPE",
    title: "도시형 생활주택 · 세대구분형 공동주택",
    aliases: ["도시형 생활주택", "도시형생활주택", "세대구분형 공동주택", "세대구분형"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_01A_HOUSING_BUILD",
    category: "주택법 · 주택의 종류",
    tags: ["housing/2차/관계법규/LAW_01A", "주택법"],
    sameGroupIds: ["LAW_01A_USE_INSPECTION", "LAW_01B_RESALE_LIMIT"],
    contrastIds: ["LAW_02A_MANDATORY_APT"],
    dbSearchKeyword: "도시형 생활주택",
    lawRef: "주택법 제2조",
    summaryBullets: [
      "도시형 생활주택: 300세대 미만의 국민주택규모(85㎡ 이하)로 도시지역에 건설 (단지형 연립·단지형 다세대·소형주택)",
      "세대구분형 공동주택: 기존 1세대 공간 일부를 구분해 임대 가능하되, 구분소유(매매 분리)는 불가",
      "세대구분형 설치 기준: 전체 세대수의 1/3 이하(기존 주택 변경 시 1/10, 동별 1/3 이하)",
    ],
    trapWarning:
      "도시형 생활주택은 '300세대 미만'이며 '준주택'(오피스텔·기숙사·노인복지주택·다중생활시설)과 혼동하는 함정이 단골 출제됩니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_01_HOUSING",
    id: "LAW_01A_USE_INSPECTION",
    title: "사용검사 · 임시사용승인",
    aliases: ["사용검사", "임시사용승인", "동별 사용검사"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_01A_HOUSING_BUILD",
    category: "주택법 · 건설 및 준공",
    tags: ["housing/2차/관계법규/LAW_01A", "주택법", "pro-field"],
    contrastAxisId: "AXIS_2ND_DEFECT_PERIOD",
    contrastSide: "공용부분 하자 기산일",
    sameGroupIds: ["LAW_01A_HOUSING_TYPE", "LAW_02B_DEFECT_WARRANTY"],
    contrastIds: ["LAW_06_BLDG_REMODEL"],
    dbSearchKeyword: "사용검사",
    lawRef: "주택법 제49조",
    summaryBullets: [
      "사업계획승인을 받아 건설한 주택의 공사를 완료한 경우 시장·군수·구청장의 사용검사를 받아야 함 (신청일부터 15일 이내)",
      "사업주체가 파산 등으로 사용검사를 받지 못하면 시공보증자 또는 입주예정자 대표회의가 신청 가능",
      "공용부분 하자담보책임기간의 법정 기산일 = 사용검사일(임시사용승인일 포함)",
    ],
    trapWarning:
      "사용검사 처리기한은 '15일 이내'이며, 공용부분 하자 기산일은 '인도일'이 아니라 '사용검사일'입니다.",
    proFieldTip:
      "신축 단지 최초 부임 시 사용검사필증 날짜를 소장Pro 법정 스케줄러에 등록해야 2·3·5·10년차 하자 만료를 방어할 수 있습니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_01_HOUSING",
    id: "LAW_01B_RESALE_LIMIT",
    title: "분양가상한제 · 투기과열지구 · 전매제한",
    aliases: ["분양가상한제", "투기과열지구", "전매행위 제한", "전매제한", "조정대상지역"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_01B_HOUSING_SUP",
    category: "주택법 · 주택공급 규제",
    tags: ["housing/2차/관계법규/LAW_01B", "주택법"],
    sameGroupIds: ["LAW_01A_HOUSING_TYPE", "LAW_04_PRIVATE_RENT"],
    contrastIds: [],
    dbSearchKeyword: "전매",
    lawRef: "주택법 제57조 · 제63조 · 제64조",
    summaryBullets: [
      "분양가상한제 적용주택(공공택지 등): 택지비 + 건축비 이하로 분양가 제한, 지자체 분양가심사위원회 심의",
      "투기과열지구·조정대상지역 지정권자: 국토교통부장관 또는 시·도지사 (반기마다 유지 여부 재검토)",
      "전매제한 예외 사유: 세대원 근무·생업·질병치료·취학·결혼으로 수도권 외 이전, 상속, 해외 이주·2년 이상 체류, 이혼 등 (LH 동의)",
    ],
    trapWarning:
      "투기과열지구 지정권자에 '시장·군수·구청장'이 포함된다는 지문은 오답! 국토부장관 또는 시·도지사만 가능합니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_02_APT_ORG",
    id: "LAW_02A_MANDATORY_APT",
    title: "의무관리대상 공동주택",
    aliases: ["의무관리대상", "의무관리대상 공동주택"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_02A_APT_ORG",
    category: "공동주택관리법 · 적용범위",
    tags: ["housing/2차/관계법규/LAW_02A", "공동주택관리법", "pro-field"],
    contrastAxisId: "AXIS_2ND_500_THRESHOLD",
    contrastSide: "300세대/150세대 기준",
    sameGroupIds: ["LAW_02A_REP_COUNCIL", "LAW_03_LONG_TERM_PLAN", "PRA_01A_MANAGE_METHOD"],
    contrastIds: ["LAW_01A_HOUSING_TYPE", "LAW_13_CONDO_QUORUM"],
    dbSearchKeyword: "의무관리대상",
    lawRef: "공동주택관리법 제2조 제1항 제2호",
    summaryBullets: [
      "① 300세대 이상 공동주택 ② 150세대 이상 + 승강기 설치 ③ 150세대 이상 + 중앙집중식(지역 포함) 난방",
      "④ 건축허가 주상복합으로서 주택이 150세대 이상인 건축물",
      "⑤ 위 ①~④에 해당하지 않아도 전체 입주자등의 2/3 이상 서면동의로 의무관리대상 전환 가능 (제외도 2/3 이상 동의)",
    ],
    trapWarning:
      "150세대 이상 + '개별난방' + 승강기 없음은 의무관리대상이 아닙니다! 또한 전환·제외 동의 정족수는 '과반수'가 아니라 '2/3 이상'!",
    proFieldTip:
      "의무관리대상 전환 시 주택관리사(보) 배치, 입대의 구성, 관리규약 제정, 장기수선계획 등 법정 의무가 일괄 개시됩니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_02_APT_ORG",
    id: "LAW_02A_REP_COUNCIL",
    title: "입주자대표회의 (구성·임기·의결)",
    aliases: ["입주자대표회의", "동별 대표자", "입대의"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_02A_APT_ORG",
    category: "공동주택관리법 · 의결기구",
    tags: ["housing/2차/관계법규/LAW_02A", "공동주택관리법", "contrast/정족수", "pro-field"],
    contrastAxisId: "AXIS_2ND_500_THRESHOLD",
    contrastSide: "500세대 이상·미만 선출 대조",
    sameGroupIds: ["LAW_02A_ELECTION_COMM", "LAW_02A_MANDATORY_APT", "PRA_01B_MANAGE_RULES"],
    contrastIds: ["PRA_01A_MANAGE_METHOD", "LAW_13_CONDO_QUORUM"],
    dbSearchKeyword: "입주자대표회의",
    lawRef: "공동주택관리법 제14조 · 시행령 제12조~14조",
    summaryBullets: [
      "4명 이상의 동별 대표자로 구성 (임원: 회장 1명, 감사 2명 이상, 이사 1명 이상)",
      "동별 대표자 임기: 2년, 한 번만 중임 가능 (최대 4년, 단 보궐임기 6개월 미만 미산입 및 2회 선출공고 미달 시 예외)",
      "500세대 이상: 회장·감사를 전체 입주자등 직선 / 500세대 미만: 원칙적으로 구성원 과반수 찬성 간선 (규약으로 직선 가능)",
    ],
    trapWarning:
      "입대의 의결정족수는 '출석 구성원 과반수'가 아니라 '입주자대표회의 구성원 과반수' 찬성입니다! (500세대 기준 직선/간선 비교 초빈출)",
    proFieldTip:
      "입대의 회의록은 지체 없이 관리주체에게 통보해 공개해야 하며, 동대표 임기 만료 60일 전 선관위 소집을 챙겨야 합니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_02_APT_ORG",
    id: "LAW_02A_ELECTION_COMM",
    title: "선거관리위원회",
    aliases: ["선거관리위원회", "선관위"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_02A_APT_ORG",
    category: "공동주택관리법 · 선거기구",
    tags: ["housing/2차/관계법규/LAW_02A", "공동주택관리법", "pro-field"],
    contrastAxisId: "AXIS_2ND_500_THRESHOLD",
    contrastSide: "500세대 이상 5~9명 vs 미만 3~9명",
    sameGroupIds: ["LAW_02A_REP_COUNCIL", "LAW_02A_MANDATORY_APT"],
    contrastIds: [],
    dbSearchKeyword: "선거관리위원회",
    lawRef: "공동주택관리법 제15조 · 시행령 제15조",
    summaryBullets: [
      "500세대 이상: 위원장 포함 5명 이상 9명 이하 / 500세대 미만: 3명 이상 9명 이하",
      "결격사유: 동별 대표자, 동별 대표자 후보자, 미성년자, 피성년후견인 등 (단, 500세대 미만에서 위촉 곤란 시 예외)",
      "위원장 호선, 의결은 구성원 과반수 찬성으로 결정",
    ],
    trapWarning:
      "동별 대표자나 후보자의 배우자·직계존비속도 선관위원 결격사유에 해당하며, 500세대 기준 최소 인원(5명 vs 3명)을 바꿔 내는 함정이 빈출됩니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_02_APT_ORG",
    id: "LAW_02B_DEFECT_WARRANTY",
    title: "하자담보책임기간 (2·3·5·10년)",
    aliases: ["하자담보책임", "하자담보책임기간", "담보책임기간", "내력구조부"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_02B_APT_REP",
    category: "공동주택관리법 · 하자보수",
    tags: ["housing/2차/관계법규/LAW_02B", "공동주택관리법", "contrast/기간", "pro-field"],
    contrastAxisId: "AXIS_2ND_DEFECT_PERIOD",
    contrastSide: "전유(인도일) vs 공용(사용검사일)",
    sameGroupIds: ["LAW_02B_DEFECT_DEPOSIT", "LAW_01A_USE_INSPECTION"],
    contrastIds: ["LAW_03_LONG_TERM_RESERVE"],
    dbSearchKeyword: "하자담보책임",
    lawRef: "공동주택관리법 제36조 · 시행령 별표 4",
    summaryBullets: [
      "내력구조부별 하자: 10년 (기둥·내력벽·보·바닥슬래브·지붕틀·주계단)",
      "시설공사별 하자: 마감공사 2년 / 설비·조경·옥외급수·창호 3년 / 대지조성·철근콘크리트·지붕·방수 5년",
      "기산일: 전유부분 = 입주자에게 인도한 날 / 공용부분 = 사용검사일(임시사용승인일 포함)",
    ],
    trapWarning:
      "방수공사·지붕공사는 '3년'이 아니라 '5년'! 전유부분과 공용부분의 기산일을 서로 바꿔 내는 문제가 매년 출제됩니다.",
    proFieldTip:
      "연차별 하자 만료 6개월 전 입대의 의결을 거쳐 하자진단 후 내용증명으로 청구해야 사업주체 책임을 보전할 수 있습니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_02_APT_ORG",
    id: "LAW_02B_DEFECT_DEPOSIT",
    title: "하자보수보증금 (예치·순차 반환)",
    aliases: ["하자보수보증금", "하자보증금"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_02B_APT_REP",
    category: "공동주택관리법 · 하자보수",
    tags: ["housing/2차/관계법규/LAW_02B", "공동주택관리법", "pro-field"],
    contrastAxisId: "AXIS_2ND_DEFECT_PERIOD",
    contrastSide: "3% 예치 · 15/40/25/20% 반환",
    sameGroupIds: ["LAW_02B_DEFECT_WARRANTY"],
    contrastIds: ["LAW_03_LONG_TERM_RESERVE"],
    dbSearchKeyword: "하자보수보증금",
    lawRef: "공동주택관리법 제38조 · 시행령 제41조~43조",
    summaryBullets: [
      "예치 금액: 총 사업비에서 대지가격을 뺀 건축비의 3% (국가·지자체·LH·지방공사는 예치 면제)",
      "순차 반환 비율(사용검사일부터): 2년 15% → 3년 40% → 5년 25% → 10년 20% (합계 100%)",
      "입주자대표회의 명의로 금융기관 예치, 사용 후 30일 이내에 사업주체에게 사용명세 통보",
    ],
    trapWarning:
      "순차 반환 비율 '15% → 40% → 25% → 20%'와 예치율 '3%' 숫자를 교묘히 바꾸는 계산·객관식 함정이 단골입니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_03_APT_FIN",
    id: "LAW_03_LONG_TERM_PLAN",
    title: "장기수선계획 (수립·3년 검토·수시조정)",
    aliases: ["장기수선계획", "정기검토", "수시조정"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_03_APT_FIN",
    category: "공동주택관리법 · 장기수선",
    tags: ["housing/2차/관계법규/LAW_03", "공동주택관리법", "contrast/기간", "pro-field"],
    contrastAxisId: "AXIS_2ND_INSPECT_CYCLE",
    contrastSide: "3년마다 정기검토",
    sameGroupIds: ["LAW_03_LONG_TERM_RESERVE", "LAW_02A_MANDATORY_APT"],
    contrastIds: ["LAW_03_REPAIR_MAINT"],
    dbSearchKeyword: "장기수선계획",
    lawRef: "공동주택관리법 제29조",
    summaryBullets: [
      "수립 대상: ① 300세대 이상 ② 승강기 설치 ③ 중앙집중식(지역 포함) 난방 ④ 주상복합 (세대수 무관 승강기 있으면 수립!)",
      "정기검토: 입주자대표회의와 관리주체가 3년마다 검토하고 필요 시 조정 (검토사항 기록·보관 의무)",
      "수시조정: 3년 경과 전이라도 전체 입주자 과반수 서면동의 시 조정 가능",
    ],
    trapWarning:
      "장기수선계획 수립 대상은 '150세대 이상 승강기'가 아니라 세대수와 무관하게 '승강기가 설치된 공동주택'입니다! 수시조정은 '입주자등'이 아니라 '입주자(소유자)' 과반수!",
    proFieldTip:
      "3년 정기검토 기한을 하루라도 넘기거나 계획 없이 장충금을 집행하면 1,000만 원 이하 과태료 처분 대상입니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_03_APT_FIN",
    id: "LAW_03_LONG_TERM_RESERVE",
    title: "장기수선충당금",
    englishTitle: "Long-Term Repair Reserve",
    aliases: ["장기수선충당금", "장충금"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_03_APT_FIN",
    category: "공동주택관리법 · 회계/수선",
    tags: ["housing/2차/관계법규/LAW_03", "공동주택관리법", "pro-field"],
    contrastAxisId: "AXIS_REPAIR_FUND",
    contrastSide: "소유자 부담 · 주요시설 교체",
    sameGroupIds: ["LAW_03_LONG_TERM_PLAN", "LAW_02B_DEFECT_WARRANTY"],
    contrastIds: ["LAW_03_REPAIR_MAINT"],
    dbSearchKeyword: "장기수선충당금",
    lawRef: "공동주택관리법 제30조",
    summaryBullets: [
      "장기수선계획에 따라 주요 시설의 교체·보수에 필요한 비용을 해당 주택의 '소유자'로부터 징수·적립",
      "사용검사일(임시사용승인일)로부터 1년이 경과한 날이 속하는 달부터 매달 적립",
      "임차인(사용자)이 대신 납부한 경우 퇴거 시 소유자가 반드시 반환해야 하며, 관리주체는 납부확인서 발급 의무",
    ],
    trapWarning:
      "'사용자(세입자)' 최종 부담 지문은 무조건 오답! 장기수선계획에 없는 용도(예: 소송비·경미 보수)로 임의 전용 금지.",
    proFieldTip:
      "소장Pro 법정 스케줄러에서 매월 장충금 적립요율 및 별도 예치 계좌 분리를 상시 점검하세요.",
  },
  {
    folder: "02-stage2/04-law/LAW_03_APT_FIN",
    id: "LAW_03_REPAIR_MAINT",
    title: "수선유지비",
    aliases: ["수선유지비"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_03_APT_FIN",
    category: "공동주택관리법 · 회계/수선",
    tags: ["housing/2차/관계법규/LAW_03", "공동주택관리법", "pro-field"],
    contrastAxisId: "AXIS_REPAIR_FUND",
    contrastSide: "입주자등(사용자 포함) · 소모성 보수",
    sameGroupIds: ["PRA_02_DISCLOSURE", "PRA_04_BUDGET_SETTLE"],
    contrastIds: ["LAW_03_LONG_TERM_RESERVE", "LAW_03_LONG_TERM_PLAN"],
    dbSearchKeyword: "수선유지비",
    lawRef: "공동주택관리법 제23조 · 시행령 별표 2",
    summaryBullets: [
      "장기수선계획에서 제외되는 소모성·경미한 공용부분 보수, 냉난방시설 청소비, 소화기 충약비 등",
      "관리비 구성 항목 중 하나로 실제 거주하는 '입주자등(소유자 + 사용자)'에게 부과",
      "장기수선계획 대상 주요시설 교체비를 수선유지비로 집행하면 회계감사 지적 및 과태료 대상",
    ],
    trapWarning:
      "수선유지비와 장기수선충당금의 부담 주체(입주자등 vs 소유자) 및 대상 공사를 뒤섞는 문제가 매년 출제됩니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_03_APT_FIN",
    id: "LAW_03_EXT_AUDIT",
    title: "외부 회계감사",
    aliases: ["회계감사", "외부 회계감사", "외부회계감사"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_03_APT_FIN",
    category: "공동주택관리법 · 회계감독",
    tags: ["housing/2차/관계법규/LAW_03", "공동주택관리법", "contrast/기간", "pro-field"],
    contrastAxisId: "AXIS_2ND_INSPECT_CYCLE",
    contrastSide: "매년 1회 (10월 31일까지)",
    sameGroupIds: ["PRA_04_BUDGET_SETTLE", "PRA_02_DISCLOSURE"],
    contrastIds: ["LAW_03_LONG_TERM_PLAN"],
    dbSearchKeyword: "회계감사",
    lawRef: "공동주택관리법 제26조",
    summaryBullets: [
      "300세대 이상 의무관리대상 공동주택의 관리주체는 매년 1회 이상(매년 10월 31일까지) 외부 회계감사 필수",
      "생략 예외: 해당 회계연도 입주자등의 2/3 이상이 서면으로 회계감사를 받지 않기로 동의한 경우",
      "300세대 미만도 입주자등의 1/10 이상 연서 요구 또는 입대의 의결로 회계감사 요구 가능",
    ],
    trapWarning:
      "감사 기한 '매년 10월 31일까지'와 생략 정족수 '2/3 이상 서면동의'(과반수 아님!)를 정확히 기억하세요.",
    proFieldTip:
      "회계감사 결과는 제출받은 날부터 1개월 이내 입대의 보고 + 공동주택관리정보시스템(K-apt) 공개가 의무입니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_04_RENT",
    id: "LAW_04_PRIVATE_RENT",
    title: "민간임대주택 · 임차인대표회의",
    aliases: ["민간임대주택", "임차인대표회의", "임대보증금"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_04_PRIVATE_RENT",
    category: "민간임대주택법",
    tags: ["housing/2차/관계법규/LAW_04", "임대주택법"],
    sameGroupIds: ["LAW_02A_REP_COUNCIL"],
    contrastIds: ["LAW_02A_MANDATORY_APT"],
    dbSearchKeyword: "임차인대표회의",
    lawRef: "민간임대주택에 관한 특별법 제52조",
    summaryBullets: [
      "임차인대표회의 의무 구성 대상: 150세대 이상 민간임대주택 (또는 20세대 이상 공동주택에서 임차인 구성 가능)",
      "임대사업자는 관리규약 제정·개정, 관리비, 공용부분 유지보수 등을 임차인대표회의와 '협의'해야 함",
      "민간임대주택 임대료 증액 상한: 연 5% 범위 내 (임대차계약 체결·증액 후 1년 이내 증액 불가)",
    ],
    trapWarning:
      "입주자대표회의는 '의결' 기구이지만, 민간임대 임차인대표회의는 '협의' 기구라는 차이가 단골 함정입니다!",
  },
  {
    folder: "02-stage2/04-law/LAW_06_BLDG",
    id: "LAW_06_BLDG_REMODEL",
    title: "대수선 · 건축물 용도변경",
    aliases: ["대수선", "용도변경", "이행강제금"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_06A_BLDG_GEN",
    category: "건축법 · 건축행위",
    tags: ["housing/2차/관계법규/LAW_06", "건축법"],
    contrastAxisId: "AXIS_2ND_ACT_PERMIT",
    contrastSide: "건축법 허가·신고·기재변경",
    sameGroupIds: ["PRA_01B_ACT_PERMIT"],
    contrastIds: ["LAW_01A_USE_INSPECTION"],
    dbSearchKeyword: "대수선",
    lawRef: "건축법 제2조 · 제19조",
    summaryBullets: [
      "대수선: 내력벽 30㎡ 이상 해체·수선, 기둥·보·지붕틀 3개 이상, 방화벽·주계단, 다가구·다세대 가구·세대 간 경계벽 증설·해체",
      "용도변경 9개 시설군: 상위군 이동 = '허가', 하위군 이동 = '신고', 같은 시설군 내 변경 = 건축물대장 '기재변경 신청'",
      "공동주택 용도변경은 건축법이 아닌 공동주택관리법의 행위허가·신고 기준을 우선 적용",
    ],
    trapWarning:
      "상위군 → 허가, 하위군 → 신고! 반대로 바꿔 내거나 내력벽 수선 기준 '30㎡ 이상' 숫자를 '50㎡'로 바꾸는 함정 주의.",
  },
  {
    folder: "02-stage2/04-law/LAW_07_SAFETY",
    id: "LAW_07_FIRE_INSPECT",
    title: "소방시설 자체점검 (작동점검 · 종합점검)",
    aliases: ["자체점검", "작동점검", "종합점검", "소방안전관리자"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_07_FIRE",
    category: "소방시설법 · 안전관리",
    tags: ["housing/2차/관계법규/LAW_07", "소방", "contrast/기간", "pro-field"],
    contrastAxisId: "AXIS_2ND_INSPECT_CYCLE",
    contrastSide: "작동·종합 연 1회 · 15일 이내 보고",
    sameGroupIds: ["LAW_08_ELEVATOR_INSPECT", "PRA_05E_FIRE_EXTINGUISH"],
    contrastIds: ["PRA_05B_WATER_TANK"],
    dbSearchKeyword: "작동점검",
    lawRef: "소방시설 설치 및 관리에 관한 법률 제22조",
    summaryBullets: [
      "작동점검·종합점검: 연 1회 이상 실시 (특급·1급·스프링클러 설치 아파트 등은 종합점검 필수)",
      "자체점검 실시 결과 보고서 제출 기한: 점검이 끝난 날부터 15일 이내 관할 소방서 제출 (개정 7일 → 15일!)",
      "세대별 소방시설 점검: 공동주택 관리자 및 입주민이 2년마다 전 세대 점검 완료 의무",
    ],
    trapWarning:
      "구법 '7일 이내 보고'가 '15일 이내'로 개정된 최신 조문 포인트와 세대점검 '2년 주기'가 핵심입니다!",
    proFieldTip:
      "소방 자체점검 지적사항 이행계획서 미제출 시 300만 원 이하 과태료! 소장Pro 스케줄러에 연 2회(작동·종합) 고정 등록하세요.",
  },
  {
    folder: "02-stage2/04-law/LAW_07_SAFETY",
    id: "LAW_08_ELEVATOR_INSPECT",
    title: "승강기 법정검사 (자체·정기·정밀안전검사)",
    aliases: ["승강기", "정기검사", "정밀안전검사", "승강기 자체점검"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_08_ELEVATOR",
    category: "승강기안전관리법",
    tags: ["housing/2차/관계법규/LAW_08", "승강기", "contrast/기간", "pro-field"],
    contrastAxisId: "AXIS_2ND_INSPECT_CYCLE",
    contrastSide: "자체 월1회 / 정기 1년(25년↑ 6개월) / 정밀 15년+3년",
    sameGroupIds: ["LAW_07_FIRE_INSPECT", "LAW_10_FACIL_SAFETY"],
    contrastIds: ["PRA_05B_WATER_TANK"],
    dbSearchKeyword: "승강기",
    lawRef: "승강기 안전관리법 제31조 · 제32조",
    summaryBullets: [
      "자체점검: 매월 1회 이상 실시 → 점검 후 5일 이내 국가승강기정보센터 전산 입력",
      "정기검사: 원칙 1년마다 (단, 최초 설치검사일로부터 25년 초과 승강기는 6개월마다!)",
      "정밀안전검사: 최초 설치검사일로부터 15년이 지난 날부터 매 3년마다 필수 수검",
    ],
    trapWarning:
      "설치 25년 초과 정기검사 '6개월', 정밀안전검사 '15년 도래 후 매 3년', 자체점검 전산 입력 '5일 이내' 숫자가 매년 출제됩니다!",
    proFieldTip:
      "불합격 승강기 운행 금지 표지 미부착 또는 무검사 운행은 형사처벌 대상이므로 검사 유효기간 만료 30일 전 예약 필수입니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_07_SAFETY",
    id: "LAW_10_FACIL_SAFETY",
    title: "시설물안전법 (1·2·3종 · 안전점검·진단)",
    aliases: ["시설물안전법", "정기안전점검", "정밀안전점검", "정밀안전진단", "제2종시설물"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_10_FACIL_SAFE",
    category: "시설물안전법 · 안전진단",
    tags: ["housing/2차/관계법규/LAW_10", "안전진단", "contrast/기간", "pro-field"],
    contrastAxisId: "AXIS_2ND_INSPECT_CYCLE",
    contrastSide: "정기 반기1회 / 정밀 2~4년 / 16층↑ 2종",
    sameGroupIds: ["LAW_08_ELEVATOR_INSPECT", "LAW_07_FIRE_INSPECT"],
    contrastIds: [],
    dbSearchKeyword: "정기안전점검",
    lawRef: "시설물의 안전 및 유지관리에 관한 특별법 제11조",
    summaryBullets: [
      "제2종시설물 공동주택: 16층 이상의 공동주택 (21층 이상·연면적 5만㎡ 이상은 제1종 아닌 제2종! 공동주택은 1종 없음)",
      "정기안전점검: 반기마다 1회 이상 실시 (A·B·C등급 기준, D·E등급은 연 3회)",
      "정밀안전점검: A등급 4년, B·C등급 3년, D·E등급 2년마다 1회 (건축물 기준)",
    ],
    trapWarning:
      "'공동주택은 21층 이상이면 제1종시설물이다' → 대표적인 오답 함정! 16층 이상 공동주택은 모두 제2종시설물입니다.",
  },
  {
    folder: "02-stage2/04-law/LAW_13_CONDO",
    id: "LAW_13_CONDO_QUORUM",
    title: "집합건물법 의결정족수 (과반수 · 3/4 · 4/5)",
    aliases: ["집합건물법", "관리단집회", "공용부분의 변경", "재건축 결의"],
    examStage: "2차",
    subject: "주택관리관계법규",
    chapterCode: "LAW_13_CONDO",
    category: "집합건물법 · 정족수",
    tags: ["housing/2차/관계법규/LAW_13", "집합건물법", "contrast/정족수"],
    sameGroupIds: ["LAW_02A_REP_COUNCIL"],
    contrastIds: ["LAW_02A_MANDATORY_APT", "PRA_01B_MANAGE_RULES"],
    dbSearchKeyword: "집합건물",
    lawRef: "집합건물의 소유 및 관리에 관한 법률 제15조 · 제29조 · 제47조",
    summaryBullets: [
      "통상 관리·관리인 선임: 구분소유자 과반수 및 의결권 과반수 (공용부분 보존행위는 각 공유자 단독 가능)",
      "규약 설정·변경·폐지 / 공용부분 변경: 구분소유자 3/4 이상 및 의결권 3/4 이상 (권리변동 없는 경미 변경은 2/3)",
      "재건축 결의 / 서면·전자결의 간주: 구분소유자 4/5 이상 및 의결권 4/5 이상",
    ],
    trapWarning:
      "집합건물법은 '구분소유자 수'와 '의결권(지분)' 둘 다 충족해야 하며, 공용부분 변경(3/4) vs 경미한 변경(2/3) vs 재건축(4/5) 분수 비교가 초빈출입니다.",
  },

  // =========================================================================
  // [2차 · 공동주택관리실무] 14개 핵심 빈출 개념
  // =========================================================================
  {
    folder: "02-stage2/05-practice/PRA_01_ADMIN",
    id: "PRA_01A_MANAGE_METHOD",
    title: "자치관리 vs 위탁관리",
    aliases: ["자치관리", "위탁관리", "자치관리기구", "주택관리업자"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_01A_THEORY",
    category: "관리방식 · 행정실무",
    tags: ["housing/2차/관리실무/PRA_01A", "pro-field"],
    contrastAxisId: "AXIS_2ND_MANAGE_METHOD",
    contrastSide: "자치(입대의 소장 선임) vs 위탁(업자 배치)",
    sameGroupIds: ["PRA_01B_MANAGE_RULES", "LAW_02A_MANDATORY_APT"],
    contrastIds: ["LAW_02A_REP_COUNCIL"],
    dbSearchKeyword: "자치관리",
    lawRef: "공동주택관리법 제5조 · 제6조 · 제7조",
    summaryBullets: [
      "자치관리: 입주자대표회의가 구성원 과반수 찬성으로 관리사무소장 선임, 입대의 구성 신고일부터 6개월 이내 자치관리기구 구성",
      "위탁관리: 입주자대표회의가 전자입찰로 주택관리업자 선정 → 주택관리업자가 소장 배치 (입주자등 1/10 요구·입대의 의결로 변경 가능)",
      "관리방법 결정·변경: 입대의 의결로 제안하고 전체 입주자등의 과반수 찬성 (또는 전체 입주자등 1/10 이상 제안 + 과반수 찬성)",
    ],
    trapWarning:
      "자치관리기구 구성 기한은 '3개월'이 아니라 '6개월 이내'! 위탁관리 변경은 입대의 의결만으로 불가하며 전체 입주자등 과반수 찬성 필수!",
  },
  {
    folder: "02-stage2/05-practice/PRA_01_ADMIN",
    id: "PRA_01B_ACT_PERMIT",
    title: "공동주택 행위허가 vs 행위신고",
    aliases: ["행위허가", "행위신고", "비내력벽", "파손", "용도변경"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_01B_PERMIT_RULE",
    category: "행정실무 · 행위제한",
    tags: ["housing/2차/관리실무/PRA_01B", "contrast/허가신고", "pro-field"],
    contrastAxisId: "AXIS_2ND_ACT_PERMIT",
    contrastSide: "허가(중대 변경) vs 신고(경미 변경)",
    sameGroupIds: ["LAW_06_BLDG_REMODEL", "PRA_01B_MANAGE_RULES"],
    contrastIds: [],
    dbSearchKeyword: "행위허가",
    lawRef: "공동주택관리법 제35조 · 시행령 별표 3",
    summaryBullets: [
      "행위허가(시장·군수·구청장): 사업계획 용도 외 사용, 증축·개축·대수선, 내력벽 파손·철거, 부대·복리시설 용도폐지(전체 입주자 2/3 동의)",
      "행위신고: 비내력벽 철거(해당 동 입주자등 1/2 동의), 경미한 부대시설 파손·철거, 조경시설 일부를 주차장으로 용도변경(입주자 2/3 동의)",
      "경미한 행위(허가·신고 불필요, 관리주체 동의): 창틀·문틀 교체, 세대 내 천장·벽·바닥 마감재 교체, 급배수관 교체",
    ],
    trapWarning:
      "비내력벽 철거는 '허가'가 아니라 '신고' 대상이며, 세대 내 단순 마감재 교체는 '관리주체 동의' 사항입니다!",
    proFieldTip:
      "입주민 인테리어 공사 시 발코니 확장·비내력벽 철거 여부를 사전 확인해 행위신고 미이행 분쟁을 차단하세요.",
  },
  {
    folder: "02-stage2/05-practice/PRA_01_ADMIN",
    id: "PRA_01B_MANAGE_RULES",
    title: "관리규약 (준칙·제정·개정)",
    aliases: ["관리규약", "관리규약 준칙"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_01B_PERMIT_RULE",
    category: "행정실무 · 자치규범",
    tags: ["housing/2차/관리실무/PRA_01B", "contrast/정족수", "pro-field"],
    sameGroupIds: ["PRA_01A_MANAGE_METHOD", "LAW_02A_REP_COUNCIL"],
    contrastIds: ["LAW_13_CONDO_QUORUM"],
    dbSearchKeyword: "관리규약",
    lawRef: "공동주택관리법 제18조 · 제19조",
    summaryBullets: [
      "관리규약 준칙 제정권자: 시·도지사 (지자체별 표준 준칙 참조해 단지 규약 제정)",
      "최초 제정: 사업주체 제안 → 입주예정자 과반수 서면동의 / 개정: 입대의 의결 또는 전체 입주자등 1/10 이상 제안 → 전체 입주자등 과반수 찬성",
      "제정·개정 신고: 30일 이내에 시장·군수·구청장에게 신고 (입주자등이 아닌 자에게도 승계 효력)",
    ],
    trapWarning:
      "관리규약 개정 정족수는 집합건물법 규약(3/4)과 달리 '전체 입주자등 과반수 찬성'입니다!",
  },
  {
    folder: "02-stage2/05-practice/PRA_02_RESIDENT",
    id: "PRA_02_DISCLOSURE",
    title: "관리비 · 계약서 공개 및 5년 보관",
    aliases: ["계약서 공개", "관리비 공개", "공동주택관리정보시스템", "K-apt"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_02_RESIDENT",
    category: "입주민 관리 · 투명성",
    tags: ["housing/2차/관리실무/PRA_02", "pro-field"],
    sameGroupIds: ["LAW_03_EXT_AUDIT", "PRA_04_BUDGET_SETTLE"],
    contrastIds: [],
    dbSearchKeyword: "계약서",
    lawRef: "공동주택관리법 제23조 · 제27조 · 제28조",
    summaryBullets: [
      "계약서 공개: 계약 체결일부터 1개월 이내에 인터넷 홈페이지 및 동별 게시판(또는 K-apt)에 공개 (5년간 보관)",
      "관리비 내역 공개: 다음 달 말일까지 K-apt 및 홈페이지에 공개 (10개 법정 관리비 항목 + 사용료 구분)",
      "회계장부 및 증빙서류 보존 기한: 5년간 보관 (입주자등 열람·복사 청구 시 개인정보 제외 후 응할 의무)",
    ],
    trapWarning:
      "계약서 공개 기한은 '15일'이 아니라 '1개월 이내'이며, 장부·증빙서류 법정 보관 기한은 '5년'입니다!",
    proFieldTip:
      "수의계약 포함 모든 용역·공사 계약서를 1개월 내 홈페이지·K-apt에 미공개 시 과태료 대상입니다.",
  },
  {
    folder: "02-stage2/05-practice/PRA_03_HR_INS",
    id: "PRA_03A_LABOR_STD",
    title: "근로기준법 (연차휴가 · 해고예고 · 휴게)",
    aliases: ["연차유급휴가", "연차", "해고예고", "휴게시간", "감시·단속적 근로자"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_03A_OFFICE_HR",
    category: "인사·노무 실무",
    tags: ["housing/2차/관리실무/PRA_03A", "노무", "pro-field"],
    sameGroupIds: ["PRA_03B_FOUR_INSURANCE"],
    contrastIds: [],
    dbSearchKeyword: "연차",
    lawRef: "근로기준법 제26조 · 제54조 · 제60조",
    summaryBullets: [
      "연차유급휴가: 1년간 80% 이상 출근 시 15일 (3년 이상 계속근로 시 매 2년마다 1일 가산, 최대 25일) / 1년 미만은 1개월 개근 시 1일(최대 11일)",
      "해고예고: 적어도 30일 전에 예고 (미예고 시 30일분 이상 통상임금 지급, 단 계속근로 3개월 미만은 예고 적용 제외)",
      "휴게시간: 근로시간 4시간 이상 30분, 8시간 이상 1시간 이상을 근로시간 도중에 부여 (경비원 감시·단속적 근로자 고용노동부장관 승인 시 적용제외)",
    ],
    trapWarning:
      "해고예고 미지급 수당은 '평균임금'이 아니라 '통상임금' 30일분! 감시·단속적 근로자도 '최저임금'과 '연차휴가'는 적용됩니다(연장·휴일수당만 제외).",
  },
  {
    folder: "02-stage2/05-practice/PRA_03_HR_INS",
    id: "PRA_03B_FOUR_INSURANCE",
    title: "4대 사회보험 (가입 기준 · 보험료 부담)",
    aliases: ["4대보험", "국민연금", "건강보험", "고용보험", "산재보험"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_03B_INSURANCE",
    category: "인사·노무 실무 · 4대보험",
    tags: ["housing/2차/관리실무/PRA_03B", "노무", "pro-field"],
    sameGroupIds: ["PRA_03A_LABOR_STD"],
    contrastIds: [],
    dbSearchKeyword: "고용보험",
    lawRef: "국민연금법 · 국민건강보험법 · 고용보험법 · 산재보험법",
    summaryBullets: [
      "산재보험: 사업주 전액 부담 (근로자 부담 0%), 1인 이상 모든 사업장·65세 이상·초단시간 근로자도 당연 적용",
      "고용보험: 65세 이후 새로 고용된 자는 실업급여 적용 제외 (단, 65세 전부터 피보험자격 유지 시 적용, 고용안정·직업능력은 전액 사업주)",
      "국민연금: 만 18세 이상 60세 미만 가입 (노사 각 50%), 월 60시간 미만 단시간 근로자 원칙 제외",
    ],
    trapWarning:
      "65세 이상 신규 채용 경비원은 고용보험 실업급여 제외이지만 '산재보험'과 '건강보험(월 60시간↑)'은 적용됩니다!",
  },
  {
    folder: "02-stage2/05-practice/PRA_04_ACCOUNT",
    id: "PRA_04_BIDDING_GUIDE",
    title: "사업자 선정지침 (경쟁입찰 vs 수의계약)",
    aliases: ["사업자 선정지침", "수의계약", "제한경쟁", "지명경쟁", "적격심사제", "최저낙찰제"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_04_ACCOUNT",
    category: "회계·계약 실무",
    tags: ["housing/2차/관리실무/PRA_04", "contrast/입찰", "pro-field"],
    contrastAxisId: "AXIS_2ND_BIDDING",
    contrastSide: "경쟁입찰(전자) vs 수의계약(300만 원 이하)",
    sameGroupIds: ["PRA_02_DISCLOSURE", "PRA_04_BUDGET_SETTLE"],
    contrastIds: [],
    dbSearchKeyword: "수의계약",
    lawRef: "국토교통부 고시 주택관리업자 및 사업자 선정지침",
    summaryBullets: [
      "원칙: 전자입찰(K-apt) 일반경쟁입찰 (입찰공고는 현장설명회 5일 전, 서류마감 10일 전; 긴급·재공고 5일 전)",
      "수의계약 가능 금액: 공사 및 용역 등 금액이 300만 원 이하인 경우 (부가가치세 제외!)",
      "제한경쟁(실적·기술능력·자본금 제한, 3인 이상 유효) vs 지명경쟁(5인 이상 지명, 2인 이상 유효)",
    ],
    trapWarning:
      "수의계약 한도 '300만 원 이하'는 부가가치세 '포함'이 아니라 '제외' 기준! 제한경쟁 유효입찰(3인) vs 지명경쟁 지명(5인)·유효(2인) 숫자 비교 초빈출!",
    proFieldTip:
      "300만 원 초과 공사를 쪼개기 수의계약(분할 발주)하면 지자체 감사에서 중대 위반 과태료 처분을 받습니다.",
  },
  {
    folder: "02-stage2/05-practice/PRA_04_ACCOUNT",
    id: "PRA_04_BUDGET_SETTLE",
    title: "예산안 · 결산서 제출 기한 & 회계처리기준",
    aliases: ["예산안", "결산서", "회계연도", "잡수입", "예비비"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_04_ACCOUNT",
    category: "회계·계약 실무",
    tags: ["housing/2차/관리실무/PRA_04", "contrast/기간", "pro-field"],
    sameGroupIds: ["LAW_03_EXT_AUDIT", "PRA_02_DISCLOSURE", "PRA_04_BIDDING_GUIDE"],
    contrastIds: [],
    dbSearchKeyword: "결산서",
    lawRef: "공동주택관리법 시행령 제26조",
    summaryBullets: [
      "사업계획 및 예산안: 매 회계연도 개시 1개월 전까지 입주자대표회의에 제출하여 승인",
      "결산서(재무상태표·운영성과표·이익잉여금처분계산서·주석): 매 회계연도 종료 후 2개월 이내에 입대의 제출",
      "잡수입: 입주자 기여분(중계기 임대료 등) vs 입주자등 공동 기여분(재활용품 매각 등) 구분 계리",
    ],
    trapWarning:
      "예산안은 개시 '1개월 전', 결산서는 종료 후 '2개월 이내'! (3개월 이내로 바꾸는 함정과 현금흐름표가 필수 재무제표에 포함된다는 오답 주의)",
  },
  {
    folder: "02-stage2/05-practice/PRA_05_FACILITY",
    id: "PRA_05A_CONCRETE_WATERPROOF",
    title: "콘크리트 탄산화(중성화) · 방수공법",
    aliases: ["탄산화", "중성화", "아스팔트 방수", "시트 방수", "도막 방수", "균열 보수"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_05A_ARCH",
    category: "건축·방수 유지관리",
    tags: ["housing/2차/관리실무/PRA_05A", "시설실무"],
    sameGroupIds: ["LAW_02B_DEFECT_WARRANTY", "LAW_10_FACIL_SAFETY"],
    contrastIds: [],
    dbSearchKeyword: "방수",
    summaryBullets: [
      "콘크리트 탄산화(중성화): 공기 중 CO₂가 수산화칼슘과 반응해 강알칼리(pH 12~13)가 중성화 → 철근 부식·팽창·박리 유발 (페놀프탈레인 용액 무색 변색으로 측정)",
      "방수공법 비교: 아스팔트 방수(다층·신뢰성 높음, 냄새/화재주의) vs 시트 방수(공기단축·접합부 취약) vs 도막 방수(복잡한 부위 유리·균일 두께 시공 주의)",
      "균열 보수: 미세균열(0.2~0.3mm 이하) 표면처리공법 / 관통·구조균열 에폭시 수지 주입공법 / 누수 균열 충전·발포우레탄 지수공법",
    ],
    trapWarning:
      "페놀프탈레인 용액은 중성화(탄산화)된 부분에서 적색이 아니라 '무색'으로 나타나고, 건전한 알칼리 부분에서 적자색으로 변합니다!",
  },
  {
    folder: "02-stage2/05-practice/PRA_05_FACILITY",
    id: "PRA_05B_WATER_TANK",
    title: "저수조(물탱크) 법정 유지관리",
    aliases: ["저수조", "물탱크", "저수조 청소", "수질검사", "잔류염소"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_05B_MECH",
    category: "급수·위생 설비 실무",
    tags: ["housing/2차/관리실무/PRA_05B", "contrast/기간", "pro-field"],
    contrastAxisId: "AXIS_2ND_INSPECT_CYCLE",
    contrastSide: "청소 반기1회 / 수질 연1회 / 위생점검 월1회",
    sameGroupIds: ["PRA_05B_WATER_HAMMER", "LAW_08_ELEVATOR_INSPECT"],
    contrastIds: ["LAW_07_FIRE_INSPECT"],
    dbSearchKeyword: "저수조",
    lawRef: "수도법 제33조 · 시행규칙 제22조의3",
    summaryBullets: [
      "저수조 청소: 반기마다 1회(6개월마다 1회) 이상 청소 및 소독 실시 (청소 후 기록 2년 보관)",
      "수질검사: 매년 1회 이상 (탁도·pH·잔류염소·일반세균·총대장균군·분원성대장균군)",
      "자체 위생점검: 매월 1회 이상 점검표 작성·보관 (저수조 청소 감독자 법정교육 4시간)",
    ],
    trapWarning:
      "청소는 '반기 1회', 수질검사는 '연 1회', 위생점검은 '월 1회'! 세 주기를 서로 바꿔 내는 문제가 거의 매년 출제됩니다.",
    proFieldTip:
      "저수조 청소 후 15일 이내 지자체 상수도사업소 신고 및 게시판 공지를 잊지 마세요.",
  },
  {
    folder: "02-stage2/05-practice/PRA_05_FACILITY",
    id: "PRA_05B_WATER_HAMMER",
    title: "수격작용 · 크로스커넥션 · 배수트랩 봉수",
    aliases: ["수격작용", "워터해머", "크로스커넥션", "배수트랩", "봉수", "통기관"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_05B_MECH",
    category: "급배수 트러블 방지",
    tags: ["housing/2차/관리실무/PRA_05B", "시설실무"],
    sameGroupIds: ["PRA_05B_WATER_TANK", "FAC_PIPE_UNION"],
    contrastIds: [],
    dbSearchKeyword: "수격",
    summaryBullets: [
      "수격작용(Water Hammer): 밸브 급폐쇄 시 배관 충격압·소음 → 유속 저감(1.5~2.0m/s 이하), 공기실·수격방지기 설치, 지수밸브 완만 폐쇄",
      "크로스 커넥션(Cross Connection): 음용수 배관과 비음용수(소화·배수) 배관 직결 금지 → 토수구 공간 확보 & 역류방지기(체크밸브) 설치",
      "배수트랩 봉수 깊이: 50~100mm 유지 (자기사이펀·유인사이펀·분출·모세관·증발로 인한 봉수 파괴 방지를 위해 통기관 설치)",
    ],
    trapWarning:
      "봉수 깊이는 '50~100mm'! 너무 얕으면(50mm 미만) 파괴 위험, 너무 깊으면(100mm 초과) 배수 저항 및 자기사이펀 유발!",
  },
  {
    folder: "02-stage2/05-practice/PRA_05_FACILITY",
    id: "PRA_05C_ELEC_SAFETY",
    title: "수변전설비 · 역률 개선 · 접지",
    aliases: ["역률", "진상콘덴서", "수변전설비", "접지", "누전차단기", "전기안전관리자"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_05C_ELEC_GAS",
    category: "전기설비 유지관리",
    tags: ["housing/2차/관리실무/PRA_05C", "전기", "pro-field"],
    sameGroupIds: ["PRA_05D_HEATING_SYS"],
    contrastIds: [],
    dbSearchKeyword: "역률",
    summaryBullets: [
      "역률 개선: 유도성 부하(전동기·변압기)에 병렬로 '진상용 콘덴서(전력용 콘덴서)'를 설치 → 전력손실 감소, 변압기 여유용량 증가, 전기요금 절감",
      "변압기 보호: 과전류계전기(OCR), 비율차동계전기(RDR), 부흐홀츠계전기(유입변압기 내부 고장 감지)",
      "누전차단기(ELB): 지락전류(누전) 감지 시 0.03초 이내 자동 차단 (월 1회 시험버튼 작동 점검)",
    ],
    trapWarning:
      "역률 개선 콘덴서는 부하에 '직렬'이 아니라 '병렬'로 설치합니다! 부흐홀츠계전기는 몰드변압기가 아닌 유입변압기에 설치!",
  },
  {
    folder: "02-stage2/05-practice/PRA_05_FACILITY",
    id: "PRA_05D_HEATING_SYS",
    title: "난방방식 대조 (개별 · 중앙 · 지역 / 온수 · 증기)",
    aliases: ["지역난방", "중앙난방", "개별난방", "온수난방", "증기난방", "열교환기"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_05D_HVAC",
    category: "난방·공조 설비",
    tags: ["housing/2차/관리실무/PRA_05D", "난방", "pro-field"],
    sameGroupIds: ["PRA_05B_WATER_TANK", "LAW_02A_MANDATORY_APT"],
    contrastIds: [],
    dbSearchKeyword: "난방",
    summaryBullets: [
      "온수난방: 열용량이 커 예열시간이 길지만 실온 변동이 적고 쾌적, 방열기 크기가 크며 동파 주의",
      "증기난방: 잠열 이용으로 예열시간이 짧고 방열기 소형화 가능, 단 실온 제어 어렵고 배관 소음(워터해머)·부식 우려",
      "지역난방: 열병합발전소에서 중온수 공급받아 단지 기계실 열교환기로 난방·급탕 공급 (보일러실 불필요, 의무관리대상 포함)",
    ],
    trapWarning:
      "온수난방(예열 길고 쾌적·방열기 큼) vs 증기난방(잠열·예열 짧고 방열기 작음·소음) 특징을 서로 바꿔 내는 문제가 빈출입니다!",
  },
  {
    folder: "02-stage2/05-practice/PRA_05_FACILITY",
    id: "PRA_05E_FIRE_EXTINGUISH",
    title: "스프링클러 설비 (습식 · 건식 · 준비작동식)",
    aliases: ["스프링클러", "습식", "건식", "준비작동식", "일제살수식", "유수검지장치"],
    examStage: "2차",
    subject: "공동주택관리실무",
    chapterCode: "PRA_05E_FIRE_SAFE",
    category: "소방·방재 설비 실무",
    tags: ["housing/2차/관리실무/PRA_05E", "소방", "pro-field"],
    contrastAxisId: "AXIS_2ND_SPRINKLER",
    contrastSide: "습식(상시 물) vs 준비작동식(지하주차장 동파방지)",
    sameGroupIds: ["LAW_07_FIRE_INSPECT"],
    contrastIds: [],
    dbSearchKeyword: "스프링클러",
    summaryBullets: [
      "습식 스프링클러: 1차·2차측 배관 모두 상시 가압수 충만 (구조 단순·방수 빠름, 단 동결 우려 없는 세대 내부용)",
      "준비작동식 스프링클러: 2차측 대기압(공기) 상태 → 감지기 작동 시 프리액션밸브 개방 → 헤드 개방 시 살수 (아파트 지하주차장 동파방지 표준!)",
      "건식(2차측 압축공기·동결우려) vs 일제살수식(개방형 헤드·무대부 등 전 구역 동시 살수)",
    ],
    trapWarning:
      "아파트 지하주차장은 동파 방지와 오작동 수손 방지를 위해 습식이 아니라 '준비작동식(폐쇄형 헤드 + 교차회로 감지기)'을 사용합니다!",
    proFieldTip:
      "동절기 지하주차장 준비작동식 밸브실 보온 히터 및 2차측 드레인(배수) 점검이 동파 방어의 핵심입니다.",
  },

  // =========================================================================
  // [1차 · 공동주택시설개론] 배관 이음 PoC 9개 개념 (01-stage1 네임스페이스 격리)
  // =========================================================================
  {
    folder: "01-stage1/03-facility/FAC_08_PIPE",
    id: "FAC_PIPE_UNION",
    title: "유니언",
    englishTitle: "Union",
    aliases: ["유니언", "유니온"],
    examStage: "1차",
    subject: "공동주택시설개론",
    chapterCode: "FAC_08_PIPE",
    category: "배관 이음 · 동경 직선",
    tags: ["housing/1차/시설개론/FAC_08", "배관이음", "pro-field"],
    contrastAxisId: "AXIS_PIPE_DIAMETER",
    contrastSide: "관경 동일 (직선)",
    sameGroupIds: ["FAC_PIPE_SOCKET", "FAC_PIPE_FLANGE", "FAC_PIPE_NIPPLE"],
    contrastIds: ["FAC_PIPE_BUSHING", "FAC_PIPE_REDUCING_NIPPLE", "FAC_PIPE_REDUCER"],
    dbSearchKeyword: "유니언",
    summaryBullets: [
      "관경이 동일한 50A 이하 소구경 배관을 직선으로 이음하는 부속품",
      "배관 전체를 회전시키지 않고 중앙 너트만 풀어 분해·조립·교체가 용이",
      "펌프·보일러·밸브 주변 등 추후 유지보수 구간에 주로 설치",
    ],
    trapWarning:
      "대구경(65A 이상) 분해·조립에는 유니언이 아니라 '플랜지'를 사용한다는 함정이 단골 출제됩니다.",
    proFieldTip:
      "기계실 소구경 밸브 교체 시 유니언이 없으면 배관을 절단해야 하므로 신설 시 양측 유니언 설치 여부를 검수하세요.",
  },
  {
    folder: "01-stage1/03-facility/FAC_08_PIPE",
    id: "FAC_PIPE_SOCKET",
    title: "소켓",
    englishTitle: "Socket / Coupling",
    aliases: ["소켓", "커플링"],
    examStage: "1차",
    subject: "공동주택시설개론",
    chapterCode: "FAC_08_PIPE",
    category: "배관 이음 · 동경 직선",
    tags: ["housing/1차/시설개론/FAC_08", "배관이음"],
    contrastAxisId: "AXIS_PIPE_DIAMETER",
    contrastSide: "관경 동일 (직선)",
    sameGroupIds: ["FAC_PIPE_UNION", "FAC_PIPE_FLANGE", "FAC_PIPE_NIPPLE"],
    contrastIds: ["FAC_PIPE_REDUCER", "FAC_PIPE_BUSHING", "FAC_PIPE_REDUCING_NIPPLE"],
    dbSearchKeyword: "소켓",
    summaryBullets: [
      "관경이 동일한 두 배관의 바깥 수나사를 양쪽 암나사로 감싸 직선 연결",
      "가장 기본적인 동경 직선 이음 부속품 (커플링과 동일 기능)",
      "양쪽이 수나사인 '니플'과 나사 위치가 정반대",
    ],
    trapWarning:
      "일반 '소켓'은 관경 동일, 앞에 '이경'이 붙은 '이경소켓(리듀서)'은 관경 다름으로 완전히 반대입니다!",
  },
  {
    folder: "01-stage1/03-facility/FAC_08_PIPE",
    id: "FAC_PIPE_FLANGE",
    title: "플랜지",
    englishTitle: "Flange",
    aliases: ["플랜지"],
    examStage: "1차",
    subject: "공동주택시설개론",
    chapterCode: "FAC_08_PIPE",
    category: "배관 이음 · 동경 직선",
    tags: ["housing/1차/시설개론/FAC_08", "배관이음", "pro-field"],
    contrastAxisId: "AXIS_PIPE_DIAMETER",
    contrastSide: "관경 동일 (직선)",
    sameGroupIds: ["FAC_PIPE_UNION", "FAC_PIPE_SOCKET", "FAC_PIPE_NIPPLE"],
    contrastIds: ["FAC_PIPE_BUSHING", "FAC_PIPE_REDUCER", "FAC_PIPE_REDUCING_NIPPLE"],
    dbSearchKeyword: "플랜지",
    summaryBullets: [
      "관경이 동일한 65A 이상 대구경 배관을 직선으로 연결하고 분해·조립할 때 사용",
      "원판형 플랜지 사이에 패킹(가스켓)을 끼우고 볼트·너트로 체결",
      "고압 배관, 펌프 흡입·토출구, 대구경 밸브 접속부에 필수 적용",
    ],
    trapWarning:
      "유니언(소구경)과 플랜지(대구경)의 적용 관경 기준을 서로 바꿔 내는 함정에 주의하세요.",
    proFieldTip:
      "기계실 순환펌프 플랜지 누수 시 볼트 대각선 균등 조임 및 가스켓 경화 교체가 정석입니다.",
  },
  {
    folder: "01-stage1/03-facility/FAC_08_PIPE",
    id: "FAC_PIPE_NIPPLE",
    title: "니플",
    englishTitle: "Nipple",
    aliases: ["니플"],
    examStage: "1차",
    subject: "공동주택시설개론",
    chapterCode: "FAC_08_PIPE",
    category: "배관 이음 · 동경 직선",
    tags: ["housing/1차/시설개론/FAC_08", "배관이음"],
    contrastAxisId: "AXIS_PIPE_DIAMETER",
    contrastSide: "관경 동일 (직선)",
    sameGroupIds: ["FAC_PIPE_UNION", "FAC_PIPE_SOCKET", "FAC_PIPE_FLANGE"],
    contrastIds: ["FAC_PIPE_REDUCING_NIPPLE", "FAC_PIPE_BUSHING", "FAC_PIPE_REDUCER"],
    dbSearchKeyword: "니플",
    summaryBullets: [
      "짧은 파이프 양쪽 끝에 수나사가 가공된 동경 직선 연결 부속품",
      "암나사가 있는 밸브·엘보·티 등 부속품끼리 아주 가까이 직결할 때 사용",
      "나사산이 맞닿은 클로즈 니플, 짧은 숏 니플 등이 있음",
    ],
    trapWarning:
      "그냥 '니플'은 관경 동일, '이경니플'은 관경 다름! 글자 두 개 차이를 시험에서 정확히 노립니다.",
  },
  {
    folder: "01-stage1/03-facility/FAC_08_PIPE",
    id: "FAC_PIPE_BUSHING",
    title: "부싱",
    englishTitle: "Bushing",
    aliases: ["부싱", "이경부싱"],
    examStage: "1차",
    subject: "공동주택시설개론",
    chapterCode: "FAC_08_PIPE",
    category: "배관 이음 · 이경(관경 다름)",
    tags: ["housing/1차/시설개론/FAC_08", "배관이음"],
    contrastAxisId: "AXIS_PIPE_DIAMETER",
    contrastSide: "관경 다름 (이경)",
    sameGroupIds: ["FAC_PIPE_REDUCING_NIPPLE", "FAC_PIPE_REDUCER"],
    contrastIds: ["FAC_PIPE_UNION", "FAC_PIPE_SOCKET", "FAC_PIPE_FLANGE", "FAC_PIPE_NIPPLE"],
    dbSearchKeyword: "부싱",
    summaryBullets: [
      "관경이 서로 다른(이경) 배관을 직선으로 연결할 때 사용하는 대표 부속품",
      "바깥쪽은 수나사, 안쪽은 암나사로 되어 있어 큰 관에 끼워 작은 관을 연결",
      "리듀서보다 길이가 짧아 협소한 배관 공간에서 관경을 줄일 때 유리",
    ],
    trapWarning:
      "'관경이 동일한 배관 직선 이음 부속품이 아닌 것은?' 문제에서 오답 1순위로 가장 자주 출제됩니다!",
  },
  {
    folder: "01-stage1/03-facility/FAC_08_PIPE",
    id: "FAC_PIPE_REDUCING_NIPPLE",
    title: "이경니플",
    englishTitle: "Reducing Nipple",
    aliases: ["이경니플", "이경 니플"],
    examStage: "1차",
    subject: "공동주택시설개론",
    chapterCode: "FAC_08_PIPE",
    category: "배관 이음 · 이경(관경 다름)",
    tags: ["housing/1차/시설개론/FAC_08", "배관이음"],
    contrastAxisId: "AXIS_PIPE_DIAMETER",
    contrastSide: "관경 다름 (이경)",
    sameGroupIds: ["FAC_PIPE_BUSHING", "FAC_PIPE_REDUCER"],
    contrastIds: ["FAC_PIPE_NIPPLE", "FAC_PIPE_UNION", "FAC_PIPE_SOCKET", "FAC_PIPE_FLANGE"],
    dbSearchKeyword: "이경니플",
    summaryBullets: [
      "양단 관경이 서로 다른 짧은 수나사 파이프로 이경 배관을 직선 연결",
      "암나사 구경이 다른 두 부속품(예: 25A 밸브와 20A 엘보)을 직접 연결할 때 사용",
      "부싱·리듀서와 함께 '관경이 다른 직선 이음 3총사(부·이·리)'",
    ],
    trapWarning:
      "일반 니플(동경)과 헷갈리게 '니플'과 '이경니플'을 한 문제에 동시에 섞어 출제하는 패턴에 주의!",
  },
  {
    folder: "01-stage1/03-facility/FAC_08_PIPE",
    id: "FAC_PIPE_REDUCER",
    title: "리듀서 (이경소켓)",
    englishTitle: "Reducer / Reducing Socket",
    aliases: ["리듀서", "이경소켓", "레듀샤", "편심 리듀서", "동심 리듀서"],
    examStage: "1차",
    subject: "공동주택시설개론",
    chapterCode: "FAC_08_PIPE",
    category: "배관 이음 · 이경(관경 다름)",
    tags: ["housing/1차/시설개론/FAC_08", "배관이음", "pro-field"],
    contrastAxisId: "AXIS_PIPE_DIAMETER",
    contrastSide: "관경 다름 (이경)",
    sameGroupIds: ["FAC_PIPE_BUSHING", "FAC_PIPE_REDUCING_NIPPLE"],
    contrastIds: ["FAC_PIPE_SOCKET", "FAC_PIPE_UNION", "FAC_PIPE_FLANGE", "FAC_PIPE_NIPPLE"],
    dbSearchKeyword: "리듀서",
    summaryBullets: [
      "관경이 서로 다른 배관을 직선으로 축소·확대 연결하는 양쪽 암나사 부속품",
      "동심 리듀서(수직관용)와 편심 리듀서(수평관 공기 고임 방지용)로 구분",
      "기출에서 '이경소켓'과 완전히 같은 뜻으로 번갈아 출제됨",
    ],
    trapWarning:
      "수평 배관에 '동심 리듀서'를 쓰면 상부에 공기가 고여 에어록 발생 → 수평관은 반드시 '편심 리듀서'!",
  },
  {
    folder: "01-stage1/03-facility/FAC_08_PIPE",
    id: "FAC_PIPE_ELBOW_TEE",
    title: "엘보 · 벤드 · 티 · 크로스",
    englishTitle: "Elbow / Bend / Tee / Cross",
    aliases: ["엘보", "벤드", "티", "크로스", "와이"],
    examStage: "1차",
    subject: "공동주택시설개론",
    chapterCode: "FAC_08_PIPE",
    category: "배관 이음 · 방향전환 & 분기",
    tags: ["housing/1차/시설개론/FAC_08", "배관이음"],
    contrastAxisId: "AXIS_PIPE_DIRECTION",
    contrastSide: "방향 전환 · 분기",
    sameGroupIds: ["FAC_PIPE_CAP_PLUG"],
    contrastIds: ["FAC_PIPE_UNION", "FAC_PIPE_SOCKET", "FAC_PIPE_FLANGE", "FAC_PIPE_NIPPLE"],
    dbSearchKeyword: "엘보",
    summaryBullets: [
      "방향 전환(구부림): 엘보(45°·90° 급곡선), 벤드(완만한 곡선, 마찰손실 적음)",
      "관 분기(갈라짐): 티(T, 90° 분기), Y(45° 분기, 배수관 합류 유리), 크로스(십자 4방향)",
      "직선 이음이 아니라 배관의 흐름 방향을 바꾸거나 가지를 칠 때 사용",
    ],
    trapWarning:
      "직선 이음 부속품 문제에 '엘보'나 '티'가 끼어 있으면 방향전환·분기용이므로 즉시 소거!",
  },
  {
    folder: "01-stage1/03-facility/FAC_08_PIPE",
    id: "FAC_PIPE_CAP_PLUG",
    title: "캡 · 플러그",
    englishTitle: "Cap / Plug",
    aliases: ["캡", "플러그"],
    examStage: "1차",
    subject: "공동주택시설개론",
    chapterCode: "FAC_08_PIPE",
    category: "배관 이음 · 끝막음(관말 폐쇄)",
    tags: ["housing/1차/시설개론/FAC_08", "배관이음"],
    contrastAxisId: "AXIS_PIPE_DIRECTION",
    contrastSide: "관말 폐쇄(끝막음)",
    sameGroupIds: ["FAC_PIPE_ELBOW_TEE"],
    contrastIds: ["FAC_PIPE_UNION", "FAC_PIPE_SOCKET", "FAC_PIPE_BUSHING"],
    dbSearchKeyword: "플러그",
    summaryBullets: [
      "캡(Cap): 암나사로 되어 있어 수나사가 난 배관 끝을 모자처럼 씌워 막음",
      "플러그(Plug): 수나사로 되어 있어 암나사가 난 부속품/배관 안쪽에 돌려 끼워 막음",
      "향후 증설 예정 배관이나 수압시험 시 관말 폐쇄용으로 사용",
    ],
    trapWarning:
      "캡(암나사·씌움)과 플러그(수나사·끼움)의 나사 위치와 결합 방식을 바꿔 내는 함정 주의!",
  },
];

function serializeVaultMarkdown(seed: VaultSeedSpec): string {
  const fmLines: string[] = [
    "---",
    `id: ${seed.id}`,
    `title: "${seed.title.replace(/"/g, '\\"')}"`,
    ...(seed.englishTitle ? [`english_title: "${seed.englishTitle}"`] : []),
    `aliases: [${seed.aliases.map((a) => `"${a}"`).join(", ")}]`,
    `exam_stage: "${seed.examStage}"`,
    `subject: "${seed.subject}"`,
    `chapter_code: "${seed.chapterCode}"`,
    `category: "${seed.category}"`,
    `tags: [${seed.tags.map((t) => `"${t}"`).join(", ")}]`,
    ...(seed.contrastAxisId ? [`contrast_axis_id: "${seed.contrastAxisId}"`] : []),
    ...(seed.contrastSide ? [`contrast_side: "${seed.contrastSide}"`] : []),
    `same_group_ids: [${seed.sameGroupIds.map((s) => `"${s}"`).join(", ")}]`,
    `contrast_ids: [${seed.contrastIds.map((c) => `"${c}"`).join(", ")}]`,
    `db_search_keyword: "${seed.dbSearchKeyword}"`,
    ...(seed.lawRef ? [`law_ref: "${seed.lawRef}"`] : []),
    "---",
  ];

  const bodyLines: string[] = [
    "",
    `# ${seed.title}`,
    "",
    "## 핵심 특징",
    ...seed.summaryBullets.map((b) => `- ${b}`),
    "",
    "## 기출 함정",
    seed.trapWarning,
  ];

  if (seed.proFieldTip) {
    bodyLines.push("", "## 소장Pro 실무 팁", seed.proFieldTip);
  }

  if (seed.sameGroupIds.length > 0 || seed.contrastIds.length > 0) {
    bodyLines.push("", "## 꼬리물기 링크");
    if (seed.sameGroupIds.length > 0) {
      bodyLines.push(`- 연관: ${seed.sameGroupIds.map((id) => `[[${id}]]`).join(", ")}`);
    }
    if (seed.contrastIds.length > 0) {
      bodyLines.push(`- 대조: ${seed.contrastIds.map((id) => `[[${id}]]`).join(", ")}`);
    }
  }

  return `${fmLines.join("\n")}\n${bodyLines.join("\n")}\n`;
}

function main() {
  const vaultRoot = path.resolve(process.cwd(), "content", "vault", "housing");

  // 구 PoC 임시 폴더(concepts/) 정리
  const legacyDir = path.join(vaultRoot, "concepts");
  if (fs.existsSync(legacyDir)) {
    fs.rmSync(legacyDir, { recursive: true, force: true });
  }

  let created = 0;
  for (const seed of VAULT_SEEDS) {
    const dir = path.join(vaultRoot, seed.folder);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${seed.id}.md`);
    fs.writeFileSync(filePath, serializeVaultMarkdown(seed), "utf-8");
    created += 1;
  }

  console.log(`✅ Obsidian Vault 2차 MVP 시드 생성 완료: ${created}개 개념 노드`);
}

main();
