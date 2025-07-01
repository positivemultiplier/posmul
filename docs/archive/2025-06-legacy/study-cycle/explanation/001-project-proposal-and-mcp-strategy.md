# "Study-Cycle" 신규 프로젝트 제안 및 MCP 자동화 전략

> **문서 유형**: 분석 보고서 (Analysis Report)  
> **작성 일시**: 2025-06-25  
> **작성자**: AI Assistant
> **목표**: CPA/CTA 수험생을 위한 학습 플랫폼 "Study-Cycle"의 초기 기획안을 수립하고, Universal MCP Tool을 활용한 개발 전략을 제안합니다.

---

## 📑 목차

- ["Study-Cycle" 신규 프로젝트 제안 및 MCP 자동화 전략](#study-cycle-신규-프로젝트-제안-및-mcp-자동화-전략)
  - [📑 목차](#-목차)
  - [1. 프로젝트 비전 및 핵심 기능](#1-프로젝트-비전-및-핵심-기능)
  - [2. 벤치마크 분석: Studyplus](#2-벤치마크-분석-studyplus)
  - [3. 제안 아키텍처 (DDD)](#3-제안-아키텍처-ddd)
  - [4. 핵심 개념 정의 (Core Concepts)](#4-핵심-개념-정의-core-concepts)
    - [4.1. 회독 원칙 (Hoedok Principle)](#41-회독-원칙-hoedok-principle)
    - [4.2. 풀이 템플릿 엔진 (Solution Template Engine)](#42-풀이-템플릿-엔진-solution-template-engine)
  - [5. Universal MCP 자동화 전략](#5-universal-mcp-자동화-전략)
    - [5.1. 설정 추가](#51-설정-추가)
    - [5.2. 자동화 워크플로우](#52-자동화-워크플로우)
  - [6. 초기 실행 계획 (Action Plan)](#6-초기-실행-계획-action-plan)

---

## 1. 프로젝트 비전 및 핵심 기능

"Study-Cycle"은 CPA, CTA 등 전문직 수험생의 학습 효율을 극대화하는 것을 목표로 하는 지능형 학습 관리 플랫폼입니다. 사용자가 제안한 핵심 기능은 다음과 같습니다.

```mermaid
graph TD
    subgraph "Study-Cycle Platform"
        A[👨‍🎓 수험생]
        B[👨‍🏫 교재 저자]
        
        direction LR
        
        subgraph "Core Features"
            F1["📚 1. 교재 등록 및 관리"]
            F2["🔄 2. 회독 주기 관리"]
            F3["📝 3. 회독 연계 테스트"]
            F4["💬 4. 커뮤니티 및 랭킹"]
        end

        A -- "학습" --> F2
        A -- "실력 점검" --> F3
        A -- "소통/경쟁" --> F4
        B -- "콘텐츠 제공" --> F1
        F1 -- "학습 기반" --> F2
        F1 -- "문제 출제 기반" --> F3
        F1 -- "소통 주제" --> F4
    end

    style A fill:#E3F2FD,stroke:#333,stroke-width:2px
    style B fill:#E8F5E9,stroke:#333,stroke-width:2px
```

---

## 2. 벤치마크 분석: Studyplus

일본의 성공적인 학습 SNS "Studyplus"를 분석하여 우리 프로젝트의 차별화 포인트를 도출합니다.

```mermaid
graph LR
    subgraph "Studyplus (Existing)"
        S_Core["🎯 **핵심: 학습 기록 및 공유 (SNS)**"]
        S_F1["🎯 학습 시간 기록"]
        S_F2["🎯 친구와 공유 및 격려"]
        S_F3["🎯 목표 대학/자격증 설정"]
    end

    subgraph "Study-Cycle (Proposed)"
        SC_Core["🎯 **핵심: 심층적 학습 주기 관리**"]
        SC_F1["🎯 **저자 피드백**이 연동된 교재"]
        SC_F2["🎯 **'회독 원칙'** 기반의 주기 관리"]
        SC_F3["🎯 **난이도별** 연계 테스트"]
        SC_F4["🎯 교재 중심의 전문 커뮤니티"]
    end

    subgraph "💡 차별화 전략"
        D1["**콘텐츠 품질**: 저자 직접 참여"]
        D2["**학습 깊이**: 단순 시간 기록을 넘어<br>이해도 기반의 회독 관리"]
        D3["**효율성**: 개인화된 문제 제공"]
    end

    S_Core --> SC_Core;
    SC_Core -- "구체화" --> D1 & D2 & D3

```

**분석 결과**: "Studyplus"가 학습의 '지속성'에 초점을 맞춘다면, "Study-Cycle"은 학습의 **'깊이'와 '효율성'** 에 초점을 맞춰 명확한 차별화를 꾀할 수 있습니다.

---

## 3. 제안 아키텍처 (DDD)

PosMul 프로젝트 경험을 바탕으로, DDD(도메인 주도 설계)와 클린 아키텍처를 적용하여 복잡성에 대응합니다.

```mermaid
graph TD
    subgraph "📚 Textbook Context"
        T1["- 교재 (Aggregate Root)"]
        T2["- 챕터/섹션 (Entities)"]
        T3["- 저자 (Entity)"]
        T4["- 피드백 (Entity)"]
    end
    
    subgraph "🔄 StudyLog Context"
        S1["- 학습 계획 (Aggregate Root)"]
        S2["- 회독 세션 (Entity)"]
        S3["- 학습 시간 (Value Object)"]
    end

    subgraph "�� Assessment Context (✨Updated)"
        A1["- 시험 (Aggregate Root)"]
        A2["- 문제 (Entity, 난이도 속성)"]
        A3["- 시험 결과 (Entity)"]
        style A4 fill:#FFF3E0,stroke:#FB8C00
        A4["✨ **풀이 템플릿 (Solution Template)**<br>(문제 유형별 답안의 뼈대)"]
    end

    subgraph "💬 Community Context"
        C1["- 사용자 (Aggregate Root)"]
        C2["- 랭킹 (Value Object)"]
        C3["- 게시글/댓글 (Entities)"]
    end
    
    subgraph "🎮 Gamification (Shared Kernel)"
        G1["- 학습 포인트"]
        G2["- 뱃지/업적"]
    end

    Textbook_Context(📚 Textbook Context) -- "학습 콘텐츠 제공" --> StudyLog_Context(🔄 StudyLog Context)
    Textbook_Context -- "문제 및 풀이 템플릿 출제 기반" --> Assessment_Context("📝 Assessment Context (✨Updated)")
    StudyLog_Context -- "학습 활동 기반 랭킹" --> Community_Context(💬 Community Context)
    Assessment_Context -- "시험 성적 기반 랭킹" --> Community_Context
    
    StudyLog_Context -- "학습 활동 보상" --> Gamification
    Assessment_Context -- "시험 성적 보상" --> Gamification
    Community_Context -- "포인트 사용/전시" --> Gamification

    style Gamification fill:#F1F8E9,stroke:#7CB342
```
**Shared Kernel**: 모든 도메인에서 일관된 사용자 경험을 제공하기 위해 `Gamification`을 공유 커널로 설계하여 포인트, 뱃지 등 게임화 요소를 통합 관리합니다.

**✨ 신규 추가**: `Assessment Context`에 **풀이 템플릿(Solution Template)** 개념을 도입합니다. 이는 저자가 문제 유형별 '모범 답안 구조'를 정의하고, 학생들은 이 템플릿에 맞춰 문제 풀이 훈련을 할 수 있게 하는 핵심 기능입니다.

---

## 4. 핵심 개념 정의 (Core Concepts)

### 4.1. 회독 원칙 (Hoedok Principle)

"회독(Hoedok)" 관리 방식은 서비스의 핵심 정체성입니다. 점진적인 발전 계획을 제안합니다.

```mermaid
flowchart TD
    subgraph "Phase 1: MVP (최소 기능 제품)"
        P1_A["💡 **Simple Hierarchy (단순 계층 구조)**"]
        P1_B("💡 1. 교재 선택") --> P1_C("💡 2. 챕터 단위 N회독 체크")
        P1_D["✅ **장점**: 구현 용이, 사용자에게 직관적"]
    end

    subgraph "Phase 2: 고도화"
        P2_A["💡 **Granular Graph (세분화된 그래프 구조)**"]
        P2_B("💡 1. 목차(Index) Tree 생성") --> P2_C("💡 2. 소주제별 이해도 체크<br>(e.g., 모름/애매함/앎)")
        P2_C --> P2_D("💡 3. 이해도 기반 문제 자동 추천")
        P2_E["✅ **장점**: 초개인화된 학습 경로 제공"]
    end

    P1_A -- "🚀 발전" --> P2_A
```
**Index Depth Principle**: 초기에는 `교재 > 챕터 > 섹션`의 3-Depth를 기준으로 회독 수를 관리하고, 향후 주제별 이해도를 추적하는 방식으로 발전시키는 것을 추천합니다.

### 4.2. 풀이 템플릿 엔진 (Solution Template Engine)

세법학과 같이 정형화된 풀이법이 중요한 과목의 학습 효율을 극대화하기 위한 기능입니다.

```mermaid
sequenceDiagram
    participant Author as 👨‍🏫 교재 저자
    participant System as 💻 Study-Cycle
    participant Student as 👨‍🎓 수험생

    Author->>System: 1. '세법학' 과목의<br>표준 풀이 템플릿 생성
    note right of Author: "e.g.,<br>1. 논점 정리<br>2. 관련 법규<br>3. 사안 적용<br>4. 결론"
    System-->>Author: 템플릿 저장 완료

    Author->>System: 2. 특정 기출문제에<br>해당 템플릿 연결

    Student->>System: 3. 해당 기출문제 풀기 시작
    System-->>Student: 4. 문제와 함께 '풀이 템플릿'을<br>가이드로 제공

    Student->>System: 5. 템플릿의 각 항목에 맞춰<br>답안 작성 및 제출
    
    alt AI 피드백 (고도화 기능)
        System->>Student: 6. AI가 템플릿 기반으로<br>답안 구조의 완성도를<br>분석하여 피드백 제공
    end
```
**작동 방식**: 저자가 과목별 '모범 답안의 뼈대'를 템플릿으로 만들면, 학생들은 문제 풀이 시 해당 템플릿을 가이드 삼아 구조적인 사고와 답안 작성 능력을 기를 수 있습니다. 이는 단순 암기를 넘어선 **메타인지적 학습**을 유도합니다.

---

## 5. Universal MCP 자동화 전략

기존 `posmul` 프로젝트에서 검증된 `universal-mcp-automation.ts`를 활용하여 "Study-Cycle" 프로젝트의 타입 안전성과 개발 생산성을 극대화합니다.

### 5.1. 설정 추가

`mcp-automation/universal-mcp-automation.ts` 파일의 `PRESET_CONFIGS`에 `study-cycle` 설정을 추가합니다.

```typescript
// ... in PRESET_CONFIGS
"study-cycle": {
  projectId: "your-study-cycle-project-id", // Supabase 프로젝트 생성 후 확정
  projectName: "Study-Cycle 학습 플랫폼",
  outputPath: "src/shared/types/supabase-generated.ts",
  rootPath: "C:/G/study-cycle", // 새 프로젝트 경로
  domains: [
    "textbook", "study_log", "assessment", 
    "community", "gamification", "user"
  ],
},
```

### 5.2. 자동화 워크플로우

이 설정을 통해 아래와 같은 개발 워크플로우를 구축합니다.

```mermaid
sequenceDiagram
    participant Dev as 👨‍💻 개발자
    participant MCP as 🤖 MCP Tools
    participant Script as 📜 Automation Script
    participant DB as 🐘 Supabase DB
    participant Code as 💻 Project Codebase

    Dev->>MCP: "1. mcp_supabase_apply_migration"
    note over Dev, MCP: "DB 스키마 변경"
    MCP->>DB: "SQL 실행"

    Dev->>Script: "2. npx tsx universal-mcp-automation.ts generate study-cycle"
    note over Dev, Script: "타입 생성 명령"
    
    Script->>MCP: "내부적으로 mcp_supabase_generate_typescript_types 호출"
    MCP->>DB: "스키마 정보 요청"
    DB-->>MCP: "타입 정보 반환"
    
    Script->>Code: "3. 타입 파일 (supabase-generated.ts) 자동 생성/업데이트"
    
    Dev->>Code: "4. 최신 타입 기반으로 안전하게 개발"
```

---

## 6. 초기 실행 계획 (Action Plan)

프로젝트의 성공적인 시작을 위해 다음 4단계 실행 계획을 제안합니다.

```mermaid
gantt
    title Study-Cycle Project Initial Roadmap
    dateFormat  YYYY-MM-DD
    section Setup & Foundation
    Project Setup       :done,    p1, 2024-07-25, 2d
    MCP Integration     :active,  p2, after p1, 3d
    
    section Core Development
    Schema Design (MVP) :         p3, after p2, 5d
    Core API Scaffolding:         p4, after p3, 7d

    section Documentation
    API & System Docs   :         d1, after p4, 4d
```

| 단계 | 작업 내용 | 예상 기간 | 결과물 |
| :--- | :--- | :--- | :--- |
| **1. Project Setup** | - `C:\G\study-cycle` 디렉토리 생성<br>- GitHub 리포지토리 생성<br>- Supabase 프로젝트 생성 | 2일 | - 버전 관리 시스템<br>- 클라우드 DB 환경 |
| **2. MCP Integration** | - `universal-mcp-automation.ts`에 신규 설정 추가<br>- `projectId` 확정 및 반영 | 3일 | - 타입 자동화 워크플로우 |
| **3. Schema Design** | - `Textbook`, `User` 중심의 초기 스키마 설계<br>- `mcp_supabase_apply_migration`으로 첫 마이그레이션 | 5일 | - DB 테이블 및 관계 정의 |
| **4. API Scaffolding** | - `Textbook` 등록/조회 API 뼈대 구현<br>- 생성된 타입 활용 | 7일 | - 핵심 기능의 기본 API |

---

이 제안서를 바탕으로 프로젝트의 방향성을 확정하고, 다음 단계인 "Project Setup"을 시작하는 것을 권장합니다. 