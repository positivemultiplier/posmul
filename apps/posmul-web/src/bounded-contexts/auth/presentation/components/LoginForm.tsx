/**
 * 로그인 폼 컴포넌트
 */

"use client";

import { Button, Card, Input } from "@posmul/shared-ui";
import { useState } from "react";

interface LoginFormProps {
  onSubmit?: (credentials: {
    email: string;
    password: string;
  }) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function LoginForm({
  onSubmit,
  loading = false,
  error,
}: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
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
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length === 0 && onSubmit) {
      await onSubmit(formData);
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
        <h2 className="text-2xl font-bold text-gray-900">로그인</h2>
        <p className="text-gray-600 mt-2">계정에 로그인하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="이메일"
          type="email"
          value={formData.email}
          onChange={handleInputChange("email")}
          error={validationErrors.email}
          fullWidth
          disabled={loading}
          placeholder="your@email.com"
        />

        <Input
          label="비밀번호"
          type="password"
          value={formData.password}
          onChange={handleInputChange("password")}
          error={validationErrors.password}
          fullWidth
          disabled={loading}
          placeholder="비밀번호를 입력하세요"
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} disabled={loading}>
          로그인
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          계정이 없으신가요?{" "}
          <a
            href="/signup"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            회원가입
          </a>
        </p>
      </div>
    </Card>
  );
}
