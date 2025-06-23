/**
 * 🎯 간단한 타입 테스트 스크립트
 *
 * MCP 생성된 타입들이 올바르게 작동하는지 확인
 */

import {
  Enums,
  Tables,
  TablesInsert,
} from "./src/shared/types/supabase-generated";

// 🔥 Prediction Game 타입 테스트
type PredictionGame = Tables<"prediction_games">;
type PredictionGameInsert = TablesInsert<"prediction_games">;

// 🔥 Enum 타입 테스트
type GameStatus = Enums<"game_status">;
type PredictionCategory = Enums<"prediction_category">;
type PredictionType = Enums<"prediction_type">;

// 🔥 타입 검증
const testGame: PredictionGame = {
  actual_result: null,
  category: "SPORTS", // ✅ 올바른 enum 값
  created_at: "2025-06-23T00:00:00Z",
  creator_id: "test-user-id",
  data_source: null,
  description: "Test game description",
  difficulty: 2.5,
  external_id: null,
  game_id: "test-game-id",
  game_options: { option1: "Yes", option2: "No" },
  max_bet_amount: 1000,
  metadata: null,
  min_bet_amount: 10,
  prediction_type: "BINARY", // ✅ 올바른 enum 값
  registration_end: "2025-06-24T00:00:00Z",
  registration_start: "2025-06-23T00:00:00Z",
  settlement_date: "2025-06-25T00:00:00Z",
  status: "ACTIVE", // ✅ 올바른 enum 값
  tags: ["test", "sports"],
  title: "Test Prediction Game",
  updated_at: "2025-06-23T00:00:00Z",
};

const testGameInsert: PredictionGameInsert = {
  category: "POLITICS",
  creator_id: "test-creator",
  description: "New game",
  difficulty: 1.5,
  game_options: { yes: "Yes", no: "No" },
  max_bet_amount: 500,
  min_bet_amount: 5,
  prediction_type: "BINARY",
  registration_end: "2025-06-24T00:00:00Z",
  registration_start: "2025-06-23T00:00:00Z",
  settlement_date: "2025-06-25T00:00:00Z",
  title: "Test Insert Game",
};

// 🔥 상태 값 검증
const validStatuses: GameStatus[] = [
  "DRAFT",
  "ACTIVE",
  "CLOSED",
  "SETTLED",
  "CANCELLED",
];
const validCategories: PredictionCategory[] = [
  "INVEST",
  "SPORTS",
  "ENTERTAINMENT",
  "POLITICS",
  "USER_PROPOSED",
];
const validTypes: PredictionType[] = ["BINARY", "WIN_DRAW_LOSE", "RANKING"];

console.log("✅ 모든 타입 테스트 통과!");
console.log("Valid game statuses:", validStatuses);
console.log("Valid categories:", validCategories);
console.log("Valid prediction types:", validTypes);

export { testGame, testGameInsert, validCategories, validStatuses, validTypes };
