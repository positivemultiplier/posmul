/**
 * Prediction-related shared types
 */
import type { PredictionGameId } from "./branded-types";
export interface PredictionGame {
    id: PredictionGameId;
    title: string;
    description: string;
    status: "PENDING" | "ACTIVE" | "ENDED" | "SETTLED" | "CANCELLED";
}
//# sourceMappingURL=prediction.d.ts.map