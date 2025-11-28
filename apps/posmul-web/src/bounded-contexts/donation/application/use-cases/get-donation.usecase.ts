/**
 * Get Donation Use Case
 * 기부 상세 조회 유스케이스
 */
import { Result, ValidationError } from "@posmul/auth-economy-sdk";
import { Donation } from "../../domain/entities/donation.entity";
import { IDonationRepository } from "../../domain/repositories/donation.repository";
import { DonationId } from "../../domain/value-objects/donation-value-objects";

export class GetDonationUseCase {
    constructor(private readonly donationRepository: IDonationRepository) { }

    async execute(donationId: string): Promise<Result<Donation>> {
        if (!donationId) {
            return {
                success: false,
                error: new ValidationError("Donation ID is required"),
            };
        }

        try {
            const id = new DonationId(donationId);
            const result = await this.donationRepository.findById(id);

            if (!result.success) {
                return result as Result<Donation>;
            }

            if (!result.data) {
                return {
                    success: false,
                    error: new ValidationError("Donation not found", { donationId }),
                };
            }

            return {
                success: true,
                data: result.data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error("Failed to get donation"),
            };
        }
    }
}
