"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Rocket, Clock, Users, Heart, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";
import { DomainContextHeader } from "@/shared/ui/components/layout/DomainContextHeader";

interface FundingProject {
  id: string;
  title: string;
  creatorName: string;
  category: string;
  categorySlug: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  investorCount: number;
  daysRemaining: number;
  imageUrl?: string;
  status: "active" | "success" | "failed";
}

const MOCK_PROJECTS: FundingProject[] = [
  {
    id: "cf-001",
    title: "신인 작가의 첫 에세이집 출간",
    creatorName: "김지은 작가",
    category: "출판·문화",
    categorySlug: "publish",
    description:
      "일상의 소소한 행복을 담은 에세이. 디지털 시대에 종이책의 가치를 전합니다.",
    targetAmount: 5000000,
    currentAmount: 3750000,
    investorCount: 127,
    daysRemaining: 12,
    status: "active",
  },
  {
    id: "cf-002",
    title: "동네 반려동물 카페 오픈 프로젝트",
    creatorName: "박민수",
    category: "창업·스타트업",
    categorySlug: "startup",
    description:
      "유기견 입양 연계와 함께하는 따뜻한 반려동물 카페를 열고 싶습니다.",
    targetAmount: 15000000,
    currentAmount: 12500000,
    investorCount: 312,
    daysRemaining: 5,
    status: "active",
  },
  {
    id: "cf-003",
    title: "청년 농부의 로컬 채소 구독 서비스",
    creatorName: "이하늘 농부",
    category: "친환경·농업",
    categorySlug: "agriculture",
    description:
      "친환경 농법으로 재배한 신선한 채소를 매주 집 앞까지 배송합니다.",
    targetAmount: 8000000,
    currentAmount: 8200000,
    investorCount: 89,
    daysRemaining: 0,
    status: "success",
  },
  {
    id: "cf-004",
    title: "독립 게임 개발: 별빛 여행자",
    creatorName: "스튜디오 문라이트",
    category: "창업·스타트업",
    categorySlug: "startup",
    description:
      "한국적 감성을 담은 힐링 어드벤처 게임. 당신의 우주 여행을 시작하세요.",
    targetAmount: 20000000,
    currentAmount: 4500000,
    investorCount: 156,
    daysRemaining: 28,
    status: "active",
  },
];

const CATEGORIES = [
  { key: "all", label: "전체 프로젝트" },
  { key: "startup", label: "창업·스타트업" },
  { key: "publish", label: "출판·문화" },
  { key: "agriculture", label: "친환경·농업" },
];

function mapProjectCategorySlug(raw: string): string {
  if (raw.includes("출판") || raw.includes("문화") || raw === "publish")
    return "publish";
  if (raw.includes("농업") || raw.includes("친환경") || raw === "agriculture")
    return "agriculture";
  return "startup";
}

function getProgressPercent(current: number, target: number): number {
  return Math.min(Math.round((current / target) * 100), 100);
}

function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  }
  if (amount >= 10000) {
    return `${Math.floor(amount / 10000)}만`;
  }
  return amount.toLocaleString();
}

function CloudFundingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCategory = searchParams?.get("category") || "all";

  const [projects, setProjects] = useState<FundingProject[]>(MOCK_PROJECTS);
  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [totalInvested, setTotalInvested] = useState(150000);

  useEffect(() => {
    setSelectedCategory(queryCategory);
  }, [queryCategory]);

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
    if (key === "all") {
      router.push("/consume/cloud-funding");
    } else {
      router.push(`/consume/cloud-funding?category=${key}`);
    }
  };

  useEffect(() => {
    async function fetchProjectsAndContributions() {
      try {
        const [projectsRes, contribRes] = await Promise.all([
          fetch("/api/consume/cloud/projects"),
          fetch("/api/consume/cloud/contribute"),
        ]);

        if (projectsRes.ok) {
          const data = await projectsRes.json();
          const list = Array.isArray(data.projects) ? data.projects : [];
          if (list.length > 0) {
            const mapped: FundingProject[] = list.map(
              (item: Record<string, unknown>) => {
                const rawCat = String(item.category ?? "창업");
                return {
                  id: String(item.id ?? ""),
                  title: String(item.title ?? "펀딩 프로젝트"),
                  creatorName: String(item.creator_name ?? "크리에이터"),
                  category: rawCat,
                  categorySlug: mapProjectCategorySlug(rawCat),
                  description: String(item.description ?? ""),
                  targetAmount: Number(item.target_amount ?? 5000000),
                  currentAmount: Number(item.current_amount ?? 0),
                  investorCount: Number(
                    item.backer_count ?? item.investor_count ?? 0
                  ),
                  daysRemaining: Number(item.daysRemaining ?? 14),
                  status:
                    String(item.status).toUpperCase() === "COMPLETED" ||
                    Number(item.current_amount ?? 0) >=
                      Number(item.target_amount ?? 1)
                      ? "success"
                      : "active",
                };
              }
            );
            setProjects(mapped);
          }
        }

        if (contribRes.ok) {
          const contribData = await contribRes.json();
          if (typeof contribData.totalAmount === "number") {
            setTotalInvested(contribData.totalAmount);
          }
        }
      } catch {
        // Keep fallback MOCK_PROJECTS
      }
    }
    fetchProjectsAndContributions();
  }, []);

  const filteredProjects = projects.filter((p) => {
    return selectedCategory === "all" || p.categorySlug === selectedCategory;
  });

  const handleInvest = (projectId: string) => {
    router.push(`/consume/cloud-funding/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DomainContextHeader
          domain="consume"
          title="💡 Cloud Funding · 임팩트 크라우드 펀딩"
          subtitle="이웃과 청년 창업가의 프로젝트에 후원하고 펀딩액의 5%를 PMC로 적립받으세요"
          metrics={[
            { label: "내 누적 후원", value: formatAmount(totalInvested), unit: "원" },
            {
              label: "진행 중 프로젝트",
              value: projects.filter((p) => p.status === "active").length,
              unit: "개",
            },
          ]}
        >
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.key
                    ? "bg-indigo-500/20 text-indigo-200 border-indigo-400/40"
                    : "bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </DomainContextHeader>

        <div className="grid gap-5 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => {
              const progress = getProgressPercent(
                project.currentAmount,
                project.targetAmount
              );
              const isSuccess = project.status === "success";

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    onClick={() => handleInvest(project.id)}
                    className={`bg-slate-900/70 border-slate-800/90 hover:border-indigo-500/40 transition-all overflow-hidden cursor-pointer h-full ${
                      isSuccess ? "border-emerald-700/40" : ""
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold border ${
                              isSuccess
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                            }`}
                          >
                            {isSuccess ? "✓ 펀딩 성공" : project.category}
                          </span>
                          <span>{project.creatorName}</span>
                        </div>
                        {!isSuccess && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            D-{project.daysRemaining}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg text-white group-hover:text-indigo-300 transition-colors mt-1">
                        {project.title}
                      </CardTitle>
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {project.description}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-bold text-white">
                            {formatAmount(project.currentAmount)}원 달성
                          </span>
                          <span className="text-slate-500">
                            목표 {formatAmount(project.targetAmount)}원
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${
                              isSuccess ? "bg-emerald-500" : "bg-indigo-500"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-bold text-indigo-300">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {progress}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {project.investorCount}명 참여
                          </span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInvest(project.id);
                          }}
                          disabled={isSuccess}
                          className={`flex items-center gap-1.5 text-xs font-bold ${
                            isSuccess
                              ? "bg-slate-800 text-slate-500"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white"
                          }`}
                          size="sm"
                        >
                          {isSuccess ? (
                            <>달성 완료</>
                          ) : (
                            <>
                              <Heart className="w-3.5 h-3.5" />
                              펀딩 참여
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Rocket className="w-12 h-12 mx-auto mb-4 opacity-40 text-indigo-400" />
            <p>해당 카테고리의 프로젝트가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CloudFundingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <CloudFundingContent />
    </Suspense>
  );
}
