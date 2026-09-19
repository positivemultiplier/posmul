"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Briefcase,
  TrendingUp,
  Clock,
  Users,
  ChevronRight,
  Vote,
  MessageSquare,
  Check,
  Flame,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { JOB_GROUPS, JobGroup } from "@/shared/constants/regions-and-jobs";
import { DailyCurationItem } from "@/app/api/prediction/daily-curation/route";

export function JobCurationMorningBanner() {
  const [selectedJobId, setSelectedJobId] = useState<string>("IT_DEVELOPER");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [curationData, setCurationData] = useState<{
    jobName: string;
    jobIcon: string;
    jobDescription: string;
    items: DailyCurationItem[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 로컬스토리지에서 저장된 직업군 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("posmul_user_job_group");
    if (saved && JOB_GROUPS.some((j) => j.id === saved)) {
      setSelectedJobId(saved);
    }
  }, []);

  // 직업군 변경 시 큐레이션 데이터 새로 불러오기
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/prediction/daily-curation?jobGroup=${selectedJobId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setCurationData({
            jobName: data.jobName,
            jobIcon: data.jobIcon,
            jobDescription: data.jobDescription,
            items: data.items,
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedJobId]);

  const handleSelectJob = (job: JobGroup) => {
    setSelectedJobId(job.id);
    localStorage.setItem("posmul_user_job_group", job.id);
    setIsModalOpen(false);
  };

  const currentJob = JOB_GROUPS.find((j) => j.id === selectedJobId) || JOB_GROUPS[0];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 shadow-2xl p-6 sm:p-7 mb-10">
      {/* 앰비언트 글로우 배경 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* 헤더 섹션 */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800/70">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>AI 모닝 브리핑 · 직무 맞춤 정책 큐레이션</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 flex-wrap">
            <span>🌅 오늘 아침</span>
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent underline decoration-blue-500/50 decoration-2 underline-offset-4">
              [{currentJob.name}]
            </span>
            <span>직군을 위한 정책·산업 예측 5선</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            나의 생계와 직결된 국회 계류 법안, 산업 규제, 시장 전망을 AI가 엄선하여 배달합니다.
          </p>
        </div>

        {/* 직업군 변경 버튼 */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all hover:border-blue-400/50 shadow-md group shrink-0"
        >
          <span className="text-base">{currentJob.icon}</span>
          <span>직업군 변경</span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 5개 카드 그리드 */}
      <div className="relative z-10 mt-6">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent" />
            <p className="text-xs text-slate-400">직무 맞춤 예측 브리핑 5선을 큐레이션하고 있습니다...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {curationData?.items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/60 p-4 flex flex-col justify-between transition-all duration-200 group shadow-md"
              >
                <div>
                  {/* 카드 상단 배지 */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      TOP {idx + 1} · {item.impactArea}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      {item.closingDateText}
                    </span>
                  </div>

                  {/* 제목 */}
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  {/* 요약 */}
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                {/* 하단 옵션 칩 & 액션 */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2">
                  <div className="flex gap-1">
                    {item.options.slice(0, 2).map((opt, oIdx) => (
                      <div
                        key={opt.id}
                        className={`flex-1 text-center py-1 px-1.5 rounded-lg text-[10px] font-bold truncate ${
                          oIdx === 0
                            ? "bg-blue-950/60 text-blue-300 border border-blue-800/40"
                            : "bg-rose-950/60 text-rose-300 border border-rose-800/40"
                        }`}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/prediction/${item.gameId ? `politics/all/all/${item.gameId}` : ""}`}
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-extrabold flex items-center justify-center gap-1 transition-all"
                  >
                    <span>예측 분석·투표</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 직업군 선택 모달 */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">나의 직업군 선택</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  닫기 ✕
                </button>
              </div>

              <p className="text-xs text-slate-400">
                선택하신 직업군과 관련된 주요 정책 법안, 규제 완화, 산업 전망 예측을 매일 아침 맞춤 브리핑해 드립니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {JOB_GROUPS.map((job) => {
                  const isSelected = job.id === selectedJobId;
                  return (
                    <button
                      key={job.id}
                      onClick={() => handleSelectJob(job)}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        isSelected
                          ? "bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400"
                          : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-2xl shrink-0 mt-0.5">{job.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-white truncate">{job.name}</h4>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                          {job.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
