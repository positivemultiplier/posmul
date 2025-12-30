import { UserId } from "@posmul/auth-economy-sdk";
import { IAdRepository } from "../../domain/services/ad-service";
import { Advertisement } from "../../domain/entities/advertisement.entity";
import { AdView } from "../../domain/entities/ad-view.entity";

export class InMemoryAdRepository implements IAdRepository {
    private ads: Map<string, Advertisement> = new Map();
    private views: Map<string, AdView> = new Map(); // key: userId:adId

    constructor() {
        this.seed();
    }

    private seed() {
        // Seed some initial ads
        const ad1Result = Advertisement.create({
            campaignId: "camp-1",
            title: "[TECH] AI의 미래, Gemini",
            description: "Google DeepMind의 최신 AI 모델을 경험해보세요.",
            videoUrl: "https://videos.pexels.com/video-files/853870/853870-hz_1080_1920_25fps.mp4", // Mock URL
            thumbnailUrl: "/images/ad-thumbnails/tech_ai.jpg",
            durationSeconds: 15,
            rewardPmpAmount: 100,
            predictionTopicId: "pred-topic-ai-001"
        }, "ad-001");

        const ad2Result = Advertisement.create({
            campaignId: "camp-2",
            title: "[ESG] 지구를 지키는 텀블러",
            description: "플라스틱 없는 세상을 만듭니다.",
            videoUrl: "https://videos.pexels.com/video-files/4440846/4440846-uhd_2160_4096_25fps.mp4",
            thumbnailUrl: "/images/ad-thumbnails/esg_tumbler.jpg",
            durationSeconds: 10,
            rewardPmpAmount: 50,
        }, "ad-002");

        if (ad1Result.success) this.ads.set(ad1Result.data.id.toString(), ad1Result.data);
        if (ad2Result.success) this.ads.set(ad2Result.data.id.toString(), ad2Result.data);
    }

    async findById(id: string): Promise<Advertisement | null> {
        return this.ads.get(id) || null;
    }

    async findViewByUserAndAd(userId: UserId, adId: string): Promise<AdView | null> {
        const key = `${userId.toString()}:${adId}`;
        return this.views.get(key) || null;
    }

    async saveView(view: AdView): Promise<void> {
        // Access protected/private fields via 'any' casting for MVP OR provide public getters
        // AdView has public getters for userId and advertisementId? 
        // Yes, added getters in previous step.
        const key = `${view.userId.toString()}:${(view as any)._advertisementId.toString()}`;
        this.views.set(key, view);
    }

    async listFeaturedAds(): Promise<Advertisement[]> {
        return Array.from(this.ads.values());
    }
}
