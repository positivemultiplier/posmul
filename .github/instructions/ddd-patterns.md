# DDD 아키텍처 지침

## Domain-Driven Design 패턴 구현 시:

### Aggregate 설계
```typescript
// Copilot, 비즈니스 불변성을 강제하고 일관성 경계를 유지하는 애그리거트 루트를 생성해주세요
export class PredictionGameAggregate {
  private constructor(
    private readonly id: PredictionGameId,
    private status: GameStatus,
    private predictions: Prediction[],
    private readonly createdAt: Date
  ) {}

  // 생성을 위한 팩토리 메서드
  static create(params: CreatePredictionGameParams): Result<PredictionGameAggregate, DomainError> {
    // 검증 및 생성 로직
  }

  // 비즈니스 작업
  addPrediction(prediction: Prediction): Result<void, DomainError> {
    // 비즈니스 규칙 강제
  }

  closeGame(): Result<void, DomainError> {
    // 상태 전환 로직
  }
}
```

### Repository 패턴
```typescript
// Copilot, 도메인 계층에서 리포지토리 인터페이스를 정의해주세요
export interface IPredictionGameRepository {
  save(aggregate: PredictionGameAggregate): Promise<Result<void, RepositoryError>>;
  findById(id: PredictionGameId): Promise<Result<PredictionGameAggregate | null, RepositoryError>>;
  findByStatus(status: GameStatus): Promise<Result<PredictionGameAggregate[], RepositoryError>>;
}

// Copilot, 인프라스트럭처 계층에서 리포지토리를 구현해주세요
export class SupabasePredictionGameRepository implements IPredictionGameRepository {
  constructor(private readonly client: SupabaseClient) {}
  
  async save(aggregate: PredictionGameAggregate): Promise<Result<void, RepositoryError>> {
    // Supabase를 사용한 구현
  }
}
```

### 도메인 이벤트
```typescript
// Copilot, 컨텍스트 간 통신을 위한 도메인 이벤트를 생성해주세요
export abstract class DomainEvent {
  readonly occurredOn: Date;
  readonly aggregateId: string;
  
  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
  }
}

export class PredictionGameCreated extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly gameDetails: PredictionGameDetails
  ) {
    super(aggregateId);
  }
}
```

### Value Object
```typescript
// Copilot, 적절한 검증과 불변성을 가진 값 객체를 구현해주세요
export class PredictionId {
  private readonly _value: string;
  
  private constructor(value: string) {
    this._value = value;
  }
    static create(value: string): Result<PredictionId, ValidationError> {
    if (!this.isValid(value)) {
      return { success: false, error: new ValidationError('잘못된 예측 ID') };
    }
    return { success: true, data: new PredictionId(value) };
  }
  
  get value(): string {
    return this._value;
  }
  
  equals(other: PredictionId): boolean {
    return this._value === other._value;
  }
}
```

## Bounded Context 통합

### Context Map
```typescript
// Copilot, 외부 컨텍스트 통합을 위한 부패 방지 계층을 정의해주세요
export interface IMarketDataService {
  getMarketInfo(marketId: MarketId): Promise<Result<MarketInfo, ExternalServiceError>>;
}

export class MarketDataAntiCorruptionLayer implements IMarketDataService {
  constructor(private readonly externalMarketApi: ExternalMarketAPI) {}
  
  async getMarketInfo(marketId: MarketId): Promise<Result<MarketInfo, ExternalServiceError>> {
    // 외부 모델을 도메인 모델로 변환
  }
}
```

### 컨텍스트 간 통신
```typescript
// Copilot, bounded context 간 이벤트 기반 통신을 구현해주세요
export class DomainEventPublisher {
  private static handlers: Map<string, DomainEventHandler[]> = new Map();
  
  static subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    // 구독 로직
  }
  
  static async publish(event: DomainEvent): Promise<void> {
    // 발행 로직
  }
}
```

## Use Case 구현

### Command 패턴
```typescript
// Copilot, 상태 변경 작업을 위한 커맨드를 생성해주세요
export class CreatePredictionGameCommand {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly endDate: Date,
    public readonly options: PredictionOption[]
  ) {}
}

export class CreatePredictionGameHandler {
  constructor(
    private readonly repository: IPredictionGameRepository,
    private readonly eventPublisher: DomainEventPublisher
  ) {}
  
  async handle(command: CreatePredictionGameCommand): Promise<Result<PredictionGameId, ApplicationError>> {
    // 유스케이스 구현
  }
}
```

### Query 패턴
```typescript
// Copilot, 데이터 조회 작업을 위한 쿼리를 생성해주세요
export class GetPredictionGameQuery {
  constructor(public readonly gameId: string) {}
}

export class GetPredictionGameHandler {
  constructor(private readonly readModel: IPredictionGameReadModel) {}
  
  async handle(query: GetPredictionGameQuery): Promise<Result<PredictionGameDto, ApplicationError>> {
    // 쿼리 구현
  }
}
```

## 에러 처리 전략

### 도메인 에러
```typescript
// Copilot, 비즈니스 규칙 위반에 대한 특정 도메인 에러를 정의해주세요
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class GameAlreadyClosedError extends DomainError {
  constructor() {
    super('종료된 게임에는 예측을 추가할 수 없습니다');
  }
}

export class PredictionLimitExceededError extends DomainError {
  constructor(limit: number) {
    super(`게임당 최대 ${limit}개의 예측만 허용됩니다`);
  }
}
```

### 애플리케이션 에러
```typescript
// Copilot, 적절한 컨텍스트와 함께 애플리케이션 수준 에러를 처리해주세요
export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}
```

## 테스트 전략

### 도메인 테스트
```typescript
// Copilot, 비즈니스 규칙에 초점을 맞춘 도메인 테스트를 작성해주세요
describe('PredictionGameAggregate', () => {
  it('should_reject_prediction_when_game_is_closed', () => {
    // Arrange
    const game = PredictionGameAggregate.create({...}).unwrap();
    game.closeGame();
    const prediction = createValidPrediction();
    
    // Act
    const result = game.addPrediction(prediction);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(GameAlreadyClosedError);
  });
});
```

### 통합 테스트
```typescript
// Copilot, 리포지토리 모의 객체와 함께 유스케이스 통합 테스트를 작성해주세요
describe('CreatePredictionGameHandler', () => {
  it('should_create_game_and_publish_event', async () => {
    // Arrange
    const mockRepository = createMockRepository();
    const mockEventPublisher = createMockEventPublisher();
    const handler = new CreatePredictionGameHandler(mockRepository, mockEventPublisher);
    
    // Act
    const result = await handler.handle(createValidCommand());
    
    // Assert
    expect(result.success).toBe(true);
    expect(mockRepository.save).toHaveBeenCalled();
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      expect.any(PredictionGameCreated)
    );
  });
});
```
