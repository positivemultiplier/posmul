/**
 * 회원가입 유스케이스
 */

import { IUserRepository } from '../../domain/repositories/user.repository';
import { IAuthDomainService, SignUpData, AuthResult } from '../../domain/services/auth-domain.service';
import { UserAlreadyExistsError } from '../../../../shared/utils/errors';
import type { Result } from '../../../../shared/types/common';
import { UserCreatedEvent, publishEvent } from '../../../../shared/events';

export interface ISignUpUseCase {
  execute(data: SignUpData): Promise<Result<AuthResult, Error>>;
}

export class SignUpUseCase implements ISignUpUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authDomainService: IAuthDomainService,
    private authService: IExternalAuthService // Supabase Auth 서비스
  ) {}

  async execute(data: SignUpData): Promise<Result<AuthResult, Error>> {
    // 1. 입력 데이터 검증
    const validationResult = this.authDomainService.validateSignUpData(data);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error };
    }

    try {
      // 2. 중복 이메일 확인
      const emailExists = await this.userRepository.existsByEmail(
        { value: data.email.toLowerCase() }
      );
      
      if (!emailExists.success) {
        return { success: false, error: emailExists.error };
      }
      
      if (emailExists.data) {
        return {
          success: false,
          error: new UserAlreadyExistsError('이미 사용 중인 이메일입니다.')
        };
      }

      // 3. 외부 인증 서비스에 사용자 생성
      const authUserResult = await this.authService.signUp(data);
      if (!authUserResult.success) {
        return { success: false, error: authUserResult.error };
      }

      // 4. 도메인 사용자 생성
      const userResult = this.authDomainService.createNewUser(data, authUserResult.data.id);
      if (!userResult.success) {
        // 외부 인증 서비스에서 생성된 사용자 롤백
        await this.authService.deleteUser(authUserResult.data.id);
        return { success: false, error: userResult.error };
      }

      // 5. 사용자 저장
      const saveResult = await this.userRepository.save(userResult.data);
      if (!saveResult.success) {
        // 외부 인증 서비스에서 생성된 사용자 롤백
        await this.authService.deleteUser(authUserResult.data.id);
        return { success: false, error: saveResult.error };
      }

      // 6. 도메인 이벤트 발행
      await publishEvent(new UserCreatedEvent(
        saveResult.data.id,
        {
          email: saveResult.data.email.value,
          role: saveResult.data.role.value,
          createdAt: saveResult.data.createdAt
        }
      ));

      // 7. 인증 결과 반환
      return {
        success: true,
        data: {
          user: saveResult.data,
          accessToken: authUserResult.data.accessToken,
          refreshToken: authUserResult.data.refreshToken
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('회원가입 중 오류가 발생했습니다.')
      };
    }
  }
}

// 외부 인증 서비스 인터페이스 (Supabase Auth)
export interface IExternalAuthService {
  signUp(data: SignUpData): Promise<Result<{
    id: string;
    accessToken: string;
    refreshToken: string;
  }, Error>>;
  
  signIn(credentials: { email: string; password: string }): Promise<Result<{
    id: string;
    accessToken: string;
    refreshToken: string;
  }, Error>>;
  
  signOut(): Promise<Result<void, Error>>;
  
  deleteUser(userId: string): Promise<Result<void, Error>>;
  
  refreshToken(refreshToken: string): Promise<Result<{
    accessToken: string;
    refreshToken: string;
  }, Error>>;
}
