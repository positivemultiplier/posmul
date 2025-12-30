import { useEffect, useState } from "react";
import { SupabaseDonationRepository } from "../../infrastructure/repositories/supabase-donation.repository";
import { Donation } from "../../domain/entities/donation.entity";
import { DonationCategory } from "../../domain/value-objects/donation-value-objects";
import { createClient } from "../../../../lib/supabase/client";

interface DonationData {
    totalDonated: number;
    donationCount: number;
    favoriteCategories: string[];
    currentRanking: number;
    totalUsers: number;
    socialImpactScore: number;
    recentDonations: {
        id: string;
        recipient: string;
        amount: number;
        category: string;
        date: string;
        impact: string;
        verified: boolean;
    }[];
}

export function useDonationData(userId?: string) {
    const [data, setData] = useState<DonationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!userId) {
                setLoading(false);
                return;
            }

            const repo = new SupabaseDonationRepository();
            const supabase = createClient();

            try {
                setLoading(true);

                // 1. Fetch Summary Stats
                const summary = await repo.getDashboardSummary(userId as any); // userId typing might need check

                // 2. Fetch Recent Donations
                const recentResult = await repo.findByDonorId(userId as any, 1, 5);

                // 3. (Optional) Fetch Total Users for Ranking (This is expensive, so maybe mock or efficient query)
                // For now, let's just get total distinct donors count if possible, or placeholder.
                // Doing a count on donations might be heavy. Let's start with a rough estimate if no API exists.
                // Actually, we can assume total users from a user profile table if we had access.

                if (summary.success === false) {
                    const errMsg = summary.error instanceof Error ? summary.error.message : String(summary.error);
                    throw new Error(errMsg);
                }
                if (recentResult.success === false) {
                    const errMsg = recentResult.error instanceof Error ? recentResult.error.message : String(recentResult.error);
                    throw new Error(errMsg);
                }

                const recentDonations = recentResult.data.items.map(d => ({
                    id: d.getId().getValue(),
                    recipient: d.getDescription().getValue() || "Unknown Recipient", // Or institute name if we had joining
                    amount: d.getAmount().getValue(),
                    category: d.getCategory(),
                    date: d.getCreatedAt().toISOString().split('T')[0],
                    impact: "사회적 가치 창출", // Placeholder or calculated from category/amount
                    verified: d.isCompleted()
                }));

                setData({
                    totalDonated: summary.data.totalDonated,
                    donationCount: summary.data.donationCount,
                    favoriteCategories: [summary.data.favoriteCategory], // Only one favorite for now from simple repo
                    currentRanking: 0, // Placeholder
                    totalUsers: 0, // Placeholder
                    socialImpactScore: Math.floor(summary.data.totalDonated * 0.1), // Simple calculation formula
                    recentDonations
                });

            } catch (err) {
                setError(err instanceof Error ? err : new Error("Failed to fetch donation data"));
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [userId]);

    return { data, loading, error };
}
