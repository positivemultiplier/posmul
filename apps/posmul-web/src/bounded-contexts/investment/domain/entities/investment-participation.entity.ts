import { UserId } from "@posmul/auth-economy-sdk";

import { Result } from "@posmul/auth-economy-sdk";

import { z } from "zod";
import {
  CurrencyType,
  InvestmentOpportunityId,
  InvestmentParticipationId,
  ParticipationStatus,
} from "../value-objects/investment-value-objects";

// 투자 참여 엔티티의 속성을 정의합니다.
export interface InvestmentParticipationProps {
  id: InvestmentParticipationId;
  opportunityId: InvestmentOpportunityId;
  investorId: UserId;
  investmentAmount: number;
  currencyType: CurrencyType;
  pmpAmount?: number;
  pmcAmount?: number;
  expectedReturn?: number;
  actualReturn?: number;
  returnDate?: Date;
  status: ParticipationStatus;
  roiPercentage?: number;
  performanceScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * InvestmentParticipation Entity
 * 투자 참여 정보를 나타냅니다.
 */
export class InvestmentParticipation {
  private props: InvestmentParticipationProps;

  private constructor(props: InvestmentParticipationProps) {
    this.props = props;
  }

  public static create(
    props: Omit<
      InvestmentParticipationProps,
      "id" | "createdAt" | "updatedAt" | "status"
    >,
    id: InvestmentParticipationId
  ): Result<InvestmentParticipation, z.ZodError> {
    const schema = z
      .object({
        opportunityId: z.custom<InvestmentOpportunityId>(),
        investorId: z.custom<UserId>(),
        investmentAmount: z.number().positive(),
        currencyType: z.nativeEnum(CurrencyType),
        pmpAmount: z.number().nonnegative().optional(),
        pmcAmount: z.number().nonnegative().optional(),
      })
      .refine(
        (data) => {
          if (data.currencyType === CurrencyType.PMP)
            return (data.pmpAmount ?? 0) > 0 && !data.pmcAmount;
          if (data.currencyType === CurrencyType.PMC)
            return (data.pmcAmount ?? 0) > 0 && !data.pmpAmount;
          if (data.currencyType === CurrencyType.MIXED)
            return (data.pmpAmount ?? 0) > 0 && (data.pmcAmount ?? 0) > 0;
          return false;
        },
        { message: "Invalid PMP/PMC amount for the given currency type" }
      );

    const validationResult = schema.safeParse(props);
    if (!validationResult.success) {
      return validationResult;
    }

    const newProps: InvestmentParticipationProps = {
      ...props,
      id,
      status: ParticipationStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { success: true, data: new InvestmentParticipation(newProps) };
  }

  // Business logic methods
}
