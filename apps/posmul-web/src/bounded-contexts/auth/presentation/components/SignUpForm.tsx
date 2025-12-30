/**
 * 회원가입 폼 컴포넌트
 */

"use client";

import Link from "next/link";
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
    <div className="flex w-full overflow-hidden rounded-2xl bg-white shadow-2xl overflow-hidden min-h-[600px]">
      {/* Left: Form Section */}
      <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Get Started
          </h1>
          <p className="text-gray-500 mt-2">
            새로운 경제 생태계의 일원이 되어보세요
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
          <Input
            label="이메일"
            type="email"
            value={formData.email}
            onChange={handleInputChange("email")}
            error={validationErrors.email}
            className="w-full"
            disabled={loading}
            placeholder="name@example.com"
          />

          <Input
            label="비밀번호"
            type="password"
            value={formData.password}
            onChange={handleInputChange("password")}
            error={validationErrors.password}
            className="w-full"
            disabled={loading}
            placeholder="8자 이상 입력해주세요"
          />

          <Input
            label="비밀번호 확인"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            error={validationErrors.confirmPassword}
            className="w-full"
            disabled={loading}
            placeholder="비밀번호를 다시 입력해주세요"
          />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 mt-6"
            loading={loading}
            disabled={loading}
          >
            회원가입
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            로그인
          </Link>
        </div>
      </div>

      {/* Right: Hero Image Section */}
      <div className="hidden lg:block w-1/2 relative bg-gray-50">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/auth-hero.png')" }}
        />
        <div className="absolute inset-0 bg-purple-900/10 backdrop-blur-[1px]" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium">
              "함께 만들어가는 미래, PosMul에서 시작하세요."
            </p>
            <footer className="text-sm text-white/80">— PosMul Team</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
