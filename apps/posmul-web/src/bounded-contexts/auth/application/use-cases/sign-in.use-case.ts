/**
 * 로그인 유스케이스
 * Supabase Auth + auth-economy-sdk 기반 인증
 */
import {
  Result,
  SupabaseAuthService,
  isFailure,
} from "@posmul/auth-economy-sdk";
import { createEmail } from "@posmul/auth-economy-sdk";

import { UserLoggedInEvent, publishEvent } from "../../../../shared/events";
import { IUserRepository } from "../../domain/repositories/user.repository";
import {
  AuthResult,
  AuthenticationCredentials,
  IAuthDomainService,
} from "../../domain/services/auth-domain.service";
import { User } from "../../domain/entities/user.entity";
import { createUserId, createUserRole } from "../../domain/value-objects/user-value-objects";

export interface ISignInUseCase {
  execute(
    credentials: AuthenticationCredentials
  ): Promise<Result<AuthResult, Error>>;
}

export class SignInUseCase implements ISignInUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authDomainService: IAuthDomainService,
    private supabaseAuthService: SupabaseAuthService // auth-economy-sdk의 SupabaseAuthService 사용
  ) {}

  async execute(
    credentials: AuthenticationCredentials
  ): Promise<Result<AuthResult, Error>> {
    try {
      // 1. 입력 데이터 검증
      const validationResult =
        this.authDomainService.validateLoginData(credentials);
      if (isFailure(validationResult)) {
        return {
          success: false,
          error: new Error("입력 데이터가 유효하지 않습니다."),
        };
      }

      // 2. Supabase Auth로 로그인 시도
      const userEmail = createEmail(credentials.email.toLowerCase());
      const authResult = await this.supabaseAuthService.signIn(
        userEmail,
        credentials.password
      );

      if (isFailure(authResult)) {
        return {
          success: false,
          error: new Error(
            "인증에 실패했습니다. 이메일과 비밀번호를 확인해주세요."
          ),
        };
      }

      // 3. 사용자 정보 조회 (추가 검증을 위해)
      const userResult = await this.userRepository.findByEmail(userEmail);

      if (isFailure(userResult)) {
        // 사용자 정보를 찾을 수 없어도 인증 정보로 최소 User를 구성해 진행
      }

      const user: User = userResult.success
        ? userResult.data
        : User.create({
            id: createUserId(authResult.data.user.id),
            email: userEmail,
            displayName: authResult.data.user.displayName,
            role: createUserRole("citizen"),
            pmcBalance: 0,
            pmpBalance: 0,
            isActive: true,
          });

      // 4. 인증 성공 이벤트 발행
      const signInEvent = new UserLoggedInEvent(
        authResult.data.user.id,
        "email",
        undefined, // ipAddress
        undefined, // userAgent
        new Date()
      );

      await publishEvent(signInEvent);

      // 5. 인증 결과 반환 - auth-economy-sdk의 AuthResult를 도메인 AuthResult로 변환
      const domainAuthResult: AuthResult = {
        user,
        accessToken: authResult.data.session.access_token,
        refreshToken: authResult.data.session.refresh_token,
      };

      return {
        success: true,
        data: domainAuthResult,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error("로그인 중 예기치 않은 오류가 발생했습니다."),
      };
    }
  }
}
