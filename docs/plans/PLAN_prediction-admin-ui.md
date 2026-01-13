# 관리자 UI 및 게임 생성 관리 기획

> **목적**: 예측 게임 생성/관리를 위한 관리자 대시보드 구축

---

## 현재 상황 분석

### 게임 생성 시스템 현황

**구현됨 ✅:**
- `GameSchedulingService`: 13개 템플릿 정의
- `FootballMatchSchedulerService`: 실시간 경기 조회
- `EarningsCalendarSchedulerService`: 실적 발표 조회
- `MasterGameSchedulerService`: 통합 관리

**문제점 ❌:**
- 스케줄러가 **실행되지 않고 있음** (서버 시작 시 호출 필요)
- 관리자가 템플릿을 **수동 생성/수정할 UI 없음**
- 생성된 게임들의 **모니터링 UI 없음**

---

## 게임 생성 주기 기준

### 정기 생성 주기

| 주기 | 트리거 | 게임 예시 |
|------|--------|----------|
| **시간별** | 매시 정각 | 비트코인 시간별 등락 |
| **일별** | 매일 오전 9시 | 코스피/나스닥 일일 등락 |
| **주별** | 매주 월요일 | 주간 박스오피스 1위 |
| **월별** | 매월 1일 | 소비자물가, 실업률 |
| **분기별** | 1/4/7/10월 1일 | 기업 분기실적 |

### 이벤트 기반 생성

| 트리거 | 예시 |
|--------|------|
| Football Data API | 경기 일정 조회 → 경기 2시간 전 생성 |
| FMP Earnings | 실적 발표 일정 → 발표 7일 전 생성 |
| 뉴스 키워드 | AI 분석 → 관리자 승인 후 생성 |

---

## 관리자 UI 제안

### 1. 대시보드 (Overview)

```
┌─────────────────────────────────────────────────────┐
│  예측 게임 관리자 대시보드                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [활성 게임: 42]  [대기 중: 15]  [완료: 128]         │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  오늘 생성 예정 게임                        │    │
│  │  - 10:00 EPL 맨유 vs 첼시                  │    │
│  │  - 14:00 나스닥 일일 등락                  │    │
│  │  - 18:00 비트코인 시간별                   │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  스케줄러 상태                              │    │
│  │  ✅ Football: 활성 (다음 동기화: 15분 후)   │    │
│  │  ✅ Earnings: 활성 (다음 동기화: 30분 후)   │    │
│  │  ✅ Template: 활성 (템플릿 13개)            │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 2. 템플릿 관리

| 기능 | 설명 |
|------|------|
| 템플릿 목록 | 모든 정기 템플릿 조회 |
| 템플릿 생성 | 새 정기 게임 템플릿 추가 |
| 템플릿 수정 | 기존 템플릿 수정 |
| 템플릿 활성화/비활성화 | 특정 템플릿 ON/OFF |

### 3. 수동 게임 생성

```typescript
interface ManualGameForm {
  title: string;
  description: string;
  category: Category;
  subcategory: string;
  predictionType: "binary" | "wdl" | "ranking";
  options: { id: string; label: string }[];
  startTime: Date;
  endTime: Date;
  minimumStake: number;
  maximumStake: number;
  settlementSource?: {
    type: "manual" | "api";
    config?: Record<string, unknown>;
  };
}
```

### 4. 게임 모니터링

| 뷰 | 항목 |
|------|------|
| 활성 게임 | 진행 중 게임 목록, 참여자 수, 베팅 현황 |
| 정산 대기 | 마감된 게임, 정산 상태 |
| 히스토리 | 완료된 게임, 결과, 분배 내역 |

---

## 구현 방안

### Option A: 관리자 전용 라우트 (권장)

```
/admin/prediction/
├── dashboard          # 대시보드
├── games              # 게임 목록
├── games/create       # 수동 생성
├── templates          # 템플릿 관리
├── scheduler          # 스케줄러 설정
└── settlement         # 정산 관리
```

**장점:**
- 기존 코드베이스 활용
- 빠른 구현 가능
- Next.js 미들웨어로 권한 체크

### Option B: 별도 관리자 앱

**장점:**
- 완전한 분리
- 독립적 배포

**단점:**
- 개발 시간 증가
- 코드 중복 가능성

---

## 스케줄러 실행 방안

### Cron Job (권장)

```typescript
// app/api/cron/game-scheduler/route.ts
export async function GET(request: Request) {
  // Vercel Cron 또는 외부 스케줄러에서 호출
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const scheduler = getMasterScheduler(createGameUseCase);
  await scheduler.triggerSync();

  return Response.json({ success: true });
}
```

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/game-scheduler",
      "schedule": "0 * * * *"  // 매시 정각
    }
  ]
}
```

### Supabase Edge Function

```sql
-- Supabase pg_cron 설정
SELECT cron.schedule(
  'game-scheduler',
  '0 * * * *',  -- 매시 정각
  $$
    SELECT net.http_post(
      'https://your-app.vercel.app/api/cron/game-scheduler',
      '{}',
      '{"Authorization": "Bearer xxx"}'
    );
  $$
);
```

---

## 우선순위 제안

| 순서 | 작업 | 기간 |
|------|------|------|
| 1 | Cron API 엔드포인트 구현 | 1일 |
| 2 | 관리자 대시보드 (기본) | 2-3일 |
| 3 | 템플릿 관리 CRUD | 2일 |
| 4 | 게임 모니터링 | 2일 |
| 5 | 수동 게임 생성 폼 | 2일 |

---

**작성일**: 2026-01-13
