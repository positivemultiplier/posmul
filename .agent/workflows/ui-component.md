---
description: UI 컴포넌트 개발 워크플로우. 새 컴포넌트나 페이지를 만들 때 사용.
---

# UI Component Development

## 사용 시기
- 새로운 UI 컴포넌트 생성
- 새 페이지 추가
- 기존 UI 개선

## 워크플로우

### Step 1: 위치 결정

**공용 컴포넌트** (여러 도메인에서 사용):
```
shared/ui/components/
├── feedback/      # Toast, Modal 등
├── forms/         # Input, Button 등
├── layout/        # Navbar, Footer 등
└── charts/        # 차트 컴포넌트
```

**도메인 컴포넌트** (특정 도메인 전용):
```
bounded-contexts/{domain}/presentation/components/
```

### Step 2: 컴포넌트 구조

```typescript
"use client";

import { useState } from 'react';
import type { FC } from 'react';

interface Props {
  title: string;
  // 모든 props 명시
}

export const ComponentName: FC<Props> = ({ title }) => {
  const [state, setState] = useState();
  
  const handleClick = () => {};
  
  return (
    <div className="...">
      {title}
    </div>
  );
};
```

### Step 3: 스타일링 규칙

**Tailwind CSS 사용**:
- 다크모드: `dark:` prefix
- 반응형: `sm:`, `md:`, `lg:` prefix
- 호버: `hover:` prefix

**색상 팔레트**:
```
배경: bg-[#0a0a0f], bg-[#1a1a2e]
텍스트: text-white, text-gray-400
포인트: text-blue-400, text-purple-400
```

### Step 4: 브라우저 테스트

// turbo
1. 개발 서버 확인: `http://localhost:3000`
2. 다크모드 확인
3. 반응형 확인 (모바일/데스크탑)

## 체크리스트

- [ ] Props 인터페이스 정의
- [ ] 컴포넌트 구현
- [ ] 다크모드 스타일 적용
- [ ] 반응형 디자인 적용
- [ ] 타입 체크 통과
- [ ] 브라우저 테스트
