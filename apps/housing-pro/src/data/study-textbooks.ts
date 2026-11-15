/**
 * 주택관리사 공식 시험 과목 및 DB 기출 1,400문항 계층형 목차(1차/2차 > 5과목 > 19개 단원)
 * 교재를 선택하면 해당 목차 트리가 플래너·타이머·통계·할일에 자동 주입되며,
 * /study/solve 실제 기출 풀이 DB 기록과 연동됩니다.
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
  /** 상대 오프셋 일수 기반 초기 매트릭스 샘플 (빈 배열 = 실전 기록 연동 전용) */
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
// 공식 기출 DB 1,400문항 목차 (5과목 · 19개 단원)
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
        id: "unit-1-civil",
        title: "민법 (280문항)",
        topics: [
          {
            id: "top-CIVIL_GEN",
            chapterCode: "CIVIL_GEN",
            questionCount: 177,
            title: "민법총칙",
            defaultKeyword: "기출회독",
            estimatedMinutes: 45,
          },
          {
            id: "top-CIVIL_REAL",
            chapterCode: "CIVIL_REAL",
            questionCount: 44,
            title: "물권법",
            defaultKeyword: "기출회독",
            estimatedMinutes: 40,
          },
          {
            id: "top-CIVIL_OBLIG",
            chapterCode: "CIVIL_OBLIG",
            questionCount: 59,
            title: "채권법",
            defaultKeyword: "기출회독",
            estimatedMinutes: 40,
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
        id: "unit-1-accounting",
        title: "회계원리 (280문항)",
        topics: [
          {
            id: "top-ACCT_FIN",
            chapterCode: "ACCT_FIN",
            questionCount: 170,
            title: "재무회계",
            defaultKeyword: "기출회독",
            estimatedMinutes: 50,
          },
          {
            id: "top-ACCT_COST",
            chapterCode: "ACCT_COST",
            questionCount: 110,
            title: "원가·관리회계",
            defaultKeyword: "기출회독",
            estimatedMinutes: 45,
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
        id: "unit-1-facility",
        title: "시설개론 (280문항)",
        topics: [
          {
            id: "top-FACIL_STRUCT",
            chapterCode: "FACIL_STRUCT",
            questionCount: 89,
            title: "건축구조",
            defaultKeyword: "기출회독",
            estimatedMinutes: 40,
          },
          {
            id: "top-FACIL_EQUIP",
            chapterCode: "FACIL_EQUIP",
            questionCount: 191,
            title: "건축설비",
            defaultKeyword: "기출회독",
            estimatedMinutes: 45,
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
        id: "unit-2-law",
        title: "관계법규 (280문항)",
        topics: [
          {
            id: "top-LAW_APT_MGMT",
            chapterCode: "LAW_APT_MGMT",
            questionCount: 57,
            title: "공동주택관리법",
            defaultKeyword: "기출회독",
            estimatedMinutes: 40,
          },
          {
            id: "top-LAW_HOUSING",
            chapterCode: "LAW_HOUSING",
            questionCount: 57,
            title: "주택법",
            defaultKeyword: "기출회독",
            estimatedMinutes: 40,
          },
          {
            id: "top-LAW_SAFETY_FACILITY",
            chapterCode: "LAW_SAFETY_FACILITY",
            questionCount: 55,
            title: "안전·설비법",
            defaultKeyword: "기출회독",
            estimatedMinutes: 40,
          },
          {
            id: "top-LAW_BUILDING",
            chapterCode: "LAW_BUILDING",
            questionCount: 50,
            title: "건축법",
            defaultKeyword: "기출회독",
            estimatedMinutes: 35,
          },
          {
            id: "top-LAW_RENT_REDEV",
            chapterCode: "LAW_RENT_REDEV",
            questionCount: 42,
            title: "임대·정비법",
            defaultKeyword: "기출회독",
            estimatedMinutes: 35,
          },
          {
            id: "top-LAW_MINOR",
            chapterCode: "LAW_MINOR",
            questionCount: 19,
            title: "틈새 소법령",
            defaultKeyword: "기출회독",
            estimatedMinutes: 25,
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
        id: "unit-2-practice",
        title: "관리실무 (280문항)",
        topics: [
          {
            id: "top-PRAC_FACILITY",
            chapterCode: "PRAC_FACILITY",
            questionCount: 114,
            title: "시설관리",
            defaultKeyword: "기출회독",
            estimatedMinutes: 45,
          },
          {
            id: "top-PRAC_ORG_MGMT",
            chapterCode: "PRAC_ORG_MGMT",
            questionCount: 91,
            title: "관리방법·관리조직",
            defaultKeyword: "기출회독",
            estimatedMinutes: 40,
          },
          {
            id: "top-PRAC_LABOR",
            chapterCode: "PRAC_LABOR",
            questionCount: 45,
            title: "사무·인사/노무",
            defaultKeyword: "기출회독",
            estimatedMinutes: 35,
          },
          {
            id: "top-PRAC_ENV_SAFETY",
            chapterCode: "PRAC_ENV_SAFETY",
            questionCount: 20,
            title: "환경·안전관리",
            defaultKeyword: "기출회독",
            estimatedMinutes: 30,
          },
          {
            id: "top-PRAC_ACCOUNT_EXT",
            chapterCode: "PRAC_ACCOUNT_EXT",
            questionCount: 9,
            title: "회계·대외·리모델링",
            defaultKeyword: "기출회독",
            estimatedMinutes: 20,
          },
          {
            id: "top-PRAC_CUTOFF",
            chapterCode: "PRAC_CUTOFF",
            questionCount: 1,
            title: "초저빈출 부록",
            defaultKeyword: "기출체크",
            estimatedMinutes: 10,
          },
        ],
      },
    ],
  },
];

// ============================================================================
// 출시 교재 카탈로그 (공식 DB 목차 기준)
// ============================================================================

export const TEXTBOOK_CATALOG: TextbookCatalogItem[] = [
  {
    id: "book-allinone-2026",
    title: "2026 주택관리사 1·2차 공식 목차 (1,400제)",
    subtitle: "민법·회계·시설 + 관계법규·관리실무 5과목 · 19개 단원 실전 DB 연동",
    author: "PosMul 주택관리사 연구소",
    edition: "2026 제29회 대비 · 기출 1,400제",
    badge: "공식 전체",
    coverColor: "#FF5A36",
    requiresSerial: false,
    defaultExamDate: "2026-12-12",
    subjects: [...SUBJECTS_FIRST_STAGE, ...SUBJECTS_SECOND_STAGE],
    seedOffsets: [],
    seedTodos: [],
  },
  {
    id: "book-2nd-48-2026",
    title: "2026 제29회 2차 집중 마스터 (560제)",
    subtitle: "주택관리관계법규(6단원) + 공동주택관리실무(6단원) 12개 단원 집중",
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
    title: "주택관리관계법규 6대 법령 집중 목차 (280제)",
    subtitle: "공동주택관리법·주택법·안전·건축·임대·소법령 조문/기출 집중",
    author: "김소장 법령연구소",
    edition: "2026 법규 특화",
    badge: "관계법규",
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
