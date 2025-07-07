/**
 * Donation Domain Service
 * 기부 도메인 서비스 - 복잡한 비즈니스 로직 처리
 */

import { UserId } from "@posmul/auth-economy-sdk";

import { Donation } from '../entities/donation.entity';
import { Institute } from '../entities/institute.entity';
import { OpinionLeader } from '../entities/opinion-leader.entity';
import { 
  DonationAmount,
  DonationType,
  DonationFrequency,
  DonorRating,
  DonorTier
} from '../value-objects/donation-value-objects';

// 기부 적격성 검증 결과
export interface DonationEligibilityResult {
  isEligible: boolean;
  reasons: string[];
  maxAmount?: number;
  suggestedAmount?: number;
}

// 기부 영향 분석 결과
export interface DonationImpactAnalysis {
  estimatedBeneficiaries: number;
  impactCategory: 'low' | 'medium' | 'high';
  expectedOutcome: string;
  similarProjectsSuccess: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// 기부자 포트폴리오 분석
export interface DonorPortfolioAnalysis {
  diversificationScore: number; // 0-100
  categoryDistribution: Record<string, number>;
  typeDistribution: Record<DonationType, number>;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  recommendations: string[];
}

// 기부 최적화 제안
export interface DonationOptimizationSuggestion {
  suggestedAmount: DonationAmount;
  suggestedFrequency: DonationFrequency;
  taxBenefits: number;
  impactMultiplier: number;
  reasoning: string[];
}

/**
 * DonationDomainService
 * 기부 관련 복잡한 비즈니스 로직을 처리하는 도메인 서비스
 */
export class DonationDomainService {
  
  /**
   * 기부 적격성 검증
   * 기부자가 특정 기부를 할 수 있는지 검증
   */
  validateDonationEligibility(
    donorId: UserId,
    donation: Donation,
    donorBalance: number,
    donorHistory: Donation[],
    target: Institute | OpinionLeader
  ): DonationEligibilityResult {
    const reasons: string[] = [];
    let isEligible = true;

    // 잔액 확인
    if (donorBalance < donation.getAmount().getValue()) {
      isEligible = false;
      reasons.push('Insufficient PMC balance');
    }

    // 기부 대상 상태 확인
    if (donation.getDonationType() === DonationType.INSTITUTE) {
      const institute = target as Institute;
      if (!institute.canReceiveDonations()) {
        isEligible = false;
        reasons.push('Institute is not accepting donations');
      }
    } else if (donation.getDonationType() === DonationType.OPINION_LEADER) {
      const leader = target as OpinionLeader;
      if (!leader.canReceiveSupport()) {
        isEligible = false;
        reasons.push('Opinion leader is not accepting support');
      }
    }

    // 일일 기부 한도 확인 (예: 일일 100만원)
    const dailyLimit = 1000000;
    const today = new Date();
    const todayDonations = donorHistory.filter(d => {
      const donationDate = d.getCreatedAt();
      return donationDate.toDateString() === today.toDateString() && d.isCompleted();
    });
    const todayTotal = todayDonations.reduce((sum, d) => sum + d.getAmount().getValue(), 0);
    
    if (todayTotal + donation.getAmount().getValue() > dailyLimit) {
      isEligible = false;
      reasons.push(`Daily donation limit exceeded (${dailyLimit.toLocaleString('ko-KR')}원)`);
    }

    // 월별 기부 한도 확인 (예: 월 500만원)
    const monthlyLimit = 5000000;
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyDonations = donorHistory.filter(d => {
      const donationDate = d.getCreatedAt();
      return donationDate >= thisMonth && d.isCompleted();
    });
    const monthlyTotal = monthlyDonations.reduce((sum, d) => sum + d.getAmount().getValue(), 0);
    
    if (monthlyTotal + donation.getAmount().getValue() > monthlyLimit) {
      isEligible = false;
      reasons.push(`Monthly donation limit exceeded (${monthlyLimit.toLocaleString('ko-KR')}원)`);
    }

    // 최대 가능 금액 계산
    const maxAmount = Math.min(
      donorBalance,
      dailyLimit - todayTotal,
      monthlyLimit - monthlyTotal
    );

    // 제안 금액 계산 (최대 금액의 80%)
    const suggestedAmount = Math.floor(maxAmount * 0.8);

    return {
      isEligible,
      reasons,
      maxAmount: maxAmount > 0 ? maxAmount : undefined,
      suggestedAmount: suggestedAmount > 0 ? suggestedAmount : undefined
    };
  }

  /**
   * 기부 영향 분석
   * 기부가 미칠 것으로 예상되는 영향을 분석
   */
  analyzeDonationImpact(
    donation: Donation,
    target: Institute | OpinionLeader,
    historicalData?: Donation[]
  ): DonationImpactAnalysis {
    const amount = donation.getAmount().getValue();
    
    // 기본 수혜자 수 계산 (금액 기반)
    let estimatedBeneficiaries = Math.floor(amount / 10000); // 1만원당 1명 가정

    // 기관별 효율성 적용
    if (donation.getDonationType() === DonationType.INSTITUTE) {
      const institute = target as Institute;
      
      // 신뢰도 등급에 따른 효율성 보정
      switch (institute.getTrustLevel()) {
        case 'GOLD':
          estimatedBeneficiaries *= 1.5;
          break;
        case 'PREMIUM':
          estimatedBeneficiaries *= 1.3;
          break;
        case 'VERIFIED':
          estimatedBeneficiaries *= 1.1;
          break;
        default:
          break;
      }
    }

    // 영향 카테고리 결정
    let impactCategory: 'low' | 'medium' | 'high' = 'low';
    if (amount >= 1000000) impactCategory = 'high';
    else if (amount >= 100000) impactCategory = 'medium';

    // 예상 결과 생성
    const expectedOutcome = this.generateExpectedOutcome(donation, estimatedBeneficiaries);

    // 유사 프로젝트 성공률 (임시 데이터)
    const similarProjectsSuccess = historicalData ? 
      this.calculateSuccessRate(historicalData) : 85;

    // 리스크 레벨 계산
    const riskLevel = this.calculateRiskLevel(donation, target);

    return {
      estimatedBeneficiaries: Math.floor(estimatedBeneficiaries),
      impactCategory,
      expectedOutcome,
      similarProjectsSuccess,
      riskLevel
    };
  }

  /**
   * 기부자 포트폴리오 분석
   * 기부자의 기부 패턴과 다양성 분석
   */
  analyzeDonorPortfolio(donations: Donation[]): DonorPortfolioAnalysis {
    if (donations.length === 0) {
      return {
        diversificationScore: 0,
        categoryDistribution: {},
        typeDistribution: {} as Record<DonationType, number>,
        riskLevel: 'conservative',
        recommendations: ['Start making your first donation']
      };
    }

    // 카테고리 분포 계산
    const categoryDistribution: Record<string, number> = {};
    const typeDistribution: Record<DonationType, number> = {} as Record<DonationType, number>;
    
    donations.forEach(donation => {
      const category = donation.getCategory();
      const type = donation.getDonationType();
      
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // 다양성 점수 계산 (0-100)
    const categoryCount = Object.keys(categoryDistribution).length;
    const typeCount = Object.keys(typeDistribution).length;
    const diversificationScore = Math.min(100, (categoryCount * 20) + (typeCount * 10));

    // 리스크 레벨 결정
    const directDonationRatio = (typeDistribution[DonationType.DIRECT] || 0) / donations.length;
    let riskLevel: 'conservative' | 'moderate' | 'aggressive' = 'conservative';
    
    if (directDonationRatio > 0.7) riskLevel = 'aggressive';
    else if (directDonationRatio > 0.4) riskLevel = 'moderate';

    // 추천사항 생성
    const recommendations = this.generatePortfolioRecommendations(
      categoryDistribution,
      typeDistribution,
      diversificationScore
    );

    return {
      diversificationScore,
      categoryDistribution,
      typeDistribution,
      riskLevel,
      recommendations
    };
  }

  /**
   * 기부 최적화 제안
   * 기부자에게 최적의 기부 방식 제안
   */  suggestOptimalDonation(
    donorId: UserId,
    targetAmount: number,
    donorTier: DonorRating,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _donations: Donation[]
  ): DonationOptimizationSuggestion {
    // 기부자 등급에 따른 보너스 적용
    const bonusRate = donorTier.getBonusRate();
    const optimizedAmount = Math.floor(targetAmount * bonusRate);

    // 빈도 제안
    let suggestedFrequency = DonationFrequency.ONE_TIME;
    if (targetAmount >= 100000) {
      suggestedFrequency = DonationFrequency.MONTHLY;
    } else if (targetAmount >= 50000) {
      suggestedFrequency = DonationFrequency.QUARTERLY;
    }

    // 세금 혜택 계산 (기부금 세액공제)
    const taxBenefits = this.calculateTaxBenefits(optimizedAmount);

    // 영향 배수 계산
    const impactMultiplier = bonusRate;

    // 제안 이유
    const reasoning = [
      `Your ${donorTier.getLabel()} tier provides ${((bonusRate - 1) * 100).toFixed(0)}% bonus`,
      `${suggestedFrequency} donations can maximize impact`,
      `Tax benefits: ${taxBenefits.toLocaleString('ko-KR')}원`
    ];

    return {
      suggestedAmount: new DonationAmount(optimizedAmount),
      suggestedFrequency,
      taxBenefits,
      impactMultiplier,
      reasoning
    };
  }

  /**
   * 기부자 등급 업그레이드 가능성 확인
   */
  checkTierUpgradePossibility(
    currentTier: DonorRating,
    annualDonationAmount: number,
    remainingMonths: number
  ): {
    canUpgrade: boolean;
    nextTier?: DonorTier;
    requiredAmount?: number;
    monthlyTarget?: number;
  } {
    const tierOrder = [DonorTier.BRONZE, DonorTier.SILVER, DonorTier.GOLD, DonorTier.PLATINUM, DonorTier.DIAMOND];
    const currentIndex = tierOrder.indexOf(currentTier.getTier());
    
    if (currentIndex === tierOrder.length - 1) {
      return { canUpgrade: false }; // 이미 최고 등급
    }

    const nextTier = tierOrder[currentIndex + 1];
    const requiredAmount = this.getTierThreshold(nextTier) - annualDonationAmount;
    
    if (requiredAmount <= 0) {
      return { canUpgrade: false }; // 이미 다음 등급 조건 충족
    }

    const monthlyTarget = Math.ceil(requiredAmount / remainingMonths);

    return {
      canUpgrade: true,
      nextTier,
      requiredAmount,
      monthlyTarget
    };
  }

  // Private helper methods
  private generateExpectedOutcome(donation: Donation, beneficiaries: number): string {
    const category = donation.getCategory();

    switch (category) {
      case 'FOOD':
        return `Approximately ${beneficiaries} people can receive meals`;
      case 'EDUCATION':
        return `Support education for ${beneficiaries} students`;
      case 'MEDICAL':
        return `Provide medical care for ${beneficiaries} patients`;
      case 'HOUSING':
        return `Support housing for ${beneficiaries} families`;
      default:
        return `Benefit approximately ${beneficiaries} people`;
    }
  }

  private calculateSuccessRate(donations: Donation[]): number {
    const completedDonations = donations.filter(d => d.isCompleted()).length;
    return Math.round((completedDonations / donations.length) * 100);
  }

  private calculateRiskLevel(
    donation: Donation, 
    target: Institute | OpinionLeader
  ): 'low' | 'medium' | 'high' {
    if (donation.getDonationType() === DonationType.INSTITUTE) {
      const institute = target as Institute;
      if (institute.getTrustLevel() === 'GOLD') return 'low';
      if (institute.getTrustLevel() === 'PREMIUM') return 'low';
      if (institute.getTrustLevel() === 'VERIFIED') return 'medium';
      return 'high';
    }

    if (donation.getDonationType() === DonationType.OPINION_LEADER) {
      const leader = target as OpinionLeader;
      if (leader.isVerified()) return 'medium';
      return 'high';
    }

    return 'medium'; // Direct donations
  }

  private generatePortfolioRecommendations(
    categoryDistribution: Record<string, number>,
    typeDistribution: Record<DonationType, number>,
    diversificationScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (diversificationScore < 40) {
      recommendations.push('Consider diversifying across more categories');
    }

    if (Object.keys(categoryDistribution).length < 3) {
      recommendations.push('Try supporting different cause categories');
    }

    if (!typeDistribution[DonationType.INSTITUTE]) {
      recommendations.push('Consider donating to verified institutions');
    }

    if (diversificationScore > 80) {
      recommendations.push('Great diversification! Your portfolio is well-balanced');
    }

    return recommendations;
  }

  private calculateTaxBenefits(amount: number): number {
    // 기부금 세액공제 계산 (간단한 예시)
    // 실제로는 더 복잡한 세법 적용 필요
    if (amount <= 20000) return 0;
    
    const deductibleAmount = amount - 20000;
    if (deductibleAmount <= 1000000) {
      return deductibleAmount * 0.15; // 15% 공제
    } else {
      return 1000000 * 0.15 + (deductibleAmount - 1000000) * 0.30; // 30% 공제
    }
  }

  private getTierThreshold(tier: DonorTier): number {
    switch (tier) {
      case DonorTier.BRONZE: return 50000;
      case DonorTier.SILVER: return 200000;
      case DonorTier.GOLD: return 500000;
      case DonorTier.PLATINUM: return 1000000;
      case DonorTier.DIAMOND: return 5000000;
      default: return 0;
    }
  }
}
