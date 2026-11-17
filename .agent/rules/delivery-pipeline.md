---
trigger: always_on
description: PosMul 토큰 절약형 개발 및 배포 검증 게이트 (Definition of Done)
---

# 🚀 작업 완료 필수 검증 게이트 (Token-Efficient DoD)

> 코드 수정 완료 후 아래 3단계 게이트를 순서대로 통과합니다. 불필요한 전체 로그 덤프와 미수정 앱 빌드는 생략해 토큰을 절약합니다.

---

## 🔒 필수 체크리스트

### Gate 1: 변경된 앱만 프로덕션 빌드 (`tsc --noEmit` 중복 생략)
`next build`가 타입 검증과 라우트·번들 검사를 함께 수행하므로, **실제 수정된 앱만** 빌드합니다. 전체 로그 덤프 대신 `scripts/ship.ps1` 또는 마지막 15줄만 출력합니다.
```powershell
Set-Location -Path c:\G\posmul
powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -CheckOnly
# 또는 개별 확인 시:
# pnpm --filter @posmul/posmul-web build 2>&1 | Select-Object -Last 15
# pnpm --filter @posmul/housing-pro build 2>&1 | Select-Object -Last 15
```

### Gate 2: Git 브랜치 확인 및 작업 단위 커밋·푸시
1. 작업 브랜치가 `develop`인지 확인 (`main` 직접 작업 금지)
2. 작업한 파일만 명시해 커밋·푸시 (불필요한 untracked 파일 혼입 방지):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -Message "feat(도메인): 작업 내용 요약" -Files "파일1,파일2"
```

### Gate 3: 선택적 Vercel 프로덕션 배포 (`-Deploy`)
평소에는 **Gate 1~2(빌드 + 커밋/푸시)**까지만 수행해 배포 출력 토큰을 아낍니다. 사용자가 **"배포해"**라고 요청했거나 라이브 반영 확인이 필요한 경우에만 `-Deploy` 플래그로 변경된 앱만 배포하고 `200 OK`를 확인합니다.
```powershell
powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -Message "feat(도메인): 작업 내용 요약" -Files "파일1,파일2" -Deploy
```

### ✂️ 완료 보고 규칙
- 완료 보고는 **핵심 변경 파일 링크와 검증 결과 3~5줄 이내**로 간결하게 작성합니다.
- DB/로그 조회 시에도 전체 JSON 덤프 대신 `count(*)`·작은 `LIMIT`·필요한 컬럼만 조회합니다.
