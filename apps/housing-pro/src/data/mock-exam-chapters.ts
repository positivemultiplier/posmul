/**
 * 2026년 제29회 주택관리사 2차 실전 기출 48문항 단원별 매핑 데이터셋
 * 48개 전 문항의 출제 법령 및 단원 체계 1:1 바인딩
 */

export interface ExamChapterPlan {
  id: string;
  chapterNumber: number;
  title: string;
  subTitle: string;
  lawCategory: string;
  questionNumbers: number[];
  questionCount: number;
  estimatedMinutes: number;
  timeBlock: "morning" | "afternoon1" | "afternoon2" | "unassigned";
  // 1~5회독 단계별 달성률 (%)
  tierProgress: [number, number, number, number, number];
  keyTopics: string[];
}

export const REAL_2026_CHAPTERS: ExamChapterPlan[] = [
  {
    id: "chap-1-housing-law",
    chapterNumber: 1,
    title: "제1단원: 주택법 총칙 및 공급·감리",
    subTitle: "간선시설 설치의무, 리모델링조합, 주택공급 규정",
    lawCategory: "주택법",
    questionNumbers: [1, 2, 3, 4, 5],
    questionCount: 5,
    estimatedMinutes: 20,
    timeBlock: "morning",
    tierProgress: [100, 80, 60, 40, 20],
    keyTopics: ["간선시설 설치비용 상환", "리모델링조합원 자격", "주택건설 감리원 배치"],
  },
  {
    id: "chap-2-apt-mgmt-law",
    chapterNumber: 2,
    title: "제2단원: 공동주택관리법 조직·행정",
    subTitle: "입주자대표회의, 관리비 항목, 분쟁조정위, 주택관리사 자격",
    lawCategory: "공동주택관리법",
    questionNumbers: [6, 7, 8, 9, 25, 28, 29, 30, 31],
    questionCount: 9,
    estimatedMinutes: 35,
    timeBlock: "morning",
    tierProgress: [100, 100, 80, 60, 40],
    keyTopics: ["하자분쟁조정위원회", "관리의 이관 절차", "입대의 동별대표자 자격"],
  },
  {
    id: "chap-3-building-law",
    chapterNumber: 3,
    title: "제3단원: 건축법 규정 및 에너지기준",
    subTitle: "공작물 축조신고, 시설군 용도변경, 인허가 의제, 대수선 범위",
    lawCategory: "건축법",
    questionNumbers: [10, 11, 12, 13, 37],
    questionCount: 5,
    estimatedMinutes: 25,
    timeBlock: "afternoon1",
    tierProgress: [80, 60, 40, 20, 0],
    keyTopics: ["건축물 용도 시설군", "대수선 성립 요건", "에너지절약설계기준"],
  },
  {
    id: "chap-4-safety-fire-law",
    chapterNumber: 4,
    title: "제4단원: 안전·소방·승강기 법정의무",
    subTitle: "시설물안전법 진단기관, 승강기사고 손해배상, 소방안전관리자 선임",
    lawCategory: "안전관리법령",
    questionNumbers: [14, 15, 16, 17, 18, 19, 38, 40, 42, 47],
    questionCount: 10,
    estimatedMinutes: 40,
    timeBlock: "afternoon1",
    tierProgress: [100, 80, 60, 20, 0],
    keyTopics: ["승강기 배상책임보험", "소방시설 완공검사", "화재안전기술기준(NFTC)"],
  },
  {
    id: "chap-5-rental-redevelopment",
    chapterNumber: 5,
    title: "제5단원: 임대주택법 및 정비사업",
    subTitle: "민간임대 의무기간, 공공임대 부담금, 재정비촉진지구, 집합건물 공용부",
    lawCategory: "임대/정비법",
    questionNumbers: [20, 21, 22, 23, 24, 32],
    questionCount: 6,
    estimatedMinutes: 25,
    timeBlock: "afternoon2",
    tierProgress: [60, 40, 20, 0, 0],
    keyTopics: ["임차인대표회의 구성", "집합건물 공용부분 관리", "도시재정비촉진사업"],
  },
  {
    id: "chap-6-labor-equipment",
    chapterNumber: 6,
    title: "제6단원: 근로·사회보험 & 시설설비실무",
    subTitle: "근로기준법 근로계약, 4대보험 자격변동, 장기수선 수선주기, 배관유량 계산",
    lawCategory: "노동/설비실무",
    questionNumbers: [26, 27, 33, 34, 35, 36, 39, 41, 43, 44, 45, 46, 48],
    questionCount: 13,
    estimatedMinutes: 45,
    timeBlock: "unassigned",
    tierProgress: [40, 20, 0, 0, 0],
    keyTopics: ["장기수선 전면교체 주기", "배관 마찰손실수두 계산", "구직급여 수급요건"],
  },
];

