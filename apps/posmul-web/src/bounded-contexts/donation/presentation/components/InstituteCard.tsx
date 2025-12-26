"use client";

import Link from "next/link";
import { SpotlightCard } from "@/shared/ui/components/motion/SpotlightCard";
import { Badge } from "@/shared/ui/components/base";

export interface Institute {
    id: string;
    name: string;
    description: string;
    category: string;
    categoryLabel: string;
    categoryIcon: string;
    websiteUrl: string | null;
    trustScore: number;
    isVerified: boolean;
}

interface InstituteCardProps {
    institute: Institute;
}

export const InstituteCard = ({ institute }: InstituteCardProps) => {
    return (
        <Link href={`/donation/institute/${institute.category}/general/${institute.id}`}>
            <SpotlightCard className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-500/50 transition-colors group">
                <div className="p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl shadow-sm">
                            {institute.categoryIcon}
                        </div>
                        {institute.isVerified && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                ✓ 인증됨
                            </Badge>
                        )}
                    </div>

                    {/* Body */}
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 transition-colors">
                            {institute.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                            {institute.description}
                        </p>
                    </div>

                    {/* Footer (Stats/Trust) */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {institute.categoryLabel}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Trust Score">
                            <span className="text-sm">🛡️</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{institute.trustScore.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* Hover Action */}
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                        <span className="text-green-500 font-medium text-sm flex items-center gap-1">
                            둘러보기 →
                        </span>
                    </div>
                </div>
            </SpotlightCard>
        </Link>
    );
};
