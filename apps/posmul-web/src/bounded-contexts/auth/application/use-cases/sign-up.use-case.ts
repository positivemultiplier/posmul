/**
 * 회원가입 유스케이스
 */

import { UserCreatedEvent, publishEvent } from "../../../../shared/events";
import type { Result } from "@posmul/shared-types";
import { UserAlreadyExistsError } from "@posmul/shared-ui";
import { IUserRepository } from "../../domain/repositories/user.repository";
import {
  AuthResult,
  IAuthDomainService,
  SignUpData,
} from "../../domain/services/auth-domain.service";

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
      return validationResult;
    }

    try {
      // 2. 중복 이메일 확인
      const emailExists = await this.userRepository.existsByEmail({
        value: data.email.toLowerCase(),
      });

      if (!emailExists.success) {
        return emailExists;
      }

      if (emailExists.data) {
        return {
          success: false,
          error: new UserAlreadyExistsError("이미 사용 중인 이메일입니다."),
        };
      }

      // 3. 외부 인증 서비스에 사용자 생성
      const authUserResult = await this.authService.signUp(data);
      if (!authUserResult.success) {
        return authUserResult;
      }

      // 4. 도메인 사용자 생성
      const userResult = this.authDomainService.createNewUser(
        data,
        authUserResult.data.id
      );
      if (!userResult.success) {
        // 외부 인증 서비스에서 생성된 사용자 롤백
        await this.authService.deleteUser(authUserResult.data.id);
        return userResult;
      }

      // 5. 사용자 저장
      const saveResult = await this.userRepository.save(userResult.data);
      if (!saveResult.success) {
        // 외부 인증 서비스에서 생성된 사용자 롤백
        await this.authService.deleteUser(authUserResult.data.id);
        return saveResult;
      }

      // 6. 도메인 이벤트 발행
      await publishEvent(
        new UserCreatedEvent(
          saveResult.data.id as any,
          saveResult.data.email.value,
          saveResult.data.email.value, // username으로 email 사용
          false, // profileComplete
          undefined, // referredBy
          saveResult.data.createdAt
        )
      );

      // 7. 인증 결과 반환
      return {
        success: true,
        data: {
          user: saveResult.data,
          accessToken: authUserResult.data.accessToken,
          refreshToken: authUserResult.data.refreshToken,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("회원가입 중 오류가 발생했습니다."),
      };
    }
  }
}

// 외부 인증 서비스 인터페이스 (Supabase Auth)
export interface IExternalAuthService {
  signUp(data: SignUpData): Promise<
    Result<
      {
        id: string;
        accessToken: string;
        refreshToken: string;
      },
      Error
    >
  >;

  signIn(credentials: { email: string; password: string }): Promise<
    Result<
      {
        id: string;
        accessToken: string;
        refreshToken: string;
      },
      Error
    >
  >;

  signOut(): Promise<Result<void, Error>>;

  deleteUser(userId: string): Promise<Result<void, Error>>;

  refreshToken(refreshToken: string): Promise<
    Result<
      {
        accessToken: string;
        refreshToken: string;
      },
      Error
    >
  >;
}
