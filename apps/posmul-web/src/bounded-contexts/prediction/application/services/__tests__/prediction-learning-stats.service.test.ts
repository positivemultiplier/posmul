import {
  calculateUserCapmBeta,
  computeUserLearningSnapshot,
  normalizeConfidence,
  PredictionLearningStatsService,
  RawPredictionRow,
  RawSettledGameRow,
  resolveCanonicalOptionId,
} from "../prediction-learning-stats.service";

describe("PredictionLearningStatsService", () => {
  describe("resolveCanonicalOptionId & normalizeConfidence", () => {
    it("Yes/No 문자열 배열과 option-0/option-1 인덱스를 동일 정규 키로 매핑한다", () => {
      const gameOptions = { options: ["Yes", "No"] };

      expect(resolveCanonicalOptionId("option-0", gameOptions)).toEqual({
        canonicalId: "Yes",
        optionCount: 2,
      });
      expect(resolveCanonicalOptionId("Yes", gameOptions)).toEqual({
        canonicalId: "Yes",
        optionCount: 2,
      });
      expect(resolveCanonicalOptionId("option-1", gameOptions)).toEqual({
        canonicalId: "No",
        optionCount: 2,
      });
    });

    it("객체 기반 옵션 정의(id/label)도 올바르게 해석한다", () => {
      const gameOptions = [
        { id: "home-win", label: "홈 승" },
        { id: "draw", label: "무승부" },
        { id: "away-win", label: "원정 승" },
      ];

      expect(resolveCanonicalOptionId("홈 승", gameOptions)).toEqual({
        canonicalId: "home-win",
        optionCount: 3,
      });
      expect(resolveCanonicalOptionId("option-2", gameOptions)).toEqual({
        canonicalId: "away-win",
        optionCount: 3,
      });
    });

    it("0~100 정수 및 0~1 소수 확신도를 [0.01, 0.99] 범위로 정규화한다", () => {
      expect(normalizeConfidence(80)).toBeCloseTo(0.8);
      expect(normalizeConfidence(0.75)).toBeCloseTo(0.75);
      expect(normalizeConfidence(100)).toBeCloseTo(0.99);
      expect(normalizeConfidence(0)).toBeCloseTo(0.01);
      expect(normalizeConfidence(null)).toBeCloseTo(0.5);
    });
  });

  describe("calculateUserCapmBeta", () => {
    it("정산 이력이 없으면 기본 시장 중립 Beta 1.0을 반환한다", () => {
      expect(calculateUserCapmBeta(0, 0.5, [])).toBe(1.0);
    });

    it("기준 확신도 0.50 · 1,000 PMP 참여 시 시장 중립 1.0000을 반환한다", () => {
      expect(calculateUserCapmBeta(3, 0.5, [1000, 1000, 1000])).toBe(1.0);
    });

    it("고확신 · 대규모 참여자는 방어적 소액 참여자보다 높은 Beta를 가진다", () => {
      const aggressiveBeta = calculateUserCapmBeta(5, 0.9, [8000, 10000, 12000]);
      const defensiveBeta = calculateUserCapmBeta(5, 0.25, [100, 200, 150]);

      expect(aggressiveBeta).toBeGreaterThan(1.1);
      expect(defensiveBeta).toBeLessThan(0.9);
      expect(aggressiveBeta).toBeGreaterThan(defensiveBeta);
    });
  });

  describe("computeUserLearningSnapshot", () => {
    it("option-0과 Yes 혼용 정산 내역에서도 Brier, SkillWeight, ROI, Beta를 정확히 계산한다", () => {
      const settledGames = new Map<string, RawSettledGameRow>([
        [
          "game-1",
          {
            game_id: "game-1",
            status: "SETTLED",
            game_options: { options: ["Yes", "No"] },
            winning_option_id: null,
            actual_result: { winningOption: "Yes" },
            settled_at: "2026-11-10T10:00:00Z",
          },
        ],
        [
          "game-2",
          {
            game_id: "game-2",
            status: "SETTLED",
            game_options: { options: ["Yes", "No"] },
            winning_option_id: "No",
            actual_result: { correctOptionId: "No" },
            settled_at: "2026-11-11T10:00:00Z",
          },
        ],
      ]);

      const predictions: RawPredictionRow[] = [
        {
          prediction_id: "pred-1",
          game_id: "game-1",
          user_id: "user-1",
          bet_amount: 1000,
          confidence_level: 80,
          prediction_data: { selectedOptionId: "option-0" },
          is_active: false, // 과거 handleManualSettle 데이터 호환
          created_at: "2026-11-10T09:00:00Z",
        },
        {
          prediction_id: "pred-2",
          game_id: "game-2",
          user_id: "user-1",
          bet_amount: 500,
          confidence_level: 60,
          prediction_data: { selectedOptionId: "Yes" },
          is_active: true,
          created_at: "2026-11-11T09:00:00Z",
        },
        {
          prediction_id: "pred-withdrawn",
          game_id: "game-2",
          user_id: "user-1",
          bet_amount: 900,
          confidence_level: 90,
          prediction_data: { selectedOptionId: "Yes", withdrawn: true },
          is_active: false,
          created_at: "2026-11-11T09:05:00Z",
        },
      ];

      const snapshot = computeUserLearningSnapshot({
        userId: "user-1",
        predictions,
        settledGameMap: settledGames,
        totalRewardPmc: 2100,
      });

      expect(snapshot.profile.settledCount).toBe(2);
      expect(snapshot.winCount).toBe(1);
      expect(snapshot.profile.winRate).toBeCloseTo(0.5, 4);
      expect(snapshot.totalStaked).toBe(1500); // 철회된 900 제외
      expect(snapshot.totalRewardPmc).toBe(2100);
      expect(snapshot.roiPercentage).toBeCloseTo(40, 2);
      expect(snapshot.brierHistory).toHaveLength(2);
      expect(snapshot.brierHistory[0].gameId).toBe("game-2"); // 최신순 정렬
      expect(snapshot.brierHistory[1].isCorrect).toBe(true);
      expect(snapshot.profile.averageBrierScore).toBeGreaterThan(0);
      expect(snapshot.profile.averageBrierScore).toBeLessThan(0.5);
    });
  });

  describe("syncLearningStatsForGame (DB 연동 영속화)", () => {
    it("정산된 게임 참여자들의 통계를 user_prediction_stats 및 ranking.user_scores에 UPSERT한다", async () => {
      const statsUpsertSpy = jest.fn().mockResolvedValue({ error: null });
      const rankUpdateEqSpy = jest.fn().mockResolvedValue({ error: null });
      const rankUpdateSpy = jest.fn().mockReturnValue({ eq: rankUpdateEqSpy });
      const rankInsertSpy = jest.fn().mockResolvedValue({ error: null });

      const mockDb = {
        schema: jest.fn((schemaName: string) => ({
          from: jest.fn((tableName: string) => {
            if (schemaName === "prediction" && tableName === "predictions") {
              return {
                select: jest.fn((cols: string) => {
                  if (cols === "user_id") {
                    return {
                      eq: jest.fn().mockResolvedValue({
                        data: [{ user_id: "user-a" }, { user_id: "user-b" }],
                        error: null,
                      }),
                    };
                  }
                  return {
                    in: jest.fn().mockResolvedValue({
                      data: [
                        {
                          prediction_id: "p1",
                          game_id: "g1",
                          user_id: "user-a",
                          bet_amount: 1000,
                          confidence_level: 85,
                          prediction_data: { selectedOptionId: "Yes" },
                          is_active: true,
                          created_at: "2026-11-11T00:00:00Z",
                        },
                        {
                          prediction_id: "p2",
                          game_id: "g1",
                          user_id: "user-b",
                          bet_amount: 1000,
                          confidence_level: 85,
                          prediction_data: { selectedOptionId: "No" },
                          is_active: true,
                          created_at: "2026-11-11T00:01:00Z",
                        },
                      ],
                      error: null,
                    }),
                  };
                }),
              };
            }

            if (schemaName === "prediction" && tableName === "prediction_games") {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [
                      {
                        game_id: "g1",
                        status: "SETTLED",
                        game_options: { options: ["Yes", "No"] },
                        winning_option_id: "Yes",
                        actual_result: { correctOptionId: "Yes" },
                        settled_at: "2026-11-11T02:00:00Z",
                      },
                    ],
                    error: null,
                  }),
                }),
              };
            }

            if (schemaName === "economy" && tableName === "pmp_pmc_transactions") {
              return {
                select: jest.fn().mockReturnValue({
                  in: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                      data: [
                        {
                          user_id: "user-a",
                          pmc_amount: 1850,
                          metadata: { source: "prediction_win", game_id: "g1" },
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              };
            }

            if (schemaName === "prediction" && tableName === "user_prediction_stats") {
              return { upsert: statsUpsertSpy };
            }

            if (schemaName === "ranking" && tableName === "user_scores") {
              return {
                select: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({
                    data: [
                      {
                        user_id: "user-a",
                        expect_participations: 4,
                        expect_wins: 1,
                        expect_pmc_earned: 500,
                      },
                    ],
                    error: null,
                  }),
                }),
                update: rankUpdateSpy,
                insert: rankInsertSpy,
              };
            }

            throw new Error(`Unexpected table ${schemaName}.${tableName}`);
          }),
        })),
      };

      const service = new PredictionLearningStatsService(mockDb as never);
      const result = await service.syncLearningStatsForGame("g1");

      expect(result.errors).toEqual([]);
      expect(result.updatedUsers).toBe(2);
      expect(statsUpsertSpy).toHaveBeenCalledTimes(1);

      const upsertedRows = statsUpsertSpy.mock.calls[0][0] as Array<Record<string, unknown>>;
      const userARow = upsertedRows.find((r) => r.user_id === "user-a");
      const userBRow = upsertedRows.find((r) => r.user_id === "user-b");

      expect(userARow?.win_count).toBe(1);
      expect(userARow?.total_reward_pmc).toBe(1850);
      expect(userBRow?.win_count).toBe(0);
      expect(Number(userARow?.average_brier_score)).toBeLessThan(
        Number(userBRow?.average_brier_score)
      );

      // user-a는 기존 ranking 행 update (expect_participations 4 유지), user-b는 신규 insert
      expect(rankUpdateSpy).toHaveBeenCalledTimes(1);
      expect(rankUpdateEqSpy).toHaveBeenCalledWith("user_id", "user-a");
      expect(rankInsertSpy).toHaveBeenCalledTimes(1);
      expect(rankInsertSpy.mock.calls[0][0].user_id).toBe("user-b");
    });
  });
});

