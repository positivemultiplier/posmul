/**
 * Prediction Game Aggregate Tests
 *
 * Domain      // When
      const result = PredictionGame.create(validGameData);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(gameId);
        expect(result.data.creatorId).toBe(creatorId);
        expect(result.data.status.value).toBe("CREATED");
      }트 - PredictionGame Aggregate
 * 예측 게임의 핵심 비즈니스 로직 검증
 */
import {
  PredictionGameId,
  UserId,
  createPmpAmount,
} from "@posmul/auth-economy-sdk";
import { AccuracyScore, ValidationError } from "@posmul/auth-economy-sdk";

import { createPredictionGameId } from "../../types/common";
import {
  GameOptions,
  GameStatus,
  PredictionType,
} from "../../value-objects/prediction-types";
import { PredictionGame } from "../prediction-game.aggregate";

describe("PredictionGame Aggregate", () => {
  let gameId: PredictionGameId;
  let creatorId: UserId;
  let validGameData: any;

  beforeEach(() => {
    gameId = createPredictionGameId("test-game-" + Date.now());
    creatorId = "user-123" as UserId;

    validGameData = {
      id: gameId,
      creatorId,
      title: "Test Prediction Game",
      description: "Test description",
      predictionType: PredictionType.BINARY,
      options: [
        { id: "option-1", label: "Yes", description: "Positive outcome" },
        { id: "option-2", label: "No", description: "Negative outcome" },
      ] as GameOptions,
      startTime: new Date(Date.now() + 3600000), // 1시간 후
      endTime: new Date(Date.now() + 7200000), // 2시간 후
      settlementTime: new Date(Date.now() + 10800000), // 3시간 후
      minimumStake: createPmpAmount(10),
      maximumStake: createPmpAmount(1000),
      maxParticipants: 100,
    };
  });

  describe("Aggregate Creation", () => {
    it("올바른 데이터로 예측 게임을 생성할 수 있다", () => {
      // When
      const result = PredictionGame.create(validGameData);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getId()).toBe(gameId);
        expect(result.data.getTitle()).toBe("Test Prediction Game");
        expect(result.data.getStatus()).toBe(GameStatus.PENDING);
      }
    });

    it("잘못된 타이틀로는 게임을 생성할 수 없다", () => {
      // Given
      const invalidData = {
        ...validGameData,
        title: "", // 빈 타이틀
      };

      // When
      const result = PredictionGame.create(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("종료 시간이 시작 시간보다 빠르면 게임을 생성할 수 없다", () => {
      // Given
      const invalidData = {
        ...validGameData,
        endTime: new Date(Date.now() + 1800000), // 30분 후 (startTime보다 빠름)
      };

      // When
      const result = PredictionGame.create(invalidData);

      // Then
      expect(result.success).toBe(false);
    });

    it("최소 스테이크가 최대 스테이크보다 크면 게임을 생성할 수 없다", () => {
      // Given
      const invalidData = {
        ...validGameData,
        minimumStake: createPmpAmount(2000), // maximumStake(1000)보다 큼
      };

      // When
      const result = PredictionGame.create(invalidData);

      // Then
      expect(result.success).toBe(false);
    });
  });

  describe("Game State Management", () => {
    let game: PredictionGame;

    beforeEach(() => {
      const result = PredictionGame.create(validGameData);
      expect(result.success).toBe(true);
      if (result.success) {
        game = result.data;
      }
    });

    it("게임을 활성화할 수 있다", () => {
      // When
      const result = game.activate();

      // Then
      expect(result.success).toBe(true);
      expect(game.getStatus()).toBe(GameStatus.ACTIVE);
    });

    it("이미 활성화된 게임은 다시 활성화할 수 없다", () => {
      // Given
      game.activate();

      // When
      const result = game.activate();

      // Then
      expect(result.success).toBe(false);
    });

    it("게임을 종료할 수 있다", () => {
      // Given
      game.activate();

      // When
      const result = game.end();

      // Then
      expect(result.success).toBe(true);
      expect(game.getStatus()).toBe(GameStatus.ENDED);
    });

    it("활성화되지 않은 게임은 종료할 수 없다", () => {
      // When (PENDING 상태에서 바로 종료 시도)
      const result = game.end();

      // Then
      expect(result.success).toBe(false);
    });
  });

  describe("Prediction Management", () => {
    let game: PredictionGame;

    beforeEach(() => {
      const result = PredictionGame.create(validGameData);
      expect(result.success).toBe(true);
      if (result.success) {
        game = result.data;
        game.activate();
      }
    });

    it("활성 게임에 예측을 추가할 수 있다", () => {
      // Given
      const predictionData = {
        userId: "user-456" as UserId,
        selectedOption: "Yes",
        stakeAmount: createPmpAmount(100),
        confidenceLevel: 0.8,
      };

      // When
      const result = game.addPrediction(predictionData);

      // Then
      expect(result.success).toBe(true);
      expect(game.getPredictions()).toHaveLength(1);
    });

    it("비활성 게임에는 예측을 추가할 수 없다", () => {
      // Given
      game.end(); // 게임 종료
      const predictionData = {
        userId: "user-456" as UserId,
        selectedOption: "Yes",
        stakeAmount: createPmpAmount(100),
        confidenceLevel: 0.8,
      };

      // When
      const result = game.addPrediction(predictionData);

      // Then
      expect(result.success).toBe(false);
    });

    it("최소 스테이크보다 적은 금액으로는 예측할 수 없다", () => {
      // Given
      const predictionData = {
        userId: "user-456" as UserId,
        selectedOption: "Yes",
        stakeAmount: createPmpAmount(5), // minimumStake(10)보다 적음
        confidenceLevel: 0.8,
      };

      // When
      const result = game.addPrediction(predictionData);

      // Then
      expect(result.success).toBe(false);
    });

    it("최대 스테이크보다 많은 금액으로는 예측할 수 없다", () => {
      // Given
      const predictionData = {
        userId: "user-456" as UserId,
        selectedOption: "Yes",
        stakeAmount: createPmpAmount(2000), // maximumStake(1000)보다 많음
        confidenceLevel: 0.8,
      };

      // When
      const result = game.addPrediction(predictionData);

      // Then
      expect(result.success).toBe(false);
    });
  });

  describe("Game Settlement", () => {
    let game: PredictionGame;

    beforeEach(() => {
      const result = PredictionGame.create(validGameData);
      expect(result.success).toBe(true);
      if (result.success) {
        game = result.data;
        game.activate();

        // 테스트용 예측 추가
        game.addPrediction({
          userId: "user-456" as UserId,
          selectedOption: "Yes",
          stakeAmount: createPmpAmount(100),
          confidenceLevel: 0.8,
        });

        game.addPrediction({
          userId: "user-789" as UserId,
          selectedOption: "No",
          stakeAmount: createPmpAmount(200),
          confidenceLevel: 0.7,
        });

        game.end();
      }
    });

    it("게임을 정산할 수 있다", () => {
      // When
      const result = game.settle("Yes"); // "Yes"가 정답

      // Then
      expect(result.success).toBe(true);
      expect(game.getStatus()).toBe(GameStatus.SETTLED);
    });

    it("종료되지 않은 게임은 정산할 수 없다", () => {
      // Given
      const activeGame = PredictionGame.create(validGameData);
      expect(activeGame.success).toBe(true);
      if (activeGame.success) {
        activeGame.data.activate();

        // When (종료하지 않고 바로 정산 시도)
        const result = activeGame.data.settle("Yes");

        // Then
        expect(result.success).toBe(false);
      }
    });

    it("잘못된 결과로는 정산할 수 없다", () => {
      // When
      const result = game.settle("Invalid Option");

      // Then
      expect(result.success).toBe(false);
    });
  });

  describe("Domain Events", () => {
    let game: PredictionGame;

    beforeEach(() => {
      const result = PredictionGame.create(validGameData);
      expect(result.success).toBe(true);
      if (result.success) {
        game = result.data;
      }
    });

    it("게임 생성시 도메인 이벤트가 발생한다", () => {
      // When
      const events = game.getDomainEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0].aggregateId).toBe(gameId);
    });

    it("게임 활성화시 도메인 이벤트가 발생한다", () => {
      // Given
      game.clearDomainEvents(); // 이전 이벤트 클리어

      // When
      game.activate();
      const events = game.getDomainEvents();

      // Then
      expect(events).toHaveLength(1);
    });

    it("예측 추가시 도메인 이벤트가 발생한다", () => {
      // Given
      game.activate();
      game.clearDomainEvents(); // 이전 이벤트 클리어

      // When
      game.addPrediction({
        userId: "user-456" as UserId,
        selectedOption: "Yes",
        stakeAmount: createPmpAmount(100),
        confidenceLevel: 0.8,
      });
      const events = game.getDomainEvents();

      // Then
      expect(events).toHaveLength(1);
    });
  });

  describe("Business Rules", () => {
    let game: PredictionGame;

    beforeEach(() => {
      const result = PredictionGame.create(validGameData);
      expect(result.success).toBe(true);
      if (result.success) {
        game = result.data;
        game.activate();
      }
    });

    it("동일 사용자는 중복 예측을 할 수 없다", () => {
      // Given
      const userId = "user-456" as UserId;
      const predictionData = {
        userId,
        selectedOption: "Yes",
        stakeAmount: createPmpAmount(100),
        confidenceLevel: 0.8,
      };

      game.addPrediction(predictionData);

      // When (동일 사용자 재예측 시도)
      const result = game.addPrediction({
        ...predictionData,
        selectedOption: "No", // 다른 옵션으로 변경
      });

      // Then
      expect(result.success).toBe(false);
      expect(game.getPredictions()).toHaveLength(1);
    });

    it("최대 참여자 수를 초과할 수 없다", () => {
      // Given (maxParticipants = 100이지만 테스트를 위해 1로 설정)
      const gameData = {
        ...validGameData,
        maxParticipants: 1,
      };

      const limitedGame = PredictionGame.create(gameData);
      expect(limitedGame.success).toBe(true);
      if (limitedGame.success) {
        limitedGame.data.activate();

        // 첫 번째 예측자 추가
        limitedGame.data.addPrediction({
          userId: "user-456" as UserId,
          selectedOption: "Yes",
          stakeAmount: createPmpAmount(100),
          confidenceLevel: 0.8,
        });

        // When (두 번째 예측자 추가 시도)
        const result = limitedGame.data.addPrediction({
          userId: "user-789" as UserId,
          selectedOption: "No",
          stakeAmount: createPmpAmount(200),
          confidenceLevel: 0.7,
        });

        // Then
        expect(result.success).toBe(false);
        expect(limitedGame.data.getPredictions()).toHaveLength(1);
      }
    });
  });
});
