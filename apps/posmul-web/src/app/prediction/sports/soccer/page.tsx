import Link from "next/link";
import { getSportsPredictionGames, parseGameOptions } from "../../../../bounded-contexts/public/infrastructure/repositories/prediction.repository";

export default async function SoccerPage() {
  const games = await getSportsPredictionGames({ limit: 20 });

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            ⚽ 축구 예측 게임
          </h1>
          <p className="text-xl text-slate-400">
            전 세계 축구 경기 결과를 예측하고 보상을 받으세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game: any) => {
            const options = parseGameOptions(game.game_options);
            
            return (
              <Link 
                key={game.game_id} 
                href={`/prediction/sports/soccer/${game.slug}`}
                className="block"
              >
                <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6 hover:bg-slate-900 transition-all hover:scale-105">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">{game.title}</h3>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      {game.status}
                    </span>
                  </div>
                  <p className="text-slate-400 mb-4 text-sm line-clamp-2">
                    {game.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    {options.slice(0, 3).map((option: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-300">{option.label}</span>
                        <span className="font-medium text-emerald-300">
                          {option.currentOdds ? `${(option.currentOdds * 100).toFixed(0)}%` : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full rounded-2xl border border-emerald-400/40 bg-emerald-400/10 py-3 text-sm font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-400/20">
                    예측 참여하기
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
