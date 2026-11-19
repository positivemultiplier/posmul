---
description: 새로운 Bounded Context를 추가하는 워크플로우. 새 도메인이 필요할 때 사용.
---

# Domain Addition Workflow (v3.1)

## 사용 시기
- 완전히 새로운 비즈니스 영역 추가 (절대 `app/` 아래에 BC 없는 유령 도메인으로 바로 만들지 말 것)
- 기존 도메인에서 분리가 필요한 경우

## 워크플로우

### Step 1: 도메인 설계
1. 도메인 이름 결정 (영문 소문자, kebab-case) 및 기존 BC 편입 vs 신규 BC 여부 판단
2. 핵심 엔티티, 불변식, 타 도메인 입출력 계약(v3.0 경제 헌법 부합 여부) 정의
3. DB 스키마 이름 결정 (`Schema-per-Bounded-Context`, **`public` 스키마 금지**)

### Step 2: 폴더 구조 생성
```powershell
$domain = "new-domain"
$base = "C:\G\posmul\apps\posmul-web\src\bounded-contexts\$domain"
New-Item -ItemType Directory -Path "$base/domain/entities" -Force
New-Item -ItemType Directory -Path "$base/domain/value-objects" -Force
New-Item -ItemType Directory -Path "$base/domain/repositories" -Force
New-Item -ItemType Directory -Path "$base/application/use-cases" -Force
New-Item -ItemType Directory -Path "$base/application/dto" -Force
New-Item -ItemType Directory -Path "$base/infrastructure/repositories" -Force
New-Item -ItemType Directory -Path "$base/presentation/components" -Force
New-Item -ItemType Directory -Path "$base/presentation/hooks" -Force
```

### Step 3: `context.md` 작성
도메인 개요, 핵심 엔티티/불변식, DB 스키마, 타 BC 입출력 계약을 `bounded-contexts/{domain}/context.md`에 기록.

### Step 4: DB 스키마 + RLS + 로컬 마이그레이션 동기화
1. `mcp_supabase_apply_migration`으로 스키마 및 테이블 생성:
   - 모든 테이블 `ENABLE ROW LEVEL SECURITY` 필수
   - 쓰기 정책 `USING (true)` / `WITH CHECK (true)` 금지, `(select auth.uid())` 사용
   - `SECURITY DEFINER` 함수는 `SET search_path` + `REVOKE EXECUTE FROM PUBLIC, anon, authenticated`
2. 동일 SQL을 `supabase/migrations/YYYYMMDDHHMMSS_create_{domain}_schema.sql`에 저장.
3. 직후 `mcp_supabase_get_advisors(type="security")`로 보안 경고 0건 검증.

### Step 5: 타입 & 규칙 동기화
1. `mcp_supabase_generate_typescript_types`로 DB 타입 동기화.
2. `.agent/rules/Posmul_projectrule.md`와 필요 시 `.agent/skills/posmul-{domain}/SKILL.md` 등록.

## 체크리스트
- [ ] BC 폴더 구조 및 `context.md` 생성
- [ ] 독립 DB 스키마 생성 + 전 테이블 RLS ON + 최소 권한 정책
- [ ] 로컬 `supabase/migrations/` 파일 저장
- [ ] `get_advisors(security)` 통과
- [ ] 타입 및 규칙 문서 업데이트
