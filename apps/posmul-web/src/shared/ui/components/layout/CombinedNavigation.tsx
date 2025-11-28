"use client";

import { Navbar } from "./Navbar";
import { GeographicNavbar } from "./GeographicNavbar";

interface EconomicBalance {
  pmp: number;
  pmc: number;
}

interface FeatureUnlock {
  isUnlocked: boolean;
  progress?: number;
  requirements?: string[];
}

interface UnlockStatus {
  localInvestment: FeatureUnlock;
  localPrediction: FeatureUnlock;
  localDonation: FeatureUnlock;
  localForum: FeatureUnlock;
}

interface CombinedNavigationProps {
  economicBalance?: EconomicBalance;
  isAuthenticated?: boolean;
  unlockStatus?: UnlockStatus;
  selectedRegion?: string;
}

/**
 * 메인 네비게이션과 지역 네비게이션을 결합한 컴포넌트
 * 메인 Navbar 아래에 GeographicNavbar가 자동으로 표시됩니다.
 */
function CombinedNavigation({
  economicBalance = { pmp: 0, pmc: 0 },
  isAuthenticated = false,
  unlockStatus = {
    localInvestment: { isUnlocked: false, progress: 45, requirements: ["예측 게임 10회 이상", "PMP 1,000 이상"] },
    localPrediction: { isUnlocked: false, progress: 75, requirements: ["가입 후 7일 경과", "예측 정확도 60% 이상"] },
    localDonation: { isUnlocked: false, progress: 30, requirements: ["PMC 500 이상 보유", "투자 활동 3회 이상"] },
    localForum: { isUnlocked: false, progress: 85, requirements: ["커뮤니티 참여 5회 이상"] },
  },
  selectedRegion = 'seoul',
}: CombinedNavigationProps) {
  return (
    <>
      <Navbar
        economicBalance={economicBalance}
        isAuthenticated={isAuthenticated}
        unlockStatus={unlockStatus}
      />
      <GeographicNavbar />
    </>
  );
}

export { CombinedNavigation };
