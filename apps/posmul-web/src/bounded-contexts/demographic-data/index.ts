/**
 * Demographic Data Bounded Context
 *
 * 인구통계 데이터 수집, 저장, 조회를 담당하는 바운디드 컨텍스트
 *
 * 주요 기능:
 * - KOSIS API를 통한 인구통계 데이터 수집
 * - 시계열 데이터 조회 및 비교
 * - Forum-Prediction 연동
 */

// Domain Layer
export * from "./domain";

// Application Layer
export * from "./application";

// Infrastructure Layer
export * from "./infrastructure";
