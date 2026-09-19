import Link from "next/link";
import { createClient } from "../lib/supabase/server";
import {
  TrendingUp,
  Vote,
  Sparkles,
  ShieldCheck,
  Coins,
  HeartHandshake,
  ArrowRight,
  Activity,
  CheckCircle2,
  Users,
  Award,
  Zap,
} from "lucide-react";
import {
  attachHourlyGamePoolsToRows,
  mapPredictionGameRowToCardModel,
  type PredictionGameRow,
} from "./prediction/components/prediction-game-mapper";
import { PredictionType } from "../bounded-contexts/prediction/domain/value-objects/prediction-types";
import { getAggregatedPrizePool } from "../bounded-contexts/prediction/application/prediction-pool.service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  // 1. 플랫폼 누적 통계 병렬 조회
  const [
    platformTotalPool,
    gamesResult,
    donationsResult,
    institutesResult,
    accountsCountResult,
  ] = await Promise.all([
    getAggregatedPrizePool(supabase).catch(() => 1500000),
    supabase
      .schema("prediction")
      .from("prediction_games")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .schema("donation")
      .from("donations")
      .select("pmc_amount")
      .eq("status", "completed"),
    supabase
      .schema("donation")
      .from("donation_institutes")
      .select("id", { count: "exact" })
      .eq("is_active", true),
    supabase
      .schema("economy")
      .from("pmp_pmc_accounts")
      .select("user_id", { count: "exact" }),
  ]);

  // 최근 게임 매핑
  const recentGames = (gamesResult.data ?? []) as PredictionGameRow[];
  const gamesWithPools = await attachHourlyGamePoolsToRows(supabase, recentGames);
  const featuredGames = gamesWithPools.map(mapPredictionGameRowToCardModel);

  // 기부 총액 계산
  const totalDonations = donationsResult.data ?? [];
  const totalPmcDonated = totalDonations.reduce(
    (sum, d) => sum + (Number(d.pmc_amount) || 0),
    0
  );

  const totalPartnersCount = institutesResult.count ?? 8;
  const totalUsersCount = accountsCountResult.count ?? 85;

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* 배경 블러 글로우 효과 */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-[800px] -left-40 w-[600px] h-[600px] bg-blue-900/15 blur-[150px] rounded-full" />
      <div className="pointer-events-none absolute top-[1400px] -right-40 w-[600px] h-[600px] bg-purple-900/15 blur-[150px] rounded-full" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* 상단 뱃지 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 backdrop-blur-md text-blue-400 text-sm font-medium animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>AI 시대 직접민주주의 & 집단지성 공익 예측 플랫폼</span>
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.15]">
            시민의 집단지성으로 예측하고
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              세상에 긍정승수(PosMul)를 더하다
            </span>
          </h1>

          {/* 서브 카피 */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            국회 의안 통과 여부부터 글로벌 시사·경제까지 실시간 확률을 예측하고,
            <br className="hidden sm:inline" />
            보상으로 획득한 <strong className="text-purple-300 font-semibold">PMC</strong>를 투명한 공익 기부로 환원하는 신개념 소셜 임팩트 생태계입니다.
          </p>

          {/* 액션 CTA 버튼 그룹 */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/prediction"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Zap className="w-5 h-5" />
              <span>실시간 예측 마켓 참여</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>

            <Link
              href="/admin/feed"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 backdrop-blur-md transition-all hover:border-slate-600"
            >
              <Vote className="w-4 h-4 text-blue-400" />
              <span>AI 피드 & 국회 의안</span>
            </Link>

            <Link
              href="/donation/institute"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 backdrop-blur-md transition-all hover:border-emerald-500/60"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              <span>투명 공익 기부</span>
            </Link>
          </div>
        </div>

        {/* 핵심 통계 바 (Live Metrics) */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md text-center hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-blue-400 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>예측 마켓 종목</span>
            </div>
            <div className="text-3xl font-black text-white">32+</div>
            <div className="text-xs text-slate-400 mt-0.5">의안·정치·스포츠·소비</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md text-center hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-400 mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span>누적 예측 풀 (PMP)</span>
            </div>
            <div className="text-3xl font-black text-white">
              {platformTotalPool.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">시민 집단지성 총볼륨</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md text-center hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-400 mb-1">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>누적 공익 기부액</span>
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {totalPmcDonated.toLocaleString()} <span className="text-lg font-bold">PMC</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">사회로 환원된 가치</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md text-center hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-purple-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>검증된 공익 파트너</span>
            </div>
            <div className="text-3xl font-black text-white">{totalPartnersCount}개소</div>
            <div className="text-xs text-slate-400 mt-0.5">유니세프·아름다운재단 등</div>
          </div>
        </div>
      </section>

      {/* Featured Prediction Markets Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>TRENDING MARKETS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              실시간 핫 예측 마켓
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              국회 본회의 심의 의안 및 주요 시사 현안의 실시간 시민 지지율과 배당률입니다.
            </p>
          </div>
          <Link
            href="/prediction"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>전체 예측 마켓 둘러보기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 예측 게임 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredGames.map((game) => {
            const opt1 = game.options[0];
            const opt2 = game.options[1];
            const opt1Rate = Math.round((opt1?.currentOdds || 0.5) * 100);
            const opt2Rate = 100 - opt1Rate;
            const targetHref = game.href || `/prediction/sports/soccer/${game.slug}`;

            return (
              <Link
                key={game.id}
                href={targetHref}
                className="group relative block p-6 rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl overflow-hidden"
              >
                {/* 상단 뱃지 및 상태 */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {game.predictionType === PredictionType.BINARY ? "찬반 양자택일" : "다자선택"}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    실시간 베팅 가능
                  </span>
                </div>

                {/* 게임 제목 */}
                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug mb-3">
                  {game.title}
                </h3>

                {/* 설명 */}
                <p className="text-xs text-slate-400 line-clamp-2 mb-5 leading-relaxed">
                  {game.description}
                </p>

                {/* Polymarket 스타일 실시간 지지율 바 */}
                {opt1 && opt2 && (
                  <div className="space-y-2 mb-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-blue-400">{opt1.text} ({opt1Rate}%)</span>
                      <span className="text-pink-400">{opt2.text} ({opt2Rate}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${opt1Rate}%` }}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500"
                        style={{ width: `${opt2Rate}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 카드 하단 메타 */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 font-medium text-slate-300">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                    <span>최소 {game.minimumStake.toLocaleString()} PMP</span>
                  </div>
                  <span className="text-blue-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-semibold">
                    예측 참여하기 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* The PosMul Flywheel (토크노믹스 선순환 구조) */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>THE POSMUL FLYWHEEL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            집단지성이 공익 가치로 전환되는 4단계 선순환
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base">
            단순한 도박이나 흥미성 베팅이 아닙니다. 정책 예측을 통해 여론을 수렴하고,
            생성된 가치를 사회적 공익으로 환원하는 선순환 직접민주주의 모델입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3 hover:border-blue-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl font-bold border border-blue-500/20">
              01
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Vote className="w-4 h-4 text-blue-400" />
              의안 & 이슈 발굴
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              국회 공공데이터 및 글로벌 언론사 RSS를 AI가 실시간 모니터링하여 법안과 핵심 사회적 쟁점을 공정하게 초안으로 추출합니다.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3 hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl font-bold border border-indigo-500/20">
              02
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              집단지성 예측 참여
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              시민들이 일상에서 얻은 PMP를 투입해 법안 가결 및 사건 결과를 예측하며 데이터 기반의 실시간 여론 지표를 형성합니다.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3 hover:border-purple-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl font-bold border border-purple-500/20">
              03
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              AI 정산 & PMC 보상
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              국회 본회의 심의 결과(`rgs_conf_rslt`)로 승패가 자동 판정되며, 승리자들에게 실질적 교환 가치를 지닌 PMC 코인이 지급됩니다.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl font-bold border border-emerald-500/20">
              04
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              투명 공익 환원 기부
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              획득한 PMC를 아동, 어르신, 재난구호 등 검증된 투명 공익 기관에 100% 기부하여 나의 지혜를 실질적 사회 변화로 전환합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Verified Donation Partners Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>VERIFIED SOCIAL IMPACT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              검증된 공익 파트너스 & 기부 생태계
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              신뢰도 점수 90점 이상의 엄선된 비영리 기관에 수수료 0%로 투명하게 기부됩니다.
            </p>
          </div>
          <Link
            href="/donation/institute"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>모든 기부 기관 및 리포트 보기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all">
            <div className="text-3xl mb-3">👶</div>
            <h3 className="text-lg font-bold text-white">유니세프 한국위원회</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              모든 어린이가 행복한 세상을 위한 전 세계 어린이 구호 및 권리 옹호
            </p>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 신뢰도 98%
              </span>
              <Link href="/donation/institute/children/general/d1000000-0000-0000-0000-000000000001" className="text-slate-300 hover:text-white font-medium">
                기부하기 →
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all">
            <div className="text-3xl mb-3">💝</div>
            <h3 className="text-lg font-bold text-white">아름다운재단</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              올바른 기부 문화를 확산하고 이웃과 사회의 지속가능한 대안을 만듭니다.
            </p>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 신뢰도 97%
              </span>
              <Link href="/donation/institute" className="text-slate-300 hover:text-white font-medium">
                기부하기 →
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all">
            <div className="text-3xl mb-3">🌱</div>
            <h3 className="text-lg font-bold text-white">초록우산 어린이재단</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              어린이의 꿈과 건강한 성장을 지원하는 75년 전통의 대한민국 아동복지 전문기관
            </p>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 신뢰도 96%
              </span>
              <Link href="/donation/institute" className="text-slate-300 hover:text-white font-medium">
                기부하기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 border border-white/10 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              당신의 통찰과 예측이
              <br />
              더 나은 대한민국의 미래를 만듭니다
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto">
              지금 가입하여 1,000 PMP를 무료로 받고, 국회 의안과 주요 사회 현안에 직접 투표하고 예측하세요.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link
                href="/prediction"
                className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
              >
                지금 무료로 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
