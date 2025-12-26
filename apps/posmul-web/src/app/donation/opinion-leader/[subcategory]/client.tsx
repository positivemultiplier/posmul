"use client";

import Link from "next/link";
import { MotionDiv, staggerContainerVariants, fadeInVariants } from "@/shared/ui/components/motion/MotionComponents";
import { OpinionLeaderCard, OpinionLeader } from "../../../../bounded-contexts/donation/presentation/components/OpinionLeaderCard";

interface OpinionLeaderCategoryClientProps {
    category: string;
    categoryLabel: string;
    leaders: OpinionLeader[];
}

export function OpinionLeaderCategoryClient({
    category,
    categoryLabel,
    leaders,
}: OpinionLeaderCategoryClientProps) {

    return (
        <div className="space-y-12 pb-20">

            {/* Header */}
            <div className="bg-gray-900 text-white py-12 px-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 z-0" />
                <div className="relative z-10">
                    <nav className="text-sm text-gray-400 mb-4">
                        <Link href="/donation/opinion-leader" className="hover:text-white transition-colors">오피니언 리더</Link>
                        <span className="mx-2">/</span>
                        <span className="text-purple-400 font-medium">{categoryLabel}</span>
                    </nav>
                    <h1 className="text-3xl font-bold mb-4">{categoryLabel} 분야 리더</h1>
                    <p className="text-gray-300">
                        {categoryLabel} 분야에서 사회적 가치를 실현하는 오피니언 리더들을 만나보세요.
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-4">
                <MotionDiv
                    variants={staggerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {leaders.map((leader) => (
                        <MotionDiv key={leader.id} variants={fadeInVariants}>
                            <OpinionLeaderCard leader={leader} />
                        </MotionDiv>
                    ))}
                </MotionDiv>

                {leaders.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        해당 카테고리의 리더가 아직 없습니다.
                    </div>
                )}
            </div>

        </div>
    );
}
