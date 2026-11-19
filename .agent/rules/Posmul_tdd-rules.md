---
trigger: always_on
---

# TDD 및 테스트 품질 규칙 (PosMul v2.0)

> 핵심 비즈니스 로직·금융 원장·보안 경계는 반드시 실질적 행위 검증 테스트로 보호한다.

---

## 1. 테스트 작성 절대 규칙

### ✅ 필수 준수
1. **실질적 행위 검증(Behavior Verification)**: 실제 프로덕션 함수·클래스·유스케이스를 import하여 입력에 따른 출력, 상태 전이, 에러/예외 분기를 검증한다.
2. **금융·보안 경로 최우선 테스트**:
   - 잔액 차감/적립, 일일 상한(Cap), 중복 요청/Race Condition 방어, 정산 공식, 권한(인증/관리자/IDOR 차단)은 변경 시 반드시 테스트를 추가·갱신한다.
3. **단위 vs 통합 테스트 파일명 분리**:
   - 단위 테스트 (DB/네트워크 Mock, 10초 내 종료): `*.test.ts`
   - 실제 DB 연동 통합 테스트: `*.integration.test.ts` (기본 `pnpm test`에서 자동 제외)

### ❌ 절대 금지 (가짜 테스트 차단)
- ❌ 프로덕션 코드를 import하지 않고 테스트 파일 안에 Mock 클래스를 선언해 자가 검증하는 테스트 금지.
- ❌ `expect(Service).toBeDefined()`, `expect(typeof fn).toBe("function")`만 확인하고 메서드를 호출하지 않는 껍데기 테스트 금지.
- ❌ `expect(typeof result.success).toBe("boolean")`, `expect([200, 404, 500]).toContain(status)`처럼 실패해도 통과하는 무의미한 단언 금지.
- ❌ 테스트 내부에 `as any` 남용으로 계약 오류를 숨기는 행위 금지.

---

## 2. 계층별 테스트 전략

| 계층 / 대상 | 테스트 유형 | 우선순위 |
|---|---|---|
| **Domain (Entity, VO, Domain Service)** | 순수 단위 테스트 (외부 의존 0) | 최우선 (80%+) |
| **Application (UseCase, 정책, 권한 가드)** | Port Mock 기반 유스케이스 테스트 | 최우선 (70%+) |
| **API Route / Server Action (금전·인증)** | 인증 실패(401/403)·검증 실패(400)·정상 흐름 테스트 | 높음 |
| **Infrastructure (Repository / Adapter)** | 쿼리/매핑 단위 테스트 또는 `.integration.test.ts` | 권장 |
| **Presentation (UI)** | 순수 로직 분리 후 단위 테스트, 핵심 여정은 E2E | 선택 |

---

## 3. 작성 패턴 (Given-When-Then)

```typescript
describe("PredictionGame Aggregate", () => {
  it("마감된 게임에 참여 시도하면 실패 Result를 반환한다", () => {
    // Given
    const game = createClosedTestGame();
    // When
    const result = game.participate(userId, optionId, amount);
    // Then
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("GAME_NOT_ACTIVE");
    }
  });
});
```

## 4. 명령어

```powershell
pnpm -F @posmul/posmul-web test -- --passWithNoTests --silent
pnpm -F @posmul/posmul-web test -- --testPathPatterns="prediction"
```

**버전**: 2.0 | **업데이트**: 2026-11-19
