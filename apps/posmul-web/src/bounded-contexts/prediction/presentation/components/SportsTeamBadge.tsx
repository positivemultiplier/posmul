"use client";

import React, { useId } from "react";
import type {
  ResolvedTeamBadge,
  SportsMatchupBadges,
} from "../../domain/value-objects/sports-team-palettes";

interface TeamShieldSvgProps {
  team: ResolvedTeamBadge;
  size: number;
  className?: string;
}

/**
 * 저작권·상표권 안전 기하학 방패 SVG 배지 (팀 고유 2색 + 패턴 + 약어 티커)
 */
export function TeamShieldSvg({ team, size, className = "" }: TeamShieldSvgProps) {
  const uid = useId().replace(/:/g, "");
  const clipId = `shield-clip-${uid}`;
  const fontSize = team.code.length >= 4 ? 10 : team.code.length === 3 ? 11.5 : 13.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`shrink-0 drop-shadow-sm ${className}`}
      role="img"
      aria-label={`${team.displayName} 팀 컬러 배지`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M20 2.5 L34.5 7.2 V19.6 C34.5 28.4 28.4 34.8 20 37.8 C11.6 34.8 5.5 28.4 5.5 19.6 V7.2 Z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* 베이스 팀 컬러 */}
        <rect x="0" y="0" width="40" height="40" fill={team.primaryHex} />

        {/* 패턴별 보조 팀 컬러 */}
        {team.pattern === "stripe" && (
          <>
            <rect x="10" y="0" width="5.5" height="40" fill={team.secondaryHex} fillOpacity="0.9" />
            <rect x="24.5" y="0" width="5.5" height="40" fill={team.secondaryHex} fillOpacity="0.9" />
          </>
        )}
        {team.pattern === "split" && (
          <rect x="20" y="0" width="20" height="40" fill={team.secondaryHex} fillOpacity="0.88" />
        )}
        {team.pattern === "sash" && (
          <polygon points="0,30 30,0 40,0 40,10 10,40 0,40" fill={team.secondaryHex} fillOpacity="0.88" />
        )}

        {/* 상단 글래스 하이라이트 */}
        <path
          d="M5.5 7.2 L20 2.5 L34.5 7.2 V15 C25 12 15 12 5.5 15 Z"
          fill="#FFFFFF"
          fillOpacity="0.14"
        />

        {/* 중앙 티커 가독성 백플레이트 */}
        <rect
          x="6.5"
          y="14"
          width="27"
          height="13.5"
          rx="4"
          fill="#090B12"
          fillOpacity="0.58"
        />
      </g>

      {/* 방패 외곽 테두리 */}
      <path
        d="M20 2.5 L34.5 7.2 V19.6 C34.5 28.4 28.4 34.8 20 37.8 C11.6 34.8 5.5 28.4 5.5 19.6 V7.2 Z"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
      />

      {/* 팀 약어(티커) */}
      <text
        x="20"
        y="24.2"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={fontSize}
        fontWeight="900"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        letterSpacing="-0.4"
      >
        {team.code}
      </text>
    </svg>
  );
}

interface SportsMatchupBadgeClusterProps {
  matchup: SportsMatchupBadges;
  variant?: "card" | "detail";
}

/**
 * 카드(40px) 및 상세페이지 헤더(56px) 공용 스포츠 팀 배지 클러스터
 */
export function SportsMatchupBadgeCluster({
  matchup,
  variant = "card",
}: SportsMatchupBadgeClusterProps) {
  if (matchup.mode === "matchup" && matchup.away) {
    if (variant === "detail") {
      return (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-slate-950/75 border border-white/10 shrink-0 shadow-lg"
          title={`${matchup.home.displayName} vs ${matchup.away.displayName}`}
        >
          <TeamShieldSvg team={matchup.home} size={42} />
          <span className="text-[10px] font-black text-slate-400 tracking-wider px-0.5">
            VS
          </span>
          <TeamShieldSvg team={matchup.away} size={42} />
        </div>
      );
    }

    return (
      <div
        className="relative flex items-center shrink-0 w-[52px] h-10"
        title={`${matchup.home.displayName} vs ${matchup.away.displayName}`}
      >
        <TeamShieldSvg team={matchup.home} size={32} className="z-10" />
        <TeamShieldSvg
          team={matchup.away}
          size={32}
          className="-ml-3 z-0 opacity-95"
        />
      </div>
    );
  }

  const size = variant === "detail" ? 56 : 40;
  return (
    <div
      className="flex items-center justify-center shrink-0"
      title={matchup.home.displayName}
    >
      <TeamShieldSvg team={matchup.home} size={size} />
    </div>
  );
}
