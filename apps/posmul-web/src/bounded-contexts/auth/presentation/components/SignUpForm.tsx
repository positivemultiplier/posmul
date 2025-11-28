/**
 * 회원가입 폼 컴포넌트
 */

"use client";

import { useState } from "react";

import { Button, Card } from "../../../../shared/ui/components/base";
import { Input } from "../../../../shared/ui/components/forms";

/**
 * 회원가입 폼 컴포넌트
 */

interface SignUpFormProps {
  onSubmit?: (data: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function SignUpForm({
  onSubmit,
  loading = false,
  error,
}: SignUpFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    displayName?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 클라이언트 측 검증
    const errors: typeof validationErrors = {};

    if (!formData.email) {
      errors.email = "이메일을 입력해주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "올바른 이메일 형식을 입력해주세요.";
    }

    if (!formData.password) {
      errors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 8) {
      errors.password = "비밀번호는 최소 8자 이상이어야 합니다.";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        "비밀번호는 대문자, 소문자, 숫자를 각각 하나 이상 포함해야 합니다.";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "비밀번호 확인을 입력해주세요.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    if (formData.displayName && formData.displayName.trim().length === 0) {
      errors.displayName = "표시 이름은 공백일 수 없습니다.";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0 && onSubmit) {
      await onSubmit({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || undefined,
      });
    }
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      // 입력 시 해당 필드의 에러 제거
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
        <p className="text-gray-600 mt-2">새 계정을 만들어 시작하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="이메일"
          type="email"
          value={formData.email}
          onChange={handleInputChange("email")}
          error={validationErrors.email}
          className="w-full"
          disabled={loading}
          placeholder="your@email.com"
        />

        <Input
          label="표시 이름 (선택)"
          type="text"
          value={formData.displayName}
          onChange={handleInputChange("displayName")}
          error={validationErrors.displayName}
          className="w-full"
          disabled={loading}
          placeholder="다른 사용자에게 표시될 이름"
        />

        <Input
          label="비밀번호"
          type="password"
          value={formData.password}
          onChange={handleInputChange("password")}
          error={validationErrors.password}
          className="w-full"
          disabled={loading}
          placeholder="비밀번호를 입력하세요"
        />

        <Input
          label="비밀번호 확인"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange("confirmPassword")}
          error={validationErrors.confirmPassword}
          className="w-full"
          disabled={loading}
          placeholder="비밀번호를 다시 입력하세요"
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} disabled={loading}>
          회원가입
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          이미 계정이 있으신가요?{" "}
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            로그인
          </a>
        </p>
      </div>
    </Card>
  );
}
