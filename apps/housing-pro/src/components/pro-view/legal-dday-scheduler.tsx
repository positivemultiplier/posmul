"use client";

import { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  FileCheck,
  Scale,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Filter,
  Check,
  Sparkles,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { MOCK_LEGAL_OBLIGATIONS, LegalObligationRule } from "@/data/mock-legal-obligations";

interface LegalDdaySchedulerProps {
  onSuccessDefend?: (amountKrw: number) => void;
}

export function LegalDdayScheduler({ onSuccessDefend }: LegalDdaySchedulerProps) {
  const [obligations, setObligations] = useState<LegalObligationRule[]>(MOCK_LEGAL_OBLIGATIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [completingItem, setCompletingItem] = useState<LegalObligationRule | null>(null);
  const [completionMemo, setCompletionMemo] = useState("");
  const [inspectorName, setInspectorName] = useState("");

  // 필터링
  const filteredList = obligations.filter((item) => {
    if (selectedCategory === "ALL") return true;
    return item.category === selectedCategory;
  });

  // D-Day 정렬 (임박순)
  const sortedList = [...filteredList].sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  // D-3 이내 긴급 항목
  const urgentCount = obligations.filter((item) => item.daysUntilDue <= 3 && !item.isCompleted).length;

  // 완료 처리 모달 오픈
  const handleOpenCompleteModal = (item: LegalObligationRule) => {
    setCompletingItem(item);
    setInspectorName("관리소장 직무대행");
    setCompletionMemo(`${item.title} 현장 확인 및 결과 대장 등록 완료`);
  };

  // 완료 처리 확정
  const handleConfirmComplete = () => {
    if (!completingItem) return;

    setObligations((prev) =>
      prev.map((item) => {
        if (item.id === completingItem.id) {
          // 다음 주기로 D-Day 재계산 시뮬레이션
          let addedDays = 30;
          if (item.cycleRule === "ANNUAL") addedDays = 365;
          if (item.cycleRule === "HALF_YEARLY") addedDays = 180;
          if (item.cycleRule === "TRIENNIAL") addedDays = 1095;

          return {
            ...item,
            isCompleted: true,
            daysUntilDue: addedDays,
            lastCompletedDate: new Date().toISOString().slice(0, 10),
          };
        }
        return item;
      })
    );

    if (onSuccessDefend) {
      onSuccessDefend(completingItem.maxFineKrw);
    }

    setCompletingItem(null);
  };

  return (
    <div className="rounded-2xl bg-[#121A2B] border border-white/[0.08] p-5 space-y-5 shadow-xl">
      {/* 상단 헤더 & 카테고리 필터 */}
      <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-3.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <h2 className="text-sm font-black text-white">
              과태료 방어 법정 의무 스케줄러
            </h2>
            {urgentCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse">
                D-3 이내 긴급 {urgentCount}건
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            주택관리사 2차 관계법규·관리실무 법조문 데이터 기반 자동 만료일 추적
          </p>
        </div>

        {/* 카테고리 필터 칩 */}
        <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold bg-slate-950 p-1.5 rounded-xl">
          {[
            { id: "ALL", label: "전체 의무" },
            { id: "SAFETY", label: "승강기·안전" },
            { id: "FIRE", label: "소방시설" },
            { id: "FINANCE", label: "관리비·K-apt" },
            { id: "REPAIR", label: "장기수선" },
            { id: "ELECTION", label: "입대의·선거" },
            { id: "ADMIN", label: "저수조·환경" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg transition shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 긴급 알림 배너 */}
      {urgentCount > 0 && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/70 via-red-950/40 to-slate-900 border border-rose-500/30 flex flex-col gap-2 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="leading-relaxed">
              <span className="font-extrabold text-white">
                마감 3일 이내 초긴급 법정 점검이 있습니다!
              </span>{" "}
              <span className="text-slate-300 text-[11px]">
                기한 내 안전종합정보망에 결과를 입력하지 않으면 지자체 불시점검 시 즉시 과태료가 부과됩니다.
              </span>
            </div>
          </div>
          <div>
            <span className="inline-block font-black text-[11px] text-rose-300 bg-rose-900/60 px-2.5 py-1 rounded-lg">
              과태료 최대 500만원 리스크
            </span>
          </div>
        </div>
      )}

      {/* 법정 의무 카드 목록 */}
      <div className="space-y-3">
        {sortedList.map((item) => {
          const isUrgent = item.daysUntilDue <= 3 && !item.isCompleted;
          const isWarning = item.daysUntilDue <= 7 && !item.isCompleted;
          const isExpanded = expandedExamId === item.id;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl transition border ${
                item.isCompleted
                  ? "bg-slate-950/40 border-white/[0.04] opacity-80"
                  : isUrgent
                  ? "bg-slate-950/90 border-rose-500/50 shadow-lg shadow-rose-950/20"
                  : isWarning
                  ? "bg-slate-950/90 border-amber-500/30"
                  : "bg-slate-950/70 border-white/[0.06]"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-lg font-mono ${
                        item.isCompleted
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                          : isUrgent
                          ? "bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse"
                          : isWarning
                          ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                          : "bg-slate-900 text-sky-400 border border-sky-500/20"
                      }`}
                    >
                      {item.isCompleted ? "이행 완료" : `D-${item.daysUntilDue}`}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-400">
                      {item.cycleLabel}
                    </span>

                    <h3 className="font-extrabold text-white text-sm">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.deadlineDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] pt-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      마감일: <strong className="text-slate-200">{item.dueDateString}</strong>
                    </span>

                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      위반 시: {item.maxFineLabel}
                    </span>

                    <span className="text-slate-400 flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-slate-500" />
                      필수 증빙: <span className="text-slate-300">{item.requiredEvidence}</span>
                    </span>
                  </div>
                </div>

                {/* 하단 버튼 액션 */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.04]">
                  <button
                    onClick={() => handleOpenCompleteModal(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      item.isCompleted
                        ? "bg-slate-800 text-slate-400 hover:text-white"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.isCompleted ? "다시 점검" : "점검 완료 처리"}</span>
                  </button>

                  <a
                    href={item.lawUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <span>법조문 확인</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 🎓 생애주기 락인: 수험 시절 2차 기출문제 연계 배지 & 아코디언 */}
              <div className="mt-3 pt-3 border-t border-white/[0.05]">
                <button
                  onClick={() => setExpandedExamId(isExpanded ? null : item.id)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-indigo-300 hover:text-indigo-200 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      🎓 수험 시절 암기 선지 연동: {item.relatedExam.year}년 제{item.relatedExam.round}회 {item.relatedExam.subject} {item.relatedExam.questionNumber}번
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="mt-2 p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs space-y-1">
                    <div className="text-[11px] font-bold text-indigo-300">
                      💡 2차 시험에서 출제된 오답 함정 포인트:
                    </div>
                    <p className="text-slate-300 leading-relaxed font-mono text-[11.5px]">
                      &quot;{item.relatedExam.trapSummary}&quot;
                    </p>
                    <p className="text-[10.5px] text-slate-400 pt-0.5">
                      수험생 때 외운 기한이 실제 관리소장이 되었을 때 <strong>{item.maxFineLabel}</strong> 과태료를 방어하는 핵심 실무 무기가 됩니다!
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 점검 완료 처리 모달 */}
      {completingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121A2B] border border-white/[0.1] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">법정 의무 이행 완료 등록</h3>
              </div>
              <button
                onClick={() => setCompletingItem(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                닫기
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-white/[0.06] space-y-1">
                <div className="font-extrabold text-white">{completingItem.title}</div>
                <div className="text-slate-400 text-[11px]">{completingItem.legalCitation}</div>
                <div className="text-emerald-400 font-bold pt-1">
                  🛡️ 사전 방어 완료 금액: {completingItem.maxFineLabel}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">점검자 / 관리책임자명</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">점검 결과 요약 및 증빙 보관 메모</label>
                <textarea
                  value={completionMemo}
                  onChange={(e) => setCompletionMemo(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                * 등록 즉시 다음 주기({completingItem.cycleLabel})로 D-Day가 자동 갱신되며, 단지 과태료 무사고 카운터 및 방어 금액에 합산됩니다.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setCompletingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition text-xs"
              >
                취소
              </button>
              <button
                onClick={handleConfirmComplete}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5 transition text-xs shadow-lg shadow-emerald-600/30"
              >
                <Check className="w-4 h-4" />
                <span>이행 확정 및 D-Day 리셋</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

