import { Card, Badge, Button } from "../../../../shared/ui";

export default function SoccerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ⚽ 축구 예측 게임
        </h1>
        <p className="text-xl text-gray-600">
          전 세계 축구 경기 결과를 예측하고 보상을 받으세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">맨시티 vs 레알 마드리드</h3>
            <Badge variant="secondary">진행중</Badge>
          </div>
          <p className="text-gray-600 mb-4">
            챔피언스리그 결승전 결과를 예측해보세요.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>맨시티 승리</span>
              <span className="font-medium">45%</span>
            </div>
            <div className="flex justify-between">
              <span>무승부</span>
              <span className="font-medium">25%</span>
            </div>
            <div className="flex justify-between">
              <span>레알 승리</span>
              <span className="font-medium">30%</span>
            </div>
          </div>
          <Button className="w-full">예측 참여하기</Button>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">토트넘 vs 아스날</h3>
            <Badge variant="secondary">예정</Badge>
          </div>
          <p className="text-gray-600 mb-4">
            런던 더비 결과를 예측해보세요.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>토트넘 승리</span>
              <span className="font-medium">40%</span>
            </div>
            <div className="flex justify-between">
              <span>무승부</span>
              <span className="font-medium">30%</span>
            </div>
            <div className="flex justify-between">
              <span>아스날 승리</span>
              <span className="font-medium">30%</span>
            </div>
          </div>
          <Button className="w-full">예측 참여하기</Button>
        </Card>
      </div>
    </div>
  );
}
