/**
 * 주택관리사 공식 법령(「공동주택관리법 시행령」 [별표 7]) + 표준 단원 기반
 * 5과목 · 49개 세부 목차 및 DB 1,400문항 1:1 매핑
 */

export interface StudyTopicNode {
  id: string;
  chapterCode?: string;
  questionCount?: number;
  title: string;
  defaultKeyword: string;
  estimatedMinutes: number;
}

export interface StudyUnitNode {
  id: string;
  title: string;
  topics: StudyTopicNode[];
}

export interface StudySubjectNode {
  id: string;
  examStage: "1차" | "2차";
  title: string;
  shortTitle: string;
  color: string;
  units: StudyUnitNode[];
}

export type MatrixCellStatus = "done" | "plan";

export interface MatrixCellLog {
  keyword: string;
  status: MatrixCellStatus;
  minutes?: number;
  updatedAt?: string;
  source?: "db" | "manual";
}

export interface StudyTodoItem {
  id: string;
  title: string;
  subjectTitle: string;
  subjectColor: string;
  topicId?: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
}

export interface TextbookCatalogItem {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  edition: string;
  badge: string;
  coverColor: string;
  requiresSerial: boolean;
  defaultExamDate: string; // YYYY-MM-DD
  subjects: StudySubjectNode[];
  seedOffsets: Array<{
    topicId: string;
    dayOffset: number;
    keyword: string;
    status: MatrixCellStatus;
    minutes: number;
  }>;
  seedTodos: Array<{
    title: string;
    subjectTitle: string;
    subjectColor: string;
    topicId?: string;
    dayOffset: number;
    completed: boolean;
  }>;
}

/** 로컬 타임존 기준 YYYY-MM-DD 포맷 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysISO(baseISO: string, offsetDays: number): string {
  const [y, m, d] = baseISO.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + offsetDays);
  return formatDateISO(dt);
}

export function diffDaysISO(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = fromISO.split("-").map(Number);
  const [y2, m2, d2] = toISO.split("-").map(Number);
  const t1 = new Date(y1, (m1 || 1) - 1, d1 || 1).getTime();
  const t2 = new Date(y2, (m2 || 1) - 1, d2 || 1).getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// [별표 7] + 표준 단원 49개 공식 세부 목차 (1차 27개 + 2차 22개 = 49개)
// ============================================================================

const SUBJECTS_FIRST_STAGE: StudySubjectNode[] = [
  {
    id: "subj-1-civil",
    examStage: "1차",
    title: "민법",
    shortTitle: "민법",
    color: "#3B82F6", // 블루
    units: [
      {
        id: "unit-1-civil-gen",
        title: "민법총칙 (60% 내외)",
        topics: [
          {
            id: "top-CIV_01_RIGHTS",
            chapterCode: "CIV_01_RIGHTS",
            questionCount: 76,
            title: "권리변동·법률행위",
            defaultKeyword: "법률행위",
            estimatedMinutes: 40,
          },
          {
            id: "top-CIV_02_INTENT",
            chapterCode: "CIV_02_INTENT",
            questionCount: 14,
            title: "의사표시",
            defaultKeyword: "통정착오",
            estimatedMinutes: 35,
          },
          {
            id: "top-CIV_03_AGENCY",
            chapterCode: "CIV_03_AGENCY",
            questionCount: 20,
            title: "대리",
            defaultKeyword: "표현대리",
            estimatedMinutes: 40,
          },
          {
            id: "top-CIV_04_VOID_COND",
            chapterCode: "CIV_04_VOID_COND",
            questionCount: 16,
            title: "무효·취소·조건·기한",
            defaultKeyword: "무효취소",
            estimatedMinutes: 35,
          },
          {
            id: "top-CIV_05_LIMIT",
            chapterCode: "CIV_05_LIMIT",
            questionCount: 23,
            title: "기간·소멸시효",
            defaultKeyword: "시효중단",
            estimatedMinutes: 35,
          },
        ],
      },
      {
        id: "unit-1-civil-real",
        title: "물권법",
        topics: [
          {
            id: "top-CIV_06_OWN",
            chapterCode: "CIV_06_OWN",
            questionCount: 38,
            title: "물권변동·점유·소유권",
            defaultKeyword: "취득시효",
            estimatedMinutes: 45,
          },
          {
            id: "top-CIV_07_USUF",
            chapterCode: "CIV_07_USUF",
            questionCount: 14,
            title: "용익물권(지상·지역·전세)",
            defaultKeyword: "법정지상권",
            estimatedMinutes: 35,
          },
          {
            id: "top-CIV_08_SEC",
            chapterCode: "CIV_08_SEC",
            questionCount: 25,
            title: "담보물권(유치·질권·저당)",
            defaultKeyword: "저당유치",
            estimatedMinutes: 40,
          },
        ],
      },
      {
        id: "unit-1-civil-oblig",
        title: "채권법 (총칙·계약·법정채권)",
        topics: [
          {
            id: "top-CIV_09_CONT_GEN",
            chapterCode: "CIV_09_CONT_GEN",
            questionCount: 15,
            title: "채권총칙·계약총칙",
            defaultKeyword: "동시이행",
            estimatedMinutes: 40,
          },
          {
            id: "top-CIV_10_CONT_SPEC",
            chapterCode: "CIV_10_CONT_SPEC",
            questionCount: 39,
            title: "매매·임대차·도급·위임·불법행위",
            defaultKeyword: "임대매매",
            estimatedMinutes: 45,
          },
        ],
      },
    ],
  },
  {
    id: "subj-1-accounting",
    examStage: "1차",
    title: "회계원리",
    shortTitle: "회계원리",
    color: "#0EA5E9", // 스카이
    units: [
      {
        id: "unit-1-acc-fin",
        title: "재무회계 (K-IFRS)",
        topics: [
          {
            id: "top-ACC_01_BASIC",
            chapterCode: "ACC_01_BASIC",
            questionCount: 61,
            title: "회계기초·순환과정",
            defaultKeyword: "수정분개",
            estimatedMinutes: 40,
          },
          {
            id: "top-ACC_02_CUR_INV",
            chapterCode: "ACC_02_CUR_INV",
            questionCount: 50,
            title: "현금·수취채권·재고자산",
            defaultKeyword: "재고대손",
            estimatedMinutes: 45,
          },
          {
            id: "top-ACC_03_TANG_INT",
            chapterCode: "ACC_03_TANG_INT",
            questionCount: 51,
            title: "유형·무형·투자부동산",
            defaultKeyword: "감가상각",
            estimatedMinutes: 45,
          },
          {
            id: "top-ACC_04_FIN_LIAB",
            chapterCode: "ACC_04_FIN_LIAB",
            questionCount: 35,
            title: "금융자산·부채·사채·충당부채",
            defaultKeyword: "유효이자",
            estimatedMinutes: 45,
          },
          {
            id: "top-ACC_05_EQ_FS",
            chapterCode: "ACC_05_EQ_FS",
            questionCount: 22,
            title: "자본·수익·재무제표·비율",
            defaultKeyword: "현금자본",
            estimatedMinutes: 40,
          },
        ],
      },
      {
        id: "unit-1-acc-cost",
        title: "원가·관리회계",
        topics: [
          {
            id: "top-ACC_06_COST_JOB",
            chapterCode: "ACC_06_COST_JOB",
            questionCount: 29,
            title: "원가배부·개별원가",
            defaultKeyword: "부문배부",
            estimatedMinutes: 40,
          },
          {
            id: "top-ACC_07_COST_PROC",
            chapterCode: "ACC_07_COST_PROC",
            questionCount: 21,
            title: "종합원가·결합·표준원가",
            defaultKeyword: "완성환산",
            estimatedMinutes: 40,
          },
          {
            id: "top-ACC_08_COST_CVP",
            chapterCode: "ACC_08_COST_CVP",
            questionCount: 11,
            title: "CVP분석·의사결정회계",
            defaultKeyword: "손익분기",
            estimatedMinutes: 35,
          },
        ],
      },
    ],
  },
  {
    id: "subj-1-facility",
    examStage: "1차",
    title: "공동주택시설개론",
    shortTitle: "시설개론",
    color: "#14B8A6", // 틸
    units: [
      {
        id: "unit-1-fac-struct",
        title: "일반건축구조·철골·적산 (50%)",
        topics: [
          {
            id: "top-FAC_01_FOUND",
            chapterCode: "FAC_01_FOUND",
            questionCount: 22,
            title: "구조총론·기초·토공사",
            defaultKeyword: "지반말뚝",
            estimatedMinutes: 35,
          },
          {
            id: "top-FAC_02_RC_STL",
            chapterCode: "FAC_02_RC_STL",
            questionCount: 53,
            title: "철근콘크리트·철골·조적",
            defaultKeyword: "RC철골",
            estimatedMinutes: 45,
          },
          {
            id: "top-FAC_03_FIN_WTR",
            chapterCode: "FAC_03_FIN_WTR",
            questionCount: 51,
            title: "지붕·방수·창호·미장·도장",
            defaultKeyword: "방수단열",
            estimatedMinutes: 40,
          },
          {
            id: "top-FAC_04_EST",
            chapterCode: "FAC_04_EST",
            questionCount: 12,
            title: "건축적산·견적(장기수선 기준)",
            defaultKeyword: "수량할증",
            estimatedMinutes: 30,
          },
        ],
      },
      {
        id: "unit-1-fac-equip",
        title: "건축설비개론·홈네트워크 (50%)",
        topics: [
          {
            id: "top-FAC_05_WATER",
            chapterCode: "FAC_05_WATER",
            questionCount: 51,
            title: "급수·급탕설비",
            defaultKeyword: "고가부스터",
            estimatedMinutes: 45,
          },
          {
            id: "top-FAC_06_DRAIN",
            chapterCode: "FAC_06_DRAIN",
            questionCount: 16,
            title: "배수·통기·위생·오수정화",
            defaultKeyword: "봉수통기",
            estimatedMinutes: 35,
          },
          {
            id: "top-FAC_07_HVAC",
            chapterCode: "FAC_07_HVAC",
            questionCount: 26,
            title: "난방·환기·배관설비",
            defaultKeyword: "난방밸브",
            estimatedMinutes: 40,
          },
          {
            id: "top-FAC_08_ELEC",
            chapterCode: "FAC_08_ELEC",
            questionCount: 27,
            title: "전기·피뢰·홈네트워크",
            defaultKeyword: "수변전조명",
            estimatedMinutes: 40,
          },
          {
            id: "top-FAC_09_FIRE_ELV",
            chapterCode: "FAC_09_FIRE_ELV",
            questionCount: 22,
            title: "소방·가스·승강기설비",
            defaultKeyword: "스프링클러",
            estimatedMinutes: 35,
          },
        ],
      },
    ],
  },
];

const SUBJECTS_SECOND_STAGE: StudySubjectNode[] = [
  {
    id: "subj-2-law",
    examStage: "2차",
    title: "주택관리관계법규",
    shortTitle: "관계법규",
    color: "#FF5A36", // 열품타 오렌지
    units: [
      {
        id: "unit-2-law-core",
        title: "핵심 주택·관리 2대 법령",
        topics: [
          {
            id: "top-LAW_01_HOUSING",
            chapterCode: "LAW_01_HOUSING",
            questionCount: 56,
            title: "주택법",
            defaultKeyword: "사업승인",
            estimatedMinutes: 45,
          },
          {
            id: "top-LAW_02_APT_ORG",
            chapterCode: "LAW_02_APT_ORG",
            questionCount: 35,
            title: "공동주택관리법 (관리·조직)",
            defaultKeyword: "입대의소장",
            estimatedMinutes: 40,
          },
          {
            id: "top-LAW_03_APT_FIN",
            chapterCode: "LAW_03_APT_FIN",
            questionCount: 18,
            title: "공동주택관리법 (관리비·장기수선·하자)",
            defaultKeyword: "장충금하자",
            estimatedMinutes: 35,
          },
        ],
      },
      {
        id: "unit-2-law-rent-urban",
        title: "임대·정비·집합건물법",
        topics: [
          {
            id: "top-LAW_04_PRIVATE_RENT",
            chapterCode: "LAW_04_PRIVATE_RENT",
            questionCount: 14,
            title: "민간임대주택에 관한 특별법",
            defaultKeyword: "의무임대",
            estimatedMinutes: 30,
          },
          {
            id: "top-LAW_05_PUBLIC_RENT",
            chapterCode: "LAW_05_PUBLIC_RENT",
            questionCount: 14,
            title: "공공주택 특별법",
            defaultKeyword: "공공임대",
            estimatedMinutes: 30,
          },
          {
            id: "top-LAW_11_URBAN_REDEV",
            chapterCode: "LAW_11_URBAN_REDEV",
            questionCount: 15,
            title: "도시 및 주거환경정비법",
            defaultKeyword: "정비사업",
            estimatedMinutes: 30,
          },
          {
            id: "top-LAW_12_RENEW_SPEC",
            chapterCode: "LAW_12_RENEW_SPEC",
            questionCount: 6,
            title: "도시재정비 촉진을 위한 특별법",
            defaultKeyword: "촉진지구",
            estimatedMinutes: 20,
          },
          {
            id: "top-LAW_13_CONDO",
            chapterCode: "LAW_13_CONDO",
            questionCount: 7,
            title: "집합건물의 소유 및 관리에 관한 법률",
            defaultKeyword: "관리단집회",
            estimatedMinutes: 25,
          },
        ],
      },
      {
        id: "unit-2-law-safety",
        title: "건축·안전·소방·승강기·전기",
        topics: [
          {
            id: "top-LAW_06_BUILDING",
            chapterCode: "LAW_06_BUILDING",
            questionCount: 51,
            title: "건축법",
            defaultKeyword: "용도대수선",
            estimatedMinutes: 40,
          },
          {
            id: "top-LAW_07_FIRE",
            chapterCode: "LAW_07_FIRE",
            questionCount: 21,
            title: "소방기본법·화재예방·소방시설법",
            defaultKeyword: "소방선임",
            estimatedMinutes: 35,
          },
          {
            id: "top-LAW_08_ELEVATOR",
            chapterCode: "LAW_08_ELEVATOR",
            questionCount: 14,
            title: "승강기 안전관리법",
            defaultKeyword: "안전검사",
            estimatedMinutes: 30,
          },
          {
            id: "top-LAW_09_ELECTRIC",
            chapterCode: "LAW_09_ELECTRIC",
            questionCount: 14,
            title: "전기사업법 (KEC 포함)",
            defaultKeyword: "전기안전",
            estimatedMinutes: 30,
          },
          {
            id: "top-LAW_10_FACIL_SAFE",
            chapterCode: "LAW_10_FACIL_SAFE",
            questionCount: 15,
            title: "시설물의 안전 및 유지관리에 관한 특별법",
            defaultKeyword: "정밀진단",
            estimatedMinutes: 30,
          },
        ],
      },
    ],
  },
  {
    id: "subj-2-practice",
    examStage: "2차",
    title: "공동주택관리실무",
    shortTitle: "관리실무",
    color: "#10B981", // 에메랄드
    units: [
      {
        id: "unit-2-prac-admin",
        title: "관리이론·입주자·노무·회계",
        topics: [
          {
            id: "top-PRA_01_THEORY",
            chapterCode: "PRA_01_THEORY",
            questionCount: 45,
            title: "공동주거관리이론·관리방식",
            defaultKeyword: "자치위탁",
            estimatedMinutes: 35,
          },
          {
            id: "top-PRA_02_RESIDENT",
            chapterCode: "PRA_02_RESIDENT",
            questionCount: 26,
            title: "입주자관리·입대의·대외업무",
            defaultKeyword: "입주대외",
            estimatedMinutes: 35,
          },
          {
            id: "top-PRA_03_HR_LABOR",
            chapterCode: "PRA_03_HR_LABOR",
            questionCount: 45,
            title: "사무·인사·노무관리 (4대보험 포함)",
            defaultKeyword: "근기4대보험",
            estimatedMinutes: 40,
          },
          {
            id: "top-PRA_04_ACCOUNT",
            chapterCode: "PRA_04_ACCOUNT",
            questionCount: 13,
            title: "공동주택 회계관리·예산·세무",
            defaultKeyword: "예산세무",
            estimatedMinutes: 30,
          },
        ],
      },
      {
        id: "unit-2-prac-tech",
        title: "시설·장기수선·환경·안전·하자",
        topics: [
          {
            id: "top-PRA_05_FACILITY",
            chapterCode: "PRA_05_FACILITY",
            questionCount: 89,
            title: "시설관리 (건축·기계·전기·승강기)",
            defaultKeyword: "설비점검",
            estimatedMinutes: 45,
          },
          {
            id: "top-PRA_06_LTS_REMODEL",
            chapterCode: "PRA_06_LTS_REMODEL",
            questionCount: 8,
            title: "장기수선계획·사업자선정·리모델링",
            defaultKeyword: "적격심사",
            estimatedMinutes: 30,
          },
          {
            id: "top-PRA_07_ENV",
            chapterCode: "PRA_07_ENV",
            questionCount: 19,
            title: "환경·위생·조경관리",
            defaultKeyword: "수질공기질",
            estimatedMinutes: 30,
          },
          {
            id: "top-PRA_08_SAFETY",
            chapterCode: "PRA_08_SAFETY",
            questionCount: 28,
            title: "안전·방재·소방·방범관리",
            defaultKeyword: "안전계획",
            estimatedMinutes: 35,
          },
          {
            id: "top-PRA_09_DEFECT",
            chapterCode: "PRA_09_DEFECT",
            questionCount: 7,
            title: "공동주택 하자관리·보수공사",
            defaultKeyword: "하자보수",
            estimatedMinutes: 25,
          },
        ],
      },
    ],
  },
];

// ============================================================================
// 출시 교재 카탈로그 (공식 [별표 7] 49개 세부 목차 기준)
// ============================================================================

export const TEXTBOOK_CATALOG: TextbookCatalogItem[] = [
  {
    id: "book-allinone-2026",
    title: "2026 주택관리사 [별표 7] 공식 49목차 (1,400제)",
    subtitle: "국가시험 법정 출제기준 100% 반영 · 5과목 49개 세부 단원 DB 연동",
    author: "PosMul 주택관리사 연구소",
    edition: "2026 제29회 대비 · 기출 1,400제",
    badge: "공식 49목차",
    coverColor: "#FF5A36",
    requiresSerial: false,
    defaultExamDate: "2026-12-12",
    subjects: [...SUBJECTS_FIRST_STAGE, ...SUBJECTS_SECOND_STAGE],
    seedOffsets: [],
    seedTodos: [],
  },
  {
    id: "book-2nd-48-2026",
    title: "2026 제29회 2차 [별표 7] 22목차 집중 (560제)",
    subtitle: "주택관리관계법규 13개 법률 + 공동주택관리실무 9대 영역 완벽 분해",
    author: "PosMul 수험전략팀",
    edition: "2차 단기 집중판",
    badge: "2차 집중",
    coverColor: "#F59E0B",
    requiresSerial: false,
    defaultExamDate: "2026-12-12",
    subjects: SUBJECTS_SECOND_STAGE,
    seedOffsets: [],
    seedTodos: [],
  },
  {
    id: "book-law-drill-2026",
    title: "주택관리관계법규 13대 법령 완전정복 (280제)",
    subtitle: "주택·공관·임대·건축·소방·승강기·전기·시설물·도정·재정비·집합건물법",
    author: "김소장 법령연구소",
    edition: "2026 법령 13과목",
    badge: "법령 13선",
    coverColor: "#A855F7",
    requiresSerial: false,
    defaultExamDate: "2026-12-12",
    subjects: [SUBJECTS_SECOND_STAGE[0]],
    seedOffsets: [],
    seedTodos: [],
  },
];

export function findTopicMetaInSubjects(
  subjects: StudySubjectNode[],
  topicId: string
): { subject: StudySubjectNode; unit: StudyUnitNode; topic: StudyTopicNode } | null {
  for (const subject of subjects) {
    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        if (topic.id === topicId) {
          return { subject, unit, topic };
        }
      }
    }
  }
  return null;
}

export function flattenTopics(subjects: StudySubjectNode[]) {
  const list: Array<{
    subject: StudySubjectNode;
    unit: StudyUnitNode;
    topic: StudyTopicNode;
  }> = [];
  for (const subject of subjects) {
    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        list.push({ subject, unit, topic });
      }
    }
  }
  return list;
}
