'use client';

/**
 * Gift Aid Page
 * 기부금 세액공제 관련 서비스 (Cool Slate Tone-on-Tone 다크 테마)
 */

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DomainContextHeader } from '@/shared/ui/components/layout/DomainContextHeader';
import { FileText, Calculator, History, Download } from 'lucide-react';

interface DonationRecord {
  id: string;
  date: string;
  amount: number;
  recipient: string;
  status: 'confirmed' | 'pending';
  receiptIssued: boolean;
}

const MOCK_DONATIONS: DonationRecord[] = [
  {
    id: '1',
    date: '2025-01-15',
    amount: 50000,
    recipient: '초록우산 어린이재단',
    status: 'confirmed',
    receiptIssued: true,
  },
  {
    id: '2',
    date: '2025-01-10',
    amount: 30000,
    recipient: '대한적십자사',
    status: 'confirmed',
    receiptIssued: true,
  },
  {
    id: '3',
    date: '2025-01-05',
    amount: 20000,
    recipient: '유니세프',
    status: 'pending',
    receiptIssued: false,
  },
];

function DonationRow({ donation }: { donation: DonationRecord }) {
  return (
    <tr className="border-b border-slate-800/80 hover:bg-slate-800/40 transition-colors">
      <td className="py-3.5 px-4 text-sm text-slate-400">
        {new Date(donation.date).toLocaleDateString('ko-KR')}
      </td>
      <td className="py-3.5 px-4 text-sm font-medium text-white">
        {donation.recipient}
      </td>
      <td className="py-3.5 px-4 text-right text-sm font-bold text-slate-200">
        {donation.amount.toLocaleString()} PMC
      </td>
      <td className="py-3.5 px-4 text-center">
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            donation.status === 'confirmed'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          }`}
        >
          {donation.status === 'confirmed' ? '검증 완료' : '처리 중'}
        </span>
      </td>
      <td className="py-3.5 px-4 text-center">
        {donation.receiptIssued ? (
          <button className="text-sky-400 hover:text-sky-300 text-xs font-semibold inline-flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> 다운로드
          </button>
        ) : (
          <span className="text-slate-600 text-xs">-</span>
        )}
      </td>
    </tr>
  );
}

function TaxDeductionCalculator() {
  const [income, setIncome] = useState<number>(50000000);
  const [donation, setDonation] = useState<number>(100000);

  const calculateDeduction = () => {
    const baseLimit = income * 0.3;
    const effectiveDonation = Math.min(donation, baseLimit);
    const deduction = effectiveDonation * 0.15;
    return Math.round(deduction);
  };

  return (
    <div className="bg-slate-900/70 rounded-2xl p-6 border border-slate-800/90 space-y-4">
      <h3 className="font-bold text-base text-white flex items-center gap-2">
        <Calculator className="w-4 h-4 text-slate-300" />
        <span>세액공제 예상 계산기</span>
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">연 소득 (원)</label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">총 기부금액 (PMC / 원)</label>
          <input
            type="number"
            value={donation}
            onChange={(e) => setDonation(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
          />
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">예상 세액공제 환급액</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {calculateDeduction().toLocaleString()}원
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            * 소득의 30% 한도 내 15% 기본 세액공제율 기준 시뮬레이션입니다.
          </div>
        </div>
      </div>
    </div>
  );
}

function GiftAidContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams?.get('tab') || 'history';
  const [year, setYear] = useState<number>(2025);

  const totalDonation = MOCK_DONATIONS.filter(
    (d) => d.status === 'confirmed'
  ).reduce((sum, d) => sum + d.amount, 0);

  const tabs = [
    { key: 'history', label: '기부 내역', icon: History },
    { key: 'receipt', label: '영수증 발급', icon: FileText },
    { key: 'calculator', label: '세액공제 계산', icon: Calculator },
  ];

  const handleTabChange = (key: string) => {
    if (key === 'history') {
      router.push('/other/gift-aid');
    } else {
      router.push(`/other/gift-aid?tab=${key}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <DomainContextHeader
          domain="other"
          title="🎁 Gift Aid · 기부금 영수증 및 세액공제"
          subtitle="시민이 직접 집행한 PMC 기부 내역을 확인하고 연말정산 세액공제 영수증을 발급받으세요"
          metrics={[
            { label: '확정 기부 금액', value: totalDonation, unit: 'PMC' },
            {
              label: '영수증 발급 완료',
              value: MOCK_DONATIONS.filter((d) => d.receiptIssued).length,
              unit: '건',
            },
          ]}
        >
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
        </DomainContextHeader>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800/90 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">
                  📋 연도별 기부 내역 원장
                </h3>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value={2026}>2026년</option>
                  <option value={2025}>2025년</option>
                  <option value={2024}>2024년</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-950/60 border-b border-slate-800">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">
                        날짜
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400">
                        수혜 기관
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400">
                        집행 금액
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-400">
                        상태
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-400">
                        영수증
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_DONATIONS.map((donation) => (
                      <DonationRow key={donation.id} donation={donation} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-3 rounded-xl text-xs font-bold transition-colors">
                📄 연간 기부금 영수증 일괄 발급
              </button>
              <button className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold transition-colors">
                📊 국세청 연말정산 간소화 자료 다운로드
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <TaxDeductionCalculator />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GiftAidPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b12]" />}>
      <GiftAidContent />
    </Suspense>
  );
}
