/**
 * PosMul 계층형 Feature Flag 도메인 로직 (순수 TS, 외부 의존 0)
 * - XpressEngine 스타일 2단 계층(전역 도메인 마스터 -> 도메인별 세부 기능)
 * - 부모(parentKey)가 OFF면 하위 기능도 자동으로 비활성(Cascading OFF) 처리
 */

export type FeatureFlagDomain =
  | "system"
  | "prediction"
  | "forum"
  | "donation"
  | "consume"
  | "economy"
  | "ranking"
  | "users"
  | "healing_room";

export type FeatureFlagGroup =
  | "module"
  | "addon"
  | "automation"
  | "gate"
  | "constitution";

export interface SiteFeatureFlag {
  readonly flagKey: string;
  readonly domain: FeatureFlagDomain;
  readonly parentKey: string | null;
  readonly groupName: FeatureFlagGroup;
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly isLocked: boolean;
  readonly badge: string | null;
  readonly configJson: Record<string, unknown>;
  readonly sortOrder: number;
  readonly updatedAt: string;
}

export interface EvaluatedSiteFeatureFlag extends SiteFeatureFlag {
  readonly effectiveEnabled: boolean;
  readonly blockedByParentKey: string | null;
}

export interface FeatureFlagAuditLog {
  readonly logId: string;
  readonly flagKey: string;
  readonly domain: string;
  readonly prevEnabled: boolean;
  readonly nextEnabled: boolean;
  readonly changedByEmail: string | null;
  readonly reason: string | null;
  readonly createdAt: string;
}

export const DOMAIN_META_MAP: Record<
  FeatureFlagDomain,
  { readonly label: string; readonly adminHref: string; readonly description: string }
> = {
  prediction: {
    label: "예측 (Prediction)",
    adminHref: "/admin/prediction",
    description: "예측 마켓 · 상세 애드온 · 카테고리 · 오라클/AI 스위치",
  },
  forum: {
    label: "광장 (Forum)",
    adminHref: "/admin/forum",
    description: "게시판 · 로컬 행사 탭 · 글/댓글 킬스위치 · 봇 방어",
  },
  donation: {
    label: "기부 (Donation)",
    adminHref: "/admin/control?domain=donation",
    description: "Phase 1/2 기부 트랙 및 PMC 기부 실행 킬스위치",
  },
  consume: {
    label: "소비·광고 (Consume)",
    adminHref: "/admin/control?domain=consume",
    description: "광고 2트랙 및 Phase 3 소상공인 잠금 스위치",
  },
  economy: {
    label: "경제 (Economy)",
    adminHref: "/admin/economy",
    description: "MoneyWave · 버티컬 연동 및 v3.0 헌법 불변식",
  },
  ranking: {
    label: "랭킹 (Ranking)",
    adminHref: "/admin/control?domain=ranking",
    description: "동네 풀뿌리 랭킹 및 직업군별 명예의 전당",
  },
  users: {
    label: "회원·인증 (Users)",
    adminHref: "/admin/users",
    description: "회원가입 제어 및 서브도메인 SSO 세션",
  },
  healing_room: {
    label: "힐링룸 (Healing Room)",
    adminHref: "/admin/healing-room",
    description: "힐링룸 공간 노출 및 BGM 플레이어",
  },
  system: {
    label: "시스템·게이트 (System)",
    adminHref: "/admin/control?domain=system",
    description: "/gate 비밀번호 잠금 및 전역 점검 공지 배너",
  },
};

/**
 * DB 일시 장애 시 Fail-Safe 기본값 (안전 운영 기준)
 */
export const DEFAULT_FEATURE_FLAG_STATES: Readonly<Record<string, boolean>> = {
  "domain.prediction": true,
  "domain.forum": true,
  "domain.donation": true,
  "domain.consume": true,
  "domain.economy": true,
  "domain.ranking": true,
  "domain.users": true,
  "domain.healing_room": true,
  "prediction.action.allow_betting": true,
  "prediction.action.allow_withdraw": true,
  "prediction.action.user_proposed": true,
  "prediction.addon.naver_news": true,
  "prediction.addon.sports_badge": true,
  "prediction.addon.ai_briefing": true,
  "prediction.addon.ai_forecasts": true,
  "prediction.addon.hourglass": true,
  "prediction.addon.live_banner": true,
  "prediction.cat.economy": true,
  "prediction.cat.sports": true,
  "prediction.cat.entertainment": true,
  "prediction.cat.politics": true,
  "prediction.auto.rss_draft": true,
  "prediction.auto.oracle_settle": true,
  "prediction.auto.llm_realtime": true,
  "prediction.exp.blind_first": false,
  "prediction.exp.base_rate": false,
  "forum.action.allow_post": true,
  "forum.action.allow_comment": true,
  "forum.addon.local_events_tab": false,
  "forum.guard.ip_ban": true,
  "donation.track.institution": true,
  "donation.track.k_goods": true,
  "donation.track.opinion_leader": false,
  "donation.track.future_dream": false,
  "donation.action.allow_donate": true,
  "consume.track.network_ads": true,
  "consume.track.brand_ifrs": false,
  "consume.track.local_league": false,
  "economy.wave.moneywave1": true,
  "economy.wave.moneywave2": false,
  "economy.vertical.housing_pro": true,
  "economy.const.no_direct_pmc": true,
  "economy.const.eat_cap": true,
  "ranking.tab.region_grassroots": true,
  "ranking.tab.job_group": true,
  "users.action.allow_signup": true,
  "users.auth.sso_subdomain": true,
  "healing_room.addon.bgm_autoplay": true,
  "system.private_gate": true,
  "system.maintenance_banner": false,
};

/**
 * 부모 계층(parentKey)을 순회해 실제 유효 활성화 여부와 차단 부모 키를 계산한다.
 */
export function evaluateFlagWithHierarchy(
  flagKey: string,
  flagMap: ReadonlyMap<string, SiteFeatureFlag>
): { effectiveEnabled: boolean; blockedByParentKey: string | null } {
  const target = flagMap.get(flagKey);
  if (!target) {
    return {
      effectiveEnabled: DEFAULT_FEATURE_FLAG_STATES[flagKey] ?? true,
      blockedByParentKey: null,
    };
  }

  const visited = new Set<string>([flagKey]);
  let cursor = target.parentKey;
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const parent = flagMap.get(cursor);
    if (!parent) break;
    if (!parent.enabled) {
      return { effectiveEnabled: false, blockedByParentKey: parent.flagKey };
    }
    cursor = parent.parentKey;
  }

  return {
    effectiveEnabled: target.enabled,
    blockedByParentKey: null,
  };
}

/**
 * 전체 플래그 배열을 계층 평가된 목록과 빠른 조회용 Boolean 맵으로 변환한다.
 */
export function evaluateAllFeatureFlags(flags: ReadonlyArray<SiteFeatureFlag>): {
  evaluated: EvaluatedSiteFeatureFlag[];
  effectiveMap: Record<string, boolean>;
} {
  const byKey = new Map<string, SiteFeatureFlag>(flags.map((f) => [f.flagKey, f]));
  const effectiveMap: Record<string, boolean> = { ...DEFAULT_FEATURE_FLAG_STATES };

  const evaluated: EvaluatedSiteFeatureFlag[] = flags.map((flag) => {
    const { effectiveEnabled, blockedByParentKey } = evaluateFlagWithHierarchy(
      flag.flagKey,
      byKey
    );
    effectiveMap[flag.flagKey] = effectiveEnabled;
    return {
      ...flag,
      effectiveEnabled,
      blockedByParentKey,
    };
  });

  return { evaluated, effectiveMap };
}
