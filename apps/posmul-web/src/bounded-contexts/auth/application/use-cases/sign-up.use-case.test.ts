/**
 * SignUpUseCase 테스트
 */
import { AuthError, ValidationError } from "@posmul/auth-economy-sdk";

import { SignUpUseCase } from "./sign-up.use-case";

// Mock implementations
const mockUserRepository = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  existsByEmail: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
};

const mockAuthDomainService = {
  validateSignUpData: jest.fn(),
  validateLoginData: jest.fn(),
  createNewUser: jest.fn(),
};

const mockExternalAuthService = {
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  deleteUser: jest.fn(),
  refreshToken: jest.fn(),
  signInWithOAuth: jest.fn(),
};

// Mock publishEvent
jest.mock("../../../../shared/events", () => ({
  UserCreatedEvent: jest.fn(),
  publishEvent: jest.fn(),
}));

describe("SignUpUseCase", () => {
  let useCase;
  let mockUser;
  let signUpData;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    useCase = new SignUpUseCase(
      mockUserRepository,
      mockAuthDomainService,
      mockExternalAuthService
    );

    // Mock user data
    mockUser = {
      id: "user-123",
      email: { valueOf: () => "test@example.com" },
      displayName: "Test User",
      createdAt: new Date(),
    };

    signUpData = {
      email: "test@example.com",
      password: "password123",
      displayName: "Test User",
    };
  });

  describe("성공 케이스", () => {
    it("정상적인 회원가입 시 성공 결과를 반환해야 한다", async () => {
      // Given
      const authUserData = {
        id: "auth-user-123",
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      mockAuthDomainService.validateSignUpData.mockReturnValue({
        success: true,
        data: signUpData,
      });

      mockUserRepository.existsByEmail.mockResolvedValue({
        success: true,
        data: false,
      });

      mockExternalAuthService.signUp.mockResolvedValue({
        success: true,
        data: authUserData,
      });

      mockAuthDomainService.createNewUser.mockReturnValue({
        success: true,
        data: mockUser,
      });

      mockUserRepository.save.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      // When
      const result = await useCase.execute(signUpData);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toEqual(mockUser);
        expect(result.data.accessToken).toBe(authUserData.accessToken);
        expect(result.data.refreshToken).toBe(authUserData.refreshToken);
      }

      expect(mockAuthDomainService.validateSignUpData).toHaveBeenCalledWith(
        signUpData
      );
      expect(mockUserRepository.existsByEmail).toHaveBeenCalled();
      expect(mockExternalAuthService.signUp).toHaveBeenCalledWith(signUpData);
      expect(mockAuthDomainService.createNewUser).toHaveBeenCalledWith(
        signUpData,
        authUserData.id
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("실패 케이스", () => {
    it("데이터 검증 실패 시 에러를 반환해야 한다", async () => {
      // Given
      mockAuthDomainService.validateSignUpData.mockReturnValue({
        success: false,
        error: new ValidationError("password", { code: "INVALID_PASSWORD" }),
      });

      // When
      const result = await useCase.execute(signUpData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("처리에 실패했습니다.");
      }
    });

    it("이메일 중복 시 에러를 반환해야 한다", async () => {
      // Given
      mockAuthDomainService.validateSignUpData.mockReturnValue({
        success: true,
        data: signUpData,
      });

      mockUserRepository.existsByEmail.mockResolvedValue({
        success: true,
        data: true, // 이미 존재
      });

      // When
      const result = await useCase.execute(signUpData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AuthError);
        expect(result.error.message).toBe("이미 사용 중인 이메일입니다.");
      }
    });

    it("외부 인증 서비스 실패 시 에러를 반환해야 한다", async () => {
      // Given
      mockAuthDomainService.validateSignUpData.mockReturnValue({
        success: true,
        data: signUpData,
      });

      mockUserRepository.existsByEmail.mockResolvedValue({
        success: true,
        data: false,
      });

      mockExternalAuthService.signUp.mockResolvedValue({
        success: false,
        error: new Error("External auth failed"),
      });

      // When
      const result = await useCase.execute(signUpData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("External auth failed");
      }
    });

    it("도메인 사용자 생성 실패 시 외부 인증 사용자를 롤백해야 한다", async () => {
      // Given
      const authUserData = {
        id: "auth-user-123",
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      mockAuthDomainService.validateSignUpData.mockReturnValue({
        success: true,
        data: signUpData,
      });

      mockUserRepository.existsByEmail.mockResolvedValue({
        success: true,
        data: false,
      });

      mockExternalAuthService.signUp.mockResolvedValue({
        success: true,
        data: authUserData,
      });

      mockAuthDomainService.createNewUser.mockReturnValue({
        success: false,
        error: new Error("Domain user creation failed"),
      });

      mockExternalAuthService.deleteUser.mockResolvedValue({
        success: true,
        data: undefined,
      });

      // When
      const result = await useCase.execute(signUpData);

      // Then
      expect(result.success).toBe(false);
      expect(mockExternalAuthService.deleteUser).toHaveBeenCalledWith(
        authUserData.id
      );
    });

    it("사용자 저장 실패 시 외부 인증 사용자를 롤백해야 한다", async () => {
      // Given
      const authUserData = {
        id: "auth-user-123",
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      mockAuthDomainService.validateSignUpData.mockReturnValue({
        success: true,
        data: signUpData,
      });

      mockUserRepository.existsByEmail.mockResolvedValue({
        success: true,
        data: false,
      });

      mockExternalAuthService.signUp.mockResolvedValue({
        success: true,
        data: authUserData,
      });

      mockAuthDomainService.createNewUser.mockReturnValue({
        success: true,
        data: mockUser,
      });

      mockUserRepository.save.mockResolvedValue({
        success: false,
        error: new Error("Database save failed"),
      });

      mockExternalAuthService.deleteUser.mockResolvedValue({
        success: true,
        data: undefined,
      });

      // When
      const result = await useCase.execute(signUpData);

      // Then
      expect(result.success).toBe(false);
      expect(mockExternalAuthService.deleteUser).toHaveBeenCalledWith(
        authUserData.id
      );
    });

    it("예기치 않은 에러 발생 시 적절한 에러 메시지를 반환해야 한다", async () => {
      // Given - 입력 검증은 성공하게 하고, 다른 부분에서 예외 발생
      mockAuthDomainService.validateSignUpData.mockReturnValue({
        success: true,
        data: signUpData,
      });

      mockUserRepository.existsByEmail.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      // When
      const result = await useCase.execute(signUpData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Unexpected error");
      }
    });

    it("예기치 않은 비에러 객체 발생 시 기본 에러 메시지를 반환해야 한다", async () => {
      // Given - 입력 검증은 성공하게 하고, 다른 부분에서 예외 발생
      mockAuthDomainService.validateSignUpData.mockReturnValue({
        success: true,
        data: signUpData,
      });

      mockUserRepository.existsByEmail.mockImplementation(() => {
        throw "String error";
      });

      // When
      const result = await useCase.execute(signUpData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("회원가입 중 오류가 발생했습니다.");
      }
    });
  });

  describe("이벤트 발행", () => {
    it("성공적인 회원가입 시 UserCreatedEvent를 발행해야 한다", async () => {
      // Given
      const authUserData = {
        id: "auth-user-123",
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      mockAuthDomainService.validateSignUpData.mockReturnValue({
        success: true,
        data: signUpData,
      });

      mockUserRepository.existsByEmail.mockResolvedValue({
        success: true,
        data: false,
      });

      mockExternalAuthService.signUp.mockResolvedValue({
        success: true,
        data: authUserData,
      });

      mockAuthDomainService.createNewUser.mockReturnValue({
        success: true,
        data: mockUser,
      });

      mockUserRepository.save.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      // When
      await useCase.execute(signUpData);

      // Then
      const { publishEvent } = require("../../../../shared/events");
      expect(publishEvent).toHaveBeenCalled();
    });
  });

  describe("이메일 정규화", () => {
    it("이메일을 소문자로 정규화해야 한다", async () => {
      // Given
      const signUpDataWithUpperCase = {
        ...signUpData,
        email: "TEST@EXAMPLE.COM",
      };

      mockAuthDomainService.validateSignUpData.mockReturnValue({
        success: true,
        data: signUpDataWithUpperCase,
      });

      mockUserRepository.existsByEmail.mockResolvedValue({
        success: true,
        data: false,
      });

      // When
      await useCase.execute(signUpDataWithUpperCase);

      // Then
      expect(mockUserRepository.existsByEmail).toHaveBeenCalled();
      // createEmail이 소문자로 변환된 이메일로 호출되는지 확인
      const callArgs = mockUserRepository.existsByEmail.mock.calls[0][0];
      expect(callArgs.valueOf()).toBe("test@example.com");
    });
  });
});
