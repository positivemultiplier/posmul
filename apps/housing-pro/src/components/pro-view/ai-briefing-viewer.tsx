"use client";

import { useState } from "react";
import { FileText, ExternalLink, CheckSquare, Square, ChevronRight, Scale, BookOpen, AlertCircle, X } from "lucide-react";
import { MOCK_AI_BRIEFINGS, AiBriefingArticle } from "@/data/mock-ai-briefings";

export function AiBriefingViewer() {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(MOCK_AI_BRIEFINGS[0].id);
  const [modalArticle, setModalArticle] = useState<AiBriefingArticle | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const currentArticle = MOCK_AI_BRIEFINGS.find((a) => a.id === selectedArticleId) || MOCK_AI_BRIEFINGS[0];

  const toggleCheck = (idx: number) => {
    const key = `${currentArticle.id}-${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <div className="rounded-2xl bg-[#121A2B] border border-white/[0.08] p-4 space-y-4 shadow-xl">
        <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-sm font-black text-white">
                  AM 7:00 AI 관리법령 브리핑
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-sky-300 border border-sky-500/30">
                  출근 즉시 1분 확인
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                국토교통부 유권해석 및 대법원 최신 판례
              </p>
            </div>
          </div>

          {/* 일자별 아카이브 탭 */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl text-[11px] font-bold">
            {MOCK_AI_BRIEFINGS.map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => setSelectedArticleId(art.id)}
                className={`px-2 py-1.5 rounded-lg transition truncate ${
                  selectedArticleId === art.id
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {art.date.slice(5)} {art.categoryLabel}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 브리핑 요약 카드 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-950/80 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                {currentArticle.officialBody}
              </span>
              <span className="text-slate-400 text-[11px]">
                {currentArticle.officialDocNumber}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              발행: {currentArticle.date} 07:00 AM
            </span>
          </div>

          <h3 className="font-extrabold text-white text-base leading-snug">
            {currentArticle.title}
          </h3>

          <p className="text-slate-300 leading-relaxed text-xs">
            {currentArticle.summary}
          </p>

          {/* 🎓 생애주기 락인: 수험 기출문제 연계 배지 */}
          <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-indigo-300">
                수험 시절 암기 선지 직결 (제{currentArticle.relatedExam.round}회 기출)
              </div>
              <p className="text-[11px] text-slate-300">
                {currentArticle.relatedExam.insight}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05]">
            <a
              href={currentArticle.lawUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{currentArticle.lawCitation} 원문 보기</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => setModalArticle(currentArticle)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <span>실무 행동 수칙 & 유권해석 전문</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 법적 면책 고지 (철학 준수 필수) */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] text-[10.5px] text-slate-400 leading-relaxed flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            <strong>면책 고지</strong>: 본 AI 브리핑은 주택관리사 업무 편의를 위한 참고 정보이며, 개별 사건의 법적 효력 및 지자체 행정처분은 지자체 감사 결과 및 법원의 최종 판결에 따릅니다.
          </span>
        </div>
      </div>

      {/* 브리핑 상세 열람 & 소장 행동 체크리스트 모달 */}
      {modalArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121A2B] border border-white/[0.1] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                    {modalArticle.categoryLabel}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    {modalArticle.date} AM 7:00
                  </span>
                </div>
                <h3 className="text-lg font-black text-white leading-snug">
                  {modalArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setModalArticle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] space-y-2">
                <div className="text-[11px] font-bold text-sky-400">
                  🏛️ 공식 유권청: {modalArticle.officialBody} ({modalArticle.officialDocNumber})
                </div>
                <div className="font-bold text-white text-xs">
                  쟁점: {modalArticle.coreIssue}
                </div>
                <p className="text-slate-300 leading-relaxed text-[11.5px] pt-1 border-t border-white/[0.05]">
                  {modalArticle.officialAnswer}
                </p>
              </div>

              {/* 📋 소장 실무 3대 행동 체크리스트 */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-300 text-sm flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                    <span>현직 소장 당일 현장 행동 수칙 (Action Checklist)</span>
                  </span>
                  <span className="text-[11px] text-indigo-300/80">
                    클릭하여 이행 확인
                  </span>
                </div>

                <div className="space-y-2">
                  {modalArticle.practicalChecklist.map((item, idx) => {
                    const isChecked = checkedItems[`${modalArticle.id}-${idx}`];
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleCheck(idx)}
                        className={`w-full p-2.5 rounded-lg text-left flex items-start gap-2.5 transition border ${
                          isChecked
                            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                            : "bg-slate-950/60 border-white/[0.05] text-slate-300 hover:border-indigo-500/40"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-xs ${isChecked ? "line-through opacity-80" : ""}`}>
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 수험생 시절 2차 시험 선지 연동 */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-white/[0.06] space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>주택관리사 2차 관계법규/실무 수험 연계 인사이트</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {modalArticle.relatedExam.insight}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs">
              <a
                href={modalArticle.lawUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>국가법령정보센터 {modalArticle.lawCitation} 원문</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setModalArticle(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition"
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

