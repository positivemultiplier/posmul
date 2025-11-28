'use client';

import { useState } from 'react';

interface EconomicBalance {
  pmpBalance: number;
  pmcBalance: number;
  userId: string;
}

interface PredictionGame {
  id: string;
  title: string;
  description: string;
  options: Array<{ id: string; label: string }>;
  status: string;
  created_at: string;
}

export default function TestMVPPage() {
  const [balance, setBalance] = useState<EconomicBalance | null>(null);
  const [games, setGames] = useState<PredictionGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testUserId, setTestUserId] = useState('');

  // 1. 테스트 데이터 초기화
  const initializeTestData = async () => {
    setLoading(true);
    setMessage('테스트 데이터 초기화 중...');
    
    try {
      const response = await fetch('/api/test/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestUserId(result.data.userId);
        setMessage(`✅ 테스트 데이터 초기화 완료! 
        사용자 ID: ${result.data.userId}
        이메일: ${result.data.testCredentials.email}
        비밀번호: ${result.data.testCredentials.password}`);
      } else {
        setMessage(`❌ 초기화 실패: ${result.error.message}`);
      }
    } catch (error) {
      setMessage(`❌ 오류: ${error}`);
    }
    
    setLoading(false);
  };

  // 2. 경제 상태 조회
  const fetchBalance = async () => {
    if (!testUserId) {
      setMessage('❌ 먼저 테스트 데이터를 초기화하세요');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/economy/balance?userId=${testUserId}`);
      const result = await response.json();
      
      if (result.success) {
        setBalance(result.data);
        setMessage(`✅ 잔액 조회 완료! PMP: ${result.data.pmpBalance}, PMC: ${result.data.pmcBalance}`);
      } else {
        setMessage(`❌ 잔액 조회 실패: ${result.error.message}`);
      }
    } catch (error) {
      setMessage(`❌ 오류: ${error}`);
    }
    
    setLoading(false);
  };

  // 3. 예측 게임 목록 조회
  const fetchGames = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/predictions/simple?status=ACTIVE&limit=5');
      const result = await response.json();
      
      if (result.success) {
        setGames(result.data.games);
        setMessage(`✅ 게임 목록 조회 완료! ${result.data.games.length}개 게임 발견`);
      } else {
        setMessage(`❌ 게임 목록 조회 실패: ${result.error.message}`);
      }
    } catch (error) {
      setMessage(`❌ 오류: ${error}`);
    }
    
    setLoading(false);
  };

  // 4. 테스트 예측 게임 생성
  const createTestGame = async () => {
    setLoading(true);
    setMessage('테스트 게임 생성 중...');
    
    try {
      const gameData = {
        title: '대한민국 내년 GDP 성장률 예측',
        description: '2025년 대한민국의 GDP 성장률이 3% 이상일까요?',
        predictionType: 'binary',
        options: [
          { id: 'yes', label: '3% 이상 성장할 것이다' },
          { id: 'no', label: '3% 미만 성장할 것이다' }
        ],
        creatorId: testUserId || 'test-creator',
        minimumStake: 10,
        maximumStake: 100,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24시간 후
        settlementTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48시간 후
      };

      const response = await fetch('/api/predictions/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ 게임 생성 완료! 게임 ID: ${result.data.gameId}`);
        // 게임 목록 자동 새로고침
        await fetchGames();
      } else {
        setMessage(`❌ 게임 생성 실패: ${result.error.message}`);
      }
    } catch (error) {
      setMessage(`❌ 오류: ${error}`);
    }
    
    setLoading(false);
  };

  // 5. 예측 게임 참여
  const participateInGame = async (gameId: string, optionId: string) => {
    if (!testUserId) {
      setMessage('❌ 먼저 테스트 데이터를 초기화하세요');
      return;
    }

    setLoading(true);
    setMessage('예측 게임 참여 중...');
    
    try {
      const participationData = {
        userId: testUserId,
        gameId: gameId,
        selectedOptionId: optionId,
        stakeAmount: 50, // 50 PMP 베팅
        confidence: 0.7
      };

      const response = await fetch('/api/predictions/participate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participationData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ 예측 참여 완료! 예측 ID: ${result.data.predictionId}`);
        // 잔액 자동 새로고침
        await fetchBalance();
      } else {
        setMessage(`❌ 예측 참여 실패: ${result.error.message}`);
      }
    } catch (error) {
      setMessage(`❌ 오류: ${error}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">
        🎯 PosMul MVP 테스트 대시보드
      </h1>

      {/* 상태 메시지 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">📝 상태 메시지:</h3>
        <pre className="text-sm whitespace-pre-wrap">{message || '테스트를 시작하세요!'}</pre>
      </div>

      {/* 1단계: 초기화 */}
      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">1단계: 테스트 환경 초기화</h2>
        <p className="text-gray-600 mb-4">
          테스트 사용자를 생성하고 초기 PMP 1000개를 지급합니다.
        </p>
        <button
          onClick={initializeTestData}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '처리 중...' : '🚀 테스트 데이터 초기화'}
        </button>
        {testUserId && (
          <p className="mt-2 text-sm text-green-600">✅ 사용자 ID: {testUserId}</p>
        )}
      </div>

      {/* 2단계: 경제 상태 */}
      <div className="bg-green-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">2단계: 경제 상태 확인</h2>
        <p className="text-gray-600 mb-4">
          사용자의 PMP(위험프리 자산)와 PMC(위험자산) 잔액을 확인합니다.
        </p>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? '조회 중...' : '💰 잔액 조회'}
        </button>
        {balance && (
          <div className="mt-4 p-4 bg-white rounded border">
            <h3 className="font-semibold">💎 경제 상태</h3>
            <p>🪙 PMP (위험프리): {balance.pmpBalance}</p>
            <p>💎 PMC (위험자산): {balance.pmcBalance}</p>
          </div>
        )}
      </div>

      {/* 3단계: 게임 관리 */}
      <div className="bg-yellow-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">3단계: 예측 게임 시스템</h2>
        <p className="text-gray-600 mb-4">
          예측 게임을 생성하고 참여하여 실제 경제 순환을 체험합니다.
        </p>
        <div className="space-x-4 mb-4">
          <button
            onClick={createTestGame}
            disabled={loading}
            className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            {loading ? '생성 중...' : '🎮 테스트 게임 생성'}
          </button>
          <button
            onClick={fetchGames}
            disabled={loading}
            className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? '조회 중...' : '📋 게임 목록 조회'}
          </button>
        </div>

        {/* 게임 목록 */}
        {games.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">🎯 활성 게임 목록</h3>
            {games.map((game) => (
              <div key={game.id} className="p-4 bg-white rounded border">
                <h4 className="font-semibold">{game.title}</h4>
                <p className="text-gray-600 text-sm mb-2">{game.description}</p>
                <p className="text-xs text-gray-500 mb-3">상태: {game.status} | 생성: {new Date(game.created_at).toLocaleString()}</p>
                <div className="space-x-2">
                  {game.options?.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => participateInGame(game.id, option.id)}
                      disabled={loading}
                      className="bg-indigo-500 text-white px-4 py-1 text-sm rounded hover:bg-indigo-600 disabled:opacity-50"
                    >
                      🎯 '{option.label}' 선택 (50 PMP)
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 결과 요약 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🎉 테스트 결과 요약</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>✅ 초기화 완료:</strong> {testUserId ? '완료' : '미완료'}</p>
            <p><strong>💰 잔액 조회:</strong> {balance ? '완료' : '미완료'}</p>
          </div>
          <div>
            <p><strong>🎮 게임 목록:</strong> {games.length}개 게임</p>
            <p><strong>🎯 예측 참여:</strong> 테스트 필요</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-white rounded border">
          <h3 className="font-semibold text-green-600">🚀 성공 지표</h3>
          <p className="text-sm">
            ✅ 사용자 생성 → ✅ PMP 지급 → ✅ 게임 생성 → ✅ 예측 참여 → ✅ 잔액 변동
          </p>
          <p className="text-xs text-gray-500 mt-2">
            이 모든 단계가 성공하면 PosMul의 핵심 경제 순환이 작동하는 것입니다!
          </p>
        </div>
      </div>
    </div>
  );
}