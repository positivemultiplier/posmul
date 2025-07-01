# PosMul 문서 가이드

**업데이트**: 2025년 7월 1일  
**프로젝트**: PosMul AI 직접민주주의 플랫폼  
**아키텍처**: DDD + Clean Architecture + Monorepo  

---

## 🚀 빠른 시작

### 새로운 개발자라면?
👉 **[GETTING_STARTED.md](../GETTING_STARTED.md)** - 환경 설정부터 첫 커밋까지

### 아키텍처를 이해하고 싶다면?
👉 **[ARCHITECTURE.md](../ARCHITECTURE.md)** - DDD + Clean Architecture 개요

### 개발 워크플로우가 궁금하다면?
👉 **[DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md)** - MCP 도구 사용법 포함

---

## 📚 문서 구조

### 🏛️ 아키텍처 문서 (`architecture/`)
```
architecture/
├── posmul-comprehensive-architecture-overview.md    # 전체 아키텍처 개요
├── posmul-deep-dive-architecture.md                # 심화 아키텍처 분석
├── posmul-monorepo-strategy.md                     # 모노레포 전략
└── domain-driven-design-implementation.md          # DDD 구현 가이드
```

### 📖 개발 가이드 (`guides/`)
```
guides/
├── deployment/                    # 배포 가이드
├── frontend-development-guide.md  # 프론트엔드 개발
├── installation/                  # 설치 가이드
├── manage-universal-types.md      # 타입 관리
└── troubleshooting/              # 문제 해결
```

### 🔌 API 문서 (`api/`)
```
api/
└── API_Documentation.md          # REST API 문서
```

### 📋 참조 문서 (`reference/`)
```
reference/
├── api/                          # API 참조
├── cli/                          # CLI 참조
├── configuration/                # 설정 참조
├── frontend-components-guide.md  # 컴포넌트 가이드
└── mcp-tools-reference.md        # MCP 도구 참조
```

### 🎓 튜토리얼 (`tutorials/`)
```
tutorials/
├── lg-dx-school-learning-guide.md         # LG DX School 가이드
├── posmul-onboarding-for-new-devs.md     # 신규 개발자 온보딩
└── posmul-platform-onboarding-tutorial.md # 플랫폼 튜토리얼
```

### 📊 현재 프로젝트 상태
```
├── database-activation-strategy.md        # DB 활성화 전략
├── investor-technical-presentation.md     # 투자자 기술 프레젠테이션
├── project.md                             # 프로젝트 개요
└── Universal-MCP-System-외부이동-및-다중도메인지원-완료보고서.md
```

---

## 🗄️ 아카이브

### 레거시 문서 보관소 (`archive/`)
완료된 작업 보고서와 비활성 도메인 문서들이 보관되어 있습니다.
👉 **[archive/README.md](archive/README.md)** - 아카이브 가이드

---

## 🎯 문서 사용 가이드

### 📖 읽는 순서 (신규 개발자)
1. **[GETTING_STARTED.md](../GETTING_STARTED.md)** - 환경 설정
2. **[ARCHITECTURE.md](../ARCHITECTURE.md)** - 아키텍처 이해
3. **[guides/frontend-development-guide.md](guides/frontend-development-guide.md)** - 개발 시작
4. **[reference/mcp-tools-reference.md](reference/mcp-tools-reference.md)** - 도구 활용

### 🔍 특정 주제 찾기
```bash
# 예측 게임 관련 문서 검색
grep -r "prediction" docs/ --exclude-dir=archive

# MCP 도구 사용법 검색
grep -r "mcp_" docs/reference/

# 데이터베이스 스키마 정보
cat docs/database-activation-strategy.md
```

### 📝 문서 기여 가이드
- **현재 문서만 수정**: `docs/archive/`는 수정하지 않습니다
- **Mermaid 다이어그램**: 복잡한 개념은 시각화합니다
- **링크 업데이트**: 새 문서 추가 시 관련 링크를 업데이트합니다

---

## 🔧 개발 도구 연동

### VS Code 확장
- **Mermaid Preview**: 다이어그램 미리보기
- **Markdown All in One**: 문서 편집 지원
- **GitLens**: Git 히스토리 추적

### 문서 검증
```bash
# 링크 검증
markdown-link-check docs/**/*.md

# 맞춤법 검사
cspell "docs/**/*.md"
```

---

## 📊 문서 통계

### 현재 활성 문서 (2025년 7월 기준)
- **총 문서 수**: 약 60개
- **아키텍처 문서**: 4개
- **개발 가이드**: 15개
- **API/참조 문서**: 10개
- **튜토리얼**: 3개
- **프로젝트 상태**: 8개

### 아카이브된 문서
- **Task Reports**: 38개
- **Study-Cycle**: 37개
- **Migration Docs**: 15개

---

## 🚀 다음 단계

### 우선순위 문서 작성
1. **GETTING_STARTED.md** - 신규 개발자 온보딩
2. **ARCHITECTURE.md** - 아키텍처 개요
3. **DEVELOPMENT_GUIDE.md** - 개발 워크플로우
4. **guides/mcp-workflow.md** - MCP 도구 워크플로우

### 문서 품질 개선
- 기존 문서들의 현재 상태 반영
- 링크 및 참조 업데이트
- 시각화 개선 (Mermaid 다이어그램 추가)

---

**💡 팁**: 문서를 찾을 수 없다면 `docs/archive/`에서 검색해보세요! 