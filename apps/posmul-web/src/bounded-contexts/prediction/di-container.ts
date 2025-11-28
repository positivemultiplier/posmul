/**
 * Prediction Domain - Dependency Injection Container
 *
 * Clean Architecture의 의존성 주입 컨테이너
 * Use Case와 Infrastructure 계층을 연결
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import {
  DomainEvent,
  IDomainEventPublisher,
  PublishError,
  Result,
} from "@posmul/auth-economy-sdk";

import { MCPPredictionGameRepository } from "./infrastructure/repositories/mcp-prediction-game.repository";
import { IPredictionGameRepository } from "./domain/repositories/prediction-game.repository";
import {
  PredictionEconomicService,
  createPredictionEconomicService,
} from "./domain/services/prediction-economic.service";
import { ParticipatePredictionUseCase } from "./application/use-cases/participate-prediction.use-case";
import { SettlePredictionGameUseCase } from "./application/use-cases/settle-prediction-game.use-case";
import { CreatePredictionGameUseCase } from "./application/use-cases/create-prediction-game.use-case";
import { GetPredictionGameByIdUseCase } from "./application/use-cases/get-prediction-game-by-id.use-case";
import { GetPredictionGamesUseCase } from "./application/use-cases/get-prediction-games.use-case";
import { MoneyWaveCalculatorService } from "../../shared/economy-kernel/services/money-wave-calculator.service";
import {
  EconomyKernel,
  getEconomyKernel,
} from "../../shared/economy-kernel/services/economy-kernel.service";
import { getSupabaseEconomyKernelRepository } from "../../shared/economy-kernel/repositories/supabase-economy-kernel.repository";

/**
 * 간단한 이벤트 퍼블리셔 구현
 * 실제 프로덕션에서는 더 정교한 구현 필요 (Supabase Realtime, Redis Pub/Sub 등)
 */
class SimpleDomainEventPublisher implements IDomainEventPublisher {
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> =
    new Map();

  async publish<T extends DomainEvent>(
    event: T
  ): Promise<Result<void, PublishError>> {
    const eventHandlers = this.handlers.get(event.type) || [];
    try {
      for (const handler of eventHandlers) {
        await handler(event);
      }
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new PublishError(
          `Failed to publish event ${event.type}`,
          { originalError: error instanceof Error ? error.message : String(error) }
        ),
      };
    }
  }

  async publishMany<T extends DomainEvent>(
    events: T[]
  ): Promise<Result<void, PublishError>> {
    for (const event of events) {
      const result = await this.publish(event);
      if (!result.success) {
        return result;
      }
    }
    return { success: true, data: undefined };
  }

  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>
  ): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }
}

/**
 * Prediction Domain DI Container
 */
class PredictionDIContainer {
  private static instance: PredictionDIContainer | null = null;
  
  // Infrastructure
  private readonly predictionGameRepository: IPredictionGameRepository;
  private readonly eventPublisher: IDomainEventPublisher;
  private readonly economyKernel: EconomyKernel;
  private readonly moneyWaveCalculator: MoneyWaveCalculatorService;
  
  // Domain Services
  private readonly predictionEconomicService: PredictionEconomicService;

  private constructor() {
    // Infrastructure 초기화
    this.predictionGameRepository = new MCPPredictionGameRepository();
    this.eventPublisher = new SimpleDomainEventPublisher();
    this.economyKernel = getEconomyKernel();
    this.moneyWaveCalculator = new MoneyWaveCalculatorService();

    // Economy Kernel에 Repository 주입 (중요!)
    const economyKernelRepository = getSupabaseEconomyKernelRepository();
    this.economyKernel.injectRepository(economyKernelRepository);

    // Domain Service 초기화
    this.predictionEconomicService = createPredictionEconomicService(this.eventPublisher);
  }

  static getInstance(): PredictionDIContainer {
    if (!PredictionDIContainer.instance) {
      PredictionDIContainer.instance = new PredictionDIContainer();
    }
    return PredictionDIContainer.instance;
  }

  // ============ Use Case Factories ============

  getParticipatePredictionUseCase(): ParticipatePredictionUseCase {
    return new ParticipatePredictionUseCase(
      this.predictionGameRepository,
      this.predictionEconomicService
    );
  }

  getSettlePredictionGameUseCase(): SettlePredictionGameUseCase {
    return new SettlePredictionGameUseCase(
      this.predictionGameRepository
    );
  }

  getCreatePredictionGameUseCase(): CreatePredictionGameUseCase {
    return new CreatePredictionGameUseCase(
      this.predictionGameRepository,
      this.moneyWaveCalculator
    );
  }

  getGetPredictionGameByIdUseCase(): GetPredictionGameByIdUseCase {
    return new GetPredictionGameByIdUseCase(
      this.predictionGameRepository
    );
  }

  getGetPredictionGamesUseCase(): GetPredictionGamesUseCase {
    return new GetPredictionGamesUseCase(
      this.predictionGameRepository
    );
  }

  // ============ Service Accessors ============

  getPredictionGameRepository(): IPredictionGameRepository {
    return this.predictionGameRepository;
  }

  getEventPublisher(): IDomainEventPublisher {
    return this.eventPublisher;
  }

  getPredictionEconomicService(): PredictionEconomicService {
    return this.predictionEconomicService;
  }

  getEconomyKernel(): EconomyKernel {
    return this.economyKernel;
  }
}

// ============ Export Factory Functions ============

/**
 * DI Container 인스턴스 획득
 */
export function getPredictionDIContainer(): PredictionDIContainer {
  return PredictionDIContainer.getInstance();
}

/**
 * Use Case 직접 획득 함수들
 */
export function getParticipatePredictionUseCase(): ParticipatePredictionUseCase {
  return getPredictionDIContainer().getParticipatePredictionUseCase();
}

export function getSettlePredictionGameUseCase(): SettlePredictionGameUseCase {
  return getPredictionDIContainer().getSettlePredictionGameUseCase();
}

export function getCreatePredictionGameUseCase(): CreatePredictionGameUseCase {
  return getPredictionDIContainer().getCreatePredictionGameUseCase();
}

export function getGetPredictionGameByIdUseCase(): GetPredictionGameByIdUseCase {
  return getPredictionDIContainer().getGetPredictionGameByIdUseCase();
}

export function getGetPredictionGamesUseCase(): GetPredictionGamesUseCase {
  return getPredictionDIContainer().getGetPredictionGamesUseCase();
}
