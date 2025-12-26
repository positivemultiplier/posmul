"use client";

import Link from "next/link";
import { SpotlightCard } from "@/shared/ui/components/motion/SpotlightCard";

export interface OpinionLeader {
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    socialLinks: Record<string, string>;
    isVerified: boolean;
    followerCount: number;
    totalDonationsInfluenced: number;
    category: string;
    categoryLabel: string;
    categoryIcon: string;
    categoryColor: string;
    isFollowing: boolean;
}

interface OpinionLeaderCardProps {
    leader: OpinionLeader;
}

export const OpinionLeaderCard = ({ leader }: OpinionLeaderCardProps) => {

    // Helper to format large numbers
    const formatCount = (num: number) => {
        if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}천`;
        return num.toLocaleString();
    };

    const formatAmount = (num: number) => {
        if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
        if (num >= 10000) return `${(num / 10000).toFixed(0)}만`;
        return num.toLocaleString();
    };

    return (
        <Link href={`/donation/opinion-leader/${leader.category}/general/${leader.id}`}>
            <SpotlightCard className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-500/50 transition-colors group">
                <div className="p-6 flex flex-col h-full">

                    {/* Header: Avatar & Badge */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="relative">
                            {leader.avatarUrl ? (
                                <img src={leader.avatarUrl} alt={leader.displayName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 shadow-sm" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-3xl">
                                    {leader.categoryIcon}
                                </div>
                            )}
                            {leader.isVerified && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white dark:border-gray-800" title="인증됨">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                </div>
                            )}
                        </div>

                        <div className={`px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300`}>
                            {leader.categoryLabel}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 transition-colors">
                            {leader.displayName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 h-10">
                            {leader.bio}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-xs text-gray-500">팔로워</div>
                            <div className="font-bold text-gray-900 dark:text-white">{formatCount(leader.followerCount)}</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="text-xs text-gray-500">기부 영향력</div>
                            <div className="font-bold text-purple-600">{formatAmount(leader.totalDonationsInfluenced)}</div>
                        </div>
                    </div>

                </div>
            </SpotlightCard>
        </Link>
    );
};
