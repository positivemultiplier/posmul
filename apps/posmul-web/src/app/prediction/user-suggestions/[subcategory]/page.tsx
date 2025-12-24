import Link from "next/link";
import { notFound } from "next/navigation";

import { CompactMoneyWaveCard } from "../../../../bounded-contexts/prediction/presentation/components/CompactMoneyWaveCard";

interface PageProps {
  params: Promise<{ subcategory: string }>;
}

const SUBCATEGORY_META: Record<
  string,
  { title: string; description: string; depthSubcategory: string }
> = {
  "user-proposals": {
    title: "사용자 제안",
    description: "개인이 제안한 주제 기반 예측",
    depthSubcategory: "user-proposals",
  },
  "ai-recommendations": {
    title: "AI 추천",
    description: "AI 기반 추천 주제",
    depthSubcategory: "ai-recommendations",
  },
  "opinion-leader-suggestions": {
    title: "오피니언 리더",
    description: "전문가 초청 예측",
    depthSubcategory: "opinion-leader-suggestions",
  },
};

export default async function PredictionUserSuggestionsSubcategoryPage({
  params,
}: PageProps) {
  const { subcategory } = await params;
  const decoded = decodeURIComponent(subcategory).toLowerCase();
  const meta = SUBCATEGORY_META[decoded];

  if (!meta) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="mb-4">
            <Link
              href="/prediction/user-suggestions"
              className="text-sm text-gray-300 hover:text-white"
            >
              ← 사용자 제안
            </Link>
          </div>
          <h1 className="mb-3 text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {meta.title}
          </h1>
          <p className="text-xl text-gray-400">{meta.description}</p>
        </div>

        <div className="mb-10">
          <CompactMoneyWaveCard
            depthLevel={3}
            category="all"
            subcategory={meta.depthSubcategory}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg font-semibold">준비 중</div>
          <p className="mt-2 text-gray-300">
            이 섹션은 Depth5(카테고리→서브카테고리→주제→이벤트) 구조로 정리하면서
            실제 목록/카드 노출을 연결할 예정입니다.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/prediction/create"
              className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/15 transition"
            >
              예측 만들기
            </Link>
            <Link
              href="/prediction"
              className="rounded-lg bg-white/5 px-4 py-2 hover:bg-white/10 transition text-gray-200"
            >
              예측 홈
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
