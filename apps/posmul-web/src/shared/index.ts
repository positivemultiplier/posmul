/**
 * Legacy shared index shim
 *
 * 웹 애플리케이션의 기존 `@/shared/*` import를 끊김 없이 유지하기 위해,
 * 새로운 모노레포 패키지(`@posmul/*`)로 모든 export 를 재전달합니다.
 * 최종 목표는 해당 디렉터리를 제거하고 각 소스를 직접 패키지로 참조하는 것이지만,
 * 단계적 마이그레이션을 위해 호환 레이어를 유지합니다.
 */

// Public types – 통합 타입은 shared-types 패키지로 이동
export * from "@posmul/shared-types";

// UI / util – shared-ui 패키지로부터 re-export
export * from "@posmul/shared-ui";

// Auth / Supabase helpers – shared-auth 패키지로부터 re-export
export * from "@posmul/shared-auth";

// NOTE: Economy Kernel, Domain Events 등은 향후 @posmul/shared-domain 으로 이동 예정.
// 일단 기존 경로를 사용하는 코드는 shared-types 내 정의를 사용하도록 안내.
