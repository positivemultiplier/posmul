import { z } from 'zod';
import { InvestmentType } from '../../domain/value-objects/investment-value-objects';

// Investment 관련 DTO
export const CreateInvestmentRequestSchema = z.object({
  type: z.nativeEnum(InvestmentType, { 
    errorMap: () => ({ message: '유효한 투자 타입을 선택해주세요' }) 
  }),
  targetId: z.string().min(1, '투자 대상 ID는 필수입니다'),
  amount: z.number().min(1000, '최소 투자 금액은 1,000원입니다').max(10000000, '최대 투자 금액은 1,000만원입니다'),
  message: z.string().max(500, '메시지는 500자 이하여야 합니다').optional()
});

export const InvestmentListRequestSchema = z.object({
  userId: z.string().optional(),
  type: z.nativeEnum(InvestmentType).optional(),
  targetId: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['created', 'amount', 'updated']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const UpdateInvestmentRequestSchema = z.object({
  id: z.string().min(1, '투자 ID는 필수입니다'),
  message: z.string().max(500, '메시지는 500자 이하여야 합니다').optional()
});

export const InvestmentStatsRequestSchema = z.object({
  userId: z.string().min(1, '사용자 ID는 필수입니다'),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month')
});

export const InvestmentResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.nativeEnum(InvestmentType),
  targetId: z.string(),
  amount: z.number(),
  rewardEarned: z.number(),
  status: z.string(),
  message: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  target: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string().optional()
  }).optional()
});

export const InvestmentListResponseSchema = z.object({
  investments: z.array(InvestmentResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
});

export const InvestmentStatsResponseSchema = z.object({
  totalInvestments: z.number(),
  totalAmount: z.number(),
  totalRewards: z.number(),
  typeStats: z.array(z.object({
    type: z.nativeEnum(InvestmentType),
    count: z.number(),
    amount: z.number(),
    rewards: z.number(),
    percentage: z.number()
  })),
  monthlyStats: z.array(z.object({
    month: z.string(),
    count: z.number(),
    amount: z.number(),
    rewards: z.number()
  })),
  portfolioHealth: z.object({
    isHealthy: z.boolean(),
    recommendation: z.string(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'])
  })
});

export const CreateInvestmentResponseSchema = z.object({
  success: z.boolean(),
  investmentId: z.string(),
  rewardRate: z.number(),
  estimatedReturn: z.number(),
  message: z.string().optional()
});

// 타입 추론
export type CreateInvestmentRequest = z.infer<typeof CreateInvestmentRequestSchema>;
export type InvestmentListRequest = z.infer<typeof InvestmentListRequestSchema>;
export type UpdateInvestmentRequest = z.infer<typeof UpdateInvestmentRequestSchema>;
export type InvestmentStatsRequest = z.infer<typeof InvestmentStatsRequestSchema>;
export type InvestmentResponse = z.infer<typeof InvestmentResponseSchema>;
export type InvestmentListResponse = z.infer<typeof InvestmentListResponseSchema>;
export type InvestmentStatsResponse = z.infer<typeof InvestmentStatsResponseSchema>;
export type CreateInvestmentResponse = z.infer<typeof CreateInvestmentResponseSchema>;
