import { Result, UserId, failure, success } from "@posmul/auth-economy-sdk";
import { AdService } from "../../domain/services/ad-service";

export interface WatchAdRequest {
  userId: string;
  adId: string;
  completed: boolean;
}

export type WatchAdResponse = number; // Reward Amount

export class WatchAdUseCase {
  constructor(private readonly adService: AdService) { }

  async execute(request: WatchAdRequest): Promise<Result<WatchAdResponse, Error>> {
    const { userId, adId, completed } = request;

    // Convert string userId to branded UserId using a helper if available, or cast for now
    // Assuming framework handles casting or we use 'createUserId' if exported
    // For MVP, casting:
    const userIdTyped = userId as unknown as UserId;

    return this.adService.watchAndClaimReward(userIdTyped, adId, completed);
  }
}
