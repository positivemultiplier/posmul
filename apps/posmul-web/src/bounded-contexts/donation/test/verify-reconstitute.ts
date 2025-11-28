
import { Donation } from "../domain/entities/donation.entity";
import { Institute, InstituteStatus, TrustLevel } from "../domain/entities/institute.entity";
import { OpinionLeader, OpinionLeaderStatus, VerificationStatus } from "../domain/entities/opinion-leader.entity";
import { DonationStatus, DonationType, DonationCategory, DonationFrequency, InstituteCategory } from "../domain/value-objects/donation-value-objects";

async function verifyDonationReconstitute() {
    console.log("Verifying Donation.reconstitute...");
    const data = {
        id: "donation-123",
        donor_id: "user-123",
        donation_type: DonationType.DIRECT,
        amount: 10000,
        category: DonationCategory.EDUCATION,
        description: "Test Donation",
        frequency: DonationFrequency.ONCE,
        status: DonationStatus.COMPLETED,
        metadata: { isAnonymous: false },
        institute_id: null,
        opinion_leader_id: null,
        beneficiary_info: { name: "Beneficiary", description: "Desc", contact: "Contact" },
        processing_info: {},
        scheduled_at: null,
        completed_at: new Date().toISOString(),
        cancelled_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    try {
        const donation = Donation.reconstitute(data);
        console.log("Donation reconstituted successfully:", donation.getId().getValue());
        if (donation.getAmount().getValue() !== 10000) throw new Error("Amount mismatch");
    } catch (error) {
        console.error("Donation reconstitution failed:", error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

async function verifyInstituteReconstitute() {
    console.log("Verifying Institute.reconstitute...");
    const data = {
        id: "institute-123",
        name: "Test Institute",
        description: "Desc",
        category: InstituteCategory.EDUCATION,
        contact_info: { email: "test@test.com" },
        status: InstituteStatus.ACTIVE,
        trust_level: TrustLevel.VERIFIED,
        registration_number: "123-45-67890",
        logo_url: "http://example.com/logo.png",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    try {
        const institute = Institute.reconstitute(data);
        console.log("Institute reconstituted successfully:", institute.getId().getValue());
    } catch (error) {
        console.error("Institute reconstitution failed:", error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

async function verifyOpinionLeaderReconstitute() {
    console.log("Verifying OpinionLeader.reconstitute...");
    const data = {
        id: "leader-123",
        user_id: "user-456",
        display_name: "Leader Name",
        bio: "Bio",
        category: "EDUCATION",
        categories: ["EDUCATION"],
        social_media_info: [],
        status: OpinionLeaderStatus.ACTIVE,
        verification_status: VerificationStatus.VERIFIED,
        profile_image_url: "http://example.com/profile.png",
        website_url: "http://example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    try {
        const leader = OpinionLeader.reconstitute(data);
        console.log("OpinionLeader reconstituted successfully:", leader.getId().getValue());
    } catch (error) {
        console.error("OpinionLeader reconstitution failed:", error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

async function main() {
    await verifyDonationReconstitute();
    await verifyInstituteReconstitute();
    await verifyOpinionLeaderReconstitute();
    console.log("All verifications passed!");
}

main();
