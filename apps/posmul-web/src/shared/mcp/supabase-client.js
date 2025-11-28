// SDK MCP 유틸리티 import (메인 패키지에서)
import {
  MCPError as SupabaseMCPError,
  createMCPAdapter,
  handleMCPError,
  retryMCPOperation,
} from "@posmul/auth-economy-sdk";

/**
 * Supabase MCP Client
 *
 * PosMul Platform Supabase 통합을 위한 MCP 클라이언트
 * MoneyWave 시스템과 PMP/PMC 경제 연동 지원
 */
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

// SDK MCP 유틸리티 re-export
export * from "@posmul/auth-economy-sdk";

/**
 * Supabase MCP 클라이언트 클래스
 */
const SupabaseMCPClient = /** @class */ (function () {
  function SupabaseMCPClient(projectId) {
    this.projectId = projectId;
  }
  /**
   * 🔮 SQL 쿼리 실행 (예측 게임 및 경제 시스템용)
   */
  SupabaseMCPClient.prototype.executeSQL = function (query, options) {
    return __awaiter(this, void 0, void 0, function () {
      let operation, error_1;
      const _this = this;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            operation = function () {
              return mcp_supabase_execute_sql({
                project_id: _this.projectId,
                query: query,
              });
            };
            _a.label = 1;
          case 1:
            _a.trys.push([1, 5, , 6]);
            if (
              !(options === null || options === void 0 ? void 0 : options.retry)
            )
              return [3 /*break*/, 3];
            return [
              4 /*yield*/,
              retryMCPOperation(
                operation,
                "supabase_execute_sql",
                options.maxRetries || 3
              ),
            ];
          case 2:
            return [2 /*return*/, _a.sent()];
          case 3:
            return [4 /*yield*/, operation()];
          case 4:
            return [2 /*return*/, _a.sent()];
          case 5:
            error_1 = _a.sent();
            throw new SupabaseMCPError(
              "Failed to execute SQL query",
              this.projectId,
              query,
              error_1
            );
          case 6:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 🌊 MoneyWave1 연동 - 예측 게임 데이터 조회
   */
  SupabaseMCPClient.prototype.findPredictionGamesForMoneyWave = function (
    filters
  ) {
    return __awaiter(this, void 0, void 0, function () {
      let conditions, whereClause, query, result;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            conditions = [];
            if (
              filters === null || filters === void 0 ? void 0 : filters.status
            ) {
              conditions.push("pg.status = '".concat(filters.status, "'"));
            }
            if (
              filters === null || filters === void 0
                ? void 0
                : filters.minParticipants
            ) {
              conditions.push(
                "participant_count >= ".concat(filters.minParticipants)
              );
            }
            if (
              filters === null || filters === void 0
                ? void 0
                : filters.hasMoneyWave
            ) {
              conditions.push("mw.allocated_pmc > 0");
            }
            whereClause =
              conditions.length > 0
                ? "WHERE ".concat(conditions.join(" AND "))
                : "";
            query =
              "\n      SELECT \n        pg.*,\n        COUNT(p.id) as participant_count,\n        SUM(p.pmp_amount) as total_pmp_staked,\n        COALESCE(mw.allocated_pmc, 0) as money_wave_pmc,\n        mw.wave_type\n      FROM prediction_games pg\n      LEFT JOIN predictions p ON pg.game_id = p.game_id\n      LEFT JOIN money_wave_allocations mw ON pg.game_id = mw.game_id\n      ".concat(
                whereClause,
                "\n      GROUP BY pg.game_id, mw.allocated_pmc, mw.wave_type\n      ORDER BY pg.created_at DESC\n    "
              );
            return [4 /*yield*/, this.executeSQL(query, { retry: true })];
          case 1:
            result = _a.sent();
            if (result.error) {
              throw new SupabaseMCPError(
                "Failed to find prediction games for MoneyWave",
                this.projectId,
                query,
                result.error
              );
            }
            return [2 /*return*/, result.data || []];
        }
      });
    });
  };
  /**
   * 💰 PMP/PMC 계정 잔액 조회
   */
  SupabaseMCPClient.prototype.getEconomicBalance = function (userId) {
    return __awaiter(this, void 0, void 0, function () {
      let query, result, data;
      let _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            query =
              "\n      SELECT \n        COALESCE(pmp.balance, 0) as pmp_balance,\n        COALESCE(pmc.balance, 0) as pmc_balance,\n        GREATEST(pmp.updated_at, pmc.updated_at) as last_activity\n      FROM users u\n      LEFT JOIN pmp_accounts pmp ON u.id = pmp.user_id\n      LEFT JOIN pmc_accounts pmc ON u.id = pmc.user_id\n      WHERE u.id = '".concat(
                userId,
                "'\n    "
              );
            return [4 /*yield*/, this.executeSQL(query, { retry: true })];
          case 1:
            result = _b.sent();
            if (result.error) {
              throw new SupabaseMCPError(
                "Failed to get economic balance",
                this.projectId,
                query,
                result.error
              );
            }
            data =
              (_a = result.data) === null || _a === void 0 ? void 0 : _a[0];
            return [
              2 /*return*/,
              {
                pmpBalance:
                  (data === null || data === void 0
                    ? void 0
                    : data.pmp_balance) || 0,
                pmcBalance:
                  (data === null || data === void 0
                    ? void 0
                    : data.pmc_balance) || 0,
                lastActivity:
                  (data === null || data === void 0
                    ? void 0
                    : data.last_activity) || null,
              },
            ];
        }
      });
    });
  };
  /**
   * 🔄 경제 트랜잭션 기록
   */
  SupabaseMCPClient.prototype.recordEconomicTransaction = function (
    transaction
  ) {
    return __awaiter(this, void 0, void 0, function () {
      let query, result;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            query =
              "\n      INSERT INTO economic_transactions (\n        user_id, transaction_type, amount, source_domain, source_id, description, created_at\n      ) VALUES (\n        '"
                .concat(transaction.userId, "',\n        '")
                .concat(transaction.transactionType, "',\n        ")
                .concat(transaction.amount, ",\n        '")
                .concat(transaction.sourceDomain, "',\n        '")
                .concat(transaction.sourceId, "',\n        '")
                .concat(
                  transaction.description || "",
                  "',\n        NOW()\n      )\n    "
                );
            return [4 /*yield*/, this.executeSQL(query, { retry: true })];
          case 1:
            result = _a.sent();
            if (result.error) {
              throw new SupabaseMCPError(
                "Failed to record economic transaction",
                this.projectId,
                query,
                result.error
              );
            }
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 🌊 MoneyWave 할당 기록
   */
  SupabaseMCPClient.prototype.allocateMoneyWave = function (allocation) {
    return __awaiter(this, void 0, void 0, function () {
      let query, result;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            query =
              "\n      INSERT INTO money_wave_allocations (\n        game_id, wave_type, allocated_pmc, importance_score, difficulty_score, created_at\n      ) VALUES (\n        '"
                .concat(allocation.gameId, "',\n        '")
                .concat(allocation.waveType, "',\n        ")
                .concat(allocation.allocatedPmc, ",\n        ")
                .concat(allocation.importance, ",\n        ")
                .concat(
                  allocation.difficulty,
                  ",\n        NOW()\n      )\n      ON CONFLICT (game_id) DO UPDATE SET\n        allocated_pmc = EXCLUDED.allocated_pmc,\n        importance_score = EXCLUDED.importance_score,\n        difficulty_score = EXCLUDED.difficulty_score,\n        updated_at = NOW()\n    "
                );
            return [4 /*yield*/, this.executeSQL(query, { retry: true })];
          case 1:
            result = _a.sent();
            if (result.error) {
              throw new SupabaseMCPError(
                "Failed to allocate MoneyWave",
                this.projectId,
                query,
                result.error
              );
            }
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * 📊 경제 시스템 통계 조회
   */
  SupabaseMCPClient.prototype.getEconomicStatistics = function () {
    return __awaiter(this, void 0, void 0, function () {
      let query, result, data;
      let _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            query =
              "\n      SELECT \n        (SELECT COALESCE(SUM(balance), 0) FROM pmp_accounts) as total_pmp,\n        (SELECT COALESCE(SUM(balance), 0) FROM pmc_accounts) as total_pmc,\n        (SELECT COUNT(*) FROM prediction_games pg \n         JOIN money_wave_allocations mw ON pg.game_id = mw.game_id \n         WHERE pg.status = 'ACTIVE') as active_games_with_money_wave,\n        (SELECT COUNT(*) FROM economic_transactions \n         WHERE created_at >= CURRENT_DATE) as daily_transactions\n    ";
            return [4 /*yield*/, this.executeSQL(query, { retry: true })];
          case 1:
            result = _b.sent();
            if (result.error) {
              throw new SupabaseMCPError(
                "Failed to get economic statistics",
                this.projectId,
                query,
                result.error
              );
            }
            data =
              (_a = result.data) === null || _a === void 0 ? void 0 : _a[0];
            return [
              2 /*return*/,
              {
                totalPmpCirculation:
                  (data === null || data === void 0
                    ? void 0
                    : data.total_pmp) || 0,
                totalPmcCirculation:
                  (data === null || data === void 0
                    ? void 0
                    : data.total_pmc) || 0,
                activeGamesWithMoneyWave:
                  (data === null || data === void 0
                    ? void 0
                    : data.active_games_with_money_wave) || 0,
                dailyTransactions:
                  (data === null || data === void 0
                    ? void 0
                    : data.daily_transactions) || 0,
              },
            ];
        }
      });
    });
  };
  /**
   * 🔒 데이터베이스 보안 검사 (정기 실행)
   */
  SupabaseMCPClient.prototype.runSecurityCheck = function () {
    return __awaiter(this, void 0, void 0, function () {
      let result, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              mcp_supabase_get_advisors({
                project_id: this.projectId,
                type: "security",
              }),
            ];
          case 1:
            result = _a.sent();
            if (result.error) {
              throw new SupabaseMCPError(
                "Failed to run security check",
                this.projectId,
                undefined,
                result.error
              );
            }
            return [2 /*return*/, result.data || []];
          case 2:
            error_2 = _a.sent();
            throw handleMCPError(error_2, "security_check");
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * ⚡ 성능 최적화 검사
   */
  SupabaseMCPClient.prototype.runPerformanceCheck = function () {
    return __awaiter(this, void 0, void 0, function () {
      let result, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              mcp_supabase_get_advisors({
                project_id: this.projectId,
                type: "performance",
              }),
            ];
          case 1:
            result = _a.sent();
            if (result.error) {
              throw new SupabaseMCPError(
                "Failed to run performance check",
                this.projectId,
                undefined,
                result.error
              );
            }
            return [2 /*return*/, result.data || []];
          case 2:
            error_3 = _a.sent();
            throw handleMCPError(error_3, "performance_check");
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  return SupabaseMCPClient;
})();
export { SupabaseMCPClient };
/**
 * 전역 MCP Supabase 클라이언트 인스턴스
 */
export var createSupabaseMCPClient = function (projectId) {
  return new SupabaseMCPClient(projectId);
};
/**
 * 기본 MCP 함수들의 래퍼 (하위 호환성)
 */
export var mcp_supabase_execute_sql = function (params) {
  return __awaiter(void 0, void 0, void 0, function () {
    let client;
    return __generator(this, function (_a) {
      client = createSupabaseMCPClient(params.project_id);
      return [2 /*return*/, client.executeSQL(params.query)];
    });
  });
};
export var mcp_supabase_apply_migration = function (params) {
  return __awaiter(void 0, void 0, void 0, function () {
    let client, result, error_4;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 4, , 5]);
          if (!(typeof globalThis.mcp_supabase_apply_migration === "function"))
            return [3 /*break*/, 2];
          return [4 /*yield*/, globalThis.mcp_supabase_apply_migration(params)];
        case 1:
          return [2 /*return*/, _a.sent()];
        case 2:
          client = createSupabaseMCPClient(params.project_id);
          return [4 /*yield*/, client.executeSQL(params.query)];
        case 3:
          result = _a.sent();
          if (result.error) {
            return [2 /*return*/, { success: false, error: result.error }];
          }
          return [2 /*return*/, { success: true }];
        case 4:
          error_4 = _a.sent();
          return [2 /*return*/, { success: false, error: error_4 }];
        case 5:
          return [2 /*return*/];
      }
    });
  });
};
export var mcp_supabase_get_advisors = function (params) {
  return __awaiter(void 0, void 0, void 0, function () {
    let error_5;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 3, , 4]);
          if (!(typeof globalThis.mcp_supabase_get_advisors === "function"))
            return [3 /*break*/, 2];
          return [4 /*yield*/, globalThis.mcp_supabase_get_advisors(params)];
        case 1:
          return [2 /*return*/, _a.sent()];
        case 2:
          // MCP 도구가 없는 경우 빈 결과 반환
          return [2 /*return*/, { data: [], error: null }];
        case 3:
          error_5 = _a.sent();
          return [2 /*return*/, { data: null, error: error_5 }];
        case 4:
          return [2 /*return*/];
      }
    });
  });
};
export var mcp_supabase_list_tables = function (params) {
  return __awaiter(void 0, void 0, void 0, function () {
    let client, schemas, schemaList, query, error_6;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 4, , 5]);
          if (!(typeof globalThis.mcp_supabase_list_tables === "function"))
            return [3 /*break*/, 2];
          return [4 /*yield*/, globalThis.mcp_supabase_list_tables(params)];
        case 1:
          return [2 /*return*/, _a.sent()];
        case 2:
          client = createSupabaseMCPClient(params.project_id);
          schemas = params.schemas || ["public"];
          schemaList = schemas
            .map(function (s) {
              return "'".concat(s, "'");
            })
            .join(",");
          query =
            "\n      SELECT \n        table_name,\n        table_schema,\n        table_type\n      FROM information_schema.tables \n      WHERE table_schema IN (".concat(
              schemaList,
              ")\n      ORDER BY table_schema, table_name\n    "
            );
          return [4 /*yield*/, client.executeSQL(query)];
        case 3:
          return [2 /*return*/, _a.sent()];
        case 4:
          error_6 = _a.sent();
          return [2 /*return*/, { data: null, error: error_6 }];
        case 5:
          return [2 /*return*/];
      }
    });
  });
};
