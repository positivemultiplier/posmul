"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  claimGuestStudyRecordsAction,
  getCurrentStudyAuthProfileAction,
  signOutStudyUserAction,
  type StudyAuthProfileDTO,
} from "@/app/actions/auth-profile.actions";
import { createClient } from "@/lib/supabase/client";

const GUEST_KEY_STORAGE = "housing_pro_client_key";

function getOrCreateLocalGuestKey(): string {
  if (typeof window === "undefined") return "demo-housing-guest";
  const existing = window.localStorage.getItem(GUEST_KEY_STORAGE);
  if (existing && !existing.startsWith("user:")) return existing;
  const generated = `hp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  window.localStorage.setItem(GUEST_KEY_STORAGE, generated);
  return generated;
}

interface StudyAuthContextValue {
  profile: StudyAuthProfileDTO;
  isLoading: boolean;
  isLoggedIn: boolean;
  userId: string | null;
  guestKey: string;
  effectiveOwnerKey: string;
  pmpBalance: number;
  pmcBalance: number;
  setLocalPmpBalance: (balance: number) => void;
  adjustLocalPmpBalance: (delta: number) => void;
  refreshProfile: () => Promise<StudyAuthProfileDTO>;
  signOut: () => Promise<void>;
}

const DEFAULT_PROFILE: StudyAuthProfileDTO = {
  authenticated: false,
  userId: null,
  ownerKey: null,
  email: null,
  displayName: "게스트 수험생",
  pmpBalance: 0,
  pmcBalance: 0,
  examDate: "2026-09-12",
  activeTrack: "app_only_69",
  totalFocusSeconds: 0,
  plannerState: {},
};

const StudyAuthContext = createContext<StudyAuthContextValue | null>(null);

export function StudyAuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StudyAuthProfileDTO>(DEFAULT_PROFILE);
  const [guestKey, setGuestKey] = useState<string>("demo-housing-guest");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claimedForUserId, setClaimedForUserId] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const next = await getCurrentStudyAuthProfileAction();
    setProfile(next);
    setIsLoading(false);
    return next;
  }, []);

  useEffect(() => {
    const localGuest = getOrCreateLocalGuestKey();
    setGuestKey(localGuest);
    void refreshProfile();

    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refreshProfile();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  // 로그인 감지 시 기존 브라우저 게스트 기록을 내 계정으로 1회 자동 이관
  useEffect(() => {
    if (!profile.authenticated || !profile.userId) return;
    if (!guestKey || guestKey === "demo-housing-guest" || guestKey.startsWith("user:")) return;
    if (claimedForUserId === profile.userId) return;

    setClaimedForUserId(profile.userId);
    void claimGuestStudyRecordsAction(guestKey).then((res) => {
      if (res.success && (res.migratedQuestions > 0 || res.migratedOptions > 0)) {
        window.dispatchEvent(new Event("housing-pro-curriculum-sync"));
      }
    });
  }, [profile.authenticated, profile.userId, guestKey, claimedForUserId]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    await signOutStudyUserAction();
    setProfile(DEFAULT_PROFILE);
    setClaimedForUserId(null);
  }, []);

  const setLocalPmpBalance = useCallback((balance: number) => {
    setProfile((prev) => ({ ...prev, pmpBalance: balance }));
  }, []);

  const adjustLocalPmpBalance = useCallback((delta: number) => {
    setProfile((prev) => ({ ...prev, pmpBalance: Math.max(0, prev.pmpBalance + delta) }));
  }, []);

  const effectiveOwnerKey =
    profile.authenticated && profile.ownerKey ? profile.ownerKey : guestKey;

  return (
    <StudyAuthContext.Provider
      value={{
        profile,
        isLoading,
        isLoggedIn: profile.authenticated,
        userId: profile.userId,
        guestKey,
        effectiveOwnerKey,
        pmpBalance: profile.pmpBalance,
        pmcBalance: profile.pmcBalance,
        setLocalPmpBalance,
        adjustLocalPmpBalance,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </StudyAuthContext.Provider>
  );
}

export function useStudyAuth(): StudyAuthContextValue {
  const ctx = useContext(StudyAuthContext);
  if (!ctx) {
    throw new Error("useStudyAuth must be used inside StudyAuthProvider");
  }
  return ctx;
}
