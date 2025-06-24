import { createPredictionGame } from "@/app/actions";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function PredictionGameForm() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>새 예측 게임 만들기</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createPredictionGame} className="space-y-6">
          {/* 게임 기본 정보 */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                게임 제목 *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 2024년 월드컵 우승팀 예측"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                게임 설명 *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="게임에 대한 자세한 설명을 입력하세요..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  카테고리 *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">카테고리 선택</option>
                  <option value="sports">스포츠</option>
                  <option value="entertainment">엔터테인먼트</option>
                  <option value="politics">정치</option>
                  <option value="user-suggestions">사용자 제안</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="predictionType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  예측 타입 *
                </label>
                <select
                  id="predictionType"
                  name="predictionType"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">타입 선택</option>
                  <option value="binary">이진 선택 (예/아니오)</option>
                  <option value="wdl">승/무/패</option>
                  <option value="ranking">순위 예측</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="options"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                예측 옵션 *
              </label>
              <textarea
                id="options"
                name="options"
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="각 옵션을 새 줄에 입력하세요. 예:&#10;브라질&#10;아르헨티나&#10;프랑스"
              />
            </div>
          </div>

          {/* 베팅 설정 */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900">베팅 설정</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="minimumStake"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  최소 베팅 금액 (PMP) *
                </label>
                <input
                  type="number"
                  id="minimumStake"
                  name="minimumStake"
                  required
                  min="100"
                  max="10000"
                  defaultValue="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="maximumStake"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  최대 베팅 금액 (PMP) *
                </label>
                <input
                  type="number"
                  id="maximumStake"
                  name="maximumStake"
                  required
                  min="100"
                  max="10000"
                  defaultValue="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="maxParticipants"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                최대 참여자 수 (선택사항)
              </label>
              <input
                type="number"
                id="maxParticipants"
                name="maxParticipants"
                min="2"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="제한없음"
              />
            </div>
          </div>

          {/* 시간 설정 */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900">시간 설정</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  예측 종료 시간 *
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  name="endTime"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="settlementTime"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  정산 시간 *
                </label>
                <input
                  type="datetime-local"
                  id="settlementTime"
                  name="settlementTime"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="pt-6 border-t">
            <Button type="submit" className="w-full">
              예측 게임 생성하기
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
