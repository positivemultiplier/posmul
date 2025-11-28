import { useState } from 'react';
import { ChartWidget } from './ChartWidget';

export function ChartDashboard(props) {
  const gameId = props.gameId;
  const [selectedCharts, setSelectedCharts] = useState([
    'probability',
    'betting',
    'participants'
  ]);

  const availableCharts = [
    {
      id: 'probability',
      title: '📈 확률 변화 추이',
      description: '시간별 예측 옵션 확률 변화'
    },
    {
      id: 'betting',
      title: '💰 베팅 분포',
      description: '옵션별 베팅 금액 및 비율'
    },
    {
      id: 'participants',
      title: '👥 참여자 현황',
      description: '시간대별 참여자 수 변화'
    },
    {
      id: 'timeline',
      title: '⏰ 활동 타임라인',
      description: '주요 이벤트별 활동량'
    }
  ];

  const toggleChart = (chartId) => {
    setSelectedCharts(prev =>
      prev.includes(chartId)
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">데이터 시각화 대시보드</h2>
        <p className="text-gray-600">예측 게임의 실시간 데이터를 다양한 관점에서 분석하세요</p>
      </div>

      {/* 차트 선택 버튼들 */}
      <div className="flex flex-wrap gap-2">
        {availableCharts.map((chart) => (
          <button
            key={chart.id}
            onClick={() => toggleChart(chart.id)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              selectedCharts.includes(chart.id)
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {chart.title}
          </button>
        ))}
      </div>

      {/* 차트 그리드 */}
      {selectedCharts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedCharts.includes('probability') && (
            <div key="probability" className="space-y-2">
              <ChartWidget gameId={gameId} type="probability" title="📈 확률 변화 추이" height={320} />
            </div>
          )}
          {selectedCharts.includes('betting') && (
            <div key="betting" className="space-y-2">
              <ChartWidget gameId={gameId} type="betting" title="💰 베팅 분포" height={320} />
            </div>
          )}
          {selectedCharts.includes('participants') && (
            <div key="participants" className="space-y-2">
              <ChartWidget gameId={gameId} type="participants" title="👥 참여자 현황" height={320} />
            </div>
          )}
          {selectedCharts.includes('timeline') && (
            <div key="timeline" className="space-y-2">
              <ChartWidget gameId={gameId} type="timeline" title="⏰ 활동 타임라인" height={320} />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-lg font-medium text-gray-900">차트를 선택해주세요</h3>
          <p className="mt-1 text-gray-500">위의 버튼들을 클릭하여 표시할 차트를 선택하세요</p>
        </div>
      )}

      {/* 요약 통계 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 대시보드 요약</h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{selectedCharts.length}</div>
            <div className="text-sm text-gray-600">활성 차트</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">실시간</div>
            <div className="text-sm text-gray-600">업데이트</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">4</div>
            <div className="text-sm text-gray-600">총 차트</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">그리드</div>
            <div className="text-sm text-gray-600">레이아웃</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChartDashboard;
