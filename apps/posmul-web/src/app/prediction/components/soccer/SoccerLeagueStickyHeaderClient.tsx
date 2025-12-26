"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ArrowLeft } from "lucide-react";

type LeagueId = "epl" | "laliga" | "bundesliga" | "seriea" | "kleague" | "champions";

type ContainerSize = "5xl" | "7xl";

type Props = {
  container?: ContainerSize;
};

const leagueIds: readonly LeagueId[] = [
  "epl",
  "laliga",
  "bundesliga",
  "seriea",
  "kleague",
  "champions",
] as const;

const leagues: ReadonlyArray<{
  id: LeagueId;
  href: string;
  label: string;
}> = [
  { id: "epl", href: "/prediction/sports/soccer/epl", label: "🇬🇧 EPL" },
  { id: "laliga", href: "/prediction/sports/soccer/laliga", label: "🇪🇸 라리가" },
  { id: "bundesliga", href: "/prediction/sports/soccer/bundesliga", label: "🇩🇪 분데스리가" },
  { id: "seriea", href: "/prediction/sports/soccer/seriea", label: "🇮🇹 세리에A" },
  { id: "kleague", href: "/prediction/sports/soccer/kleague", label: "🇰🇷 K-리그" },
  { id: "champions", href: "/prediction/sports/soccer/champions", label: "🇪🇺 챔피언스리그" },
];

const isLeagueId = (value: string): value is LeagueId => {
  return (leagueIds as readonly string[]).includes(value);
};

type SoccerRouteInfo = {
  isSoccer: boolean;
  league: LeagueId | null;
  isDetail: boolean;
};

const parseSoccerRoute = (pathname: string): SoccerRouteInfo => {
  const segments = pathname.split("/").filter(Boolean);
  const soccerIndex = segments.indexOf("soccer");

  if (soccerIndex === -1) {
    return { isSoccer: false, league: null, isDetail: false };
  }

  const leagueSegment = segments[soccerIndex + 1];
  if (!leagueSegment || !isLeagueId(leagueSegment)) {
    return { isSoccer: true, league: null, isDetail: false };
  }

  const maybeSlug = segments[soccerIndex + 2];
  return { isSoccer: true, league: leagueSegment, isDetail: Boolean(maybeSlug) };
};

const getBackHref = (pathname: string): string => {
  const info = parseSoccerRoute(pathname);

  if (!info.isSoccer) return "/prediction/sports";

  if (info.league && info.isDetail) {
    return `/prediction/sports/soccer/${info.league}`;
  }

  if (info.league) {
    return "/prediction/sports/soccer";
  }

  return "/prediction/sports";
};

export function SoccerLeagueStickyHeaderClient({ container = "7xl" }: Props) {
  const pathname = usePathname();

  const info = parseSoccerRoute(pathname);
  if (!info.isSoccer) return null;

  const containerClassName = container === "5xl" ? "max-w-5xl" : "max-w-7xl";

  return (
    <div className="sticky top-16 md:top-[152px] z-40 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
      <div className={`${containerClassName} mx-auto px-4 sm:px-6 lg:px-8 py-3`}>
        <div className="flex items-center gap-3">
          <Link
            href={getBackHref(pathname)}
            className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>뒤로가기</span>
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2 overflow-x-auto">
            <Link
              href="/prediction/sports/soccer"
              className={
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap " +
                (info.league === null
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50"
                  : "text-gray-300 hover:text-white hover:bg-white/5")
              }
            >
              전체
            </Link>

            {leagues.map((league) => (
              <Link
                key={league.id}
                href={league.href}
                className={
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap " +
                  (info.league === league.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50"
                    : "text-gray-300 hover:text-white hover:bg-white/5")
                }
              >
                {league.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
