"use client";

import React, { useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import {
  MINIMI_STYLES,
  ROOM_PROPS,
  type HonorTrophyItem,
} from "../healing-room-catalog";

interface IsometricMiniroomStageProps {
  roomTheme: string;
  minimiStyle: string;
  minimiQuote: string;
  ownerNickname: string;
  placedItems: string[];
  ownedItems: string[];
  trophies: HonorTrophyItem[];
  isOwner: boolean;
  isBusy: boolean;
  onToggleProp?: (propId: string) => void;
}

interface ThemeVisualPalette {
  wallLeftFill: string;
  wallRightFill: string;
  wallPatternStroke: string;
  moldingFill: string;
  floorBase: string;
  floorTileLine: string;
  rugOuter: string;
  rugInner: string;
  skyTop: string;
  skyBottom: string;
  windowSceneryType: "cherry" | "cafe" | "hanok" | "night" | "forest";
  accentColor: string;
}

const THEME_PALETTES: Record<string, ThemeVisualPalette> = {
  "sunset-attic": {
    wallLeftFill: "#fceceb",
    wallRightFill: "#f9e0df",
    wallPatternStroke: "#f4b8bd",
    moldingFill: "#e8b4b8",
    floorBase: "#f7ebe6",
    floorTileLine: "#e9d0c7",
    rugOuter: "#f8c8cf",
    rugInner: "#fde7ea",
    skyTop: "#a6d8ff",
    skyBottom: "#ffd3d8",
    windowSceneryType: "cherry",
    accentColor: "#e16b8c",
  },
  "seongsu-bookcafe": {
    wallLeftFill: "#f5efe6",
    wallRightFill: "#ece3d5",
    wallPatternStroke: "#d8c9b4",
    moldingFill: "#bfa588",
    floorBase: "#e5d3bc",
    floorTileLine: "#ccb395",
    rugOuter: "#a8c6a2",
    rugInner: "#dcebd8",
    skyTop: "#b8e1ff",
    skyBottom: "#f5f7da",
    windowSceneryType: "cafe",
    accentColor: "#3b825e",
  },
  "hanok-teahouse": {
    wallLeftFill: "#f7f3e4",
    wallRightFill: "#eee7d2",
    wallPatternStroke: "#d2c4a3",
    moldingFill: "#9e7b56",
    floorBase: "#dec6a4",
    floorTileLine: "#b9966b",
    rugOuter: "#d9b99b",
    rugInner: "#f3e5d0",
    skyTop: "#28395c",
    skyBottom: "#8079a6",
    windowSceneryType: "hanok",
    accentColor: "#8c5d32",
  },
  "starlight-rooftop": {
    wallLeftFill: "#2a2744",
    wallRightFill: "#23203b",
    wallPatternStroke: "#484273",
    moldingFill: "#5c5491",
    floorBase: "#373357",
    floorTileLine: "#4f4a78",
    rugOuter: "#7367b8",
    rugInner: "#4e4585",
    skyTop: "#0f172a",
    skyBottom: "#312e81",
    windowSceneryType: "night",
    accentColor: "#a78bfa",
  },
  "jeju-forest": {
    wallLeftFill: "#ebf6ef",
    wallRightFill: "#ddf0e4",
    wallPatternStroke: "#b0dec0",
    moldingFill: "#7fb392",
    floorBase: "#e7dec8",
    floorTileLine: "#cfc0a3",
    rugOuter: "#9ad6b0",
    rugInner: "#d4f2df",
    skyTop: "#bfe8df",
    skyBottom: "#eaf9d8",
    windowSceneryType: "forest",
    accentColor: "#2d8a5b",
  },
};

interface MinimiVisualSpec {
  hairColor: string;
  outfitMain: string;
  outfitSub: string;
  skinColor: string;
  cheekColor: string;
  hatOrEar: "none" | "owl" | "cap" | "halo" | "wizard";
  propEmoji: string;
}

const MINIMI_VISUALS: Record<string, MinimiVisualSpec> = {
  "warm-knit": {
    hairColor: "#4a3328",
    outfitMain: "#f59e0b",
    outfitSub: "#fef3c7",
    skinColor: "#ffe2cf",
    cheekColor: "#fda4af",
    hatOrEar: "none",
    propEmoji: "☕",
  },
  "detective-owl": {
    hairColor: "#5b4636",
    outfitMain: "#38bdf8",
    outfitSub: "#e0f2fe",
    skinColor: "#ffe4d4",
    cheekColor: "#fca5a5",
    hatOrEar: "owl",
    propEmoji: "🔎",
  },
  "cozy-camper": {
    hairColor: "#9a3412",
    outfitMain: "#10b981",
    outfitSub: "#d1fae5",
    skinColor: "#ffe2cf",
    cheekColor: "#fda4af",
    hatOrEar: "cap",
    propEmoji: "🎒",
  },
  "angel-wings": {
    hairColor: "#78350f",
    outfitMain: "#fb7185",
    outfitSub: "#ffe4e6",
    skinColor: "#fff0e8",
    cheekColor: "#f9a8d4",
    hatOrEar: "halo",
    propEmoji: "🕊️",
  },
  "golden-sage": {
    hairColor: "#312e81",
    outfitMain: "#6366f1",
    outfitSub: "#fef08a",
    skinColor: "#ffe5d6",
    cheekColor: "#fda4af",
    hatOrEar: "wizard",
    propEmoji: "✨",
  },
};

const HEALING_CHATS = [
  "바닥을 클릭하면 내가 걸어다녀요! 🐾",
  "오늘 하루도 고생 많았어요, 토닥토닥 ☕",
  "나눔과 예측의 온기가 방에 가득해요 ✨",
  "bgm 켜고 잠시 쉬어가도 괜찮아요 🎵",
];

/**
 * 아이소메트릭 마름모 바닥 영역 내부로 좌표를 안전하게 보정합니다.
 * 마름모 중심: (320, 272), 가로 반폭 235, 세로 반폭 56
 */
function clampToIsometricFloor(x: number, y: number): { x: number; y: number } {
  const cx = 320;
  const cy = 272;
  const rx = 210;
  const ry = 50;

  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  const manhattan = Math.abs(nx) + Math.abs(ny);

  if (manhattan <= 1) {
    return { x: Math.round(x), y: Math.round(y) };
  }

  return {
    x: Math.round(cx + (nx / manhattan) * rx),
    y: Math.round(cy + (ny / manhattan) * ry),
  };
}

export function IsometricMiniroomStage({
  roomTheme,
  minimiStyle,
  minimiQuote,
  ownerNickname,
  placedItems,
  ownedItems,
  trophies,
  isOwner,
  isBusy,
  onToggleProp,
}: IsometricMiniroomStageProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [minimiPos, setMinimiPos] = useState<{ x: number; y: number }>({ x: 318, y: 274 });
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
  const [tempChat, setTempChat] = useState<string | null>(null);

  const palette = THEME_PALETTES[roomTheme] ?? THEME_PALETTES["sunset-attic"];
  const minimiVisual = MINIMI_VISUALS[minimiStyle] ?? MINIMI_VISUALS["warm-knit"];
  const minimiMeta = MINIMI_STYLES.find((m) => m.id === minimiStyle) ?? MINIMI_STYLES[0];
  const unlockedTrophies = useMemo(() => trophies.filter((t) => t.unlocked).slice(0, 4), [trophies]);
  const ownedSet = useMemo(() => new Set(ownedItems), [ownedItems]);
  const placedSet = useMemo(() => new Set(placedItems), [placedItems]);

  const selectedProp = useMemo(
    () => (selectedPropId ? ROOM_PROPS.find((p) => p.id === selectedPropId) ?? null : null),
    [selectedPropId]
  );

  function handleFloorClick(event: React.MouseEvent<SVGElement>) {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const svgX = ((event.clientX - rect.left) / rect.width) * 640;
    const svgY = ((event.clientY - rect.top) / rect.height) * 360;
    const clamped = clampToIsometricFloor(svgX, svgY);
    setMinimiPos(clamped);
    setSelectedPropId(null);
  }

  function handleMinimiClick(event: React.MouseEvent) {
    event.stopPropagation();
    const randomLine = HEALING_CHATS[Math.floor(Math.random() * HEALING_CHATS.length)];
    setTempChat(randomLine);
    window.setTimeout(() => {
      setTempChat((prev) => (prev === randomLine ? null : prev));
    }, 3200);
  }

  function handlePropClick(event: React.MouseEvent, propId: string) {
    event.stopPropagation();
    setSelectedPropId((prev) => (prev === propId ? null : propId));
  }

  const isDarkWall = palette.windowSceneryType === "night";

  return (
    <div className="w-full space-y-2">
      {/* 싸이월드 정통 아이소메트릭 미니룸 캔버스 */}
      <div className="relative overflow-hidden rounded border border-[#b8ccd4] bg-[#eef5f8] shadow-inner">
        <svg
          ref={svgRef}
          viewBox="0 0 640 360"
          className="block h-auto w-full select-none"
          role="img"
          aria-label={`${ownerNickname}님의 2.5D 아이소메트릭 미니룸`}
        >
          <defs>
            <linearGradient id="cySkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.skyTop} />
              <stop offset="100%" stopColor={palette.skyBottom} />
            </linearGradient>
            <linearGradient id="lampGlowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
            </linearGradient>
            <pattern id="wallHeartsPattern" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="1.4" fill={palette.wallPatternStroke} opacity="0.55" />
              <path
                d="M12 18 C12 18 8 15.2 8 13.3 C8 12.1 9 11.3 10 11.3 C10.8 11.3 11.6 11.8 12 12.6 C12.4 11.8 13.2 11.3 14 11.3 C15 11.3 16 12.1 16 13.3 C16 15.2 12 18 12 18 Z"
                fill={palette.wallPatternStroke}
                opacity="0.28"
                transform="translate(0 -9) scale(0.7)"
              />
            </pattern>
            <pattern id="floorGridPattern" width="32" height="16" patternUnits="userSpaceOnUse">
              <path
                d="M 0 8 L 16 0 L 32 8 L 16 16 Z"
                fill="none"
                stroke={palette.floorTileLine}
                strokeWidth="0.8"
              />
            </pattern>
          </defs>

          {/* 캔버스 외곽 배경 */}
          <rect x="0" y="0" width="640" height="360" fill={isDarkWall ? "#18162b" : "#f8fbfc"} />

          {/* 좌측 벽 */}
          <polygon points="36,92 320,20 320,196 36,268" fill={palette.wallLeftFill} />
          <polygon points="36,92 320,20 320,196 36,268" fill="url(#wallHeartsPattern)" />

          {/* 우측 벽 */}
          <polygon points="320,20 604,92 604,268 320,196" fill={palette.wallRightFill} />
          <polygon points="320,20 604,92 604,268 320,196" fill="url(#wallHeartsPattern)" />

          {/* 벽면 코너 & 걸레받이(Molding) */}
          <line x1="320" y1="20" x2="320" y2="196" stroke={palette.moldingFill} strokeWidth="2.5" />
          <polygon points="36,258 320,186 320,196 36,268" fill={palette.moldingFill} opacity="0.7" />
          <polygon points="320,186 604,258 604,268 320,196" fill={palette.moldingFill} opacity="0.85" />

          {/* 아이소메트릭 바닥 (클릭 시 미니미 이동) */}
          <polygon
            points="36,268 320,196 604,268 320,342"
            fill={palette.floorBase}
            stroke={palette.moldingFill}
            strokeWidth="2"
            className="cursor-pointer"
            onClick={handleFloorClick}
          />
          <polygon
            points="36,268 320,196 604,268 320,342"
            fill="url(#floorGridPattern)"
            className="pointer-events-none"
          />

          {/* 중앙 러그 (클릭 가능) */}
          <ellipse
            cx="320"
            cy="272"
            rx="94"
            ry="32"
            fill={palette.rugOuter}
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.92"
            className="cursor-pointer"
            onClick={handleFloorClick}
          />
          <ellipse
            cx="320"
            cy="272"
            rx="72"
            ry="22"
            fill={palette.rugInner}
            className="pointer-events-none"
          />

          {/* === 좌측 벽: 대형 발코니 통창 === */}
          <g>
            {/* 창틀 외곽 */}
            <polygon
              points="182,76 286,50 286,162 182,188"
              fill="#ffffff"
              stroke={palette.moldingFill}
              strokeWidth="2.5"
            />
            {/* 창문 풍경 하늘 */}
            <polygon points="188,82 280,58 280,154 188,178" fill="url(#cySkyGrad)" />

            {/* 테마별 창밖 풍경 */}
            {palette.windowSceneryType === "cherry" && (
              <g>
                <circle cx="255" cy="90" r="14" fill="#ffe4b5" opacity="0.85" />
                <ellipse cx="212" cy="118" rx="22" ry="18" fill="#f9a8d4" opacity="0.85" />
                <ellipse cx="232" cy="108" rx="18" ry="14" fill="#fbcfe8" opacity="0.9" />
                <circle cx="204" cy="134" r="3" fill="#f472b6" />
                <circle cx="246" cy="126" r="2.5" fill="#f472b6" />
              </g>
            )}
            {palette.windowSceneryType === "cafe" && (
              <g>
                <circle cx="255" cy="84" r="12" fill="#fde047" opacity="0.85" />
                <ellipse cx="215" cy="126" rx="24" ry="20" fill="#4ade80" opacity="0.85" />
                <ellipse cx="242" cy="132" rx="16" ry="14" fill="#22c55e" opacity="0.8" />
              </g>
            )}
            {palette.windowSceneryType === "hanok" && (
              <g>
                <circle cx="252" cy="88" r="11" fill="#fef08a" />
                <polygon points="188,160 220,138 258,150 280,136 280,154 188,178" fill="#312e81" opacity="0.7" />
              </g>
            )}
            {palette.windowSceneryType === "night" && (
              <g>
                <circle cx="256" cy="82" r="9" fill="#fef9c3" />
                <circle cx="204" cy="96" r="1.5" fill="#ffffff" />
                <circle cx="228" cy="86" r="1.8" fill="#ffffff" />
                <polygon points="196,174 196,136 214,132 214,170" fill="#1e293b" />
                <polygon points="222,168 222,122 246,116 246,162" fill="#0f172a" />
                <rect x="228" y="128" width="4" height="5" fill="#fde047" />
                <rect x="236" y="138" width="4" height="5" fill="#fde047" />
              </g>
            )}
            {palette.windowSceneryType === "forest" && (
              <g>
                <polygon points="196,174 214,114 232,165" fill="#16a34a" opacity="0.8" />
                <polygon points="228,166 248,104 268,156" fill="#15803d" opacity="0.85" />
              </g>
            )}

            {/* 발코니 난간 */}
            <polygon points="188,152 280,128 280,154 188,178" fill="#fff7ed" opacity="0.92" />
            <line x1="205" y1="148" x2="205" y2="173" stroke="#d6b89c" strokeWidth="2" />
            <line x1="225" y1="143" x2="225" y2="168" stroke="#d6b89c" strokeWidth="2" />
            <line x1="245" y1="138" x2="245" y2="163" stroke="#d6b89c" strokeWidth="2" />
            <line x1="265" y1="133" x2="265" y2="158" stroke="#d6b89c" strokeWidth="2" />

            {/* 창문 가운데 프레임 */}
            <line x1="234" y1="63" x2="234" y2="175" stroke="#ffffff" strokeWidth="3.5" />
          </g>

          {/* === 좌측 벽 장식 액자 === */}
          <g transform="translate(88, 108) skewY(-14)">
            <rect x="0" y="0" width="38" height="46" rx="4" fill="#fffdf9" stroke={palette.accentColor} strokeWidth="2.5" />
            <rect x="5" y="5" width="28" height="36" rx="2" fill="#ffe4e6" />
            <text x="19" y="29" textAnchor="middle" fontSize="16">🌸</text>
          </g>

          {/* === 우측 벽: 아치형 방문 + 레이스 커튼 === */}
          <g>
            <polygon
              points="376,72 448,90 448,214 376,196"
              fill="#fff7f5"
              stroke={palette.moldingFill}
              strokeWidth="2.5"
            />
            <polygon points="384,82 440,96 440,206 384,192" fill="#fde2e4" />
            {/* 커튼 드레이프 */}
            <path d="M384 82 Q408 102 392 146 L384 192 Z" fill="#ffffff" opacity="0.88" />
            <path d="M440 96 Q418 112 432 156 L440 206 Z" fill="#ffffff" opacity="0.88" />
            {/* 방문 하트 장식 & 손잡이 */}
            <circle cx="412" cy="134" r="9" fill="#ffffff" opacity="0.8" />
            <text x="412" y="139" textAnchor="middle" fontSize="11">💖</text>
            <circle cx="430" cy="158" r="3.5" fill="#d97706" />
          </g>

          {/* === 우측 벽: 영광의 선반 (해금된 명예 트로피 진열) === */}
          <g>
            <polygon points="482,118 574,142 574,151 482,127" fill="#ffffff" stroke={palette.moldingFill} strokeWidth="2" />
            <polygon points="482,158 574,182 574,191 482,167" fill="#ffffff" stroke={palette.moldingFill} strokeWidth="2" />
            {unlockedTrophies.length > 0 ? (
              unlockedTrophies.map((trophy, idx) => {
                const row = idx < 2 ? 0 : 1;
                const col = idx % 2;
                const tx = 505 + col * 38;
                const ty = (row === 0 ? 116 : 156) + col * 10;
                return (
                  <g key={trophy.id}>
                    <title>{`${trophy.title}: ${trophy.progressText}`}</title>
                    <circle cx={tx} cy={ty - 8} r="11" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
                    <text x={tx} y={ty - 4} textAnchor="middle" fontSize="12">
                      {trophy.icon}
                    </text>
                  </g>
                );
              })
            ) : (
              <text x="528" y="128" textAnchor="middle" fontSize="9" fill="#94a3b8" transform="skewY(14)">
                명예 선반
              </text>
            )}
          </g>

          {/* === 배치 가구/소품 일러스트 오브제 === */}
          {/* 1) 오렌지 무드 스탠드 (코너) */}
          {placedSet.has("mood-lamp") && (
            <g
              transform="translate(314, 152)"
              className="cursor-pointer"
              onClick={(e) => handlePropClick(e, "mood-lamp")}
            >
              <polygon points="-24,20 24,20 38,85 -38,85" fill="url(#lampGlowGrad)" />
              <ellipse cx="0" cy="68" rx="13" ry="5" fill="#92400e" />
              <rect x="-2.5" y="18" width="5" height="50" fill="#b45309" />
              <polygon points="-13,18 13,18 8,0 -8,0" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.5" />
            </g>
          )}

          {/* 2) 빈티지 LP 턴테이블 (우측 벽 앞) */}
          {placedSet.has("vinyl-player") && (
            <g
              transform="translate(348, 198)"
              className="cursor-pointer"
              onClick={(e) => handlePropClick(e, "vinyl-player")}
            >
              <polygon points="0,12 34,21 34,42 0,33" fill="#d97706" />
              <polygon points="-26,20 0,12 0,33 -26,41" fill="#b45309" />
              <polygon points="-26,20 0,12 34,21 8,29" fill="#fbbf24" />
              {/* LP판 */}
              <ellipse cx="4" cy="18" rx="12" ry="6" fill="#1e293b" />
              <circle cx="4" cy="18" r="3" fill="#f43f5e" />
              <text x="20" y="6" fontSize="12" fill="#e11d48">
                🎵
              </text>
            </g>
          )}

          {/* 3) 원목 독서/화장대 테이블 (좌측 벽 앞) */}
          {placedSet.has("wood-desk") && (
            <g
              transform="translate(154, 198)"
              className="cursor-pointer"
              onClick={(e) => handlePropClick(e, "wood-desk")}
            >
              {/* 테이블 몸체 */}
              <polygon points="-32,18 18,5 44,16 -6,29" fill="#fffaf5" stroke="#c28e6b" strokeWidth="1.5" />
              <polygon points="-32,18 -6,29 -6,52 -32,41" fill="#e6cbb3" />
              <polygon points="-6,29 44,16 44,39 -6,52" fill="#d4b092" />
              {/* 거울 & 소품 */}
              <ellipse cx="6" cy="2" rx="12" ry="15" fill="#e0f2fe" stroke="#b07d56" strokeWidth="2.5" />
              <ellipse cx="-14" cy="40" rx="10" ry="5" fill="#fbcfe8" stroke="#e16b8c" strokeWidth="1" />
            </g>
          )}

          {/* 4) 미래 관측 망원경 (창가 앞) */}
          {placedSet.has("telescope") && (
            <g
              transform="translate(232, 206)"
              className="cursor-pointer"
              onClick={(e) => handlePropClick(e, "telescope")}
            >
              <line x1="0" y1="6" x2="-10" y2="34" stroke="#78350f" strokeWidth="2.5" />
              <line x1="0" y1="6" x2="10" y2="34" stroke="#78350f" strokeWidth="2.5" />
              <line x1="0" y1="6" x2="0" y2="36" stroke="#92400e" strokeWidth="2" />
              <polygon points="-18,-8 18,4 15,12 -21,0" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
              <circle cx="17" cy="8" r="4" fill="#38bdf8" />
            </g>
          )}

          {/* 5) 행운 몬스테라 화분 + 파스텔 풍선 (좌측 창가 모서리) */}
          {placedSet.has("plant-pot") && (
            <g
              transform="translate(86, 224)"
              className="cursor-pointer"
              onClick={(e) => handlePropClick(e, "plant-pot")}
            >
              {/* 풍선 장식 */}
              <line x1="-10" y1="6" x2="-16" y2="-36" stroke="#cbd5e1" strokeWidth="1.2" />
              <circle cx="-18" cy="-46" r="11" fill="#f472b6" opacity="0.88" />
              <circle cx="-6" cy="-54" r="9" fill="#fde047" opacity="0.88" />
              {/* 화분 */}
              <polygon points="-10,12 10,12 7,30 -7,30" fill="#ea580c" stroke="#9a3412" strokeWidth="1.2" />
              <ellipse cx="0" cy="12" rx="11" ry="4" fill="#7c2d12" />
              <ellipse cx="-8" cy="0" rx="9" ry="6" fill="#22c55e" transform="rotate(-24 -8 0)" />
              <ellipse cx="8" cy="-2" rx="9" ry="6" fill="#16a34a" transform="rotate(24 8 -2)" />
              <ellipse cx="0" cy="-9" rx="7" ry="10" fill="#4ade80" />
            </g>
          )}

          {/* 6) 낮잠 치즈냥 & 포근 방석 (좌측 하단) */}
          {placedSet.has("sleeping-cat") && (
            <g
              transform="translate(152, 268)"
              className="cursor-pointer"
              onClick={(e) => handlePropClick(e, "sleeping-cat")}
            >
              {/* 포근 침대/쿠션 */}
              <ellipse cx="0" cy="10" rx="34" ry="15" fill="#fbcfe8" stroke="#f472b6" strokeWidth="2" />
              <ellipse cx="0" cy="8" rx="26" ry="10" fill="#fff1f2" />
              {/* 자는 치즈 고양이 */}
              <ellipse cx="0" cy="5" rx="14" ry="8" fill="#fb923c" />
              <circle cx="-9" cy="1" r="7" fill="#fb923c" />
              <polygon points="-14,-4 -11,-10 -7,-5" fill="#f97316" />
              <polygon points="-8,-5 -4,-10 -2,-4" fill="#f97316" />
              <text x="12" y="-6" fontSize="10" fill="#64748b" fontWeight="bold">
                zZ
              </text>
            </g>
          )}

          {/* 7) 장작 벽난로 (우측 벽 하단) */}
          {placedSet.has("warm-fireplace") && (
            <g
              transform="translate(524, 214)"
              className="cursor-pointer"
              onClick={(e) => handlePropClick(e, "warm-fireplace")}
            >
              <polygon points="-24,6 18,18 18,52 -24,40" fill="#fff7ed" stroke="#d6b89c" strokeWidth="1.8" />
              <polygon points="-28,2 22,15 22,22 -28,9" fill="#fed7aa" stroke="#b45309" strokeWidth="1.5" />
              <polygon points="-14,22 8,28 8,48 -14,42" fill="#292524" />
              <path d="M-7 41 Q-3 28 2 43 Q-3 46 -7 41 Z" fill="#f97316" />
              <path d="M-5 42 Q-3 34 0 43 Z" fill="#fde047" />
            </g>
          )}

          {/* 8) 캐모마일 티세트 원형 테이블 (우측 하단) */}
          {placedSet.has("tea-table") && (
            <g
              transform="translate(476, 266)"
              className="cursor-pointer"
              onClick={(e) => handlePropClick(e, "tea-table")}
            >
              {/* 뒤 의자 */}
              <circle cx="28" cy="-4" r="10" fill="#fda4af" />
              <rect x="24" y="4" width="8" height="12" rx="2" fill="#e11d48" />
              {/* 원형 테이블 */}
              <line x1="0" y1="2" x2="0" y2="24" stroke="#be123c" strokeWidth="4" />
              <ellipse cx="0" cy="24" rx="14" ry="6" fill="#fda4af" />
              <ellipse cx="0" cy="0" rx="28" ry="12" fill="#fff1f2" stroke="#f43f5e" strokeWidth="2" />
              <path d="M-26 2 Q0 16 26 2" fill="none" stroke="#fda4af" strokeWidth="3" strokeDasharray="3 2" />
              {/* 찻잔 2개 */}
              <rect x="-11" y="-5" width="7" height="6" rx="1.5" fill="#ffffff" stroke="#e11d48" strokeWidth="1" />
              <rect x="5" y="-3" width="7" height="6" rx="1.5" fill="#ffffff" stroke="#e11d48" strokeWidth="1" />
            </g>
          )}

          {/* === 중앙 2등신 미니미 캐릭터 (바닥 클릭 시 부드럽게 이동) === */}
          <g
            style={{
              transform: `translate(${minimiPos.x}px, ${minimiPos.y}px)`,
              transition: "transform 480ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="cursor-pointer"
            onClick={handleMinimiClick}
          >
            {/* 바닥 그림자 */}
            <ellipse cx="0" cy="14" rx="18" ry="7" fill="#000000" opacity="0.18" />

            {/* 천사 날개 */}
            {minimiVisual.hatOrEar === "halo" && (
              <g>
                <ellipse cx="-16" cy="-16" rx="10" ry="6" fill="#ffffff" stroke="#f9a8d4" strokeWidth="1.2" transform="rotate(-20 -16 -16)" />
                <ellipse cx="16" cy="-16" rx="10" ry="6" fill="#ffffff" stroke="#f9a8d4" strokeWidth="1.2" transform="rotate(20 16 -16)" />
              </g>
            )}

            {/* 다리 & 신발 */}
            <rect x="-8" y="-4" width="6" height="16" rx="3" fill="#475569" />
            <rect x="2" y="-4" width="6" height="16" rx="3" fill="#475569" />
            <ellipse cx="-6" cy="12" rx="5" ry="3" fill="#1e293b" />
            <ellipse cx="6" cy="12" rx="5" ry="3" fill="#1e293b" />

            {/* 상의 (2등신 몸통) */}
            <path
              d="M-13 -20 Q0 -25 13 -20 L15 -1 L-15 -1 Z"
              fill={minimiVisual.outfitMain}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle cx="0" cy="-14" r="4" fill={minimiVisual.outfitSub} />

            {/* 양팔 + 소품 */}
            <circle cx="-15" cy="-11" r="4" fill={minimiVisual.skinColor} />
            <circle cx="15" cy="-11" r="4" fill={minimiVisual.skinColor} />
            <text x="19" y="-8" fontSize="12">
              {minimiVisual.propEmoji}
            </text>

            {/* 머리 (싸이월드 2등신 감성) */}
            <circle cx="0" cy="-37" r="18" fill={minimiVisual.skinColor} stroke="#e2a898" strokeWidth="1" />
            {/* 머리카락 */}
            <path
              d="M-18 -38 C-18 -56 18 -56 18 -38 C14 -45 6 -47 0 -45 C-6 -47 -14 -45 -18 -38 Z"
              fill={minimiVisual.hairColor}
            />
            {/* 눈, 볼터치, 미소 */}
            <circle cx="-6" cy="-35" r="2" fill="#1e293b" />
            <circle cx="6" cy="-35" r="2" fill="#1e293b" />
            <ellipse cx="-10" cy="-31" rx="3.2" ry="1.8" fill={minimiVisual.cheekColor} opacity="0.7" />
            <ellipse cx="10" cy="-31" rx="3.2" ry="1.8" fill={minimiVisual.cheekColor} opacity="0.7" />
            <path d="M-3 -30 Q0 -27 3 -30" fill="none" stroke="#be123c" strokeWidth="1.5" strokeLinecap="round" />

            {/* 모자 / 헤일로 / 귀 장식 */}
            {minimiVisual.hatOrEar === "owl" && (
              <g>
                <polygon points="-14,-51 -8,-61 -2,-53" fill="#0ea5e9" />
                <polygon points="14,-51 8,-61 2,-53" fill="#0ea5e9" />
              </g>
            )}
            {minimiVisual.hatOrEar === "cap" && (
              <path d="M-16 -46 Q0 -62 16 -46 L22 -44 L-16 -44 Z" fill="#059669" />
            )}
            {minimiVisual.hatOrEar === "halo" && (
              <ellipse cx="0" cy="-60" rx="12" ry="3.5" fill="none" stroke="#facc15" strokeWidth="2.5" />
            )}
            {minimiVisual.hatOrEar === "wizard" && (
              <g>
                <polygon points="-14,-49 0,-69 14,-49" fill="#4f46e5" stroke="#fde047" strokeWidth="1.2" />
                <ellipse cx="0" cy="-49" rx="18" ry="3.5" fill="#4338ca" />
              </g>
            )}

            {/* 미니미 닉네임 & 스타일 배지 */}
            <rect x="-34" y="16" width="68" height="16" rx="8" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" opacity="0.95" />
            <text x="0" y="27" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#1e293b">
              {ownerNickname.slice(0, 8)}
            </text>

            {/* 머리 위 말풍선 */}
            <g transform="translate(0, -84)">
              <rect
                x="-95"
                y="-14"
                width="190"
                height="24"
                rx="10"
                fill="#ffffff"
                stroke="#60a5fa"
                strokeWidth="1.5"
              />
              <polygon points="-5,10 5,10 0,16" fill="#ffffff" stroke="#60a5fa" strokeWidth="1" />
              <text x="0" y="2" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
                {(tempChat ?? minimiQuote).slice(0, 26)}
              </text>
            </g>
          </g>
        </svg>

        {/* 좌측 상단/하단 안내 오버레이 */}
        <div className="pointer-events-none absolute bottom-2 left-2.5 rounded bg-white/85 px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm border border-slate-200">
          💡 바닥을 클릭하면 <strong className="text-sky-700">{minimiMeta.name}</strong> 미니미가 걸어다녀요
        </div>

        {/* 소품 선택 툴팁 */}
        {selectedProp && (
          <div className="absolute top-2.5 left-2.5 max-w-xs rounded-lg border border-pink-300 bg-white/95 px-3 py-2 text-xs shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-slate-800">
                {selectedProp.emoji} {selectedProp.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPropId(null)}
                className="text-[10px] text-slate-400 hover:text-slate-700"
              >
                닫기
              </button>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-600">{selectedProp.description}</p>
          </div>
        )}
      </div>

      {/* 내 방일 때 보유 가구 빠른 ON/OFF 배치 바 */}
      {isOwner && onToggleProp && (
        <div className="flex flex-wrap items-center gap-1.5 rounded border border-[#d6e5ea] bg-[#f4fafc] px-2.5 py-2">
          <span className="mr-1 text-[11px] font-bold text-[#2b6b7c]">🪑 미니룸 가구 배치:</span>
          {ROOM_PROPS.filter((prop) => ownedSet.has(prop.id) || prop.pricePmp === 0).map((prop) => {
            const active = placedSet.has(prop.id);
            return (
              <button
                key={prop.id}
                type="button"
                disabled={isBusy}
                onClick={() => onToggleProp(prop.id)}
                className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition ${
                  active
                    ? "border-[#2b879e] bg-[#e0f3f7] text-[#175463] font-bold"
                    : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span>{prop.emoji}</span>
                <span>{prop.name}</span>
                {active && <Check className="h-3 w-3 text-[#2b879e]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
