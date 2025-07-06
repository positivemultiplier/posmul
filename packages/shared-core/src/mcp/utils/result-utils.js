/**
 * Universal MCP Types - 유틸리티 함수들
 *
 * Result와 Error 처리를 위한 헬퍼 함수들
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { isSuccess, isFailure } from '../core/result';
/**
 * Result 유틸리티 함수들
 */
export var ResultUtils = {
    /**
     * Result를 Promise로 변환
     */
    toPromise: function (result) {
        if (isSuccess(result)) {
            return Promise.resolve(result.data);
        }
        var error = result.error;
        if (error instanceof Error) {
            return Promise.reject(error);
        }
        return Promise.reject(new Error(String(error)));
    },
    /**
     * Promise를 Result로 변환
     */
    fromPromise: function (promise) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_1, errorObj;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, promise];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, { success: true, data: data }];
                    case 2:
                        error_1 = _a.sent();
                        errorObj = {
                            code: 'PROMISE_REJECTION',
                            message: error_1 instanceof Error ? error_1.message : String(error_1),
                            type: 'UNKNOWN',
                            severity: 'MEDIUM',
                            cause: error_1 instanceof Error ? error_1 : undefined
                        };
                        return [2 /*return*/, { success: false, error: errorObj }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Result 체이닝 (map)
     */
    map: function (result, mapper) {
        if (isSuccess(result)) {
            try {
                return { success: true, data: mapper(result.data) };
            }
            catch (error) {
                var errorObj = error;
                return { success: false, error: errorObj };
            }
        }
        return result;
    },
    /**
     * Result 체이닝 (flatMap)
     */
    flatMap: function (result, mapper) {
        if (isSuccess(result)) {
            try {
                return mapper(result.data);
            }
            catch (error) {
                var errorObj = error;
                return { success: false, error: errorObj };
            }
        }
        return result;
    },
    /**
     * 여러 Result를 모두 성공해야 하는 조합
     */
    all: function (results) {
        var data = [];
        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
            var result = results_1[_i];
            if (isFailure(result)) {
                return result;
            }
            data.push(result.data);
        }
        return { success: true, data: data };
    },
    /**
     * Result 배열에서 성공한 것들만 추출
     */
    successes: function (results) {
        return results
            .filter(isSuccess)
            .map(function (result) { return result.data; });
    },
    /**
     * Result 배열에서 실패한 것들만 추출
     */
    failures: function (results) {
        return results
            .filter(isFailure)
            .map(function (result) { return result.error; });
    }
};
/**
 * 타입 가드 함수들
 */
export var TypeGuards = {
    /**
     * UniversalError 타입 가드
     */
    isUniversalError: function (error) {
        return (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            'message' in error &&
            'type' in error &&
            'severity' in error);
    },
    /**
     * Error 객체 타입 가드
     */
    isError: function (error) {
        return error instanceof Error;
    },
    /**
     * 특정 에러 코드 체크
     */
    hasErrorCode: function (error, code) {
        return TypeGuards.isUniversalError(error) && error.code === code;
    },
    /**
     * 에러 타입별 체크
     */
    isErrorType: function (error, type) {
        return TypeGuards.isUniversalError(error) && error.type === type;
    }
};
/**
 * 비동기 작업 헬퍼
 */
export var AsyncUtils = {
    /**
     * 재시도 로직
     */
    retry: function (operation_1) {
        return __awaiter(this, arguments, void 0, function (operation, maxRetries, delay) {
            var lastError, attempt, data, error_2, errorObj;
            if (maxRetries === void 0) { maxRetries = 3; }
            if (delay === void 0) { delay = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= maxRetries)) return [3 /*break*/, 8];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 7]);
                        return [4 /*yield*/, operation()];
                    case 3:
                        data = _a.sent();
                        return [2 /*return*/, { success: true, data: data }];
                    case 4:
                        error_2 = _a.sent();
                        lastError = error_2;
                        if (!(attempt < maxRetries)) return [3 /*break*/, 6];
                        return [4 /*yield*/, AsyncUtils.sleep(delay * attempt)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 7];
                    case 7:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 8:
                        errorObj = {
                            code: 'RETRY_FAILED',
                            message: "Operation failed after ".concat(maxRetries, " retries"),
                            type: 'UNKNOWN',
                            severity: 'HIGH',
                            cause: lastError instanceof Error ? lastError : undefined
                        };
                        return [2 /*return*/, { success: false, error: errorObj }];
                }
            });
        });
    },
    /**
     * 타임아웃 처리
     */
    withTimeout: function (operation, timeoutMs) {
        return __awaiter(this, void 0, void 0, function () {
            var timeoutPromise, data, error_3, errorObj;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timeoutPromise = new Promise(function (_, reject) {
                            setTimeout(function () {
                                reject(new Error("Operation timed out after ".concat(timeoutMs, "ms")));
                            }, timeoutMs);
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.race([operation, timeoutPromise])];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, { success: true, data: data }];
                    case 3:
                        error_3 = _a.sent();
                        errorObj = {
                            code: 'TIMEOUT',
                            message: error_3 instanceof Error ? error_3.message : String(error_3),
                            type: 'NETWORK',
                            severity: 'HIGH',
                            cause: error_3 instanceof Error ? error_3 : undefined
                        };
                        return [2 /*return*/, { success: false, error: errorObj }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * 딜레이 함수
     */
    sleep: function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    }
};
