"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "../../../../../../shared/ui/components/feedback/Toast";

interface Institute {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  registrationNumber: string | null;
  trustScore: number;
  isVerified: boolean;
}

interface DonationRecord {
  amount: number;
  createdAt: string;
  isAnonymous: boolean;
}

interface TransparencyReport {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalReceived: number;
  totalUsed: number;
  usageBreakdown: Record<string, number>;
  impactMetrics: Record<string, number>;
  reportUrl: string | null;
  publishedAt: string | null;
}

interface OpinionLeader {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  followerCount: number;
  isVerified: boolean;
  endorsementMessage: string;
  endorsedAt: string;
}

interface InstituteDetailClientProps {
  institute: Institute;
  stats: {
    totalDonations: number;
    totalAmount: number;
    donorCount: number;
  };
  recentDonations: DonationRecord[];
  transparencyReports: TransparencyReport[];
  opinionLeaders: OpinionLeader[];
  userPmcBalance: number;
  isLoggedIn: boolean;
}

type ActiveTab = "info" | "impact" | "transparency";

const TAB_DEFINITIONS: ReadonlyArray<{ id: ActiveTab; label: string; icon: string }> = [
  { id: "info", label: "기관 소개", icon: "ℹ️" },
  { id: "impact", label: "임팩트", icon: "📊" },
  { id: "transparency", label: "투명성", icon: "🔍" },
];

const PRESET_AMOUNTS: ReadonlyArray<number> = [1000, 5000, 10000, 50000, 100000];

// 시간 포맷팅
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR");
}

function DonationSuccessOverlay({
  instituteName,
  donationAmount,
}: {
  instituteName: string;
  donationAmount: number;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full mx-4 text-center animate-bounce-in">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">기부 완료!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {instituteName}에<br />
          <span className="text-2xl font-bold text-green-500">
            {donationAmount.toLocaleString()} PMC
          </span>
          를 기부했습니다.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          당신의 따뜻한 마음이 세상을 바꿉니다 ❤️
        </p>
      </div>
    </div>
  );
}

function HeroSection({
  institute,
  stats,
}: {
  institute: Institute;
  stats: InstituteDetailClientProps["stats"];
}) {
  const averageDonationAmount =
    stats.totalDonations > 0 ? Math.floor(stats.totalAmount / stats.totalDonations) : 0;

  return (
    <div className={`bg-gradient-to-r ${institute.categoryColor} text-white`}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <nav className="mb-6 text-white/80 text-sm">
          <Link href="/donation" className="hover:text-white">
            기부
          </Link>
          <span className="mx-2">›</span>
          <Link href="/donation/institute" className="hover:text-white">
            기관 기부
          </Link>
          <span className="mx-2">›</span>
          <span className="text-white">{institute.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{institute.categoryIcon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl lg:text-4xl font-bold">{institute.name}</h1>
                  {institute.isVerified && (
                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      인증기관
                    </span>
                  )}
                </div>
                <p className="text-white/80 mt-1">{institute.categoryLabel}</p>
              </div>
            </div>

            <p className="text-lg text-white/90 leading-relaxed max-w-2xl">{institute.description}</p>

            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-yellow-300 text-xl">⭐</span>
                <span className="text-2xl font-bold">{institute.trustScore.toFixed(1)}</span>
                <span className="text-white/60 text-sm">/ 10.0 신뢰도</span>
              </div>
              <div className="h-8 w-px bg-white/30" />
              <div className="text-white/80">
                <span className="font-bold text-xl">{stats.totalDonations.toLocaleString()}</span>
                <span className="text-sm ml-1">명이 함께했습니다</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 min-w-[280px]">
            <h3 className="text-sm font-medium text-white/80 mb-4">누적 기부 현황</h3>
            <div className="text-4xl font-bold mb-2">
              {stats.totalAmount.toLocaleString()}
              <span className="text-lg ml-1">PMC</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <div className="text-2xl font-bold">{stats.totalDonations}</div>
                <div className="text-xs text-white/60">총 기부 건수</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{averageDonationAmount.toLocaleString()}</div>
                <div className="text-xs text-white/60">평균 기부액</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpinionLeadersSection({ opinionLeaders }: { opinionLeaders: OpinionLeader[] }) {
  if (opinionLeaders.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            이 기관을 후원하는 오피니언 리더
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {opinionLeaders.length}명의 리더가 응원합니다
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opinionLeaders.map((leader) => (
            <div
              key={leader.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  {leader.avatarUrl ? (
                    <img
                      src={leader.avatarUrl}
                      alt={leader.displayName}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                      {leader.displayName.charAt(0)}
                    </div>
                  )}
                  {leader.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{leader.displayName}</h4>
                    {leader.isVerified && (
                      <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                        인증
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    팔로워 {leader.followerCount.toLocaleString()}명
                  </p>
                </div>
              </div>

              {leader.endorsementMessage && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    &ldquo;{leader.endorsementMessage}&rdquo;
                  </p>
                </div>
              )}

              {leader.bio && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{leader.bio}</p>
              )}

              <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                <span>📅</span>
                {new Date(leader.endorsedAt).toLocaleDateString("ko-KR")} 부터 후원
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InstituteInfoTab({ institute }: { institute: Institute }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">기관 소개</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{institute.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {institute.websiteUrl && (
          <a
            href={institute.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-2xl">🌐</span>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">웹사이트</div>
              <div className="text-gray-900 dark:text-white font-medium truncate">
                {institute.websiteUrl.replace(/^https?:\/\//, "")}
              </div>
            </div>
          </a>
        )}

        {institute.contactEmail && (
          <a
            href={`mailto:${institute.contactEmail}`}
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-2xl">✉️</span>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">이메일</div>
              <div className="text-gray-900 dark:text-white font-medium">{institute.contactEmail}</div>
            </div>
          </a>
        )}

        {institute.contactPhone && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-2xl">📞</span>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">전화</div>
              <div className="text-gray-900 dark:text-white font-medium">{institute.contactPhone}</div>
            </div>
          </div>
        )}

        {institute.registrationNumber && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-2xl">📋</span>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">등록번호</div>
              <div className="text-gray-900 dark:text-white font-medium">{institute.registrationNumber}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InstituteImpactTab({ stats }: { stats: InstituteDetailClientProps["stats"] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">기부 임팩트</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">👶</div>
          <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{Math.floor(stats.totalAmount / 10000)}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">아동 지원</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">🍚</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.floor(stats.totalAmount / 5000)}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">끼니 제공</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.floor(stats.totalAmount / 20000)}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">교육 지원</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">🏠</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{Math.floor(stats.totalAmount / 100000)}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">가정 지원</div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          * 임팩트 수치는 기부금 활용 예상치이며, 실제 사용 내역은 투명성 탭에서 확인하실 수 있습니다.
          기부금은 기관의 운영 방침에 따라 가장 필요한 곳에 사용됩니다.
        </p>
      </div>
    </div>
  );
}

function UsageBreakdownSection({ usageBreakdown }: { usageBreakdown: Record<string, number> }) {
  if (Object.keys(usageBreakdown).length === 0) return null;

  return (
    <div>
      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">사용 내역 비율</h5>
      <div className="space-y-2">
        {Object.entries(usageBreakdown).map(([category, percentage]) => (
          <div key={category}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">{category}</span>
              <span className="font-medium text-gray-900 dark:text-white">{percentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactMetricsSection({ impactMetrics }: { impactMetrics: Record<string, number> }) {
  if (Object.keys(impactMetrics).length === 0) return null;

  const beneficiaries = impactMetrics.beneficiaries;
  const projects = impactMetrics.projects;
  const successRate = impactMetrics.success_rate;

  return (
    <div>
      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">주요 성과 지표</h5>
      <div className="grid grid-cols-3 gap-3">
        {beneficiaries !== undefined && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{beneficiaries.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">수혜자</div>
          </div>
        )}
        {projects !== undefined && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">📋</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{projects}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">프로젝트</div>
          </div>
        )}
        {successRate !== undefined && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">✨</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{successRate}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">성공률</div>
          </div>
        )}
      </div>
    </div>
  );
}

function TransparencyReportCard({ report }: { report: TransparencyReport }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-xl">📊</span>
          기부금 사용 보고서
        </h4>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(report.periodStart).toLocaleDateString("ko-KR")} ~ {new Date(report.periodEnd).toLocaleDateString("ko-KR")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 수령액</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {report.totalReceived.toLocaleString()}
            <span className="text-sm font-normal ml-1">PMC</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 사용액</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {report.totalUsed.toLocaleString()}
            <span className="text-sm font-normal ml-1">PMC</span>
          </div>
        </div>
      </div>

      <UsageBreakdownSection usageBreakdown={report.usageBreakdown} />
      <ImpactMetricsSection impactMetrics={report.impactMetrics} />

      {report.reportUrl && (
        <a
          href={report.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        >
          <span>📄</span>
          상세 보고서 보기
          <span>→</span>
        </a>
      )}

      {report.publishedAt && (
        <div className="text-xs text-gray-400 text-right">
          발행일: {new Date(report.publishedAt).toLocaleDateString("ko-KR")}
        </div>
      )}
    </div>
  );
}

function TransparencyReportsList({ reports }: { reports: TransparencyReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <span className="text-4xl block mb-3">📋</span>
        <p className="text-gray-600 dark:text-gray-400">
          아직 등록된 투명성 보고서가 없습니다.<br />
          <span className="text-sm text-gray-500">보고서가 등록되면 여기에 표시됩니다.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reports.map((report) => (
        <TransparencyReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

function TrustScoreDetails({ trustScore }: { trustScore: number }) {
  const items: ReadonlyArray<{ label: string; score: number }> = [
    { label: "재무 투명성", score: Math.min(10, trustScore * 1.05) },
    { label: "사업 효율성", score: Math.min(10, trustScore * 0.95) },
    { label: "거버넌스", score: Math.min(10, trustScore * 1.02) },
    { label: "커뮤니케이션", score: Math.min(10, trustScore * 0.92) },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
      <h4 className="font-medium text-gray-900 dark:text-white mb-3">신뢰도 점수 상세</h4>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className="font-medium text-gray-900 dark:text-white">{item.score.toFixed(1)}</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                style={{ width: `${item.score * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstituteTransparencyTab({
  institute,
  transparencyReports,
}: {
  institute: Institute;
  transparencyReports: TransparencyReport[];
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">투명성 보고</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <span className="font-medium text-gray-900 dark:text-white">기관 인증 완료</span>
          </div>
          <span className="text-green-600 dark:text-green-400 text-sm">
            {institute.isVerified ? "인증됨" : "검토중"}
          </span>
        </div>
      </div>

      <TransparencyReportsList reports={transparencyReports} />
      <TrustScoreDetails trustScore={institute.trustScore} />
    </div>
  );
}

function TabNavigation({
  activeTab,
  onChange,
}: {
  activeTab: ActiveTab;
  onChange: (next: ActiveTab) => void;
}) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {TAB_DEFINITIONS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${activeTab === tab.id
              ? "text-green-600 dark:text-green-400 border-b-2 border-green-500 bg-green-50 dark:bg-green-900/20"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TabsCard({
  activeTab,
  onChange,
  institute,
  stats,
  transparencyReports,
}: {
  activeTab: ActiveTab;
  onChange: (next: ActiveTab) => void;
  institute: Institute;
  stats: InstituteDetailClientProps["stats"];
  transparencyReports: TransparencyReport[];
}) {
  let content: ReactNode = null;

  switch (activeTab) {
    case "info":
      content = <InstituteInfoTab institute={institute} />;
      break;
    case "impact":
      content = <InstituteImpactTab stats={stats} />;
      break;
    case "transparency":
      content = <InstituteTransparencyTab institute={institute} transparencyReports={transparencyReports} />;
      break;
    default:
      content = null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <TabNavigation activeTab={activeTab} onChange={onChange} />
      <div className="p-6">{content}</div>
    </div>
  );
}

function RecentDonationsCard({ recentDonations }: { recentDonations: DonationRecord[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        최근 기부 현황
      </h3>

      {recentDonations.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <span className="text-4xl block mb-2">💝</span>
          아직 기부 내역이 없습니다.<br />
          첫 번째 기부자가 되어주세요!
        </div>
      ) : (
        <div className="space-y-3">
          {recentDonations.map((donation, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  {donation.isAnonymous ? "?" : "♥"}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {donation.isAnonymous ? "익명의 기부자" : "따뜻한 기부자"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(donation.createdAt)}</div>
                </div>
              </div>
              <div className="text-green-600 dark:text-green-400 font-bold">{donation.amount.toLocaleString()} PMC</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DonationHeader({ institute }: { institute: Institute }) {
  return (
    <div className={`bg-gradient-to-r ${institute.categoryColor} p-4 text-white text-center`}>
      <h3 className="text-lg font-bold">지금 기부하기</h3>
      <p className="text-sm text-white/80">작은 나눔이 큰 변화를 만듭니다</p>
    </div>
  );
}

function PmcBalanceCard({ isLoggedIn, userPmcBalance }: { isLoggedIn: boolean; userPmcBalance: number }) {
  if (!isLoggedIn) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
      <div className="text-sm text-gray-500 dark:text-gray-400">내 PMC 잔액</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {userPmcBalance.toLocaleString()} <span className="text-sm font-normal">PMC</span>
      </div>
    </div>
  );
}

function PresetAmountButtons({
  institute,
  donationAmount,
  userPmcBalance,
  isLoggedIn,
  onSelectAmount,
}: {
  institute: Institute;
  donationAmount: number;
  userPmcBalance: number;
  isLoggedIn: boolean;
  onSelectAmount: (amount: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      {PRESET_AMOUNTS.map((amount) => (
        <button
          key={amount}
          onClick={() => onSelectAmount(amount)}
          className={`py-2 rounded-lg text-sm font-medium transition-all ${donationAmount === amount
              ? `bg-gradient-to-r ${institute.categoryColor} text-white shadow-md`
              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
        >
          {amount >= 10000 ? `${(amount / 10000).toFixed(0)}만` : amount.toLocaleString()}
        </button>
      ))}
      <button
        onClick={() => onSelectAmount(userPmcBalance)}
        disabled={!isLoggedIn || userPmcBalance === 0}
        className="py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
      >
        전액
      </button>
    </div>
  );
}

function DonateButton({
  institute,
  donationAmount,
  isLoggedIn,
  isDonating,
  isInsufficientBalance,
  onDonate,
}: {
  institute: Institute;
  donationAmount: number;
  isLoggedIn: boolean;
  isDonating: boolean;
  isInsufficientBalance: boolean;
  onDonate: () => void;
}) {
  const isBelowMinimum = donationAmount < 100;
  const isDisabled = isDonating || (isLoggedIn && isInsufficientBalance) || isBelowMinimum;

  let content: ReactNode;
  if (!isLoggedIn) {
    content = "로그인하고 기부하기";
  } else if (isDonating) {
    content = (
      <span className="flex items-center justify-center gap-2">
        <span className="animate-spin">⏳</span>
        처리 중...
      </span>
    );
  } else {
    content = `${donationAmount.toLocaleString()} PMC 기부하기`;
  }

  return (
    <button
      onClick={onDonate}
      disabled={isDisabled}
      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isDisabled
          ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
          : `bg-gradient-to-r ${institute.categoryColor} text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`
        }`}
    >
      {content}
    </button>
  );
}

function DonationSidebar({
  institute,
  isLoggedIn,
  userPmcBalance,
  donationAmount,
  isAnonymous,
  message,
  isDonating,
  onDonationAmountChange,
  onMessageChange,
  onAnonymousChange,
  onDonate,
}: {
  institute: Institute;
  isLoggedIn: boolean;
  userPmcBalance: number;
  donationAmount: number;
  isAnonymous: boolean;
  message: string;
  isDonating: boolean;
  onDonationAmountChange: (next: number) => void;
  onMessageChange: (next: string) => void;
  onAnonymousChange: (next: boolean) => void;
  onDonate: () => void;
}) {
  const isInsufficientBalance = donationAmount > userPmcBalance;

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <DonationHeader institute={institute} />

          <div className="p-6 space-y-6">
            <PmcBalanceCard isLoggedIn={isLoggedIn} userPmcBalance={userPmcBalance} />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">기부 금액</label>
              <PresetAmountButtons
                institute={institute}
                donationAmount={donationAmount}
                userPmcBalance={userPmcBalance}
                isLoggedIn={isLoggedIn}
                onSelectAmount={onDonationAmountChange}
              />
              <div className="relative">
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => onDonationAmountChange(Number(e.target.value))}
                  min={100}
                  max={userPmcBalance || undefined}
                  className="w-full px-4 py-3 pr-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                  PMC
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                응원 메시지 (선택)
              </label>
              <textarea
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="따뜻한 응원의 메시지를 남겨주세요"
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => onAnonymousChange(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
              />
              <span className="text-gray-700 dark:text-gray-300">익명으로 기부하기</span>
            </label>

            <DonateButton
              institute={institute}
              donationAmount={donationAmount}
              isLoggedIn={isLoggedIn}
              isDonating={isDonating}
              isInsufficientBalance={isInsufficientBalance}
              onDonate={onDonate}
            />

            {isLoggedIn && isInsufficientBalance && (
              <p className="text-red-500 text-sm text-center">PMC 잔액이 부족합니다</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4">함께 나눠요</h4>
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-[#FEE500] text-[#3C1E1E] rounded-lg font-medium text-sm hover:opacity-90">
              카카오톡
            </button>
            <button className="flex-1 py-2 bg-[#1877F2] text-white rounded-lg font-medium text-sm hover:opacity-90">
              페이스북
            </button>
            <button className="flex-1 py-2 bg-gray-800 text-white rounded-lg font-medium text-sm hover:opacity-90">
              링크복사
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainContent({
  institute,
  stats,
  recentDonations,
  transparencyReports,
  activeTab,
  onTabChange,
  opinionLeaders,
  isLoggedIn,
  userPmcBalance,
  donationAmount,
  isAnonymous,
  message,
  isDonating,
  onDonationAmountChange,
  onAnonymousChange,
  onMessageChange,
  onDonate,
}: {
  institute: Institute;
  stats: InstituteDetailClientProps["stats"];
  recentDonations: DonationRecord[];
  transparencyReports: TransparencyReport[];
  activeTab: ActiveTab;
  onTabChange: (next: ActiveTab) => void;
  opinionLeaders: OpinionLeader[];
  isLoggedIn: boolean;
  userPmcBalance: number;
  donationAmount: number;
  isAnonymous: boolean;
  message: string;
  isDonating: boolean;
  onDonationAmountChange: (next: number) => void;
  onAnonymousChange: (next: boolean) => void;
  onMessageChange: (next: string) => void;
  onDonate: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HeroSection institute={institute} stats={stats} />
      <OpinionLeadersSection opinionLeaders={opinionLeaders} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <TabsCard
              activeTab={activeTab}
              onChange={onTabChange}
              institute={institute}
              stats={stats}
              transparencyReports={transparencyReports}
            />

            <RecentDonationsCard recentDonations={recentDonations} />
          </div>

          <DonationSidebar
            institute={institute}
            isLoggedIn={isLoggedIn}
            userPmcBalance={userPmcBalance}
            donationAmount={donationAmount}
            isAnonymous={isAnonymous}
            message={message}
            isDonating={isDonating}
            onDonationAmountChange={onDonationAmountChange}
            onMessageChange={onMessageChange}
            onAnonymousChange={onAnonymousChange}
            onDonate={onDonate}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <Link
          href="/donation/institute"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← 기관 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export function InstituteDetailClient({
  institute,
  stats,
  recentDonations,
  transparencyReports,
  opinionLeaders,
  userPmcBalance,
  isLoggedIn,
}: InstituteDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [donationAmount, setDonationAmount] = useState<number>(10000);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [isDonating, setIsDonating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("info");

  // 기부 처리
  const handleDonate = async () => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    if (donationAmount > userPmcBalance) {
      toast.error("잔액 부족", "PMC 잔액이 부족합니다.");
      return;
    }

    if (donationAmount < 100) {
      toast.warning("최소 금액", "최소 기부 금액은 100 PMC입니다.");
      return;
    }

    setIsDonating(true);

    try {
      const response = await fetch("/api/donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instituteId: institute.id,
          amount: donationAmount,
          isAnonymous,
          message,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          "기부 완료! 💝",
          `${institute.name}에 ${donationAmount.toLocaleString()} PMC를 기부했습니다.`
        );
        setShowSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error("기부 실패", result.error?.message || "기부 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      void error;
      toast.error("네트워크 오류", "네트워크 오류가 발생했습니다.");
    } finally {
      setIsDonating(false);
    }
  };

  // 성공 모달
  if (showSuccess) {
    return <DonationSuccessOverlay instituteName={institute.name} donationAmount={donationAmount} />;
  }

  return (
    <MainContent
      institute={institute}
      stats={stats}
      recentDonations={recentDonations}
      transparencyReports={transparencyReports}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      opinionLeaders={opinionLeaders}
      isLoggedIn={isLoggedIn}
      userPmcBalance={userPmcBalance}
      donationAmount={donationAmount}
      isAnonymous={isAnonymous}
      message={message}
      isDonating={isDonating}
      onDonationAmountChange={setDonationAmount}
      onAnonymousChange={setIsAnonymous}
      onMessageChange={setMessage}
      onDonate={handleDonate}
    />
  );
}
