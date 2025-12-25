# Demographic Data Bounded Context

## 도메인 개요

Demographic Data Context는 외부 통계 데이터(KOSIS 등)를 수집하고 분석하여 예측 모델에 필요한 기초 데이터를 제공하는 도메인입니다.

## 핵심 엔티티

- **Statistic**: 통계 데이터 항목 (인구, 경제 지표 등)

## 주요 서비스

- **CollectDemographics**: 외부 API(KOSIS 등)로부터 데이터 수집
- **StatisticRepository**: 수집된 통계 데이터 저장 및 조회

## 외부 의존성

- **KOSIS API**: 통계청 데이터 연동
- **Prediction Context**: 분석된 통계 데이터 제공
