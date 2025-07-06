// 회원가입 폼 컴포넌트 (최소 구현)

import * as React from 'react';


// DOM 타입 오류 방지: 타입 직접 import

// 타입만 사용하므로 import 제거
type HTMLFormElement = globalThis.HTMLFormElement;
type HTMLInputElement = globalThis.HTMLInputElement;
export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => Promise<void>;
}

export default function SignUpForm({ onSubmit }: SignUpFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data: SignUpFormData = {
      email: (form.elements.namedItem('email') as HTMLInputElement)?.value || '',
      password: (form.elements.namedItem('password') as HTMLInputElement)?.value || '',
      confirmPassword: (form.elements.namedItem('confirmPassword') as HTMLInputElement)?.value || '',
    };
    onSubmit(data);
  };
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">회원가입</button>
    </form>
  );
}
