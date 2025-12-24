---
description: PosMul 도메인별 기능 개발 워크플로우. 새 기능을 특정 도메인에 추가할 때 사용.
---

# PosMul Feature Development

## 사용 시기
- 특정 도메인(prediction, consume, donation 등)에 새 기능 추가
- 기존 기능 수정/개선

## 워크플로우

### Step 1: 도메인 파악
// turbo
1. 대상 도메인 확인 (prediction, consume, economy 등)
2. `bounded-contexts/{domain}/context.md` 읽기
3. 기존 구조 파악

### Step 2: 계층별 구현

**Domain Layer** (순수 비즈니스):
```
domain/
├── entities/        # 엔티티
├── value-objects/   # 값 객체
└── repositories/    # 인터페이스만
```

**Application Layer** (Use Cases):
```
application/
├── use-cases/       # 비즈니스 로직
└── dto/             # 데이터 전송 객체
```

**Infrastructure Layer** (외부 연동):
```
infrastructure/
└── repositories/    # MCP 구현체
```

**Presentation Layer** (UI):
```
presentation/
├── components/      # React 컴포넌트
└── hooks/           # Custom Hooks
```

### Step 3: 테스트

// turbo
```powershell
pnpm -F @posmul/posmul-web type-check
```

### Step 4: 브라우저 확인

- 개발 서버에서 기능 동작 확인
- 스크린샷 캡처 (필요시)

## 체크리스트

- [ ] Domain 엔티티 생성
- [ ] Repository 인터페이스 정의
- [ ] Use Case 구현
- [ ] MCP Repository 구현
- [ ] UI 컴포넌트 생성
- [ ] 타입 체크 통과
- [ ] 브라우저 테스트
