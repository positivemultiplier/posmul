"use server";

import { revalidatePath } from "next/cache";
import { Result } from "@posmul/auth-economy-sdk";
import { CreateDonationUseCase } from "../application/use-cases/create-donation.use-case";
import { GetDonationUseCase } from "../application/use-cases/get-donation.usecase";
import { ListDonationsUseCase } from "../application/use-cases/list-donations.usecase";
import { MCPDonationRepository } from "../infrastructure/repositories/mcp-donation.repository";
import { MCPInstituteRepository } from "../infrastructure/repositories/mcp-institute.repository";
import { MCPOpinionLeaderRepository } from "../infrastructure/repositories/mcp-opinion-leader.repository";
import { DonationDomainService } from "../domain/services/donation.domain-service";
import { CreateDonationRequest, DonationSearchRequest } from "../application/dto/donation.dto";
import { Donation } from "../domain/entities/donation.entity";
import { PaginatedResult } from "@posmul/auth-economy-sdk";

// Dependency Injection
const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || "default";
const donationRepository = new MCPDonationRepository(projectId);
const instituteRepository = new MCPInstituteRepository(projectId);
const opinionLeaderRepository = new MCPOpinionLeaderRepository(projectId);
const donationDomainService = new DonationDomainService();

const createDonationUseCase = new CreateDonationUseCase(
    donationRepository,
    instituteRepository,
    opinionLeaderRepository,
    donationDomainService
);

const getDonationUseCase = new GetDonationUseCase(donationRepository);
const listDonationsUseCase = new ListDonationsUseCase(donationRepository);

// Actions

export async function createDonationAction(
    donorId: string,
    request: CreateDonationRequest,
    donorBalance: number
): Promise<Result<any>> { // Return type simplified for serialization
    // Note: We need to handle UserId casting here or in the use case
    // Assuming donorId string is valid UserId for now
    const result = await createDonationUseCase.execute(
        donorId as any,
        request,
        donorBalance
    );

    if (!result.success) {
        return {
            success: false,
            error: JSON.parse(JSON.stringify((result as any).error)),
        };
    }

    revalidatePath("/donations");
    return {
        success: true,
        data: JSON.parse(JSON.stringify(result.data)),
    };
}

export async function getDonationAction(id: string): Promise<Result<any>> {
    const result = await getDonationUseCase.execute(id);

    if (!result.success) {
        return {
            success: false,
            error: JSON.parse(JSON.stringify((result as any).error)),
        };
    }

    return {
        success: true,
        data: JSON.parse(JSON.stringify(result.data)),
    };
}

export async function listDonationsAction(
    request: DonationSearchRequest
): Promise<Result<PaginatedResult<any>>> {
    const result = await listDonationsUseCase.execute(request);

    if (!result.success) {
        return {
            success: false,
            error: JSON.parse(JSON.stringify((result as any).error)),
        };
    }

    return {
        success: true,
        data: JSON.parse(JSON.stringify(result.data)),
    };
}
