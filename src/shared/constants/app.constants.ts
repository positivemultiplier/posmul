/**
 * 애플리케이션 전체에서 사용하는 상수 정의
 */

// 포인트 시스템 상수
export const POINT_SYSTEM = {
  PMC: {
    NAME: 'PMC',
    DISPLAY_NAME: 'Posmul Coin',
    // Local League 기본 적립률 (결제 금액의 1%)
    LOCAL_LEAGUE_BASE_RATE: 0.01,
    // 이벤트 기간 추가 적립률 (총 2%)
    LOCAL_LEAGUE_EVENT_RATE: 0.02,
    // 리뷰 작성 시 고정 적립
    REVIEW_REWARD: 100,
    // 월 구독자 보너스
    MONTHLY_SUBSCRIPTION_BONUS: 1000,
  },
  PMP: {
    NAME: 'PMP',
    DISPLAY_NAME: 'Posmul Point',
    // Major League 시청 기본 적립 (1분당)
    MAJOR_LEAGUE_BASE_RATE: 10,
    // 완전 시청 보너스 배율
    COMPLETE_VIEW_MULTIPLIER: 1.5,
    // 설문조사 참여 고정 적립
    SURVEY_REWARD: 100,
    // 30초 이상 시청 최소 기준
    MIN_VIEW_DURATION: 30,
  },
  // 거래 최소 단위
  MIN_TRANSACTION_AMOUNT: 1,
  // 거래 최대 단위 (일일)
  MAX_DAILY_TRANSACTION: 100000,
} as const;

// 게임 관련 상수
export const GAME_SYSTEM = {
  PREDICTION: {
    // 최소 예측 금액
    MIN_PREDICTION_AMOUNT: 100,
    // 최대 예측 금액
    MAX_PREDICTION_AMOUNT: 10000,
    // 예측 마감 시간 (시작 전 몇 분)
    DEADLINE_BEFORE_START: 30,
    // 정확도 계산 소수점 자리수
    ACCURACY_DECIMAL_PLACES: 2,
  },
  STATUS: {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    PENDING: 'PENDING',
  },
} as const;

// Local League 관련 상수
export const LOCAL_LEAGUE = {
  CATEGORIES: {
    FOOD: 'FOOD',
    CLOTHING: 'CLOTHING',
    HEALTH: 'HEALTH',
    LIFESTYLE: 'LIFESTYLE',
    EDUCATION: 'EDUCATION',
  },
  // QR 코드 만료 시간 (분)
  QR_CODE_EXPIRE_MINUTES: 10,
  // 매장 검색 반경 (km)
  SEARCH_RADIUS_KM: 5,
  // 매장 등록 최소 정보 요구사항
  MIN_STORE_INFO: {
    NAME: true,
    ADDRESS: true,
    PHONE: true,
    CATEGORY: true,
  },
} as const;

// API 관련 상수
export const API = {
  // 기본 페이지 크기
  DEFAULT_PAGE_SIZE: 20,
  // 최대 페이지 크기
  MAX_PAGE_SIZE: 100,
  // API 응답 타임아웃 (ms)
  TIMEOUT: 30000,
  // 재시도 횟수
  MAX_RETRIES: 3,
} as const;

// 사용자 인터페이스 상수
export const UI = {
  // 토스트 메시지 표시 시간 (ms)
  TOAST_DURATION: 3000,
  // 로딩 스피너 최소 표시 시간 (ms)
  MIN_LOADING_TIME: 500,
  // 디바운싱 지연 시간 (ms)
  DEBOUNCE_DELAY: 300,
  // 모바일 브레이크포인트
  MOBILE_BREAKPOINT: 768,
} as const;

// 검증 규칙 상수
export const VALIDATION = {
  USER: {
    // 사용자명 최소/최대 길이
    USERNAME_MIN_LENGTH: 2,
    USERNAME_MAX_LENGTH: 20,
    // 이메일 정규식
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // 비밀번호 최소 길이
    PASSWORD_MIN_LENGTH: 8,
  },
  STORE: {
    // 매장명 최소/최대 길이
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    // 설명 최대 길이
    DESCRIPTION_MAX_LENGTH: 500,
  },
  PREDICTION: {
    // 예측 제목 최소/최대 길이
    TITLE_MIN_LENGTH: 10,
    TITLE_MAX_LENGTH: 100,
    // 예측 설명 최대 길이
    DESCRIPTION_MAX_LENGTH: 1000,
  },
} as const;

// 날짜/시간 관련 상수
export const DATE_TIME = {
  // 기본 날짜 형식
  DEFAULT_DATE_FORMAT: 'yyyy-MM-dd',
  // 기본 시간 형식
  DEFAULT_TIME_FORMAT: 'HH:mm:ss',
  // 기본 날짜시간 형식
  DEFAULT_DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  // 타임존
  DEFAULT_TIMEZONE: 'Asia/Seoul',
} as const;

// 에러 코드 상수
export const ERROR_CODES = {
  // 인증 관련
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  
  // 사용자 관련
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_INSUFFICIENT_POINTS: 'USER_INSUFFICIENT_POINTS',
  
  // 게임 관련
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  GAME_ALREADY_ENDED: 'GAME_ALREADY_ENDED',
  PREDICTION_DEADLINE_PASSED: 'PREDICTION_DEADLINE_PASSED',
  
  // 매장 관련
  STORE_NOT_FOUND: 'STORE_NOT_FOUND',
  STORE_NOT_ACTIVE: 'STORE_NOT_ACTIVE',
  
  // 시스템 관련
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;
