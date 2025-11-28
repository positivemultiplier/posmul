'use client';

/**
 * Accounting & Tax Page
 * 회계 및 세무 관련 서비스
 */

import { useState } from 'react';
import Link from 'next/link';

type TransactionType = 'all' | 'earn' | 'spend' | 'transfer';
type PointType = 'all' | 'pmp' | 'pmc';

interface Transaction {
  id: string;
  date: string;
  type: 'earn' | 'spend' | 'transfer';
  pointType: 'PMP' | 'PMC';
  amount: number;
  description: string;
  category: string;
}

// 목데이터
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: '2025-01-20',
    type: 'earn',
    pointType: 'PMP',
    amount: 500,
    description: 'Forum 글 작성 보상',
    category: 'Forum',
  },
  {
    id: '2',
    date: '2025-01-19',
    type: 'earn',
    pointType: 'PMC',
    amount: 1200,
    description: '예측 성공 보상',
    category: 'Expect',
  },
  {
    id: '3',
    date: '2025-01-18',
    type: 'spend',
    pointType: 'PMC',
    amount: 5000,
    description: '지역 기부',
    category: 'Donation',
  },
  {
    id: '4',
    date: '2025-01-17',
    type: 'earn',
    pointType: 'PMC',
    amount: 800,
    description: 'MoneyConsume 캐시백',
    category: 'Consume',
  },
  {
    id: '5',
    date: '2025-01-16',
    type: 'transfer',
    pointType: 'PMC',
    amount: 2000,
    description: 'CloudConsume 펀딩 수익',
    category: 'Consume',
  },
];

// 거래 내역 행
function TransactionRow({ tx }: { tx: Transaction }) {
  const getTypeStyle = (type: Transaction['type']) => {
    switch (type) {
      case 'earn':
        return 'text-green-600';
      case 'spend':
        return 'text-red-600';
      case 'transfer':
        return 'text-blue-600';
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'earn':
        return '획득';
      case 'spend':
        return '사용';
      case 'transfer':
        return '전환';
    }
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4 text-sm text-gray-500">
        {new Date(tx.date).toLocaleDateString('ko-KR')}
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-1 rounded ${getTypeStyle(tx.type)} bg-opacity-10`}>
          {getTypeLabel(tx.type)}
        </span>
      </td>
      <td className="py-3 px-4">
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            tx.pointType === 'PMP' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {tx.pointType}
        </span>
      </td>
      <td className="py-3 px-4">{tx.description}</td>
      <td className="py-3 px-4 text-sm text-gray-500">{tx.category}</td>
      <td className={`py-3 px-4 text-right font-medium ${getTypeStyle(tx.type)}`}>
        {tx.type === 'spend' ? '-' : '+'}
        {tx.amount.toLocaleString()}
      </td>
    </tr>
  );
}

// 요약 통계 컴포넌트
function StatsSummary({ transactions }: { transactions: Transaction[] }) {
  const totalEarned = transactions
    .filter((t) => t.type === 'earn')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.type === 'spend')
    .reduce((sum, t) => sum + t.amount, 0);

  const pmpTotal = transactions
    .filter((t) => t.pointType === 'PMP' && t.type !== 'spend')
    .reduce((sum, t) => sum + t.amount, 0);

  const pmcTotal = transactions
    .filter((t) => t.pointType === 'PMC' && t.type !== 'spend')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-500">총 획득</div>
        <div className="text-xl font-bold text-green-600">+{totalEarned.toLocaleString()}</div>
      </div>
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-500">총 사용</div>
        <div className="text-xl font-bold text-red-600">-{totalSpent.toLocaleString()}</div>
      </div>
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-500">PMP 획득</div>
        <div className="text-xl font-bold text-purple-600">{pmpTotal.toLocaleString()}</div>
      </div>
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-500">PMC 획득</div>
        <div className="text-xl font-bold text-blue-600">{pmcTotal.toLocaleString()}</div>
      </div>
    </div>
  );
}

export default function AccountingTaxPage() {
  const [transactionFilter, setTransactionFilter] = useState<TransactionType>('all');
  const [pointFilter, setPointFilter] = useState<PointType>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const filteredTransactions = MOCK_TRANSACTIONS.filter((tx) => {
    if (transactionFilter !== 'all' && tx.type !== transactionFilter) return false;
    if (pointFilter !== 'all' && tx.pointType.toLowerCase() !== pointFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/other" className="text-white/80 hover:text-white">
              기타 서비스
            </Link>
            <span className="text-white/60">›</span>
            <span>Accounting & Tax</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">📊 Accounting & Tax</h1>
          <p className="text-slate-300">포인트 거래 내역 및 세무 관련 자료</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 요약 통계 */}
        <StatsSummary transactions={filteredTransactions} />

        {/* 필터 */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* 거래 유형 필터 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">거래 유형</label>
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value as TransactionType)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              >
                <option value="all">전체</option>
                <option value="earn">획득</option>
                <option value="spend">사용</option>
                <option value="transfer">전환</option>
              </select>
            </div>

            {/* 포인트 유형 필터 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">포인트 유형</label>
              <select
                value={pointFilter}
                onChange={(e) => setPointFilter(e.target.value as PointType)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              >
                <option value="all">전체</option>
                <option value="pmp">PMP</option>
                <option value="pmc">PMC</option>
              </select>
            </div>

            {/* 기간 필터 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">조회 기간</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'year')}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              >
                <option value="week">최근 1주</option>
                <option value="month">최근 1개월</option>
                <option value="year">최근 1년</option>
              </select>
            </div>
          </div>
        </div>

        {/* 거래 내역 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold">📋 거래 내역</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">날짜</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">유형</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">포인트</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">설명</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">카테고리</th>
                  <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">금액</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 다운로드 버튼 */}
        <div className="flex flex-wrap gap-3">
          <button className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors">
            📄 거래 명세서 다운로드 (PDF)
          </button>
          <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
            📊 Excel 내보내기
          </button>
          <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            🏛️ 세무 신고용 자료
          </button>
        </div>

        {/* 안내 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 안내사항</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 포인트 거래 내역은 실시간으로 반영됩니다.</li>
            <li>• PMC 수익에 대한 세무 신고는 연 소득이 일정 금액 이상일 경우 필요합니다.</li>
            <li>• 자세한 세무 상담은 세무사와 상담하시기 바랍니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
