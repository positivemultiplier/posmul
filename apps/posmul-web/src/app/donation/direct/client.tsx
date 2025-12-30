"use client";

import { useState } from "react";
import Link from "next/link";
import { MotionDiv, staggerContainerVariants } from "@/shared/ui/components/motion/MotionComponents";
import { SpotlightCard } from "@/shared/ui/components/motion/SpotlightCard";
import { NumberTicker } from "@/shared/ui/components/motion/NumberTicker";
import { ShinyText } from "@/shared/ui/components/motion/ShinyText";

interface FundingProject {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  target_beneficiary: string;
  product_name: string;
  manufacturer: string;
  unit_price: number;
  target_quantity: number;
  current_quantity: number;
  achievementRate: number;
  images: string[];
}

interface DirectDonationClientProps {
  projects: FundingProject[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}

export function DirectDonationClient({
  projects,
  isLoggedIn,
}: DirectDonationClientProps) {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-800 to-indigo-900 text-white py-20 px-4 overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-lg">
              <span className="text-xl">🌏</span>
              <span className="text-sm font-semibold text-purple-100">World's Best Technology, Delivered with Heart</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
              당신의 후원이 <br className="md:hidden" />
              <ShinyText text="World Class Quality" speed={3} className="text-purple-300" />
              로 전달됩니다
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              삼성, LG 등 세계 최고의 기술력을 가진 한국 기업의 제품을 기부하세요.<br />
              최고의 품질이 담긴 선물이 아이들의 꿈을 더 크게 키워줍니다.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { label: "진행중인 펀딩", value: projects.length, icon: "🔥" },
                { label: "전달된 물품", value: 1240, icon: "🎁" }, // Mock data
                { label: "함께한 기업", value: 15, icon: "🏭" },
                { label: "수혜 이웃", value: 382, icon: "🥰" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold"><NumberTicker value={stat.value} /></div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </MotionDiv>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>진행 중인 프로젝트</span>
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm px-2 py-0.5 rounded-full">
              {projects.length}
            </span>
          </h2>
        </div>

        <MotionDiv
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {projects.length > 0 ? (
            projects.map((project) => (
              <FundingCard key={project.id} project={project} />
            ))
          ) : (
            <div className="col-span-3 text-center py-20 text-gray-500">
              진행 중인 펀딩 프로젝트가 없습니다.
            </div>
          )}
        </MotionDiv>
      </div>
    </div>
  );
}

function FundingCard({ project }: { project: FundingProject }) {
  const isUrgent = project.achievementRate >= 80 && project.achievementRate < 100;

  return (
    <Link href={`/donation/direct/item/${project.id}`} className="block h-full group">
      <SpotlightCard className="h-full bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-purple-500/50 transition-colors">
        <div className="flex flex-col h-full">
          {/* Image Area */}
          <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {/* Placeholder for real image */}
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30 bg-purple-100 dark:bg-purple-900/30">
              {project.categoryIcon}
            </div>

            <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 z-10">
              <span>{project.categoryIcon}</span>
              <span>{project.categoryLabel}</span>
            </div>

            {isUrgent && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse z-10">
                마감임박
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-6 flex-1 flex flex-col">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-purple-600 transition-colors">
                {project.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                {project.description}
              </p>

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                <span className="flex-1 border-r border-gray-200 dark:border-gray-600 pr-3">
                  <span className="block text-xs text-gray-400 mb-0.5">수혜처</span>
                  <span className="font-semibold truncate block" title={project.target_beneficiary}>{project.target_beneficiary}</span>
                </span>
                <span className="flex-1 pl-1">
                  <span className="block text-xs text-gray-400 mb-0.5">Manufacturer (Global Top Tier 🏆)</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400 truncate block" title={project.manufacturer}>
                    {project.manufacturer}
                  </span>
                </span>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-purple-600 dark:text-purple-400">{project.achievementRate}% 달성</span>
                  <span className="text-gray-500 text-xs mt-0.5">{project.current_quantity} / {project.target_quantity}개</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${project.achievementRate}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="font-bold text-lg dark:text-white">
                  {project.unit_price.toLocaleString()}원
                  <span className="text-xs font-normal text-gray-400 ml-1">/ 1개</span>
                </div>
                <div className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-500/20 text-center">
                  선물하기 🎁
                </div>
              </div>
            </div>
          </div>
        </div>
      </SpotlightCard>
    </Link>
  );
}
