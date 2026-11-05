/**
 * PosMul Domain Tone-on-Tone & Citizen Philosophy Design System
 *
 * 철의 삼각(관료-정치인-공급자) 카르텔을 극복하는 시민 직접민주주의 선순환:
 * 1. Forum (공론·숙의) & Consume (시간·지역소비) ➔ 무위험 자산 PMP 및 의결권 PMG 획득
 * 2. Prediction (집단지성 예측) ➔ 사회적 학습장 & MoneyWave 기반 위험자산 PMC 전환
 * 3. Donation (직접 예산 집행) ➔ 시민이 직접 PMC로 공익 프로젝트에 예산 집행
 * 4. Ranking (명예의 전당) ➔ 동(읍·면·동) 단위 풀뿌리 주권자의 "내가 그랬제!" 증명
 */

export type PosMulDomainKey =
  | "forum"
  | "consume"
  | "prediction"
  | "donation"
  | "ranking"
  | "other";

export type CoreAssetType = "PMP" | "PMC" | "PMP_TO_PMC" | "HONOR" | "INFRA";

export interface DomainPhilosophyMeta {
  key: PosMulDomainKey;
  title: string;
  englishTitle: string;
  href: string;
  stepBadge: string;
  assetBadge: string;
  assetType: CoreAssetType;
  philosophySlogan: string;
  philosophyMicroCopy: string;
  tones: {
    /** Row 1 (Domain): Deep Tone Pill */
    row1Active: string;
    row1Badge: string;
    /** Row 2 (Category): Mid Tone Translucent Pill */
    row2Active: string;
    row2Hover: string;
    /** Row 3 (Subcategory): Soft Tint Chip */
    row3Active: string;
    row3Hover: string;
    row3Dot: string;
    /** Page Surface & Ambient Glow */
    ambientGlow: string;
    headerSurface: string;
    cardHoverBorder: string;
    accentText: string;
    accentGradientText: string;
    pillBadge: string;
    primaryButton: string;
  };
}

export const DOMAIN_PHILOSOPHY_MAP: Record<PosMulDomainKey, DomainPhilosophyMeta> = {
  forum: {
    key: "forum",
    title: "포럼",
    englishTitle: "Forum · Public Agora",
    href: "/forum",
    stepBadge: "STEP 1 · 공론",
    assetBadge: "+PMP · PMG",
    assetType: "PMP",
    philosophySlogan: "공공 지식 학습 · 예산 감시 · 숙의 민주주의",
    philosophyMicroCopy: "뉴스 학습과 예산 감시, 아고라 숙의로 무위험 시민 자본(PMP)과 의결권(PMG)을 획득합니다.",
    tones: {
      row1Active:
        "bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white border border-emerald-400/50 shadow-[0_0_18px_rgba(16,185,129,0.28)]",
      row1Badge: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
      row2Active:
        "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
      row2Hover: "hover:bg-emerald-500/10 hover:text-emerald-200",
      row3Active:
        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold",
      row3Hover: "hover:bg-emerald-500/10 hover:text-emerald-300",
      row3Dot: "bg-emerald-400",
      ambientGlow: "from-emerald-500/10 via-teal-900/5 to-transparent",
      headerSurface:
        "bg-gradient-to-r from-emerald-950/35 via-slate-900/80 to-slate-900/90 border-emerald-500/25",
      cardHoverBorder: "hover:border-emerald-500/40",
      accentText: "text-emerald-400",
      accentGradientText: "from-emerald-300 via-teal-300 to-cyan-300",
      pillBadge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      primaryButton:
        "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/50",
    },
  },
  consume: {
    key: "consume",
    title: "소비",
    englishTitle: "Consume · Value Exchange",
    href: "/consume",
    stepBadge: "STEP 2 · 참여",
    assetBadge: "+PMP · +PMC",
    assetType: "PMP",
    philosophySlogan: "시간 가치화 · 지역 상생 소비 · 임팩트 펀딩",
    philosophyMicroCopy: "광고 시청으로 PMP를 모으고, 동네 상점 소비와 크라우드 펀딩으로 지역경제 PMC를 창출합니다.",
    tones: {
      row1Active:
        "bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white border border-indigo-400/50 shadow-[0_0_18px_rgba(99,102,241,0.28)]",
      row1Badge: "bg-indigo-950/80 text-indigo-300 border-indigo-500/40",
      row2Active:
        "bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]",
      row2Hover: "hover:bg-indigo-500/10 hover:text-indigo-200",
      row3Active:
        "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold",
      row3Hover: "hover:bg-indigo-500/10 hover:text-indigo-300",
      row3Dot: "bg-indigo-400",
      ambientGlow: "from-indigo-500/10 via-violet-900/5 to-transparent",
      headerSurface:
        "bg-gradient-to-r from-indigo-950/35 via-slate-900/80 to-slate-900/90 border-indigo-500/25",
      cardHoverBorder: "hover:border-indigo-500/40",
      accentText: "text-indigo-400",
      accentGradientText: "from-indigo-300 via-violet-300 to-purple-300",
      pillBadge: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
      primaryButton:
        "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-950/50",
    },
  },
  prediction: {
    key: "prediction",
    title: "예측",
    englishTitle: "Prediction · Collective Intelligence",
    href: "/prediction",
    stepBadge: "STEP 3 · 학습",
    assetBadge: "PMP ➔ PMC",
    assetType: "PMP_TO_PMC",
    philosophySlogan: "시민 집단지성 예측 · MoneyWave 가치 전환",
    philosophyMicroCopy: "무위험 자산(PMP)으로 사회·경제 의제를 예측하고, 적중 시 MoneyWave 상금풀에서 PMC를 획득합니다.",
    tones: {
      row1Active:
        "bg-gradient-to-r from-blue-600/90 to-sky-600/90 text-white border border-sky-400/50 shadow-[0_0_18px_rgba(14,165,233,0.28)]",
      row1Badge: "bg-blue-950/80 text-sky-300 border-sky-500/40",
      row2Active:
        "bg-sky-500/20 text-sky-200 border border-sky-400/40 shadow-[0_0_12px_rgba(14,165,233,0.15)]",
      row2Hover: "hover:bg-sky-500/10 hover:text-sky-200",
      row3Active:
        "bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold",
      row3Hover: "hover:bg-sky-500/10 hover:text-sky-300",
      row3Dot: "bg-sky-400",
      ambientGlow: "from-sky-500/10 via-blue-900/5 to-transparent",
      headerSurface:
        "bg-gradient-to-r from-blue-950/35 via-slate-900/80 to-slate-900/90 border-sky-500/25",
      cardHoverBorder: "hover:border-sky-500/40",
      accentText: "text-sky-400",
      accentGradientText: "from-sky-300 via-blue-300 to-cyan-300",
      pillBadge: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
      primaryButton:
        "bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-md shadow-blue-950/50",
    },
  },
  donation: {
    key: "donation",
    title: "기부",
    englishTitle: "Donation · Direct Democracy",
    href: "/donation",
    stepBadge: "STEP 4 · 집행",
    assetBadge: "PMC 직접집행",
    assetType: "PMC",
    philosophySlogan: "철의 삼각 극복 · 시민 직접 예산 집행",
    philosophyMicroCopy: "관료·정치인을 거치지 않고 시민이 직접 PMC를 집행하여 사회 문제 해결과 연대를 실현합니다.",
    tones: {
      row1Active:
        "bg-gradient-to-r from-purple-600/90 to-fuchsia-600/90 text-white border border-purple-400/50 shadow-[0_0_18px_rgba(168,85,247,0.28)]",
      row1Badge: "bg-purple-950/80 text-purple-300 border-purple-500/40",
      row2Active:
        "bg-purple-500/20 text-purple-200 border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]",
      row2Hover: "hover:bg-purple-500/10 hover:text-purple-200",
      row3Active:
        "bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold",
      row3Hover: "hover:bg-purple-500/10 hover:text-purple-300",
      row3Dot: "bg-purple-400",
      ambientGlow: "from-purple-500/10 via-fuchsia-900/5 to-transparent",
      headerSurface:
        "bg-gradient-to-r from-purple-950/35 via-slate-900/80 to-slate-900/90 border-purple-500/25",
      cardHoverBorder: "hover:border-purple-500/40",
      accentText: "text-purple-400",
      accentGradientText: "from-purple-300 via-fuchsia-300 to-pink-300",
      pillBadge: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
      primaryButton:
        "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-md shadow-purple-950/50",
    },
  },
  ranking: {
    key: "ranking",
    title: "랭킹",
    englishTitle: "Ranking · Hall of Fame",
    href: "/ranking",
    stepBadge: "CROWN · 명예",
    assetBadge: "풀뿌리 위상",
    assetType: "HONOR",
    philosophySlogan: "읍·면·동 풀뿌리 주권자 & '내가 그랬제!' 명예의 전당",
    philosophyMicroCopy: "우리 동네 긍정승수를 높인 시민들과 정확한 통찰로 미래를 적중시킨 예측 명사수들을 기립니다.",
    tones: {
      row1Active:
        "bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-slate-950 border border-amber-300/60 shadow-[0_0_18px_rgba(245,158,11,0.28)]",
      row1Badge: "bg-amber-950/80 text-amber-300 border-amber-500/40",
      row2Active:
        "bg-amber-500/20 text-amber-200 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
      row2Hover: "hover:bg-amber-500/10 hover:text-amber-200",
      row3Active:
        "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold",
      row3Hover: "hover:bg-amber-500/10 hover:text-amber-300",
      row3Dot: "bg-amber-400",
      ambientGlow: "from-amber-500/10 via-orange-900/5 to-transparent",
      headerSurface:
        "bg-gradient-to-r from-amber-950/35 via-slate-900/80 to-slate-900/90 border-amber-500/25",
      cardHoverBorder: "hover:border-amber-500/40",
      accentText: "text-amber-400",
      accentGradientText: "from-amber-300 via-yellow-200 to-orange-300",
      pillBadge: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
      primaryButton:
        "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-md shadow-amber-950/50",
    },
  },
  other: {
    key: "other",
    title: "기타",
    englishTitle: "Services · Transparency & Tax",
    href: "/other",
    stepBadge: "SUPPORT",
    assetBadge: "투명 회계",
    assetType: "INFRA",
    philosophySlogan: "기부금 세액공제(Gift Aid) · 투명 회계 · 시민 지원",
    philosophyMicroCopy: "기부 내역 영수증 발급과 포인트 거래 명세서를 투명하게 확인하고 계정 환경을 관리합니다.",
    tones: {
      row1Active:
        "bg-gradient-to-r from-slate-600 to-slate-500 text-white border border-slate-400/50 shadow-[0_0_15px_rgba(148,163,184,0.2)]",
      row1Badge: "bg-slate-900 text-slate-300 border-slate-600/40",
      row2Active:
        "bg-slate-500/25 text-slate-100 border border-slate-400/40 shadow-sm",
      row2Hover: "hover:bg-slate-500/15 hover:text-slate-200",
      row3Active:
        "bg-slate-500/20 text-slate-200 border border-slate-400/30 font-semibold",
      row3Hover: "hover:bg-slate-500/10 hover:text-slate-200",
      row3Dot: "bg-slate-300",
      ambientGlow: "from-slate-500/10 via-slate-800/5 to-transparent",
      headerSurface:
        "bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 border-slate-700/50",
      cardHoverBorder: "hover:border-slate-500/50",
      accentText: "text-slate-300",
      accentGradientText: "from-slate-200 via-slate-100 to-slate-400",
      pillBadge: "bg-slate-500/15 text-slate-300 border border-slate-500/30",
      primaryButton:
        "bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white shadow-md",
    },
  },
};

/**
 * 도메인 표시 순서 (PosMul 시민 선순환 흐름:
 * 포럼(공론) ➔ 소비(참여) ➔ 예측(집단지성) ➔ 기부(직접집행) ➔ 랭킹(명예) ➔ 기타)
 */
export const ORDERED_DOMAIN_KEYS: PosMulDomainKey[] = [
  "forum",
  "consume",
  "prediction",
  "donation",
  "ranking",
  "other",
];

