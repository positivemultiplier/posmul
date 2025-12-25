/**
 * List Donations Use Case
 * 기부 목록 조회 유스케이스
 */
import { PaginatedResult, Result, UserId } from "@posmul/auth-economy-sdk";
import { Donation } from "../../domain/entities/donation.entity";
import { IDonationRepository } from "../../domain/repositories/donation.repository";
import {
    DonationCategory,
    DonationFrequency,
    DonationStatus,
    DonationType,
    InstituteId,
    OpinionLeaderId,
} from "../../domain/value-objects/donation-value-objects";
import { DonationSearchRequest } from "../dto/donation.dto";

export class ListDonationsUseCase {
    constructor(private readonly donationRepository: IDonationRepository) { }

    async execute(
        request: DonationSearchRequest
    ): Promise<Result<PaginatedResult<Donation>>> {
        try {
            // Convert DTO to domain search criteria
            const criteria = {
                donorId: request.donorId ? (request.donorId as UserId) : undefined, // Assuming cast or conversion needed
                status: request.status as DonationStatus,
                type: request.type as DonationType,
                category: request.category as DonationCategory,
                frequency: request.frequency as DonationFrequency,
                instituteId: request.instituteId
                    ? new InstituteId(request.instituteId)
                    : undefined,
                opinionLeaderId: request.opinionLeaderId
                    ? new OpinionLeaderId(request.opinionLeaderId)
                    : undefined,
                startDate: request.startDate ? new Date(request.startDate) : undefined,
                endDate: request.endDate ? new Date(request.endDate) : undefined,
                minAmount: request.minAmount,
                maxAmount: request.maxAmount,
                isAnonymous: request.isAnonymous,
            };

            return await this.donationRepository.findByCriteria(
                criteria,
                request.page,
                request.limit
            );
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error
                        : new Error("Failed to list donations"),
            };
        }
    }
}
