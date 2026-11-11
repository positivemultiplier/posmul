'use client';

/**
 * PosMul Unified Ranking & Hall of Fame Page
 * 동(읍·면·동) 단위 세분화 풀뿌리 랭킹 & 직업군별 시민 명예의 전당
 */

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Trophy,
  Users,
  Clock,
  Eye,
  Sparkles,
  Heart,
  MessageSquare,
  Compass,
  ArrowUpRight,
  MapPin,
  Briefcase,
  Target,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  useRanking,
  RANKING_CATEGORIES,
  type RankingCategory,
  type RankingEntry,
} from '@/bounded-contexts/ranking/presentation/hooks/use-ranking';
import { KOREA_REGIONS, SIDO_LIST, JOB_GROUPS } from '@/shared/constants/regions-and-jobs';
import { DomainContextHeader } from '@/shared/ui/components/layout/DomainContextHeader';

function getTierInfo(score: number) {
  if (score >= 10000) return { name: '레전드', color: 'from-amber-400 to-yellow-300', nextScore: 10000, progress: 100, icon: '👑' };
  if (score >= 5000) return { name: '마스터', color: 'from-purple-400 to-pink-400', nextScore: 10000, progress: Math.min(100, Math.round(((score - 5000) / 5000) * 100)), icon: '⭐' };
  if (score >= 2000) return { name: '열정 시민', color: 'from-blue-400 to-cyan-400', nextScore: 5000, progress: Math.min(100, Math.round(((score - 2000) / 3000) * 100)), icon: '🔥' };
  if (score >= 500) return { name: '성장 시민', color: 'from-emerald-400 to-teal-400', nextScore: 2000, progress: Math.min(100, Math.round(((score - 500) / 1500) * 100)), icon: '🌱' };
  return { name: '새싹 시민', color: 'from-slate-400 to-zinc-400', nextScore: 500, progress: Math.min(100, Math.round((score / 500) * 100)), icon: '🐣' };
}

function HallOfFamePodium({
  top3,
  category,
  regionText,
}: {
  top3: RankingEntry[];
  category: RankingCategory;
  regionText: string;
}) {
  if (top3.length === 0) return null;

  const first = top3.find((r) => r.rank === 1) || top3[0];
  const second = top3.find((r) => r.rank === 2) || top3[1];
  const third = top3.find((r) => r.rank === 3) || top3[2];

  const getScoreUnit = (cat: RankingCategory) => {
    switch (cat) {
      case 'forum':
        return 'PMP';
      case 'expect':
        return 'PMC (적중 보상)';
      case 'donation':
      case 'consume':
        return 'PMC';
      default:
        return '점';
    }
  };

  const unit = getScoreUnit(category);

  return (
    <div className="relative pt-4 pb-2 px-2 overflow-hidden">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>
            {category === 'expect'
              ? '🔮 PREDICTION MASTERS · "내가 그랬제!" 명예의 전당'
              : `HALL OF FAME · ${regionText} 명예의 전당`}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          {regionText}를 대표하는{' '}
          <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
            {category === 'expect' ? 'Top 3 예측의 신' : 'Top 3 명예 시민'}
          </span>
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          {category === 'expect'
            ? '"내 말이 맞았잖아!" 정확한 직관과 통찰력으로 미래 이슈를 적중시킨 명사수들입니다.'
            : '풀뿌리 자치와 집단지성, 선한 기부로 우리 동네 긍정승수를 높이는 선구자들입니다.'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-6 items-end max-w-2xl mx-auto">
        {second ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-3 flex flex-col items-center">
              <span className="text-2xl mb-1 filter drop-shadow">🥈</span>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-600 p-[2px] shadow-lg shadow-slate-500/20">
                <div className="w-full h-full bg-slate-900/90 rounded-2xl flex items-center justify-center font-bold text-white text-lg">
                  {second.displayName.slice(0, 2)}
                </div>
              </div>
              <span className="mt-2 text-xs md:text-sm font-bold text-slate-200 truncate max-w-[90px] md:max-w-[120px] text-center">
                {second.displayName}
              </span>
              <span className="text-[11px] md:text-xs text-slate-400 font-semibold">
                {second.score.toLocaleString()} {unit}
              </span>
            </div>
            <div className="w-full h-28 md:h-36 bg-gradient-to-t from-slate-800 to-slate-800/60 rounded-t-2xl border-t border-x border-slate-700/80 flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl md:text-3xl font-black text-slate-400">2nd</span>
              <span className="text-[10px] text-slate-400 font-medium">Silver Citizen</span>
            </div>
          </motion.div>
        ) : (
          <div className="h-28" />
        )}

        {first && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center -mt-6 z-10"
          >
            <div className="relative mb-3 flex flex-col items-center">
              <span className="text-3xl md:text-4xl mb-1 filter drop-shadow-lg animate-bounce">👑</span>
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 p-[3px] shadow-2xl shadow-amber-500/40">
                <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center font-black text-amber-300 text-xl md:text-2xl">
                  {first.displayName.slice(0, 2)}
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-black font-black">
                  1
                </div>
              </div>
              <span className="mt-2 text-sm md:text-base font-extrabold text-amber-200 truncate max-w-[100px] md:max-w-[140px] text-center">
                {first.displayName}
              </span>
              <span className="text-xs md:text-sm text-amber-400 font-bold">
                {first.score.toLocaleString()} {unit}
              </span>
            </div>
            <div className="w-full h-36 md:h-48 bg-gradient-to-t from-amber-950/80 via-amber-900/60 to-amber-600/30 rounded-t-2xl border-t-2 border-x border-amber-400/80 flex flex-col items-center justify-center shadow-xl shadow-amber-500/10">
              <span className="text-3xl md:text-4xl font-black text-amber-300">1st</span>
              <span className="text-xs text-amber-200 font-bold">Gold Champion</span>
            </div>
          </motion.div>
        )}

        {third ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-3 flex flex-col items-center">
              <span className="text-2xl mb-1 filter drop-shadow">🥉</span>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 p-[2px] shadow-lg shadow-amber-900/30">
                <div className="w-full h-full bg-slate-900/90 rounded-2xl flex items-center justify-center font-bold text-amber-500 text-lg">
                  {third.displayName.slice(0, 2)}
                </div>
              </div>
              <span className="mt-2 text-xs md:text-sm font-bold text-slate-300 truncate max-w-[90px] md:max-w-[120px] text-center">
                {third.displayName}
              </span>
              <span className="text-[11px] md:text-xs text-slate-400 font-semibold">
                {third.score.toLocaleString()} {unit}
              </span>
            </div>
            <div className="w-full h-24 md:h-28 bg-gradient-to-t from-slate-800 to-slate-800/60 rounded-t-2xl border-t border-x border-amber-800/50 flex flex-col items-center justify-center shadow-inner">
              <span className="text-xl md:text-2xl font-black text-amber-600">3rd</span>
              <span className="text-[10px] text-slate-400 font-medium">Bronze Citizen</span>
            </div>
          </motion.div>
        ) : (
          <div className="h-24" />
        )}
      </div>
    </div>
  );
}

function RankingCard({
  entry,
  showDetails,
  rank,
  category,
}: {
  entry: RankingEntry;
  showDetails: boolean;
  rank: number;
  category: RankingCategory;
}) {
  const getRankBadge = (r: number) => {
    switch (r) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30';
      case 2:
        return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black shadow-md';
      case 3:
        return 'bg-gradient-to-r from-amber-700 to-amber-800 text-white font-black';
      default:
        return 'bg-slate-800/80 text-slate-400 font-semibold border border-slate-700/50';
    }
  };

  const job = JOB_GROUPS.find((j) => j.id === entry.jobGroup);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(rank * 0.04, 0.4) }}
      className={`p-4 md:p-5 rounded-2xl border transition-all duration-300 ${
        entry.isCurrentUser
          ? 'border-amber-400/60 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-950/90 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/40'
          : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/80 hover:border-amber-500/30'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div
            className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-sm md:text-base shrink-0 ${getRankBadge(
              entry.rank
            )}`}
          >
            {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-sm md:text-base truncate ${entry.isCurrentUser ? 'text-amber-200' : 'text-white'}`}>
                {entry.displayName}
              </span>
              {entry.isCurrentUser && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 uppercase tracking-wider">
                  나 (ME)
                </span>
              )}
              {entry.badge && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                  {entry.badge}
                </span>
              )}

              {entry.dong && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-950/50 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-amber-400" />
                  <span>{entry.sigungu || ''} {entry.dong}</span>
                </span>
              )}

              {job && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <span>{job.icon}</span>
                  <span>{job.name.split('·')[0].trim()}</span>
                </span>
              )}
            </div>

            {showDetails && (
              <div className="text-[11px] md:text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                {entry.details.donationPmc !== undefined && entry.details.donationPmc > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-950/40 text-purple-300 border border-purple-800/30 flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5 text-purple-400" />
                    기부 {entry.details.donationPmc.toLocaleString()} PMC
                  </span>
                )}
                {entry.details.expectPmc !== undefined && entry.details.expectPmc > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-950/40 text-sky-300 border border-sky-800/30 flex items-center gap-1">
                    <Compass className="w-2.5 h-2.5 text-sky-400" />
                    예측 {entry.details.expectPmc.toLocaleString()} PMC
                  </span>
                )}
                {entry.details.forumPmp !== undefined && entry.details.forumPmp > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/30 flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />
                    포럼 {entry.details.forumPmp.toLocaleString()} PMP
                  </span>
                )}
                {entry.details.settledCount !== undefined && entry.details.settledCount > 0 && (
                  <>
                    {entry.details.brierScore !== undefined && (
                      <span
                        className="px-2 py-0.5 rounded-md bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 flex items-center gap-1"
                        title="Brier Score (0에 가까울수록 높은 예측 정밀도)"
                      >
                        <Target className="w-2.5 h-2.5 text-indigo-400" />
                        Brier {entry.details.brierScore.toFixed(3)}
                      </span>
                    )}
                    {entry.details.skillWeight !== undefined && (
                      <span
                        className="px-2 py-0.5 rounded-md bg-cyan-950/50 text-cyan-300 border border-cyan-800/40 flex items-center gap-1"
                        title="베이지안 집단지성 숙련 가중치"
                      >
                        <Activity className="w-2.5 h-2.5 text-cyan-400" />
                        가중치 {entry.details.skillWeight.toFixed(2)}x
                      </span>
                    )}
                    {entry.details.winRate !== undefined && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-800/30">
                        적중 {Math.round(entry.details.winRate * 100)}% ({entry.details.settledCount}건)
                      </span>
                    )}
                    {entry.details.userBeta !== undefined && (
                      <span
                        className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60"
                        title="CAPM 위험 성향 계수 (1.0 기준 시장 중립)"
                      >
                        CAPM β {entry.details.userBeta.toFixed(2)}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-lg md:text-xl font-extrabold text-amber-400">
            {entry.score.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            {category === 'expect' ? '🔮 예측 적중 PMC' : category === 'forum' ? 'PMP 활동' : category === 'donation' ? '기부 PMC' : '종합 점수'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CurrentUserDashboardCard({
  user,
  regionText,
}: {
  user: RankingEntry;
  regionText: string;
}) {
  const tier = getTierInfo(user.score);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900/90 to-slate-950 border border-amber-500/40 p-5 md:p-6 shadow-xl">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>나의 시민 위상 · {regionText}</span>
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              #{user.rank} <span className="text-lg font-semibold text-slate-400">위</span>
            </h3>
            <div className={`px-2.5 py-1 rounded-lg bg-gradient-to-r ${tier.color} text-slate-950 text-xs font-extrabold flex items-center gap-1`}>
              <span>{tier.icon}</span>
              <span>{tier.name}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {regionText} 긍정승수 형성에 기여한 총 누적 포인트입니다.
          </p>
        </div>

        <div className="text-left md:text-right w-full md:w-auto">
          <div className="text-xs text-slate-400 font-medium">활동 누적 포인트</div>
          <div className="text-2xl md:text-3xl font-black text-amber-300">
            {user.score.toLocaleString()} <span className="text-sm font-semibold text-amber-500">pts</span>
          </div>
        </div>
      </div>

      {user.details.settledCount !== undefined && user.details.settledCount > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2">
            <div className="text-[10px] text-slate-400">정밀도 (Brier)</div>
            <div className="font-bold text-indigo-300 mt-0.5">
              {(user.details.brierScore ?? 0.25).toFixed(3)}
            </div>
          </div>
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2">
            <div className="text-[10px] text-slate-400">숙련 가중치</div>
            <div className="font-bold text-cyan-300 mt-0.5">
              {(user.details.skillWeight ?? 1.0).toFixed(2)}x
            </div>
          </div>
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2">
            <div className="text-[10px] text-slate-400">정산 적중률</div>
            <div className="font-bold text-amber-300 mt-0.5">
              {Math.round((user.details.winRate ?? 0) * 100)}% ({user.details.settledCount}건)
            </div>
          </div>
          <div className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-2">
            <div className="text-[10px] text-slate-400">CAPM β</div>
            <div className="font-bold text-slate-200 mt-0.5">
              {(user.details.userBeta ?? 1.0).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex justify-between text-xs font-medium mb-1.5">
          <span className="text-slate-400 flex items-center gap-1">
            다음 등급 승급까지 <span className="text-amber-300 font-bold">{Math.max(0, tier.nextScore - user.score).toLocaleString()} 점</span> 남음
          </span>
          <span className="text-amber-400 font-bold">{tier.progress}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-[1px] border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-700"
            style={{ width: `${tier.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function RankingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryCategory = (searchParams?.get('category') as RankingCategory) || 'expect';
  const querySido = searchParams?.get('sido') || '전국';

  const {
    rankings,
    currentUser,
    meta,
    loading,
    error,
    category,
    sido,
    sigungu,
    dong,
    jobGroup,
    changeCategory,
    changeRegion,
    changeJobGroup,
  } = useRanking(queryCategory);

  const [showDetails, setShowDetails] = useState(true);

  // Row 2 / Row 3 네비게이션 쿼리와 실시간 동기화
  useEffect(() => {
    const validCategories: RankingCategory[] = ['expect', 'overall', 'forum', 'consume', 'donation'];
    if (validCategories.includes(queryCategory) && queryCategory !== category) {
      changeCategory(queryCategory);
    }
  }, [queryCategory, category, changeCategory]);

  useEffect(() => {
    if (querySido !== sido) {
      changeRegion(querySido, '전체', '전체');
    }
  }, [querySido, sido, changeRegion]);

  const handleCategoryTabClick = (catId: RankingCategory) => {
    changeCategory(catId);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('category', catId);
    router.push(`/ranking?${params.toString()}`);
  };

  const sigunguList = useMemo(() => {
    if (sido === '전국' || !KOREA_REGIONS[sido]) return ['전체'];
    return ['전체', ...Object.keys(KOREA_REGIONS[sido])];
  }, [sido]);

  const dongList = useMemo(() => {
    if (sido === '전국' || sigungu === '전체' || !KOREA_REGIONS[sido]?.[sigungu]) {
      return ['전체'];
    }
    return ['전체', ...KOREA_REGIONS[sido][sigungu]];
  }, [sido, sigungu]);

  const currentRegionText = useMemo(() => {
    if (sido === '전국') return '전국';
    if (sigungu === '전체') return sido;
    if (dong === '전체') return `${sido} ${sigungu}`;
    return `${sigungu} ${dong}`;
  }, [sido, sigungu, dong]);

  const top3 = rankings.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        <DomainContextHeader
          domain="ranking"
          title="🏆 Ranking · 동네 풀뿌리 명예의 전당"
          subtitle="읍·면·동 행정동 단위 세분화 & 직업군별 '내가 그랬제!' 예측 명사수 및 시민 주권 랭킹"
          metrics={[
            { label: '집계 주권 시민', value: rankings.length, unit: '명' },
            { label: '현재 탐색 지역', value: currentRegionText },
          ]}
          actionSlot={
            <Link
              href="/prediction"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-950/50 flex items-center gap-1"
            >
              <span>예측 참여하기</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="flex flex-wrap gap-2">
            {RANKING_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryTabClick(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border ${
                  category === cat.id
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                    : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </DomainContextHeader>

        {/* 🗺️ 동네 랭킹 3단계 계층형 셀렉터 (시/도 > 시/군/구 > 읍/면/동) */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-500/20 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>동네 행정구역 선택 (3단계 풀뿌리 자치 랭킹)</span>
            </span>
            <span className="text-[11px] text-slate-400">
              현재 탐색 지역: <strong className="text-amber-300 font-bold">{currentRegionText}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1">1단계: 광역 (시/도)</label>
              <select
                value={sido}
                onChange={(e) => changeRegion(e.target.value, '전체', '전체')}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/60 font-medium"
              >
                {SIDO_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1">2단계: 기초 (시/군/구)</label>
              <select
                value={sigungu}
                disabled={sido === '전국'}
                onChange={(e) => changeRegion(sido, e.target.value, '전체')}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/60 font-medium disabled:opacity-50"
              >
                {sigunguList.map((sgg) => (
                  <option key={sgg} value={sgg}>{sgg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1">3단계: 동네 (읍/면/동)</label>
              <select
                value={dong}
                disabled={sido === '전국' || sigungu === '전체'}
                onChange={(e) => changeRegion(sido, sigungu, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/60 font-medium disabled:opacity-50"
              >
                {dongList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!loading && rankings.length > 0 && (
          <HallOfFamePodium top3={top3} category={category} regionText={currentRegionText} />
        )}

        {currentUser && <CurrentUserDashboardCard user={currentUser} regionText={currentRegionText} />}

        {/* 직업군 필터 칩 바 */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
            <Briefcase className="w-3.5 h-3.5 text-amber-400" />
            <span>직업군별 필터링</span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => changeJobGroup('전체')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                jobGroup === '전체'
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              전체 직업
            </button>
            {JOB_GROUPS.map((job) => (
              <button
                key={job.id}
                onClick={() => changeJobGroup(job.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all border ${
                  jobGroup === job.id
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>{job.icon}</span>
                <span>{job.name.split('·')[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col justify-center items-center py-20 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-400 border-t-transparent" />
            <p className="text-xs text-slate-400">{currentRegionText} 시민 순위를 집계하고 있습니다...</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/30 border border-rose-800 text-rose-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{currentRegionText} 시민 순위표 ({rankings.length}명)</span>
              </h3>
              <label className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDetails}
                  onChange={(e) => setShowDetails(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500"
                />
                <Eye className="w-3.5 h-3.5" />
                <span>상세 지표</span>
              </label>
            </div>

            {rankings.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800/50">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
                <p className="text-sm font-semibold text-slate-400">선택하신 지역({currentRegionText})에 등록된 시민 랭킹이 아직 없습니다.</p>
                <p className="text-xs text-slate-500 mt-1">우리 동네의 첫 번째 명예 시민이 되어보세요!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {rankings.map((entry, index) => (
                  <RankingCard
                    key={entry.userId}
                    entry={entry}
                    showDetails={showDetails}
                    rank={index}
                    category={category}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {meta && (
          <div className="pt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>최근 업데이트: {new Date(meta.lastUpdated).toLocaleString('ko-KR')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RankingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <RankingContent />
    </Suspense>
  );
}
