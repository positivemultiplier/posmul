import { type ClassValue, clsx } from "clsx";

/**
 * Conditionally join classNames together
 * clsx를 사용하여 클래스명을 안전하게 결합
 *
 * @param inputs - 클래스명들 (문자열, 객체, 배열 등)
 * @returns 결합된 클래스명 문자열
 *
 * @example
 * cn("px-2 py-1", condition && "bg-blue-500", {
 *   "text-white": isActive,
 *   "text-gray-600": !isActive
 * })
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * 기본 export (하위 호환성)
 */
export default cn;
