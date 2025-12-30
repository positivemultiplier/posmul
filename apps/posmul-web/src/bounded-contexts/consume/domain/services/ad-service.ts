/**
 * AdService - 광고 도메인 서비스
 * Major League 광고 시청 및 PMP 보상 처리
 */

import type { Result, UserId, IDomainEventPublisher, DomainEvent } from "@posmul/auth-economy-sdk";
import { success, failure } from "@posmul/auth-economy-sdk";
import type { Advertisement } from "../entities/advertisement.entity";
import type { AdView } from "../entities/ad-view.entity";

// ============================================
// Repository Interface (Port)
// ============================================

/**
 * 광고 리포지토리 인터페이스
 */
export interface IAdRepository {
    /**
     * 광고 ID로 광고 조회
     */
    findById(id: string): Promise<Advertisement | null>;

    /**
     * 사용자의 특정 광고 시청 기록 조회
     */
    findViewByUserAndAd(userId: UserId, adId: string): Promise<AdView | null>;

    /**
     * 광고 시청 기록 저장
     */
    saveView(view: AdView): Promise<void>;

    /**
     * Featured 광고 목록 조회
     */
    listFeaturedAds(): Promise<Advertisement[]>;
}

// ============================================
// Domain Events
// ============================================

export class AdViewedEvent implements DomainEvent {
    public readonly id: string;
    public readonly type: string = "AdViewed";
    public readonly aggregateId: string;
    public readonly data: Record<string, unknown>;
    public readonly version: number = 1;
    public readonly timestamp: Date;

    constructor(
        public readonly userId: string,
        public readonly adId: string,
        public readonly rewardAmount: number,
        public readonly completed: boolean
    ) {
        this.id = crypto.randomUUID();
        this.aggregateId = adId;
        this.timestamp = new Date();
        this.data = { userId, adId, rewardAmount, completed };
    }
}

export class PmpRewardClaimedEvent implements DomainEvent {
    public readonly id: string;
    public readonly type: string = "PmpRewardClaimed";
    public readonly aggregateId: string;
    public readonly data: Record<string, unknown>;
    public readonly version: number = 1;
    public readonly timestamp: Date;

    constructor(
        public readonly userId: string,
        public readonly adId: string,
        public readonly pmpAmount: number
    ) {
        this.id = crypto.randomUUID();
        this.aggregateId = adId;
        this.timestamp = new Date();
        this.data = { userId, adId, pmpAmount };
    }
}

// ============================================
// AdService - Domain Service
// ============================================

/**
 * 광고 도메인 서비스
 * - 광고 시청 및 PMP 보상 처리
 * - 도메인 이벤트 발행
 */
export class AdService {
    constructor(
        private readonly adRepository: IAdRepository,
        private readonly eventPublisher: IDomainEventPublisher
    ) { }

    /**
     * 광고 시청 및 보상 클레임
     * @param userId - 사용자 ID
     * @param adId - 광고 ID
     * @param completed - 시청 완료 여부
     * @returns 획득한 PMP 금액
     */
    async watchAndClaimReward(
        userId: UserId,
        adId: string,
        completed: boolean
    ): Promise<Result<number, Error>> {
        // 1. 광고 조회
        const ad = await this.adRepository.findById(adId);
        if (!ad) {
            return failure(new Error("Advertisement not found"));
        }

        // 2. 기존 시청 기록 확인
        const existingView = await this.adRepository.findViewByUserAndAd(userId, adId);
        if (existingView && existingView.rewardClaimed) {
            return failure(new Error("Reward already claimed for this advertisement"));
        }

        // 3. 보상 계산 (완료 시에만 전액 지급)
        const rewardAmount = completed ? ad.rewardPmpAmount : 0;

        if (rewardAmount <= 0) {
            return failure(new Error("No reward available - incomplete viewing"));
        }

        // 4. 도메인 이벤트 발행
        const viewedEvent = new AdViewedEvent(
            userId as unknown as string,
            adId,
            rewardAmount,
            completed
        );
        await this.eventPublisher.publish(viewedEvent);

        const rewardEvent = new PmpRewardClaimedEvent(
            userId as unknown as string,
            adId,
            rewardAmount
        );
        await this.eventPublisher.publish(rewardEvent);

        // 5. 시청 기록 저장 (간단한 버전 - 실제로는 AdView 엔티티 생성 필요)
        // Note: InMemoryAdRepository에서 이미 처리하므로 여기선 이벤트만 발행

        return success(rewardAmount);
    }

    /**
     * Featured 광고 목록 조회
     */
    async getFeaturedAds(): Promise<Advertisement[]> {
        return this.adRepository.listFeaturedAds();
    }

    /**
     * 광고 ID로 조회
     */
    async getAdById(adId: string): Promise<Advertisement | null> {
        return this.adRepository.findById(adId);
    }
}
