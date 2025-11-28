"use client";

import * as React from "react";

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export default function SignUpForm({
  onSubmit,
  isLoading = false,
  error = null,
  className = "",
}: SignUpFormProps) {
  const [formData, setFormData] = React.useState<SignUpFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      // 패스워드 불일치 처리는 부모 컴포넌트에서 처리
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("SignUp form submission error:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">회원가입</h2>
          <p className="text-gray-600 mt-2">새 계정을 만드세요</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={`
                block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${isLoading ? "bg-gray-50 cursor-not-allowed" : "bg-white"}
                border-gray-300
              `}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className={`
                block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${isLoading ? "bg-gray-50 cursor-not-allowed" : "bg-white"}
                border-gray-300
              `}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              className={`
                block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${isLoading ? "bg-gray-50 cursor-not-allowed" : "bg-white"}
                ${
                  formData.password !== formData.confirmPassword &&
                  formData.confirmPassword
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                }
              `}
              placeholder="••••••••"
            />
            {formData.password !== formData.confirmPassword &&
              formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  비밀번호가 일치하지 않습니다
                </p>
              )}
          </div>

          <button
            type="submit"
            disabled={
              isLoading || formData.password !== formData.confirmPassword
            }
            className={`
              w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
              ${
                isLoading || formData.password !== formData.confirmPassword
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }
              transition-colors duration-200
            `}
          >
            {isLoading ? "처리중..." : "회원가입"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <a
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              로그인
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
