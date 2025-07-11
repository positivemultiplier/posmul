import { Button } from "../../../shared/ui";

export default function PredictionSamplesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          📊 샘플 예측 게임
        </h1>
        <p className="text-lg text-gray-600">
          PosMul 예측 게임의 다양한 예시를 확인해보세요.
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">샘플 게임 1: 2024 월드컵 우승팀</h2>
          <p className="text-gray-600 mb-4">
            다가오는 월드컵에서 우승할 팀을 예측해보세요.
          </p>
          <Button>게임 참여하기</Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">샘플 게임 2: 비트코인 가격 예측</h2>
          <p className="text-gray-600 mb-4">
            다음 달 비트코인 가격을 예측해보세요.
          </p>
          <Button>게임 참여하기</Button>
        </div>
      </div>
    </div>
  );
}
