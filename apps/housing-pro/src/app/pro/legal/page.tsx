"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle2, CalendarRange, Info } from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { LegalDdayScheduler } from "@/components/pro-view/legal-dday-scheduler";
import { useProWorkspace, type LegalMonthStatus } from "@/lib/pro-workspace-store";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function getMonthCellStyle(status?: LegalMonthStatus) {
  if (status === "done") {
    return "bg-emerald-500 text-slate-950 font-black";
  }
  if (status === "due") {
    return "bg-rose-500 text-white font-black animate-pulse";
  }
  if (status === "upcoming") {
    return "bg-sky-500/25 border border-dashed border-sky-400 text-sky-200 font-bold";
  }
  return "bg-slate-950/60 text-slate-700 hover:bg-white/[0.06]";
}

function getMonthCellLabel(status?: LegalMonthStatus) {
  if (status === "done") return "완료";
  if (status === "due") return "임박";
  if (status === "upcoming") return "예정";
  return "·";
}

export default function ProLegalSchedulePage() {
  const {
    complexProfile,
    obligations,
    annualMatrix,
    cycleAnnualMatrixCell,
    defendFineSuccess,
  } = useProWorkspace();

  const [activeTab, setActiveTab] = useState<"matrix" | "dday">("matrix");

  return (
    <MobileAppShell isProMode>
      <header className="px-4 py-3 bg-[#0D1322] border-b border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0" />
            <h1 className="text-sm font-black text-white truncate">
              법정의무 · 과태료 방어 일정
            </h1>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-black text-emerald-300 shrink-0">
            방어 {(complexProfile.savedFineAmountKrw / 10000).toLocaleString()}만원
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#070B15] border border-white/[0.06] text-[11px] font-black">
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "matrix"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>연간 12개월 매트릭스</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dday")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === "dday"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>D-Day 증빙·완료처리</span>
          </button>
        </div>
      </header>

      {activeTab === "matrix" ? (
        <div className="flex-1 flex flex-col">
          {/* 안내 & 범례 */}
          <div className="px-4 py-2.5 bg-[#0F172A] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <span className="text-slate-300 font-bold flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>{complexProfile.name} 연간 법정점검표 (셀 터치 시 상태 변경)</span>
            </span>
            <div className="flex items-center gap-2 font-bold">
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                완료
              </span>
              <span className="flex items-center gap-1 text-rose-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                임박
              </span>
              <span className="flex items-center gap-1 text-sky-300">
                <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-sky-400 bg-sky-500/25" />
                예정
              </span>
            </div>
          </div>

          {/* 12개월 법정의무 매트릭스 테이블 */}
          <div className="flex-1 overflow-x-auto bg-[#090E1A]">
            <table className="border-collapse w-max min-w-full text-left select-none">
              <thead className="sticky top-0 z-20 bg-[#11192C]">
                <tr>
                  <th className="sticky left-0 z-30 w-[165px] sm:w-[230px] min-w-[165px] sm:min-w-[230px] px-3 py-2.5 bg-[#121C32] border-b border-r border-white/[0.1] text-[10.5px] font-black text-slate-200">
                    법정의무 항목 (주기)
                  </th>
                  {MONTHS.map((m) => (
                    <th
                      key={m}
                      className={`w-[44px] min-w-[44px] py-2 text-center border-b border-r border-white/[0.08] font-mono text-[10.5px] font-black ${
                        m === 11
                          ? "bg-indigo-600/25 text-sky-300"
                          : "text-slate-300"
                      }`}
                    >
                      {m}월
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {obligations.map((rule) => {
                  const rowMonths = annualMatrix[rule.id] || {};
                  return (
                    <tr
                      key={rule.id}
                      className="border-b border-white/[0.06] hover:bg-white/[0.02]"
                    >
                      <td className="sticky left-0 z-10 bg-[#0E1525] border-r border-white/[0.1] px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-sky-300 border border-sky-500/30 text-[9px] font-black shrink-0">
                            {rule.cycleLabel}
                          </span>
                          <span className="text-[10px] font-bold text-amber-300 truncate">
                            {rule.maxFineLabel.split(" ")[0]} {rule.maxFineLabel.split(" ")[1]}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-white truncate mt-0.5">
                          {rule.title}
                        </div>
                      </td>

                      {MONTHS.map((m) => {
                        const status = rowMonths[m];
                        return (
                          <td
                            key={m}
                            className={`border-r border-white/[0.05] p-1 text-center ${
                              m === 11 ? "bg-indigo-950/20" : ""
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => cycleAnnualMatrixCell(rule.id, m)}
                              className={`w-full h-7 rounded-md text-[9.5px] transition ${getMonthCellStyle(
                                status
                              )}`}
                            >
                              {getMonthCellLabel(status)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4">
          <LegalDdayScheduler onSuccessDefend={defendFineSuccess} />
        </div>
      )}
    </MobileAppShell>
  );
}
