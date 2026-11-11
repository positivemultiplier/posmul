/**
 * PosMul 집단지성 · 사회선택 · 베이지안 학습 도메인 엔진
 *
 * 경제학 4대 핵심 이론의 알고리즘 구현:
 * 1. 애로우의 불가능성 정리 (Arrow's Impossibility Theorem) 대응:
 *    - 단순 서수 다수결의 한계(선호 강도 누락, IIA 위반, 투표 역설)를 완화하기 위해
 *      기수적 선호 강도(stake × confidence) 집적 및 순환 역설 탐지 수행.
 * 2. 콩도르세(Condorcet) & 보르다(Borda) 투표 방식:
 *    - 1순위뿐만 아니라 차순위 및 비선호(최하위 기피) 정보까지 반영한 보르다 점수 순위와
 *      모든 옵션 쌍의 1:1 쌍대 비교(콩도르세 매트릭스 · 승자 · 순환 역설) 산출.
 * 3. 베이지안 업데이트(Bayesian Updating)와 확률적 판단:
 *    - Dirichlet-Multinomial 켤레 사전분포 기반 순차 업데이트 (시간 감쇠 + 스킬 가중 + 로그 스테이크 강도)로
 *      소표본 극단화를 방지하고 Shannon Entropy 기반 불확실성 정량화.
 * 4. 경험의 편향(Experience Bias) 탐지 및 지속적 학습(Continuous Learning):
 *    - 참여 전 과신·군중쏠림·기저율 무시(중환자실 의사 함정) 편향 진단 및 교정 넛지 제공.
 *    - 정산 후 Brier Score · Log Score · Calibration Gap · EMA Skill Weight 갱신으로
 *      학습된 예측자 가중치가 다음 마켓의 베이지안 업데이트에 재투입되는 폐루프 구현.
 */

export interface CollectiveOptionInput {
  readonly id: string;
  readonly label: string;
  /** 초기 기저율(Prior Probability, 0~1). 미지정 시 균등 확률 적용 */
  readonly priorProbability?: number;
}

export interface CollectiveParticipationSignal {
  readonly userId?: string;
  readonly selectedOptionId: string;
  /** 참여 PMP (선호 강도 산출용) */
  readonly stakeAmount: number;
  /** 참여 시 명시한 확률적 확신도 (0~1, 미지정 시 0.5) */
  readonly confidence?: number;
  /** 참여 시각 (ISO 문자열 또는 Date) */
  readonly createdAt?: string | Date;
  /** 지속적 학습으로 축적된 참여자 신뢰도/스킬 가중치 (기본 1.0, 범위 0.65~1.75) */
  readonly skillWeight?: number;
  /** 보르다/콩도르세용 선호 순위 (1순위 -> 후순위). 선택 입력 */
  readonly rankedOptionIds?: readonly string[];
  /** 보르다/콩도르세용 최하위 비선호/기피 옵션 ID ("가장 싫어하는 대안"). 선택 입력 */
  readonly avoidOptionId?: string;
}

export interface BayesianOptionPosterior {
  readonly optionId: string;
  readonly label: string;
  /** 베이지안 사후확률 (합계 = 1) */
  readonly bayesianProbability: number;
  /** 사전 기저율 (Prior) */
  readonly priorProbability: number;
  /** 단순 참여 볼륨 비율 (Raw Volume Share) */
  readonly rawVolumeProbability: number;
  /** Dirichlet 사후 강도 (alpha_k) */
  readonly posteriorAlpha: number;
  /** 95% 베타 근사 신뢰구간 [lower, upper] */
  readonly credibleInterval: readonly [number, number];
  /** 실제 참여 금액 합계 */
  readonly rawVolume: number;
  /** 실제 참여 건수 */
  readonly rawCount: number;
}

export interface BayesianMarketPosteriorResult {
  readonly options: readonly BayesianOptionPosterior[];
  /** 유효 증거 표본 수 (사전 분포를 제외한 누적 증거량) */
  readonly effectiveEvidenceStrength: number;
  /** 정규화된 Shannon 엔트로피 (0=완전 합의, 1=완전 불확실) */
  readonly normalizedEntropy: number;
  /** 사전 확률 강도 합계 (alpha_0) */
  readonly totalPriorStrength: number;
  /** 참여 표본 수가 적어 Prior 안정화 영향이 큰 상태인지 여부 */
  readonly isLowSampleStabilized: boolean;
}

export interface BordaOptionScore {
  readonly optionId: string;
  readonly label: string;
  readonly bordaPoints: number;
  /** 0~100 정규화 보르다 합의 점수 */
  readonly normalizedScore: number;
  readonly rank: number;
  /** 최선호(1순위) 지목 횟수/가중치 */
  readonly firstChoiceShare: number;
  /** 비선호(최하위 기피) 지목 비율 */
  readonly avoidPenaltyShare: number;
}

export interface CondorcetPairwiseCell {
  readonly optionAId: string;
  readonly optionBId: string;
  /** A가 B보다 선호된 가중 점수 */
  readonly aBeatsBScore: number;
  /** B가 A보다 선호된 가중 점수 */
  readonly bBeatsAScore: number;
  /** 1:1 대결에서 A의 승률 (0~1) */
  readonly aWinRate: number;
}

export interface SocialChoiceAnalysisResult {
  /** 단순 다수결 (볼륨/1순위 기준) 1위 옵션 ID */
  readonly pluralityWinnerId: string | null;
  /** 보르다 카운트(선호 강도·비선호 반영) 1위 옵션 ID */
  readonly bordaWinnerId: string | null;
  /** 모든 1:1 쌍대 대결에서 이긴 콩도르세 승자 (순환 역설 시 null) */
  readonly condorcetWinnerId: string | null;
  /** 애로우 불가능성 / 콩도르세 순환 역설 발생 여부 */
  readonly hasCondorcetCycle: boolean;
  /** 순환 역설 또는 다수결-보르다 괴리 시 한국어 진단 메시지 */
  readonly arrowDivergenceAlert: string | null;
  /** 보르다 순위표 */
  readonly bordaRanking: readonly BordaOptionScore[];
  /** 콩도르세 1:1 쌍대 비교 매트릭스 */
  readonly pairwiseMatrix: readonly CondorcetPairwiseCell[];
  /** 명시적 순위/비선호 투표가 반영된 참여 건수 */
  readonly explicitRankedVoteCount: number;
  /** 전체 유효 참여 건수 */
  readonly totalSignalCount: number;
}

export interface ExperienceBiasEvaluationInput {
  readonly selectedOptionId: string;
  readonly confidence: number; // 0~1
  readonly stakeAmount: number;
  readonly marketBayesianProbability: number; // 0~1
  readonly optionPriorProbability: number; // 0~1
  readonly totalParticipants: number;
  /** 최근 단기(예: 최근 24시간 또는 최근 N건) 참여 중 이 옵션의 점유율 (0~1) */
  readonly recentOptionShare?: number;
  /** 개인의 과거 calibration gap (평균 확신도 - 실제 적중률, 양수=과신 경향) */
  readonly userCalibrationGap?: number;
  readonly userPastSettledCount?: number;
}

export interface ExperienceBiasReport {
  /** 과신 편향 위험도 (0~1) */
  readonly overconfidenceRisk: number;
  /** 군중 쏠림(Herding) / 최근 편향 위험도 (0~1) */
  readonly herdingBiasRisk: number;
  /** 기저율 무시 / 소표본 경험 편향 위험도 (0~1) */
  readonly baseRateNeglectRisk: number;
  /** 종합 경험 편향 지수 (0~1) */
  readonly overallBiasScore: number;
  readonly riskLevel: "LOW" | "MEDIUM" | "HIGH";
  /** 행동경제학 디바이어싱 코칭 메시지 */
  readonly nudges: readonly string[];
}

export interface SettledPredictionRecord {
  readonly selectedOptionId: string;
  readonly correctOptionId: string;
  readonly confidence: number; // 0~1
  readonly optionCount: number;
  readonly createdAt?: string | Date;
}

export interface BrierLearningResult {
  /** 멀티클래스 정규화 Brier Score (0=완벽, 1=최악) */
  readonly brierScore: number;
  /** 대수 점수 기반 정보 손실 (낮을수록 정확) */
  readonly logLoss: number;
  readonly isCorrect: boolean;
  /** 신뢰도 괴리 (confidence - isCorrect): +면 과신, -면 과소신뢰 */
  readonly calibrationGap: number;
  /** 단일 건 정보 학습 기여도 (1 - brierScore) */
  readonly accuracyQuality: number;
}

export interface UserLearningProfileSummary {
  readonly settledCount: number;
  readonly winRate: number;
  readonly averageConfidence: number;
  readonly averageBrierScore: number;
  readonly averageLogLoss: number;
  /** +값: 과신 경향, -값: 과소신뢰 경향, 0 근처: 잘 교정됨 */
  readonly calibrationGap: number;
  /** 베이지안 업데이트에 투입되는 개인 숙련도 가중치 (0.65 ~ 1.75) */
  readonly skillWeight: number;
  readonly calibrationStatus:
    | "INSUFFICIENT_DATA"
    | "WELL_CALIBRATED"
    | "OVERCONFIDENT"
    | "UNDERCONFIDENT";
  readonly recentTrend: "IMPROVING" | "STABLE" | "NEEDS_REVIEW";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizePriorProbabilities(
  options: readonly CollectiveOptionInput[]
): number[] {
  const n = options.length;
  if (n === 0) return [];
  const raw = options.map((opt) =>
    typeof opt.priorProbability === "number" &&
    Number.isFinite(opt.priorProbability) &&
    opt.priorProbability > 0
      ? opt.priorProbability
      : 1 / n
  );
  const sum = raw.reduce((a, b) => a + b, 0);
  if (sum <= 0) return options.map(() => 1 / n);
  return raw.map((v) => v / sum);
}

/**
 * 참여 건별 정보 강도(기수적 선호 강도 × 신뢰도 × 숙련도 × 시간감쇠) 계산
 */
function computeSignalWeight(
  signal: CollectiveParticipationSignal,
  referenceNowMs: number,
  halfLifeDays: number
): number {
  const stake = Math.max(10, Number(signal.stakeAmount) || 100);
  const confidence = clamp(signal.confidence ?? 0.5, 0.1, 0.99);
  const skill = clamp(signal.skillWeight ?? 1.0, 0.65, 1.75);

  // 로그 스케일 경제적 강도: 소액 다수 시민의 신호를 보장하면서 고액 왜곡 방지
  const stakeIntensity = Math.log1p(stake / 500);
  // 확신도 중심 보정 (0.5 기준 ~0.9, 0.95 기준 ~1.62)
  const confidenceMultiplier = 0.4 + 1.3 * confidence;

  let timeDecay = 1.0;
  if (signal.createdAt && halfLifeDays > 0) {
    const ts = new Date(signal.createdAt).getTime();
    if (Number.isFinite(ts) && ts <= referenceNowMs) {
      const ageDays = (referenceNowMs - ts) / (1000 * 60 * 60 * 24);
      timeDecay = Math.exp((-Math.LN2 * ageDays) / halfLifeDays);
    }
  }

  return Math.max(0.05, stakeIntensity * confidenceMultiplier * skill * timeDecay);
}

/**
 * 1. 순차 베이지안 사후확률 엔진 (Dirichlet-Multinomial Conjugate Update)
 *
 * Prior 강도(alpha_0) 위에 각 참여의 정보 가중치를 순차 누적해
 * 소표본 시 극단 확률 폭주를 막고, 시간 감쇠와 예측자 스킬을 사후 확률에 반영합니다.
 */
export function computeBayesianMarketPosterior(
  options: readonly CollectiveOptionInput[],
  signals: readonly CollectiveParticipationSignal[],
  config?: {
    /** 사전 분포 총 강도 (가상 표본 수, 기본: 옵션 수 * 4.5) */
    priorStrength?: number;
    /** 시간 감쇠 반감기(일), 기본 14일 */
    halfLifeDays?: number;
    /** 기준 시각 (테스트 결정론 보장용) */
    now?: Date;
  }
): BayesianMarketPosteriorResult {
  const count = options.length;
  if (count === 0) {
    return {
      options: [],
      effectiveEvidenceStrength: 0,
      normalizedEntropy: 1,
      totalPriorStrength: 0,
      isLowSampleStabilized: true,
    };
  }

  const priors = normalizePriorProbabilities(options);
  const totalPriorStrength = clamp(
    config?.priorStrength ?? Math.max(8, count * 4.5),
    2,
    100
  );
  const halfLifeDays = config?.halfLifeDays ?? 14;
  const nowMs = (config?.now ?? new Date()).getTime();

  const optionIndexMap = new Map<string, number>();
  options.forEach((opt, idx) => optionIndexMap.set(opt.id, idx));

  const priorAlphas = priors.map((p) => p * totalPriorStrength);
  const evidenceAlphas = new Array<number>(count).fill(0);
  const rawVolumes = new Array<number>(count).fill(0);
  const rawCounts = new Array<number>(count).fill(0);

  let effectiveEvidenceStrength = 0;

  for (const sig of signals) {
    const targetIdx = optionIndexMap.get(sig.selectedOptionId);
    if (targetIdx === undefined) continue;

    const w = computeSignalWeight(sig, nowMs, halfLifeDays);
    const stake = Math.max(0, Number(sig.stakeAmount) || 0);

    rawVolumes[targetIdx] += stake;
    rawCounts[targetIdx] += 1;

    // 명시적 비선호(avoidOptionId)가 있으면 선택 옵션 가중치를 그대로 유지하되,
    // 여분의 음성 증거를 나머지 대안들에 균등 재분배하여 비선호 신호를 확률에 반영
    if (
      count >= 3 &&
      sig.avoidOptionId &&
      sig.avoidOptionId !== sig.selectedOptionId &&
      optionIndexMap.has(sig.avoidOptionId)
    ) {
      const avoidIdx = optionIndexMap.get(sig.avoidOptionId)!;
      const primaryW = w * 0.85;
      const avoidSpread = (w * 0.15) / Math.max(1, count - 2);
      evidenceAlphas[targetIdx] += primaryW;
      for (let k = 0; k < count; k++) {
        if (k !== targetIdx && k !== avoidIdx) {
          evidenceAlphas[k] += avoidSpread;
        }
      }
      effectiveEvidenceStrength += w;
    } else {
      evidenceAlphas[targetIdx] += w;
      effectiveEvidenceStrength += w;
    }
  }

  const posteriorAlphas = priorAlphas.map((p, idx) => p + evidenceAlphas[idx]);
  const totalAlpha = posteriorAlphas.reduce((a, b) => a + b, 0);
  const totalRawVolume = rawVolumes.reduce((a, b) => a + b, 0);

  // 정규화 Shannon 엔트로피 계산
  let entropy = 0;
  const maxEntropy = count > 1 ? Math.log(count) : 1;

  const optionResults: BayesianOptionPosterior[] = options.map((opt, idx) => {
    const alpha = posteriorAlphas[idx];
    const mean = totalAlpha > 0 ? alpha / totalAlpha : 1 / count;

    if (mean > 0 && count > 1) {
      entropy -= mean * Math.log(mean);
    }

    // Dirichlet 주변분포(Beta(alpha, totalAlpha - alpha)) 표준편차 기반 95% 신뢰구간
    const variance =
      totalAlpha > 0
        ? (alpha * Math.max(0, totalAlpha - alpha)) /
          (totalAlpha * totalAlpha * (totalAlpha + 1))
        : 0;
    const margin = 1.96 * Math.sqrt(variance);
    const lower = Number(clamp(mean - margin, 0.005, 0.995).toFixed(4));
    const upper = Number(clamp(mean + margin, 0.005, 0.995).toFixed(4));

    const rawVolProb =
      totalRawVolume > 0 ? rawVolumes[idx] / totalRawVolume : priors[idx];

    return {
      optionId: opt.id,
      label: opt.label,
      bayesianProbability: Number(clamp(mean, 0.01, 0.99).toFixed(4)),
      priorProbability: Number(priors[idx].toFixed(4)),
      rawVolumeProbability: Number(clamp(rawVolProb, 0.01, 0.99).toFixed(4)),
      posteriorAlpha: Number(alpha.toFixed(3)),
      credibleInterval: [lower, upper],
      rawVolume: rawVolumes[idx],
      rawCount: rawCounts[idx],
    };
  });

  // 반올림 오차 정규화 (최종 합이 1.0이 되도록)
  const probSum = optionResults.reduce((acc, o) => acc + o.bayesianProbability, 0);
  const normalizedOptions =
    probSum > 0 && Math.abs(probSum - 1) > 0.0005
      ? optionResults.map((o) => ({
          ...o,
          bayesianProbability: Number((o.bayesianProbability / probSum).toFixed(4)),
        }))
      : optionResults;

  return {
    options: normalizedOptions,
    effectiveEvidenceStrength: Number(effectiveEvidenceStrength.toFixed(2)),
    normalizedEntropy:
      count > 1 ? Number(clamp(entropy / maxEntropy, 0, 1).toFixed(4)) : 0,
    totalPriorStrength: Number(totalPriorStrength.toFixed(2)),
    isLowSampleStabilized: effectiveEvidenceStrength < totalPriorStrength * 0.75,
  };
}

/**
 * 1-B. 시계열 베이지안 사후확률 추이 생성
 * 시간 순으로 유입되는 참여 신호마다 베이지안 사후확률을 스냅샷으로 기록합니다.
 */
export function computeBayesianPosteriorTimeline(
  options: readonly CollectiveOptionInput[],
  signals: readonly CollectiveParticipationSignal[],
  priorStrength?: number
): Array<{ time: string; [optionId: string]: string | number }> {
  if (options.length === 0 || signals.length === 0) return [];

  const sortedSignals = [...signals].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

  const priors = normalizePriorProbabilities(options);
  const alpha0 = clamp(priorStrength ?? Math.max(8, options.length * 4.5), 2, 100);
  const alphas = priors.map((p) => p * alpha0);
  const optionIndexMap = new Map<string, number>();
  options.forEach((opt, idx) => optionIndexMap.set(opt.id, idx));

  const timeline: Array<{ time: string; [optionId: string]: string | number }> = [];

  // 시작점 (Prior 분포)
  const firstDate = sortedSignals[0]?.createdAt
    ? new Date(sortedSignals[0].createdAt)
    : new Date();
  const priorDate = new Date(firstDate.getTime() - 5 * 60 * 1000);
  const startPoint: { time: string; [optionId: string]: string | number } = {
    time: priorDate.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
  options.forEach((opt, idx) => {
    startPoint[opt.id] = Math.round(priors[idx] * 100);
  });
  timeline.push(startPoint);

  const lastDate = sortedSignals[sortedSignals.length - 1]?.createdAt
    ? new Date(sortedSignals[sortedSignals.length - 1].createdAt!)
    : new Date();
  const refNowMs = lastDate.getTime();

  for (const sig of sortedSignals) {
    const idx = optionIndexMap.get(sig.selectedOptionId);
    if (idx === undefined) continue;

    const w = computeSignalWeight(sig, refNowMs, 14);
    alphas[idx] += w;
    const sum = alphas.reduce((a, b) => a + b, 0);

    const t = sig.createdAt ? new Date(sig.createdAt) : new Date();
    const point: { time: string; [optionId: string]: string | number } = {
      time: t.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    let pctSum = 0;
    options.forEach((opt, i) => {
      if (i === options.length - 1) {
        point[opt.id] = Math.max(1, 100 - pctSum);
      } else {
        const pct = Math.max(1, Math.round((alphas[i] / sum) * 100));
        point[opt.id] = pct;
        pctSum += pct;
      }
    });

    timeline.push(point);
  }

  return timeline;
}

/**
 * 2. 콩도르세(Condorcet) 쌍대 비교 & 보르다(Borda) 카운트 + 애로우 역설 탐지
 *
 * 단순 1순위 다수결에서 누락되는 "차순위" 및 "비선호(최하위 기피)" 정보를 결합해
 * - 보르다 합의 순위
 * - 1:1 쌍대 비교 승률 매트릭스 및 콩도르세 승자
 * - 순환 역설(Condorcet Paradox) 및 다수결-합의 괴리 알림
 * 을 계산합니다.
 */
export function analyzeSocialChoiceAggregation(
  options: readonly CollectiveOptionInput[],
  signals: readonly CollectiveParticipationSignal[]
): SocialChoiceAnalysisResult {
  const m = options.length;
  if (m === 0) {
    return {
      pluralityWinnerId: null,
      bordaWinnerId: null,
      condorcetWinnerId: null,
      hasCondorcetCycle: false,
      arrowDivergenceAlert: null,
      bordaRanking: [],
      pairwiseMatrix: [],
      explicitRankedVoteCount: 0,
      totalSignalCount: 0,
    };
  }

  const validOptionIds = new Set(options.map((o) => o.id));
  const labelMap = new Map(options.map((o) => [o.id, o.label]));

  const pluralityWeights = new Map<string, number>();
  const bordaTotals = new Map<string, number>();
  const firstChoiceWeights = new Map<string, number>();
  const avoidWeights = new Map<string, number>();
  const pairwiseWins = new Map<string, number>(); // key: `${a}::${b}`

  options.forEach((opt) => {
    pluralityWeights.set(opt.id, 0);
    bordaTotals.set(opt.id, 0);
    firstChoiceWeights.set(opt.id, 0);
    avoidWeights.set(opt.id, 0);
  });

  let totalWeight = 0;
  let explicitRankedVoteCount = 0;
  let validSignalCount = 0;

  for (const sig of signals) {
    if (!validOptionIds.has(sig.selectedOptionId)) continue;
    validSignalCount += 1;

    const stake = Math.max(10, Number(sig.stakeAmount) || 100);
    const confidence = clamp(sig.confidence ?? 0.5, 0.1, 0.99);
    const skill = clamp(sig.skillWeight ?? 1.0, 0.65, 1.75);

    // 기수적 선호 강도 (Cardinal Intensity): 확신도와 로그 참여량 결합
    const voterWeight =
      (0.5 + confidence) * Math.log1p(stake / 250) * skill;
    totalWeight += voterWeight;

    // 단순 다수결 1순위 적립
    pluralityWeights.set(
      sig.selectedOptionId,
      (pluralityWeights.get(sig.selectedOptionId) ?? 0) + stake
    );
    firstChoiceWeights.set(
      sig.selectedOptionId,
      (firstChoiceWeights.get(sig.selectedOptionId) ?? 0) + voterWeight
    );

    const hasExplicitRank = Boolean(
      (sig.rankedOptionIds && sig.rankedOptionIds.length >= 2) ||
        (sig.avoidOptionId &&
          sig.avoidOptionId !== sig.selectedOptionId &&
          validOptionIds.has(sig.avoidOptionId))
    );
    if (hasExplicitRank) {
      explicitRankedVoteCount += 1;
    }

    // 개별 참여자의 옵션별 순위 점수 (높을수록 선호: top = m-1, bottom = 0)
    const optionScoreMap = new Map<string, number>();

    if (sig.rankedOptionIds && sig.rankedOptionIds.length >= 2) {
      // 명시적 선호 순위 리스트가 제공된 경우
      const dedupedOrder: string[] = [];
      for (const id of [sig.selectedOptionId, ...sig.rankedOptionIds]) {
        if (validOptionIds.has(id) && !dedupedOrder.includes(id)) {
          dedupedOrder.push(id);
        }
      }
      if (
        sig.avoidOptionId &&
        validOptionIds.has(sig.avoidOptionId) &&
        dedupedOrder.includes(sig.avoidOptionId) &&
        dedupedOrder.length > 2
      ) {
        // 비선호로 지정된 항목이 중간에 있다면 최하위로 배치
        const filtered = dedupedOrder.filter((id) => id !== sig.avoidOptionId);
        filtered.push(sig.avoidOptionId);
        dedupedOrder.splice(0, dedupedOrder.length, ...filtered);
      }

      const assignedCount = dedupedOrder.length;
      dedupedOrder.forEach((id, rankIdx) => {
        optionScoreMap.set(id, m - 1 - rankIdx);
      });

      // 미지정 나머지 옵션들은 남은 하위 점수 평균으로 공정 배분
      const remaining = options
        .map((o) => o.id)
        .filter((id) => !optionScoreMap.has(id));
      if (remaining.length > 0) {
        const remainingMaxScore = m - 1 - assignedCount;
        const avgRemainingScore =
          (remainingMaxScore + (remainingMaxScore - remaining.length + 1)) / 2;
        remaining.forEach((id) => optionScoreMap.set(id, avgRemainingScore));
      }

      const lastId = dedupedOrder[dedupedOrder.length - 1];
      if (lastId && lastId !== sig.selectedOptionId) {
        avoidWeights.set(lastId, (avoidWeights.get(lastId) ?? 0) + voterWeight);
      }
    } else if (
      sig.avoidOptionId &&
      sig.avoidOptionId !== sig.selectedOptionId &&
      validOptionIds.has(sig.avoidOptionId) &&
      m >= 3
    ) {
      // 최선호(1순위) + 최하위 기피(비선호) 옵션만 지정한 경우 (부분 순위 보르다)
      optionScoreMap.set(sig.selectedOptionId, m - 1);
      optionScoreMap.set(sig.avoidOptionId, 0);
      avoidWeights.set(
        sig.avoidOptionId,
        (avoidWeights.get(sig.avoidOptionId) ?? 0) + voterWeight
      );
      const middleIds = options
        .map((o) => o.id)
        .filter(
          (id) => id !== sig.selectedOptionId && id !== sig.avoidOptionId
        );
      const midAvgScore = (m - 2 + 1) / 2;
      middleIds.forEach((id) => optionScoreMap.set(id, midAvgScore));
    } else {
      // 단일 선택만 입력한 경우: 1순위에 (m-1), 나머지 대안은 중립 평균점수 부여
      optionScoreMap.set(sig.selectedOptionId, m - 1);
      const otherAvg = m > 1 ? (m - 2) / 2 : 0;
      options.forEach((o) => {
        if (o.id !== sig.selectedOptionId) {
          optionScoreMap.set(o.id, otherAvg);
        }
      });
    }

    // 보르다 총점 합산
    for (const opt of options) {
      const pts = optionScoreMap.get(opt.id) ?? 0;
      bordaTotals.set(
        opt.id,
        (bordaTotals.get(opt.id) ?? 0) + pts * voterWeight
      );
    }

    // 콩도르세 쌍대 비교 누적
    for (let i = 0; i < m; i++) {
      for (let j = i + 1; j < m; j++) {
        const optA = options[i].id;
        const optB = options[j].id;
        const scoreA = optionScoreMap.get(optA) ?? 0;
        const scoreB = optionScoreMap.get(optB) ?? 0;

        if (scoreA > scoreB) {
          const key = `${optA}::${optB}`;
          pairwiseWins.set(key, (pairwiseWins.get(key) ?? 0) + voterWeight);
        } else if (scoreB > scoreA) {
          const key = `${optB}::${optA}`;
          pairwiseWins.set(key, (pairwiseWins.get(key) ?? 0) + voterWeight);
        } else {
          // 동순위는 0.5씩 배분
          const keyAB = `${optA}::${optB}`;
          const keyBA = `${optB}::${optA}`;
          pairwiseWins.set(
            keyAB,
            (pairwiseWins.get(keyAB) ?? 0) + voterWeight * 0.5
          );
          pairwiseWins.set(
            keyBA,
            (pairwiseWins.get(keyBA) ?? 0) + voterWeight * 0.5
          );
        }
      }
    }
  }

  // 단순 다수결 1위
  const sortedPlurality = [...options].sort(
    (a, b) => (pluralityWeights.get(b.id) ?? 0) - (pluralityWeights.get(a.id) ?? 0)
  );
  const pluralityWinnerId =
    validSignalCount > 0 ? sortedPlurality[0]?.id ?? null : null;

  // 보르다 순위표 산출
  const maxPossibleBorda = Math.max(0.0001, (m - 1) * totalWeight);
  const bordaSorted = [...options]
    .map((opt) => {
      const pts = bordaTotals.get(opt.id) ?? 0;
      const firstShare =
        totalWeight > 0 ? (firstChoiceWeights.get(opt.id) ?? 0) / totalWeight : 0;
      const avoidShare =
        totalWeight > 0 ? (avoidWeights.get(opt.id) ?? 0) / totalWeight : 0;
      return {
        optionId: opt.id,
        label: opt.label,
        bordaPoints: Number(pts.toFixed(2)),
        normalizedScore:
          validSignalCount > 0
            ? Number(clamp((pts / maxPossibleBorda) * 100, 0, 100).toFixed(1))
            : Number((100 / m).toFixed(1)),
        firstChoiceShare: Number(firstShare.toFixed(4)),
        avoidPenaltyShare: Number(avoidShare.toFixed(4)),
      };
    })
    .sort((a, b) => b.bordaPoints - a.bordaPoints)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

  const bordaWinnerId = validSignalCount > 0 ? bordaSorted[0]?.optionId ?? null : null;

  // 콩도르세 쌍대 비교 매트릭스 & 승자 / 순환 역설 탐지
  const pairwiseMatrix: CondorcetPairwiseCell[] = [];
  const winCountByOption = new Map<string, number>();
  options.forEach((o) => winCountByOption.set(o.id, 0));

  for (let i = 0; i < m; i++) {
    for (let j = i + 1; j < m; j++) {
      const optA = options[i].id;
      const optB = options[j].id;
      const aScore = pairwiseWins.get(`${optA}::${optB}`) ?? 0;
      const bScore = pairwiseWins.get(`${optB}::${optA}`) ?? 0;
      const denom = aScore + bScore;
      const aWinRate = denom > 0 ? aScore / denom : 0.5;

      pairwiseMatrix.push({
        optionAId: optA,
        optionBId: optB,
        aBeatsBScore: Number(aScore.toFixed(2)),
        bBeatsAScore: Number(bScore.toFixed(2)),
        aWinRate: Number(aWinRate.toFixed(4)),
      });

      if (aScore > bScore) {
        winCountByOption.set(optA, (winCountByOption.get(optA) ?? 0) + 1);
      } else if (bScore > aScore) {
        winCountByOption.set(optB, (winCountByOption.get(optB) ?? 0) + 1);
      }
    }
  }

  let condorcetWinnerId: string | null = null;
  if (validSignalCount > 0) {
    for (const [id, wins] of winCountByOption.entries()) {
      if (wins === m - 1 && m >= 2) {
        condorcetWinnerId = id;
        break;
      }
    }
  }

  // 3개 이상 대안에서 모든 쌍에서 이긴 콩도르세 승자가 없으면 애로우/콩도르세 순환 역설 가능성 체크
  const hasCycleTriple = (() => {
    if (validSignalCount === 0 || m < 3 || condorcetWinnerId !== null) {
      return false;
    }
    const beats = (x: string, y: string) => {
      const xScore = pairwiseWins.get(`${x}::${y}`) ?? 0;
      const yScore = pairwiseWins.get(`${y}::${x}`) ?? 0;
      return xScore > yScore;
    };
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        if (i === j) continue;
        for (let k = 0; k < m; k++) {
          if (k === i || k === j) continue;
          const a = options[i].id;
          const b = options[j].id;
          const c = options[k].id;
          if (beats(a, b) && beats(b, c) && beats(c, a)) {
            return true;
          }
        }
      }
    }
    return false;
  })();

  let arrowDivergenceAlert: string | null = null;
  if (hasCycleTriple) {
    arrowDivergenceAlert =
      "콩도르세 순환 역설(Condorcet Cycle)이 감지되었습니다. 단순 다수결 대신 비선호까지 반영한 보르다 합의 점수를 함께 참고하세요.";
  } else if (
    pluralityWinnerId &&
    bordaWinnerId &&
    pluralityWinnerId !== bordaWinnerId
  ) {
    const pLabel = labelMap.get(pluralityWinnerId) ?? pluralityWinnerId;
    const bLabel = labelMap.get(bordaWinnerId) ?? bordaWinnerId;
    arrowDivergenceAlert = `단순 1순위 다수결 선두('${pLabel}')와 비선호 페널티를 반영한 보르다 합의 1위('${bLabel}')가 엇갈렸습니다.`;
  } else if (
    pluralityWinnerId &&
    condorcetWinnerId &&
    pluralityWinnerId !== condorcetWinnerId
  ) {
    const pLabel = labelMap.get(pluralityWinnerId) ?? pluralityWinnerId;
    const cLabel = labelMap.get(condorcetWinnerId) ?? condorcetWinnerId;
    arrowDivergenceAlert = `단순 볼륨 선두('${pLabel}')보다 모든 1:1 대결에서 우세한 콩도르세 승자('${cLabel}')가 존재합니다.`;
  }

  return {
    pluralityWinnerId,
    bordaWinnerId,
    condorcetWinnerId,
    hasCondorcetCycle: hasCycleTriple,
    arrowDivergenceAlert,
    bordaRanking: bordaSorted,
    pairwiseMatrix,
    explicitRankedVoteCount,
    totalSignalCount: validSignalCount,
  };
}

/**
 * 3. 경험의 편향(Experience Bias) 실시간 탐지 & 디바이어싱 코치
 *
 * "중환자실 의사는 왜 저축 안 할까?"가 보여주는 소표본/가용성/최근/과신 편향을 정량화해
 * 참여 직전 사용자에게 객관적 기저율과 반대 진영 논거 확인을 유도합니다.
 */
export function evaluateExperienceBias(
  input: ExperienceBiasEvaluationInput
): ExperienceBiasReport {
  const confidence = clamp(input.confidence, 0.05, 0.99);
  const marketProb = clamp(input.marketBayesianProbability, 0.01, 0.99);
  const priorProb = clamp(input.optionPriorProbability, 0.01, 0.99);
  const nudges: string[] = [];

  // 1) 과신 편향 (Overconfidence): 시장 사후확률 대비 과도한 확신도 또는 과거 과신 패턴
  const marketDeviation = Math.max(0, confidence - marketProb);
  const historicalOverconfidence =
    (input.userPastSettledCount ?? 0) >= 3 && (input.userCalibrationGap ?? 0) > 0.08
      ? clamp((input.userCalibrationGap ?? 0) * 1.6, 0, 0.45)
      : 0;
  const overconfidenceRisk = Number(
    clamp(
      (confidence >= 0.85 ? 0.25 : 0) +
        marketDeviation * 0.9 +
        historicalOverconfidence,
      0,
      1
    ).toFixed(3)
  );

  // 2) 군중 쏠림 / 최근 편향 (Herding & Recency Bias)
  const recentShare = input.recentOptionShare ?? marketProb;
  const herdingGap = Math.max(0, recentShare - priorProb);
  const herdingBiasRisk = Number(
    clamp(
      recentShare > 0.72 && confidence > 0.7
        ? 0.35 + herdingGap * 0.9
        : herdingGap * 0.85,
      0,
      1
    ).toFixed(3)
  );

  // 3) 기저율 무시 / 소표본 경험 편향 (Base-Rate Neglect & Experience Bias)
  const lowSamplePenalty = input.totalParticipants < 12 ? 0.25 : 0.05;
  const baseRateGap = Math.abs(confidence - priorProb);
  const baseRateNeglectRisk = Number(
    clamp(
      confidence > 0.75 && priorProb < 0.45
        ? lowSamplePenalty + baseRateGap * 1.15
        : lowSamplePenalty * 0.5 + baseRateGap * 0.55,
      0,
      1
    ).toFixed(3)
  );

  const overallBiasScore = Number(
    clamp(
      overconfidenceRisk * 0.4 +
        herdingBiasRisk * 0.3 +
        baseRateNeglectRisk * 0.3,
      0,
      1
    ).toFixed(3)
  );

  if (overconfidenceRisk >= 0.45) {
    nudges.push(
      `확신도(${Math.round(confidence * 100)}%)가 현재 시장 베이지안 확률(${Math.round(marketProb * 100)}%)보다 크게 높습니다. 반대 진영 논거(AI 균형 브리핑)를 먼저 점검해 보세요.`
    );
  }
  if (herdingBiasRisk >= 0.45) {
    nudges.push(
      "최근 참여가 한쪽으로 급격히 쏠리는 군중심리 구간입니다. 단기 분위기 대신 객관 지표를 확인하세요."
    );
  }
  if (baseRateNeglectRisk >= 0.45) {
    nudges.push(
      `표본(${input.totalParticipants}명)이 적거나 초기 기저율(${Math.round(priorProb * 100)}%) 대비 극단적 확신 상태입니다. 제한된 개인 경험에만 의존하는 '확률의 함정'에 유의하세요.`
    );
  }
  if (nudges.length === 0) {
    nudges.push(
      "시장 베이지안 합의 및 기저율과 조화로운 균형적 확률 판단입니다."
    );
  }

  const riskLevel: "LOW" | "MEDIUM" | "HIGH" =
    overallBiasScore >= 0.6
      ? "HIGH"
      : overallBiasScore >= 0.35
      ? "MEDIUM"
      : "LOW";

  return {
    overconfidenceRisk,
    herdingBiasRisk,
    baseRateNeglectRisk,
    overallBiasScore,
    riskLevel,
    nudges,
  };
}

/**
 * 4-A. 정산 단건 Brier Score · Log Loss · Calibration 측정
 */
export function computeBrierLearningUpdate(
  record: SettledPredictionRecord
): BrierLearningResult {
  const m = Math.max(2, record.optionCount || 2);
  const conf = clamp(record.confidence || 0.5, 0.05, 0.99);
  const isCorrect = record.selectedOptionId === record.correctOptionId;

  // 선택 옵션에 conf 확률, 나머지 (m-1)개 옵션에 (1-conf)/(m-1) 배분 후 멀티클래스 Brier Score 계산
  const otherProb = (1 - conf) / (m - 1);
  let brierRaw = 0;
  if (isCorrect) {
    brierRaw = Math.pow(conf - 1, 2) + (m - 1) * Math.pow(otherProb - 0, 2);
  } else {
    brierRaw =
      Math.pow(conf - 0, 2) +
      Math.pow(otherProb - 1, 2) +
      Math.max(0, m - 2) * Math.pow(otherProb - 0, 2);
  }

  // 최대치(최악 점수 = 2.0)로 정규화해 [0, 1] 범위 산출
  const brierScore = Number(clamp(brierRaw / 2, 0, 1).toFixed(4));
  const assignedTrueProb = isCorrect ? conf : Math.max(0.01, otherProb);
  const logLoss = Number((-Math.log(assignedTrueProb)).toFixed(4));
  const calibrationGap = Number((conf - (isCorrect ? 1 : 0)).toFixed(4));
  const accuracyQuality = Number(clamp(1 - brierScore, 0, 1).toFixed(4));

  return {
    brierScore,
    logLoss,
    isCorrect,
    calibrationGap,
    accuracyQuality,
  };
}

/**
 * 4-B. 개인 지속적 학습 프로필 요약 (Bayesian Skill Weight 산출)
 * 경험이 축적될수록 Brier 정확도와 Calibration 수준에 따라 베이지안 정보 가중치(skillWeight)를 갱신합니다.
 */
export function summarizeUserLearningProfile(
  records: readonly SettledPredictionRecord[]
): UserLearningProfileSummary {
  if (records.length === 0) {
    return {
      settledCount: 0,
      winRate: 0,
      averageConfidence: 0.5,
      averageBrierScore: 0.25,
      averageLogLoss: 0.6931,
      calibrationGap: 0,
      skillWeight: 1.0,
      calibrationStatus: "INSUFFICIENT_DATA",
      recentTrend: "STABLE",
    };
  }

  const ordered = [...records].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

  const evaluated = ordered.map(computeBrierLearningUpdate);
  const count = evaluated.length;

  const wins = evaluated.filter((r) => r.isCorrect).length;
  const winRate = wins / count;
  const avgConfidence =
    ordered.reduce((s, r) => s + clamp(r.confidence || 0.5, 0.05, 0.99), 0) /
    count;
  const avgBrier =
    evaluated.reduce((s, r) => s + r.brierScore, 0) / count;
  const avgLogLoss =
    evaluated.reduce((s, r) => s + r.logLoss, 0) / count;
  const calibrationGap = avgConfidence - winRate;

  // EMA 기반 최근 정확도 품질 + 표본 수축(Laplace/Empirical Bayes Shrinkage)
  // 초기 1~2회 우연한 적중으로 가중치가 급등하는 '경험 편향' 방지
  let emaQuality = 0.75; // 중립 사전 기준점
  for (const ev of evaluated) {
    emaQuality = 0.7 * emaQuality + 0.3 * ev.accuracyQuality;
  }
  const shrinkage = count / (count + 4);
  const baselineBrierQuality = 0.75;
  const effectiveQuality =
    shrinkage * emaQuality + (1 - shrinkage) * baselineBrierQuality;

  // Calibration 페널티: 과신 괴리가 크면 정보 가중치 감쇠
  const calibrationPenalty = Math.max(0, Math.abs(calibrationGap) - 0.12) * 0.5;
  const rawSkillWeight = 0.65 + (effectiveQuality - 0.5) * 2.2 - calibrationPenalty;
  const skillWeight = Number(clamp(rawSkillWeight, 0.65, 1.75).toFixed(3));

  const calibrationStatus: UserLearningProfileSummary["calibrationStatus"] =
    count < 3
      ? "INSUFFICIENT_DATA"
      : calibrationGap > 0.12
      ? "OVERCONFIDENT"
      : calibrationGap < -0.12
      ? "UNDERCONFIDENT"
      : "WELL_CALIBRATED";

  let recentTrend: UserLearningProfileSummary["recentTrend"] = "STABLE";
  if (count >= 4) {
    const mid = Math.floor(count / 2);
    const earlyBrier =
      evaluated.slice(0, mid).reduce((s, r) => s + r.brierScore, 0) / mid;
    const lateBrier =
      evaluated.slice(mid).reduce((s, r) => s + r.brierScore, 0) / (count - mid);
    if (earlyBrier - lateBrier >= 0.04) {
      recentTrend = "IMPROVING";
    } else if (lateBrier - earlyBrier >= 0.05) {
      recentTrend = "NEEDS_REVIEW";
    }
  }

  return {
    settledCount: count,
    winRate: Number(winRate.toFixed(4)),
    averageConfidence: Number(avgConfidence.toFixed(4)),
    averageBrierScore: Number(avgBrier.toFixed(4)),
    averageLogLoss: Number(avgLogLoss.toFixed(4)),
    calibrationGap: Number(calibrationGap.toFixed(4)),
    skillWeight,
    calibrationStatus,
    recentTrend,
  };
}

