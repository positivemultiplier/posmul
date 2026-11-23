"use client";

import React from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import type { RelatedNewsItem } from "../../infrastructure/adapters/naver-news.adapter";

interface RelatedNewsSectionProps {
  articles?: ReadonlyArray<RelatedNewsItem>;
}

function formatRelativeTimeKo(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return "";
  const diffMin = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}일 전`;
  return new Date(ts).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

/**
 * 상세페이지 관련 최신 뉴스 섹션 (네이버 뉴스 Open API · 30분 캐시 · 최근 기사 필터)
 */
export function RelatedNewsSection({ articles }: RelatedNewsSectionProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 p-5 sm:p-6 rounded-3xl bg-[#0d1321] border border-white/[0.09] shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.07]">
        <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-emerald-400" />
          <span>관련 최신 뉴스</span>
          <span className="text-xs font-bold text-slate-400">
            {articles.length}건
          </span>
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">
          최신 보도 자동 선별 · 네이버 뉴스
        </span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {articles.map((article, idx) => (
          <a
            key={`${article.url}-${idx}`}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block py-3 first:pt-0.5 last:pb-0.5 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-emerald-300 border border-emerald-500/25 font-bold">
                    {article.publisher}
                  </span>
                  <span className="text-slate-500 font-medium tabular-nums">
                    {formatRelativeTimeKo(article.pubDateIso)}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition line-clamp-1">
                  {article.title}
                </p>
                {article.description && (
                  <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                    {article.description}
                  </p>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0 mt-1 transition" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
