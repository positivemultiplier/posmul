# MCP (Model Context Protocol) 통합 지침

## 외부 서비스를 위한 MCP 통합 구현 시:

### MCP 클라이언트 설정
```typescript
// Copilot, 외부 서비스 통신을 위한 MCP 클라이언트를 생성해주세요
export interface MCPClientConfig {
  serverUrl: string;
  timeout: number;
  retryAttempts: number;
  apiKey?: string;
}

export class MCPClient {
  constructor(private readonly config: MCPClientConfig) {}
  
  async call<TRequest, TResponse>(
    method: string,
    params: TRequest
  ): Promise<Result<TResponse, MCPError>> {
    try {
      const response = await fetch(`${this.config.serverUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: generateRequestId()
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });
      
      if (!response.ok) {
        return { 
          success: false, 
          error: new MCPError(`HTTP ${response.status}: ${response.statusText}`) 
        };
      }
      
      const result = await response.json();
      
      if (result.error) {
        return { 
          success: false, 
          error: new MCPError(result.error.message, result.error.code) 
        };
      }
        return { success: true, data: result.result };
    } catch (error) {
      return { 
        success: false, 
        error: new MCPError(`MCP 호출 실패: ${error.message}`) 
      };
    }
  }
}
```

### Supabase MCP 서비스
```typescript
// Copilot, Supabase 작업을 위한 MCP 서비스를 구현해주세요
export class SupabaseMCPService {
  constructor(
    private readonly mcpClient: MCPClient,
    private readonly logger: Logger
  ) {}
  
  async createPrediction(
    prediction: CreatePredictionData
  ): Promise<Result<PredictionDto, MCPError>> {
    this.logger.info('MCP를 통한 예측 생성', { predictionId: prediction.id });
    
    const result = await this.mcpClient.call<CreatePredictionData, PredictionDto>(
      'supabase.predictions.create',
      prediction
    );
    
    if (!result.success) {
      this.logger.error('MCP를 통한 예측 생성 실패', { 
        error: result.error.message,
        predictionId: prediction.id 
      });
    }
    
    return result;
  }
  
  async getPredictionsByGame(
    gameId: string
  ): Promise<Result<PredictionDto[], MCPError>> {
    return this.mcpClient.call<{ gameId: string }, PredictionDto[]>(
      'supabase.predictions.getByGame',
      { gameId }
    );
  }
  
  async updatePredictionStatus(
    predictionId: string,
    status: PredictionStatus
  ): Promise<Result<void, MCPError>> {
    return this.mcpClient.call<{ predictionId: string; status: PredictionStatus }, void>(
      'supabase.predictions.updateStatus',
      { predictionId, status }
    );
  }
}
```

### 외부 API MCP 서비스
```typescript
// Copilot, 외부 마켓 데이터 API를 위한 MCP 서비스를 생성해주세요
export class MarketDataMCPService {
  constructor(
    private readonly mcpClient: MCPClient,
    private readonly logger: Logger
  ) {}
  
  async getMarketPrice(
    symbol: string
  ): Promise<Result<MarketPriceData, MCPError>> {
    this.logger.info('MCP를 통한 마켓 가격 조회', { symbol });
    
    const result = await this.mcpClient.call<{ symbol: string }, MarketPriceData>(
      'marketdata.price.current',
      { symbol }
    );
    
    if (result.success) {
      this.logger.info('마켓 가격 조회 성공', { 
        symbol, 
        price: result.data.price 
      });
    }
    
    return result;
  }
  
  async getHistoricalPrices(
    symbol: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<HistoricalPriceData[], MCPError>> {
    return this.mcpClient.call<GetHistoricalPricesParams, HistoricalPriceData[]>(
      'marketdata.price.historical',
      { 
        symbol, 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      }
    );
  }
    async subscribeToMarketUpdates(
    symbols: string[],
    callback: (update: MarketUpdate) => void
  ): Promise<Result<SubscriptionId, MCPError>> {
    // MCP를 통한 WebSocket 기반 구독
    const result = await this.mcpClient.call<{ symbols: string[] }, { subscriptionId: string }>(
      'marketdata.subscribe',
      { symbols }
    );
    
    if (result.success) {
      // 실시간 업데이트를 위한 WebSocket 연결 설정
      this.setupMarketSubscription(result.data.subscriptionId, callback);
    }
    
    return result;
  }
  
  private setupMarketSubscription(
    subscriptionId: string,
    callback: (update: MarketUpdate) => void
  ): void {
    // 실시간 업데이트를 위한 WebSocket 구현
    const ws = new WebSocket(`${this.mcpClient.config.serverUrl}/ws/${subscriptionId}`);
    
    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data) as MarketUpdate;
        callback(update);
      } catch (error) {
        this.logger.error('마켓 업데이트 파싱 실패', { error });
      }
    };
  }
}
```

### MCP 에러 처리
```typescript
// Copilot, 포괄적인 MCP 에러 처리를 구현해주세요
export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class MCPRetryableError extends MCPError {
  constructor(message: string, public readonly retryAfter?: number) {
    super(message);
    this.name = 'MCPRetryableError';
  }
}

export class MCPRateLimitError extends MCPError {
  constructor(
    message: string,
    public readonly resetTime: Date,
    public readonly limit: number
  ) {
    super(message);
    this.name = 'MCPRateLimitError';
  }
}
```

### 지수 백오프를 포함한 재시도 로직
```typescript
// Copilot, MCP 호출을 위한 재시도 로직을 구현해주세요
export class MCPRetryHandler {
  constructor(
    private readonly maxRetries: number = 3,
    private readonly baseDelay: number = 1000,
    private readonly maxDelay: number = 10000
  ) {}
  
  async executeWithRetry<T>(
    operation: () => Promise<Result<T, MCPError>>,
    isRetryable: (error: MCPError) => boolean = (error) => error instanceof MCPRetryableError
  ): Promise<Result<T, MCPError>> {
    let lastError: MCPError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const result = await operation();
      
      if (result.success) {
        return result;
      }
        lastError = result.error;
      
      if (!isRetryable(lastError) || attempt === this.maxRetries) {
        break;
      }
      
      const delay = Math.min(
        this.baseDelay * Math.pow(2, attempt),
        this.maxDelay
      );
      
      await this.delay(delay);
    }
    
    return { success: false, error: lastError! };
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### MCP 서킷 브레이커
```typescript
// Copilot, MCP 서비스를 위한 서킷 브레이커 패턴을 구현해주세요
export class MCPCircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeout: number = 60000
  ) {}
  
  async execute<T>(
    operation: () => Promise<Result<T, MCPError>>
  ): Promise<Result<T, MCPError>> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        return { 
          success: false, 
          error: new MCPError('서킷 브레이커가 OPEN 상태입니다') 
        };
      }
    }
    
    try {
      const result = await operation();
      
      if (result.success) {
        this.onSuccess();
      } else {
        this.onFailure();
      }
      
      return result;
    } catch (error) {
      this.onFailure();
      return { 
        success: false, 
        error: new MCPError(`서킷 브레이커 에러: ${error.message}`) 
      };
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.resetTimeout;
  }
}
```

### MCP 서비스 팩토리
```typescript
// Copilot, 의존성 주입을 포함한 MCP 서비스 팩토리를 생성해주세요
export class MCPServiceFactory {
  private readonly mcpClient: MCPClient;
  private readonly retryHandler: MCPRetryHandler;
  private readonly circuitBreaker: MCPCircuitBreaker;
  private readonly logger: Logger;
  
  constructor(config: MCPClientConfig, logger: Logger) {
    this.mcpClient = new MCPClient(config);
    this.retryHandler = new MCPRetryHandler();
    this.circuitBreaker = new MCPCircuitBreaker();
    this.logger = logger;
  }
  
  createSupabaseService(): SupabaseMCPService {
    return new SupabaseMCPService(this.mcpClient, this.logger);
  }
  
  createMarketDataService(): MarketDataMCPService {
    return new MarketDataMCPService(this.mcpClient, this.logger);
  }
  
  createNotificationService(): NotificationMCPService {
    return new NotificationMCPService(this.mcpClient, this.logger);
  }
}
```

### MCP Health Check
```typescript
// Copilot, implement health check for MCP services
export class MCPHealthChecker {
  constructor(
    private readonly mcpClient: MCPClient,
    private readonly logger: Logger
  ) {}
  
  async checkHealth(): Promise<HealthStatus> {
    try {
      const startTime = Date.now();
      
      const result = await this.mcpClient.call<{}, { status: string; timestamp: string }>(
        'system.health',
        {}
      );
      
      const responseTime = Date.now() - startTime;
      
      if (result.success) {
        return {
          status: 'healthy',
          responseTime,
          lastCheck: new Date(),
          details: result.data
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime,
          lastCheck: new Date(),
          error: result.error.message
        };
      }
    } catch (error) {
      this.logger.error('MCP health check failed', { error });
      
      return {
        status: 'unhealthy',
        responseTime: -1,
        lastCheck: new Date(),
        error: error.message
      };
    }
  }
  
  async startPeriodicHealthCheck(
    interval: number = 30000,
    onStatusChange?: (status: HealthStatus) => void
  ): Promise<void> {
    setInterval(async () => {
      const status = await this.checkHealth();
      
      this.logger.info('MCP health check completed', { 
        status: status.status,
        responseTime: status.responseTime 
      });
      
      if (onStatusChange) {
        onStatusChange(status);
      }
    }, interval);
  }
}
```

### MCP Service Integration in Infrastructure Layer
```typescript
// Copilot, integrate MCP services into repository implementations
export class MCPPredictionGameRepository implements IPredictionGameRepository {
  constructor(
    private readonly supabaseMCPService: SupabaseMCPService,
    private readonly retryHandler: MCPRetryHandler,
    private readonly logger: Logger
  ) {}
  
  async save(aggregate: PredictionGameAggregate): Promise<Result<void, RepositoryError>> {
    const dto = PredictionGameMapper.toDto(aggregate);
    
    const result = await this.retryHandler.executeWithRetry(
      () => this.supabaseMCPService.createPredictionGame(dto)
    );
    
    if (!result.success) {
      this.logger.error('Failed to save prediction game', { 
        gameId: aggregate.id,
        error: result.error.message 
      });
      
      return { 
        success: false, 
        error: new RepositoryError('Failed to save prediction game') 
      };
    }
    
    return { success: true, data: undefined };
  }
  
  async findById(id: PredictionGameId): Promise<Result<PredictionGameAggregate | null, RepositoryError>> {
    const result = await this.supabaseMCPService.getPredictionGame(id.value);
    
    if (!result.success) {
      return { 
        success: false, 
        error: new RepositoryError('Failed to find prediction game') 
      };
    }
    
    if (!result.data) {
      return { success: true, data: null };
    }
    
    const aggregate = PredictionGameMapper.toDomain(result.data);
    return { success: true, data: aggregate };
  }
}
```
