import { isFailure, type PredictionGameId, type UserId } from "@posmul/auth-economy-sdk";
import { DeletePredictionGameUseCase } from "../delete-prediction-game.use-case";
import type { IPredictionGameRepository } from "../../../domain/repositories/prediction-game.repository";
import { GameStatus } from "../../../domain/value-objects/prediction-types";

function createMockGame(overrides?: {
  creatorId?: string;
  participantCount?: number;
  status?: GameStatus;
}) {
  return {
    getId: () => "game-1" as PredictionGameId,
    creatorId: overrides?.creatorId ?? "creator-1",
    getCurrentParticipantCount: () => overrides?.participantCount ?? 0,
    status: { value: overrides?.status ?? GameStatus.ACTIVE },
  };
}

describe("DeletePredictionGameUseCase (Phase 0 보안·권한 검증)", () => {
  it("생성자가 아닌 타인이 삭제를 시도하면 거부한다", async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue({
        success: true,
        data: createMockGame({ creatorId: "creator-1", participantCount: 0 }),
      }),
      save: jest.fn(),
    } as unknown as IPredictionGameRepository;

    const useCase = new DeletePredictionGameUseCase(repo);
    const result = await useCase.execute({
      gameId: "game-1" as PredictionGameId,
      deletedBy: "attacker-2" as UserId,
      reason: "unauthorized attempt",
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toContain("Only the game creator or admin");
    }
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("활성 게임에 참여자가 1명 이상 존재하면 생성자라도 삭제를 거부한다", async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue({
        success: true,
        data: createMockGame({
          creatorId: "creator-1",
          participantCount: 3,
          status: GameStatus.ACTIVE,
        }),
      }),
      save: jest.fn(),
    } as unknown as IPredictionGameRepository;

    const useCase = new DeletePredictionGameUseCase(repo);
    const result = await useCase.execute({
      gameId: "game-1" as PredictionGameId,
      deletedBy: "creator-1" as UserId,
      reason: "creator cancel",
    });

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toContain("participants");
    }
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("생성자 본인이고 참여자가 없는 게임은 정상적으로 삭제 흐름을 통과한다", async () => {
    const repo = {
      findById: jest.fn().mockResolvedValue({
        success: true,
        data: createMockGame({
          creatorId: "creator-1",
          participantCount: 0,
          status: GameStatus.ACTIVE,
        }),
      }),
      save: jest.fn().mockResolvedValue({ success: true, data: undefined }),
    } as unknown as IPredictionGameRepository;

    const useCase = new DeletePredictionGameUseCase(repo);
    const result = await useCase.execute({
      gameId: "game-1" as PredictionGameId,
      deletedBy: "creator-1" as UserId,
      reason: "creator cancel",
    });

    expect(result.success).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
