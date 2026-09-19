# Feed Bounded Context

## 도메인 개요

Feed Context는 외부 데이터 소스(RSS, Open API 등)로부터 데이터를 수집, 정제하여 PosMul 시스템의 콘텐츠(Prediction, Forum) 초안을 생성하는 역할을 담당합니다.

## 핵심 서비스

- **Data Ingestion**: Korea.kr RSS, 국회 의안 API 데이터 수집
- **Content Classification**: LLM 기반 콘텐츠 분류 (입증 가능성 판단)
- **Draft Generation**: Prediction Game 및 Forum Topic 초안 생성
- **Bill Status Monitoring**: 국회 의안 처리 결과 모니터링 및 정산 시그널 발행

## 도메인 모델

### Aggregates
- **RssSource**: RSS 피드 소스 정보 (URL, 카테고리 등)
- **FeedItem**: 수집된 개별 콘텐츠 아이템 (기사, 의안 등)
- **Bill**: 국회 의안 정보 (의안번호, 처리상태 등)

### Value Objects
- **ContentClassification** (PREDICTION, FORUM, UNCLASSIFIED)
- **ProcessStatus** (PENDING, DRAFT_CREATED, PUBLISHED, IGNORED)

## 외부 의존성

- **LLM Service**: 콘텐츠 분류 및 요약 (Google Gemini 등)
- **Prediction Context**: Draft 생성 요청
- **Forum Context**: Draft 생성 요청
