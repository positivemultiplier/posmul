import { Result } from '@/shared/types/common';
import { BusinessLogicError } from '@/shared/utils/errors';
import { Merchant } from '../entities/merchant.entity';
import { Advertisement } from '../entities/advertisement.entity';
import { CrowdFunding } from '../entities/crowdfunding.entity';
import { Investment } from '../entities/investment.entity';
import { InvestmentType, RewardRate, AdvertisementStatus, FundingStatus, MerchantStatus } from '../value-objects/investment-value-objects';

/**
 * Investment Domain Service
 * 투자 관련 복합 비즈니스 로직을 처리하는 도메인 서비스
 */
export class InvestmentDomainService {
  /**
   * 투자 가능 여부 검증
   */
  static validateInvestmentEligibility(
    investment: Investment,
    target: Merchant | Advertisement | CrowdFunding
  ): Result<void> {
    try {
      // 투자 타입별 검증
      switch (investment.getType()) {
        case InvestmentType.LOCAL_LEAGUE:
          if (!(target instanceof Merchant)) {
            return {
              success: false,
              error: new BusinessLogicError('Local League 투자는 Merchant 대상만 가능합니다.')
            };
          }
          if (target.getStatus() !== MerchantStatus.ACTIVE) {
            return {
              success: false,
              error: new BusinessLogicError('비활성 상점에는 투자할 수 없습니다.')
            };
          }
          break;

        case InvestmentType.MAJOR_LEAGUE:
          if (!(target instanceof Advertisement)) {
            return {
              success: false,
              error: new BusinessLogicError('Major League 투자는 Advertisement 대상만 가능합니다.')
            };
          }
          if (target.getStatus() !== AdvertisementStatus.ACTIVE) {
            return {
              success: false,
              error: new BusinessLogicError('비활성 광고에는 참여할 수 없습니다.')
            };
          }
          break;

        case InvestmentType.CLOUD_FUNDING:
          if (!(target instanceof CrowdFunding)) {
            return {
              success: false,
              error: new BusinessLogicError('Cloud Funding 투자는 CrowdFunding 대상만 가능합니다.')
            };
          }
          if (target.getStatus() !== FundingStatus.ACTIVE) {
            return {
              success: false,
              error: new BusinessLogicError('투자 불가능한 크라우드 펀딩입니다.')
            };
          }
          break;

        default:
          return {
            success: false,
            error: new BusinessLogicError('지원하지 않는 투자 타입입니다.')
          };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new BusinessLogicError('투자 검증 중 오류가 발생했습니다.')
      };
    }
  }

  /**
   * 보상률 계산
   */
  static calculateRewardRate(
    investmentType: InvestmentType,
    target: Merchant | Advertisement | CrowdFunding,
    investmentAmount: number
  ): Result<RewardRate> {
    try {
      let baseRate = 0;

      switch (investmentType) {
        case InvestmentType.LOCAL_LEAGUE:
          if (target instanceof Merchant) {
            baseRate = target.getRewardRate().getRate();
          }
          break;

        case InvestmentType.MAJOR_LEAGUE:
          if (target instanceof Advertisement) {
            baseRate = target.getRewardRate().getRate();
          }
          break;

        case InvestmentType.CLOUD_FUNDING:
          if (target instanceof CrowdFunding) {
            // CrowdFunding은 기본 5% 보상률 적용
            baseRate = 5;
          }
          break;
      }

      // 투자 금액에 따른 보너스 적용
      let bonusMultiplier = 1;
      if (investmentAmount >= 100000) {
        bonusMultiplier = 1.5; // 10만원 이상 50% 보너스
      } else if (investmentAmount >= 50000) {
        bonusMultiplier = 1.2; // 5만원 이상 20% 보너스
      } else if (investmentAmount >= 10000) {
        bonusMultiplier = 1.1; // 1만원 이상 10% 보너스
      }

      const finalRate = baseRate * bonusMultiplier;
      
      const rewardRateResult = RewardRate.createPercentage(Math.min(finalRate, 50));
      if (!rewardRateResult.success) {
        return rewardRateResult;
      }
      
      return {
        success: true,
        data: rewardRateResult.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new BusinessLogicError('보상률 계산 중 오류가 발생했습니다.')
      };
    }
  }

  /**
   * 투자 보상 계산
   */
  static calculateInvestmentReward(
    investment: Investment,
    rewardRate: RewardRate
  ): Result<number> {
    try {
      const amount = investment.getAmount();
      const reward = rewardRate.calculateReward(amount);
      
      return { success: true, data: reward };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new BusinessLogicError('보상 계산 중 오류가 발생했습니다.')
      };
    }
  }

  /**
   * 투자 위험도 평가
   */
  static assessInvestmentRisk(
    investmentType: InvestmentType,
    target: Merchant | Advertisement | CrowdFunding
  ): Result<'LOW' | 'MEDIUM' | 'HIGH'> {
    try {
      switch (investmentType) {
        case InvestmentType.LOCAL_LEAGUE:
          if (target instanceof Merchant) {
            // Merchant의 평점이 없으므로 기본 MEDIUM 위험도 적용
            return { success: true, data: 'MEDIUM' };
          }
          break;

        case InvestmentType.MAJOR_LEAGUE:
          // 광고 시청은 일반적으로 저위험
          return { success: true, data: 'LOW' };

        case InvestmentType.CLOUD_FUNDING:
          if (target instanceof CrowdFunding) {
            const currentAmount = target.getCurrentAmount();
            const goalAmount = target.getGoal().getTargetAmount();
            const progress = (currentAmount / goalAmount) * 100;
            
            if (progress >= 80) return { success: true, data: 'LOW' };
            if (progress >= 50) return { success: true, data: 'MEDIUM' };
            return { success: true, data: 'HIGH' };
          }
          break;
      }

      return { success: true, data: 'MEDIUM' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new BusinessLogicError('위험도 평가 중 오류가 발생했습니다.')
      };
    }
  }

  /**
   * 투자 포트폴리오 다양성 검증
   */
  static validatePortfolioDiversity(
    existingInvestments: Investment[],
    newInvestmentType: InvestmentType
  ): Result<{
    isHealthy: boolean;
    recommendation: string;
  }> {
    try {
      const typeDistribution = new Map<InvestmentType, number>();
      
      // 기존 투자 타입별 집계
      existingInvestments.forEach(investment => {
        const type = investment.getType();
        typeDistribution.set(type, (typeDistribution.get(type) || 0) + 1);
      });

      // 새 투자 추가
      typeDistribution.set(
        newInvestmentType, 
        (typeDistribution.get(newInvestmentType) || 0) + 1
      );

      const total = existingInvestments.length + 1;
      const localLeagueRatio = (typeDistribution.get(InvestmentType.LOCAL_LEAGUE) || 0) / total;
      const majorLeagueRatio = (typeDistribution.get(InvestmentType.MAJOR_LEAGUE) || 0) / total;
      const cloudFundingRatio = (typeDistribution.get(InvestmentType.CLOUD_FUNDING) || 0) / total;

      // 건강한 포트폴리오 기준: 어느 한 타입이 70% 이상을 차지하지 않아야 함
      const maxRatio = Math.max(localLeagueRatio, majorLeagueRatio, cloudFundingRatio);
      const isHealthy = maxRatio <= 0.7;

      let recommendation = '';
      if (!isHealthy) {
        if (localLeagueRatio > 0.7) {
          recommendation = 'Local League 투자 비중이 높습니다. Major League나 Cloud Funding 투자를 고려해보세요.';
        } else if (majorLeagueRatio > 0.7) {
          recommendation = 'Major League 참여 비중이 높습니다. Local League나 Cloud Funding 투자를 고려해보세요.';
        } else if (cloudFundingRatio > 0.7) {
          recommendation = 'Cloud Funding 투자 비중이 높습니다. Local League나 Major League 참여를 고려해보세요.';
        }
      } else {
        recommendation = '균형잡힌 포트폴리오를 유지하고 있습니다.';
      }

      return {
        success: true,
        data: { isHealthy, recommendation }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new BusinessLogicError('포트폴리오 분석 중 오류가 발생했습니다.')
      };
    }
  }
}
