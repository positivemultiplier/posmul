---
description: 새로운 Bounded Context를 추가하는 워크플로우. 새 도메인이 필요할 때 사용.
---

# Domain Addition Workflow

## 사용 시기
- 완전히 새로운 비즈니스 영역 추가
- 기존 도메인에서 분리가 필요한 경우

## 워크플로우

### Step 1: 도메인 설계

1. 도메인 이름 결정 (영문 소문자, kebab-case)
2. 핵심 엔티티 정의
3. DB 스키마 이름 결정 (도메인과 동일)

### Step 2: 폴더 구조 생성

// turbo
```powershell
$domain = "new-domain"
$base = "apps/posmul-web/src/bounded-contexts/$domain"
New-Item -ItemType Directory -Path "$base/domain/entities" -Force
New-Item -ItemType Directory -Path "$base/domain/value-objects" -Force
New-Item -ItemType Directory -Path "$base/domain/repositories" -Force
New-Item -ItemType Directory -Path "$base/application/use-cases" -Force
New-Item -ItemType Directory -Path "$base/application/dto" -Force
New-Item -ItemType Directory -Path "$base/infrastructure/repositories" -Force
New-Item -ItemType Directory -Path "$base/presentation/components" -Force
New-Item -ItemType Directory -Path "$base/presentation/hooks" -Force
New-Item -ItemType Directory -Path "$base/__tests__" -Force
```

### Step 3: context.md 생성

`context.md` 파일에 도메인 설명 작성:

```markdown
# {Domain Name} Bounded Context

## 도메인 개요
{설명}

## 핵심 서비스
{서비스 목록}

## 도메인 모델
{엔티티, Value Objects}
```

### Step 4: DB 스키마 생성

MCP 도구로 스키마 생성:
```sql
CREATE SCHEMA IF NOT EXISTS {domain_name};
```

### Step 5: 타입 생성

// turbo
```powershell
타입 생성: VS Code(MCP)에서 `mcp_com_supabase__generate_typescript_types`
```

## 체크리스트

- [ ] 폴더 구조 생성
- [ ] context.md 작성
- [ ] DB 스키마 생성
- [ ] 타입 생성
- [ ] projectrule.md에 도메인 추가
