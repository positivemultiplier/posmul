/**
 * Prediction-related shared types
 */

import type { PredictionGameId } from "./branded-types";

export interface PredictionGame {
  id: PredictionGameId;
  title: string;
  description: string;
  status: "PENDING" | "ACTIVE" | "ENDED" | "SETTLED" | "CANCELLED";
  // Add other fields that PredictionGameForm might need
}
