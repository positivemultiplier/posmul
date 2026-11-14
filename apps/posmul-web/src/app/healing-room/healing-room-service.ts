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
  const { data } = await supabaseAdmin
    .schema("user")
    .from("healing_rooms")
    .select("user_id, owner_nickname, room_title, minimi_style, region_label, today_visits, total_visits")
    .order("total_visits", { ascending: false })
    .limit(20);

  if (!Array.isArray(data)) {
    return [];
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
    };
  });
}

/**
 * 파도타기(wave) 시 현재 방 다음 이웃의 userId를 순환 선택합니다.
 */
function pickWaveNeighborUserId(
  neighbors: HealingNeighborSummary[],
  currentRoomUserId: string | null | undefined,
  fallbackUserId: string
): string {
  if (neighbors.length === 0) {
    return fallbackUserId;
  }
  if (!currentRoomUserId) {
    return neighbors[0].userId;
  }
  const currentIndex = neighbors.findIndex((neighbor) => neighbor.userId === currentRoomUserId);
  if (currentIndex === -1) {
    const firstDifferent = neighbors.find((neighbor) => neighbor.userId !== currentRoomUserId);
    return firstDifferent ? firstDifferent.userId : neighbors[0].userId;
  }
  const nextIndex = (currentIndex + 1) % neighbors.length;
  return neighbors[nextIndex].userId;
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
        },
        ...neighbors,
      ];

  const isOwner = Boolean(viewerUserId && viewerUserId === room.userId);
  const resolvedViewerBalances = viewerAccount ?? (isOwner ? ownerAccount : { pmpBalance: 0, pmcBalance: 0 });

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
    const validBgm = BGM_TRACKS.some((track) => track.id === input.bgmTrack);
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
