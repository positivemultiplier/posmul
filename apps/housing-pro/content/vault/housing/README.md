# Housing-Pro Obsidian Knowledge Vault (v1.0 — 주택관리사 2차 MVP)

> **사용법**: 이 폴더(`apps/housing-pro/content/vault/housing`)를 **Obsidian**에서 "Open folder as vault"로 열면, 모든 개념 노드의 양방향 링크(`[[개념]]`)와 그래프 뷰를 시각적으로 편집할 수 있습니다.  
> 편집 후 터미널에서 `pnpm --filter @posmul/housing-pro build:vault`를 실행하면 라이브 Supabase 기출 1,400제와 자동 매칭되어 출제 횟수·출제 연도 통계가 반영된 앱 데이터(`src/data/generated-vault-graph.json`)로 3초 만에 컴파일됩니다.

## 폴더 · ID 네임스페이스 규칙 (대규모 확장 격리)

```text
housing/
├── 01-stage1/                  # 1차 시험 (민법 · 회계원리 · 시설개론)
│   └── 03-facility/
│       └── FAC_08_PIPE/        # 배관 이음 부속품 (PoC)
├── 02-stage2/                  # ★ MVP 집중 영역: 주택관리사 2차
│   ├── 04-law/                 # 주택관리관계법규 (16단원)
│   │   ├── LAW_01_HOUSING/     # 주택법 (건설·공급·사용검사·전매)
│   │   ├── LAW_02_APT_ORG/     # 공동주택관리법 (의무관리·입대의·선관위·하자)
│   │   ├── LAW_03_APT_FIN/     # 장기수선계획·충당금·수선유지비·회계감사
│   │   ├── LAW_04_RENT/        # 민간·공공임대주택법
│   │   ├── LAW_06_BLDG/        # 건축법 (대수선·용도변경)
│   │   ├── LAW_07_SAFETY/      # 소방·승강기·시설물안전법
│   │   └── LAW_13_CONDO/       # 집합건물법 의결정족수
│   └── 05-practice/            # 공동주택관리실무 (14단원)
│       ├── PRA_01_ADMIN/       # 자치·위탁관리 · 행위허가/신고 · 관리규약
│       ├── PRA_02_RESIDENT/    # 정보공개 · 입주민 관리
│       ├── PRA_03_HR_INS/      # 근로기준법 · 4대 사회보험
│       ├── PRA_04_ACCOUNT/     # 사업자선정지침 · 예산/결산
│       └── PRA_05_FACILITY/    # 방수·저수조·수격·전기·난방·스프링클러
```

## Frontmatter 필수 스펙
- `id`: 고유 네임스페이스 ID (예: `LAW_02A_MANDATORY_APT`, `PRA_05B_WATER_TANK`)
- `title`: 개념 표시명
- `aliases`: 기출 지문 자동 매칭용 별칭 배열 (예: `[의무관리대상, 의무관리대상 공동주택]`)
- `exam_stage`: `1차` | `2차`
- `subject`: `주택관리관계법규` | `공동주택관리실무` | `공동주택시설개론` 등
- `chapter_code`: 공식 69단원 코드 (예: `LAW_02A_APT_ORG`)
- `category`: 세부 분류명
- `tags`: Obsidian 계층 태그 (`housing/2차/관계법규/LAW_02A`, `pro-field` 등)
- `contrast_axis_id`: 소속 대조 축 ID (선택)
- `contrast_side`: 대조 축 내 위치 설명 (선택)
- `same_group_ids`: 같은 분류 연관 노드 ID 배열
- `contrast_ids`: 반대/대조 개념 노드 ID 배열
- `db_search_keyword`: DB 기출 선지 조회 대표 키워드
- `law_ref`: 법령 근거 조항 (선택 — 법령 개정 추적용)
