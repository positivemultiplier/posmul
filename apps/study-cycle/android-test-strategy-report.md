# Android 프로젝트 테스트 전략 보고서

## 1. 개요

이 보고서는 `posmul` 모노레포 내의 Android 프로젝트를 위한 포괄적인 테스트 전략을 설명합니다. 이 프로젝트는 도메인 주도 설계(DDD)와 클린 아키텍처 원칙에 따라 개발되고 있습니다. 본 테스트 전략은 다층적 테스트 접근 방식을 통해 코드 품질, 유지보수성 및 신뢰성을 보장하는 것을 목표로 합니다.

## 2. 현황 분석

`apps/android/package.json` 분석 결과, 프로젝트는 아직 초기 단계에 있는 것으로 파악됩니다. 주요 관찰 내용은 다음과 같습니다.

- **테스트 스크립트 부재**: `test` 스크립트가 설정되어 있지 않습니다. (`"test": "echo 'No test specified'"`)
- **불완전한 React Native 설정**: 스크립트는 React Native 프로젝트를 암시하지만, 핵심 `react-native` 의존성이 누락되어 있습니다.
- **모노레포 의존성**: 프로젝트가 공유 패키지(`@posmul/study-cycle-core`, `@posmul/shared-auth`, `@posmul/shared-types`)에 의존하고 있어, 통합된 테스트 접근 방식이 필요합니다.

## 3. 제안 테스트 전략

단위(Unit), 통합(Integration), 엔드투엔드(E2E) 테스트로 구성된 견고한 테스트 피라미드 구축을 권장합니다.

### 3.1. 단위 테스트 (Unit Tests)

**목표**: 개별 컴포넌트, 함수, 비즈니스 로직을 독립적으로 테스트합니다.

**도구**:
- **Jest**: 널리 사용되는 JavaScript 테스트 프레임워크입니다.
- **React Native Testing Library**: React 컴포넌트 테스트를 위한 라이브러리입니다.

**구현 단계**:
1.  **의존성 설치**:
    ```bash
    pnpm add -D jest @types/jest @testing-library/react-native @testing-library/jest-native
    ```
2.  **Jest 설정**: `apps/android` 디렉터리에 `jest.config.js` 파일을 생성합니다.
    ```javascript
    module.exports = {
      preset: "react-native",
      setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
      transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
      ]
    };
    ```
3.  **`package.json` 업데이트**:
    ```json
    "scripts": {
      ...
      "test": "jest"
    }
    ```
4.  **테스트 작성**: 소스 폴더 내에 `__tests__` 디렉터리를 만들고, 컴포넌트와 유틸리티 함수에 대한 테스트를 작성합니다.

### 3.2. 통합 테스트 (Integration Tests)

**목표**: 공유 모노레포 패키지를 포함한 여러 컴포넌트와 모듈 간의 상호작용을 테스트합니다.

**접근 방식**:
- Jest를 활용하여 여러 컴포넌트와 서비스를 아우르는 통합 테스트를 작성합니다.
- Jest의 모의(mocking) 기능을 사용하여 API 호출과 같은 외부 의존성을 모의 처리합니다.
- 공유 패키지(`@posmul/study-cycle-core` 등)를 가져와 결합된 동작을 검증함으로써 통합을 테스트합니다.

### 3.3. 엔드투엔드 테스트 (E2E Tests)

**목표**: 사용자 관점에서 전체 애플리케이션 흐름을 테스트합니다.

**도구**:
- **Detox** 또는 **Appium**: 모바일 애플리케이션 E2E 테스트를 위한 프레임워크입니다.

**구현 단계 (Detox 예시)**:
1.  **Detox 설치**: 공식 Detox 문서를 따라 React Native 프로젝트에 맞게 설정합니다.
2.  **Detox 설정**: `.detoxrc.json` 파일을 생성하여 테스트 러너, 빌드 명령어, 디바이스 설정을 구성합니다.
3.  **E2E 테스트 작성**: `e2e` 디렉터리를 만들고 사용자 상호작용을 시뮬레이션하고 애플리케이션의 동작을 검증하는 테스트를 작성합니다.

## 4. DDD 및 클린 아키텍처 고려사항

- **도메인 계층**: 도메인 계층의 핵심 비즈니스 로직은 단위 테스트로 광범위하게 커버해야 합니다. 이 테스트들은 외부 의존성이 없는 순수한 함수여야 합니다.
- **애플리케이션 계층**: 유스케이스와 애플리케이션 서비스는 인프라 계층을 모의 처리하여 통합 테스트로 검증합니다.
- **인프라 계층**: API 클라이언트나 데이터베이스 접근과 같은 인프라 계층의 구현 세부사항을 통합 테스트로 테스트합니다.
- **프레젠테이션 계층 (UI)**: 컴포넌트 테스트와 E2E 테스트를 사용하여 UI의 동작과 모양을 검증합니다.

## 5. 결론 및 권장사항

`apps/android` 프로젝트는 현재 테스트 프레임워크가 부재합니다. 개발 수명주기 초기에 견고한 테스트 전략을 수립하는 것이 매우 중요합니다.

**권장사항**:
1.  **단위 테스트 우선순위 부여**: Jest와 React Native Testing Library를 사용하여 기존 코드베이스에 대한 단위 테스트를 먼저 구현합니다.
2.  **E2E 테스트 설정**: 중요한 사용자 흐름에 대해 Detox 또는 Appium으로 E2E 테스트를 설정합니다.
3.  **CI/CD 통합**: 테스트 스크립트를 CI/CD 파이프라인(예: GitHub Actions)에 통합하여 테스트 프로세스를 자동화하고 모든 변경 사항이 병합되기 전에 검증되도록 합니다.

이러한 다층적 테스트 전략을 구현함으로써 프로젝트는 더 높은 품질을 달성하고, 버그 발생을 줄이며, 향후 개발 및 유지보수를 용이하게 할 수 있습니다.