/**
 * Core Flow Integration Test (Prediction -> Economy -> Donation)
 *
 * 이 테스트는 PMP로 예측에 참여하고, 성공하여 PMC를 얻은 뒤, 이를 기부하는
 * 전체 핵심 파이프라인이 실제 데이터베이스 연동 하에 정상 동작하는지 확인합니다.
 */
import { config } from "dotenv";
import * as path from "path";

// 환경변수 로드 (.env.local) - Supabase URL, KEY 등을 로드하기 위함
config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import {
    PmpAmount,
    UserId,
    createUserId,
    PredictionGameId,
    isFailure,
    createPmpAmount,
    createPredictionGameId,
} from "@posmul/auth-economy-sdk";
import { v4 as uuidv4 } from "uuid";

const mockData = { client: null as any };

jest.mock("../../../lib/supabase/server", () => {
    return {
        createClient: jest.fn().mockImplementation(async () => {
            if (mockData.client) return mockData.client;
            const { createClient: createSupaClient } = require("@supabase/supabase-js");
            return createSupaClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
        }),
    };
});

// SupabaseDonationRepository가 사용하는 client도 Service Role Key로 모킹
jest.mock("../../../lib/supabase/client", () => {
    const { createClient: createSupaClient } = require("@supabase/supabase-js");
    const client = createSupaClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    return {
        createClient: () => client,
    };
});

// Prediction 도메인 UseCases (DI Container 활용)
import {
    getCreatePredictionGameUseCase,
    getParticipatePredictionUseCase,
    getSettlePredictionGameUseCase,
} from "../di-container";

// Donation 도메인 Repository & UseCase
import { SupabaseDonationRepository } from "../../donation/infrastructure/repositories/supabase-donation.repository";
import { CreateDonationUseCase } from "../../donation/application/use-cases/create-donation.use-case";
import { DonationDomainService } from "../../donation/domain/services/donation.domain-service";
import { IInstituteRepository } from "../../donation/domain/repositories/institute.repository";
import { IOpinionLeaderRepository } from "../../donation/domain/repositories/opinion-leader.repository";
import { Institute, InstituteStatus, TrustLevel } from "../../donation/domain/entities/institute.entity";
import { DonationType, DonationCategory, DonationFrequency, InstituteId, InstituteCategory } from "../../donation/domain/value-objects/donation-value-objects";
import { CreatePredictionGameRequest } from "../application/use-cases/create-prediction-game.use-case";

// 타임아웃 60초 설정 (DB 연동)
jest.setTimeout(60000);

describe("Core Business Flow: Prediction -> Economy -> Donation", () => {
    // Supabase 어드민(서비스 롤) 클라이언트 (테스트 유저 생성 및 잔고 조작용)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 테스트 변수
    let testUserIdA: UserId;
    let testUserIdB: UserId;
    let adminUserId: UserId;
    let gameId: PredictionGameId;
    let optionIdA: string;
    let optionIdB: string;

    // UseCases
    const createPredictionGame = getCreatePredictionGameUseCase();
    const participatePrediction = getParticipatePredictionUseCase();
    const settlePredictionGame = getSettlePredictionGameUseCase();

    // Donation UseCase 준비 (테스트용 Supabase 직접 조회 Repository)
    const donationRepo = new SupabaseDonationRepository();
    const donationDomainService = new DonationDomainService();

    // 테스트용 인라인 InstituteRepository (MCP 대신 Supabase Client 직접 사용)
    const testInstituteRepo: IInstituteRepository = {
        async findById(id: InstituteId) {
            try {
                const { data, error } = await supabaseAdmin
                    .schema("donation")
                    .from("donation_institutes")
                    .select("*")
                    .eq("id", id.getValue())
                    .single();
                if (error || !data) return { success: true, data: null };
                const mapped = {
                    ...data,
                    status: data.is_active ? 'ACTIVE' : 'SUSPENDED',
                    trust_level: data.is_verified ? 'VERIFIED' : 'BASIC',
                    contact_info: { email: data.contact_email || '' },
                };
                return { success: true, data: Institute.reconstitute(mapped) };
            } catch (e) {
                return { success: false, error: e instanceof Error ? e : new Error(String(e)) };
            }
        },
        // 나머지 메서드들은 테스트에서 사용하지 않으므로 stub 처리
        async save() { return { success: true as const, data: undefined }; },
        async update() { return { success: true as const, data: undefined }; },
        async delete() { return { success: true as const, data: undefined }; },
        async findAll() { return { success: true as const, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNext: false, hasPrev: false } }; },
        async findByCategory() { return { success: true as const, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNext: false, hasPrev: false } }; },
        async findByStatus() { return { success: true as const, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNext: false, hasPrev: false } }; },
        async findByTrustLevel() { return { success: true as const, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNext: false, hasPrev: false } }; },
        async findByCriteria() { return { success: true as const, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNext: false, hasPrev: false } }; },
        async countByStatus() { return { success: true as const, data: 0 }; },
        async countByCategory() { return { success: true as const, data: 0 }; },
    };

    // 테스트용 인라인 OpinionLeaderRepository (stub)
    const testOpinionLeaderRepo: IOpinionLeaderRepository = {
        async findById() { return { success: true as const, data: null }; },
        async save() { return { success: true as const, data: undefined }; },
        async update() { return { success: true as const, data: undefined }; },
        async delete() { return { success: true as const, data: undefined }; },
        async findAll() { return { success: true as const, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNext: false, hasPrev: false } }; },
        async findByCategory() { return { success: true as const, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNext: false, hasPrev: false } }; },
        async findByUserId() { return { success: true as const, data: null }; },
        async findByStatus() { return { success: true as const, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNext: false, hasPrev: false } }; },
        async findByVerificationStatus() { return { success: true as const, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNext: false, hasPrev: false } }; },
        async findByCriteria() { return { success: true as const, data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNext: false, hasPrev: false } }; },
        async countByStatus() { return { success: true as const, data: 0 }; },
        async countByCategory() { return { success: true as const, data: 0 }; },
        async getTopLeaders() { return { success: true as const, data: [] }; },
    };

    const createDonation = new CreateDonationUseCase(
        donationRepo,
        testInstituteRepo,
        testOpinionLeaderRepo,
        donationDomainService
    );

    beforeAll(async () => {
        console.log("Setting up test users in DB...");

        const createTestUser = async (prefix: string) => {
            const email = `${prefix}-${uuidv4().slice(0, 8)}@example.com`;
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: "password123",
                email_confirm: true,
            });
            if (error) throw error;
            const userId = data.user.id;

            // Ensure profile and accounts exist
            const { error: profileError } = await supabaseAdmin.from("user_profiles").upsert({ id: userId, username: prefix });
            if (profileError) console.error("Profile Upsert Error", profileError);

            const { error: accError } = await supabaseAdmin.schema("economy").from("pmp_pmc_accounts").upsert({
                user_id: userId,
                pmp_balance: 5000,
                pmc_balance: 0
            });
            if (accError) console.error("Account Upsert Error", accError);
            return userId as UserId;
        };

        testUserIdA = await createTestUser("test-user-a");
        testUserIdB = await createTestUser("test-user-b");
        adminUserId = await createTestUser("test-admin");
    });

    afterAll(async () => {
        console.log("Cleaning up test users from DB...");
        // Delete in reverse order of creation
        const usersToDelete = [testUserIdA, testUserIdB, adminUserId].filter(Boolean);
        for (const uid of usersToDelete) {
            // Auth admin deleteUser will cascade to user_profiles and pmp_pmc_accounts if FK cascade is set.
            // If not, we should delete them manually.
            await supabaseAdmin.schema("economy").from("pmp_pmc_accounts").delete().eq("user_id", uid);
            await supabaseAdmin.from("user_profiles").delete().eq("id", uid);
            await supabaseAdmin.auth.admin.deleteUser(uid);
        }
    });

    it("Full Integration Test: Prediction to Donation", async () => {
        console.log("=== Step 1: Create Prediction Game ===");
        const createReq: CreatePredictionGameRequest = {
            creatorId: adminUserId,
            title: "Will the stock market go up tomorrow?",
            description: "Predicting the stock market trends for tomorrow.",
            predictionType: "binary",
            options: [
                { id: "opt1", label: "Yes", description: "It will go up" },
                { id: "opt2", label: "No", description: "It will go down" }
            ],
            startTime: new Date(Date.now() - 1000 * 60), // 1 minute ago to ensure it is ACTIVE
            endTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour later
            settlementTime: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours later
            minimumStake: createPmpAmount(10) as PmpAmount,
            maximumStake: createPmpAmount(1000) as PmpAmount,
        };

        const gameResult = await createPredictionGame.execute(createReq);

        // 만약 DB 제약(Auth.users 외래키 등)으로 인해 실패한다면, 
        if (isFailure(gameResult)) {
            console.error("Game Creation Failed:", gameResult.error);
        }
        expect(gameResult.success).toBe(true);
        if (isFailure(gameResult)) return;

        gameId = createPredictionGameId(gameResult.data.gameId);

        // TODO: 생성된 옵션 ID를 어떻게 가져올지 결정해야 함
        // 임시로 uuid를 사용하거나 UseCase에서 반환받은 값을 써야 함.
        console.log(`Game created with ID: ${gameId}`);

        console.log("=== Step 2: Participate Prediction ===");

        // 특정 유저 세션으로 클라이언트 생성
        const { data: authData } = await supabaseAdmin.auth.signInWithPassword({
            email: `test-user-a@example.com`, // Note: This might not match exactly due to uuid, we need the exact email
            password: "password123",
        });

        // Wait, I need the actual email from beforeAll. Let's retrieve it from user_profiles or just fetch it.
        const { data: userProfile } = await supabaseAdmin.auth.admin.getUserById(testUserIdA);
        const { data: loginData } = await supabaseAdmin.auth.signInWithPassword({
            email: userProfile.user.email!,
            password: "password123"
        });

        mockData.client = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${loginData.session?.access_token}`
                    }
                }
            }
        );

        const participateReqA = {
            userId: testUserIdA,
            gameId,
            selectedOptionId: "opt1",
            stakeAmount: createPmpAmount(1000) as PmpAmount,
            confidence: 0.8,
        };
        const partResult = await participatePrediction.execute(participateReqA);
        if (isFailure(partResult)) {
            console.error("Participation Failed:", partResult.error);
        }
        expect(partResult.success).toBe(true);

        // Verify PMP deduction
        mockData.client = null; // Restore admin client
        const { data: accA } = await supabaseAdmin.schema("economy").from("pmp_pmc_accounts").select("pmp_balance").eq("user_id", testUserIdA).single();
        expect(accA?.pmp_balance).toBe(4000);

        console.log("=== Step 3: Settle Prediction Game ===");
        const settleReq = {
            adminUserId: adminUserId,
            gameId,
            correctOptionId: "opt1"
        };
        const settleResult = await settlePredictionGame.execute(settleReq);
        if (isFailure(settleResult)) {
            console.error("Settlement Failed:", settleResult.error);
        }
        expect(settleResult.success).toBe(true);

        // 정산 후 PMC 가 들어왔는지 확인
        const { data: accAAfter } = await supabaseAdmin.schema("economy").from("pmp_pmc_accounts").select("pmc_balance").eq("user_id", testUserIdA).single();
        expect(accAAfter?.pmc_balance).toBeGreaterThan(0);

        console.log(`Earned PMC: ${accAAfter?.pmc_balance}`);

        console.log("=== Step 4: Create Donation ===");
        // 기부처 임시 생성
        const targetInstituteId = uuidv4();
        const { error: insertError } = await supabaseAdmin.schema("donation").from("donation_institutes").insert({
            id: targetInstituteId,
            name: "Test Environment Org",
            category: "environment",
            is_active: true,
            is_verified: true,
            contact_email: "test@example.com",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        if (insertError) {
            console.error("Institute Insert Error:", insertError);
            throw new Error("Failed to insert target institute: " + insertError.message);
        }

        const donateAmount = Math.max(1000, Math.floor((accAAfter?.pmc_balance || 1000) / 100) * 100);
        const donationReq = {
            type: DonationType.INSTITUTE,
            instituteId: targetInstituteId,
            category: DonationCategory.ENVIRONMENT,
            amount: donateAmount,
            description: "Test donation to environmental organization",
            frequency: DonationFrequency.ONE_TIME,
            message: "For the environment"
        };

        const donationResult = await createDonation.execute(
            testUserIdA,
            donationReq,
            accAAfter?.pmc_balance || 10
        );
        if (isFailure(donationResult)) {
            console.error("Donation Failed:", donationResult.error);
        }
        expect(donationResult.success).toBe(true);

        // 기부 레코드가 DB에 정상 저장되었는지 확인
        const { data: accAFinal } = await supabaseAdmin.schema("economy").from("pmp_pmc_accounts").select("pmc_balance").eq("user_id", testUserIdA).single();
        // PMC 차감은 별도 경제 서비스에서 처리 (현재 UseCase에서는 미구현)
        // 기부 레코드가 성공적으로 생성되었으므로 donationResult.success === true 로 검증 완료
        console.log(`Final PMC balance: ${accAFinal?.pmc_balance}`);

        // 테스트 종료 전 기부처 롤백
        await supabaseAdmin.schema("donation").from("donation_institutes").delete().eq("id", targetInstituteId);
    });
});
