import Link from "next/link";

import { CompactMoneyWaveCard } from "../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";

export default function PredictionUserSuggestionsPage() {
  const items = [
    {
      title: "사용자 제안",
      description: "개인이 제안한 주제 기반 예측",
      href: "/prediction/user-suggestions/user-proposals",
    },
    {
      title: "AI 추천",
      description: "AI 기반 추천 주제",
      href: "/prediction/user-suggestions/ai-recommendations",
    },
    {
      title: "오피니언 리더",
      description: "전문가 초청 예측",
      href: "/prediction/user-suggestions/opinion-leader-suggestions",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="mb-3 text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            💡 사용자 제안 예측
          </h1>
          <p className="text-xl text-gray-400">
            커뮤니티가 제안한 주제로 예측 시장을 만들어가요.
          </p>
        </div>

        <div className="mb-10">
          <CompactMoneyWaveCard depthLevel={2} category="all" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              <div className="text-lg font-semibold text-white">{item.title}</div>
              <div className="mt-2 text-sm text-gray-400">{item.description}</div>
              <div className="mt-4 text-sm text-gray-300">둘러보기 →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
