# GitHub MCP 서버 설정 가이드

## 🔧 GitHub MCP 서버란?

GitHub MCP 서버는 AI 어시스턴트가 GitHub API를 통해 다음과 같은 작업을 수행할 수 있게 해줍니다:

- 🔍 **Repository 탐색**: 파일 검색, 코드 리뷰, 이슈 조회
- 📝 **Issue 관리**: 이슈 생성, 수정, 댓글 작성
- 🔀 **Pull Request**: PR 생성, 리뷰, 머지
- 📊 **프로젝트 분석**: 커밋 히스토리, 기여자 통계
- 🏷️ **Release 관리**: 릴리즈 노트 작성, 태그 관리

## 🚀 설정 방법

### 1. GitHub Personal Access Token 생성

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" 클릭
3. 다음 권한 선택:
   ```
   ✅ repo (전체 저장소 접근)
   ✅ workflow (GitHub Actions)
   ✅ write:packages (패키지 관리)
   ✅ read:org (조직 정보)
   ✅ project (프로젝트 관리)
   ✅ read:user (사용자 정보)
   ```
4. 토큰 생성 후 안전한 곳에 저장

### 2. 환경 변수 설정

**Windows (PowerShell):**

```powershell
# 시스템 환경 변수 설정
[Environment]::SetEnvironmentVariable("GITHUB_PERSONAL_ACCESS_TOKEN", "your-token-here", "User")
[Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "your-supabase-token", "User")

# 현재 세션에서 즉시 사용
$env:GITHUB_PERSONAL_ACCESS_TOKEN = "your-token-here"
$env:SUPABASE_ACCESS_TOKEN = "your-supabase-token"
```

**또는 .env 파일 생성:**

```env
# .env.local
GITHUB_PERSONAL_ACCESS_TOKEN=your-github-token
SUPABASE_ACCESS_TOKEN=your-supabase-token
```

### 3. Cursor 재시작

환경 변수 설정 후 Cursor를 재시작하여 MCP 서버를 활성화합니다.

## 🎯 주요 활용 사례

### 1. 이슈 관리 자동화

```typescript
// AI 어시스턴트에게 요청 예시
"새로운 기능 요청 이슈를 생성해줘:
제목: 'UI-001: Prediction Game UI Components 구현'
라벨: 'enhancement', 'ui', 'prediction'
담당자: 나
마일스톤: 'Week 4 - UI Development'"
```

### 2. Pull Request 자동 생성

```typescript
// AI 어시스턴트에게 요청 예시
"현재 브랜치의 변경사항으로 PR을 생성해줘:
제목: 'feat: Complete Repository Implementation (PD-006)'
리뷰어: team-leads
라벨: 'ready-for-review', 'backend'"
```

### 3. 코드 리뷰 지원

```typescript
// AI 어시스턴트에게 요청 예시
"PR #123의 변경사항을 분석하고 코드 리뷰 댓글을 작성해줘.
특히 TypeScript 타입 안전성과 Clean Architecture 준수 여부를 확인해줘."
```

### 4. 릴리즈 노트 자동 생성

```typescript
// AI 어시스턴트에게 요청 예시
"v0.1.0 릴리즈 노트를 생성해줘.
최근 커밋들을 분석해서 주요 기능, 버그 수정, 브레이킹 체인지를 정리해줘."
```

### 5. 프로젝트 진행 상황 분석

```typescript
// AI 어시스턴트에게 요청 예시
"이번 주 개발 진행 상황을 분석해줘:
- 완료된 이슈들
- 진행 중인 PR들
- 다음 주 우선순위 작업들"
```

## 🔍 사용 가능한 GitHub MCP 도구들

### Repository 관리

- `search_repositories`: 저장소 검색
- `get_repository`: 저장소 정보 조회
- `list_repository_contents`: 파일/폴더 목록
- `get_file_contents`: 파일 내용 조회
- `create_or_update_file`: 파일 생성/수정

### Issue 관리

- `search_issues`: 이슈 검색
- `get_issue`: 이슈 상세 조회
- `create_issue`: 새 이슈 생성
- `update_issue`: 이슈 수정
- `add_issue_comment`: 이슈 댓글 작성

### Pull Request 관리

- `search_pull_requests`: PR 검색
- `get_pull_request`: PR 상세 조회
- `create_pull_request`: 새 PR 생성
- `update_pull_request`: PR 수정
- `merge_pull_request`: PR 머지
- `add_pull_request_comment`: PR 댓글 작성

### 브랜치 관리

- `list_branches`: 브랜치 목록
- `get_branch`: 브랜치 정보 조회
- `create_branch`: 새 브랜치 생성

### 커밋 관리

- `search_commits`: 커밋 검색
- `get_commit`: 커밋 상세 조회
- `compare_commits`: 커밋 비교

## 🛡️ 보안 고려사항

### 1. 토큰 권한 최소화

- 필요한 권한만 부여
- 정기적으로 토큰 갱신
- 사용하지 않는 토큰 즉시 삭제

### 2. 환경 변수 보안

- `.env` 파일을 `.gitignore`에 추가
- 프로덕션 환경에서는 안전한 비밀 관리 도구 사용
- 토큰을 코드에 하드코딩하지 않기

### 3. API 사용량 모니터링

- GitHub API rate limit 확인
- 필요시 API 사용량 최적화

## 🔄 Supabase MCP와 함께 사용

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--features=database,docs,development,functions,debug"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github@latest"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

## 🎯 PosMul 프로젝트 활용 예시

### 1. 작업 진행 상황 자동 업데이트

```typescript
// AI가 자동으로 이슈 상태 업데이트
"PD-006 Repository 구현이 완료되었으니 해당 이슈를 closed로 변경하고,
다음 작업인 UI-001 이슈를 생성해줘."
```

### 2. 코드 리뷰 자동화

```typescript
// AI가 DDD 아키텍처 준수 여부 자동 검토
"새로운 PR의 Repository 구현체가 Clean Architecture 원칙을
잘 따르고 있는지 리뷰해줘. 특히 의존성 규칙 위반이 없는지 확인해줘."
```

### 3. 릴리즈 관리

```typescript
// 마일스톤 기반 릴리즈 노트 생성
"Week 3 마일스톤이 완료되었으니 v0.3.0 릴리즈를 생성하고,
완료된 작업들을 정리한 릴리즈 노트를 작성해줘."
```

## 🚨 문제 해결

### MCP 서버 연결 실패

1. 환경 변수가 올바르게 설정되었는지 확인
2. GitHub 토큰 권한이 충분한지 확인
3. Cursor 재시작
4. 네트워크 연결 상태 확인

### API Rate Limit 초과

1. GitHub API 사용량 확인
2. 불필요한 API 호출 최소화
3. 필요시 GitHub Pro 계정으로 업그레이드

### 권한 오류

1. 토큰 권한 재확인
2. Repository 접근 권한 확인
3. 조직 설정에서 토큰 승인 여부 확인

---

**GitHub MCP 서버를 통해 개발 워크플로우를 자동화하고 생산성을 크게 향상시킬 수 있습니다!** 🚀
