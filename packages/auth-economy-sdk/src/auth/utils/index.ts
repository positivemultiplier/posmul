/**
 * 인증 시스템 유틸리티 함수
 */

/**
 * 환경 변수 검증 (인증 관련)
 */
export function validateAuthEnvironment(env?: Record<string, string | undefined>): boolean {
  const envVars = env || {};
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  return required.every(key => !!envVars[key]);
}

/**
 * 날짜 포맷팅 유틸리티
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR').format(date);
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 비밀번호 강도 검증
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다.');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다.');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 사용자명 유효성 검증
 */
export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (username.length < 3) {
    return { isValid: false, error: '사용자명은 최소 3자 이상이어야 합니다.' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: '사용자명은 20자를 초과할 수 없습니다.' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, error: '사용자명은 영문, 숫자, 언더스코어, 하이픈만 포함할 수 있습니다.' };
  }
  
  return { isValid: true };
}
