"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Calendar, Target, Sparkles, CheckCircle2 } from "lucide-react";

export default function CreatePredictionGamePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // 폼 입력 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("POLITICS");
  const [options, setOptions] = useState<string[]>(["예 (Yes)", "아니오 (No)"]);
  const [minBet, setMinBet] = useState(100);
  const [maxBet, setMaxBet] = useState(10000);
  
  // 날짜 설정 (기본값: 오늘 ~ 7일 후)
  const now = new Date();
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const settleDate = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  const [registrationEnd, setRegistrationEnd] = useState(endDate.toISOString().slice(0, 16));
  const [settlementDate, setSettlementDate] = useState(settleDate.toISOString().slice(0, 16));

  // 옵션 추가
  const handleAddOption = () => {
    setOptions([...options, `옵션 ${options.length + 1}`]);
  };

  // 옵션 변경
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  // 옵션 삭제
  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      alert("최소 2개 이상의 선택지가 필요합니다.");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("게임 제목을 입력해 주세요.");
      return;
    }

    if (options.some((opt) => !opt.trim())) {
      alert("모든 선택지 내용을 입력해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/prediction/create-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          options,
          minBetAmount: Number(minBet),
          maxBetAmount: Number(maxBet),
          registrationEnd: new Date(registrationEnd).toISOString(),
          settlementDate: new Date(settlementDate).toISOString(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("🎉 수동 예측 게임이 성공적으로 생성되었습니다!");
        router.push("/admin/prediction");
      } else {
        alert(`❌ 게임 생성 실패: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류 발생: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <Link
            href="/admin/prediction"
            className="text-xs font-semibold text-slate-400 hover:text-slate-100 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> /admin/prediction으로 돌아가기
          </Link>
          <span className="text-xs text-slate-500 font-mono">MANUAL PREDICTION GAME CREATOR</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 flex items-center gap-2">
            <Target className="w-7 h-7 text-indigo-400" />
            신규 예측 게임 수동 생성
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            운영자가 직접 질문 내용, 선택지 및 마감 기간을 지정하여 플랫폼 예측 피드에 즉시 노출합니다.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">
              예측 게임 제목 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2026년 상반기 원/달러 환율 1,450원 돌파할까?"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          {/* Category & Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="POLITICS">🗳️ 정치 / 정책</option>
                <option value="SPORTS">⚽ 스포츠 / 경기</option>
                <option value="INVEST">📈 투자 / 경제</option>
                <option value="ENTERTAINMENT">🎬 엔터 / 대중문화</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">최소 베팅금 (P)</label>
              <input
                type="number"
                value={minBet}
                onChange={(e) => setMinBet(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">최대 베팅금 (P)</label>
              <input
                type="number"
                value={maxBet}
                onChange={(e) => setMaxBet(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200">상세 배경 설명 및 정산 기준</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="예측 배경 및 결과 정산 기준(예: 한국은행 공시 환율 기준)을 작성하세요."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Options Management */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-200">🎯 예측 선택지 (Options)</label>
              <button
                type="button"
                onClick={handleAddOption}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" /> 선택지 추가
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="w-6 text-center text-xs font-bold text-slate-500">{idx + 1}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`선택지 ${idx + 1}`}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> 예측 참여 마감일 (Registration End)
              </label>
              <input
                type="datetime-local"
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> 결과 승부 정산일 (Settlement Date)
              </label>
              <input
                type="datetime-local"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Link
              href="/admin/prediction"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
            >
              {submitting ? "등록 중..." : <>🚀 예측 게임 신규 등록</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
