/**
 * 경제 예측 카테고리 페이지
 */

import Link from "next/link";

const subcategories = [
    {
        slug: "stocks",
        title: "📈 주식",
        description: "일일 주가 등락 예측",
        examples: ["코스피 상승/하락", "나스닥 등락", "엔비디아 주가"],
        color: "from-blue-500 to-cyan-500",
    },
    {
        slug: "earnings",
        title: "💰 기업 실적",
        description: "분기별 기업 실적 발표 예측",
        examples: ["삼성전자 영업이익", "애플 EPS", "테슬라 순이익"],
        color: "from-green-500 to-emerald-500",
    },
    {
        slug: "indicators",
        title: "📊 경제 지표",
        description: "정부 발표 경제 지표 예측",
        examples: ["소비자물가", "실업률", "금리 결정"],
        color: "from-purple-500 to-pink-500",
    },
    {
        slug: "crypto",
        title: "₿ 암호화폐",
        description: "암호화폐 가격 변동 예측",
        examples: ["비트코인 등락", "이더리움 가격"],
        color: "from-orange-500 to-amber-500",
    },
];

// 임시 게임 데이터
const activeGames = [
    { id: "1", title: "오늘 코스피 상승 or 하락?", participants: 156, totalStake: "890,000 PMP", endTime: "18:00" },
    { id: "2", title: "나스닥(QQQ) 등락 예측", participants: 234, totalStake: "1,250,000 PMP", endTime: "05:00" },
    { id: "3", title: "삼성전자 Q1 영업이익 10조 초과?", participants: 89, totalStake: "450,000 PMP", endTime: "3일 후" },
];

export default function EconomyPredictionPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* 히어로 섹션 */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-4">
                            📈 경제 예측
                        </h1>
                        <p className="text-xl text-gray-400">
                            주식, 기업 실적, 경제 지표를 예측하고 보상을 받으세요
                        </p>
                    </div>

                    {/* 서브카테고리 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {subcategories.map((cat) => (
                            <Link
                                key={cat.slug}
                                href={`/prediction/economy/${cat.slug}`}
                                className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-white/30 transition-all duration-300"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                                <p className="text-gray-400 text-sm mb-4">{cat.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {cat.examples.map((ex, i) => (
                                        <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                                            {ex}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 활성 게임 */}
            <section className="py-12 px-4 bg-white/5">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">🔥 진행 중인 경제 예측</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {activeGames.map((game) => (
                            <Link
                                key={game.id}
                                href={`/prediction/${game.id}`}
                                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all"
                            >
                                <h3 className="font-bold text-lg mb-3">{game.title}</h3>
                                <div className="flex justify-between text-sm text-gray-400 mb-4">
                                    <span>👥 {game.participants}명 참여</span>
                                    <span>💰 {game.totalStake}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">마감: {game.endTime}</span>
                                    <span className="px-3 py-1 bg-blue-600 rounded-full text-sm font-medium">
                                        참여하기
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 데이터 소스 안내 */}
            <section className="py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">📡 데이터 소스</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DataSourceBadge name="Alpha Vantage" type="주식" />
                        <DataSourceBadge name="FMP" type="기업 실적" />
                        <DataSourceBadge name="KOSIS" type="경제 지표" />
                        <DataSourceBadge name="DART" type="한국 기업" />
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                        모든 정산은 공신력 있는 외부 데이터 소스를 기반으로 자동 처리됩니다.
                    </p>
                </div>
            </section>
        </div>
    );
}

function DataSourceBadge({ name, type }: { name: string; type: string }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <div>
                <p className="font-medium text-sm">{name}</p>
                <p className="text-xs text-gray-500">{type}</p>
            </div>
        </div>
    );
}
