/**
 * Donation Application DTOs
 * 기부 애플리케이션 계층 데이터 전송 객체들
 */

import { z } from 'zod';
import { 
  DonationCategory,
  DonationType,
  DonationFrequency,
  DonationStatus,
  InstituteCategory,
  SupportCategory,
  DonorTier
} from '../../domain/value-objects/donation-value-objects';

// 기부 생성 요청 DTO
export const CreateDonationRequestSchema = z.object({
  type: z.nativeEnum(DonationType),
  amount: z.number().min(1000).multipleOf(100),
  category: z.nativeEnum(DonationCategory),
  description: z.string().min(1).max(500),
  frequency: z.nativeEnum(DonationFrequency),
  
  // 메타데이터
  isAnonymous: z.boolean().default(false),
  message: z.string().max(200).optional(),
  dedicatedTo: z.string().max(100).optional(),
  taxDeductible: z.boolean().default(true),
  receiptRequired: z.boolean().default(true),
  
  // 기부 대상별 필드
  instituteId: z.string().optional(),
  opinionLeaderId: z.string().optional(),
  
  // 직접 기부용 수혜자 정보
  beneficiaryName: z.string().optional(),
  beneficiaryDescription: z.string().optional(),
  beneficiaryContact: z.string().optional(),
  
  // 예약 기부
  scheduledAt: z.string().datetime().optional()
});

export type CreateDonationRequest = z.infer<typeof CreateDonationRequestSchema>;

// 기부 응답 DTO
export const DonationResponseSchema = z.object({
  id: z.string(),
  donorId: z.string(),
  type: z.nativeEnum(DonationType),
  amount: z.number(),
  category: z.nativeEnum(DonationCategory),
  description: z.string(),
  frequency: z.nativeEnum(DonationFrequency),
  status: z.nativeEnum(DonationStatus),
  
  metadata: z.object({
    isAnonymous: z.boolean(),
    message: z.string().optional(),
    dedicatedTo: z.string().optional(),
    taxDeductible: z.boolean(),
    receiptRequired: z.boolean()
  }),
  
  instituteId: z.string().optional(),
  opinionLeaderId: z.string().optional(),
  
  beneficiaryInfo: z.object({
    name: z.string(),
    description: z.string(),
    contactInfo: z.string().optional()
  }).optional(),
  
  processingInfo: z.object({
    processedAt: z.string().datetime().optional(),
    processedBy: z.string().optional(),
    transactionId: z.string().optional(),
    receiptUrl: z.string().optional()
  }),
  
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type DonationResponse = z.infer<typeof DonationResponseSchema>;

// 기관 등록 요청 DTO
export const CreateInstituteRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(1000),
  category: z.nativeEnum(InstituteCategory),
  
  contactInfo: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    address: z.string().optional()
  }),
  
  logoUrl: z.string().url().optional(),
  registrationNumber: z.string().optional()
});

export type CreateInstituteRequest = z.infer<typeof CreateInstituteRequestSchema>;

// 기관 응답 DTO
export const InstituteResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.nativeEnum(InstituteCategory),
  
  contactInfo: z.object({
    email: z.string(),
    phone: z.string().optional(),
    website: z.string().optional(),
    address: z.string().optional()
  }),
  
  status: z.string(),
  trustLevel: z.string(),
  registrationNumber: z.string().optional(),
  logoUrl: z.string().optional(),
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type InstituteResponse = z.infer<typeof InstituteResponseSchema>;

// 오피니언 리더 등록 요청 DTO
export const CreateOpinionLeaderRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  bio: z.string().min(10).max(1000),
  categories: z.array(z.nativeEnum(SupportCategory)).min(1),
  
  socialMediaInfo: z.array(z.object({
    platform: z.string(),
    handle: z.string(),
    followers: z.number().min(0),
    verified: z.boolean()
  })).default([]),
  
  profileImageUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional()
});

export type CreateOpinionLeaderRequest = z.infer<typeof CreateOpinionLeaderRequestSchema>;

// 오피니언 리더 응답 DTO
export const OpinionLeaderResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string(),
  bio: z.string(),
  categories: z.array(z.nativeEnum(SupportCategory)),
  
  socialMediaInfo: z.array(z.object({
    platform: z.string(),
    handle: z.string(),
    followers: z.number(),
    verified: z.boolean()
  })),
  
  status: z.string(),
  verificationStatus: z.string(),
  profileImageUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type OpinionLeaderResponse = z.infer<typeof OpinionLeaderResponseSchema>;

// 기부 검색 요청 DTO
export const DonationSearchRequestSchema = z.object({
  donorId: z.string().optional(),
  status: z.nativeEnum(DonationStatus).optional(),
  type: z.nativeEnum(DonationType).optional(),
  category: z.nativeEnum(DonationCategory).optional(),
  frequency: z.nativeEnum(DonationFrequency).optional(),
  instituteId: z.string().optional(),
  opinionLeaderId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  isAnonymous: z.boolean().optional(),
  
  // 페이지네이션
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  
  // 정렬
  sortBy: z.enum(['createdAt', 'amount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type DonationSearchRequest = z.infer<typeof DonationSearchRequestSchema>;

// 기부 통계 응답 DTO
export const DonationStatsResponseSchema = z.object({
  totalDonations: z.number(),
  totalAmount: z.number(),
  averageAmount: z.number(),
  donationsByCategory: z.record(z.nativeEnum(DonationCategory), z.number()),
  donationsByType: z.record(z.nativeEnum(DonationType), z.number()),
  donationsByStatus: z.record(z.nativeEnum(DonationStatus), z.number()),
  monthlyStats: z.array(z.object({
    month: z.number(),
    year: z.number(),
    totalDonations: z.number(),
    totalAmount: z.number()
  })),
  yearlyStats: z.array(z.object({
    year: z.number(),
    totalDonations: z.number(),
    totalAmount: z.number()
  }))
});

export type DonationStatsResponse = z.infer<typeof DonationStatsResponseSchema>;

// 기부자 대시보드 응답 DTO
export const DonorDashboardResponseSchema = z.object({
  totalDonated: z.number(),
  donationCount: z.number(),
  lastDonationDate: z.string().datetime().optional(),
  favoriteCategory: z.nativeEnum(DonationCategory),
  yearlyTotal: z.number(),
  monthlyAverage: z.number(),
  rewardPointsEarned: z.number(),
  donorTier: z.nativeEnum(DonorTier),
  
  recentDonations: z.array(DonationResponseSchema),
  upcomingScheduledDonations: z.array(DonationResponseSchema),
  
  categoryDistribution: z.record(z.nativeEnum(DonationCategory), z.number()),
  typeDistribution: z.record(z.nativeEnum(DonationType), z.number()),
  
  monthlyProgress: z.object({
    currentMonth: z.number(),
    target: z.number(),
    achieved: z.number(),
    percentage: z.number()
  }),
  
  tierProgress: z.object({
    currentTier: z.nativeEnum(DonorTier),
    nextTier: z.nativeEnum(DonorTier).optional(),
    requiredAmount: z.number().optional(),
    progressPercentage: z.number()
  })
});

export type DonorDashboardResponse = z.infer<typeof DonorDashboardResponseSchema>;

// 기부 영향 분석 응답 DTO
export const DonationImpactResponseSchema = z.object({
  estimatedBeneficiaries: z.number(),
  impactCategory: z.enum(['low', 'medium', 'high']),
  expectedOutcome: z.string(),
  similarProjectsSuccess: z.number(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  
  recommendations: z.array(z.string()),
  optimizationSuggestions: z.object({
    suggestedAmount: z.number(),
    suggestedFrequency: z.nativeEnum(DonationFrequency),
    taxBenefits: z.number(),
    impactMultiplier: z.number(),
    reasoning: z.array(z.string())
  })
});

export type DonationImpactResponse = z.infer<typeof DonationImpactResponseSchema>;

// 에러 응답 DTO
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional()
  })
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// 성공 응답 DTO
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any()
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SuccessResponse<T = any> = {
  success: true;
  data: T;
};
