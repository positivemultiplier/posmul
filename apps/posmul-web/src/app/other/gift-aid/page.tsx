'use client';

/**
 * Gift Aid Page
 * 기부금 세액공제 관련 서비스
 */

import { useState } from 'react';
import Link from 'next/link';

interface DonationRecord {
  id: string;
  date: string;
  amount: number;
  recipient: string;
  status: 'confirmed' | 'pending';
  receiptIssued: boolean;
}

// 목데이터 (실제로는 API에서 가져옴)
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

// 기부금 영수증 행
function DonationRow({ donation }: { donation: DonationRecord }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4">{new Date(donation.date).toLocaleDateString('ko-KR')}</td>
      <td className="py-3 px-4">{donation.recipient}</td>
      <td className="py-3 px-4 text-right font-medium">
        {donation.amount.toLocaleString()}원
      </td>
      <td className="py-3 px-4 text-center">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            donation.status === 'confirmed'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {donation.status === 'confirmed' ? '확인됨' : '처리중'}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        {donation.receiptIssued ? (
          <button className="text-blue-600 hover:underline text-sm">📄 다운로드</button>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )}
      </td>
    </tr>
  );
}

// 세액공제 계산기
function TaxDeductionCalculator() {
  const [income, setIncome] = useState<number>(50000000);
  const [donation, setDonation] = useState<number>(100000);

  // 간략한 세액공제 계산 (실제로는 더 복잡함)
  const calculateDeduction = () => {
    const baseLimit = income * 0.3; // 소득의 30%까지 공제
    const effectiveDonation = Math.min(donation, baseLimit);
    const deduction = effectiveDonation * 0.15; // 15% 세액공제
    return Math.round(deduction);
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="font-bold text-lg mb-4">💰 세액공제 예상 계산기</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">연 소득 (원)</label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-600 mb-1">총 기부금액 (원)</label>
          <input
            type="number"
            value={donation}
            onChange={(e) => setDonation(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        
        <div className="bg-blue-50 rounded p-4">
          <div className="text-sm text-gray-600">예상 세액공제 금액</div>
          <div className="text-2xl font-bold text-blue-600">
            {calculateDeduction().toLocaleString()}원
          </div>
          <div className="text-xs text-gray-500 mt-1">
            * 실제 공제 금액은 다를 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GiftAidPage() {
  const [year, setYear] = useState<number>(2025);
  
  const totalDonation = MOCK_DONATIONS
    .filter((d) => d.status === 'confirmed')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/other" className="text-white/80 hover:text-white">
              기타 서비스
            </Link>
            <span className="text-white/60">›</span>
            <span>Gift Aid</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">🎁 Gift Aid</h1>
          <p className="text-emerald-100">기부금 영수증 발급 및 세액공제 서비스</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 왼쪽: 기부 내역 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 요약 카드 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500">총 기부 횟수</div>
                <div className="text-2xl font-bold text-gray-900">
                  {MOCK_DONATIONS.length}회
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500">총 기부 금액</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {totalDonation.toLocaleString()}원
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500">영수증 발급</div>
                <div className="text-2xl font-bold text-blue-600">
                  {MOCK_DONATIONS.filter((d) => d.receiptIssued).length}건
                </div>
              </div>
            </div>

            {/* 기부 내역 테이블 */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold">📋 기부 내역</h3>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={2025}>2025년</option>
                  <option value={2024}>2024년</option>
                  <option value={2023}>2023년</option>
                </select>
              </div>
              
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">날짜</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">수혜 기관</th>
                    <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">금액</th>
                    <th className="text-center py-2 px-4 text-sm font-medium text-gray-600">상태</th>
                    <th className="text-center py-2 px-4 text-sm font-medium text-gray-600">영수증</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_DONATIONS.map((donation) => (
                    <DonationRow key={donation.id} donation={donation} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* 일괄 다운로드 버튼 */}
            <div className="flex gap-3">
              <button className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                📄 연간 기부금 영수증 발급
              </button>
              <button className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors">
                📊 연말정산 자료 다운로드
              </button>
            </div>
          </div>

          {/* 오른쪽: 세액공제 계산기 */}
          <div className="space-y-6">
            <TaxDeductionCalculator />
            
            {/* 안내 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">📌 안내사항</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 기부금 영수증은 기부 확인 후 발급됩니다.</li>
                <li>• 연말정산 자료는 매년 1월에 국세청에 제출됩니다.</li>
                <li>• 세액공제 한도는 소득에 따라 달라집니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
