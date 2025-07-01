---
type: how-to-guide
title: "Universal MCP를 활용한 중앙 집중식 타입 관리 가이드"
description: "mcp_supabase_generate_typescript_types와 Universal MCP 스크립트를 사용하여 프로젝트 전체의 타입 일관성을 유지하는 방법을 배웁니다."
difficulty: intermediate
estimated_time: "20분"
last_updated: "2025-06-27"
prerequisites:
  - "PosMul 아키텍처 기본 이해"
  - "Supabase 및 MCP 도구 사용 경험"
tags: [type-safety, mcp, supabase, ddd, universal-mcp]
---

# 📚 Universal MCP를 활용한 중앙 집중식 타입 관리 가이드

> **목표**: 모노레포 환경에서 발생할 수 있는 타입 불일치 문제를 해결하고, `Universal MCP` 시스템을 통해 모든 도메인과 계층에 걸쳐 최신 타입을 자동으로 전파하는 방법을 익힙니다.

## 📖 목차

- [🤔 문제: 왜 타입 관리가 중요한가?](#-문제-왜-타입-관리가-중요한가)
- [💡 해결책: Universal MCP 시스템](#-해결책-universal-mcp-시스템)
- [⚙️ 작동 원리](#️-작동-원리)
- [🚀 개발자 워크플로우](#-개발자-워크플로우)
- [✅ 요약: 타입 관리 흐름](#-요약-타입-관리-흐름)
- [🆘 문제 해결](#-문제-해결)

## 🤔 문제: 왜 타입 관리가 중요한가?

PosMul과 같은 모노레포 프로젝트에서는 여러 바운디드 컨텍스트(Bounded Contexts)가 공존합니다. 데이터베이스 스키마가 변경될 때, 이와 관련된 모든 도메인(e.g., `prediction`, `investment`)과 계층(e.g., `application`, `presentation`)의 타입을 수동으로 업데이트하는 것은 매우 번거롭고 오류가 발생하기 쉽습니다.

```mermaid
graph TD
    subgraph "전통적인 수동 방식의 문제점"
        DB_Schema["1. DB 스키마 변경<br/>(e.g., 'predictions' 테이블에 컬럼 추가)"]

        subgraph "2. 수동 타입 업데이트 (오류 발생 가능)"
            direction LR
            Update_Domain["도메인 계층<br/>(prediction.entity.ts)"]
            Update_App["애플리케이션 계층<br/>(prediction.dto.ts)"]
            Update_Infra["인프라 계층<br/>(supabase-repo.ts)"]
            Update_UI["프레젠테이션 계층<br/>(PredictionCard.tsx)"]
        end

        subgraph "3. 결과"
            Error["타입 불일치로 인한<br/>컴파일 또는 런타임 에러"]
            Inconsistency["컨텍스트 간<br/>데이터 불일치"]
        end

        DB_Schema --> Update_Domain
        DB_Schema --> Update_App
        DB_Schema --> Update_Infra
        DB_Schema --> Update_UI

        Update_Domain --> Error
        Update_App --> Error
        Update_Infra --> Inconsistency
        Update_UI --> Inconsistency
    end
```

이러한 문제를 해결하기 위해 PosMul은 **Universal MCP**라는 중앙 집중식 타입 관리 시스템을 도입했습니다.

## 💡 해결책: Universal MCP 시스템

Universal MCP는 Supabase 데이터베이스를 **단일 진실 공급원(Single Source of Truth)**으로 삼아, 타입 정의를 자동으로 생성하고 프로젝트의 모든 필요한 곳에 전파하는 자동화된 시스템입니다.

이 시스템의 핵심은 두 가지입니다:

1.  **`mcp_supabase_generate_typescript_types`**: Supabase DB 스키마를 읽어 최신 타입 정의(`Database`)를 생성하는 MCP 도구.
2.  **`scripts/apply-universal-types.js`**: 생성된 중앙 타입 정의를 각 바운디드 컨텍스트의 필요에 맞게 분배하고 적용하는 스크립트.

## ⚙️ 작동 원리

Universal MCP의 전체적인 작동 원리는 다음과 같습니다.

```mermaid
graph TD
    A["1. 개발자가 DB 스키마 변경<br/>(e.g., mcp_supabase_apply_migration)"] --> B
    B("2. `mcp_supabase_generate_typescript_types` 실행") --> C
    C["3. 중앙 타입 파일 생성<br/>(e.g., src/shared/types/supabase-generated.ts)"] --> D
    D("4. 개발자가 `npm run apply-types` 실행") --> E
    E["5. `scripts/apply-universal-types.js` 스크립트 작동"] --> F

    subgraph F["6. 각 도메인에 타입 전파"]
        direction LR
        F1["prediction/types/index.ts"]
        F2["investment/types/index.ts"]
        F3["forum/types/index.ts"]
        F4["...기타 도메인"]
    end

    E -- "supabase-generated.ts를 읽어서" --> F1
    E -- "필요한 타입만 추출하여" --> F2
    E -- "자동으로 파일 업데이트" --> F3
    E -- "..." --> F4

    style C fill:#e3f2fd,stroke:#1e88e5
    style E fill:#fff9c4,stroke:#fbc02d
```

`apply-universal-types.js` 스크립트는 `universal-mcp-automation.ts` 내부의 `generateUniversalTypes` 함수를 호출하여, 거대한 중앙 타입 정의(`Database`)를 파싱하고 각 도메인의 이름 규칙(e.g., `predictions` 테이블 -> `prediction` 도메인)에 맞춰 필요한 타입만 추출하여 해당 도메인의 `types/index.ts` 파일에 자동으로 덮어쓰거나 생성합니다.

## 🚀 개발자 워크플로우

데이터베이스 스키마 변경이 필요할 때, 개발자는 다음 워크플로우를 따르면 됩니다.

```mermaid
sequenceDiagram
    participant D as Developer
    participant MCP as MCP Assistant
    participant DB as Supabase DB
    participant TypeGen as "mcp_..._generate_types"
    participant UniversalMCP as "npm run apply-types"

    D->>MCP: 1. DB 스키마 변경 요청 (apply_migration)
    MCP->>DB: 스키마 업데이트

    D->>MCP: 2. 타입 재생성 요청
    MCP->>TypeGen: 타입 생성 실행
    TypeGen-->>MCP: "✅ 중앙 타입 파일 업데이트됨"
    M-->>D: "✅ 타입 생성이 완료되었습니다."

    D->>UniversalMCP: 3. Universal MCP 스크립트 실행
    UniversalMCP-->>D: "✅ 모든 도메인 타입 동기화 완료"

    D->>D: 4. 프로젝트 타입 검증 (npm run build)
    D-->>D: "✅ 타입 일관성 확인"

    D->>D: 5. 최신 타입으로 안전하게 개발
```

**단계별 상세 가이드:**

1.  **스키마 변경**: `mcp_supabase_apply_migration`을 사용하여 데이터베이스 스키마를 변경합니다.
2.  **중앙 타입 생성**: AI 어시스턴트에게 `mcp_supabase_generate_typescript_types`를 실행해달라고 요청합니다.
    > **프롬프트 예시**: "Supabase 프로젝트의 최신 타입 정의를 생성해줘."
3.  **타입 전파**: 터미널에서 다음 명령어를 실행하여 변경된 타입을 프로젝트 전체에 적용합니다.
    ```powershell
    npm run apply-types
    ```
4.  **프로젝트 타입 검증 (중요)**: 타입이 올바르게 전파되었고, 기존 코드와 충돌이 없는지 확인하기 위해 프로젝트 전체를 빌드합니다. 이 과정에서 타입 에러가 발생하면 즉시 수정해야 합니다.
    ```powershell
    npm run build
    ```
5.  **개발**: 타입 검증이 완료되었다면, 이제 각 도메인 폴더의 `types/index.ts`에 반영된 최신 타입을 import하여 안전하게 개발을 진행합니다.

## ✅ 요약: 타입 관리 흐름

```mermaid
flowchart LR
    subgraph "Step 1: Schema & Type Generation"
        A[DB Schema Change] --> B{mcp_generate_types} --> C([Central Type File])
    end

    subgraph "Step 2: Type Propagation & Verification"
        D{npm run apply-types} --> E{npm run build} --> F([Verified Types])
    end

    subgraph "Step 3: Development"
        G[Entities]
        H[Repositories]
        I[Use Cases]
        J[Components]
    end

    C --> D
    F --> G & H & I & J

    classDef step1 fill:#e0f7fa,stroke:#00796b
    classDef step2 fill:#fffde7,stroke:#fbc02d
    classDef step3 fill:#f3e5f5,stroke:#7b1fa2

    class A,B,C step1
    class D,E,F step2
    class G,H,I,J step3
```

## 🆘 문제 해결

### 문제 1: `npm run apply-types` 실행 후 타입이 변경되지 않음

**원인**: 중앙 타입 파일(`src/shared/types/supabase-generated.ts` 등)이 먼저 업데이트되지 않았을 수 있습니다.
**해결**:

1.  `mcp_supabase_generate_typescript_types`가 성공적으로 실행되었는지 확인합니다.
2.  중앙 타입 파일의 내용이 최신 스키마를 반영하고 있는지 직접 확인합니다.
3.  문제가 없다면 스크립트 캐시 문제일 수 있으니, 다시 한번 `npm run apply-types`를 실행합니다.

### 문제 2: 특정 도메인에만 타입이 적용되지 않음

**원인**: `universal-mcp-automation.ts`의 도메인 이름 매칭 규칙과 테이블 이름이 일치하지 않을 수 있습니다.
**해결**:

1.  테이블 이름(e.g., `prediction_games`)과 도메인 폴더 이름(`prediction`)이 스크립트의 규칙과 맞는지 확인합니다.
2.  필요하다면 `universal-mcp-automation.ts` 스크립트의 로직을 확인하거나 수정이 필요할 수 있습니다. (전문가에게 문의)
