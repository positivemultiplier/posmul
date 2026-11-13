"use client";

import { useState } from "react";
import { Building2, Settings2, ShieldCheck, Check, AlertCircle } from "lucide-react";

export interface ComplexProfile {
  name: string;
  totalHouseholds: number;
  buildingCount: number;
  elevatorCount: number;
  heatingType: "중앙난방" | "지역난방" | "개별난방";
  fireGrade: "특급" | "1급" | "2급";
  completionDate: string;
  accidentFreeDays: number;
  savedFineAmountKrw: number;
}

interface ComplexProfileBarProps {
  profile: ComplexProfile;
  onUpdateProfile: (newProfile: ComplexProfile) => void;
}

export function ComplexProfileBar({ profile, onUpdateProfile }: ComplexProfileBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ComplexProfile>(profile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  return (
    <>
      <div className="rounded-2xl bg-[#121A2B] border border-white/[0.08] p-4 shadow-xl space-y-3">
        <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-base font-black text-white leading-tight">
                {profile.name}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/[0.06]">
                  의무관리대상 {profile.totalHouseholds.toLocaleString()}세대
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-sky-400 border border-sky-500/30">
                  {profile.heatingType}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {profile.buildingCount}개동 · 승강기 {profile.elevatorCount}대 · 소방 {profile.fireGrade} · 준공 {profile.completionDate}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[9.5px] text-emerald-300/80 font-bold">과태료 무사고</div>
                  <div className="text-[11px] font-black text-emerald-300">
                    D+{profile.accidentFreeDays}일
                  </div>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08]">
                <div className="text-[9.5px] text-slate-400 font-bold">누적 사전 방어</div>
                <div className="text-[11px] font-black text-amber-300">
                  {(profile.savedFineAmountKrw / 10000).toLocaleString()}만원
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>단지 변경</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>
            단지 세대수 및 승강기/난방 설비 사양에 맞추어 <strong>공동주택관리법·소방시설법·승강기안전관리법</strong> 필수 법정 의무가 실시간 동기화됩니다.
          </span>
        </div>
      </div>

      {/* 단지 정보 변경 모달 */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121A2B] border border-white/[0.1] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">단지 사양 및 관리 조건 변경</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">단지명</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">총 세대수</label>
                  <input
                    type="number"
                    value={formData.totalHouseholds}
                    onChange={(e) => setFormData({ ...formData, totalHouseholds: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-indigo-500"
                    min={50}
                    max={10000}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">동수</label>
                  <input
                    type="number"
                    value={formData.buildingCount}
                    onChange={(e) => setFormData({ ...formData, buildingCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-indigo-500"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">승강기 대수</label>
                  <input
                    type="number"
                    value={formData.elevatorCount}
                    onChange={(e) => setFormData({ ...formData, elevatorCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-indigo-500"
                    min={0}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">난방 방식</label>
                  <select
                    value={formData.heatingType}
                    onChange={(e) => setFormData({ ...formData, heatingType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="지역난방">지역난방</option>
                    <option value="개별난방">개별난방</option>
                    <option value="중앙난방">중앙난방</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">소방안전관리 등급</label>
                  <select
                    value={formData.fireGrade}
                    onChange={(e) => setFormData({ ...formData, fireGrade: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="특급">특급 대상물 (50층 이상 또는 200m 이상)</option>
                    <option value="1급">1급 대상물 (30층 이상 또는 연면적 1.5만㎡)</option>
                    <option value="2급">2급 대상물 (옥내소화전·스프링클러 구비)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">사용승인일 (준공연월)</label>
                  <input
                    type="text"
                    value={formData.completionDate}
                    onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-white focus:outline-none focus:border-indigo-500"
                    placeholder="YYYY-MM (예: 2018-05)"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>단지 정보 적용</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

