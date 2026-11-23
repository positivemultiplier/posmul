import Link from "next/link";

type PageProps = {
  params: Promise<{ subcategory: string; league: string; slug: string }>;
};

const mapLeagueToConsumePath = (league: string): string => {
  switch (league) {
    case "cloud":
      return "/prediction/consume/cloud";
    case "local":
      return "/prediction/consume/money";
    case "major":
      return "/prediction/consume/time";
    default:
      return "/prediction/consume";
  }
};

export default async function PredictionInvestDepth5Page({ params }: PageProps) {
  const { league, slug } = await params;
  const consumePath = mapLeagueToConsumePath(league);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold mb-4">투자 예측 이관 안내</h1>
        <p className="text-gray-300 mb-8">
          이 게임(슬러그: <span className="font-mono">{slug}</span>)은 투자 기능 이관에 따라
          Consume 도메인에서 제공됩니다.
        </p>
        <Link
          href={consumePath}
          className="inline-flex items-center rounded-lg bg-white/10 px-4 py-2 hover:bg-white/15 transition-colors"
        >
          Consume로 이동 →
        </Link>
      </div>
    </div>
  );
}
