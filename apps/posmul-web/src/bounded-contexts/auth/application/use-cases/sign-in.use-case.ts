/**
 * 로그인 유스케이스
 */

import { IUserRepository } from '../../domain/repositories/user.repository';
import { IAuthDomainService, AuthenticationCredentials, AuthResult } from '../../domain/services/auth-domain.service';
import { IExternalAuthService } from './sign-up.use-case';
import { UserNotFoundError, InvalidCredentialsError } from '@posmul/shared-ui';
import type { Result } from '@posmul/shared-types';

export interface ISignInUseCase {
  execute(credentials: AuthenticationCredentials): Promise<Result<AuthResult, Error>>;
}

export class SignInUseCase implements ISignInUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authDomainService: IAuthDomainService,
    private authService: IExternalAuthService
  ) {}

  async execute(credentials: AuthenticationCredentials): Promise<Result<AuthResult, Error>> {
    // 1. 입력 데이터 검증
    const validationResult = this.authDomainService.validateLoginData(credentials);
    if (!validationResult.success) {
      return validationResult;
    }

    try {
      // 2. 사용자 존재 여부 확인
      const userResult = await this.userRepository.findByEmail({
        value: credentials.email.toLowerCase()
      });
      
      if (!userResult.success) {
        return userResult;
      }
      
      if (!userResult.data) {
        return {
          success: false,
          error: new UserNotFoundError('존재하지 않는 사용자입니다.')
        };
      }

      const user = userResult.data;

      // 3. 사용자 활성 상태 확인
      if (!user.isActive) {
        return {
          success: false,
          error: new InvalidCredentialsError('비활성화된 계정입니다.')
        };
      }

      // 4. 외부 인증 서비스로 로그인
      const authResult = await this.authService.signIn(credentials);
      if (!authResult.success) {
        return {
          success: false,
          error: new InvalidCredentialsError('이메일 또는 비밀번호가 올바르지 않습니다.')
        };
      }

      // 5. 인증 결과 반환
      return {
        success: true,
        data: {
          user,
          accessToken: authResult.data.accessToken,
          refreshToken: authResult.data.refreshToken
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('로그인 중 오류가 발생했습니다.')
      };
    }
  }
}
