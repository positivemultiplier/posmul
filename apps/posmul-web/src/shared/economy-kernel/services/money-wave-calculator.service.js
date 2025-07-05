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
import { EconomyKernelError } from "./economy-kernel.service";
var MoneyWaveCalculatorService = /** @class */ (function () {
    function MoneyWaveCalculatorService(expectedAnnualEbit // 기본값: 100만원
    ) {
        if (expectedAnnualEbit === void 0) { expectedAnnualEbit = 1000000; }
        this.expectedAnnualEbit = expectedAnnualEbit;
    }
    /**
     * MoneyWave1: 일일 상금 풀 계산
     * 매일 자정(00:00)에 호출됨
     */
    MoneyWaveCalculatorService.prototype.calculateDailyPrizePool = function () {
        return __awaiter(this, void 0, void 0, function () {
            var netEbit, ebitBasedPool, redistributedPmc, enterprisePmc, totalDailyPool, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        netEbit = this.expectedAnnualEbit *
                            (1 -
                                MoneyWaveCalculatorService.TAX_RATE -
                                MoneyWaveCalculatorService.INTEREST_RATE);
                        ebitBasedPool = netEbit * MoneyWaveCalculatorService.EBIT_DAILY_RATIO;
                        return [4 /*yield*/, this.calculateRedistributedPmc()];
                    case 1:
                        redistributedPmc = _a.sent();
                        return [4 /*yield*/, this.calculateEnterprisePmc()];
                    case 2:
                        enterprisePmc = _a.sent();
                        totalDailyPool = ebitBasedPool + redistributedPmc + enterprisePmc;
                        return [2 /*return*/, {
                                success: true,
                                data: {
                                    totalDailyPool: totalDailyPool,
                                    ebitBased: ebitBasedPool,
                                    redistributedPmc: redistributedPmc,
                                    enterprisePmc: enterprisePmc,
                                    calculatedAt: new Date(),
                                },
                            }];
                    case 3:
                        error_1 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: new EconomyKernelError("Failed to calculate daily prize pool", "SERVICE_UNAVAILABLE", error_1),
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 게임별 상금 배정
     * 중요도와 난이도에 따른 차등 배분
     */
    MoneyWaveCalculatorService.prototype.allocatePrizePoolToGame = function (totalDailyPool, gameImportanceScore, gameEndTime) {
        return __awaiter(this, void 0, void 0, function () {
            var now, todayStart, todayEnd, timeRemainingRatio, baseAllocationRatio, timeAdjustedRatio;
            return __generator(this, function (_a) {
                now = new Date();
                todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                todayEnd = new Date(todayStart);
                todayEnd.setDate(todayEnd.getDate() + 1);
                timeRemainingRatio = Math.max(0, (todayEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                baseAllocationRatio = this.calculateBaseAllocationRatio(gameImportanceScore);
                timeAdjustedRatio = baseAllocationRatio * (0.3 + 0.7 * timeRemainingRatio);
                return [2 /*return*/, Math.floor(totalDailyPool * timeAdjustedRatio)];
            });
        });
    };
    /**
     * 게임 중요도 점수에 따른 기본 배정 비율 계산
     */
    MoneyWaveCalculatorService.prototype.calculateBaseAllocationRatio = function (importanceScore) {
        // 중요도 점수 1.0~5.0을 0.05~0.25 비율로 매핑
        // 하루에 약 4~20개 게임이 생성된다고 가정
        var minRatio = 0.05; // 5%
        var maxRatio = 0.25; // 25%
        var normalizedScore = (importanceScore - 1.0) / 4.0; // 0~1로 정규화
        return minRatio + (maxRatio - minRatio) * normalizedScore;
    };
    /**
     * MoneyWave2: 미소비 PMC 재분배 금액 계산
     * 실제 구현에서는 DB에서 일정 기간 미사용 PMC 조회
     */
    MoneyWaveCalculatorService.prototype.calculateRedistributedPmc = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: 실제 DB에서 미소비 PMC 조회
                // 현재는 임시값 반환
                return [2 /*return*/, 50000]; // 5만원 상당
            });
        });
    };
    /**
     * MoneyWave3: 기업가 제공 PMC 계산
     * 실제 구현에서는 DB에서 기업가가 제공한 PMC 조회
     */
    MoneyWaveCalculatorService.prototype.calculateEnterprisePmc = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: 실제 DB에서 기업가 PMC 조회
                // 현재는 임시값 반환
                return [2 /*return*/, 30000]; // 3만원 상당
            });
        });
    };
    /**
     * 예상 EBIT 업데이트
     */
    MoneyWaveCalculatorService.prototype.updateExpectedEbit = function (newEbit) {
        // 실제 구현에서는 검증 로직 추가 필요
        if (newEbit > 0) {
            Object.defineProperty(this, "expectedAnnualEbit", {
                value: newEbit,
                writable: false,
            });
        }
    };
    MoneyWaveCalculatorService.EBIT_DAILY_RATIO = 1 / 365; // 연간 EBIT의 1/365
    MoneyWaveCalculatorService.TAX_RATE = 0.25; // 법인세율 25%
    MoneyWaveCalculatorService.INTEREST_RATE = 0.03; // 이자율 3%
    return MoneyWaveCalculatorService;
}());
export { MoneyWaveCalculatorService };
