import type { PredictionGameId } from "@posmul/auth-economy-sdk";

export interface PredictionGame {
  id: PredictionGameId;
  title: string;
  description: string;
  status: "PENDING" | "ACTIVE" | "ENDED" | "SETTLED" | "CANCELLED";
  // Add other fields that PredictionGameForm might need
}
