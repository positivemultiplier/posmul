/**
 * 사용자 인증 도메인 서비스
 */

import { User } from '../entities/user.entity';
import { createEmail, createUserId, createUserRole } from '../value-objects/user-value-objects';
import { ValidationError } from '../../../../shared/utils/errors';
import type { Result } from '../../../../shared/types/common';

export interface AuthenticationCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthenticationCredentials {
  displayName?: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// 인증 도메인 서비스 인터페이스
export interface IAuthDomainService {
  validateSignUpData(data: SignUpData): Result<SignUpData, ValidationError>;
  validateLoginData(credentials: AuthenticationCredentials): Result<AuthenticationCredentials, ValidationError>;
  createNewUser(data: SignUpData, authId: string): Result<User, Error>;
}

export class AuthDomainService implements IAuthDomainService {
  validateSignUpData(data: SignUpData): Result<SignUpData, ValidationError> {
    try {
      // 이메일 검증
      createEmail(data.email);
      
      // 비밀번호 검증
      if (!data.password || data.password.length < 8) {
        return {
          success: false,
          error: new ValidationError('비밀번호는 최소 8자 이상이어야 합니다.', 'password')
        };
      }
      
      // 비밀번호 복잡성 검증
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(data.password)) {
        return {
          success: false,
          error: new ValidationError(
            '비밀번호는 대문자, 소문자, 숫자를 각각 하나 이상 포함해야 합니다.',
            'password'
          )
        };
      }
      
      // 표시 이름 검증 (선택사항)
      if (data.displayName && data.displayName.trim().length === 0) {
        return {
          success: false,
          error: new ValidationError('표시 이름은 공백일 수 없습니다.', 'displayName')
        };
      }
      
      return { success: true, data };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: new ValidationError(error.message, 'email')
        };
      }
      return {
        success: false,
        error: new ValidationError('유효하지 않은 회원가입 데이터입니다.')
      };
    }
  }

  validateLoginData(credentials: AuthenticationCredentials): Result<AuthenticationCredentials, ValidationError> {
    try {
      // 이메일 검증
      createEmail(credentials.email);
      
      // 비밀번호 존재 여부 검증
      if (!credentials.password || credentials.password.trim().length === 0) {
        return {
          success: false,
          error: new ValidationError('비밀번호를 입력해주세요.', 'password')
        };
      }
      
      return { success: true, data: credentials };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: new ValidationError(error.message, 'email')
        };
      }
      return {
        success: false,
        error: new ValidationError('유효하지 않은 로그인 데이터입니다.')
      };
    }
  }

  createNewUser(data: SignUpData, authId: string): Result<User, Error> {
    try {
      const email = createEmail(data.email);
      const userId = createUserId(authId);
      const role = createUserRole('citizen'); // 기본 역할

      const user = User.create({
        id: userId,
        email,
        displayName: data.displayName,
        role,
        pmcBalance: 0, // 초기 포인트 0
        pmpBalance: 0, // 초기 포인트 0
        isActive: true,
      });

      return { success: true, data: user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('사용자 생성 중 오류가 발생했습니다.')
      };
    }
  }
}
