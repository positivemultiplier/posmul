import Link from "next/link";

import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";
import { getAggregatedPrizePool } from "../../../bounded-contexts/prediction/application/prediction-pool.service";
import { createClient } from "../../../lib/supabase/server";
import { DomainContextHeader } from "../../../shared/ui/components/layout/DomainContextHeader";

export default async function PredictionUserSuggestionsPage() {
  const supabase = await createClient();
  const userProposedPool = await getAggregatedPrizePool(
    supabase,
    "USER_PROPOSED"
  );

  const items = [
    {
      title: "🙋 시민 직접 제안",
      description: "주권자인 시민이 직접 발의한 사회·지역 의제 기반 예측 마켓",
      href: "/prediction/user-suggestions/user-proposals",
    },
    {
      title: "🤖 AI 큐레이션 추천",
      description: "실시간 공공 뉴스와 예산 데이터에서 AI가 도출한 핵심 예측 주제",
      href: "/prediction/user-suggestions/ai-recommendations",
    },
    {
      title: "🌟 오피니언 리더 제안",
      description: "각 분야 정책 전문가와 오피니언 리더가 화두를 던진 예측 마켓",
      href: "/prediction/user-suggestions/opinion-leader-suggestions",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <DomainContextHeader
          domain="prediction"
          title="💡 시민 제안 예측 마켓"
          subtitle="관료가 정한 의제가 아닌, 시민과 AI·전문가가 직접 발의한 주제로 집단지성 예측 시장을 만듭니다"
          metrics={[
            {
              label: "제안 상금풀",
              value: userProposedPool || 9500,
              unit: "PMC",
            },
          ]}
        />

        <div className="mb-6">
          <CompactMoneyWaveCard
            depthLevel={2}
            category="user_proposed"
            initialPool={userProposedPool}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 hover:border-sky-500/40 transition group"
            >
              <div className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                {item.title}
              </div>
              <div className="mt-2 text-sm text-slate-400">
                {item.description}
              </div>
              <div className="mt-4 text-xs font-semibold text-sky-400">
                마켓 둘러보기 →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
