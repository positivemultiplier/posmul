# 시스템 설계 문서

  

## 개요

  

PosMul 플랫폼은 민주주의 참여형 거버넌스 플랫폼으로, 사용자가 투자, 예측, 기부, 포럼 활동을 통해 포인트(PMP)와 코인(PMC)을 획득하고 관리할 수 있는 통합 시스템입니다.

  

## 시스템 아키텍처 개요

  

```mermaid

graph TB

    subgraph "Frontend Layer"

        WEB[Web Application<br/>Next.js 14]

        MOBILE[Mobile App<br/>React Native]

        ADMIN[Admin Dashboard<br/>React]

    end

  

    subgraph "API Gateway Layer"

        GATEWAY[API Gateway<br/>Kong/AWS API Gateway]

        AUTH[Authentication Service<br/>Auth0/Keycloak]

        RATE[Rate Limiting]

    end

  

    subgraph "Microservices Layer"

        USER[User Service<br/>사용자 관리]

        INVEST[Investment Service<br/>투자 관리]

        PREDICT[Prediction Service<br/>예측 관리]

        ECONOMIC[Economic Service<br/>경제 시스템]

        SOCIAL[Social Service<br/>포럼/기부]

        NOTIFY[Notification Service<br/>알림 서비스]

    end

  

    subgraph "Data Layer"

        POSTGRES[(PostgreSQL<br/>Core Database)]

        REDIS[(Redis<br/>Cache & Session)]

        ELASTIC[(Elasticsearch<br/>Search & Analytics)]

        S3[(AWS S3<br/>File Storage)]

    end

  

    subgraph "External Services"

        BLOCKCHAIN[Blockchain Network<br/>Ethereum/Polygon]

        PAYMENT[Payment Gateway<br/>Toss/Stripe]

        MAP[Maps API<br/>Google Maps]

        AI[AI Services<br/>OpenAI/Custom ML]

    end

  

    WEB --> GATEWAY

    MOBILE --> GATEWAY

    ADMIN --> GATEWAY

  

    GATEWAY --> AUTH

    GATEWAY --> RATE

    GATEWAY --> USER

    GATEWAY --> INVEST

    GATEWAY --> PREDICT

    GATEWAY --> ECONOMIC

    GATEWAY --> SOCIAL

    GATEWAY --> NOTIFY

  

    USER --> POSTGRES

    INVEST --> POSTGRES

    PREDICT --> POSTGRES

    ECONOMIC --> POSTGRES

    SOCIAL --> POSTGRES

  

    USER --> REDIS

    INVEST --> REDIS

    PREDICT --> REDIS

  

    PREDICT --> ELASTIC

    SOCIAL --> ELASTIC

  

    INVEST --> S3

    SOCIAL --> S3

  

    ECONOMIC --> BLOCKCHAIN

    INVEST --> PAYMENT

    INVEST --> MAP

    PREDICT --> AI

```

  

## 도메인별 시스템 설계

  

### 1. User Domain (사용자 도메인)

  

```mermaid

graph LR

    subgraph "User Domain"

        UA[User Aggregate]

        UP[User Profile]

        UW[User Wallet]

        UR[User Roles]

    end

  

    subgraph "User Services"

        US[User Service]

        AS[Auth Service]

        PS[Profile Service]

        WS[Wallet Service]

    end

  

    subgraph "User Infrastructure"

        UDB[(User Database)]

        CACHE[(Redis Cache)]

        QUEUE[Message Queue]

    end

  

    UA --> US

    UP --> PS

    UW --> WS

    UR --> AS

  

    US --> UDB

    PS --> UDB

    WS --> UDB

    AS --> CACHE

  

    US --> QUEUE

    WS --> QUEUE

```

  

**주요 컴포넌트:**

- **User Aggregate**: 사용자 기본 정보, 인증 정보 관리

- **User Profile**: 프로필, 설정, 선호도 관리

- **User Wallet**: PMP/PMC 잔액, 거래 내역 관리

- **User Roles**: 권한, 역할 관리

  

### 2. Investment Domain (투자 도메인)

  

```mermaid

graph LR

    subgraph "Investment Domain"

        IA[Investment Aggregate]

        ML[Major League]

        LL[Local League]

        CF[Cloud Funding]

    end

  

    subgraph "Investment Services"

        IS[Investment Service]

        MLS[Major League Service]

        LLS[Local League Service]

        CFS[Cloud Funding Service]

        RS[Reward Service]

    end

  

    subgraph "Investment Infrastructure"

        IDB[(Investment Database)]

        PS[Payment Service]

        MS[Map Service]

        NS[Notification Service]

    end

  

    IA --> IS

    ML --> MLS

    LL --> LLS

    CF --> CFS

  

    IS --> IDB

    MLS --> IDB

    LLS --> IDB

    CFS --> IDB

  

    IS --> PS

    LLS --> MS

    IS --> NS

```

  

**주요 컴포넌트:**

- **Investment Aggregate**: 투자 정보, 수익률 관리

- **Major League**: 대기업 광고 시청 투자

- **Local League**: 지역 상권 투자

- **Cloud Funding**: 크라우드 펀딩 프로젝트

  

### 3. Prediction Domain (예측 도메인)

  

```mermaid

graph LR

    subgraph "Prediction Domain"

        PA[Prediction Aggregate]

        PE[Prediction Event]

        PP[Prediction Participation]

        PR[Prediction Result]

    end

  

    subgraph "Prediction Services"

        PS[Prediction Service]

        ES[Event Service]

        RS[Result Service]

        AS[Analytics Service]

        AIS[AI Service]

    end

  

    subgraph "Prediction Infrastructure"

        PDB[(Prediction Database)]

        SEARCH[(Elasticsearch)]

        ML[ML Pipeline]

        EXT[External Data APIs]

    end

  

    PA --> PS

    PE --> ES

    PP --> PS

    PR --> RS

  

    PS --> PDB

    ES --> PDB

    RS --> PDB

    AS --> SEARCH

  

    PS --> ML

    ES --> EXT

    AS --> ML

```

  

**주요 컴포넌트:**

- **Prediction Aggregate**: 예측 이벤트, 참여자 관리

- **Prediction Event**: 예측 이벤트 생성/관리

- **Prediction Participation**: 사용자 예측 참여

- **Prediction Result**: 결과 처리 및 보상 지급

  

### 4. Economic Domain (경제 도메인)

  

```mermaid

graph LR

    subgraph "Economic Domain"

        EA[Economic Aggregate]

        PMP[PMP Points]

        PMC[PMC Coins]

        MW[Money Wave]

        MA[Money Allocation]

    end

  

    subgraph "Economic Services"

        ES[Economic Service]

        PS[Point Service]

        CS[Coin Service]

        MWS[Money Wave Service]

        MAS[Allocation Service]

    end

  

    subgraph "Economic Infrastructure"

        EDB[(Economic Database)]

        BC[Blockchain]

        SCHEDULER[Task Scheduler]

    end

  

    EA --> ES

    PMP --> PS

    PMC --> CS

    MW --> MWS

    MA --> MAS

  

    ES --> EDB

    PS --> EDB

    CS --> EDB

    CS --> BC

  

    MWS --> SCHEDULER

    MAS --> SCHEDULER

```

  

**주요 컴포넌트:**

- **Economic Aggregate**: 전체 경제 시스템 관리

- **PMP Points**: 포인트 발행, 소비, 전환

- **PMC Coins**: 코인 발행, 분배, 기부

- **Money Wave**: 일일 코인 발행 시스템

- **Money Allocation**: EAT 기반 분배 엔진

  

### 5. Social Domain (소셜 도메인)

  

```mermaid

graph LR

    subgraph "Social Domain"

        SA[Social Aggregate]

        FORUM[Forum]

        DONATION[Donation]

        NEWS[News]

        DEBATE[Debate]

    end

  

    subgraph "Social Services"

        SS[Social Service]

        FS[Forum Service]

        DS[Donation Service]

        NS[News Service]

        DBS[Debate Service]

    end

  

    subgraph "Social Infrastructure"

        SDB[(Social Database)]

        SEARCH[(Elasticsearch)]

        MEDIA[(Media Storage)]

        MOD[Moderation Service]

    end

  

    SA --> SS

    FORUM --> FS

    DONATION --> DS

    NEWS --> NS

    DEBATE --> DBS

  

    SS --> SDB

    FS --> SDB

    DS --> SDB

    FS --> SEARCH

  

    FS --> MEDIA

    NS --> MEDIA

    FS --> MOD

```

  

**주요 컴포넌트:**

- **Social Aggregate**: 소셜 활동 전반 관리

- **Forum**: 게시글, 댓글, 토론

- **Donation**: 기부 시스템

- **News**: 뉴스 큐레이션

- **Debate**: 토론 플랫폼

  

## 데이터 흐름 및 상호작용

  

### 1. 사용자 가입 및 인증 플로우

  

```mermaid

sequenceDiagram

    participant U as User

    participant FE as Frontend

    participant GW as API Gateway

    participant AUTH as Auth Service

    participant USER as User Service

    participant DB as Database

    participant WALLET as Wallet Service

  

    U->>FE: 회원가입 요청

    FE->>GW: POST /api/auth/register

    GW->>AUTH: 인증 정보 검증

    AUTH->>USER: 사용자 생성 요청

    USER->>DB: 사용자 정보 저장

    USER->>WALLET: 초기 지갑 생성

    WALLET->>DB: 지갑 정보 저장

    DB-->>USER: 생성 완료

    USER-->>AUTH: 사용자 생성 완료

    AUTH-->>GW: JWT 토큰 생성

    GW-->>FE: 토큰 반환

    FE-->>U: 가입 완료

```

  

### 2. 투자 참여 플로우

  

```mermaid

sequenceDiagram

    participant U as User

    participant FE as Frontend

    participant INV as Investment Service

    participant PAY as Payment Service

    participant WALLET as Wallet Service

    participant REWARD as Reward Service

  

    U->>FE: 투자 상품 선택

    FE->>INV: 투자 요청

    INV->>PAY: 결제 처리

    PAY-->>INV: 결제 완료

    INV->>WALLET: 포인트 적립

    INV->>REWARD: 보상 처리

    REWARD->>WALLET: 추가 포인트 지급

    WALLET-->>FE: 적립 완료

    FE-->>U: 투자 완료 알림

```

  

### 3. 예측 참여 및 결과 처리 플로우

  

```mermaid

sequenceDiagram

    participant U as User

    participant PRED as Prediction Service

    participant WALLET as Wallet Service

    participant ECON as Economic Service

    participant AI as AI Service

  

    U->>PRED: 예측 참여 (PMP 소모)

    PRED->>WALLET: PMP 차감

    PRED->>PRED: 예측 기록

    Note over PRED: 이벤트 종료 후

    AI->>PRED: 결과 데이터 제공

    PRED->>PRED: 결과 확정

    PRED->>ECON: 성공자 목록 전달

    ECON->>WALLET: PMC 보상 지급

    WALLET-->>U: 보상 지급 알림

```

  

## 성능 및 확장성 고려사항

  

### 1. 캐싱 전략

  

```mermaid

graph LR

    subgraph "캐싱 계층"

        CDN[CDN<br/>정적 리소스]

        REDIS[Redis<br/>세션 & 자주 조회되는 데이터]

        APP[Application Cache<br/>메모리 캐시]

    end

  

    subgraph "데이터 소스"

        DB[(Database)]

        API[External APIs]

        FILES[File Storage]

    end

  

    CDN --> FILES

    REDIS --> DB

    APP --> API

    APP --> DB

```

  

**캐싱 정책:**

- **CDN**: 이미지, CSS, JS 파일 (TTL: 24시간)

- **Redis**: 사용자 세션, 랭킹 데이터 (TTL: 1시간)

- **Application Cache**: API 응답, 설정값 (TTL: 5분)

  

### 2. 데이터베이스 최적화

  

**읽기 복제본 활용:**

```mermaid

graph LR

    APP[Application]

    MASTER[(Master DB<br/>Write)]

    REPLICA1[(Read Replica 1)]

    REPLICA2[(Read Replica 2)]

  

    APP -->|Write| MASTER

    APP -->|Read| REPLICA1

    APP -->|Read| REPLICA2

    MASTER -->|Replication| REPLICA1

    MASTER -->|Replication| REPLICA2

```

  

**샤딩 전략:**

- **User Sharding**: 사용자 ID 기반 샤딩

- **Time-based Sharding**: 거래 내역, 로그 데이터는 시간 기반 파티셔닝

  

### 3. 마이크로서비스 통신

  

```mermaid

graph TB

    subgraph "동기 통신"

        REST[REST API]

        GRPC[gRPC]

    end

  

    subgraph "비동기 통신"

        KAFKA[Apache Kafka]

        RABBITMQ[RabbitMQ]

        SQS[AWS SQS]

    end

  

    subgraph "서비스 간 호출"

        USER[User Service]

        INVEST[Investment Service]

        WALLET[Wallet Service]

    end

  

    USER -->|동기| INVEST

    INVEST -->|비동기| WALLET

    WALLET -->|이벤트| KAFKA

```

  

## 보안 아키텍처

  

### 1. 인증 및 권한 관리

  

```mermaid

graph LR

    subgraph "인증 계층"

        JWT[JWT Token]

        OAUTH[OAuth 2.0]

        MFA[Multi-Factor Auth]

    end

  

    subgraph "권한 관리"

        RBAC[Role-Based Access Control]

        POLICY[Policy Engine]

        AUDIT[Audit Log]

    end

  

    subgraph "보안 강화"

        RATE[Rate Limiting]

        WAF[Web Application Firewall]

        ENCRYPT[End-to-End Encryption]

    end

  

    JWT --> RBAC

    OAUTH --> POLICY

    MFA --> AUDIT

  

    RBAC --> RATE

    POLICY --> WAF

    AUDIT --> ENCRYPT

```

  

### 2. 데이터 보호

  

**암호화 전략:**

- **전송 중 데이터**: TLS 1.3

- **저장 데이터**: AES-256 암호화

- **민감 정보**: 개별 필드 레벨 암호화

  

**접근 제어:**

- **네트워크 레벨**: VPC, 보안 그룹

- **애플리케이션 레벨**: RBAC, 정책 기반 접근 제어

- **데이터베이스 레벨**: 행 단위 보안, 컬럼 마스킹

  

## 모니터링 및 관찰성

  

### 1. 모니터링 스택

  

```mermaid

graph TB

    subgraph "메트릭 수집"

        PROM[Prometheus]

        GRAFANA[Grafana]

        ALERT[AlertManager]

    end

  

    subgraph "로그 수집"

        ELK[ELK Stack]

        FLUENTD[Fluentd]

        KIBANA[Kibana]

    end

  

    subgraph "분산 추적"

        JAEGER[Jaeger]

        ZIPKIN[Zipkin]

        OTEL[OpenTelemetry]

    end

  

    subgraph "애플리케이션"

        SERVICES[Microservices]

    end

  

    SERVICES --> PROM

    SERVICES --> ELK

    SERVICES --> JAEGER

  

    PROM --> GRAFANA

    PROM --> ALERT

    ELK --> KIBANA

    JAEGER --> GRAFANA

```

  

### 2. 핵심 모니터링 지표

  

**비즈니스 메트릭:**

- DAU (Daily Active Users)

- 투자 참여율

- 예측 정확도

- 경제 시스템 건전성

  

**기술 메트릭:**

- API 응답 시간

- 서비스 가용성

- 데이터베이스 성능

- 캐시 히트율

  

**알림 정책:**

- **Critical**: 즉시 알림 (SMS, Slack)

- **Warning**: 5분 내 알림 (이메일)

- **Info**: 일일 리포트

  

---

  

이 시스템 설계는 PosMul 플랫폼의 핵심 요구사항을 충족하며, 확장성과 안정성을 고려한 현대적인 마이크로서비스 아키텍처를 기반으로 합니다.