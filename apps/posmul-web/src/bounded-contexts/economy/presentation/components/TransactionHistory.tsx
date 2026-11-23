"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  type: string;
  pmpAmount: number | null;
  pmcAmount: number | null;
  description: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

interface TransactionHistoryProps {
  userId: string;
}

// 거래 타입별 아이콘 및 색상 매핑
const transactionConfig: Record<string, { icon: string; label: string; colorClass: string }> = {
  PREDICTION_STAKE: { icon: "", label: "예측 참여", colorClass: "text-yellow-500" },
  PREDICTION_WIN: { icon: "", label: "예측 성공", colorClass: "text-green-500" },
  PREDICTION_REFUND: { icon: "↩️", label: "예측 환불", colorClass: "text-blue-500" },
  PREDICTION_LOSS: { icon: "", label: "예측 실패", colorClass: "text-red-500" },
  GRANT: { icon: "", label: "지급", colorClass: "text-green-500" },
  DONATION: { icon: "", label: "기부", colorClass: "text-pink-500" },
  MONEY_WAVE: { icon: "", label: "MoneyWave", colorClass: "text-cyan-500" },
  TRANSFER: { icon: "", label: "전송", colorClass: "text-purple-500" },
};

function getTransactionDisplay(type: string) {
  return transactionConfig[type] || { icon: "", label: type, colorClass: "text-gray-500" };
}

export default function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pmp" | "pmc">("all");

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  async function fetchTransactions() {
    try {
      setLoading(true);
      const response = await fetch("/api/economy/transactions");
      const result = await response.json();

      if (result.success) {
        setTransactions(result.data.transactions);
      } else {
        setError(result.error?.message || "거래 내역 조회 실패");
      }
    } catch (err) {
      void err;
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 필터링된 거래 목록
  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "pmp") return tx.pmpAmount !== null && tx.pmpAmount !== 0;
    if (filter === "pmc") return tx.pmcAmount !== null && tx.pmcAmount !== 0;
    return true;
  });

  // 통계 계산
  const stats = {
    totalPmpGained: transactions
      .filter((tx) => (tx.pmpAmount || 0) > 0)
      .reduce((sum, tx) => sum + (tx.pmpAmount || 0), 0),
    totalPmcGained: transactions
      .filter((tx) => (tx.pmcAmount || 0) > 0)
      .reduce((sum, tx) => sum + (tx.pmcAmount || 0), 0),
    predictionWins: transactions.filter((tx) => tx.type === "PREDICTION_WIN").length,
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="text-red-500 text-center py-8">
          <span className="text-3xl block mb-2"></span>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          거래 내역
        </h3>
        <button
          onClick={() => fetchTransactions()}
          className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* Stats Summary */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">총 PMP 획득</div>
            <div className="text-lg font-bold text-yellow-500">
              +{stats.totalPmpGained.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">총 PMC 획득</div>
            <div className="text-lg font-bold text-green-500">
              +{stats.totalPmcGained.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">예측 성공</div>
            <div className="text-lg font-bold text-blue-500">
              {stats.predictionWins}회
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "pmp", "pmc"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {f === "all" ? "전체" : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <span className="text-4xl block mb-3"></span>
          거래 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {filteredTransactions.map((tx) => {
            const config = getTransactionDisplay(tx.type);
            const isPositivePmp = (tx.pmpAmount || 0) > 0;
            const isPositivePmc = (tx.pmcAmount || 0) > 0;

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <div className={`font-medium ${config.colorClass}`}>
                      {config.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tx.description}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(tx.timestamp).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {tx.pmpAmount !== null && tx.pmpAmount !== 0 && (
                    <div className={`font-bold ${isPositivePmp ? "text-green-500" : "text-red-500"}`}>
                      {isPositivePmp ? "+" : ""}{tx.pmpAmount.toLocaleString()} PMP
                    </div>
                  )}
                  {tx.pmcAmount !== null && tx.pmcAmount !== 0 && (
                    <div className={`font-bold ${isPositivePmc ? "text-green-500" : "text-red-500"}`}>
                      {isPositivePmc ? "+" : ""}{Number(tx.pmcAmount).toLocaleString()} PMC
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
