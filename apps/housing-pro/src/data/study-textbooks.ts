/**
 * 주택관리사 수험 교재 카탈로그 및 계층형 목차(1차/2차 > 과목 > 대단원 > 세부목차) 데이터
 * 교재를 선택하면 해당 교재의 전체 목차 트리가 플래너·타이머·통계·할일에 자동 주입됩니다.
 */

export interface StudyTopicNode {
  id: string;
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
  /** 상대 오프셋 일수(오늘=0, 어제=-1, 내일=+1) 기반 초기 매트릭스 샘플 */
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
// 공통 목차 빌딩 블록 (1차 + 2차 전 범위)
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
        id: "unit-civil-general",
        title: "민법총칙",
        topics: [
          { id: "top-civil-1", title: "권리변동·의사표시", defaultKeyword: "통정허위", estimatedMinutes: 40 },
          { id: "top-civil-2", title: "대리·무효·취소", defaultKeyword: "표현대리", estimatedMinutes: 40 },
          { id: "top-civil-3", title: "조건·기한·소멸시효", defaultKeyword: "시효중단", estimatedMinutes: 35 },
        ],
      },
      {
        id: "unit-civil-property",
        title: "물권·채권",
        topics: [
          { id: "top-civil-4", title: "점유권·소유권·상린관계", defaultKeyword: "취득시효", estimatedMinutes: 45 },
          { id: "top-civil-5", title: "저당권·임대차보호법", defaultKeyword: "법정지상권", estimatedMinutes: 45 },
        ],
      },
    ],
  },
  {
    id: "subj-1-accounting",
    examStage: "1차",
    title: "회계원리",
    shortTitle: "회계",
    color: "#0EA5E9", // 스카이
    units: [
      {
        id: "unit-acc-financial",
        title: "재무회계",
        topics: [
          { id: "top-acc-1", title: "재무제표·재고자산", defaultKeyword: "선입선출", estimatedMinutes: 45 },
          { id: "top-acc-2", title: "유형자산·감가상각", defaultKeyword: "정률법", estimatedMinutes: 45 },
          { id: "top-acc-3", title: "금융자산·사채·충당부채", defaultKeyword: "유효이자", estimatedMinutes: 50 },
        ],
      },
      {
        id: "unit-acc-cost",
        title: "원가·관리회계",
        topics: [
          { id: "top-acc-4", title: "원가배분·개별/종합원가", defaultKeyword: "완성품환산", estimatedMinutes: 45 },
          { id: "top-acc-5", title: "CVP분석·의사결정", defaultKeyword: "손익분기", estimatedMinutes: 40 },
        ],
      },
    ],
  },
  {
    id: "subj-1-facility",
    examStage: "1차",
    title: "공동주택시설개론",
    shortTitle: "시설",
    color: "#14B8A6", // 틸
    units: [
      {
        id: "unit-fac-struct",
        title: "건축구조",
        topics: [
          { id: "top-fac-1", title: "기초·철근콘크리트", defaultKeyword: "피복두께", estimatedMinutes: 40 },
          { id: "top-fac-2", title: "조적·방수·창호·도장", defaultKeyword: "아스팔트방수", estimatedMinutes: 35 },
        ],
      },
      {
        id: "unit-fac-mep",
        title: "건축설비",
        topics: [
          { id: "top-fac-3", title: "급수·급탕·배수위생", defaultKeyword: "수격작용", estimatedMinutes: 45 },
          { id: "top-fac-4", title: "난방·공조·전기·승강기", defaultKeyword: "마찰손실", estimatedMinutes: 45 },
        ],
      },
    ],
  },
];

const SUBJECTS_SECOND_STAGE: StudySubjectNode[] = [
  {
    id: "subj-2-housing",
    examStage: "2차",
    title: "주택법·건축법",
    shortTitle: "주택/건축",
    color: "#FF5A36", // 열품타 오렌지
    units: [
      {
        id: "unit-hou-1",
        title: "주택법",
        topics: [
          { id: "top-hou-1", title: "사업계획승인·간선시설", defaultKeyword: "간선상환", estimatedMinutes: 35 },
          { id: "top-hou-2", title: "리모델링·주택공급·감리", defaultKeyword: "증축형조합", estimatedMinutes: 40 },
        ],
      },
      {
        id: "unit-hou-2",
        title: "건축법",
        topics: [
          { id: "top-hou-3", title: "용도변경·시설군·대수선", defaultKeyword: "9개시설군", estimatedMinutes: 35 },
          { id: "top-hou-4", title: "인허가 의제·에너지기준", defaultKeyword: "녹색건축", estimatedMinutes: 30 },
        ],
      },
    ],
  },
  {
    id: "subj-2-aptmgmt",
    examStage: "2차",
    title: "공동주택관리법",
    shortTitle: "공관법",
    color: "#F59E0B", // 앰버
    units: [
      {
        id: "unit-apt-1",
        title: "조직·관리비",
        topics: [
          { id: "top-apt-1", title: "입대의·동별대표자 자격", defaultKeyword: "결격사유", estimatedMinutes: 40 },
          { id: "top-apt-2", title: "관리비·회계감사·관리이관", defaultKeyword: "외부회계", estimatedMinutes: 35 },
        ],
      },
      {
        id: "unit-apt-2",
        title: "장기수선·하자",
        topics: [
          { id: "top-apt-3", title: "장기수선계획·충당금", defaultKeyword: "3년검토", estimatedMinutes: 40 },
          { id: "top-apt-4", title: "하자담보·분쟁조정위", defaultKeyword: "하자심사", estimatedMinutes: 35 },
        ],
      },
    ],
  },
  {
    id: "subj-2-safety",
    examStage: "2차",
    title: "안전·소방·임대법",
    shortTitle: "안전/임대",
    color: "#A855F7", // 퍼플
    units: [
      {
        id: "unit-saf-1",
        title: "안전·소방·승강기",
        topics: [
          { id: "top-saf-1", title: "시설물안전법 정밀진단", defaultKeyword: "A~E등급", estimatedMinutes: 35 },
          { id: "top-saf-2", title: "소방안전관리자·NFTC", defaultKeyword: "특급선임", estimatedMinutes: 40 },
          { id: "top-saf-3", title: "승강기안전·배상책임보험", defaultKeyword: "정기검사", estimatedMinutes: 30 },
        ],
      },
      {
        id: "unit-saf-2",
        title: "임대·집합·노동",
        topics: [
          { id: "top-saf-4", title: "민간/공공임대·집합건물", defaultKeyword: "임차인대표", estimatedMinutes: 35 },
          { id: "top-saf-5", title: "근로기준·4대보험·산재", defaultKeyword: "구직급여", estimatedMinutes: 40 },
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
        id: "unit-pra-1",
        title: "행정·노무·회계실무",
        topics: [
          { id: "top-pra-1", title: "위탁관리·사업자선정지침", defaultKeyword: "적격심사", estimatedMinutes: 45 },
          { id: "top-pra-2", title: "예산결산·세무·노무관리", defaultKeyword: "연차수당", estimatedMinutes: 40 },
        ],
      },
      {
        id: "unit-pra-2",
        title: "시설·안전·환경실무",
        topics: [
          { id: "top-pra-3", title: "배관·수전·열원설비 점검", defaultKeyword: "수선주기", estimatedMinutes: 45 },
          { id: "top-pra-4", title: "방재·위생·조경·하자실무", defaultKeyword: "안전점검", estimatedMinutes: 35 },
        ],
      },
    ],
  },
];

// ============================================================================
// 출시 교재 카탈로그 (교재 선택 -> 자동 목차 주입)
// ============================================================================

export const TEXTBOOK_CATALOG: TextbookCatalogItem[] = [
  {
    id: "book-allinone-2026",
    title: "2026 주택관리사 1·2차 전 범위 회독 올인원",
    subtitle: "민법·회계·시설 + 관계법규·관리실무 통합 31개 핵심 목차",
    author: "PosMul 주택관리사 연구소",
    edition: "2026 제29회 대비 개정판",
    badge: "대표 기본서",
    coverColor: "#FF5A36",
    requiresSerial: false,
    defaultExamDate: "2026-12-12",
    subjects: [...SUBJECTS_FIRST_STAGE, ...SUBJECTS_SECOND_STAGE],
    seedOffsets: [
      // 1차 민법 (꾸준히 회독)
      { topicId: "top-civil-1", dayOffset: -11, keyword: "통정허위", status: "done", minutes: 40 },
      { topicId: "top-civil-1", dayOffset: -6, keyword: "착오취소", status: "done", minutes: 30 },
      { topicId: "top-civil-1", dayOffset: -1, keyword: "기출O/X", status: "done", minutes: 25 },
      { topicId: "top-civil-2", dayOffset: -10, keyword: "표현대리", status: "done", minutes: 45 },
      { topicId: "top-civil-2", dayOffset: -3, keyword: "무권대리", status: "done", minutes: 35 },
      { topicId: "top-civil-4", dayOffset: -8, keyword: "취득시효", status: "done", minutes: 50 },
      { topicId: "top-civil-5", dayOffset: 1, keyword: "임대차", status: "plan", minutes: 45 },

      // 1차 회계 (중간 빈틈 존재 -> 통계에서 드러남)
      { topicId: "top-acc-1", dayOffset: -12, keyword: "선입선출", status: "done", minutes: 50 },
      { topicId: "top-acc-1", dayOffset: -5, keyword: "저가법", status: "done", minutes: 40 },
      { topicId: "top-acc-2", dayOffset: -9, keyword: "정률법", status: "done", minutes: 45 },
      { topicId: "top-acc-5", dayOffset: 0, keyword: "손익분기", status: "plan", minutes: 40 },
      { topicId: "top-acc-5", dayOffset: 2, keyword: "CVP문제", status: "plan", minutes: 45 },

      // 1차 시설
      { topicId: "top-fac-1", dayOffset: -10, keyword: "피복두께", status: "done", minutes: 40 },
      { topicId: "top-fac-3", dayOffset: -4, keyword: "수격작용", status: "done", minutes: 45 },
      { topicId: "top-fac-4", dayOffset: -2, keyword: "마찰손실", status: "done", minutes: 40 },

      // 2차 주택법·건축법 (고밀도 학습)
      { topicId: "top-hou-1", dayOffset: -12, keyword: "간선상환", status: "done", minutes: 35 },
      { topicId: "top-hou-1", dayOffset: -7, keyword: "감리배치", status: "done", minutes: 30 },
      { topicId: "top-hou-1", dayOffset: -3, keyword: "사업승인", status: "done", minutes: 25 },
      { topicId: "top-hou-1", dayOffset: 0, keyword: "O/X 12제", status: "done", minutes: 20 },
      { topicId: "top-hou-2", dayOffset: -11, keyword: "리모델링", status: "done", minutes: 40 },
      { topicId: "top-hou-2", dayOffset: -4, keyword: "공급규칙", status: "done", minutes: 35 },
      { topicId: "top-hou-3", dayOffset: -6, keyword: "9개시설군", status: "done", minutes: 35 },
      { topicId: "top-hou-3", dayOffset: -1, keyword: "대수선", status: "done", minutes: 30 },
      { topicId: "top-hou-4", dayOffset: 2, keyword: "녹색건축", status: "plan", minutes: 30 },

      // 2차 공동주택관리법
      { topicId: "top-apt-1", dayOffset: -9, keyword: "결격사유", status: "done", minutes: 40 },
      { topicId: "top-apt-1", dayOffset: -2, keyword: "동대표", status: "done", minutes: 30 },
      { topicId: "top-apt-2", dayOffset: -5, keyword: "외부회계", status: "done", minutes: 35 },
      { topicId: "top-apt-3", dayOffset: -1, keyword: "3년검토", status: "done", minutes: 40 },
      { topicId: "top-apt-3", dayOffset: 1, keyword: "충당금", status: "plan", minutes: 35 },
      { topicId: "top-apt-4", dayOffset: -8, keyword: "하자심사", status: "done", minutes: 35 },

      // 2차 안전·소방·임대
      { topicId: "top-saf-1", dayOffset: -7, keyword: "A~E등급", status: "done", minutes: 35 },
      { topicId: "top-saf-2", dayOffset: -2, keyword: "NFTC", status: "done", minutes: 40 },
      { topicId: "top-saf-3", dayOffset: 0, keyword: "배상보험", status: "plan", minutes: 30 },

      // 2차 관리실무
      { topicId: "top-pra-1", dayOffset: -6, keyword: "적격심사", status: "done", minutes: 45 },
      { topicId: "top-pra-1", dayOffset: -1, keyword: "선정지침", status: "done", minutes: 35 },
      { topicId: "top-pra-3", dayOffset: -3, keyword: "수선주기", status: "done", minutes: 40 },
      { topicId: "top-pra-4", dayOffset: 3, keyword: "안전점검", status: "plan", minutes: 35 },
    ],
    seedTodos: [
      {
        title: "주택법 간선시설·감리 O/X 12지문 3초 컷",
        subjectTitle: "주택법·건축법",
        subjectColor: "#FF5A36",
        topicId: "top-hou-1",
        dayOffset: 0,
        completed: true,
      },
      {
        title: "회계원리 CVP 손익분기점 기본 10문항",
        subjectTitle: "회계원리",
        subjectColor: "#0EA5E9",
        topicId: "top-acc-5",
        dayOffset: 0,
        completed: false,
      },
      {
        title: "승강기 안전관리법 배상책임보험 한도 암기",
        subjectTitle: "안전·소방·임대법",
        subjectColor: "#A855F7",
        topicId: "top-saf-3",
        dayOffset: 0,
        completed: false,
      },
      {
        title: "공동주택관리법 장기수선충당금 적립요율 복습",
        subjectTitle: "공동주택관리법",
        subjectColor: "#F59E0B",
        topicId: "top-apt-3",
        dayOffset: 1,
        completed: false,
      },
    ],
  },
  {
    id: "book-2nd-48-2026",
    title: "2026 제29회 2차 실전 48문항 5회독 마스터",
    subtitle: "실제 기출 48문항 1:1 매핑 · 2차 단기 압축 회독 전용서",
    author: "PosMul 수험전략팀",
    edition: "POD 실전판",
    badge: "2차 집중",
    coverColor: "#F59E0B",
    requiresSerial: true,
    defaultExamDate: "2026-12-12",
    subjects: SUBJECTS_SECOND_STAGE,
    seedOffsets: [
      { topicId: "top-hou-1", dayOffset: -5, keyword: "1~5문", status: "done", minutes: 30 },
      { topicId: "top-hou-1", dayOffset: -2, keyword: "오답선지", status: "done", minutes: 25 },
      { topicId: "top-apt-1", dayOffset: -4, keyword: "6~9문", status: "done", minutes: 35 },
      { topicId: "top-apt-2", dayOffset: -1, keyword: "25~31문", status: "done", minutes: 40 },
      { topicId: "top-saf-2", dayOffset: 0, keyword: "14~19문", status: "plan", minutes: 40 },
      { topicId: "top-pra-1", dayOffset: 1, keyword: "26~48문", status: "plan", minutes: 45 },
    ],
    seedTodos: [
      {
        title: "제29회 2차 기출 14~19번 안전·소방 집중 풀이",
        subjectTitle: "안전·소방·임대법",
        subjectColor: "#A855F7",
        topicId: "top-saf-2",
        dayOffset: 0,
        completed: false,
      },
      {
        title: "카메라 AI 스캔 오답 선지 O 승격 훈련",
        subjectTitle: "주택법·건축법",
        subjectColor: "#FF5A36",
        topicId: "top-hou-1",
        dayOffset: 0,
        completed: false,
      },
    ],
  },
  {
    id: "book-law-drill-2026",
    title: "주택관리관계법규 조문·숫자 최종 암기노트",
    subtitle: "법령 기한·벌칙·의결 정족수만 골라 3일 1회독 회전",
    author: "김소장 법령연구소",
    edition: "2026 포켓 에디션",
    badge: "법령 특화",
    coverColor: "#A855F7",
    requiresSerial: true,
    defaultExamDate: "2026-12-12",
    subjects: SUBJECTS_SECOND_STAGE.slice(0, 3),
    seedOffsets: [
      { topicId: "top-hou-1", dayOffset: -3, keyword: "30일/60일", status: "done", minutes: 25 },
      { topicId: "top-apt-1", dayOffset: -2, keyword: "과반/2/3", status: "done", minutes: 30 },
      { topicId: "top-saf-1", dayOffset: -1, keyword: "정밀안전", status: "done", minutes: 25 },
      { topicId: "top-saf-4", dayOffset: 0, keyword: "의무임대", status: "plan", minutes: 30 },
    ],
    seedTodos: [
      {
        title: "민간임대주택법 임대의무기간·양도신고 숫자 체크",
        subjectTitle: "안전·소방·임대법",
        subjectColor: "#A855F7",
        topicId: "top-saf-4",
        dayOffset: 0,
        completed: false,
      },
    ],
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
