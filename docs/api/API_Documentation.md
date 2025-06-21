# PosMul API Documentation

## 개요

PosMul 플랫폼의 RESTful API 문서입니다. 모든 API는 JSON 형식으로 응답하며, 표준 HTTP 상태 코드를 사용합니다.

**Base URL**: `https://api.posmul.com` (프로덕션)  
**개발 URL**: `http://localhost:3000/api`

## 인증

현재 버전에서는 기본 인증을 사용합니다. 향후 JWT 토큰 기반 인증으로 업그레이드될 예정입니다.

## 공통 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": {
    /* 응답 데이터 */
  },
  "metadata": {
    "timestamp": "2024-12-19T10:00:00.000Z",
    "version": "1.0.0"
  }
}
```

### 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": {
      /* 추가 에러 정보 */
    }
  }
}
```

## API 엔드포인트

### 1. 시스템 헬스체크

#### GET /api/health

시스템 상태 확인

**응답 예시:**

```json
{
  "success": true,
  "status": "healthy",
  "data": {
    "timestamp": "2024-12-19T10:00:00.000Z",
    "responseTime": "15ms",
    "version": "1.0.0",
    "environment": "development",
    "services": {
      "api": "healthy",
      "database": "unknown",
      "cache": "unknown",
      "events": "unknown"
    },
    "uptime": 3600
  }
}
```

### 2. 예측 게임 API

#### GET /api/predictions/games

예측 게임 목록 조회

**쿼리 파라미터:**

- `status` (string): 게임 상태 (ACTIVE, ENDED, SETTLED)
- `limit` (number): 페이지당 항목 수 (기본값: 20)
- `offset` (number): 오프셋 (기본값: 0)
- `category` (string): 카테고리 필터
- `sortBy` (string): 정렬 기준 (기본값: created_at)
- `sortOrder` (string): 정렬 순서 (asc, desc)

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "games": [
      {
        "id": "game-uuid",
        "title": "2024 대선 결과 예측",
        "description": "2024년 대통령 선거 결과를 예측해보세요",
        "status": "ACTIVE",
        "predictionType": "binary",
        "options": [
          { "id": "option1", "label": "후보 A" },
          { "id": "option2", "label": "후보 B" }
        ],
        "startTime": "2024-12-20T00:00:00.000Z",
        "endTime": "2024-12-25T00:00:00.000Z",
        "settlementTime": "2024-12-26T00:00:00.000Z",
        "minimumStake": 10,
        "maximumStake": 1000,
        "currentParticipants": 45
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### POST /api/predictions/games

새 예측 게임 생성

**요청 본문:**

```json
{
  "title": "게임 제목",
  "description": "게임 설명 (최소 20자)",
  "predictionType": "binary",
  "options": [
    { "id": "option1", "label": "선택지 1" },
    { "id": "option2", "label": "선택지 2" }
  ],
  "startTime": "2024-12-20T00:00:00.000Z",
  "endTime": "2024-12-25T00:00:00.000Z",
  "settlementTime": "2024-12-26T00:00:00.000Z",
  "createdBy": "user-uuid",
  "importance": "medium",
  "difficulty": "medium",
  "minimumStake": 10,
  "maximumStake": 1000,
  "maxParticipants": 100
}
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "gameId": "game-uuid",
    "allocatedPrizePool": 5000,
    "estimatedParticipants": 75,
    "gameImportanceScore": 2.1
  }
}
```

#### GET /api/predictions/games/[gameId]

특정 예측 게임 상세 조회

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "game": {
      "id": "game-uuid",
      "title": "게임 제목",
      "description": "게임 설명",
      "status": "ACTIVE",
      "configuration": {
        "predictionType": "binary",
        "options": [
          /* 옵션 배열 */
        ],
        "startTime": "2024-12-20T00:00:00.000Z",
        "endTime": "2024-12-25T00:00:00.000Z",
        "settlementTime": "2024-12-26T00:00:00.000Z",
        "minimumStake": 10,
        "maximumStake": 1000
      },
      "statistics": {
        "totalParticipants": 45,
        "totalStakePool": 12500,
        "averageConfidence": 0.73
      }
    }
  }
}
```

### 3. 예측 게임 참여 API

#### POST /api/predictions/games/[gameId]/participate

예측 게임 참여

**요청 본문:**

```json
{
  "userId": "user-uuid",
  "selectedOptionId": "option1",
  "stakeAmount": 100,
  "confidence": 0.8,
  "reasoning": "선택 이유 (선택사항)"
}
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "predictionId": "prediction-uuid",
    "gameId": "game-uuid",
    "selectedOptionId": "option1",
    "stakeAmount": 100,
    "confidence": 0.8,
    "remainingPmpBalance": 900,
    "currentParticipants": 46,
    "totalStakePool": 12600
  }
}
```

#### GET /api/predictions/games/[gameId]/participate

참여 가능 여부 조회

**쿼리 파라미터:**

- `userId` (string, 필수): 사용자 ID

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "gameId": "game-uuid",
    "gameStatus": "ACTIVE",
    "canParticipate": true,
    "requirements": {
      "minimumStake": 10,
      "maximumStake": 1000,
      "maxParticipants": 100
    }
  }
}
```

### 4. 예측 게임 정산 API

#### POST /api/predictions/games/[gameId]/settle

예측 게임 정산

**요청 본문:**

```json
{
  "correctOptionId": "option1",
  "adminUserId": "admin-uuid",
  "finalResults": {
    "additionalInfo": "추가 정보"
  }
}
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "gameId": "game-uuid",
    "correctOptionId": "option1",
    "totalParticipants": 45,
    "winnersCount": 28,
    "totalStakePool": 12500,
    "totalRewardDistributed": 15000,
    "averageAccuracyScore": 0.73,
    "settlementResults": [
      {
        "userId": "user-uuid",
        "predictionId": "prediction-uuid",
        "selectedOptionId": "option1",
        "isWinner": true,
        "stakeAmount": 100,
        "accuracyScore": 0.8,
        "rewardAmount": 150
      }
    ]
  }
}
```

#### GET /api/predictions/games/[gameId]/settle

정산 가능 여부 및 정보 조회

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "gameId": "game-uuid",
    "gameStatus": "ENDED",
    "canSettle": true,
    "settlementInfo": {
      "endTime": "2024-12-25T00:00:00.000Z",
      "settlementTime": "2024-12-26T00:00:00.000Z",
      "totalParticipants": 45,
      "options": [
        /* 옵션 배열 */
      ],
      "currentTime": "2024-12-26T01:00:00.000Z"
    },
    "participationSummary": [
      {
        "userId": "user-uuid",
        "selectedOptionId": "option1",
        "stakeAmount": 100,
        "confidence": 0.8
      }
    ]
  }
}
```

### 5. 경제 시스템 API

#### GET /api/economy/pmp-pmc-overview

PMP/PMC 경제 시스템 개요

**쿼리 파라미터:**

- `userId` (string, 필수): 사용자 ID

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "userEconomy": {
      "pmpBalance": 1000,
      "pmcBalance": 500,
      "totalValue": 1500,
      "stats": {
        "weeklyPmpEarned": 150,
        "weeklyPmcEarned": 75,
        "totalTransactions": 25,
        "averageTransactionSize": 60,
        "riskScore": 0.5
      }
    },
    "systemEconomy": {
      "totalPmpInCirculation": 1000000,
      "totalPmcInCirculation": 500000,
      "activeUsers": 1250,
      "dailyTransactionVolume": 50000
    },
    "moneyWave": {
      "currentWave": 2,
      "dailyPrizePool": 25000,
      "nextDistribution": "2024-12-20T00:00:00.000Z",
      "waveEfficiency": 0.85
    },
    "marketIndicators": {
      "pmpDemand": 75,
      "pmcVolatility": 25,
      "economicHealth": 85
    }
  },
  "metadata": {
    "timestamp": "2024-12-19T10:00:00.000Z",
    "version": "1.0.0",
    "refreshInterval": 300
  }
}
```

## 에러 코드

### 공통 에러 코드

- `INTERNAL_SERVER_ERROR`: 서버 내부 오류
- `VALIDATION_ERROR`: 요청 데이터 검증 실패
- `MISSING_REQUIRED_FIELDS`: 필수 필드 누락

### 예측 게임 관련 에러 코드

- `GAME_NOT_FOUND`: 게임을 찾을 수 없음
- `GAME_NOT_ACTIVE`: 게임이 활성 상태가 아님
- `ALREADY_PARTICIPATED`: 이미 참여한 게임
- `INSUFFICIENT_PMP`: PMP 잔액 부족
- `INVALID_STAKE_AMOUNT`: 잘못된 스테이크 금액
- `GAME_FULL`: 게임 참여자 수 초과
- `ALREADY_SETTLED`: 이미 정산된 게임
- `GAME_NOT_ENDED`: 아직 종료되지 않은 게임
- `UNAUTHORIZED`: 권한 없음

### 경제 시스템 관련 에러 코드

- `MISSING_USER_ID`: 사용자 ID 누락
- `ELIGIBILITY_CHECK_FAILED`: 자격 확인 실패

## 개발 환경 설정

### API 테스트

```bash
# 헬스체크
curl http://localhost:3000/api/health

# 게임 목록 조회
curl "http://localhost:3000/api/predictions/games?status=ACTIVE&limit=10"

# 경제 현황 조회
curl "http://localhost:3000/api/economy/pmp-pmc-overview?userId=user-123"
```

### 환경 변수

```env
NODE_ENV=development
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=your-supabase-url
```

## 버전 정보

**현재 버전**: 1.0.0  
**마지막 업데이트**: 2024-12-19  
**호환성**: Next.js 15, Node.js 18+

## 지원 및 문의

- **개발팀**: PosMul Development Team
- **이슈 트래킹**: GitHub Issues
- **문서 업데이트**: 매주 수요일

---

_이 문서는 PosMul API v1.0.0 기준으로 작성되었습니다._
