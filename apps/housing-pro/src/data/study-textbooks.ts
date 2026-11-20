/**
 * 주택관리사 공식 법령(「공동주택관리법 시행령」 [별표 7]) + 문항 수 균형 분할
 * 5과목 · 69개 세부 목차 및 DB 1,400문항 1:1 매핑
 */
import { EXTRA_PRESET_TEXTBOOKS } from "@/data/preset-textbooks-extra";

export interface StudyTopicNode {
  id: string;
  chapterCode?: string;
  /** 과목 내 세부 목차 넘버링 (예: "01", "02") */
  topicNo?: string;
  /** 전체 69개 목차 일련번호 (1 ~ 69) */
  globalOrder?: number;
  questionCount?: number;
  title: string;
  defaultKeyword: string;
  estimatedMinutes: number;
  /** 단원별 사용자 지정 컬러 (미지정 시 소속 과목 컬러 사용) */
  color?: string;
  /** 가변 Depth(최대 4단) 상위 경로 브레드크럼 (예: ["제1편 주택법", "제2장 건설"]) */
  hierarchyPath?: string[];
  /** 체크 단위 일괄 압축 시 접혀 보존된 하위 세부 목차 메모 */
  subItems?: string[];
  /** 교재 시작 페이지 (Tier 3 정밀 지표) */
  pageStart?: number;
  /** 교재 끝 페이지 (Tier 3 정밀 지표) */
  pageEnd?: number;
  /** 단원 목표 회독 수 (미지정 시 과목 목표 회독 수 또는 기본 3R) */
  targetRounds?: number;
}

/** 단원의 페이지 분량 계산 (시작~끝 페이지가 모두 유효할 때) */
export function getTopicPageCount(topic: Pick<StudyTopicNode, "pageStart" | "pageEnd">): number {
  if (
    typeof topic.pageStart === "number" &&
    typeof topic.pageEnd === "number" &&
    topic.pageEnd >= topic.pageStart &&
    topic.pageStart > 0
  ) {
    return topic.pageEnd - topic.pageStart + 1;
  }
  return 0;
}

/** 페이지 수 기반 예상 학습시간(분) 자동 추정 (페이지당 약 2.5분, 15~180분 클램프) */
export function estimateMinutesFromPages(pageCount: number, fallback = 35): number {
  if (!pageCount || pageCount <= 0) return fallback;
  return Math.min(180, Math.max(15, Math.round(pageCount * 2.5)));
}

export interface StudyUnitNode {
  id: string;
  /** 과목 내 대단원 번호 (예: "Ⅰ", "Ⅱ", "Ⅲ") */
  unitNo?: string;
  title: string;
  topics: StudyTopicNode[];
}

export const DEFAULT_SUBJECT_CATEGORIES = [
  "주택관리사 1차",
  "주택관리사 2차",
  "국어",
  "영어",
  "수학",
  "과학",
  "사회·역사",
  "전공·자격",
  "기출·모고",
  "오답·정리",
] as const;

export const DEFAULT_BASE_SUBJECT_COLOR = "#FF5A36";

export const CUSTOM_SUBJECT_COLOR_PALETTE = [
  "#FF5A36",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#A855F7",
  "#06B6D4",
  "#C4E538",
  "#F97316",
  "#7C3AED",
  "#F43F5E",
  "#64748B",
] as const;

/** 기본과목은 통일색을 유지하고, 개별 과목은 인덱스에 따라 서로 다른 기본값을 반환 */
export function getDistinctSubjectColor(index: number, title?: string): string {
  const cleanTitle = (title || "").trim();
  if (cleanTitle === "기본 과목" || cleanTitle === "기본과목") {
    return DEFAULT_BASE_SUBJECT_COLOR;
  }
  const nonBasePalette = CUSTOM_SUBJECT_COLOR_PALETTE.slice(1); // 기본과목(#FF5A36)과 다른 색 위주
  return nonBasePalette[Math.abs(index) % nonBasePalette.length] || CUSTOM_SUBJECT_COLOR_PALETTE[0];
}

export interface StudySubjectNode {
  id: string;
  examStage: "1차" | "2차";
  category?: string;
  title: string;
  shortTitle: string;
  color: string;
  units: StudyUnitNode[];
  bookId?: string;
  bookTitle?: string;
  bookBadge?: string;
  isCustom?: boolean;
  isArchived?: boolean;
  /** 과목 기본 목표 회독 수 (기본 3R, 사용자 1~10R 커스텀 가능) */
  targetRounds?: number;
}

export type MatrixCellStatus = "done" | "plan" | "partial";

export interface MatrixCellLog {
  keyword: string;
  status: MatrixCellStatus;
  /** 계획/예상 학습 시간(분) */
  minutes?: number;
  /** 실제 타이머 실행 누적 시간(분) */
  actualMinutes?: number;
  updatedAt?: string;
  source?: "db" | "manual";
  customColor?: string;
}

export interface TimetableSlotEntry {
  color: string;
  label: string;
  topicId?: string;
  bookId?: string;
}

export interface TimetableSlotLog {
  color: string;
  label: string;
  topicId?: string;
  bookId?: string;
  /** 미리 계획한 예상(Plan) 기록 */
  plan?: TimetableSlotEntry;
  /** 타이머 완료 또는 수동 체크한 실제 실행(Actual) 기록 */
  actual?: TimetableSlotEntry;
}

/** 타임테이블 슬롯에서 예상(Plan) 기록을 추출 (레거시 단일 슬롯 하위 호환 포함) */
export function getTimetableSlotPlan(slot?: TimetableSlotLog): TimetableSlotEntry | null {
  if (!slot) return null;
  if (slot.plan) return slot.plan;
  if (!slot.actual && slot.color) {
    return {
      color: slot.color,
      label: slot.label,
      topicId: slot.topicId,
      ...(slot.bookId ? { bookId: slot.bookId } : {}),
    };
  }
  return null;
}

/** 타임테이블 슬롯에서 실제 실행(Actual) 기록을 추출 */
export function getTimetableSlotActual(slot?: TimetableSlotLog): TimetableSlotEntry | null {
  return slot?.actual ?? null;
}

/** 타임테이블 슬롯의 plan 또는 actual 레이어를 갱신하고 하위 호환 필드를 유지 */
export function setTimetableSlotLayer(
  existing: TimetableSlotLog | undefined,
  layer: "plan" | "actual",
  entry: TimetableSlotEntry | null
): TimetableSlotLog | undefined {
  const prevPlan = getTimetableSlotPlan(existing);
  const prevActual = getTimetableSlotActual(existing);
  const nextPlan = layer === "plan" ? entry : prevPlan;
  const nextActual = layer === "actual" ? entry : prevActual;

  const primary = nextActual || nextPlan;
  if (!primary) return undefined;

  return {
    color: primary.color,
    label: primary.label,
    ...(primary.topicId ? { topicId: primary.topicId } : {}),
    ...(primary.bookId ? { bookId: primary.bookId } : {}),
    ...(nextPlan ? { plan: nextPlan } : {}),
    ...(nextActual ? { actual: nextActual } : {}),
  };
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
  isbn?: string;
  publisher?: string;
  coverImageUrl?: string;
  /** 검색·카테고리 필터링용 태그 (예: ["주택관리사", "2차", "법규"]) */
  tags?: string[];
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

/** 그룹·랭킹·플래너·타이머 전역 공통 하루 시작 시각 (매일 새벽 05:00 KST 리셋, 05:00~익일 04:59 = 24시간) */
export const STUDY_DAY_RESET_HOUR = 5;

/** 날짜 변경 기준 시각(전역 공통 새벽 5시)을 반영한 논리적 '오늘' 날짜 계산 */
export function computeLogicalTodayISO(
  dayResetHour = STUDY_DAY_RESET_HOUR,
  now = new Date()
): string {
  const adjusted = new Date(now.getTime());
  if (adjusted.getHours() < dayResetHour) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  return formatDateISO(adjusted);
}

/** 날짜 변경 기준 시각부터 24시간 시퀀스 반환 (05, 06, ..., 23, 0, 1, 2, 3, 4) */
export function getHoursFromReset(dayResetHour = STUDY_DAY_RESET_HOUR): number[] {
  const normalized = ((Math.floor(dayResetHour) % 24) + 24) % 24;
  return Array.from({ length: 24 }, (_, i) => (normalized + i) % 24);
}

/** 자정(00:00) 이후 ~ 리셋 시각 직전(04:59)의 새벽 연장 학습 구간인지 여부 */
export function isOvernightExtensionHour(
  now = new Date(),
  dayResetHour = STUDY_DAY_RESET_HOUR
): boolean {
  return now.getHours() < dayResetHour;
}

/** HEX 색상을 RGBA 문자열로 변환 */
export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = (hex || "#FF5A36").replace("#", "").trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned.length === 6
        ? cleaned
        : "FF5A36";
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(255, 90, 54, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/** 회독 수(1R -> 2R -> 3R -> 4R -> 5R+)에 따라 점점 진해지는 농도(Shade) 스타일 반환 */
export function getRoundColorStyle(
  hex: string,
  roundCount: number
): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  boxShadow?: string;
} {
  if (roundCount <= 0) {
    return {
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderColor: "rgba(255, 255, 255, 0.08)",
      textColor: "#64748B",
    };
  }
  if (roundCount === 1) {
    return {
      backgroundColor: hexToRgba(hex, 0.38),
      borderColor: hexToRgba(hex, 0.58),
      textColor: "#F8FAFC",
    };
  }
  if (roundCount === 2) {
    return {
      backgroundColor: hexToRgba(hex, 0.58),
      borderColor: hexToRgba(hex, 0.78),
      textColor: "#FFFFFF",
    };
  }
  if (roundCount === 3) {
    return {
      backgroundColor: hexToRgba(hex, 0.78),
      borderColor: hexToRgba(hex, 0.92),
      textColor: "#FFFFFF",
    };
  }
  if (roundCount === 4) {
    return {
      backgroundColor: hexToRgba(hex, 0.92),
      borderColor: hex,
      textColor: "#FFFFFF",
    };
  }
  return {
    backgroundColor: hexToRgba(hex, 1),
    borderColor: "#FFFFFF",
    textColor: "#FFFFFF",
    boxShadow: `0 0 8px ${hexToRgba(hex, 0.55)}`,
  };
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
// [별표 7] + 균형 분할 69개 공식 세부 목차 (1차 39개 + 2차 30개 = 69개)
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
            id: "top-CIV_01A_PERSON",
            chapterCode: "CIV_01A_PERSON",
            questionCount: 28,
            title: "민법서설·신의칙·자연인(제한능력)",
            defaultKeyword: "제한능력",
            estimatedMinutes: 35,
          },
          {
            id: "top-CIV_01B_CORP_OBJ",
            chapterCode: "CIV_01B_CORP_OBJ",
            questionCount: 34,
            title: "법인·비법인사단·물건",
            defaultKeyword: "법인물건",
            estimatedMinutes: 35,
          },
          {
            id: "top-CIV_01C_ACT",
            chapterCode: "CIV_01C_ACT",
            questionCount: 13,
            title: "권리변동·법률행위 일반",
            defaultKeyword: "반사회불공정",
            estimatedMinutes: 30,
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
            questionCount: 17,
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
            id: "top-CIV_06A_CHANGE_POS",
            chapterCode: "CIV_06A_CHANGE_POS",
            questionCount: 9,
            title: "물권변동·등기·점유권",
            defaultKeyword: "등기점유",
            estimatedMinutes: 30,
          },
          {
            id: "top-CIV_06B_OWN_CO",
            chapterCode: "CIV_06B_OWN_CO",
            questionCount: 30,
            title: "소유권·상린관계·공동소유",
            defaultKeyword: "취득시효",
            estimatedMinutes: 40,
          },
          {
            id: "top-CIV_07_USUF",
            chapterCode: "CIV_07_USUF",
            questionCount: 15,
            title: "용익물권(지상·지역·전세)",
            defaultKeyword: "법정지상권",
            estimatedMinutes: 35,
          },
          {
            id: "top-CIV_08_SEC",
            chapterCode: "CIV_08_SEC",
            questionCount: 24,
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
            questionCount: 14,
            title: "채권총칙·계약총칙",
            defaultKeyword: "동시이행",
            estimatedMinutes: 35,
          },
          {
            id: "top-CIV_10A_SALE_WORK",
            chapterCode: "CIV_10A_SALE_WORK",
            questionCount: 21,
            title: "매매·도급·위임 등 계약각론",
            defaultKeyword: "매매도급",
            estimatedMinutes: 40,
          },
          {
            id: "top-CIV_10B_LEASE_TORT",
            chapterCode: "CIV_10B_LEASE_TORT",
            questionCount: 18,
            title: "임대차·주임법·부당이득·불법행위",
            defaultKeyword: "임대불법",
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
        id: "unit-1-acc-fin",
        title: "재무회계 (K-IFRS)",
        topics: [
          {
            id: "top-ACC_01A_CONCEPT",
            chapterCode: "ACC_01A_CONCEPT",
            questionCount: 28,
            title: "회계개념체계·질적특성·총론",
            defaultKeyword: "개념체계",
            estimatedMinutes: 35,
          },
          {
            id: "top-ACC_01B_CYCLE",
            chapterCode: "ACC_01B_CYCLE",
            questionCount: 24,
            title: "회계순환·결산수정분개·감사",
            defaultKeyword: "수정분개",
            estimatedMinutes: 40,
          },
          {
            id: "top-ACC_02A_CASH_AR",
            chapterCode: "ACC_02A_CASH_AR",
            questionCount: 15,
            title: "현금·수취채권",
            defaultKeyword: "은행대손",
            estimatedMinutes: 35,
          },
          {
            id: "top-ACC_02B_INV",
            chapterCode: "ACC_02B_INV",
            questionCount: 26,
            title: "재고자산 (원가흐름·수량·포함여부)",
            defaultKeyword: "선입가중",
            estimatedMinutes: 40,
          },
          {
            id: "top-ACC_02C_INV_VAL",
            chapterCode: "ACC_02C_INV_VAL",
            questionCount: 14,
            title: "재고자산 (저가법·감모·추정)",
            defaultKeyword: "저가감모",
            estimatedMinutes: 35,
          },
          {
            id: "top-ACC_03A_TANG_COST",
            chapterCode: "ACC_03A_TANG_COST",
            questionCount: 24,
            title: "유형자산 취득·감가상각·처분",
            defaultKeyword: "감가상각",
            estimatedMinutes: 40,
          },
          {
            id: "top-ACC_03B_TANG_ETC",
            chapterCode: "ACC_03B_TANG_ETC",
            questionCount: 29,
            title: "유형손상·재평가·무형·투자부동산",
            defaultKeyword: "재평가무형",
            estimatedMinutes: 40,
          },
          {
            id: "top-ACC_04A_FIN_ASSET",
            chapterCode: "ACC_04A_FIN_ASSET",
            questionCount: 12,
            title: "금융자산·지분법",
            defaultKeyword: "FVPL·FVOCI",
            estimatedMinutes: 35,
          },
          {
            id: "top-ACC_04B_LIAB_BOND",
            chapterCode: "ACC_04B_LIAB_BOND",
            questionCount: 23,
            title: "부채·사채·충당부채·리스",
            defaultKeyword: "사채충당",
            estimatedMinutes: 40,
          },
          {
            id: "top-ACC_05_EQ_FS",
            chapterCode: "ACC_05_EQ_FS",
            questionCount: 28,
            title: "자본·수익·현금흐름표·비율",
            defaultKeyword: "자본현금",
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
            questionCount: 25,
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
            id: "top-FAC_02A_RC",
            chapterCode: "FAC_02A_RC",
            questionCount: 27,
            title: "철근콘크리트구조",
            defaultKeyword: "RC피복",
            estimatedMinutes: 40,
          },
          {
            id: "top-FAC_02B_STL_MAS",
            chapterCode: "FAC_02B_STL_MAS",
            questionCount: 25,
            title: "철골·조적구조",
            defaultKeyword: "철골조적",
            estimatedMinutes: 35,
          },
          {
            id: "top-FAC_03A_ROOF_WTR",
            chapterCode: "FAC_03A_ROOF_WTR",
            questionCount: 20,
            title: "지붕·방수·단열·결로",
            defaultKeyword: "방수결로",
            estimatedMinutes: 35,
          },
          {
            id: "top-FAC_03B_FINISH",
            chapterCode: "FAC_03B_FINISH",
            questionCount: 34,
            title: "창호·유리·미장·타일·도장",
            defaultKeyword: "창호타일",
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
            id: "top-FAC_05A_WATER",
            chapterCode: "FAC_05A_WATER",
            questionCount: 39,
            title: "급수설비·수질·펌프",
            defaultKeyword: "급수펌프",
            estimatedMinutes: 40,
          },
          {
            id: "top-FAC_05B_HOTWATER",
            chapterCode: "FAC_05B_HOTWATER",
            questionCount: 10,
            title: "급탕설비·가열·순환",
            defaultKeyword: "급탕팽창",
            estimatedMinutes: 30,
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
            id: "top-LAW_01A_HOUSING_BUILD",
            chapterCode: "LAW_01A_HOUSING_BUILD",
            questionCount: 34,
            title: "주택법 (용어·건설·사업승인·감리)",
            defaultKeyword: "사업승인",
            estimatedMinutes: 40,
          },
          {
            id: "top-LAW_01B_HOUSING_SUP",
            chapterCode: "LAW_01B_HOUSING_SUP",
            questionCount: 22,
            title: "주택법 (공급·전매·리모델링)",
            defaultKeyword: "공급리모",
            estimatedMinutes: 35,
          },
          {
            id: "top-LAW_02A_APT_ORG",
            chapterCode: "LAW_02A_APT_ORG",
            questionCount: 14,
            title: "공동주택관리법 (관리방법·의무관리)",
            defaultKeyword: "자치위탁",
            estimatedMinutes: 35,
          },
          {
            id: "top-LAW_02B_APT_REP",
            chapterCode: "LAW_02B_APT_REP",
            questionCount: 21,
            title: "공동주택관리법 (입대의·규약·소장)",
            defaultKeyword: "입대의소장",
            estimatedMinutes: 35,
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
            id: "top-LAW_06A_BLDG_GEN",
            chapterCode: "LAW_06A_BLDG_GEN",
            questionCount: 32,
            title: "건축법 (총칙·건축허가·대지도로)",
            defaultKeyword: "허가대지",
            estimatedMinutes: 40,
          },
          {
            id: "top-LAW_06B_BLDG_TECH",
            chapterCode: "LAW_06B_BLDG_TECH",
            questionCount: 19,
            title: "건축법 (구조·피난·방화·면적)",
            defaultKeyword: "피난용도",
            estimatedMinutes: 35,
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
            id: "top-PRA_01A_THEORY",
            chapterCode: "PRA_01A_THEORY",
            questionCount: 22,
            title: "공동주거관리이론·관리방식",
            defaultKeyword: "자치위탁",
            estimatedMinutes: 35,
          },
          {
            id: "top-PRA_01B_PERMIT_RULE",
            chapterCode: "PRA_01B_PERMIT_RULE",
            questionCount: 22,
            title: "행위허가·관리규약·임대실무",
            defaultKeyword: "행위규약",
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
            id: "top-PRA_03A_OFFICE_HR",
            chapterCode: "PRA_03A_OFFICE_HR",
            questionCount: 20,
            title: "사무·인사관리·근로기준법",
            defaultKeyword: "근로기준",
            estimatedMinutes: 35,
          },
          {
            id: "top-PRA_03B_INSURANCE",
            chapterCode: "PRA_03B_INSURANCE",
            questionCount: 26,
            title: "4대 사회보험·퇴직급여·노사",
            defaultKeyword: "4대보험",
            estimatedMinutes: 35,
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
            id: "top-PRA_05A_ARCH",
            chapterCode: "PRA_05A_ARCH",
            questionCount: 24,
            title: "시설실무 (건축·단열·방수·설비일반)",
            defaultKeyword: "건축단열",
            estimatedMinutes: 35,
          },
          {
            id: "top-PRA_05B_MECH",
            chapterCode: "PRA_05B_MECH",
            questionCount: 29,
            title: "시설실무 (급수·급탕·배수·배관)",
            defaultKeyword: "급배수배관",
            estimatedMinutes: 35,
          },
          {
            id: "top-PRA_05C_ELEC_GAS",
            chapterCode: "PRA_05C_ELEC_GAS",
            questionCount: 20,
            title: "시설실무 (전기·승강기·가스)",
            defaultKeyword: "전기승강기",
            estimatedMinutes: 35,
          },
          {
            id: "top-PRA_05D_HVAC",
            chapterCode: "PRA_05D_HVAC",
            questionCount: 17,
            title: "시설실무 (난방·열원·냉동·공조)",
            defaultKeyword: "난방공조",
            estimatedMinutes: 35,
          },
          {
            id: "top-PRA_06_LTS_REMODEL",
            chapterCode: "PRA_06_LTS_REMODEL",
            questionCount: 7,
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

const ROMAN_NUMERALS = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ"] as const;

/**
 * 5과목·대단원·세부목차에 일관된 계층 넘버링(Ⅰ. 대단원 / 01. 세부목차 / 전체순번 1~69)을 부여합니다.
 */
function applyCurriculumNumbering(rawSubjects: StudySubjectNode[]): StudySubjectNode[] {
  let globalOrder = 0;
  return rawSubjects.map((subject) => {
    let subjectTopicSeq = 0;
    const units = subject.units.map((unit, uIdx) => {
      const unitNo = ROMAN_NUMERALS[uIdx] ?? String(uIdx + 1);
      const hasRomanPrefix = /^[ⅠⅡⅢⅣⅤⅥ]\.\s/.test(unit.title);
      const titledUnit = hasRomanPrefix ? unit.title : `${unitNo}. ${unit.title}`;

      const topics = unit.topics.map((topic) => {
        subjectTopicSeq += 1;
        globalOrder += 1;
        return {
          ...topic,
          topicNo: String(subjectTopicSeq).padStart(2, "0"),
          globalOrder,
        };
      });

      return {
        ...unit,
        unitNo,
        title: titledUnit,
        topics,
      };
    });

    return {
      ...subject,
      units,
    };
  });
}

const NUMBERED_ALL_SUBJECTS = applyCurriculumNumbering([
  ...SUBJECTS_FIRST_STAGE,
  ...SUBJECTS_SECOND_STAGE,
]);
const NUMBERED_SECOND_STAGE = NUMBERED_ALL_SUBJECTS.filter((s) => s.examStage === "2차");
const NUMBERED_LAW_SUBJECT = NUMBERED_SECOND_STAGE[0];

export interface CurriculumOrderMeta {
  chapterCode: string;
  examStage: "1차" | "2차";
  subject: string;
  subjectShort: string;
  subjectColor: string;
  unitTitle: string;
  topicNo: string;
  globalOrder: number;
  title: string;
  numberedTitle: string;
  questionCount: number;
}

/** chapterCode -> 공식 커리큘럼 순번/넘버링 메타데이터 맵 */
export const CURRICULUM_ORDER_MAP: Record<string, CurriculumOrderMeta> = (() => {
  const map: Record<string, CurriculumOrderMeta> = {};
  for (const subject of NUMBERED_ALL_SUBJECTS) {
    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        if (!topic.chapterCode) continue;
        const topicNo = topic.topicNo ?? "00";
        map[topic.chapterCode] = {
          chapterCode: topic.chapterCode,
          examStage: subject.examStage,
          subject: subject.title,
          subjectShort: subject.shortTitle,
          subjectColor: subject.color,
          unitTitle: unit.title,
          topicNo,
          globalOrder: topic.globalOrder ?? 999,
          title: topic.title,
          numberedTitle: `${topicNo}. ${topic.title}`,
          questionCount: topic.questionCount ?? 0,
        };
      }
    }
  }
  return map;
})();

// ============================================================================
// 출시 교재 카탈로그 (공식 [별표 7] 69개 세부 목차 기준)
// ============================================================================

export const TEXTBOOK_CATALOG: TextbookCatalogItem[] = [
  {
    id: "book-allinone-2026",
    title: "2026 주택관리사 [별표 7] 공식 69목차 (1,400제)",
    subtitle: "법정 출제기준 100% 반영 + 문항 균형 분할 · 5과목 69개 세부 단원",
    author: "PosMul 주택관리사 연구소",
    edition: "2026 제29회 대비 · 기출 1,400제",
    badge: "공식 69목차",
    coverColor: "#FF5A36",
    tags: ["주택관리사", "1차", "2차", "민법", "회계", "시설개론", "관계법규", "관리실무", "자격증"],
    requiresSerial: false,
    defaultExamDate: "2026-12-12",
    subjects: NUMBERED_ALL_SUBJECTS,
    seedOffsets: [],
    seedTodos: [],
  },
  {
    id: "book-2nd-48-2026",
    title: "2026 제29회 2차 [별표 7] 30목차 집중 (560제)",
    subtitle: "주택관리관계법규 16단원 + 공동주택관리실무 14단원 세밀 공략",
    author: "PosMul 수험전략팀",
    edition: "2차 단기 집중판",
    badge: "2차 30목차",
    coverColor: "#F59E0B",
    tags: ["주택관리사", "2차", "관계법규", "관리실무", "기출", "자격증"],
    requiresSerial: false,
    defaultExamDate: "2026-12-12",
    subjects: NUMBERED_SECOND_STAGE,
    seedOffsets: [],
    seedTodos: [],
  },
  {
    id: "book-law-drill-2026",
    title: "주택관리관계법규 13대 법령 · 16단원 정복 (280제)",
    subtitle: "주택·공관·임대·건축·소방·승강기·전기·시설물·도정·재정비·집합건물법",
    author: "김소장 법령연구소",
    edition: "2026 법령 16단원",
    badge: "법령 16단원",
    coverColor: "#A855F7",
    tags: ["주택관리사", "2차", "관계법규", "법령", "자격증"],
    requiresSerial: false,
    defaultExamDate: "2026-12-12",
    subjects: [NUMBERED_LAW_SUBJECT],
    seedOffsets: [],
    seedTodos: [],
  },
  ...EXTRA_PRESET_TEXTBOOKS,
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
