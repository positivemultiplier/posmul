import { UserId } from "@posmul/auth-economy-sdk";
import { Result } from "@posmul/auth-economy-sdk";
import { z } from "zod";

import {
  InvestmentCategory,
  InvestmentOpportunityId,
  InvestmentType,
  OpportunityStatus,
  RiskLevel,
} from "../value-objects/investment-value-objects";

// 투자 기회 엔티티의 속성을 정의합니다.
export interface InvestmentOpportunityProps {
  id: InvestmentOpportunityId;
  creatorId: UserId;
  title: string;
  description: string;
  investmentType: InvestmentType;
  category: InvestmentCategory;
  subcategory?: string;
  targetAmount: number;
  minimumInvestment: number;
  maximumInvestment?: number;
  currentAmount: number;
  fundingStartDate: Date;
  fundingEndDate: Date;
  expectedReturnDate?: Date;
  expectedReturnRate?: number;
  riskLevel: RiskLevel;
  status: OpportunityStatus;
  pmpRequired: boolean;
  pmcRewardPool?: number;
  moneyWaveEligible: boolean;
  performanceMetrics?: any;
  tags?: string[];
  externalLinks?: any;
  documents?: any;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * InvestmentOpportunity Entity
 * DDD의 Aggregate Root 역할을 합니다.
 */
export class InvestmentOpportunity {
  private props: InvestmentOpportunityProps;

  private constructor(props: InvestmentOpportunityProps) {
    this.props = props;
  }

  public static create(
    props: Omit<
      InvestmentOpportunityProps,
      "id" | "createdAt" | "updatedAt" | "version" | "currentAmount" | "status"
    >,
    id: InvestmentOpportunityId
  ): Result<InvestmentOpportunity, z.ZodError> {
    const schema = z
      .object({
        creatorId: z.custom<UserId>(),
        title: z.string().min(10).max(200),
        description: z.string().min(50).max(5000),
        investmentType: z.nativeEnum(InvestmentType),
        category: z.nativeEnum(InvestmentCategory),
        targetAmount: z.number().positive(),
        minimumInvestment: z.number().positive(),
        fundingStartDate: z.date(),
        fundingEndDate: z.date(),
        riskLevel: z.nativeEnum(RiskLevel),
        pmpRequired: z.boolean(),
        moneyWaveEligible: z.boolean(),
      })
      .refine(
        (data) => data.fundingEndDate > data.fundingStartDate,
        new Error("Funding end date must be after start date")
      );

    const validationResult = schema.safeParse(props);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error,
      };
    }

    const newProps: InvestmentOpportunityProps = {
      ...props,
      id,
      currentAmount: 0,
      status: OpportunityStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    return { success: true, data: new InvestmentOpportunity(newProps) };
  }

  // Business logic methods will be added here.
  // 예: activate, fund, complete, cancel 등
}
