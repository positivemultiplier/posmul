# Housing-Pro — 모노레포 아키텍처 · PMP 보상 루프 · 보안 가드레일 · 안티패턴

> 상위 헌법: [SKILL.md](../SKILL.md)

---

## 1. PosMul 모노레포 아키텍처 및 코어 경제 연동 원칙

개발팀이 PosMul 코어와 Housing-Pro를 연결할 때 준수해야 할 모노레포 구조 및 경제 원장 규칙입니다.

### ① 모노레포(Monorepo) 허브 앤 스포크 구조
* **프론트엔드 분리 (Spokes):**
  - 메인 포털: `apps/posmul-web` (커뮤니티, 예측, 기부, 랭킹)
  - 버티컬 앱: `apps/housing-pro` (전문직 수험생/소장 실무 독립 도메인/앱)
* **공통 SDK (Hub):**
  - `packages/auth-economy-sdk`: 통합 계정 SSO 인증, `PMP`/`PMC` 잔액 조회, 원장 트랜잭션, 일일 리워드 캡(Quota) 통합 검증 라이브러리
* **데이터베이스 (단일 Supabase 프로젝트 내 스키마 격리):**
  - 코어 공통 원장: `economy` (`pmp_pmc_accounts`, `pmp_pmc_transactions`, `money_wave_history`)
  - 코어 예측/광장: `prediction`, `forum`, `donation`, `consume`
  - 버티컬 전용: `vertical_housing` (`exam_questions`, `option_mastery`, `ai_scan_logs`, `legal_obligations`, `property_complexes`)
  - *향후 공인중개사(`vertical_realty`), 세무사(`vertical_tax`) 추가 시에도 `economy` 스키마 수정 없이 독립 스키마로 확장.*

### ② [핵심] 주택관리사 앱 `PMP` 발행 루프 (대표님 전략 반영)
종이책을 풀고 스마트폰으로 AI 마킹 존을 촬영하는 것은 사용자 입장에서 명백한 **귀찮은 진입 마찰(Friction)**입니다. 이를 돌파하기 위해 **[1단계 즉각 마찰 보상]**과 **[2단계 망각곡선 정복 보상]**의 투트랙으로 `PMP`를 지급합니다.

| 구분 | 유저 행동 (진성 학습 노력) | `PMP` 보상 수준 | 코어 경제 엔진 검증 조건 (어뷰징 차단) |
|---|---|---|---|
| **1단계: AI 비전 스캔 완료** | 종이책 기출문제 풀이 후 AI 마킹 존 스캔 & 자동 채점 완료 | **회당 30 ~ 50 PMP** (귀찮음 돌파 즉각 보상) | • 동일 페이지/동일 회차 중복 스캔 시 당일 1회만 인정<br>• 일일 스캔 보상 최대 **3~5회 상한 (150 PMP Cap)**<br>• AI 비전 최소 마킹 인식 신뢰도 80% 이상 |
| **2단계: 망각곡선 O/X 복습** | 스캔에서 검출된 $\bigstar/\text{X}$ 선지를 3초 컷 O/X 카드로 3회 연속 정답 처리해 `O`로 승격 | **선지당 5 ~ 10 PMP** (지식 체화 보상) | • 최소 24시간 간격(망각곡선) 복습 세션 검증<br>• 단순 연타 매크로 차단 (응답 시간 1.5초 이상 가드) |
| **소장 실무: 법정 점검 완료** | 현직 소장의 법정 의무 점검 체크리스트 완료 및 현장 사진 증빙 업로드 | **건당 50 ~ 100 PMP** (실무 완수 보상) | • 월별/분기별 법정 주기 내 1회 한정<br>• 단지 고유 코드 매핑 필수 |

### ③ 코어 경제 엔진의 PMP 중앙 통제 가드 (Hard Cap)
1. **버티컬 일일 획득 총량 상한 (Vertical Daily Cap):**
   - 유저 1인이 `Housing-Pro` 앱에서 하루에 얻을 수 있는 순수 학습 `PMP` 총합은 **최대 300 PMP**로 **서버 원자적 DB RPC + `packages/auth-economy-sdk` 코어**에서 엄격히 제한하며, 모든 지급은 반드시 `economy.pmp_pmc_transactions` 원장에 기록한다.
2. **현금 연료(`EAT`) 선순환 의무:**
   - Housing-Pro에서 발행되는 PMP의 가치 안정성을 위해, Housing-Pro 자체 수익원(종이책/전자책 판매 마진, 소장용 B2B 보수자재 제휴 광고 등)에서 발생하는 **세후 순이익(`EAT`)의 일정 비율이 중앙 `MoneyWave` 풀로 유입**됩니다.
3. **절대 침범 불가 규칙:**
   - **`PMC` 직접 지급 절대 금지**: 스캔, 합격, 점검 완료 등 어떤 버티컬 행동으로도 `PMC`를 직접 지급하지 않습니다. `PMC`는 오직 `Prediction` 마켓 성공으로만 획득합니다.
   - **`PMP` 현금 판매 및 `PMC` 환금 금지**: 사행성 규제 회피를 위해 어떠한 현금성 환전도 지원하지 않습니다.

### ④ 아키텍처 · 보안 · DB 규율 (Housing-Pro 필수 가드레일)
- **스키마 격리**: 모든 Housing-Pro 테이블은 **`vertical_housing` 스키마에만 생성**한다. `public` 스키마에 도메인 테이블 생성 절대 금지. 모든 테이블 RLS 활성화(`theory_sections` 포함), `book_serials` 미등록 시리얼 SELECT 차단, `ai_scan_logs`/`study_cones`/`study_*_logs`에 `ALL (true)` 정책 금지.
- **서버 인증 & IDOR 절대 금지**: 모든 쓰기 Server Action(`study-economy`, `prediction-widget`, `serial`, `study-cone`, `auth-profile`)은 `supabase.auth.getUser()` 세션을 필수로 요구하며, **`sessionUser?.id || params.userId` 폴백을 절대 금지**한다.
- **AI/외부 API 보호**: `/api/scan/vision`, `/api/books/parse-toc` 등 유료 Gemini 호출 API는 로그인 인증 + 입력 크기 제한 + Rate Limit을 필수로 적용한다.
- **시리얼/가입 어뷰징 차단**: 특정 접두사(`HP26-` 등) 자동 통과 백도어 금지, 이메일 미인증(`email_confirm: true`) + 대량 웰컴 보너스 즉시 지급 금지.
- **God File 금지 & 모듈 분리**: 단일 페이지/액션/스토어 파일은 **500줄 이내**를 목표로 책임별(도메인 계산 로직 / DB 액션 / UI 섹션)로 분리한다. 프로덕션 링크에 `localhost:3000` 하드코딩 금지.

---

## 2. 개발자 커뮤니케이션 가이드 (고문 발화 프로토콜)

개발자가 질문을 하거나 설계안을 가져왔을 때, 아래 기준표에 따라 피드백을 제공하십시오.

| 개발자의 흔한 제안 (Anti-Pattern) | 고문의 교정 지침 (Architectural Guidance) |
| :--- | :--- |
| *"기출문제집 테이블에 `is_correct` 불리언 컬럼 하나만 두면 되지 않나요?"* | **불가.** 문항 정답 여부(`QuestionAttempt`)와 개별 선지 숙련도(`OptionMastery`: `O/★/X` 및 1~5단계 회독 등급)를 반드시 분리해야 합니다. 맞힌 문제 속 $\bigstar/\text{X}$ 선지만 추출해 1문장 O/X 카드로 재출제하는 것이 핵심 경쟁력입니다. |
| *"AI 스캔할 때는 아무 보상도 안 주고, 나중에 복습 다 끝냈을 때만 몰아서 PMP를 줍시다."* | **불가.** 수험생 입장에서 책을 펴고 사진을 찍는 것 자체가 큰 마찰(귀찮음)입니다. 스캔 완료 즉시 **30~50 PMP의 마찰 돌파 보상**을 주어 데이터 입력을 유도하고, 이후 복습 승격 시 추가 PMP를 주는 2단계로 설계하세요. (단, 동일 페이지 중복 스캔은 코어 SDK에서 1일 1회로 제한) |
| *"주택관리사 앱 안에 예측게임이랑 랭킹 탭을 메인 하단바에 크게 박읍시다."* | **불가.** 현직 관리소장이 근무 중 앱을 켰을 때 게임/베팅 앱처럼 보이면 현장에서 절대 쓸 수 없습니다. 기본 UI는 철저히 전문 수험·업무 툴(Pro View)로 유지하고, 학습/브리핑 완료 시점의 맥락 위젯(`prediction-widget`)으로 자연스럽게 연결하세요. |
| *"주택관리사 법령 스케줄러 코드를 PosMul 코어 서버/DB에 같이 짜겠습니다."* | **불가.** 향후 공인중개사·세무사로 확장할 수 있도록 코어 원장(`economy` 스키마, `packages/auth-economy-sdk`)과 버티컬 도메인(`vertical_housing` 스키마)의 DB와 코드를 완전히 분리하세요. |
