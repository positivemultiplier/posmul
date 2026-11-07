export interface UserPersonalizationSettings {
  avatarEmoji: string;
  sido: string;
  jobGroup: string;
  favoriteDomains: string[];
  favoriteLiveCategories: string[];
  defaultBetPmp: number;
  defaultConfidence: number;
  defaultLanding: string;
  notifications: {
    settlementAlert: boolean;
    liveRoomAlert: boolean;
    moneyWaveAlert: boolean;
    forumReplyAlert: boolean;
  };
  privacy: {
    profilePublic: boolean;
    rankingPublic: boolean;
    predictionHistoryPublic: boolean;
  };
}

export const DEFAULT_PERSONALIZATION: UserPersonalizationSettings = {
  avatarEmoji: "🎯",
  sido: "서울특별시",
  jobGroup: "IT·개발·AI",
  favoriteDomains: ["INVEST", "SPORTS", "ENTERTAINMENT"],
  favoriteLiveCategories: ["sports", "entertainment", "economy"],
  defaultBetPmp: 1000,
  defaultConfidence: 80,
  defaultLanding: "/dashboard",
  notifications: {
    settlementAlert: true,
    liveRoomAlert: true,
    moneyWaveAlert: true,
    forumReplyAlert: false,
  },
  privacy: {
    profilePublic: true,
    rankingPublic: true,
    predictionHistoryPublic: true,
  },
};

