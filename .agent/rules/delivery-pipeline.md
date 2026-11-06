---
trigger: always_on
description: PosMul 개발 및 배포 완료 필수 검증 게이트 (Definition of Done)
---

# 🚀 작업 완료 필수 검증 게이트 (Definition of Done)

> AI 에이전트는 코드 수정 작업을 마친 후, 사용자에게 완료를 보고하기 전에 **반드시 아래 3단계 게이트를 차례대로 통과**해야 합니다. 
> 하나라도 누락하거나 건너뛴 상태로 작업을 종료하는 것은 엄격히 금지됩니다.

---

## 🔒 필수 체크리스트 (순서대로 실행)

### Gate 1: 타입 및 프로덕션 빌드 완전 검증
단순 `tsc --noEmit`이나 `type-check`만으로는 부족합니다. Next.js App Router는 빌드 타임에 라우트 유효성 검사, SSG/ISR 정적 페이지 생성, 청크 최적화를 수행하므로 반드시 프로덕션 빌드를 완주해야 합니다.
```powershell
Set-Location -Path .\posmul
pnpm --filter posmul-web build
```
- ⚠️ `Exit code: 0` 및 모든 라우트(Static/Dynamic) 생성 성공을 확인하기 전에는 절대 완료 보고를 하지 않는다.

### Gate 2: Git 브랜치 확인 및 작업 단위 커밋
프로젝트 Git 워크플로우(`git-strategy.md`)를 철저히 준수합니다.
1. 작업 브랜치가 `develop`인지 확인 (`main` 직접 작업 금지)
2. `git status`로 변경/신규/삭제된 파일 내역 정밀 검토
3. 명확한 Conventional Commits 메시지 작성 후 커밋:
```powershell
git add -A
git commit -m "feat(도메인): 작업 내용 요약"
```

### Gate 3: 원격 푸시 및 배포 파이프라인 트리거
로컬 빌드와 커밋이 완료되면 `origin/develop`에 푸시하여 GitHub Actions CI 및 Vercel 배포(`posmul.com`) 파이프라인을 가동시킵니다.
```powershell
git push origin develop
```
- 푸시 후 변경 사항이 원격에 정상 반영되었음을 확인하고 최종 보고를 전달한다.
