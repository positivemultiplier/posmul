"use client";
// Auth 통합 테스트 페이지
import { useState } from 'react';
import { useAuth } from '../../bounded-contexts/auth/presentation/hooks/useAuth';

export default function AuthTestPage() {
  const { user, isLoading, error, signUp, signIn, signOut, clearError } = useAuth();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('test123456');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testSignUp = async () => {
    try {
      clearError();
      await signUp({ email: testEmail, password: testPassword });
      addTestResult('✅ 회원가입 성공');
    } catch (err) {
      addTestResult(`❌ 회원가입 실패: ${err}`);
    }
  };

  const testSignIn = async () => {
    try {
      clearError();
      await signIn({ email: testEmail, password: testPassword });
      addTestResult('✅ 로그인 성공');
    } catch (err) {
      addTestResult(`❌ 로그인 실패: ${err}`);
    }
  };

  const testSignOut = async () => {
    try {
      await signOut();
      addTestResult('✅ 로그아웃 성공');
    } catch (err) {
      addTestResult(`❌ 로그아웃 실패: ${err}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Auth 시스템 통합 테스트</h1>

      {/* 현재 상태 */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">현재 인증 상태</h2>
        <div className="space-y-2">
          <p><strong>로딩 중:</strong> {isLoading ? '예' : '아니오'}</p>
          <p><strong>에러:</strong> {error || '없음'}</p>
          <p><strong>사용자:</strong> {user ? `${user.email} (ID: ${user.id})` : '로그인하지 않음'}</p>
        </div>
      </div>

      {/* 테스트 컨트롤 */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">테스트 컨트롤</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">테스트 이메일:</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">테스트 비밀번호:</label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="최소 6자"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={testSignUp}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              회원가입 테스트
            </button>
            <button
              onClick={testSignIn}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              로그인 테스트
            </button>
            <button
              onClick={testSignOut}
              disabled={isLoading || !user}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              로그아웃 테스트
            </button>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              에러 초기화
            </button>
          </div>
        </div>
      </div>

      {/* 테스트 결과 */}
      <div className="mb-8 p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">테스트 결과</h2>
          <button
            onClick={clearResults}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            결과 지우기
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">테스트 결과가 없습니다.</p>
          ) : (
            <div className="space-y-1 font-mono text-sm">
              {testResults.map((result, index) => (
                <div key={index} className="border-b border-gray-200 pb-1">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 디버그 정보 */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">디버그 정보</h2>
        <div className="bg-gray-50 p-4 rounded">
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(
              {
                isLoading,
                error,
                user: user ? {
                  id: user.id,
                  email: user.email,
                  displayName: user.displayName,
                  pmcBalance: user.pmcBalance,
                  pmpBalance: user.pmpBalance,
                  isActive: user.isActive,
                  createdAt: user.createdAt,
                  updatedAt: user.updatedAt,
                } : null,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </main>
  );
}