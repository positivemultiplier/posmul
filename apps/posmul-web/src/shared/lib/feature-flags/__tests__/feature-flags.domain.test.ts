import {
  evaluateAllFeatureFlags,
  evaluateFlagWithHierarchy,
  type SiteFeatureFlag,
} from "../feature-flags.domain";

function makeFlag(overrides: Partial<SiteFeatureFlag> & { flagKey: string }): SiteFeatureFlag {
  return {
    domain: "prediction",
    parentKey: null,
    groupName: "module",
    label: overrides.flagKey,
    description: "",
    enabled: true,
    isLocked: false,
    badge: null,
    configJson: {},
    sortOrder: 100,
    updatedAt: "2026-11-24T00:00:00.000Z",
    ...overrides,
  };
}

describe("feature-flags.domain", () => {
  it("부모 도메인이 OFF이면 자식 세부 플래그가 ON이어도 effectiveEnabled는 false로 평가된다", () => {
    const parent = makeFlag({ flagKey: "domain.prediction", enabled: false });
    const child = makeFlag({
      flagKey: "prediction.addon.naver_news",
      parentKey: "domain.prediction",
      enabled: true,
    });

    const { evaluated, effectiveMap } = evaluateAllFeatureFlags([parent, child]);
    const childEval = evaluated.find((f) => f.flagKey === "prediction.addon.naver_news");

    expect(childEval?.effectiveEnabled).toBe(false);
    expect(childEval?.blockedByParentKey).toBe("domain.prediction");
    expect(effectiveMap["prediction.addon.naver_news"]).toBe(false);
  });

  it("부모가 ON이고 자식이 ON이면 정상 활성화된다", () => {
    const parent = makeFlag({ flagKey: "domain.prediction", enabled: true });
    const child = makeFlag({
      flagKey: "prediction.addon.sports_badge",
      parentKey: "domain.prediction",
      enabled: true,
    });

    const { effectiveMap } = evaluateAllFeatureFlags([parent, child]);
    expect(effectiveMap["prediction.addon.sports_badge"]).toBe(true);
  });

  it("순환 parentKey 참조가 있어도 무한 루프에 빠지지 않는다", () => {
    const a = makeFlag({ flagKey: "a", parentKey: "b", enabled: true });
    const b = makeFlag({ flagKey: "b", parentKey: "a", enabled: true });
    const map = new Map<string, SiteFeatureFlag>([
      ["a", a],
      ["b", b],
    ]);

    expect(evaluateFlagWithHierarchy("a", map)).toEqual({
      effectiveEnabled: true,
      blockedByParentKey: null,
    });
  });

  it("DB에 없는 미등록 키는 안전한 기본값(DEFAULT_FEATURE_FLAG_STATES)으로 폴백한다", () => {
    const empty = new Map<string, SiteFeatureFlag>();
    expect(evaluateFlagWithHierarchy("prediction.exp.blind_first", empty).effectiveEnabled).toBe(false);
    expect(evaluateFlagWithHierarchy("prediction.addon.naver_news", empty).effectiveEnabled).toBe(true);
  });
});
