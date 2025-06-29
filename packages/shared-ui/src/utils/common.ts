/**
 * 공통 유틸리티 함수들
 */

import type { BaseError, Result as ResultType } from "@posmul/shared-types";

// 결과 패턴 헬퍼 함수들
export const ResultUtils = {
  success: <T>(data: T): ResultType<T> => ({ success: true, data }),
  failure: <T>(error: BaseError): ResultType<T, BaseError> => ({
    success: false,
    error,
  }),

  isSuccess: <T>(result: ResultType<T>): result is { success: true; data: T } =>
    result.success,

  isFailure: <T>(
    result: ResultType<T, BaseError>
  ): result is { success: false; error: BaseError } => !result.success,

  map: <T, U>(result: ResultType<T>, mapper: (data: T) => U): ResultType<U> => {
    if (result.success) {
      return ResultUtils.success(mapper(result.data));
    }
    return result;
  },

  flatMap: <T, U>(
    result: ResultType<T>,
    mapper: (data: T) => ResultType<U>
  ): ResultType<U> => {
    if (result.success) {
      return mapper(result.data);
    }
    return result;
  },
};

// 날짜 유틸리티
export const DateUtils = {
  now: (): Date => new Date(),

  isAfter: (date1: Date, date2: Date): boolean =>
    date1.getTime() > date2.getTime(),

  isBefore: (date1: Date, date2: Date): boolean =>
    date1.getTime() < date2.getTime(),

  addMinutes: (date: Date, minutes: number): Date =>
    new Date(date.getTime() + minutes * 60 * 1000),

  addDays: (date: Date, days: number): Date =>
    new Date(date.getTime() + days * 24 * 60 * 60 * 1000),

  formatToKST: (date: Date): string =>
    date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),

  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },
};

// 숫자 유틸리티
export const NumberUtils = {
  formatCurrency: (amount: number): string =>
    amount.toLocaleString("ko-KR") + "원",

  formatPoint: (point: number): string => point.toLocaleString("ko-KR") + "P",

  roundToDecimals: (value: number, decimals: number): number =>
    Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals),

  isPositive: (value: number): boolean => value > 0,

  isNonNegative: (value: number): boolean => value >= 0,

  clamp: (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max),
};

// 문자열 유틸리티
export const StringUtils = {
  isEmpty: (str: string | null | undefined): boolean =>
    !str || str.trim().length === 0,

  isNotEmpty: (str: string | null | undefined): boolean =>
    !StringUtils.isEmpty(str),

  truncate: (str: string, maxLength: number): string =>
    str.length > maxLength ? str.substring(0, maxLength) + "..." : str,

  capitalize: (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1),

  kebabCase: (str: string): string => str.replace(/\s+/g, "-").toLowerCase(),

  camelCase: (str: string): string =>
    str.replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : "")),

  removeSpecialChars: (str: string): string =>
    str.replace(/[^a-zA-Z0-9가-힣\s]/g, ""),

  generateRandomString: (length: number): string => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

// 배열 유틸리티
export const ArrayUtils = {
  isEmpty: <T>(array: T[]): boolean => array.length === 0,

  isNotEmpty: <T>(array: T[]): boolean => array.length > 0,

  first: <T>(array: T[]): T | undefined => array[0],

  last: <T>(array: T[]): T | undefined => array[array.length - 1],

  // unique: <T>(array: T[]): T[] => [...new Set(array)],

  groupBy: <T, K extends string | number>(
    array: T[],
    keySelector: (item: T) => K
  ): Record<K, T[]> => {
    return array.reduce(
      (groups, item) => {
        const key = keySelector(item);
        (groups[key] = groups[key] || []).push(item);
        return groups;
      },
      {} as Record<K, T[]>
    );
  },

  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
};

// 객체 유틸리티
export const ObjectUtils = {
  isEmpty: (obj: Record<string, unknown>): boolean =>
    Object.keys(obj).length === 0,

  isNotEmpty: (obj: Record<string, unknown>): boolean =>
    Object.keys(obj).length > 0,

  pick: <T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach((key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  omit: <T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach((key) => {
      delete result[key];
    });
    return result as Omit<T, K>;
  },

  deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),

  hasProperty: <T extends Record<string, unknown>>(
    obj: T,
    property: string
  ): boolean => Object.prototype.hasOwnProperty.call(obj, property),
};

// 비동기 유틸리티
export const AsyncUtils = {
  delay: (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms)),

  timeout: <T>(promise: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), ms)
      ),
    ]),

  retry: async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          throw lastError;
        }

        await AsyncUtils.delay(delayMs * attempt);
      }
    }

    throw lastError!;
  },
};

// 검증 유틸리티
export const ValidationUtils = {
  isEmail: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

  isPhoneNumber: (phone: string): boolean =>
    /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(phone),

  isUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isPositiveInteger: (value: unknown): boolean =>
    Number.isInteger(value) && Number(value) > 0,

  isNonNegativeInteger: (value: unknown): boolean =>
    Number.isInteger(value) && Number(value) >= 0,

  isInRange: (value: number, min: number, max: number): boolean =>
    value >= min && value <= max,

  hasMinLength: (str: string, minLength: number): boolean =>
    str.length >= minLength,

  hasMaxLength: (str: string, maxLength: number): boolean =>
    str.length <= maxLength,
};

// 디바운싱 및 스로틀링
export const PerformanceUtils = {
  debounce: <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: Parameters<T>): void => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },

  throttle: <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;
    return ((...args: Parameters<T>): void => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },
};
