"use client";

import React, { useState, useEffect } from "react";
import {
  PackageCheck,
  ShieldCheck,
  Award,
  Sparkles,
  Heart,
  ArrowRight,
  CheckCircle2,
  Users,
  Coins,
  Building2,
  TrendingUp,
  X,
  FileText,
  ThumbsUp,
  HelpCircle,
} from "lucide-react";
import {
  DonationPillar,
  DonationProjectDTO,
  getDonationProjectsAction,
  donatePmcAction,
} from "../actions/donation-v2.actions";

export function DonationPillarsView() {
  const [activePillar, setActivePillar] = useState<DonationPillar | "ALL">("ALL");
  const [projects, setProjects] = useState<DonationProjectDTO[]>([]);
  const [userPmcBalance, setUserPmcBalance] = useState<number>(500);
  const [isLoading, setIsLoading] = useState(true);

  // 기부 모달 상태
  const [selectedProject, setSelectedProject] = useState<DonationProjectDTO | null>(null);
  const [donateAmount, setDonateAmount] = useState<number>(100);
  const [cheerMsg, setCheerMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchProjects = async (pillar?: DonationPillar) => {
    setIsLoading(true);
    try {
      const res = await getDonationProjectsAction(pillar);
      if (res.success) {
        setProjects(res.projects);
        setUserPmcBalance(res.userPmcBalance);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(activePillar === "ALL" ? undefined : activePillar);
  }, [activePillar]);

  const handleOpenDonate = (proj: DonationProjectDTO) => {
    setSelectedProject(proj);
    setDonateAmount(Math.min(userPmcBalance, 100));
    setCheerMsg("");
  };

  const handleSubmitDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || donateAmount <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await donatePmcAction({
        projectId: selectedProject.id,
        amountPmc: donateAmount,
        cheerMessage: cheerMsg,
      });

      if (res.success) {
        setUserPmcBalance(res.newBalance ?? userPmcBalance - donateAmount);
        setSuccessToast(res.message);
        setSelectedProject(null);
        setTimeout(() => setSuccessToast(null), 6000);
        // 프로젝트 상태 로컬 갱신
        fetchProjects(activePillar === "ALL" ? undefined : activePillar);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err?.message || "기부 처리 오류");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4대 필러 탭 및 내 지갑 바 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        {/* 필러 셀렉터 탭 */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActivePillar("ALL")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
              activePillar === "ALL"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            전체 펀드 (4)
          </button>
          <button
            onClick={() => setActivePillar("TIED_GOODS")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
              activePillar === "TIED_GOODS"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <PackageCheck className="w-4 h-4 text-indigo-400" />
            <span>📦 1. K-물품기부 (수출 승수)</span>
          </button>
          <button
            onClick={() => setActivePillar("NGO_MILESTONE")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
              activePillar === "NGO_MILESTONE"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>🤝 2. 마일스톤 NGO (에스크로)</span>
          </button>
          <button
            onClick={() => setActivePillar("HERO_BOUNTY")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
              activePillar === "HERO_BOUNTY"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>🦸‍♂️ 3. 숨은 의인상 (비과세 포상)</span>
          </button>
          <button
            onClick={() => setActivePillar("DREAM_LADDER")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
              activePillar === "DREAM_LADDER"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>🌱 4. 꿈의 사다리 (Pay-it-Forward)</span>
          </button>
        </div>

        {/* 내 PMC 잔액 위젯 */}
        <div className="flex items-center justify-between sm:justify-end gap-3 px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-bold">내 기부 가능 자산</div>
            <div className="text-sm font-black text-amber-400 flex items-center gap-1 justify-end">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{userPmcBalance.toLocaleString()} PMC</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/50">
            시민 예산 집행권자
          </span>
        </div>
      </div>

      {/* 기부 성공 토스트 */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-extrabold flex items-center gap-3 shadow-2xl animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 프로젝트 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          <div className="col-span-2 py-16 text-center text-xs text-slate-500">
            기부 프로젝트 데이터를 불러오는 중...
          </div>
        ) : (
          projects.map((proj) => {
            const percent = Math.min(100, Math.round((proj.currentAmount / proj.targetAmount) * 100));

            return (
              <div
                key={proj.id}
                className="flex flex-col justify-between p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-4"
              >
                {/* 상단 뱃지 & 브랜드 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        proj.pillar === "TIED_GOODS"
                          ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                          : proj.pillar === "NGO_MILESTONE"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : proj.pillar === "HERO_BOUNTY"
                          ? "bg-amber-950 text-amber-300 border-amber-800"
                          : "bg-purple-950 text-purple-300 border-purple-800"
                      }`}
                    >
                      {proj.pillar === "TIED_GOODS" && "📦 K-물품 직접기부"}
                      {proj.pillar === "NGO_MILESTONE" && "🤝 마일스톤 검증 NGO"}
                      {proj.pillar === "HERO_BOUNTY" && "🦸‍♂️ 숨은 의인 포상제"}
                      {proj.pillar === "DREAM_LADDER" && "🌱 꿈의 사다리 (Pay-it-Forward)"}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{proj.partnerOrBrand}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white leading-snug">
                    {proj.title}
                  </h3>
                  <p className="text-xs font-semibold text-blue-400">
                    {proj.subtitle}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {proj.description}
                  </p>
                </div>

                {/* 🔍 필러별 특화 영역 (디테일) */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                  {/* Pillar 1: 물품 스펙 */}
                  {proj.goodsDetail && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-bold">지원 물품 실물:</span>
                        <span className="text-indigo-300 font-extrabold">{proj.goodsDetail.itemSpec}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-bold">목표 수량:</span>
                        <span className="text-white font-mono font-bold">
                          {proj.goodsDetail.currentQuantity}대 / {proj.goodsDetail.targetQuantity}대 전달 중
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Pillar 2: 마일스톤 */}
                  {proj.milestones && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 flex justify-between">
                        <span>스마트 에스크로 마일스톤 진행도</span>
                        <span className="text-emerald-400">시민 투표 진행 중</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                        {proj.milestones.map((m) => (
                          <div
                            key={m.step}
                            className={`p-1.5 rounded-lg border text-center font-bold ${
                              m.status === "COMPLETED"
                                ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                                : m.status === "VOTING"
                                ? "bg-blue-950/60 border-blue-600 text-blue-300 animate-pulse"
                                : "bg-slate-900 border-slate-800 text-slate-500"
                            }`}
                          >
                            {m.step}단계 ({m.percentage}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pillar 3: 의인 포상 */}
                  {proj.heroDetail && (
                    <div className="space-y-1 text-[11px]">
                      <div className="text-amber-300 font-bold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>발굴자: {proj.heroDetail.scoutName}</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-tight">
                        {proj.heroDetail.taxExemptLawNote}
                      </p>
                    </div>
                  )}

                  {/* Pillar 4: 꿈사다리 */}
                  {proj.dreamDetail && (
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">자발적 누적 상환:</span>
                        <span className="text-purple-300 font-mono font-bold">
                          {proj.dreamDetail.repaidPmc.toLocaleString()} PMC 상환 완료 (선배 멘토 승계)
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] italic">
                        "{proj.dreamDetail.pledgeNote}"
                      </p>
                    </div>
                  )}
                </div>

                {/* 프로그레스 바 & 모금 현황 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300 font-extrabold">{percent}% 달성</span>
                    <span className="text-amber-400 font-mono">
                      {proj.currentAmount.toLocaleString()} / {proj.targetAmount.toLocaleString()} PMC
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>참여 시민: {proj.donorCount.toLocaleString()}명</span>
                    <span>1 PMC = 1원 가치 환류</span>
                  </div>
                </div>

                {/* 기부 실행 버튼 */}
                <button
                  onClick={() => handleOpenDonate(proj)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-purple-500 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>이 펀드에 PMC 기부하기</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 💝 기부 실행 모달 */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-blue-400">시민 직접 예산 집행</span>
                <h3 className="text-base font-extrabold text-white">소셜 임팩트 기부</h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDonate} className="space-y-4">
              {/* 프로젝트 정보 요약 */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="font-extrabold text-white line-clamp-1">{selectedProject.title}</div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>파트너: {selectedProject.partnerOrBrand}</span>
                  <span className="text-amber-400 font-bold">내 보유: {userPmcBalance.toLocaleString()} PMC</span>
                </div>
              </div>

              {/* 금액 설정 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <label>기부할 PMC 금액</label>
                  <span className="text-blue-400 font-mono">{donateAmount.toLocaleString()} PMC</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={userPmcBalance}
                  value={donateAmount}
                  onChange={(e) => setDonateAmount(Math.max(1, Math.min(userPmcBalance, Number(e.target.value))))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-extrabold focus:outline-none focus:border-blue-500"
                  required
                />

                {/* 퀵 금액 버튼 */}
                <div className="flex gap-1.5 pt-1">
                  {[100, 500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDonateAmount(Math.min(userPmcBalance, amt))}
                      className="flex-1 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDonateAmount(userPmcBalance)}
                    className="flex-1 py-1 rounded-lg bg-blue-950 border border-blue-800 text-[10px] font-black text-blue-300"
                  >
                    전액
                  </button>
                </div>
              </div>

              {/* 응원 메시지 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">응원 한마디 (포럼 기록)</label>
                <input
                  type="text"
                  placeholder="따뜻한 응원의 메시지를 남겨보세요..."
                  value={cheerMsg}
                  onChange={(e) => setCheerMsg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 버튼 그룹 */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={donateAmount > userPmcBalance || donateAmount <= 0 || isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "집행 처리 중..." : `${donateAmount.toLocaleString()} PMC 기부 집행하기`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
