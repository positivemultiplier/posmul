# Demographic Data Bounded Context

## 도메인 개요

Demographic Data 도메인은 인구통계 데이터를 수집, 저장, 제공하는 바운디드 컨텍스트입니다. 
Forum의 토론 주제와 연계되고, Prediction 게임의 결과 검증에 활용됩니다.

## 유비쿼터스 언어 (Ubiquitous Language)

### 핵심 개념

- **Statistic**: 인구통계 데이터 포인트 (출생, 사망, 고용 등)
- **DataSource**: 데이터 출처 (KOSIS, 공공데이터포털 등)
- **Region**: 지역 정보 (광주 서구 등)
- **Period**: 통계 기간 (월간, 분기, 연간)
- **Category**: 통계 카테고리 (BIRTH, EMPLOYMENT, CPI 등)

### 통계 카테고리

| 카테고리 | 설명 | 데이터 소스 | 발표 주기 |
|---------|------|------------|----------|
| BIRTH | 출생아 수 | KOSIS 인구동향 | 월간 |
| DEATH | 사망자 수 | KOSIS 인구동향 | 월간 |
| MARRIAGE | 혼인 건수 | KOSIS 인구동향 | 월간 |
| DIVORCE | 이혼 건수 | KOSIS 인구동향 | 월간 |
| MIGRATION_IN | 전입자 수 | KOSIS 인구이동 | 월간 |
| MIGRATION_OUT | 전출자 수 | KOSIS 인구이동 | 월간 |
| EMPLOYMENT | 취업자 수 | KOSIS 고용동향 | 분기 |
| UNEMPLOYMENT | 실업률 | KOSIS 고용동향 | 분기 |
| CPI | 소비자물가지수 | KOSIS 물가 | 월간 |
| POPULATION | 총인구 | KOSIS 인구 | 연간 |

## 외부 바운디드 컨텍스트와의 관계

### Forum Context
- 인구통계 데이터를 Forum 토론 주제와 연계
- 뉴스/토론 게시물에 관련 통계 데이터 표시

### Prediction Context
- 예측 게임의 결과 검증 데이터 제공
- 실제 통계 발표 시 자동 정산 트리거

### Economy Context
- 예측 성공 시 PMC 지급 연계

## 데이터 흐름

```
KOSIS API → DataCollector → Statistics Table → PredictionVerifier → Economy (PMC)
                                ↓
                          Forum (토론 연계)
```

## 기술적 고려사항

### API 호출 제한
- KOSIS: 일 1,000건
- 공공데이터포털: 일 1,000건

### 데이터 갱신 주기
- 월간 데이터: 매월 말 수집
- 분기 데이터: 분기 말 수집
- 연간 데이터: 연말 수집

### 잠정치 vs 확정치
- 통계청 발표 초기에는 잠정치(is_preliminary=true)
- 확정치 발표 시 업데이트 필요
