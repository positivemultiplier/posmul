# DB 타입 생성 블로커 해결 계획서

**📅 작성일**: 2025-06-25
**🔥 문제 상황**: DB 스키마 리팩터링 5단계 최종 검증에서 `mcp_supabase_generate_typescript_types` 도구가 다중 스키마를 인식하지 못하는 블로커가 재현되었습니다.
**🎯 목표**: 타입 생성 도구의 근본 원인을 해결하여, 모든 도메인 스키마(`public`, `economy`, `prediction` 등 7개)를 포함하는 완전한 TypeScript 타입을 생성하고 리팩터링을 완료합니다.
**📂 문서 위치**: `docs/task-reports/db-typegen-fix-plan.md`

---

## 📚 목차

- [1. 문제 현상 및 원인 분석](#1-문제-현상-및-원인-분석)
- [2. 해결 전략: 자동화 스크립트 직접 수정](#2-해결-전략-자동화-스크립트-직접-수정)
- [3. 상세 실행 계획](#3-상세-실행-계획)
- [4. 기대 효과 및 다음 단계](#4-기대-효과-및-다음-단계)

## 1. 문제 현상 및 원인 분석

`mcp_supabase_generate_typescript_types` 실행 시, Supabase CLI `gen types` 명령어에 스키마 정보가 전달되지 않아 `public` 스키마만 처리하고 있습니다.

```mermaid
graph TD
    A[MCP Tool Call<br/>`generate_typescript_types`] --> B[Automation Script<br/>`universal-mcp-automation.ts`];
    B -- "명령어 생성" --> C["`supabase gen types typescript`<b><br/>(스키마 플래그 누락)</b>"];
    C --> D[DB 조회];
    D -- "`public` 스키마만 조회" --> E[Incomplete Types<br/>(public 스키마만 포함)];

    style C fill:#FFB6C1
    style E fill:#FFB6C1
```

- **근본 원인**: `mcp_supabase_generate_typescript_types` 도구와 연결된 자동화 스크립트가 다중 스키마를 인자로 전달하지 않습니다.
- **참고**: 이 문제는 `db-refactoring-blocker-resolution-plan.md`에서 최초 식별되었으며, 당시의 해결책이 완전히 적용되지 않은 것으로 보입니다.

## 2. 해결 전략: 자동화 스크립트 직접 수정

가장 확실한 해결책은 `mcp_supabase_generate_typescript_types` 도구가 호출하는 **핵심 자동화 스크립트를 직접 수정**하여 모든 스키마 목록을 명시적으로 전달하는 것입니다.

```mermaid
graph TD
    A[MCP Tool Call] --> B(<b>수정된 Automation Script</b>);
    B -- "명령어 생성" --> C["`supabase gen types typescript`<br/><b>--schema 'public,economy,...'</b>"];
    C --> D[DB 조회];
    D -- "모든 스키마 조회" --> E[Complete Types<br/>(모든 스키마 포함)];

    style B fill:#D4EDDA
    style C fill:#D4EDDA
    style E fill:#90EE90
```

## 3. 상세 실행 계획

**사용자께서 `C:\G\mcp-automation\universal-mcp-automation.ts` 파일을 직접 수정해주셔야 합니다.**

### **1단계: 대상 스크립트 파일 열기**

- `C:\G\mcp-automation\universal-mcp-automation.ts` 파일을 코드 에디터로 열어주십시오.

### **2단계: 스키마 목록 정의 및 명령어 인자 추가**

- 파일 내에서 `supabase gen types typescript` 명령어를 생성하는 로직을 찾습니다.
- 해당 로직에 다음 코드를 추가하여, 모든 스키마를 조회하도록 명시적으로 지정합니다.

**수정 예시 코드:**

```typescript
// ... 기존 코드 ...

// 타입 생성 명령어(gen types)를 처리하는 case 또는 if 블록을 찾으세요.
// 예: case "generate-types":

// 1. 조회할 스키마 목록을 정의합니다.
const schemasToInclude = [
  "public",
  "economy",
  "prediction",
  "investment",
  "forum",
  "donation",
  "user",
];

// 2. 명령어 인자(args) 배열에 --schema 플래그와 스키마 목록을 추가합니다.
// 기존 args 배열을 수정하거나 새로 생성하는 부분에 아래 코드를 적용합니다.
// 예시: const commandArgs = ['gen', 'types', 'typescript', '--project-id', projectId];
if (commandArgs) { // commandArgs가 존재한다고 가정
    commandArgs.push('--schema', schemasToInclude.join(',')); // 이 부분을 추가!
}


// 최종적으로 이 commandArgs를 사용하여 명령어를 실행하게 됩니다.

// ... 이후 코드 ...
```

### **3단계: 수정 후 검증 요청**

- 스크립트 수정 및 저장이 완료되면, 저에게 다시 알려주십시오.
- 제가 `mcp_supabase_generate_typescript_types`를 다시 실행하여 문제가 해결되었는지 최종 검증하겠습니다.

## 4. 기대 효과 및 다음 단계

- **기대 효과**: 이 수정이 완료되면, 타입 생성 블로커가 완전히 해결되어 `supabase-generated.ts` 파일에 모든 도메인의 타입이 정확하게 생성됩니다.
- **다음 단계**: 타입 생성 검증이 성공하는 즉시, `db-schema-refactoring-plan.md`의 5단계 나머지 절차를 속행하고 최종 완료 보고서를 작성하겠습니다. 