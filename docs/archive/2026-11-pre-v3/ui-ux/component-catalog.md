# Shared UI 컴포넌트 카탈로그

> 도메인 간 공유되는 프리미티브 UI 컴포넌트

---

## 원칙

> **Local First**: 비즈니스 로직이 포함된 조합 UI는 도메인에 배치.
> Shared UI는 **프리미티브만** 포함.

---

## Layout 컴포넌트

| 파일 | 크기 | 용도 |
|------|------|------|
| `ThreeRowNavbar.tsx` | 22KB | 3단 네비게이션 바 |
| `JourneyBar.tsx` | 5KB | 사용자 여정 진행바 |
| `JourneyBarContainer.tsx` | 3KB | 여정바 컨테이너 |
| `CategoryOverviewLayout.tsx` | 4KB | 카테고리 오버뷰 레이아웃 |
| `CompactBalanceWidget.tsx` | 4KB | 컴팩트 잔액 위젯 |
| `MoneyWave/` | 6개 | MoneyWave 관련 (하위 폴더) |

---

## Feedback 컴포넌트

| 파일 | 크기 | 용도 |
|------|------|------|
| `Toast.tsx` | 8KB | 토스트 알림 |
| `BaseErrorUI.tsx` | 9KB | 에러 표시 UI |
| `BaseSkeleton.tsx` | 5KB | 로딩 스켈레톤 |
| `LoadingSpinner.tsx` | 1KB | 로딩 스피너 |

**사용 예:**
```typescript
import { Toast, BaseSkeleton, LoadingSpinner } from '@/shared/ui/components/feedback';

// 토스트
<Toast message="저장 완료!" type="success" />

// 스켈레톤
<BaseSkeleton className="h-40 w-full" />

// 스피너
<LoadingSpinner size="lg" />
```

---

## Forms 컴포넌트

| 파일 | 크기 | 용도 |
|------|------|------|
| `Input.tsx` | 1KB | 기본 입력 필드 |
| `LoginForm.tsx` | 6KB | 로그인 폼 |
| `SignUpForm.tsx` | 5KB | 회원가입 폼 |

---

## Charts 컴포넌트

| 파일 | 용도 |
|------|------|
| 차트 프리미티브 | 축, 라벨, 컨테이너 등 |

> ⚠️ 도메인 의미가 포함된 차트는 도메인에 배치

---

## Base 컴포넌트

| 용도 |
|------|
| 기본 UI 요소 (6개) |

---

## Games 컴포넌트

| 용도 |
|------|
| 게임 관련 공용 UI (3개) |

---

## Motion/Animations

| 용도 |
|------|
| 애니메이션 효과 (5개 총합) |

---

## 파일 구조

```
shared/ui/
├── components/
│   ├── layout/        # 레이아웃 (12개)
│   ├── feedback/      # 피드백 (5개)
│   ├── forms/         # 폼 (4개)
│   ├── charts/        # 차트 프리미티브 (5개)
│   ├── base/          # 기본 요소 (6개)
│   ├── games/         # 게임 (3개)
│   ├── motion/        # 모션 (4개)
│   └── animations/    # 애니메이션 (1개)
├── hooks/             # 공용 훅
├── utils/             # 유틸리티
└── index.ts           # 통합 내보내기
```

---

**버전**: 1.0 | **업데이트**: 2026-01-13
