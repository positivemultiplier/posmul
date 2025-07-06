/**
 * Universal MCP Types - MCP 전용 타입 정의
 * 
 * Model Context Protocol 작업에 특화된 타입들
 */

/**
 * MCP 작업 타입
 */
export enum MCPOperationType {
  /** SQL 실행 */
  EXECUTE_SQL = 'EXECUTE_SQL',
  /** 마이그레이션 적용 */
  APPLY_MIGRATION = 'APPLY_MIGRATION',
  /** 프로젝트 정보 조회 */
  GET_PROJECT_INFO = 'GET_PROJECT_INFO',
  /** 테이블 목록 조회 */
  LIST_TABLES = 'LIST_TABLES',
  /** 데이터베이스 스키마 조회 */
  GET_SCHEMA = 'GET_SCHEMA',
  /** 파일 생성/업데이트 */
  CREATE_OR_UPDATE_FILE = 'CREATE_OR_UPDATE_FILE',
  /** 브랜치 생성 */
  CREATE_BRANCH = 'CREATE_BRANCH',
  /** 브랜치 병합 */
  MERGE_BRANCH = 'MERGE_BRANCH',
  /** 확장 목록 조회 */
  LIST_EXTENSIONS = 'LIST_EXTENSIONS'
}

/**
 * MCP 작업 컨텍스트
 */
export interface MCPOperationContext {
  /** Supabase 프로젝트 ID */
  projectId: string;
  /** 수행할 작업 타입 */
  operation: MCPOperationType;
  /** SQL 쿼리 (해당되는 경우) */
  query?: string;
  /** 작업 매개변수 */
  parameters?: Record<string, unknown>;
  /** 재시도 정책 */
  retryPolicy?: RetryPolicy;
  /** 타임아웃 설정 (밀리초) */
  timeout?: number;
  /** 추가 옵션 */
  options?: MCPOperationOptions;
}

/**
 * 재시도 정책
 */
export interface RetryPolicy {
  /** 최대 재시도 횟수 */
  maxRetries: number;
  /** 재시도 간격 (밀리초) */
  retryDelay: number;
  /** 백오프 전략 */
  backoffStrategy: BackoffStrategy;
  /** 재시도 가능한 에러 타입 */
  retryableErrors?: string[];
}

/**
 * 백오프 전략
 */
export enum BackoffStrategy {
  /** 고정 간격 */
  FIXED = 'FIXED',
  /** 선형 증가 */
  LINEAR = 'LINEAR',
  /** 지수적 증가 */
  EXPONENTIAL = 'EXPONENTIAL'
}

/**
 * MCP 작업 옵션
 */
export interface MCPOperationOptions {
  /** 결과 캐시 여부 */
  cache?: boolean;
  /** 캐시 TTL (초) */
  cacheTTL?: number;
  /** 트랜잭션 사용 여부 */
  useTransaction?: boolean;
  /** 읽기 전용 여부 */
  readonly?: boolean;
  /** 우선순위 */
  priority?: OperationPriority;
}

/**
 * 작업 우선순위
 */
export enum OperationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * MCP 응답 데이터
 */
export interface MCPResponse<T = unknown> {
  /** 응답 데이터 */
  data: T;
  /** 영향받은 행 수 */
  rowCount?: number;
  /** 실행 시간 (밀리초) */
  executionTime?: number;
  /** 추가 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * Supabase 프로젝트 정보
 */
export interface SupabaseProjectInfo {
  /** 프로젝트 ID */
  id: string;
  /** 프로젝트 이름 */
  name: string;
  /** 조직 ID */
  organizationId: string;
  /** 지역 */
  region: string;
  /** 생성 날짜 */
  createdAt: string;
  /** 상태 */
  status: ProjectStatus;
  /** 데이터베이스 URL */
  databaseUrl?: string;
  /** API URL */
  apiUrl?: string;
}

/**
 * 프로젝트 상태
 */
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  INACTIVE = 'INACTIVE',
  COMING_UP = 'COMING_UP'
}

/**
 * 데이터베이스 테이블 정보
 */
export interface DatabaseTable {
  /** 테이블 이름 */
  name: string;
  /** 스키마 */
  schema: string;
  /** 테이블 타입 */
  type: TableType;
  /** 열 정보 */
  columns?: ColumnInfo[];
  /** 행 수 (추정치) */
  estimatedRows?: number;
}

/**
 * 테이블 타입
 */
export enum TableType {
  TABLE = 'TABLE',
  VIEW = 'VIEW',
  MATERIALIZED_VIEW = 'MATERIALIZED_VIEW',
  FOREIGN_TABLE = 'FOREIGN_TABLE'
}

/**
 * 열 정보
 */
export interface ColumnInfo {
  /** 열 이름 */
  name: string;
  /** 데이터 타입 */
  dataType: string;
  /** NULL 허용 여부 */
  isNullable: boolean;
  /** 기본값 */
  defaultValue?: string;
  /** 주키 여부 */
  isPrimaryKey?: boolean;
  /** 외래키 정보 */
  foreignKey?: ForeignKeyInfo;
}

/**
 * 외래키 정보
 */
export interface ForeignKeyInfo {
  /** 참조 테이블 */
  referencedTable: string;
  /** 참조 열 */
  referencedColumn: string;
  /** 참조 스키마 */
  referencedSchema?: string;
}
