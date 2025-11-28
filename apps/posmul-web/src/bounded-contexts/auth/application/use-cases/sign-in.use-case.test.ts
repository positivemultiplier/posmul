/**
 * SignInUseCase 테스트
 */
describe("SignInUseCase", () => {
  const SignInUseCase = require("./sign-in.use-case").SignInUseCase;

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

  const mockSupabaseAuthService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    refreshToken: jest.fn(),
    getUser: jest.fn(),
  };

  // Mock publishEvent
  jest.mock("../../../../shared/events", () => ({
    UserLoggedInEvent: jest.fn(),
    publishEvent: jest.fn(),
  }));

  let useCase;
  let mockUser;
  let credentials;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    useCase = new SignInUseCase(
      mockUserRepository,
      mockAuthDomainService,
      mockSupabaseAuthService
    );

    // Mock user data
    mockUser = {
      id: "user-123",
      email: { valueOf: () => "test@example.com" },
      displayName: "Test User",
      createdAt: new Date(),
    };

    credentials = {
      email: "test@example.com",
      password: "password123",
    };
  });

  describe("성공 케이스", () => {
    it("정상적인 로그인 시 성공 결과를 반환해야 한다", async () => {
      // Given
      const authResult = {
        user: {
          id: "auth-user-123",
          email: "test@example.com",
          displayName: "Test User",
        },
        session: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      };

      mockAuthDomainService.validateLoginData.mockReturnValue({
        success: true,
        data: credentials,
      });

      mockSupabaseAuthService.signIn.mockResolvedValue({
        success: true,
        data: authResult,
      });

      mockUserRepository.findByEmail.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      // When
      const result = await useCase.execute(credentials);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toEqual(mockUser);
        expect(result.data.accessToken).toBe("access-token");
        expect(result.data.refreshToken).toBe("refresh-token");
      }

      expect(mockAuthDomainService.validateLoginData).toHaveBeenCalledWith(
        credentials
      );
      expect(mockSupabaseAuthService.signIn).toHaveBeenCalled();
      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
    });

    it("로컬 사용자 정보가 없어도 auth-economy-sdk 정보로 성공해야 한다", async () => {
      // Given
      const authResult = {
        user: {
          id: "auth-user-123",
          email: "test@example.com",
          displayName: "Test User",
        },
        session: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      };

      mockAuthDomainService.validateLoginData.mockReturnValue({
        success: true,
        data: credentials,
      });

      mockSupabaseAuthService.signIn.mockResolvedValue({
        success: true,
        data: authResult,
      });

      mockUserRepository.findByEmail.mockResolvedValue({
        success: false,
        error: new Error("User not found"),
      });

      // When
      const result = await useCase.execute(credentials);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.id).toBe("auth-user-123");
        expect(result.data.user.email).toBe("test@example.com");
        expect(result.data.accessToken).toBe("access-token");
        expect(result.data.refreshToken).toBe("refresh-token");
      }
    });
  });

  describe("실패 케이스", () => {
    it("데이터 검증 실패 시 에러를 반환해야 한다", async () => {
      // Given
      mockAuthDomainService.validateLoginData.mockReturnValue({
        success: false,
        error: new Error("Validation failed"),
      });

      // When
      const result = await useCase.execute(credentials);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("입력 데이터가 유효하지 않습니다.");
      }
    });

    it("Supabase 인증 실패 시 에러를 반환해야 한다", async () => {
      // Given
      mockAuthDomainService.validateLoginData.mockReturnValue({
        success: true,
        data: credentials,
      });

      mockSupabaseAuthService.signIn.mockResolvedValue({
        success: false,
        error: new Error("Invalid credentials"),
      });

      // When
      const result = await useCase.execute(credentials);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          "인증에 실패했습니다. 이메일과 비밀번호를 확인해주세요."
        );
      }
    });

    it("예기치 않은 에러 발생 시 적절한 에러 메시지를 반환해야 한다", async () => {
      // Given
      mockAuthDomainService.validateLoginData.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      // When
      const result = await useCase.execute(credentials);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Unexpected error");
      }
    });

    it("예기치 않은 비에러 객체 발생 시 기본 에러 메시지를 반환해야 한다", async () => {
      // Given
      mockAuthDomainService.validateLoginData.mockImplementation(() => {
        throw "String error";
      });

      // When
      const result = await useCase.execute(credentials);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe(
          "로그인 중 예기치 않은 오류가 발생했습니다."
        );
      }
    });
  });

  describe("이벤트 발행", () => {
    it("성공적인 로그인 시 UserLoggedInEvent를 발행해야 한다", async () => {
      // Given
      const authResult = {
        user: {
          id: "auth-user-123",
          email: "test@example.com",
          displayName: "Test User",
        },
        session: {
          access_token: "access-token",
          refresh_token: "refresh-token",
        },
      };

      mockAuthDomainService.validateLoginData.mockReturnValue({
        success: true,
        data: credentials,
      });

      mockSupabaseAuthService.signIn.mockResolvedValue({
        success: true,
        data: authResult,
      });

      mockUserRepository.findByEmail.mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const { publishEvent } = require("../../../../shared/events");

      // When
      await useCase.execute(credentials);

      // Then
      expect(publishEvent).toHaveBeenCalled();
    });
  });
});
