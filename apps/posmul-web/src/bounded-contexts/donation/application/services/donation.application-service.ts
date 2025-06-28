/**
 * Donation Application Service
 * 기부 애플리케이션 서비스
 */

import { Result, PaginationParams, PaginatedResult } from '@/shared/types/common';
import { UserId, createUserId } from '@/bounded-contexts/auth/domain/value-objects/user-value-objects';
import { Donation } from '../../domain/entities/donation.entity';
import { Institute } from '../../domain/entities/institute.entity';
import { OpinionLeader } from '../../domain/entities/opinion-leader.entity';
import { IDonationRepository, DonationSearchCriteria } from '../../domain/repositories/donation.repository';
import { IInstituteRepository } from '../../domain/repositories/institute.repository';
import { IOpinionLeaderRepository } from '../../domain/repositories/opinion-leader.repository';
import { DonationDomainService } from '../../domain/services/donation.domain-service';
import { CreateDonationUseCase } from '../use-cases/create-donation.use-case';
import { 
  DonationId,
  DonationStatus,
  DonorRating
} from '../../domain/value-objects/donation-value-objects';
import { 
  CreateDonationRequest,
  DonationResponse,
  DonationSearchRequest,
  DonationStatsResponse,
  DonorDashboardResponse,
  DonationImpactResponse
} from '../dto/donation.dto';

/**
 * DonationApplicationService
 * 기부 관련 애플리케이션 로직을 처리하는 서비스
 */
export class DonationApplicationService {
  constructor(
    private readonly donationRepository: IDonationRepository,
    private readonly instituteRepository: IInstituteRepository,
    private readonly opinionLeaderRepository: IOpinionLeaderRepository,
    private readonly donationDomainService: DonationDomainService,
    private readonly createDonationUseCase: CreateDonationUseCase
  ) {}

  /**
   * 새로운 기부 생성
   */
  async createDonation(
    donorId: UserId,
    request: CreateDonationRequest,
    donorBalance: number
  ): Promise<Result<DonationResponse>> {
    const result = await this.createDonationUseCase.execute(donorId, request, donorBalance);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const donationResponse = this.mapDonationToResponse(result.data);
    return { success: true, data: donationResponse };
  }

  /**
   * 기부 상세 조회
   */
  async getDonationById(donationId: string): Promise<Result<DonationResponse | null>> {
    const result = await this.donationRepository.findById(new DonationId(donationId));
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (!result.data) {
      return { success: true, data: null };
    }

    const donationResponse = this.mapDonationToResponse(result.data);
    return { success: true, data: donationResponse };
  }

  /**
   * 기부자의 기부 내역 조회
   */
  async getDonationsByDonor(
    donorId: UserId,
    pagination?: PaginationParams
  ): Promise<Result<PaginatedResult<DonationResponse>>> {
    const result = await this.donationRepository.findByDonorId(donorId, pagination);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }    const mappedData = result.data.data.map(donation => this.mapDonationToResponse(donation));
    
    return {
      success: true,
      data: {
        data: mappedData,
        pagination: {
          total: result.data.pagination.total,
          page: result.data.pagination.page,
          limit: result.data.pagination.limit,
          totalPages: result.data.pagination.totalPages,
          hasNext: result.data.pagination.hasNext,
          hasPrev: result.data.pagination.hasPrev
        }
      }
    };
  }

  /**
   * 기부 검색
   */
  async searchDonations(
    searchRequest: DonationSearchRequest
  ): Promise<Result<PaginatedResult<DonationResponse>>> {
    // 검색 조건 변환
    const criteria: DonationSearchCriteria = {
      donorId: searchRequest.donorId ? createUserId(searchRequest.donorId) : undefined,
      status: searchRequest.status,
      type: searchRequest.type,
      category: searchRequest.category,
      frequency: searchRequest.frequency,
      startDate: searchRequest.startDate ? new Date(searchRequest.startDate) : undefined,
      endDate: searchRequest.endDate ? new Date(searchRequest.endDate) : undefined,
      minAmount: searchRequest.minAmount,
      maxAmount: searchRequest.maxAmount,
      isAnonymous: searchRequest.isAnonymous
    };

    const pagination: PaginationParams = {
      page: searchRequest.page,
      limit: searchRequest.limit
    };

    const result = await this.donationRepository.findByCriteria(criteria, pagination);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }    const mappedData = result.data.data.map(donation => this.mapDonationToResponse(donation));
    
    return {
      success: true,
      data: {
        data: mappedData,
        pagination: {
          total: result.data.pagination.total,
          page: result.data.pagination.page,
          limit: result.data.pagination.limit,
          totalPages: result.data.pagination.totalPages,
          hasNext: result.data.pagination.hasNext,
          hasPrev: result.data.pagination.hasPrev
        }
      }
    };
  }

  /**
   * 기부 처리 시작
   */
  async processDonation(
    donationId: string,
    transactionId: string
  ): Promise<Result<void>> {
    const donationResult = await this.donationRepository.findById(new DonationId(donationId));
    
    if (!donationResult.success || !donationResult.data) {
      return { success: false, error: new Error('Donation not found') };
    }

    const donation = donationResult.data;
    const processResult = donation.startProcessing(transactionId);
    
    if (!processResult.success) {
      return processResult;
    }

    return await this.donationRepository.update(donation);
  }

  /**
   * 기부 완료 처리
   */
  async completeDonation(
    donationId: string,
    receiptUrl?: string
  ): Promise<Result<void>> {
    const donationResult = await this.donationRepository.findById(new DonationId(donationId));
    
    if (!donationResult.success || !donationResult.data) {
      return { success: false, error: new Error('Donation not found') };
    }

    const donation = donationResult.data;
    const completeResult = donation.complete(receiptUrl);
    
    if (!completeResult.success) {
      return completeResult;
    }

    return await this.donationRepository.update(donation);
  }

  /**
   * 기부 취소
   */
  async cancelDonation(
    donationId: string,
    reason: string
  ): Promise<Result<void>> {
    const donationResult = await this.donationRepository.findById(new DonationId(donationId));
    
    if (!donationResult.success || !donationResult.data) {
      return { success: false, error: new Error('Donation not found') };
    }

    const donation = donationResult.data;
    const cancelResult = donation.cancel(reason);
    
    if (!cancelResult.success) {
      return cancelResult;
    }

    return await this.donationRepository.update(donation);
  }

  /**
   * 기부 통계 조회
   */
  async getDonationStats(
    donorId?: UserId,
    startDate?: Date,
    endDate?: Date
  ): Promise<Result<DonationStatsResponse>> {
    const statsResult = await this.donationRepository.getDonationStatsInPeriod(
      startDate || new Date(new Date().getFullYear(), 0, 1), // 기본: 올해 시작
      endDate || new Date(),
      donorId
    );

    if (!statsResult.success) {
      return { success: false, error: statsResult.error };
    }

    const monthlyStatsResult = await this.donationRepository.getMonthlyStats(
      new Date().getFullYear(),
      donorId
    );

    const yearlyStatsResult = await this.donationRepository.getYearlyStats(donorId);    return {
      success: true,
      data: {
        ...statsResult.data,
        donationsByStatus: {} as Record<DonationStatus, number>, // TODO: 실제 통계 데이터에서 가져와야 함
        monthlyStats: monthlyStatsResult.success ? monthlyStatsResult.data.map(stat => ({
          month: stat.month,
          year: new Date().getFullYear(),
          totalDonations: stat.totalDonations,
          totalAmount: stat.totalAmount
        })) : [],
        yearlyStats: yearlyStatsResult.success ? yearlyStatsResult.data : []
      }
    };
  }

  /**
   * 기부자 대시보드 데이터 조회
   */
  async getDonorDashboard(donorId: UserId): Promise<Result<DonorDashboardResponse>> {
    const dashboardResult = await this.donationRepository.getDashboardSummary(donorId);
    
    if (!dashboardResult.success) {
      return { success: false, error: dashboardResult.error };
    }

    const summary = dashboardResult.data;

    // 최근 기부 내역 조회
    const recentDonationsResult = await this.donationRepository.findByDonorId(donorId, { page: 1, limit: 5 });
    const recentDonations = recentDonationsResult.success ? 
      recentDonationsResult.data.data.map(d => this.mapDonationToResponse(d)) : [];

    // 예정된 기부 조회
    const scheduledDonationsResult = await this.donationRepository.findByCriteria(
      { donorId, status: DonationStatus.PENDING },
      { page: 1, limit: 5 }
    );
    const upcomingScheduledDonations = scheduledDonationsResult.success ? 
      scheduledDonationsResult.data.data
        .filter(d => d.getScheduledAt() && d.getScheduledAt()! > new Date())
        .map(d => this.mapDonationToResponse(d)) : [];

    // 기부자 등급 계산
    const donorTier = DonorRating.calculateTier(summary.yearlyTotal);

    // 다음 등급까지 진행률 계산
    const tierProgress = this.donationDomainService.checkTierUpgradePossibility(
      donorTier,
      summary.yearlyTotal,
      12 - new Date().getMonth()
    );    return {
      success: true,
      data: {
        ...summary,
        lastDonationDate: summary.lastDonationDate?.toISOString(),
        donorTier: donorTier.getTier(),
        recentDonations,
        upcomingScheduledDonations,
        categoryDistribution: {}, // 실제로는 통계 데이터에서 가져와야 함
        typeDistribution: {},
        monthlyProgress: {
          currentMonth: new Date().getMonth() + 1,
          target: summary.monthlyAverage * 1.1, // 10% 증가 목표
          achieved: summary.monthlyAverage,
          percentage: 90 // 임시 값
        },
        tierProgress: {
          currentTier: donorTier.getTier(),
          nextTier: tierProgress.nextTier,
          requiredAmount: tierProgress.requiredAmount,
          progressPercentage: tierProgress.requiredAmount ? 
            Math.round((summary.yearlyTotal / (summary.yearlyTotal + tierProgress.requiredAmount)) * 100) : 100
        }
      }
    };
  }

  /**
   * 기부 영향 분석
   */
  async analyzeDonationImpact(
    donationId: string
  ): Promise<Result<DonationImpactResponse>> {
    const donationResult = await this.donationRepository.findById(new DonationId(donationId));
    
    if (!donationResult.success || !donationResult.data) {
      return { success: false, error: new Error('Donation not found') };
    }

    const donation = donationResult.data;
    
    // 기부 대상 정보 조회
    let target: Institute | OpinionLeader | undefined;
    
    if (donation.getInstituteId()) {
      const instituteResult = await this.instituteRepository.findById(donation.getInstituteId()!);
      if (instituteResult.success && instituteResult.data) {
        target = instituteResult.data;
      }
    } else if (donation.getOpinionLeaderId()) {
      const leaderResult = await this.opinionLeaderRepository.findById(donation.getOpinionLeaderId()!);
      if (leaderResult.success && leaderResult.data) {
        target = leaderResult.data;
      }
    }

    if (!target) {
      return { success: false, error: new Error('Donation target not found') };
    }

    // 영향 분석 실행
    const impactAnalysis = this.donationDomainService.analyzeDonationImpact(donation, target);
    
    // 최적화 제안 생성
    const donorHistoryResult = await this.donationRepository.findByDonorId(donation.getDonorId());
    const donorHistory = donorHistoryResult.success ? donorHistoryResult.data.data : [];
    const donorTier = DonorRating.calculateTier(
      donorHistory.reduce((sum, d) => sum + d.getAmount().getValue(), 0)
    );

    const optimizationSuggestion = this.donationDomainService.suggestOptimalDonation(
      donation.getDonorId(),
      donation.getAmount().getValue(),
      donorTier,
      donorHistory
    );

    return {
      success: true,
      data: {
        ...impactAnalysis,
        recommendations: ['Consider regular donations for greater impact'],
        optimizationSuggestions: {
          suggestedAmount: optimizationSuggestion.suggestedAmount.getValue(),
          suggestedFrequency: optimizationSuggestion.suggestedFrequency,
          taxBenefits: optimizationSuggestion.taxBenefits,
          impactMultiplier: optimizationSuggestion.impactMultiplier,
          reasoning: optimizationSuggestion.reasoning
        }
      }
    };
  }

  /**
   * 기부 엔티티를 응답 DTO로 변환
   */
  private mapDonationToResponse(donation: Donation): DonationResponse {
    return {
      id: donation.getId().getValue(),
      donorId: donation.getDonorId().toString(),
      type: donation.getDonationType(),
      amount: donation.getAmount().getValue(),
      category: donation.getCategory(),
      description: donation.getDescription().getValue(),
      frequency: donation.getFrequency(),
      status: donation.getStatus(),
      metadata: donation.getMetadata(),
      instituteId: donation.getInstituteId()?.getValue(),
      opinionLeaderId: donation.getOpinionLeaderId()?.getValue(),
      beneficiaryInfo: donation.getBeneficiaryInfo() ? {
        name: donation.getBeneficiaryInfo()!.getName(),
        description: donation.getBeneficiaryInfo()!.getDescription(),
        contactInfo: donation.getBeneficiaryInfo()!.getContactInfo()
      } : undefined,      processingInfo: {
        processedAt: donation.getProcessingInfo()?.processedAt?.toISOString(),
        processedBy: donation.getProcessingInfo()?.processedBy,
        transactionId: donation.getProcessingInfo()?.transactionId,
        receiptUrl: donation.getProcessingInfo()?.receiptUrl
      },
      scheduledAt: donation.getScheduledAt()?.toISOString(),
      completedAt: donation.getCompletedAt()?.toISOString(),
      cancelledAt: donation.getCancelledAt()?.toISOString(),
      createdAt: donation.getCreatedAt().toISOString(),
      updatedAt: donation.getUpdatedAt().toISOString()
    };
  }
}
