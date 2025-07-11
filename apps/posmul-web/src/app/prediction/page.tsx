import { Card, Badge } from "../../shared/ui";
import Link from "next/link";

export default function PredictionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎯 예측 게임
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          다양한 분야의 예측 게임에 참여하고 PmpAmount를 획득하세요.
        </p>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <Link href="/prediction/sports">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">⚽</div>
            <h3 className="text-xl font-semibold mb-2">스포츠</h3>
            <p className="text-gray-600 mb-4">축구, 야구, 농구 등 스포츠 경기 결과를 예측하세요.</p>
            <Badge variant="secondary">24개 게임</Badge>
          </Card>
        </Link>

        <Link href="/prediction/politics">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">🗳️</div>
            <h3 className="text-xl font-semibold mb-2">정치</h3>
            <p className="text-gray-600 mb-4">선거 결과와 정치적 이슈를 예측하세요.</p>
            <Badge variant="secondary">8개 게임</Badge>
          </Card>
        </Link>

        <Link href="/prediction/economy">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">경제</h3>
            <p className="text-gray-600 mb-4">주식, 환율, 경제 지표를 예측하세요.</p>
            <Badge variant="secondary">15개 게임</Badge>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="text-center">
        <Link href="/prediction/create">
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            새 게임 만들기
          </button>
        </Link>
      </div>
    </div>
  );
}
