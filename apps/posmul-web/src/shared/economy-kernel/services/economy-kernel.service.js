/**
 * Economy Kernel Service
 *
 * PosMul 플랫폼의 공유 경제 커널로, 모든 도메인에서 읽기 전용으로 PMP/PMC 잔액을 조회할 수 있습니다.
 * Shared Kernel 패턴을 구현하여 경제 시스템의 무결성을 보장하고,
 * Domain Events를 통해서만 경제 데이터의 변경을 허용합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { failure, isFailure, success, } from "@posmul/auth-economy-sdk";
/**
 * Economy Kernel 오류 타입
 */
var EconomyKernelError = /** @class */ (function (_super) {
    __extends(EconomyKernelError, _super);
    function EconomyKernelError(message, code, cause) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.cause = cause;
        _this.name = "EconomyKernelError";
        return _this;
    }
    return EconomyKernelError;
}(Error));
export { EconomyKernelError };
/**
 * Economy Kernel Singleton Service
 *
 * 이 서비스는 시스템 전체에서 단일 인스턴스로 관리되며,
 * 모든 도메인에서 경제 데이터를 읽기 전용으로 접근할 수 있게 합니다.
 *
 * 중요: 이 서비스는 오직 읽기 작업만 수행하며,
 * 모든 쓰기 작업은 도메인 이벤트를 통해서만 수행됩니다.
 */
var EconomyKernel = /** @class */ (function () {
    /**
     * 외부에서 직접 인스턴스화 방지
     */
    function EconomyKernel() {
        this.repository = null;
    }
    /**
     * 싱글톤 인스턴스 획득
     */
    EconomyKernel.getInstance = function () {
        if (!EconomyKernel.instance) {
            EconomyKernel.instance = new EconomyKernel();
        }
        return EconomyKernel.instance;
    };
    /**
     * 리포지토리 주입 (Infrastructure 계층에서 호출)
     */
    EconomyKernel.prototype.injectRepository = function (repository) {
        this.repository = repository;
    };
    /**
     * 리포지토리 존재 여부 확인
     */
    EconomyKernel.prototype.ensureRepository = function () {
        if (!this.repository) {
            return {
                success: false,
                error: new EconomyKernelError("Economy Kernel repository not initialized", "SERVICE_UNAVAILABLE"),
            };
        }
        return { success: true, data: this.repository };
    };
    /**
     * 사용자 PMP 잔액 조회
     *
     * @param userId 사용자 ID
     * @returns PMP 잔액 (숫자)
     */
    EconomyKernel.prototype.getPmpBalance = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var repositoryResult, repo, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repositoryResult = this.ensureRepository();
                        if (isFailure(repositoryResult)) {
                            return [2 /*return*/, failure(repositoryResult.error)];
                        }
                        repo = repositoryResult.data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, repo.getPmpBalance(userId)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        return [2 /*return*/, failure(new EconomyKernelError("Failed to retrieve PMP balance for user ".concat(userId), "REPOSITORY_ERROR", error_1))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 사용자 PMC 잔액 조회
     *
     * @param userId 사용자 ID
     * @returns PMC 잔액 (숫자)
     */
    EconomyKernel.prototype.getPmcBalance = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var repositoryResult, repo, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repositoryResult = this.ensureRepository();
                        if (isFailure(repositoryResult)) {
                            return [2 /*return*/, failure(repositoryResult.error)];
                        }
                        repo = repositoryResult.data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, repo.getPmcBalance(userId)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        return [2 /*return*/, failure(new EconomyKernelError("Failed to retrieve PMC balance for user ".concat(userId), "REPOSITORY_ERROR", error_2))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * PMP 계정 정보 상세 조회
     *
     * @param userId 사용자 ID
     * @returns PMP 계정 정보
     */
    EconomyKernel.prototype.getPmpAccount = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var repositoryResult, repo, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repositoryResult = this.ensureRepository();
                        if (isFailure(repositoryResult)) {
                            return [2 /*return*/, failure(repositoryResult.error)];
                        }
                        repo = repositoryResult.data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, repo.getPmpAccount(userId)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_3 = _a.sent();
                        return [2 /*return*/, failure(new EconomyKernelError("Failed to retrieve PMP account for user ".concat(userId), "REPOSITORY_ERROR", error_3))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * PMC 계정 정보 상세 조회
     *
     * @param userId 사용자 ID
     * @returns PMC 계정 정보
     */
    EconomyKernel.prototype.getPmcAccount = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var repositoryResult, repo, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repositoryResult = this.ensureRepository();
                        if (isFailure(repositoryResult)) {
                            return [2 /*return*/, failure(repositoryResult.error)];
                        }
                        repo = repositoryResult.data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, repo.getPmcAccount(userId)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_4 = _a.sent();
                        return [2 /*return*/, failure(new EconomyKernelError("Failed to retrieve PMC account for user ".concat(userId), "REPOSITORY_ERROR", error_4))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * PMP 잔액 충분성 확인
     *
     * @param userId 사용자 ID
     * @param requiredAmount 필요한 PMP 금액
     * @returns 잔액 충분성 여부
     */
    EconomyKernel.prototype.canSpendPmp = function (userId, requiredAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var repositoryResult, repo, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (requiredAmount <= 0) {
                            return [2 /*return*/, failure(new EconomyKernelError("Required amount must be positive", "INVALID_CURRENCY_TYPE"))];
                        }
                        repositoryResult = this.ensureRepository();
                        if (isFailure(repositoryResult)) {
                            return [2 /*return*/, failure(repositoryResult.error)];
                        }
                        repo = repositoryResult.data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, repo.hasSufficientPmp(userId, requiredAmount)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_5 = _a.sent();
                        return [2 /*return*/, failure(new EconomyKernelError("Failed to check PMP sufficiency for user ".concat(userId), "REPOSITORY_ERROR", error_5))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * PMC 잔액 충분성 확인
     *
     * @param userId 사용자 ID
     * @param requiredAmount 필요한 PMC 금액
     * @returns 잔액 충분성 여부
     */
    EconomyKernel.prototype.canSpendPmc = function (userId, requiredAmount) {
        return __awaiter(this, void 0, void 0, function () {
            var repositoryResult, repo, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (requiredAmount <= 0) {
                            return [2 /*return*/, failure(new EconomyKernelError("Required amount must be positive", "INVALID_CURRENCY_TYPE"))];
                        }
                        repositoryResult = this.ensureRepository();
                        if (isFailure(repositoryResult)) {
                            return [2 /*return*/, failure(repositoryResult.error)];
                        }
                        repo = repositoryResult.data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, repo.hasSufficientPmc(userId, requiredAmount)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_6 = _a.sent();
                        return [2 /*return*/, failure(new EconomyKernelError("Failed to check PMC sufficiency for user ".concat(userId), "REPOSITORY_ERROR", error_6))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 경제 시스템 전체 통계 조회
     *
     * @returns 시스템 통계
     */
    EconomyKernel.prototype.getSystemStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var repositoryResult, repo, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repositoryResult = this.ensureRepository();
                        if (isFailure(repositoryResult)) {
                            return [2 /*return*/, failure(repositoryResult.error)];
                        }
                        repo = repositoryResult.data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, repo.getSystemStats()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_7 = _a.sent();
                        return [2 /*return*/, failure(new EconomyKernelError("Failed to retrieve system statistics", "REPOSITORY_ERROR", error_7))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 여러 사용자의 PMP 잔액을 일괄 조회
     *
     * @param userIds 사용자 ID 배열
     * @returns 사용자별 PMP 잔액 맵
     */
    EconomyKernel.prototype.getBulkPmpBalances = function (userIds) {
        return __awaiter(this, void 0, void 0, function () {
            var repositoryResult, repo, balancePromises, balances, error_8;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repositoryResult = this.ensureRepository();
                        if (isFailure(repositoryResult)) {
                            return [2 /*return*/, failure(repositoryResult.error)];
                        }
                        repo = repositoryResult.data;
                        if (userIds.length === 0) {
                            return [2 /*return*/, success(new Map())];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        balancePromises = userIds.map(function (userId) { return __awaiter(_this, void 0, void 0, function () {
                            var balanceResult;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, repo.getPmpBalance(userId)];
                                    case 1:
                                        balanceResult = _a.sent();
                                        if (isFailure(balanceResult)) {
                                            throw new EconomyKernelError("Failed to get PMP balance for user ".concat(userId, ": ").concat(balanceResult.error.message), "REPOSITORY_ERROR", balanceResult.error);
                                        }
                                        return [2 /*return*/, [userId, balanceResult.data]];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(balancePromises)];
                    case 2:
                        balances = _a.sent();
                        return [2 /*return*/, success(new Map(balances))];
                    case 3:
                        error_8 = _a.sent();
                        return [2 /*return*/, failure(error_8 instanceof EconomyKernelError
                                ? error_8
                                : new EconomyKernelError("Failed to retrieve bulk PMP balances", "REPOSITORY_ERROR", error_8))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 여러 사용자의 PMC 잔액을 일괄 조회
     *
     * @param userIds 사용자 ID 배열
     * @returns 사용자별 PMC 잔액 맵
     */
    EconomyKernel.prototype.getBulkPmcBalances = function (userIds) {
        return __awaiter(this, void 0, void 0, function () {
            var repositoryResult, repo, balancePromises, balances, error_9;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repositoryResult = this.ensureRepository();
                        if (isFailure(repositoryResult)) {
                            return [2 /*return*/, failure(repositoryResult.error)];
                        }
                        repo = repositoryResult.data;
                        if (userIds.length === 0) {
                            return [2 /*return*/, success(new Map())];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        balancePromises = userIds.map(function (userId) { return __awaiter(_this, void 0, void 0, function () {
                            var balanceResult;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, repo.getPmcBalance(userId)];
                                    case 1:
                                        balanceResult = _a.sent();
                                        if (isFailure(balanceResult)) {
                                            throw new EconomyKernelError("Failed to get PMC balance for user ".concat(userId, ": ").concat(balanceResult.error.message), "REPOSITORY_ERROR", balanceResult.error);
                                        }
                                        return [2 /*return*/, [userId, balanceResult.data]];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(balancePromises)];
                    case 2:
                        balances = _a.sent();
                        return [2 /*return*/, success(new Map(balances))];
                    case 3:
                        error_9 = _a.sent();
                        return [2 /*return*/, failure(error_9 instanceof EconomyKernelError
                                ? error_9
                                : new EconomyKernelError("Failed to retrieve bulk PMC balances", "REPOSITORY_ERROR", error_9))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 인스턴스 초기화 (테스트용)
     */
    EconomyKernel.resetInstance = function () {
        EconomyKernel.instance = null;
    };
    EconomyKernel.instance = null;
    return EconomyKernel;
}());
export { EconomyKernel };
/**
 * Economy Kernel 전역 인스턴스 획득 헬퍼 함수
 */
export var getEconomyKernel = function () {
    return EconomyKernel.getInstance();
};
