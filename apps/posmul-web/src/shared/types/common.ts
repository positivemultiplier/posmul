export * from "../legacy-compatibility";

// Re-export commonly used types from SDK
export type {
  Result,
  isFailure,
  isSuccess,
  DomainEvent,
  IDomainEventPublisher,
} from "@posmul/auth-economy-sdk";

// Re-export result functions (not as types)
export { success, failure } from "@posmul/auth-economy-sdk";
