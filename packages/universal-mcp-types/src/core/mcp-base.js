/**
 * Universal MCP Types - MCP 전용 타입 정의
 *
 * Model Context Protocol 작업에 특화된 타입들
 */
/**
 * MCP 작업 타입
 */
export var MCPOperationType;
(function (MCPOperationType) {
    /** SQL 실행 */
    MCPOperationType["EXECUTE_SQL"] = "EXECUTE_SQL";
    /** 마이그레이션 적용 */
    MCPOperationType["APPLY_MIGRATION"] = "APPLY_MIGRATION";
    /** 프로젝트 정보 조회 */
    MCPOperationType["GET_PROJECT_INFO"] = "GET_PROJECT_INFO";
    /** 테이블 목록 조회 */
    MCPOperationType["LIST_TABLES"] = "LIST_TABLES";
    /** 데이터베이스 스키마 조회 */
    MCPOperationType["GET_SCHEMA"] = "GET_SCHEMA";
    /** 파일 생성/업데이트 */
    MCPOperationType["CREATE_OR_UPDATE_FILE"] = "CREATE_OR_UPDATE_FILE";
    /** 브랜치 생성 */
    MCPOperationType["CREATE_BRANCH"] = "CREATE_BRANCH";
    /** 브랜치 병합 */
    MCPOperationType["MERGE_BRANCH"] = "MERGE_BRANCH";
    /** 확장 목록 조회 */
    MCPOperationType["LIST_EXTENSIONS"] = "LIST_EXTENSIONS";
})(MCPOperationType || (MCPOperationType = {}));
/**
 * 백오프 전략
 */
export var BackoffStrategy;
(function (BackoffStrategy) {
    /** 고정 간격 */
    BackoffStrategy["FIXED"] = "FIXED";
    /** 선형 증가 */
    BackoffStrategy["LINEAR"] = "LINEAR";
    /** 지수적 증가 */
    BackoffStrategy["EXPONENTIAL"] = "EXPONENTIAL";
})(BackoffStrategy || (BackoffStrategy = {}));
/**
 * 작업 우선순위
 */
export var OperationPriority;
(function (OperationPriority) {
    OperationPriority["LOW"] = "LOW";
    OperationPriority["NORMAL"] = "NORMAL";
    OperationPriority["HIGH"] = "HIGH";
    OperationPriority["CRITICAL"] = "CRITICAL";
})(OperationPriority || (OperationPriority = {}));
/**
 * 프로젝트 상태
 */
export var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["ACTIVE"] = "ACTIVE";
    ProjectStatus["PAUSED"] = "PAUSED";
    ProjectStatus["INACTIVE"] = "INACTIVE";
    ProjectStatus["COMING_UP"] = "COMING_UP";
})(ProjectStatus || (ProjectStatus = {}));
/**
 * 테이블 타입
 */
export var TableType;
(function (TableType) {
    TableType["TABLE"] = "TABLE";
    TableType["VIEW"] = "VIEW";
    TableType["MATERIALIZED_VIEW"] = "MATERIALIZED_VIEW";
    TableType["FOREIGN_TABLE"] = "FOREIGN_TABLE";
})(TableType || (TableType = {}));
