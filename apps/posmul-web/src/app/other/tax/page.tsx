'use client';

/**
 * Accounting & Tax Page
 * 회계 및 세무 관련 서비스 (Cool Slate Tone-on-Tone 다크 테마)
 */

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DomainContextHeader } from '@/shared/ui/components/layout/DomainContextHeader';
import { FileSpreadsheet, FileText, ListFilter } from 'lucide-react';

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

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: '2025-01-20',
    type: 'earn',
    pointType: 'PMP',
    amount: 500,
    description: 'Forum 공론장 숙의 보상',
    category: 'Forum',
  },
  {
    id: '2',
    date: '2025-01-19',
    type: 'earn',
    pointType: 'PMC',
    amount: 1200,
    description: '예측 마켓 적중 MoneyWave 보상',
    category: 'Prediction',
  },
  {
    id: '3',
    date: '2025-01-18',
    type: 'spend',
    pointType: 'PMC',
    amount: 5000,
    description: '공익 기관 직접 예산 집행(기부)',
    category: 'Donation',
  },
  {
    id: '4',
    date: '2025-01-17',
    type: 'earn',
    pointType: 'PMC',
    amount: 800,
    description: 'Minor League 지역 상생 소비 적립',
    category: 'Consume',
  },
  {
    id: '5',
    date: '2025-01-16',
    type: 'transfer',
    pointType: 'PMC',
    amount: 2000,
    description: 'Cloud Funding 임팩트 펀딩 리워드',
    category: 'Consume',
  },
];

function TransactionRow({ tx }: { tx: Transaction }) {
  const getTypeStyle = (type: Transaction['type']) => {
    switch (type) {
      case 'earn':
        return 'text-emerald-400';
      case 'spend':
        return 'text-rose-400';
      case 'transfer':
        return 'text-sky-400';
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'earn':
        return '획득';
      case 'spend':
        return '집행';
      case 'transfer':
        return '전환';
    }
  };

  return (
    <tr className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
      <td className="py-3.5 px-4 text-xs text-slate-400">
        {new Date(tx.date).toLocaleDateString('ko-KR')}
      </td>
      <td className="py-3.5 px-4">
        <span className={`text-xs font-semibold ${getTypeStyle(tx.type)}`}>
          {getTypeLabel(tx.type)}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
            tx.pointType === 'PMP'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
          }`}
        >
          {tx.pointType}
        </span>
      </td>
      <td className="py-3.5 px-4 text-sm text-white font-medium">
        {tx.description}
      </td>
      <td className="py-3.5 px-4 text-xs text-slate-400">{tx.category}</td>
      <td className={`py-3.5 px-4 text-right text-sm font-bold ${getTypeStyle(tx.type)}`}>
        {tx.type === 'spend' ? '-' : '+'}
        {tx.amount.toLocaleString()}
      </td>
    </tr>
  );
}

function AccountingTaxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams?.get('tab') || 'transactions';

  const [transactionFilter, setTransactionFilter] = useState<TransactionType>('all');
  const [pointFilter, setPointFilter] = useState<PointType>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const filteredTransactions = MOCK_TRANSACTIONS.filter((tx) => {
    if (transactionFilter !== 'all' && tx.type !== transactionFilter) return false;
    if (pointFilter !== 'all' && tx.pointType.toLowerCase() !== pointFilter) return false;
    return true;
  });

  const totalEarned = filteredTransactions
    .filter((t) => t.type === 'earn')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = filteredTransactions
    .filter((t) => t.type === 'spend')
    .reduce((sum, t) => sum + t.amount, 0);

  const tabs = [
    { key: 'transactions', label: '거래 내역', icon: ListFilter },
    { key: 'statement', label: '수익 명세서', icon: FileText },
    { key: 'tax-docs', label: '세무 자료', icon: FileSpreadsheet },
  ];

  const handleTabChange = (key: string) => {
    if (key === 'transactions') {
      router.push('/other/tax');
    } else {
      router.push(`/other/tax?tab=${key}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <DomainContextHeader
          domain="other"
          title="📊 Accounting & Tax · 투명 회계 및 세무 자료"
          subtitle="PMP·PMC 자산 획득 및 직접 집행 내역을 투명하게 조회하고 세무 자료를 다운로드하세요"
          metrics={[
            { label: '총 획득 자산', value: `+${totalEarned.toLocaleString()}`, unit: 'P' },
            { label: '총 집행 자산', value: `-${totalSpent.toLocaleString()}`, unit: 'PMC' },
          ]}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => handleTabChange(t.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      activeTab === t.key
                        ? 'bg-slate-500/25 text-slate-100 border-slate-400/40'
                        : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value as TransactionType)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="all">전체 유형</option>
                <option value="earn">획득</option>
                <option value="spend">집행</option>
                <option value="transfer">전환</option>
              </select>

              <select
                value={pointFilter}
                onChange={(e) => setPointFilter(e.target.value as PointType)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="all">전체 자산 (PMP+PMC)</option>
                <option value="pmp">PMP (무위험)</option>
                <option value="pmc">PMC (사회가치)</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'year')}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="week">최근 1주</option>
                <option value="month">최근 1개월</option>
                <option value="year">최근 1년</option>
              </select>
            </div>
          </div>
        </DomainContextHeader>

        <div className="bg-slate-900/70 rounded-2xl border border-slate-800/90 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white">📋 시민 경제 활동 원장</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">날짜</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">구분</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">자산</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">내역 설명</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">도메인</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400">수량</th>
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

        <div className="grid sm:grid-cols-3 gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-3 rounded-xl text-xs font-bold transition-colors">
            📄 거래 명세서 다운로드 (PDF)
          </button>
          <button className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 py-3 rounded-xl text-xs font-bold transition-colors">
            📊 원장 데이터 내보내기 (Excel)
          </button>
          <button className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 py-3 rounded-xl text-xs font-bold transition-colors">
            🏛️ 세무 신고용 증빙 패키지 발급
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountingTaxPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <AccountingTaxContent />
    </Suspense>
  );
}
