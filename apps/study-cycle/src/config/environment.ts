/**
 * Study-Cycle 환경 변수 관리 시스템
 * React Native 환경에 최적화된 설정
 */

import { Platform } from 'react-native';

interface EnvironmentConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  IS_DEVELOPMENT: boolean;
  PLATFORM: 'ios' | 'android';
  APP_VERSION: string;
  BUILD_NUMBER: string;
}

const developmentConfig: EnvironmentConfig = {
  SUPABASE_URL: 'https://your-dev-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-dev-anon-key',
  IS_DEVELOPMENT: true,
  PLATFORM: Platform.OS as 'ios' | 'android',
  APP_VERSION: '0.1.0',
  BUILD_NUMBER: '1',
};

const productionConfig: EnvironmentConfig = {
  SUPABASE_URL: 'https://your-prod-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-prod-anon-key',
  IS_DEVELOPMENT: false,
  PLATFORM: Platform.OS as 'ios' | 'android',
  APP_VERSION: '1.0.0',
  BUILD_NUMBER: '1',
};

export const Environment: EnvironmentConfig = (typeof globalThis !== 'undefined' && (globalThis as { __DEV__?: boolean }).__DEV__ === true)
  ? developmentConfig 
  : productionConfig;

/**
 * 환경 변수 검증 함수
 * 필수 환경 변수가 설정되어 있는지 확인
 */
export const validateEnvironment = (): boolean => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  
  for (const key of required) {
    if (!Environment[key as keyof EnvironmentConfig]) {
      console.error(`Missing required environment variable: ${key}`);
      return false;
    }
  }
  
  return true;
};

/**
 * 환경 정보 로깅 함수 (개발 환경에서만)
 */
export const logEnvironmentInfo = (): void => {
  if (Environment.IS_DEVELOPMENT) {
    console.log('🔧 Study-Cycle Environment Info:');
    console.log(`  Platform: ${Environment.PLATFORM}`);
    console.log(`  Version: ${Environment.APP_VERSION}`);
    console.log(`  Build: ${Environment.BUILD_NUMBER}`);
    console.log(`  Development: ${Environment.IS_DEVELOPMENT}`);
  }
};
