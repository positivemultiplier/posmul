import { Result } from "@posmul/auth-economy-sdk";
import { failure, success } from "@posmul/auth-economy-sdk";
import { EconomyError as EconomicError, IDomainEventPublisher, PmcSpentEvent, PmpSpentEvent } from "@posmul/auth-economy-sdk";
import { EconomyKernel } from "../../../../shared/economy-kernel/services/economy-kernel.service";
import { InvestmentParticipation } from "../entities/investment-participation.entity";
import { IInvestmentOpportunityRepository } from "../repositories/investment-opportunity.repository";
import { IInvestmentParticipationRepository } from "../repositories/investment-participation.repository";

/**
 * InvestmentEconomicService
 * 투자 도메인의 경제 관련 로직을 처리하는 도메인 서비스
 */
export class InvestmentEconomicService {
  constructor(
    private readonly economyKernel: EconomyKernel,
    private readonly eventPublisher: IDomainEventPublisher,
    private readonly opportunityRepo: IInvestmentOpportunityRepository,
    private readonly participationRepo: IInvestmentParticipationRepository
  ) {}

  /**
   * 투자에 참여하고 경제 이벤트를 발행합니다.
   * @param participation - 투자 참여 엔티티
   * @returns 성공 또는 경제 관련 오류
   */
  async participate(
    participation: InvestmentParticipation
  ): Promise<Result<void, EconomicError>> {
    const props = (participation as any).props;
    const investorId = props.investorId;

    // 1. 투자에 필요한 PMP/PMC 잔액이 충분한지 확인
    const pmpBalance = await this.economyKernel.getPmpBalance(investorId);
    const pmcBalance = await this.economyKernel.getPmcBalance(investorId);

    if (pmpBalance < (props.pmpAmount || 0)) {
      return failure(
        new EconomicError("Insufficient PMP balance", "insufficient-pmp")
      );
    }
    if (pmcBalance < (props.pmcAmount || 0)) {
      return failure(
        new EconomicError("Insufficient PMC balance", "insufficient-pmc")
      );
    }

    // 2. 경제 이벤트 발행
    if (props.pmpAmount && props.pmpAmount > 0) {
      await this.eventPublisher.publish(
        new PmpSpentEvent(
          investorId,
          props.pmpAmount,
          "investment-participation",
          props.opportunityId.toString()
        )
      );
    }
    if (props.pmcAmount && props.pmcAmount > 0) {
      await this.eventPublisher.publish(
        new PmcSpentEvent(
          investorId,
          props.pmcAmount,
          "investment-participation",
          props.opportunityId.toString()
        )
      );
    }

    // 3. 투자 참여 기록 저장 (실제로는 Use Case에서 처리)
    // await this.participationRepo.save(participation);

    return success(undefined);
  }
}
