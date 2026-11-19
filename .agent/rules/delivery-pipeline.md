---
trigger: always_on
description: PosMul 토큰 절약형 + 품질/보안 강제 완료 검증 게이트 (Definition of Done)
---

# 🚀 작업 완료 필수 검증 게이트 (Token-Efficient & Safe DoD)

> 코드·DB 수정 완료 후 아래 3단계 게이트를 순서대로 통과합니다.  
> **원칙**: 전체 로그 덤프는 줄여 토큰을 절약하되, **타입·테스트·보안 검증 자체는 절대 생략하지 않습니다.**

---

## 🔒 필수 체크리스트

### Gate 1: 변경 범위 정밀 검증 (Type + Test + Build + DB Security)
1. **타입 체크 & 관련 단위 테스트** (수정된 앱/패키지만 실행, 실패 시에만 상세 출력):
```powershell
Set-Location -Path c:\G\posmul
# posmul-web 수정 시
pnpm -F @posmul/posmul-web type-check
pnpm -F @posmul/posmul-web test -- --passWithNoTests --silent 2>&1 | Select-Object -Last 20
# housing-pro 수정 시
pnpm -F @posmul/housing-pro type-check
# auth-economy-sdk 수정 시
pnpm -F @posmul/auth-economy-sdk type-check
```
2. **변경된 앱 프로덕션 빌드** (마지막 15줄 확인):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -CheckOnly
```
3. **DB 스키마/RPC/RLS 변경 포함 시 필수**:
   - `mcp_supabase_apply_migration`과 동일한 SQL을 `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`로 저장
   - `mcp_supabase_get_advisors(type="security")` 실행하여 신규 `ERROR` 0건 및 `SECURITY DEFINER` 노출 여부 확인

### Gate 2: Git 브랜치 확인 및 작업 단위 커밋·푸시
1. 작업 브랜치가 `develop`인지 확인 (`main` 직접 작업 절대 금지)
2. `git add -A` 대신 **작업한 파일만 명시**해 커밋·푸시 (미추적 대용량/임시 파일 혼입 방지):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -Message "feat(도메인): 작업 내용 요약" -Files "파일1,파일2"
```

### Gate 3: 선택적 Vercel 프로덕션 배포 (`-Deploy`)
평소에는 **Gate 1~2(검증 + 빌드 + 커밋/푸시)**까지만 수행합니다. 사용자가 **"배포해"**라고 요청했거나 라이브 반영 확인이 필요한 경우에만 `-Deploy` 플래그로 변경된 앱만 배포하고 `200 OK`를 확인합니다.
```powershell
powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -Message "feat(도메인): 작업 내용 요약" -Files "파일1,파일2" -Deploy
```

### ✂️ 완료 보고 규칙
- 완료 보고는 **핵심 변경 파일 링크와 검증 결과(type-check/test/build/security advisor)를 3~6줄 이내**로 간결하게 작성합니다.
- DB/로그 조회 시에도 전체 JSON 덤프 대신 `count(*)`·작은 `LIMIT`·필요한 컬럼만 조회합니다.

**버전**: 2.0 | **업데이트**: 2026-11-19
