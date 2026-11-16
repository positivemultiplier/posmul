/**
 * PosMul 힐링룸 서버 서비스 (조회 · 초기화 · 수정 · PMP 상점 구매 · 일촌평 방명록)
 *
 * 경제 불변식(posmul-economy):
 * - 상점 구매는 오직 무위험 활동 재화 PMP(PMP_SPEND)만 사용하며, PMC는 절대 소비하거나 임의 생성하지 않습니다.
 * - 후속 DB 반영 실패 시 차감한 PMP 잔액을 즉시 롤백하여 원장 정합성을 보장합니다.
 */
import { supabaseAdmin } from "../../lib/supabase/admin";
import {
  BGM_TRACKS,
  MINIMI_STYLES,
  ROOM_PROPS,
  ROOM_THEMES,
  computeHonorTrophies,
  findHealingItemById,
  type BgmTrackOption,
  type HonorTrophyItem,
} from "./healing-room-catalog";

export const DEMO_HEALING_ROOM_USER_ID = "00000000-0000-0000-0000-000000000001";

const DEFAULT_THEME_ID = "sunset-attic";
const DEFAULT_MINIMI_ID = "warm-knit";
const DEFAULT_BGM_ID = "lofi-rain";
const DEFAULT_PLACED_ITEMS: ReadonlyArray<string> = ["plant-pot", "wood-desk"];
const DEFAULT_OWNED_ITEMS: ReadonlyArray<string> = [
  DEFAULT_THEME_ID,
  DEFAULT_MINIMI_ID,
  ...DEFAULT_PLACED_ITEMS,
];

export interface HealingRoomProfile {
  userId: string;
  ownerNickname: string;
  roomTitle: string;
  statusMessage: string;
  moodTag: string;
  bgmTrack: string;
  roomTheme: string;
  minimiStyle: string;
  minimiQuote: string;
  placedItems: string[];
  ownedItems: string[];
  todayVisits: number;
  totalVisits: number;
  lastVisitDate: string;
  regionLabel: string;
}

export interface HealingNeighborSummary {
  userId: string;
  ownerNickname: string;
  roomTitle: string;
  minimiStyle: string;
  regionLabel: string;
  todayVisits: number;
  totalVisits: number;
  universeTitle?: string | null;
  creationsCount?: number;
}

export interface WorldviewTimelineItem {
  era: string;
  title: string;
  summary: string;
}

export interface WorldviewCharacterItem {
  name: string;
  role: string;
  trait: string;
  bio: string;
}

export interface HealingWorldview {
  userId: string;
  universeTitle: string;
  tagline: string;
  genreTags: string[];
  prologueMd: string;
  timeline: WorldviewTimelineItem[];
  characters: WorldviewCharacterItem[];
  nonCommercialPledge: boolean;
  updatedAt: string;
}

export type CreationKind = "album" | "exhibition" | "novel";

export interface AlbumTrackItem {
  title: string;
  audioUrl: string;
  durationSec?: number;
  lyricsOrMood: string;
}

export interface ExhibitionPieceItem {
  title: string;
  imageUrl: string;
  docentNote: string;
}

export interface NovelChapterItem {
  chapterTitle: string;
  body: string;
}

export type CreationPayloadItem =
  | AlbumTrackItem
  | ExhibitionPieceItem
  | NovelChapterItem;

export interface HealingCreationItem {
  id: string;
  userId: string;
  kind: CreationKind;
  title: string;
  subtitle: string;
  coverUrl: string | null;
  loreConnection: string;
  creatorNote: string;
  aiTools: string[];
  items: CreationPayloadItem[];
  resonanceCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DonationShowcaseItem {
  id: string;
  title: string;
  description: string;
  category: string;
  pmcAmount: number;
  createdAt: string;
}

export interface GameShowcaseItem {
  gameId: string;
  slug: string;
  title: string;
  category: string;
  subcategory: string | null;
  status: string;
  registrationEnd: string | null;
  createdAt: string;
}

export interface PredictionShowcaseItem {
  predictionId: string;
  gameId: string;
  gameTitle: string;
  gameSlug: string;
  betAmount: number;
  confidenceLevel: number;
  createdAt: string;
}

export interface GuestbookEntryItem {
  id: string;
  roomUserId: string;
  authorUserId: string | null;
  authorName: string;
  authorMinimi: string;
  relationLabel: string;
  content: string;
  createdAt: string;
}

export interface OwnerActivityStats {
  pmpBalance: number;
  pmcBalance: number;
  contributionScore: number;
  overallRank: number | null;
  donationCount: number;
  totalDonatedPmc: number;
  createdGamesCount: number;
  predictionCount: number;
}

export interface HealingRoomPageData {
  room: HealingRoomProfile;
  isOwner: boolean;
  isAuthenticated: boolean;
  viewerUserId: string | null;
  viewerPmpBalance: number;
  viewerPmcBalance: number;
  ownerStats: OwnerActivityStats;
  trophies: HonorTrophyItem[];
  donations: DonationShowcaseItem[];
  createdGames: GameShowcaseItem[];
  recentPredictions: PredictionShowcaseItem[];
  guestbooks: GuestbookEntryItem[];
  neighbors: HealingNeighborSummary[];
  bgmTracks: BgmTrackOption[];
  worldview: HealingWorldview | null;
  creations: HealingCreationItem[];
  nextCreationPmpCost: number;
}

interface RawBgmTrackRow {
  id: string;
  label: string;
  artist: string | null;
  mood_desc: string | null;
  audio_url: string | null;
  frequencies: unknown;
  waveform: string | null;
}

const VALID_WAVEFORMS: ReadonlySet<OscillatorType> = new Set([
  "sine",
  "triangle",
  "square",
  "sawtooth",
]);

function normalizeFrequencies(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    const parsed = raw
      .map((item) => Number(item))
      .filter((num) => Number.isFinite(num) && num > 0);
    if (parsed.length > 0) return parsed;
  }
  return [220, 261.63, 329.63, 392.0];
}

export async function listActiveHealingRoomBgms(): Promise<BgmTrackOption[]> {
  try {
    const { data, error } = await supabaseAdmin
      .schema("user")
      .from("healing_room_bgm_tracks")
      .select("id, label, artist, mood_desc, audio_url, frequencies, waveform")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !Array.isArray(data) || data.length === 0) {
      return [...BGM_TRACKS];
    }

    return (data as RawBgmTrackRow[]).map((row) => {
      const waveformCandidate = (row.waveform ?? "sine") as OscillatorType;
      return {
        id: row.id,
        label: row.label,
        artist: row.artist?.trim() || "PosMul Studio",
        moodDesc: row.mood_desc?.trim() || "",
        audioUrl: row.audio_url?.trim() || undefined,
        frequencies: normalizeFrequencies(row.frequencies),
        waveform: VALID_WAVEFORMS.has(waveformCandidate) ? waveformCandidate : "sine",
      };
    });
  } catch {
    return [...BGM_TRACKS];
  }
}

export interface LoadHealingRoomOptions {
  viewerUserId: string | null;
  targetUserId?: string | null;
  wave?: boolean;
  currentRoomUserId?: string | null;
  incrementVisit?: boolean;
}

export interface UpdateHealingRoomInput {
  roomTitle?: string;
  statusMessage?: string;
  moodTag?: string;
  bgmTrack?: string;
  roomTheme?: string;
  minimiStyle?: string;
  minimiQuote?: string;
  placedItems?: string[];
}

export interface BuyHealingItemInput {
  itemId: string;
  equipOnBuy?: boolean;
}

export interface WriteGuestbookInput {
  roomUserId: string;
  content: string;
  guestName?: string;
  relationLabel?: string;
}

interface RawHealingRoomRow {
  user_id: string;
  owner_nickname: string;
  room_title: string;
  status_message: string;
  mood_tag: string;
  bgm_track: string;
  room_theme: string;
  minimi_style: string;
  minimi_quote: string;
  placed_items: unknown;
  owned_items: unknown;
  today_visits: number;
  total_visits: number;
  last_visit_date: string;
  region_label: string;
}

interface RawAccountRow {
  pmp_balance: number | string | null;
  pmc_balance: number | string | null;
}

interface RawUserScoreRow {
  sido: string | null;
  sigungu: string | null;
  contribution_score: number | null;
  overall_rank: number | null;
  donation_count: number | null;
  donation_total_pmc: number | null;
  total_pmc_donated: number | null;
  expect_participations: number | null;
}

interface RawDonationRow {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  pmc_amount: number | string | null;
  amount: number | string | null;
  created_at: string;
}

interface RawPredictionGameRow {
  game_id: string;
  slug: string | null;
  title: string;
  category: string | null;
  subcategory: string | null;
  status: string | null;
  registration_end: string | null;
  created_at: string;
}

interface RawPredictionRow {
  prediction_id: string;
  game_id: string;
  bet_amount: number | string | null;
  confidence_level: number | string | null;
  created_at: string;
}

interface RawGuestbookRow {
  id: string;
  room_user_id: string;
  author_user_id: string | null;
  author_name: string;
  author_minimi: string;
  relation_label: string;
  content: string;
  created_at: string;
}

export class HealingRoomError extends Error {
  public readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "HealingRoomError";
    this.status = status;
  }
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

function getTodayKstDateString(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

function parseStringArray(raw: unknown, fallback: ReadonlyArray<string>): string[] {
  if (!Array.isArray(raw)) {
    return [...fallback];
  }
  const filtered = raw.filter((item): item is string => typeof item === "string" && item.length > 0);
  return filtered.length > 0 ? Array.from(new Set(filtered)) : [...fallback];
}

function mergeDefaultOwned(owned: string[]): string[] {
  return Array.from(new Set([...DEFAULT_OWNED_ITEMS, ...owned]));
}

function mapRawRoomToProfile(row: RawHealingRoomRow): HealingRoomProfile {
  return {
    userId: row.user_id,
    ownerNickname: row.owner_nickname,
    roomTitle: row.room_title,
    statusMessage: row.status_message,
    moodTag: row.mood_tag,
    bgmTrack: row.bgm_track,
    roomTheme: row.room_theme,
    minimiStyle: row.minimi_style,
    minimiQuote: row.minimi_quote,
    placedItems: parseStringArray(row.placed_items, DEFAULT_PLACED_ITEMS),
    ownedItems: mergeDefaultOwned(parseStringArray(row.owned_items, DEFAULT_OWNED_ITEMS)),
    todayVisits: Number(row.today_visits ?? 0),
    totalVisits: Number(row.total_visits ?? 0),
    lastVisitDate: String(row.last_visit_date ?? getTodayKstDateString()),
    regionLabel: row.region_label,
  };
}

function normalizeNumber(value: number | string | null | undefined): number {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

async function fetchAccountBalances(userId: string): Promise<{ pmpBalance: number; pmcBalance: number }> {
  const { data } = await supabaseAdmin
    .schema("economy")
    .from("pmp_pmc_accounts")
    .select("pmp_balance, pmc_balance")
    .eq("user_id", userId)
    .maybeSingle();

  const row = data as RawAccountRow | null;
  return {
    pmpBalance: Math.max(0, Math.round(normalizeNumber(row?.pmp_balance))),
    pmcBalance: Math.max(0, normalizeNumber(row?.pmc_balance)),
  };
}

/**
 * 사용자의 힐링룸 레코드를 보장하고 방문자 카운트/일일 투데이 롤오버를 갱신합니다.
 */
async function ensureAndLoadRoom(
  targetUserId: string,
  incrementVisit: boolean
): Promise<HealingRoomProfile> {
  const { data: existingRaw, error: fetchError } = await supabaseAdmin
    .schema("user")
    .from("healing_rooms")
    .select("*")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (fetchError) {
    throw new HealingRoomError(`힐링룸 정보를 불러오지 못했습니다: ${fetchError.message}`, 500);
  }

  const todayStr = getTodayKstDateString();

  if (existingRaw) {
    const existing = existingRaw as RawHealingRoomRow;
    const existingDate = String(existing.last_visit_date).slice(0, 10);
    const isNewDay = existingDate !== todayStr;

    if (isNewDay || incrementVisit) {
      const nextTodayVisits = isNewDay
        ? incrementVisit
          ? 1
          : 0
        : Number(existing.today_visits ?? 0) + (incrementVisit ? 1 : 0);
      const nextTotalVisits = Number(existing.total_visits ?? 0) + (incrementVisit ? 1 : 0);

      const { data: updatedRaw } = await supabaseAdmin
        .schema("user")
        .from("healing_rooms")
        .update({
          today_visits: nextTodayVisits,
          total_visits: nextTotalVisits,
          last_visit_date: todayStr,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", targetUserId)
        .select("*")
        .maybeSingle();

      if (updatedRaw) {
        return mapRawRoomToProfile(updatedRaw as RawHealingRoomRow);
      }
    }

    return mapRawRoomToProfile(existing);
  }

  // 레코드가 없는 신규/실 유저라면 프로필 및 랭킹 스코어에서 기본 정보를 가져와 자동 개설
  const [{ data: profileData }, { data: scoreData }] = await Promise.all([
    supabaseAdmin
      .schema("user")
      .from("profiles")
      .select("display_name, username")
      .eq("id", targetUserId)
      .maybeSingle(),
    supabaseAdmin
      .schema("ranking")
      .from("user_scores")
      .select("sido, sigungu")
      .eq("user_id", targetUserId)
      .maybeSingle(),
  ]);

  const nicknameRaw =
    (profileData as { display_name?: string | null; username?: string | null } | null)?.display_name ||
    (profileData as { display_name?: string | null; username?: string | null } | null)?.username ||
    "PosMul 시민";
  const ownerNickname = nicknameRaw.slice(0, 40);

  const scoreRegion = scoreData as { sido?: string | null; sigungu?: string | null } | null;
  const regionParts = [scoreRegion?.sido, scoreRegion?.sigungu].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0
  );
  const regionLabel = regionParts.length > 0 ? regionParts.join(" ").slice(0, 60) : "대한민국 광장";

  const newRowPayload = {
    user_id: targetUserId,
    owner_nickname: ownerNickname,
    room_title: `${ownerNickname}의 작은 힐링룸`,
    status_message: "오늘도 세상의 변화를 즐겁게 예측하고 따뜻하게 나눕니다.",
    mood_tag: "평온 ☕",
    bgm_track: DEFAULT_BGM_ID,
    room_theme: DEFAULT_THEME_ID,
    minimi_style: DEFAULT_MINIMI_ID,
    minimi_quote: "함께 예측하고, 함께 나누자!",
    placed_items: [...DEFAULT_PLACED_ITEMS],
    owned_items: [...DEFAULT_OWNED_ITEMS],
    today_visits: incrementVisit ? 1 : 0,
    total_visits: incrementVisit ? 1 : 0,
    last_visit_date: todayStr,
    region_label: regionLabel,
  };

  const { data: insertedRaw, error: insertError } = await supabaseAdmin
    .schema("user")
    .from("healing_rooms")
    .upsert(newRowPayload, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (insertError || !insertedRaw) {
    throw new HealingRoomError(
      `힐링룸을 초기화하지 못했습니다: ${insertError?.message ?? "unknown"}`,
      500
    );
  }

  return mapRawRoomToProfile(insertedRaw as RawHealingRoomRow);
}

async function fetchNeighborRooms(): Promise<HealingNeighborSummary[]> {
  const [{ data }, { data: wvRows }, { data: crRows }] = await Promise.all([
    supabaseAdmin
      .schema("user")
      .from("healing_rooms")
      .select("user_id, owner_nickname, room_title, minimi_style, region_label, today_visits, total_visits")
      .order("total_visits", { ascending: false })
      .limit(30),
    supabaseAdmin
      .schema("user")
      .from("healing_worldviews")
      .select("user_id, universe_title"),
    supabaseAdmin
      .schema("user")
      .from("healing_creations")
      .select("user_id")
      .eq("is_published", true),
  ]);

  if (!Array.isArray(data)) {
    return [];
  }

  const universeMap = new Map<string, string>();
  if (Array.isArray(wvRows)) {
    for (const wv of wvRows as Array<{ user_id: string; universe_title: string }>) {
      universeMap.set(wv.user_id, wv.universe_title);
    }
  }

  const creationCountMap = new Map<string, number>();
  if (Array.isArray(crRows)) {
    for (const cr of crRows as Array<{ user_id: string }>) {
      creationCountMap.set(cr.user_id, (creationCountMap.get(cr.user_id) ?? 0) + 1);
    }
  }

  return data.map((row) => {
    const item = row as {
      user_id: string;
      owner_nickname: string;
      room_title: string;
      minimi_style: string;
      region_label: string;
      today_visits: number;
      total_visits: number;
    };
    return {
      userId: item.user_id,
      ownerNickname: item.owner_nickname,
      roomTitle: item.room_title,
      minimiStyle: item.minimi_style,
      regionLabel: item.region_label,
      todayVisits: Number(item.today_visits ?? 0),
      totalVisits: Number(item.total_visits ?? 0),
      universeTitle: universeMap.get(item.user_id) ?? null,
      creationsCount: creationCountMap.get(item.user_id) ?? 0,
    };
  });
}

/**
 * 파도타기(wave) 시 현재 방을 제외하고, 세계관/창작물을 보유한 이웃을 우선 랜덤 선택합니다.
 */
function pickWaveNeighborUserId(
  neighbors: HealingNeighborSummary[],
  currentRoomUserId: string | null | undefined,
  fallbackUserId: string
): string {
  if (neighbors.length === 0) {
    return fallbackUserId;
  }
  const others = neighbors.filter((n) => n.userId !== currentRoomUserId);
  if (others.length === 0) {
    return neighbors[0].userId;
  }
  const creativeOthers = others.filter(
    (n) => Boolean(n.universeTitle) || (n.creationsCount ?? 0) > 0
  );
  const pool = creativeOthers.length > 0 ? creativeOthers : others;
  const randomIdx = Math.floor(Math.random() * pool.length);
  return pool[randomIdx].userId;
}

/**
 * 힐링룸 페이지/API 전체 데이터를 로드합니다.
 */
export async function loadHealingRoomData(
  options: LoadHealingRoomOptions
): Promise<HealingRoomPageData> {
  const { viewerUserId, targetUserId, wave, currentRoomUserId, incrementVisit = false } = options;
  const neighbors = await fetchNeighborRooms();

  const baseTargetId = isValidUuid(targetUserId)
    ? targetUserId
    : isValidUuid(viewerUserId)
      ? viewerUserId
      : DEMO_HEALING_ROOM_USER_ID;

  const resolvedRoomUserId = wave
    ? pickWaveNeighborUserId(neighbors, currentRoomUserId ?? baseTargetId, baseTargetId)
    : baseTargetId;

  const room = await ensureAndLoadRoom(resolvedRoomUserId, incrementVisit);

  // 방 주인 활동 실적, 기부 내역, 개설 게임, 참여 예측, 방명록을 병렬 조회
  const [
    ownerAccount,
    viewerAccount,
    { data: scoreRaw },
    { data: donationRowsRaw, count: donationExactCount },
    { data: createdGameRowsRaw, count: createdGamesExactCount },
    { data: predictionRowsRaw, count: predictionExactCount },
    { data: guestbookRowsRaw },
    baseBgmTracks,
    { data: worldviewRaw },
    { data: creationRowsRaw },
  ] = await Promise.all([
    fetchAccountBalances(room.userId),
    viewerUserId && viewerUserId !== room.userId
      ? fetchAccountBalances(viewerUserId)
      : Promise.resolve<{ pmpBalance: number; pmcBalance: number } | null>(null),
    supabaseAdmin
      .schema("ranking")
      .from("user_scores")
      .select(
        "sido, sigungu, contribution_score, overall_rank, donation_count, donation_total_pmc, total_pmc_donated, expect_participations"
      )
      .eq("user_id", room.userId)
      .maybeSingle(),
    supabaseAdmin
      .schema("donation")
      .from("donations")
      .select("id, title, description, category, pmc_amount, amount, created_at", {
        count: "exact",
      })
      .eq("donor_id", room.userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, slug, title, category, subcategory, status, registration_end, created_at", {
        count: "exact",
      })
      .eq("creator_id", room.userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin
      .schema("prediction")
      .from("predictions")
      .select("prediction_id, game_id, bet_amount, confidence_level, created_at", {
        count: "exact",
      })
      .eq("user_id", room.userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin
      .schema("user")
      .from("healing_room_guestbooks")
      .select("id, room_user_id, author_user_id, author_name, author_minimi, relation_label, content, created_at")
      .eq("room_user_id", room.userId)
      .order("created_at", { ascending: false })
      .limit(30),
    listActiveHealingRoomBgms(),
    supabaseAdmin
      .schema("user")
      .from("healing_worldviews")
      .select("*")
      .eq("user_id", room.userId)
      .maybeSingle(),
    supabaseAdmin
      .schema("user")
      .from("healing_creations")
      .select("*")
      .eq("user_id", room.userId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const userScore = scoreRaw as RawUserScoreRow | null;
  const rawDonations = (donationRowsRaw ?? []) as RawDonationRow[];
  const rawCreatedGames = (createdGameRowsRaw ?? []) as RawPredictionGameRow[];
  const rawPredictions = (predictionRowsRaw ?? []) as RawPredictionRow[];
  const rawGuestbooks = (guestbookRowsRaw ?? []) as RawGuestbookRow[];

  // 참여 예측에 연결된 게임 제목/슬러그 보강 조회
  const predictionGameIds = Array.from(new Set(rawPredictions.map((p) => p.game_id)));
  const gameTitleMap = new Map<string, { title: string; slug: string }>();

  if (predictionGameIds.length > 0) {
    const { data: linkedGames } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, title, slug")
      .in("game_id", predictionGameIds);

    if (Array.isArray(linkedGames)) {
      for (const item of linkedGames) {
        const g = item as { game_id: string; title: string; slug: string | null };
        gameTitleMap.set(g.game_id, {
          title: g.title,
          slug: g.slug || g.game_id,
        });
      }
    }
  }

  const donations: DonationShowcaseItem[] = rawDonations.map((row) => ({
    id: row.id,
    title: row.title?.trim() || "PosMul 투명 나눔",
    description: row.description?.trim() || "지속 가능한 공공선 실현을 위한 PMC 기부",
    category: row.category?.trim() || "공공나눔",
    pmcAmount: Math.round(normalizeNumber(row.pmc_amount ?? row.amount)),
    createdAt: row.created_at,
  }));

  const createdGames: GameShowcaseItem[] = rawCreatedGames.map((row) => ({
    gameId: row.game_id,
    slug: row.slug?.trim() || row.game_id,
    title: row.title,
    category: row.category?.trim() || "COMMUNITY",
    subcategory: row.subcategory,
    status: row.status?.trim() || "ACTIVE",
    registrationEnd: row.registration_end,
    createdAt: row.created_at,
  }));

  const recentPredictions: PredictionShowcaseItem[] = rawPredictions.map((row) => {
    const linked = gameTitleMap.get(row.game_id);
    return {
      predictionId: row.prediction_id,
      gameId: row.game_id,
      gameTitle: linked?.title ?? "집단지성 예측 라운드",
      gameSlug: linked?.slug ?? row.game_id,
      betAmount: Math.round(normalizeNumber(row.bet_amount)),
      confidenceLevel: normalizeNumber(row.confidence_level),
      createdAt: row.created_at,
    };
  });

  const guestbooks: GuestbookEntryItem[] = rawGuestbooks.map((row) => ({
    id: row.id,
    roomUserId: row.room_user_id,
    authorUserId: row.author_user_id,
    authorName: row.author_name,
    authorMinimi: row.author_minimi,
    relationLabel: row.relation_label,
    content: row.content,
    createdAt: row.created_at,
  }));

  const sumDonationPmc = donations.reduce((acc, item) => acc + item.pmcAmount, 0);
  const donationCount = Math.max(donationExactCount ?? 0, Number(userScore?.donation_count ?? 0));
  const totalDonatedPmc = Math.max(
    sumDonationPmc,
    Number(userScore?.donation_total_pmc ?? 0),
    Number(userScore?.total_pmc_donated ?? 0)
  );
  const createdGamesCount = createdGamesExactCount ?? createdGames.length;
  const predictionCount = Math.max(
    predictionExactCount ?? 0,
    Number(userScore?.expect_participations ?? 0)
  );

  const trophies = computeHonorTrophies({
    donationCount,
    totalDonatedPmc,
    createdGamesCount,
    predictionCount,
    totalVisits: room.totalVisits,
    guestbookCount: guestbooks.length,
  });

  const worldview: HealingWorldview | null = worldviewRaw
    ? (() => {
        const wv = worldviewRaw as {
          user_id: string;
          universe_title: string;
          tagline: string | null;
          genre_tags: string[] | null;
          prologue_md: string | null;
          timeline_json: unknown;
          characters_json: unknown;
          non_commercial_pledge: boolean | null;
          updated_at: string;
        };
        return {
          userId: wv.user_id,
          universeTitle: wv.universe_title,
          tagline: wv.tagline ?? "",
          genreTags: Array.isArray(wv.genre_tags) ? wv.genre_tags : [],
          prologueMd: wv.prologue_md ?? "",
          timeline: Array.isArray(wv.timeline_json) ? (wv.timeline_json as WorldviewTimelineItem[]) : [],
          characters: Array.isArray(wv.characters_json) ? (wv.characters_json as WorldviewCharacterItem[]) : [],
          nonCommercialPledge: wv.non_commercial_pledge ?? true,
          updatedAt: wv.updated_at,
        };
      })()
    : null;

  const creations: HealingCreationItem[] = Array.isArray(creationRowsRaw)
    ? (
        creationRowsRaw as Array<{
          id: string;
          user_id: string;
          kind: CreationKind;
          title: string;
          subtitle: string | null;
          cover_url: string | null;
          lore_connection: string | null;
          creator_note: string | null;
          ai_tools: string[] | null;
          items_json: unknown;
          resonance_count: number | null;
          is_published: boolean | null;
          created_at: string;
          updated_at: string;
        }>
      ).map((cr) => ({
        id: cr.id,
        userId: cr.user_id,
        kind: cr.kind,
        title: cr.title,
        subtitle: cr.subtitle ?? "",
        coverUrl: cr.cover_url ?? null,
        loreConnection: cr.lore_connection ?? "",
        creatorNote: cr.creator_note ?? "",
        aiTools: Array.isArray(cr.ai_tools) ? cr.ai_tools : [],
        items: Array.isArray(cr.items_json) ? (cr.items_json as CreationPayloadItem[]) : [],
        resonanceCount: Number(cr.resonance_count ?? 0),
        isPublished: cr.is_published ?? true,
        createdAt: cr.created_at,
        updatedAt: cr.updated_at,
      }))
    : [];

  // 자작 앨범 트랙들을 방 주크박스 리스트 상단에 편입
  const customAlbumTracks: BgmTrackOption[] = [];
  for (const cr of creations) {
    if (cr.kind !== "album") continue;
    cr.items.forEach((rawTrack, idx) => {
      const track = rawTrack as AlbumTrackItem;
      if (!track?.title) return;
      customAlbumTracks.push({
        id: `custom-${cr.id}-${idx}`,
        label: `💿 ${track.title} · ${cr.title}`,
        artist: room.ownerNickname,
        moodDesc: track.lyricsOrMood || cr.subtitle || "자작 창작 앨범 트랙",
        audioUrl: track.audioUrl?.trim() || undefined,
        frequencies: [220, 277.18, 329.63, 440],
        waveform: "triangle",
      });
    });
  }
  const bgmTracks: BgmTrackOption[] = [...customAlbumTracks, ...baseBgmTracks];

  // 이웃 목록에 본인 방 최신 정보 동기화
  const refreshedNeighbors = neighbors.some((n) => n.userId === room.userId)
    ? neighbors.map((n) =>
        n.userId === room.userId
          ? {
              userId: room.userId,
              ownerNickname: room.ownerNickname,
              roomTitle: room.roomTitle,
              minimiStyle: room.minimiStyle,
              regionLabel: room.regionLabel,
              todayVisits: room.todayVisits,
              totalVisits: room.totalVisits,
              universeTitle: worldview?.universeTitle ?? n.universeTitle ?? null,
              creationsCount: creations.length,
            }
          : n
      )
    : [
        {
          userId: room.userId,
          ownerNickname: room.ownerNickname,
          roomTitle: room.roomTitle,
          minimiStyle: room.minimiStyle,
          regionLabel: room.regionLabel,
          todayVisits: room.todayVisits,
          totalVisits: room.totalVisits,
          universeTitle: worldview?.universeTitle ?? null,
          creationsCount: creations.length,
        },
        ...neighbors,
      ];

  const isOwner = Boolean(viewerUserId && viewerUserId === room.userId);
  const resolvedViewerBalances = viewerAccount ?? (isOwner ? ownerAccount : { pmpBalance: 0, pmcBalance: 0 });
  const nextCreationPmpCost = creations.length >= 3 ? 20 : 0;

  return {
    room,
    isOwner,
    isAuthenticated: Boolean(viewerUserId),
    viewerUserId,
    viewerPmpBalance: resolvedViewerBalances.pmpBalance,
    viewerPmcBalance: resolvedViewerBalances.pmcBalance,
    ownerStats: {
      pmpBalance: ownerAccount.pmpBalance,
      pmcBalance: ownerAccount.pmcBalance,
      contributionScore: Number(userScore?.contribution_score ?? 0),
      overallRank: userScore?.overall_rank ?? null,
      donationCount,
      totalDonatedPmc,
      createdGamesCount,
      predictionCount,
    },
    trophies,
    donations,
    createdGames,
    recentPredictions,
    guestbooks,
    neighbors: refreshedNeighbors,
    bgmTracks,
    worldview,
    creations,
    nextCreationPmpCost,
  };
}

function assertValidTextLength(value: string, fieldName: string, min: number, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new HealingRoomError(
      `${fieldName}은(는) ${min}자 이상 ${max}자 이하로 입력해주세요.`,
      400
    );
  }
  return trimmed;
}

/**
 * 힐링룸 프로필, BGM, 테마, 미니미, 배치 소품을 업데이트합니다. (본인 소유권·보유 아이템 검증 포함)
 */
export async function updateHealingRoom(
  viewerUserId: string | null,
  input: UpdateHealingRoomInput
): Promise<HealingRoomPageData> {
  if (!isValidUuid(viewerUserId)) {
    throw new HealingRoomError("로그인 후 나만의 힐링룸을 꾸밀 수 있습니다.", 401);
  }

  const room = await ensureAndLoadRoom(viewerUserId, false);
  const ownedSet = new Set(room.ownedItems);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof input.roomTitle === "string") {
    patch.room_title = assertValidTextLength(input.roomTitle, "미니홈피 제목", 1, 50);
  }
  if (typeof input.statusMessage === "string") {
    patch.status_message = assertValidTextLength(input.statusMessage, "상태 메시지", 0, 140);
  }
  if (typeof input.minimiQuote === "string") {
    patch.minimi_quote = assertValidTextLength(input.minimiQuote, "미니미 말풍선", 0, 60);
  }
  if (typeof input.moodTag === "string") {
    patch.mood_tag = assertValidTextLength(input.moodTag, "오늘의 기분", 1, 20);
  }
  if (typeof input.bgmTrack === "string") {
    const activeBgms = await listActiveHealingRoomBgms();
    const isCustomAlbumTrack = input.bgmTrack.startsWith("custom-");
    const validBgm =
      isCustomAlbumTrack ||
      activeBgms.some((track) => track.id === input.bgmTrack) ||
      BGM_TRACKS.some((track) => track.id === input.bgmTrack);
    if (!validBgm) {
      throw new HealingRoomError("지원하지 않는 BGM 트랙입니다.", 400);
    }
    patch.bgm_track = input.bgmTrack;
  }
  if (typeof input.roomTheme === "string") {
    const validTheme = ROOM_THEMES.find((theme) => theme.id === input.roomTheme);
    if (!validTheme) {
      throw new HealingRoomError("존재하지 않는 미니룸 테마입니다.", 400);
    }
    if (validTheme.pricePmp > 0 && !ownedSet.has(validTheme.id)) {
      throw new HealingRoomError("아직 보유하지 않은 미니룸 테마입니다. 상점에서 먼저 구매해주세요.", 403);
    }
    patch.room_theme = validTheme.id;
  }
  if (typeof input.minimiStyle === "string") {
    const validMinimi = MINIMI_STYLES.find((style) => style.id === input.minimiStyle);
    if (!validMinimi) {
      throw new HealingRoomError("존재하지 않는 미니미 스타일입니다.", 400);
    }
    if (validMinimi.pricePmp > 0 && !ownedSet.has(validMinimi.id)) {
      throw new HealingRoomError("아직 보유하지 않은 미니미 코디입니다. 상점에서 먼저 구매해주세요.", 403);
    }
    patch.minimi_style = validMinimi.id;
  }
  if (Array.isArray(input.placedItems)) {
    const uniqueProps = Array.from(new Set(input.placedItems)).slice(0, 8);
    for (const propId of uniqueProps) {
      const validProp = ROOM_PROPS.find((prop) => prop.id === propId);
      if (!validProp) {
        throw new HealingRoomError(`존재하지 않는 가구 소품입니다: ${propId}`, 400);
      }
      if (validProp.pricePmp > 0 && !ownedSet.has(validProp.id)) {
        throw new HealingRoomError(`보유하지 않은 소품(${validProp.name})은 배치할 수 없습니다.`, 403);
      }
    }
    patch.placed_items = uniqueProps;
  }

  const { error: updateError } = await supabaseAdmin
    .schema("user")
    .from("healing_rooms")
    .update(patch)
    .eq("user_id", viewerUserId);

  if (updateError) {
    throw new HealingRoomError(`힐링룸 저장에 실패했습니다: ${updateError.message}`, 500);
  }

  return loadHealingRoomData({
    viewerUserId,
    targetUserId: viewerUserId,
    incrementVisit: false,
  });
}

/**
 * PMP 전용 상점 아이템 구매 (경제 불변식: PMP_SPEND만 사용, 실패 시 전액 롤백)
 */
export async function buyHealingRoomItem(
  viewerUserId: string | null,
  input: BuyHealingItemInput
): Promise<HealingRoomPageData> {
  if (!isValidUuid(viewerUserId)) {
    throw new HealingRoomError("로그인 후 보유 PMP로 힐링룸 아이템을 구매할 수 있습니다.", 401);
  }

  const item = findHealingItemById(input.itemId);
  if (!item) {
    throw new HealingRoomError("존재하지 않는 상점 아이템입니다.", 404);
  }

  const room = await ensureAndLoadRoom(viewerUserId, false);
  const ownedSet = new Set(room.ownedItems);

  if (ownedSet.has(item.id)) {
    throw new HealingRoomError(`이미 보유 중인 아이템입니다: ${item.name}`, 409);
  }

  const pricePmp = Math.max(0, Math.round(item.pricePmp));
  const account = await fetchAccountBalances(viewerUserId);

  if (account.pmpBalance < pricePmp) {
    throw new HealingRoomError(
      `보유 PMP가 부족합니다. (현재 ${account.pmpBalance.toLocaleString()} PMP / 필요 ${pricePmp.toLocaleString()} PMP)`,
      400
    );
  }

  const nextPmpBalance = account.pmpBalance - pricePmp;

  // 1단계: 유료 아이템인 경우 낙관적 동시성 제어로 PMP 차감 (PMC 잔액 불변)
  if (pricePmp > 0) {
    const { data: updatedAccount, error: debitError } = await supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_accounts")
      .update({
        pmp_balance: nextPmpBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", viewerUserId)
      .eq("pmp_balance", account.pmpBalance)
      .select("pmp_balance")
      .maybeSingle();

    if (debitError || !updatedAccount) {
      throw new HealingRoomError(
        debitError
          ? `PMP 차감 처리 중 오류가 발생했습니다: ${debitError.message}`
          : "PMP 잔액이 변경되어 결제가 취소되었습니다. 다시 시도해주세요.",
        409
      );
    }
  }

  // 2단계: 힐링룸 보유 목록 및 즉시 장착 반영 (실패 시 PMP 롤백)
  const nextOwnedItems = Array.from(new Set([...room.ownedItems, item.id]));
  const roomPatch: Record<string, unknown> = {
    owned_items: nextOwnedItems,
    updated_at: new Date().toISOString(),
  };

  if (input.equipOnBuy !== false) {
    if (item.category === "theme") {
      roomPatch.room_theme = item.id;
    } else if (item.category === "minimi") {
      roomPatch.minimi_style = item.id;
    } else if (item.category === "prop") {
      roomPatch.placed_items = Array.from(new Set([...room.placedItems, item.id])).slice(0, 8);
    }
  }

  const { error: roomUpdateError } = await supabaseAdmin
    .schema("user")
    .from("healing_rooms")
    .update(roomPatch)
    .eq("user_id", viewerUserId);

  if (roomUpdateError) {
    if (pricePmp > 0) {
      await supabaseAdmin
        .schema("economy")
        .from("pmp_pmc_accounts")
        .update({
          pmp_balance: account.pmpBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", viewerUserId);
    }
    throw new HealingRoomError(
      `아이템 보유 정보 저장에 실패하여 PMP가 안전하게 복원되었습니다: ${roomUpdateError.message}`,
      500
    );
  }

  // 3단계: 경제 원장(economy.pmp_pmc_transactions)에 PMP_SPEND 기록
  if (pricePmp > 0) {
    const { error: ledgerError } = await supabaseAdmin
      .schema("economy")
      .from("pmp_pmc_transactions")
      .insert({
        user_id: viewerUserId,
        transaction_type: "PMP_SPEND",
        pmp_amount: -pricePmp,
        pmc_amount: 0,
        description: `힐링룸 상점 구매: ${item.name}`,
        metadata: {
          source: "healing_room",
          item_id: item.id,
          item_category: item.category,
          price_pmp: pricePmp,
        },
      });

    if (ledgerError) {
      // 원장 기록 실패 시에도 방 보유 정보 & PMP 잔액을 원상 복구하여 무결성 수호
      await Promise.all([
        supabaseAdmin
          .schema("user")
          .from("healing_rooms")
          .update({
            owned_items: room.ownedItems,
            room_theme: room.roomTheme,
            minimi_style: room.minimiStyle,
            placed_items: room.placedItems,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", viewerUserId),
        supabaseAdmin
          .schema("economy")
          .from("pmp_pmc_accounts")
          .update({
            pmp_balance: account.pmpBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", viewerUserId),
      ]);
      throw new HealingRoomError(
        `경제 원장 기록에 실패하여 구매가 안전하게 취소되었습니다: ${ledgerError.message}`,
        500
      );
    }
  }

  return loadHealingRoomData({
    viewerUserId,
    targetUserId: viewerUserId,
    incrementVisit: false,
  });
}

/**
 * 힐링룸 일촌평/방명록을 작성합니다. (로그인 유저 및 방문 손님 모두 지원)
 */
export async function writeHealingRoomGuestbook(
  viewerUserId: string | null,
  input: WriteGuestbookInput
): Promise<HealingRoomPageData> {
  if (!isValidUuid(input.roomUserId)) {
    throw new HealingRoomError("방 주인 식별자가 올바르지 않습니다.", 400);
  }

  const content = assertValidTextLength(input.content, "방명록 내용", 2, 200);
  await ensureAndLoadRoom(input.roomUserId, false);

  let authorName = input.guestName?.trim().slice(0, 20) || "지나가는 시민";
  let authorMinimi = DEFAULT_MINIMI_ID;
  let relationLabel = input.relationLabel?.trim().slice(0, 15) || "동네 손님";

  if (isValidUuid(viewerUserId)) {
    const viewerRoom = await ensureAndLoadRoom(viewerUserId, false);
    authorName = viewerRoom.ownerNickname;
    authorMinimi = viewerRoom.minimiStyle;
    relationLabel =
      viewerUserId === input.roomUserId
        ? "방 주인"
        : input.relationLabel?.trim().slice(0, 15) || "PosMul 일촌";
  }

  const { error: insertError } = await supabaseAdmin
    .schema("user")
    .from("healing_room_guestbooks")
    .insert({
      room_user_id: input.roomUserId,
      author_user_id: isValidUuid(viewerUserId) ? viewerUserId : null,
      author_name: authorName,
      author_minimi: authorMinimi,
      relation_label: relationLabel,
      content,
    });

  if (insertError) {
    throw new HealingRoomError(`일촌평 등록에 실패했습니다: ${insertError.message}`, 500);
  }

  return loadHealingRoomData({
    viewerUserId,
    targetUserId: input.roomUserId,
    incrementVisit: false,
  });
}

export interface SaveWorldviewInput {
  universeTitle: string;
  tagline?: string;
  genreTags?: string[];
  prologueMd?: string;
  timeline?: WorldviewTimelineItem[];
  characters?: WorldviewCharacterItem[];
  nonCommercialPledge?: boolean;
}

/**
 * 개인 창작자의 내면 세계관 바이블을 생성·수정합니다.
 */
export async function saveHealingWorldview(
  viewerUserId: string | null,
  input: SaveWorldviewInput
): Promise<HealingRoomPageData> {
  if (!isValidUuid(viewerUserId)) {
    throw new HealingRoomError("로그인 후 나만의 세계관을 작성할 수 있습니다.", 401);
  }

  const universeTitle = assertValidTextLength(input.universeTitle, "세계관 이름", 2, 60);
  const tagline = (input.tagline ?? "").trim().slice(0, 120);
  const prologueMd = (input.prologueMd ?? "").trim().slice(0, 4000);
  const genreTags = (input.genreTags ?? [])
    .map((t) => t.trim().slice(0, 20))
    .filter(Boolean)
    .slice(0, 8);
  const timeline = (input.timeline ?? [])
    .filter((item) => item && item.title?.trim())
    .slice(0, 12)
    .map((item) => ({
      era: (item.era ?? "").trim().slice(0, 30),
      title: item.title.trim().slice(0, 60),
      summary: (item.summary ?? "").trim().slice(0, 240),
    }));
  const characters = (input.characters ?? [])
    .filter((ch) => ch && ch.name?.trim())
    .slice(0, 12)
    .map((ch) => ({
      name: ch.name.trim().slice(0, 30),
      role: (ch.role ?? "").trim().slice(0, 30),
      trait: (ch.trait ?? "").trim().slice(0, 60),
      bio: (ch.bio ?? "").trim().slice(0, 260),
    }));

  await ensureAndLoadRoom(viewerUserId, false);

  const { error } = await supabaseAdmin
    .schema("user")
    .from("healing_worldviews")
    .upsert(
      {
        user_id: viewerUserId,
        universe_title: universeTitle,
        tagline,
        genre_tags: genreTags,
        prologue_md: prologueMd,
        timeline_json: timeline,
        characters_json: characters,
        non_commercial_pledge: input.nonCommercialPledge ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw new HealingRoomError(`세계관 저장에 실패했습니다: ${error.message}`, 500);
  }

  return loadHealingRoomData({
    viewerUserId,
    targetUserId: viewerUserId,
    incrementVisit: false,
  });
}

export interface SaveCreationInput {
  id?: string;
  kind: CreationKind;
  title: string;
  subtitle?: string;
  coverUrl?: string | null;
  loreConnection: string;
  creatorNote?: string;
  aiTools?: string[];
  items: CreationPayloadItem[];
}

/**
 * AI 활용 음악 앨범·그림 전시·소설을 비상업 순수 창작물로 출판합니다.
 * - 단편 슬롭 방지를 위해 세계관 연결 설명(loreConnection 8자 이상)을 필수로 확인합니다.
 * - 첫 3작품은 0 PMP 무료이며, 4번째 이상 신규 출판 시 20 PMP를 예치 소비합니다.
 */
export async function saveHealingCreation(
  viewerUserId: string | null,
  input: SaveCreationInput
): Promise<HealingRoomPageData> {
  if (!isValidUuid(viewerUserId)) {
    throw new HealingRoomError("로그인 후 작품을 출판할 수 있습니다.", 401);
  }

  if (input.kind !== "album" && input.kind !== "exhibition" && input.kind !== "novel") {
    throw new HealingRoomError("올바른 창작 형식을 선택해주세요.", 400);
  }

  const title = assertValidTextLength(input.title, "작품 제목", 2, 80);
  const loreConnection = assertValidTextLength(
    input.loreConnection ?? "",
    "내 세계관과의 연결 설명(단순 도배 방지용)",
    8,
    500
  );
  const subtitle = (input.subtitle ?? "").trim().slice(0, 120);
  const creatorNote = (input.creatorNote ?? "").trim().slice(0, 1500);
  const coverUrl = input.coverUrl?.trim() ? input.coverUrl.trim().slice(0, 1000) : null;
  const aiTools = (input.aiTools ?? [])
    .map((t) => t.trim().slice(0, 24))
    .filter(Boolean)
    .slice(0, 6);

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new HealingRoomError("최소 1개 이상의 트랙·작품·챕터를 등록해주세요.", 400);
  }

  await ensureAndLoadRoom(viewerUserId, false);

  const isEditing = Boolean(input.id && isValidUuid(input.id));
  let pmpCost = 0;

  if (!isEditing) {
    const { count } = await supabaseAdmin
      .schema("user")
      .from("healing_creations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", viewerUserId);

    if ((count ?? 0) >= 3) {
      pmpCost = 20;
      const account = await fetchAccountBalances(viewerUserId);
      if (account.pmpBalance < pmpCost) {
        throw new HealingRoomError(
          `추가 작품 출판에는 활동 포인트 ${pmpCost} PMP가 필요합니다. (보유: ${account.pmpBalance} PMP · 공론장/가치소비로 적립 가능)`,
          400
        );
      }
      const nextPmp = account.pmpBalance - pmpCost;
      const { error: spendError } = await supabaseAdmin
        .schema("economy")
        .from("pmp_pmc_accounts")
        .update({ pmp_balance: nextPmp, updated_at: new Date().toISOString() })
        .eq("user_id", viewerUserId);

      if (spendError) {
        throw new HealingRoomError(`PMP 차감 중 오류: ${spendError.message}`, 500);
      }

      const { error: ledgerError } = await supabaseAdmin
        .schema("economy")
        .from("pmp_pmc_transactions")
        .insert({
          user_id: viewerUserId,
          transaction_type: "PMP_SPEND",
          pmp_amount: -pmpCost,
          pmc_amount: 0,
          description: `힐링룸 창작물 출판: ${title}`,
          metadata: { source: "healing_room_creation", kind: input.kind },
        });

      if (ledgerError) {
        await supabaseAdmin
          .schema("economy")
          .from("pmp_pmc_accounts")
          .update({ pmp_balance: account.pmpBalance, updated_at: new Date().toISOString() })
          .eq("user_id", viewerUserId);
        throw new HealingRoomError(`원장 기록 오류로 안전하게 취소되었습니다: ${ledgerError.message}`, 500);
      }
    }
  }

  const sanitizedItems = input.items.slice(0, 20);
  if (isEditing && input.id) {
    const { error } = await supabaseAdmin
      .schema("user")
      .from("healing_creations")
      .update({
        kind: input.kind,
        title,
        subtitle,
        cover_url: coverUrl,
        lore_connection: loreConnection,
        creator_note: creatorNote,
        ai_tools: aiTools,
        items_json: sanitizedItems,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("user_id", viewerUserId);

    if (error) {
      throw new HealingRoomError(`작품 수정에 실패했습니다: ${error.message}`, 500);
    }
  } else {
    const { error } = await supabaseAdmin
      .schema("user")
      .from("healing_creations")
      .insert({
        user_id: viewerUserId,
        kind: input.kind,
        title,
        subtitle,
        cover_url: coverUrl,
        lore_connection: loreConnection,
        creator_note: creatorNote,
        ai_tools: aiTools,
        items_json: sanitizedItems,
        is_published: true,
      });

    if (error) {
      throw new HealingRoomError(`작품 출판에 실패했습니다: ${error.message}`, 500);
    }
  }

  return loadHealingRoomData({
    viewerUserId,
    targetUserId: viewerUserId,
    incrementVisit: false,
  });
}

/**
 * 본인 창작물을 삭제합니다.
 */
export async function deleteHealingCreation(
  viewerUserId: string | null,
  creationId: string
): Promise<HealingRoomPageData> {
  if (!isValidUuid(viewerUserId)) {
    throw new HealingRoomError("로그인이 필요합니다.", 401);
  }
  if (!isValidUuid(creationId)) {
    throw new HealingRoomError("올바른 작품 ID가 아닙니다.", 400);
  }

  const { error } = await supabaseAdmin
    .schema("user")
    .from("healing_creations")
    .delete()
    .eq("id", creationId)
    .eq("user_id", viewerUserId);

  if (error) {
    throw new HealingRoomError(`작품 삭제에 실패했습니다: ${error.message}`, 500);
  }

  return loadHealingRoomData({
    viewerUserId,
    targetUserId: viewerUserId,
    incrementVisit: false,
  });
}

/**
 * 비상업 순수 창작물에 '공명(응원 박수)'을 보냅니다. (1인 1작품 1회)
 */
export async function resonateHealingCreation(
  viewerUserId: string | null,
  viewerKey: string,
  creationId: string
): Promise<HealingRoomPageData> {
  if (!isValidUuid(creationId)) {
    throw new HealingRoomError("올바른 작품 ID가 아닙니다.", 400);
  }

  const { data: targetRow } = await supabaseAdmin
    .schema("user")
    .from("healing_creations")
    .select("id, user_id, resonance_count")
    .eq("id", creationId)
    .maybeSingle();

  if (!targetRow) {
    throw new HealingRoomError("존재하지 않는 작품입니다.", 404);
  }

  const typedTarget = targetRow as { id: string; user_id: string; resonance_count: number };
  const resolvedKey = isValidUuid(viewerUserId) ? `u:${viewerUserId}` : viewerKey;

  const { error: dupError } = await supabaseAdmin
    .schema("user")
    .from("healing_creation_resonances")
    .insert({
      creation_id: creationId,
      viewer_key: resolvedKey.slice(0, 120),
    });

  if (dupError) {
    if (dupError.code === "23505") {
      throw new HealingRoomError("이미 이 작품에 따뜻한 공명을 보내셨습니다!", 409);
    }
    throw new HealingRoomError(`공명 기록에 실패했습니다: ${dupError.message}`, 500);
  }

  await supabaseAdmin
    .schema("user")
    .from("healing_creations")
    .update({ resonance_count: (typedTarget.resonance_count ?? 0) + 1 })
    .eq("id", creationId);

  return loadHealingRoomData({
    viewerUserId,
    targetUserId: typedTarget.user_id,
    incrementVisit: false,
  });
}
