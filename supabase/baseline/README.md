# PosMul Supabase DR 스키마 베이스라인

> **스냅샷 기준일**: 2026-11-19 (Phase 0~3 및 고아 경제 계정 아카이브 적용 직후)  
> **원본 프로젝트**: `posmul` (`fabyagohqqnusmnwekuc`, `ap-northeast-2`, PostgreSQL 17.4.1.064)

## 포함 파일
- `20261119_schema_baseline.sql` (293 KB) — 14개 앱 스키마 전체의 스키마·확장·ENUM·테이블(129)·제약조건(423)·인덱스(221)·뷰(3)·함수(57)·트리거(22)·RLS 활성화 및 정책(180) 통합 DDL
- `remote_migrations_manifest.json` — 원격 `supabase_migrations.schema_migrations`에 기록된 179개 누적 마이그레이션 버전·이름 목록

## 복구 / 신규 환경 재현 절차
1. 신규 Supabase 프로젝트(또는 로컬 `supabase start`)에 `20261119_schema_baseline.sql`을 선행 적용합니다.
2. 이후 시점(`20261119140000` 이후)에 추가되는 `supabase/migrations/*.sql` 증분 마이그레이션만 순차 적용합니다.
3. 로컬 CLI 인증(`supabase login`) 완료 시 정기적으로 아래 명령으로 최신 스냅샷을 갱신할 수 있습니다:
   ```powershell
   supabase db dump --linked --schema assessment,consume,demographic_data,donation,economy,feed,forum,oauth_provider,prediction,public,ranking,study_cycle,user,vertical_housing -f supabase/baseline/latest_schema_baseline.sql
   ```

## 고아 경제 계정 아카이브 원복 참고
- `20261119140000_archive_orphan_economy_accounts.sql`에서 이관된 101건 고아 계정(`26,193,600 PMP` / `11,811,190 PMC`), 69건 거래, 39건 활동통계는 `economy.archived_orphan_*` 테이블(`service_role` 전용)에 무손실 보관되어 있습니다.
