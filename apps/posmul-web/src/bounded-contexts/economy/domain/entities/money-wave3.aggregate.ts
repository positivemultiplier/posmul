/**
 * MoneyWave3 Aggregate - 기업가 생태계 구축 시스템
 *
 * Schumpeter 창조적 파괴론과 Kirzner 기업가정신을 적용하여
 * 혁신적 기업가들을 위한 경제 생태계를 구축하는 메커니즘입니다.
 *
 * 핵심 불변성:
 * - 기업가 등록은 혁신성과 실행가능성 검증 필수
 * - 투자 배분은 포트폴리오 다양화 원칙 준수
 * - 성과 기반 PmcAmount 보상 시스템
 * - 벤처 실패율을 고려한 리스크 관리
 */
import { UserId } from "@posmul/auth-economy-sdk";
import { Result } from "@posmul/auth-economy-sdk";
import { DomainError } from "@posmul/auth-economy-sdk";

// SDK로 마이그레이션 완료
import {
  MoneyWaveId,
  PmcAmount,
  createPmcAmount,
  unwrapPmcAmount,
} from "../value-objects";

export interface EntrepreneurProfile {
  readonly userId: UserId;
  readonly innovationScore: number; // 0-1 사이값 (Schumpeter 지수)
  readonly executionCapability: number; // 0-1 사이값 (Kirzner 지수)
  readonly riskTolerance: number; // 0-1 사이값
  readonly previousVentures: VentureHistory[];
  readonly socialNetworkStrength: number; // 네트워크 효과 활용도
  readonly registeredAt: Date;
}

export interface VentureHistory {
  readonly ventureId: string;
  readonly outcome: VentureOutcome;
  readonly roiAchieved: number;
  readonly lessonsLearned: string[];
  readonly completedAt: Date;
}

export enum VentureOutcome {
  SUCCESS = "SUCCESS",
  PARTIAL_SUCCESS = "PARTIAL_SUCCESS",
  FAILURE = "FAILURE",
  ONGOING = "ONGOING",
}

export interface VentureProposal {
  readonly proposalId: string;
  readonly entrepreneurId: UserId;
  readonly title: string;
  readonly description: string;
  readonly requiredInvestment: PmcAmount;
  readonly expectedROI: number;
  readonly timeHorizon: number; // 예상 실행 기간 (개월)
  readonly innovationLevel: number; // Schumpeter 파괴도
  readonly marketSize: number;
  readonly competitiveAdvantage: string[];
  readonly riskFactors: string[];
  readonly milestones: VentureMilestone[];
  readonly submittedAt: Date;
}

export interface VentureMilestone {
  readonly milestoneId: string;
  readonly description: string;
  readonly targetDate: Date;
  readonly successCriteria: string[];
  readonly pmcReward: PmcAmount;
}

export interface InvestmentAllocation {
  readonly proposalId: string;
  readonly allocatedAmount: PmcAmount;
  readonly allocationRatio: number; // ?�체 ?�자 ?��?비율
  readonly expectedReturn: number;
  readonly riskWeighting: number;
  readonly diversificationScore: number;
}

export interface EcosystemMetrics {
  readonly totalEntrepreneurs: number;
  readonly activeVentures: number;
  readonly totalInvestment: PmcAmount;
  readonly averageROI: number;
  readonly successRate: number;
  readonly innovationIndex: number; // Schumpeter 지??
  readonly networkDensity: number;
  readonly creativeDestructionLevel: number;
}

export interface VentureEvent {
  readonly eventId: string;
  readonly ventureProposalId: string;
  readonly eventType: VentureEventType;
  readonly milestone: VentureMilestone | null;
  readonly pmcRewarded: PmcAmount;
  readonly innovationContribution: number;
  readonly executedAt: Date;
  readonly impact: string;
}

export enum VentureEventType {
  PROPOSAL_SUBMITTED = "PROPOSAL_SUBMITTED",
  INVESTMENT_APPROVED = "INVESTMENT_APPROVED",
  MILESTONE_ACHIEVED = "MILESTONE_ACHIEVED",
  MILESTONE_FAILED = "MILESTONE_FAILED",
  VENTURE_SUCCESS = "VENTURE_SUCCESS",
  VENTURE_FAILURE = "VENTURE_FAILURE",
  INNOVATION_BREAKTHROUGH = "INNOVATION_BREAKTHROUGH",
}

export enum MoneyWave3Status {
  ECOSYSTEM_BUILDING = "ECOSYSTEM_BUILDING",
  RECRUITING_ENTREPRENEURS = "RECRUITING_ENTREPRENEURS",
  EVALUATING_PROPOSALS = "EVALUATING_PROPOSALS",
  ALLOCATING_INVESTMENTS = "ALLOCATING_INVESTMENTS",
  MONITORING_VENTURES = "MONITORING_VENTURES",
  REWARDING_ACHIEVEMENTS = "REWARDING_ACHIEVEMENTS",
  COMPLETED = "COMPLETED",
  SUSPENDED = "SUSPENDED",
}

export class MoneyWave3Aggregate {
  private constructor(
    private readonly id: MoneyWaveId,
    private status: MoneyWave3Status,
    private entrepreneurs: EntrepreneurProfile[],
    private ventureProposals: VentureProposal[],
    private investmentAllocations: InvestmentAllocation[],
    private ventureEvents: VentureEvent[],
    private totalInvestmentPool: PmcAmount,
    private ecosystemMetrics: EcosystemMetrics,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    id: MoneyWaveId,
    initialInvestmentPool: PmcAmount
  ): Result<MoneyWave3Aggregate> {
    try {
      if (unwrapPmcAmount(initialInvestmentPool) <= 0) {
        return {
          success: false,
          error: new DomainError("INVALID_INVESTMENT_POOL"),
        };
      }

      const initialMetrics: EcosystemMetrics = {
        totalEntrepreneurs: 0,
        activeVentures: 0,
        totalInvestment: initialInvestmentPool,
        averageROI: 0,
        successRate: 0,
        innovationIndex: 0,
        networkDensity: 0,
        creativeDestructionLevel: 0,
      };

      const aggregate = new MoneyWave3Aggregate(
        id,
        MoneyWave3Status.ECOSYSTEM_BUILDING,
        [],
        [],
        [],
        [],
        initialInvestmentPool,
        initialMetrics,
        new Date(),
        new Date()
      );

      return { success: true, data: aggregate };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "error instanceof Error ? error.message : Unknown error"
        ),
      };
    }
  }

  /**
   * Schumpeter 창조적 파괴론 기반 기업가 등록
   */
  registerEntrepreneur(profile: EntrepreneurProfile): Result<void> {
    try {
      // 혁신성과 실행가능성 검증
      if (profile.innovationScore < 0 || profile.innovationScore > 1) {
        return {
          success: false,
          error: new DomainError("INVALID_INNOVATION_SCORE"),
        };
      }

      if (profile.executionCapability < 0 || profile.executionCapability > 1) {
        return {
          success: false,
          error: new DomainError("INVALID_EXECUTION_CAPABILITY"),
        };
      }

      // 중복 등록 검증
      const existingEntrepreneur = this.entrepreneurs.find(
        (entrepreneur) => entrepreneur.userId === profile.userId
      );

      if (existingEntrepreneur) {
        return {
          success: false,
          error: new DomainError("ENTREPRENEUR_ALREADY_REGISTERED"),
        };
      }

      // Schumpeter-Kirzner 복합 점수 계산
      const entrepreneurialPotential =
        this.calculateEntrepreneurialPotential(profile);

      if (entrepreneurialPotential < 0.3) {
        // 최소 기준
        return {
          success: false,
          error: new DomainError("INSUFFICIENT_ENTREPRENEURIAL_POTENTIAL"),
        };
      }

      // 기업가 등록
      this.entrepreneurs.push(profile);
      this.status = MoneyWave3Status.RECRUITING_ENTREPRENEURS;
      this.updateEcosystemMetrics();
      this.updatedAt = new Date();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "error instanceof Error ? error.message : Unknown error"
        ),
      };
    }
  }

  /**
   * 벤처 제안서 제출 및 검증
   */
  submitVentureProposal(proposal: VentureProposal): Result<void> {
    try {
      // 기업가 등록 확인
      const entrepreneur = this.entrepreneurs.find(
        (e) => e.userId === proposal.entrepreneurId
      );

      if (!entrepreneur) {
        return {
          success: false,
          error: new DomainError("ENTREPRENEUR_NOT_FOUND"),
        };
      }

      // 제안서 검증
      if (unwrapPmcAmount(proposal.requiredInvestment) <= 0) {
        return {
          success: false,
          error: new DomainError("INVALID_INVESTMENT_AMOUNT"),
        };
      }

      if (proposal.expectedROI <= 0) {
        return {
          success: false,
          error: new DomainError("INVALID_EXPECTED_ROI"),
        };
      }

      if (proposal.innovationLevel < 0 || proposal.innovationLevel > 1) {
        return {
          success: false,
          error: new DomainError("INVALID_INNOVATION_LEVEL"),
        };
      }

      // Schumpeter 창조적 파괴 잠재력 평가
      const destructivePotential =
        this.evaluateCreativeDestructionPotential(proposal);

      if (destructivePotential < 0.2) {
        // 최소 파괴력 기준
        return {
          success: false,
          error: new DomainError("INSUFFICIENT_CREATIVE_DESTRUCTION"),
        };
      }

      // 제안서 등록
      this.ventureProposals.push(proposal);
      this.status = MoneyWave3Status.EVALUATING_PROPOSALS;
      this.updatedAt = new Date();

      // 제출 이벤트 기록
      const submissionEvent: VentureEvent = {
        eventId: `submission_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        ventureProposalId: proposal.proposalId,
        eventType: VentureEventType.PROPOSAL_SUBMITTED,
        milestone: null,
        pmcRewarded: createPmcAmount(0),
        innovationContribution: destructivePotential,
        executedAt: new Date(),
        impact: `New venture proposal: ${proposal.title}`,
      };

      this.ventureEvents.push(submissionEvent);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "error instanceof Error ? error.message : Unknown error"
        ),
      };
    }
  }

  /**
   * 포트폴리오 다양화 원칙에 따른 투자 배분
   */
  allocateInvestments(): Result<InvestmentAllocation[]> {
    try {
      if (this.ventureProposals.length === 0) {
        return {
          success: false,
          error: new DomainError("NO_PROPOSALS"),
        };
      }

      // 총 투자 가능 금액 계산
      const availableInvestment = unwrapPmcAmount(this.totalInvestmentPool);

      // 포트폴리오 최적화 (Modern Portfolio Theory 적용)
      const allocations = this.optimizePortfolioAllocation(availableInvestment);

      // 다양화 검증
      const diversificationResult = this.validateDiversification(allocations);
      if (!diversificationResult.success) {
        return {
          success: false,
          error: new Error("처리에 실패했습니다."),
        };
      }

      // 배분 실행
      this.investmentAllocations = allocations;
      this.status = MoneyWave3Status.ALLOCATING_INVESTMENTS;
      this.updatedAt = new Date();

      // 투자 승인 이벤트들 생성
      for (const allocation of allocations) {
        const approvalEvent: VentureEvent = {
          eventId: `investment_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          ventureProposalId: allocation.proposalId,
          eventType: VentureEventType.INVESTMENT_APPROVED,
          milestone: null,
          pmcRewarded: createPmcAmount(0),
          innovationContribution: allocation.riskWeighting,
          executedAt: new Date(),
          impact: `Investment allocated: ${unwrapPmcAmount(
            allocation.allocatedAmount
          )} PmcAmount`,
        };

        this.ventureEvents.push(approvalEvent);
      }

      this.updateEcosystemMetrics();

      return { success: true, data: allocations };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "error instanceof Error ? error.message : Unknown error"
        ),
      };
    }
  }

  /**
   * 마일스톤 달성 시 PmcAmount 보상
   */
  rewardMilestoneAchievement(
    proposalId: string,
    milestoneId: string,
    actualImpact: number
  ): Result<VentureEvent> {
    try {
      // 제안서 확인
      const proposal = this.ventureProposals.find(
        (p) => p.proposalId === proposalId
      );
      if (!proposal) {
        return {
          success: false,
          error: new DomainError("PROPOSAL_NOT_FOUND"),
        };
      }

      // 마일스톤 확인
      const milestone = proposal.milestones.find(
        (m) => m.milestoneId === milestoneId
      );
      if (!milestone) {
        return {
          success: false,
          error: new DomainError("MILESTONE_NOT_FOUND"),
        };
      }

      // 실제 임팩트 기반 보상 계산 (성과 기반)
      const baseReward = unwrapPmcAmount(milestone.pmcReward);
      const impactMultiplier = Math.min(2.0, Math.max(0.5, actualImpact)); // 0.5x ~ 2.0x
      const finalReward = createPmcAmount(baseReward * impactMultiplier);

      // 보상 이벤트 생성
      const rewardEvent: VentureEvent = {
        eventId: `milestone_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        ventureProposalId: proposalId,
        eventType: VentureEventType.MILESTONE_ACHIEVED,
        milestone: milestone,
        pmcRewarded: finalReward,
        innovationContribution: actualImpact,
        executedAt: new Date(),
        impact: `Milestone achieved: ${milestone.description}`,
      };

      this.ventureEvents.push(rewardEvent);
      this.status = MoneyWave3Status.REWARDING_ACHIEVEMENTS;
      this.updateEcosystemMetrics();
      this.updatedAt = new Date();

      return { success: true, data: rewardEvent };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          "error instanceof Error ? error.message : Unknown error"
        ),
      };
    }
  }

  /**
   * Schumpeter-Kirzner 기업가정신 지수 계산
   */
  private calculateEntrepreneurialPotential(
    profile: EntrepreneurProfile
  ): number {
    // Schumpeter: 창조적 파괴 능력
    const schumpeterIndex = profile.innovationScore;

    // Kirzner: 기회 포착 및 실행 능력
    const kirznerIndex = profile.executionCapability;

    // 네트워크 효과 (Metcalfe's Law)
    const networkEffect = Math.min(1, profile.socialNetworkStrength);

    // 학습 곡선 (과거 벤처 경험)
    const experienceBonus = Math.min(
      0.3,
      profile.previousVentures.length * 0.1
    );

    return (
      schumpeterIndex * 0.4 +
      kirznerIndex * 0.4 +
      networkEffect * 0.2 +
      experienceBonus
    );
  }

  /**
   * 창조적 파괴 잠재력 평가
   */
  private evaluateCreativeDestructionPotential(
    proposal: VentureProposal
  ): number {
    // 혁신 수준 (Schumpeter 파괴도)
    const innovationWeight = proposal.innovationLevel * 0.4;

    // 시장 크기 영향
    const marketImpact = Math.min(1, proposal.marketSize / 1000000) * 0.3; // 정규화

    // 경쟁 우위 강도
    const competitiveAdvantage =
      Math.min(1, proposal.competitiveAdvantage.length / 5) * 0.3;

    return innovationWeight + marketImpact + competitiveAdvantage;
  }

  /**
   * 포트폴리오 최적화 (Modern Portfolio Theory)
   */
  private optimizePortfolioAllocation(
    totalInvestment: number
  ): InvestmentAllocation[] {
    const allocations: InvestmentAllocation[] = [];
    const totalRisk = this.ventureProposals.reduce(
      (sum, p) => sum + (1 - p.expectedROI),
      0
    );

    for (const proposal of this.ventureProposals) {
      // 리스크-수익 기반 배분
      const riskWeight = (1 - proposal.expectedROI) / totalRisk;
      const allocationRatio = Math.min(0.25, riskWeight); // 최대 25% 제한 (다양화)
      const allocatedAmount = createPmcAmount(
        totalInvestment * allocationRatio
      );

      allocations.push({
        proposalId: proposal.proposalId,
        allocatedAmount,
        allocationRatio,
        expectedReturn: proposal.expectedROI,
        riskWeighting: riskWeight,
        diversificationScore: 1 - allocationRatio, // 높을수록 분산
      });
    }

    return allocations;
  }

  /**
   * 포트폴리오 다양화 검증
   */
  private validateDiversification(
    allocations: InvestmentAllocation[]
  ): Result<void> {
    // 단일 투자 비중 제한 (25%)
    for (const allocation of allocations) {
      if (allocation.allocationRatio > 0.25) {
        return {
          success: false,
          error: new DomainError("CONCENTRATION_RISK"),
        };
      }
    }

    // 최소 다양화 요구사항 (3개 이상 벤처)
    if (allocations.length < 3) {
      return {
        success: false,
        error: new DomainError("INSUFFICIENT_DIVERSIFICATION"),
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * 생태계 메트릭스 업데이트
   */
  private updateEcosystemMetrics(): void {
    const totalVentures = this.ventureProposals.length;
    const successfulVentures = this.ventureEvents.filter(
      (e) => e.eventType === VentureEventType.VENTURE_SUCCESS
    ).length;

    this.ecosystemMetrics = {
      totalEntrepreneurs: this.entrepreneurs.length,
      activeVentures: totalVentures,
      totalInvestment: this.totalInvestmentPool,
      averageROI: this.calculateAverageROI(),
      successRate: totalVentures > 0 ? successfulVentures / totalVentures : 0,
      innovationIndex: this.calculateInnovationIndex(),
      networkDensity: this.calculateNetworkDensity(),
      creativeDestructionLevel: this.calculateCreativeDestructionLevel(),
    };
  }

  private calculateAverageROI(): number {
    if (this.ventureProposals.length === 0) return 0;

    const totalROI = this.ventureProposals.reduce(
      (sum, p) => sum + p.expectedROI,
      0
    );
    return totalROI / this.ventureProposals.length;
  }

  private calculateInnovationIndex(): number {
    if (this.entrepreneurs.length === 0) return 0;

    const totalInnovation = this.entrepreneurs.reduce(
      (sum, e) => sum + e.innovationScore,
      0
    );
    return totalInnovation / this.entrepreneurs.length;
  }

  private calculateNetworkDensity(): number {
    if (this.entrepreneurs.length === 0) return 0;

    const totalNetworkStrength = this.entrepreneurs.reduce(
      (sum, e) => sum + e.socialNetworkStrength,
      0
    );
    return totalNetworkStrength / this.entrepreneurs.length;
  }

  private calculateCreativeDestructionLevel(): number {
    if (this.ventureProposals.length === 0) return 0;

    const totalDestruction = this.ventureProposals.reduce(
      (sum, p) => sum + p.innovationLevel,
      0
    );
    return totalDestruction / this.ventureProposals.length;
  }

  /**
   * MoneyWave3 완료
   */
  complete(): Result<void> {
    if (this.status === MoneyWave3Status.COMPLETED) {
      return {
        success: false,
        error: new DomainError("ALREADY_COMPLETED"),
      };
    }

    this.status = MoneyWave3Status.COMPLETED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  /**
   * 긴급 중단
   */
  suspend(reason: string): Result<void> {
    if (this.status === MoneyWave3Status.COMPLETED) {
      return {
        success: false,
        error: new DomainError("CANNOT_SUSPEND_COMPLETED"),
      };
    }

    this.status = MoneyWave3Status.SUSPENDED;
    this.updatedAt = new Date();

    return { success: true, data: undefined };
  }

  // Getters
  getId(): MoneyWaveId {
    return this.id;
  }

  getStatus(): MoneyWave3Status {
    return this.status;
  }

  getEntrepreneurs(): EntrepreneurProfile[] {
    return [...this.entrepreneurs];
  }

  getVentureProposals(): VentureProposal[] {
    return [...this.ventureProposals];
  }

  getInvestmentAllocations(): InvestmentAllocation[] {
    return [...this.investmentAllocations];
  }

  getVentureEvents(): VentureEvent[] {
    return [...this.ventureEvents];
  }

  getTotalInvestmentPool(): PmcAmount {
    return this.totalInvestmentPool;
  }

  getEcosystemMetrics(): EcosystemMetrics {
    return { ...this.ecosystemMetrics };
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * 비즈니스 불변성 검증
   */
  validateInvariants(): Result<void> {
    // 1. 투자 풀 양수 제약
    if (unwrapPmcAmount(this.totalInvestmentPool) < 0) {
      return {
        success: false,
        error: new DomainError("INVARIANT_VIOLATION"),
      };
    }

    // 2. 기업가 지수 범위 제약
    for (const entrepreneur of this.entrepreneurs) {
      if (
        entrepreneur.innovationScore < 0 ||
        entrepreneur.innovationScore > 1
      ) {
        return {
          success: false,
          error: new DomainError("INVARIANT_VIOLATION"),
        };
      }

      if (
        entrepreneur.executionCapability < 0 ||
        entrepreneur.executionCapability > 1
      ) {
        return {
          success: false,
          error: new DomainError("INVARIANT_VIOLATION"),
        };
      }
    }

    // 3. 포트폴리오 다양화 제약
    for (const allocation of this.investmentAllocations) {
      if (allocation.allocationRatio > 0.25) {
        return {
          success: false,
          error: new DomainError("INVARIANT_VIOLATION"),
        };
      }
    }

    return { success: true, data: undefined };
  }
}
