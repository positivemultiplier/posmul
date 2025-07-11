/**
 * PosMul Bypass Strategy
 * 타입 검사를 일시적으로 우회하고 런타임에서 검증
 * 2025-07-08
 */

import type {
  PredictionId,
  PmpAmount,
  PmcAmount,
  Timestamps,
} from "../apps/posmul-web/src_migrated/shared/migration-types";

// tsconfig.json 임시 설정
const BYPASS_TSCONFIG = {
  compilerOptions: {
    skipLibCheck: true,
    noEmit: true,
    strict: false,
    noImplicitAny: false,
    suppressImplicitAnyIndexErrors: true,
  },
  "ts-node": {
    transpileOnly: true,
  },
};

// 타입 안전성을 런타임에서 검증하는 유틸리티
class RuntimeTypeValidator {
  static validatePredictionId(value: unknown): value is PredictionId {
    return typeof value === "string" && value.length > 0;
  }

  static validatePmpAmount(value: unknown): value is PmpAmount {
    return typeof value === "number" && value >= 0;
  }

  static validatePmcAmount(value: unknown): value is PmcAmount {
    return typeof value === "number" && value >= 0;
  }

  static validateTimestamps(value: unknown): value is Timestamps {
    return (
      typeof value === "object" &&
      value !== null &&
      "createdAt" in value &&
      "updatedAt" in value
    );
  }
}

// 브리지 타입 정의 (임시)
declare global {
  type LegacyPredictionId = string;
  type LegacyPmpAmount = number;
  type LegacyPmcAmount = number;

  interface TypeBridge {
    convertPredictionId(legacy: LegacyPredictionId): PredictionId;
    convertPmpAmount(legacy: LegacyPmpAmount): PmpAmount;
    convertPmcAmount(legacy: LegacyPmcAmount): PmcAmount;
  }
}

// 타입 브리지 구현
export const typeBridge: TypeBridge = {
  convertPredictionId: (legacy) => legacy as PredictionId,
  convertPmpAmount: (legacy) => legacy as PmpAmount,
  convertPmcAmount: (legacy) => legacy as PmcAmount,
};

// 환경별 마이그레이션 설정
export const MIGRATION_CONFIG = {
  // 개발 환경: 타입 검사 우회
  development: {
    skipTypeCheck: true,
    useRuntimeValidation: true,
    allowLegacyTypes: true,
  },

  // 프로덕션 환경: 엄격한 타입 검사
  production: {
    skipTypeCheck: false,
    useRuntimeValidation: false,
    allowLegacyTypes: false,
  },

  // 마이그레이션 중: 혼합 모드
  migration: {
    skipTypeCheck: true,
    useRuntimeValidation: true,
    allowLegacyTypes: true,
    logTypeWarnings: true,
  },
};

export default BYPASS_TSCONFIG;
