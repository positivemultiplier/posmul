"use client";

import { useId } from "react";

export type StudyConeFamily =
  | "CLASSIC_FLAME"
  | "FIRE_OWL"
  | "BLUE_DRAGON"
  | "LUCKY_CAT"
  | "GOLD_LION";

export interface StudyConeFamilySpec {
  id: StudyConeFamily;
  name: string;
  shortName: string;
  tagline: string;
  primary: string;
  secondary: string;
  glow: string;
}

export const STUDY_CONE_FAMILIES: StudyConeFamilySpec[] = [
  {
    id: "CLASSIC_FLAME",
    name: "미니멀 열공 불꽃",
    shortName: "열공 불꽃",
    tagline: "시간이 쌓일수록 성좌 왕관으로 타오르는 기본 스터디콘",
    primary: "#D97757",
    secondary: "#F2B880",
    glow: "rgba(217, 119, 87, 0.35)",
  },
  {
    id: "FIRE_OWL",
    name: "심야 독서실 부엉이",
    shortName: "부엉이",
    tagline: "밤낮없이 기출을 파고드는 집중의 수호자",
    primary: "#C48A5A",
    secondary: "#E7C294",
    glow: "rgba(196, 138, 90, 0.35)",
  },
  {
    id: "BLUE_DRAGON",
    name: "합격 기원 청룡",
    shortName: "청룡",
    tagline: "매 시간 비늘과 뿔이 깨어나는 합격 영물",
    primary: "#5B8EC9",
    secondary: "#9CC2EC",
    glow: "rgba(91, 142, 201, 0.35)",
  },
  {
    id: "LUCKY_CAT",
    name: "선지 감별 마네키네코",
    shortName: "복냥이",
    tagline: "오답 함정을 피하고 정답만 골라내는 행운의 고양이",
    primary: "#5C9A7A",
    secondary: "#9AD0B3",
    glow: "rgba(92, 154, 122, 0.35)",
  },
  {
    id: "GOLD_LION",
    name: "수석 돌파 황금 사자",
    shortName: "황금 사자",
    tagline: "갈기와 왕관이 매 시간 웅장해지는 백수의 왕",
    primary: "#C9A14A",
    secondary: "#EED68A",
    glow: "rgba(201, 161, 74, 0.35)",
  },
];

export interface StudyConeStageMeta {
  stage: number; // 0 ~ 10 (1시간마다 진화)
  hourLabel: string;
  title: string;
  progressPct: number; // 다음 1시간 진화까지 진행률 (0~100)
  remainingMinutes: number;
}

const STAGE_TITLES: readonly string[] = [
  "씨앗 대기", // 0h
  "불씨 점화", // 1h
  "집중 점등", // 2h
  "몰입 가속", // 3h
  "목표 돌파", // 4h
  "절반 돌파", // 5h
  "열공 수호", // 6h
  "심화 마스터", // 7h
  "철인 집중", // 8h
  "합격 초읽기", // 9h
  "전설의 수석", // 10h+
];

export function getStudyConeStageMeta(totalSeconds: number): StudyConeStageMeta {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const rawHours = Math.floor(safe / 3600);
  const stage = Math.min(10, rawHours);
  const remSec = safe % 3600;
  const progressPct = stage >= 10 ? 100 : Math.round((remSec / 3600) * 100);
  const remainingMinutes = stage >= 10 ? 0 : Math.max(1, Math.ceil((3600 - remSec) / 60));

  return {
    stage,
    hourLabel: stage >= 10 ? "10h+" : `${stage}h`,
    title: STAGE_TITLES[stage] || "열공 중",
    progressPct,
    remainingMinutes,
  };
}

export function resolveStudyConeFamily(
  rawValue?: string,
  fallbackSeed?: string
): StudyConeFamily {
  if (rawValue) {
    const valid = STUDY_CONE_FAMILIES.find((f) => f.id === rawValue);
    if (valid) return valid.id;
  }
  if (fallbackSeed) {
    let hash = 0;
    for (let i = 0; i < fallbackSeed.length; i += 1) {
      hash = (hash * 31 + fallbackSeed.charCodeAt(i)) >>> 0;
    }
    return STUDY_CONE_FAMILIES[hash % STUDY_CONE_FAMILIES.length].id;
  }
  return "CLASSIC_FLAME";
}

export function getStudyConeSpec(family: StudyConeFamily): StudyConeFamilySpec {
  return STUDY_CONE_FAMILIES.find((f) => f.id === family) || STUDY_CONE_FAMILIES[0];
}

interface StudyConeAvatarProps {
  family: StudyConeFamily;
  seconds: number;
  isStudying?: boolean;
  size?: number;
  showProgressRing?: boolean;
  className?: string;
}

/**
 * 1시간 단위(0h~10h+)로 형태·오라·날개·별빛·왕관이 진화하는 순수 SVG 스터디콘
 */
export function StudyConeAvatar({
  family,
  seconds,
  isStudying = true,
  size = 44,
  showProgressRing = true,
  className = "",
}: StudyConeAvatarProps) {
  const uid = useId().replace(/:/g, "");
  const spec = getStudyConeSpec(family);
  const meta = getStudyConeStageMeta(seconds);
  const stage = meta.stage;

  const activePrimary = isStudying ? spec.primary : "var(--hp-text-3)";
  const activeSecondary = isStudying ? spec.secondary : "var(--hp-border-strong)";

  const radius = 29;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - meta.progressPct / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      role="img"
      aria-label={`${spec.shortName} ${meta.hourLabel} ${meta.title}`}
    >
      <defs>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={spec.secondary} stopOpacity={isStudying ? 0.35 : 0.06} />
          <stop offset="100%" stopColor={spec.primary} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`body-${uid}`} x1="16" y1="14" x2="48" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={activeSecondary} />
          <stop offset="100%" stopColor={activePrimary} />
        </linearGradient>
      </defs>

      {/* 배경 원형 베이스 */}
      <circle
        cx="32"
        cy="32"
        r="28.5"
        fill="var(--hp-bg)"
        stroke="var(--hp-border)"
        strokeWidth="1.2"
      />

      {/* 1시간 이상 열공 중 은은한 내부 글로우 */}
      {stage >= 1 && (
        <circle
          cx="32"
          cy="32"
          r={Math.min(26, 15 + stage * 1.1)}
          fill={`url(#glow-${uid})`}
        />
      )}

      {/* 7시간+: 기하학 다이아몬드 / 9시간+: 육각 성좌 후광 */}
      {stage >= 7 && stage < 9 && (
        <polygon
          points="32,8 56,32 32,56 8,32"
          stroke={activeSecondary}
          strokeWidth="0.9"
          strokeOpacity={isStudying ? 0.45 : 0.2}
          strokeDasharray="2 2"
        />
      )}
      {stage >= 9 && (
        <polygon
          points="32,6 54,19 54,45 32,58 10,45 10,19"
          stroke={activeSecondary}
          strokeWidth="1.1"
          strokeOpacity={isStudying ? 0.65 : 0.25}
        />
      )}

      {/* 10시간+: 전설의 12방위 태양 성좌 광선 */}
      {stage >= 10 &&
        Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 32 + Math.cos(angle) * 23;
          const y1 = 32 + Math.sin(angle) * 23;
          const x2 = 32 + Math.cos(angle) * 26.5;
          const y2 = 32 + Math.sin(angle) * 26.5;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={activeSecondary}
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeOpacity={isStudying ? 0.85 : 0.3}
            />
          );
        })}

      {/* 2시간+: 집중 링 / 5시간+: 이중 광채 링 */}
      {stage >= 2 && (
        <circle
          cx="32"
          cy="32"
          r="23.5"
          stroke={activePrimary}
          strokeWidth={stage >= 5 ? "1.3" : "0.9"}
          strokeOpacity={isStudying ? 0.42 : 0.18}
          strokeDasharray={stage >= 4 ? undefined : "3 3"}
        />
      )}
      {stage >= 5 && (
        <circle
          cx="32"
          cy="32"
          r="20"
          stroke={activeSecondary}
          strokeWidth="0.8"
          strokeOpacity={isStudying ? 0.45 : 0.16}
        />
      )}

      {/* 3시간+: 좌우 에너지 날개 (6시간 이상 대형 확장) */}
      {stage >= 3 && (
        <g opacity={isStudying ? 0.9 : 0.35}>
          <path
            d={
              stage >= 6
                ? "M18 35 C10 31, 9 23, 14 19 C15 24, 17 27, 20 29 Z"
                : "M19 36 C13 33, 13 27, 17 24 C17.5 28, 18.5 31, 21 32 Z"
            }
            fill={activePrimary}
            fillOpacity="0.65"
          />
          <path
            d={
              stage >= 6
                ? "M46 35 C54 31, 55 23, 50 19 C49 24, 47 27, 44 29 Z"
                : "M45 36 C51 33, 51 27, 47 24 C46.5 28, 45.5 31, 43 32 Z"
            }
            fill={activePrimary}
            fillOpacity="0.65"
          />
        </g>
      )}

      {/* 메인 캐릭터 본체 (패밀리별 고유 실루엣 + 0시간 씨앗/알 상태 분기) */}
      {stage === 0 ? (
        /* 0시간: 씨앗 / 알 단계 (아직 막 시작한 상태) */
        <g>
          <path
            d="M32 20 C24.5 20, 21 29.5, 21 36.5 C21 43, 25.8 47, 32 47 C38.2 47, 43 43, 43 36.5 C43 29.5, 39.5 20, 32 20 Z"
            fill={`url(#body-${uid})`}
            fillOpacity={isStudying ? 0.82 : 0.35}
            stroke={activePrimary}
            strokeWidth="1.2"
          />
          {/* 금 간 부화선 */}
          <path
            d="M24 34 L28 31 L32 35 L36 31 L40 34"
            stroke="var(--hp-bg)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : family === "CLASSIC_FLAME" ? (
        /* 기본 열공 불꽃: 시간대별로 불꽃 레이어가 커지고 날카로워짐 */
        <g>
          <path
            d={
              stage >= 6
                ? "M32 14 C36 22, 45 25, 44 36 C43.5 43.5, 38.5 48, 32 48 C25.5 48, 20.5 43.5, 20 36 C19 25, 28 22, 32 14 Z"
                : "M32 17 C35 23.5, 42 27, 41.5 36.5 C41 43, 37 47, 32 47 C27 47, 23 43, 22.5 36.5 C22 27, 29 23.5, 32 17 Z"
            }
            fill={`url(#body-${uid})`}
          />
          <path
            d="M32 26 C35 30, 37.5 33.5, 37 38.5 C36.7 42, 34.6 44, 32 44 C29.4 44, 27.3 42, 27 38.5 C26.5 33.5, 29 30, 32 26 Z"
            fill="var(--hp-bg)"
            fillOpacity="0.82"
          />
          {stage >= 4 && (
            <circle cx="32" cy="38" r="2.6" fill={activeSecondary} />
          )}
        </g>
      ) : family === "FIRE_OWL" ? (
        /* 심야 독서실 부엉이 */
        <g>
          {/* 귀 깃털 (2시간 이상 뾰족 성장) */}
          <path
            d={stage >= 2 ? "M22 25 L19 17 L27 22 Z" : "M23 26 L21 21 L27 23 Z"}
            fill={activePrimary}
          />
          <path
            d={stage >= 2 ? "M42 25 L45 17 L37 22 Z" : "M41 26 L43 21 L37 23 Z"}
            fill={activePrimary}
          />
          {/* 몸통 */}
          <ellipse cx="32" cy="35" rx="12" ry="12.5" fill={`url(#body-${uid})`} />
          {/* 큰 부엉이 눈 */}
          <circle cx="27.5" cy="32.5" r="3.6" fill="var(--hp-bg)" />
          <circle cx="36.5" cy="32.5" r="3.6" fill="var(--hp-bg)" />
          <circle cx="27.5" cy="32.5" r="1.5" fill={activeSecondary} />
          <circle cx="36.5" cy="32.5" r="1.5" fill={activeSecondary} />
          {/* 부리 */}
          <polygon points="32,34.5 29.8,37.8 34.2,37.8" fill="var(--hp-bg)" />
          {/* 4시간+: 배 문양 */}
          {stage >= 4 && (
            <path
              d="M27.5 41.5 Q32 44.5 36.5 41.5"
              stroke="var(--hp-bg)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}
        </g>
      ) : family === "BLUE_DRAGON" ? (
        /* 합격 기원 청룡 */
        <g>
          {/* 용 뿔 (시간에 따라 더 웅장하게) */}
          <path
            d={stage >= 4 ? "M25 24 L20 15 L23 14 L28 22 Z" : "M25 25 L22 18 L28 23 Z"}
            fill={activeSecondary}
          />
          <path
            d={stage >= 4 ? "M39 24 L44 15 L41 14 L36 22 Z" : "M39 25 L42 18 L36 23 Z"}
            fill={activeSecondary}
          />
          {/* 머리/방패형 용 얼굴 */}
          <path
            d="M21 28 C21 22.5, 26 20, 32 20 C38 20, 43 22.5, 43 28 L41 41 C40.5 45, 36.5 47.5, 32 47.5 C27.5 47.5, 23.5 45, 23 41 Z"
            fill={`url(#body-${uid})`}
          />
          {/* 날카로운 눈 */}
          <polygon points="24.5,31 29.5,32.8 25.5,34.2" fill="var(--hp-bg)" />
          <polygon points="39.5,31 34.5,32.8 38.5,34.2" fill="var(--hp-bg)" />
          {/* 이마 여의주 코어 */}
          <polygon
            points="32,23 34.2,26.5 32,30 29.8,26.5"
            fill="var(--hp-bg)"
          />
          {stage >= 5 && (
            <circle cx="32" cy="26.5" r="1.2" fill={activeSecondary} />
          )}
          {/* 수염 */}
          <path
            d="M26 40 Q32 42.5 38 40"
            stroke="var(--hp-bg)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      ) : family === "LUCKY_CAT" ? (
        /* 선지 감별 복냥이 */
        <g>
          {/* 고양이 귀 */}
          <polygon points="21,29 21,18 30,24" fill={activePrimary} />
          <polygon points="43,29 43,18 34,24" fill={activePrimary} />
          <polygon points="22.8,26.5 22.8,20.8 27.6,24.2" fill="var(--hp-bg)" fillOpacity="0.65" />
          <polygon points="41.2,26.5 41.2,20.8 36.4,24.2" fill="var(--hp-bg)" fillOpacity="0.65" />
          {/* 둥근 얼굴 */}
          <ellipse cx="32" cy="35" rx="12" ry="11.5" fill={`url(#body-${uid})`} />
          {/* 눈 (열공 중 반짝 / 5시간+ 웃는 눈) */}
          {stage >= 5 ? (
            <>
              <path d="M25.5 33.5 Q27.5 31 29.5 33.5" stroke="var(--hp-bg)" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M34.5 33.5 Q36.5 31 38.5 33.5" stroke="var(--hp-bg)" strokeWidth="1.8" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="27.5" cy="33" r="1.8" fill="var(--hp-bg)" />
              <circle cx="36.5" cy="33" r="1.8" fill="var(--hp-bg)" />
            </>
          )}
          {/* 코·입 */}
          <path d="M30 37 Q32 39 34 37" stroke="var(--hp-bg)" strokeWidth="1.4" strokeLinecap="round" />
          {/* 목 방울 (4시간+) */}
          {stage >= 4 && (
            <circle cx="32" cy="44" r="2.4" fill="var(--hp-bg)" stroke={activeSecondary} strokeWidth="1" />
          )}
        </g>
      ) : (
        /* 수석 돌파 황금 사자 */
        <g>
          {/* 사자 갈기 (시간이 갈수록 갈기 각이 풍성해짐) */}
          <circle
            cx="32"
            cy="34"
            r={stage >= 5 ? 14.5 : 13}
            fill={activePrimary}
            fillOpacity="0.72"
            stroke={activeSecondary}
            strokeWidth={stage >= 3 ? "1.6" : "1"}
            strokeDasharray={stage >= 2 ? "4 2" : undefined}
          />
          {/* 얼굴 */}
          <circle cx="32" cy="34.5" r="9.8" fill={`url(#body-${uid})`} />
          {/* 귀 */}
          <circle cx="23.5" cy="26.5" r="2.8" fill={activeSecondary} />
          <circle cx="40.5" cy="26.5" r="2.8" fill={activeSecondary} />
          {/* 눈 */}
          <circle cx="28.5" cy="33.5" r="1.6" fill="var(--hp-bg)" />
          <circle cx="35.5" cy="33.5" r="1.6" fill="var(--hp-bg)" />
          {/* 코·입 */}
          <polygon points="32,35.5 30,37.8 34,37.8" fill="var(--hp-bg)" />
          <path d="M29 39.5 Q32 41.5 35 39.5" stroke="var(--hp-bg)" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )}

      {/* 1시간+: 상단 진화 장식 (1~2h 불씨/새싹, 3~7h 별빛 1~3개, 8~9h 티아라, 10h+ 황금 왕관) */}
      {stage >= 1 && stage < 3 && (
        <circle cx="32" cy="12" r="2" fill={activeSecondary} />
      )}
      {stage >= 3 && stage < 8 && (
        <g fill={activeSecondary}>
          <polygon points="32,8.5 33.1,11.2 35.8,12 33.1,12.8 32,15.5 30.9,12.8 28.2,12 30.9,11.2" />
          {stage >= 5 && (
            <>
              <circle cx="23" cy="14" r="1.4" />
              <circle cx="41" cy="14" r="1.4" />
            </>
          )}
          {stage >= 7 && (
            <>
              <circle cx="17" cy="20" r="1.2" />
              <circle cx="47" cy="20" r="1.2" />
            </>
          )}
        </g>
      )}
      {stage >= 8 && stage < 10 && (
        /* 8~9시간: 월계관/티아라 */
        <path
          d="M23 17 L26.5 11.5 L32 15 L37.5 11.5 L41 17 Z"
          fill={activeSecondary}
          stroke={activePrimary}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      )}
      {stage >= 10 && (
        /* 10시간+: 완전체 황금 왕관 */
        <g>
          <path
            d="M21 17.5 L23.5 10 L28.5 14 L32 8.5 L35.5 14 L40.5 10 L43 17.5 Z"
            fill="#F4D06F"
            stroke="#B78628"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="14.5" r="1.3" fill="var(--hp-bg)" />
        </g>
      )}

      {/* 외곽 다음 1시간 진화 진행 링 */}
      {showProgressRing && (
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={activePrimary}
          strokeWidth={isStudying ? "2.4" : "1.5"}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 32 32)"
          opacity={isStudying ? 0.92 : 0.35}
        />
      )}
    </svg>
  );
}

/**
 * 선택한 스터디콘의 0시간 ~ 10시간+ 1시간 단위 진화 미리보기 스트립
 */
export function StudyConeEvolutionStrip({
  family,
  currentSeconds = 0,
}: {
  family: StudyConeFamily;
  currentSeconds?: number;
}) {
  const currentStage = getStudyConeStageMeta(currentSeconds).stage;
  const previewHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-[var(--hp-text-2)]">
        <span>1시간마다 자동 진화 미리보기</span>
        <span className="hp-tabular text-[var(--hp-text-3)]">0h ~ 10h+</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {previewHours.map((h) => {
          const active = h === currentStage;
          return (
            <div
              key={h}
              className={`px-2 py-1.5 rounded-xl border flex flex-col items-center gap-1 shrink-0 transition ${
                active
                  ? "bg-[var(--hp-surface-2)] border-[var(--hp-border-strong)]"
                  : "bg-[var(--hp-bg)] border-[var(--hp-border)]"
              }`}
            >
              <StudyConeAvatar
                family={family}
                seconds={h * 3600 + 1800}
                isStudying
                size={36}
                showProgressRing={false}
              />
              <span className="text-[10px] font-medium hp-tabular text-[var(--hp-text)]">
                {h >= 10 ? "10h+" : `${h}h`}
              </span>
              <span className="text-[9px] text-[var(--hp-text-3)] whitespace-nowrap">
                {STAGE_TITLES[h]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
