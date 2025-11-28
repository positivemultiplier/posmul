/**
 * Domain Event Publisher Implementation
 *
 * Event-driven Architecture의 중심 컴포넌트로, 모든 도메인 이벤트의 발행을 담당합니다.
 * Clean Architecture 원칙에 따라 Domain Layer에서 Infrastructure Layer로의 의존성 역전을 구현합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
const __extends =
  (this && this.__extends) ||
  (function () {
    let extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (const p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError(
          "Class extends value " + String(b) + " is not a constructor or null"
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
const __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
const __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    let _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
const __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
/**
 * 이벤트 발행 오류
 */
const PublishError = /** @class */ (function (_super) {
  __extends(PublishError, _super);
  function PublishError(message, cause, eventType) {
    const _this = _super.call(this, message) || this;
    _this.cause = cause;
    _this.eventType = eventType;
    _this.name = "PublishError";
    return _this;
  }
  return PublishError;
})(Error);
export { PublishError };
/**
 * 이벤트 핸들러 오류
 */
const HandlerError = /** @class */ (function (_super) {
  __extends(HandlerError, _super);
  function HandlerError(message, cause, subscriberId) {
    const _this = _super.call(this, message) || this;
    _this.cause = cause;
    _this.subscriberId = subscriberId;
    _this.name = "HandlerError";
    return _this;
  }
  return HandlerError;
})(Error);
export { HandlerError };
/**
 * 메모리 기반 이벤트 발행자 (개발 및 테스트용)
 */
const InMemoryEventPublisher = /** @class */ (function () {
  function InMemoryEventPublisher() {
    this.subscribers = new Map();
    this.eventStore = [];
    this.isShutdown = false;
  }
  /**
   * 구독자 등록
   */
  InMemoryEventPublisher.prototype.subscribe = function (subscriber) {
    if (!this.subscribers.has(subscriber.eventType)) {
      this.subscribers.set(subscriber.eventType, []);
    }
    this.subscribers.get(subscriber.eventType).push(subscriber);
  };
  /**
   * 구독자 해제
   */
  InMemoryEventPublisher.prototype.unsubscribe = function (
    eventType,
    subscriberId
  ) {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      const filtered = subscribers.filter(function (s) {
        return s.subscriberId !== subscriberId;
      });
      this.subscribers.set(eventType, filtered);
    }
  };
  /**
   * 단일 이벤트 발행
   */
  InMemoryEventPublisher.prototype.publish = function (event) {
    return __awaiter(this, void 0, void 0, function () {
      let subscribers, results, failedResults, error_1;
      const _this = this;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            if (this.isShutdown) {
              return [
                2 /*return*/,
                {
                  success: false,
                  error: new PublishError("Event publisher is shutdown"),
                },
              ];
            }
            // 이벤트 저장
            this.eventStore.push(event);
            subscribers = this.subscribers.get(event.type) || [];
            return [
              4 /*yield*/,
              Promise.allSettled(
                subscribers.map(function (subscriber) {
                  return __awaiter(_this, void 0, void 0, function () {
                    let result, error_2;
                    return __generator(this, function (_a) {
                      switch (_a.label) {
                        case 0:
                          _a.trys.push([0, 2, , 3]);
                          return [4 /*yield*/, subscriber.handle(event)];
                        case 1:
                          result = _a.sent();
                          if (!result.success) {
                            console.error(
                              "Handler error for ".concat(
                                subscriber.subscriberId,
                                ":"
                              ),
                              result.error
                            );
                          }
                          return [2 /*return*/, result];
                        case 2:
                          error_2 = _a.sent();
                          console.error(
                            "Unexpected error in handler ".concat(
                              subscriber.subscriberId,
                              ":"
                            ),
                            error_2
                          );
                          throw error_2;
                        case 3:
                          return [2 /*return*/];
                      }
                    });
                  });
                })
              ),
            ];
          case 1:
            results = _a.sent();
            failedResults = results.filter(function (result) {
              return result.status === "rejected";
            });
            if (failedResults.length > 0) {
              console.warn(
                ""
                  .concat(failedResults.length, " handlers failed for event ")
                  .concat(event.type)
              );
            }
            return [2 /*return*/, { success: true, data: undefined }];
          case 2:
            error_1 = _a.sent();
            return [
              2 /*return*/,
              {
                success: false,
                error: new PublishError(
                  "Failed to publish event: ".concat(
                    error_1 instanceof Error ? error_1.message : "Unknown error"
                  ),
                  error_1 instanceof Error ? error_1 : undefined,
                  event.type
                ),
              },
            ];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 다중 이벤트 발행
   */
  InMemoryEventPublisher.prototype.publishBatch = function (events) {
    return __awaiter(this, void 0, void 0, function () {
      let results, failedResults, error_3;
      const _this = this;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              Promise.allSettled(
                events.map(function (event) {
                  return _this.publish(event);
                })
              ),
            ];
          case 1:
            results = _a.sent();
            failedResults = results.filter(function (result) {
              return (
                result.status === "rejected" ||
                (result.status === "fulfilled" && !result.value.success)
              );
            });
            if (failedResults.length > 0) {
              return [
                2 /*return*/,
                {
                  success: false,
                  error: new PublishError(
                    "Batch publish failed: "
                      .concat(failedResults.length, "/")
                      .concat(events.length, " events failed")
                  ),
                },
              ];
            }
            return [2 /*return*/, { success: true, data: undefined }];
          case 2:
            error_3 = _a.sent();
            return [
              2 /*return*/,
              {
                success: false,
                error: new PublishError(
                  "Batch publish error: ".concat(
                    error_3 instanceof Error ? error_3.message : "Unknown error"
                  ),
                  error_3 instanceof Error ? error_3 : undefined
                ),
              },
            ];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 발행자 상태 확인
   */
  InMemoryEventPublisher.prototype.isHealthy = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        return [2 /*return*/, !this.isShutdown];
      });
    });
  };
  /**
   * 발행자 정리
   */
  InMemoryEventPublisher.prototype.shutdown = function () {
    this.isShutdown = true;
    this.subscribers.clear();
  };
  /**
   * 저장된 이벤트 조회 (테스트용)
   */
  InMemoryEventPublisher.prototype.getStoredEvents = function () {
    return __spreadArray([], this.eventStore, true);
  };
  /**
   * 구독자 현황 조회 (디버깅용)
   */
  InMemoryEventPublisher.prototype.getSubscriberStats = function () {
    const stats = {};
    this.subscribers.forEach(function (subscribers, eventType) {
      stats[eventType] = subscribers.length;
    });
    return stats;
  };
  return InMemoryEventPublisher;
})();
export { InMemoryEventPublisher };
/**
 * Supabase 기반 이벤트 발행자 (프로덕션용)
 */
const SupabaseEventPublisher = /** @class */ (function () {
  function SupabaseEventPublisher(eventStore) {
    this.eventStore = eventStore;
    this.subscribers = new Map();
  }
  /**
   * 구독자 등록
   */
  SupabaseEventPublisher.prototype.subscribe = function (subscriber) {
    if (!this.subscribers.has(subscriber.eventType)) {
      this.subscribers.set(subscriber.eventType, []);
    }
    this.subscribers.get(subscriber.eventType).push(subscriber);
  };
  /**
   * 단일 이벤트 발행
   */
  SupabaseEventPublisher.prototype.publish = function (event) {
    return __awaiter(this, void 0, void 0, function () {
      let storeResult, subscribers, results, failedCount, error_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, , 4]);
            return [4 /*yield*/, this.eventStore.store(event)];
          case 1:
            storeResult = _a.sent();
            if (!storeResult.success) {
              return [
                2 /*return*/,
                {
                  success: false,
                  error: new PublishError(
                    "Failed to store event: ".concat(storeResult.error.message),
                    storeResult.error,
                    event.type
                  ),
                },
              ];
            }
            subscribers = this.subscribers.get(event.type) || [];
            return [
              4 /*yield*/,
              Promise.allSettled(
                subscribers.map(function (subscriber) {
                  return subscriber.handle(event);
                })
              ),
            ];
          case 2:
            results = _a.sent();
            failedCount = results.filter(function (result) {
              return (
                result.status === "rejected" ||
                (result.status === "fulfilled" && !result.value.success)
              );
            }).length;
            if (failedCount > 0) {
              console.warn(
                ""
                  .concat(failedCount, "/")
                  .concat(subscribers.length, " handlers failed for event ")
                  .concat(event.type)
              );
            }
            return [2 /*return*/, { success: true, data: undefined }];
          case 3:
            error_4 = _a.sent();
            return [
              2 /*return*/,
              {
                success: false,
                error: new PublishError(
                  "Failed to publish event: ".concat(
                    error_4 instanceof Error ? error_4.message : "Unknown error"
                  ),
                  error_4 instanceof Error ? error_4 : undefined,
                  event.type
                ),
              },
            ];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 다중 이벤트 발행
   */
  SupabaseEventPublisher.prototype.publishBatch = function (events) {
    return __awaiter(this, void 0, void 0, function () {
      let results, failedResults;
      const _this = this;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              Promise.allSettled(
                events.map(function (event) {
                  return _this.publish(event);
                })
              ),
            ];
          case 1:
            results = _a.sent();
            failedResults = results.filter(function (result) {
              return (
                result.status === "rejected" ||
                (result.status === "fulfilled" && !result.value.success)
              );
            });
            if (failedResults.length > 0) {
              return [
                2 /*return*/,
                {
                  success: false,
                  error: new PublishError(
                    "Batch publish failed: "
                      .concat(failedResults.length, "/")
                      .concat(events.length, " events failed")
                  ),
                },
              ];
            }
            return [2 /*return*/, { success: true, data: undefined }];
        }
      });
    });
  };
  /**
   * 발행자 상태 확인
   */
  SupabaseEventPublisher.prototype.isHealthy = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // TODO: 데이터베이스 연결 상태 확인
        return [2 /*return*/, true];
      });
    });
  };
  return SupabaseEventPublisher;
})();
export { SupabaseEventPublisher };
/**
 * 글로벌 이벤트 발행자 (싱글톤)
 */
export var globalEventPublisher = new InMemoryEventPublisher();
/**
 * 이벤트 발행 헬퍼 함수
 */
export var publishDomainEvent = function (event) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, globalEventPublisher.publish(event)];
        case 1:
          return [2 /*return*/, _a.sent()];
      }
    });
  });
};
/**
 * 배치 이벤트 발행 헬퍼 함수
 */
export var publishDomainEvents = function (events) {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, globalEventPublisher.publishBatch(events)];
        case 1:
          return [2 /*return*/, _a.sent()];
      }
    });
  });
};
/**
 * 구독 헬퍼 함수
 */
export var subscribeToDomainEvent = function (subscriber) {
  globalEventPublisher.subscribe(subscriber);
};
