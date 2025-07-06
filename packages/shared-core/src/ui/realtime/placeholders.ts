import * as React from "react";

// Temporary placeholders for realtime APIs.
// These will be replaced with full implementations during Realtime module migration.

export const useRealtimeConnection = () => {
  if (process.env.NODE_ENV === "development") {
    console.warn("useRealtimeConnection placeholder invoked");
  }
  return null;
};

// Placeholder data types
type PlaceholderRecord = Record<string, unknown>;

export interface RealtimeEconomicData extends PlaceholderRecord {}
export interface RealtimeMarketData extends PlaceholderRecord {}
export interface RealtimeMoneyWave extends PlaceholderRecord {}
export interface RealtimePredictionGame extends PlaceholderRecord {}

export const useRealtimeDataStore = () => ({
  // dummy store functions
  getState: () => ({}),
  subscribe: () => () => {},
});

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return children as React.ReactElement;
};

export interface RealtimeNotification extends PlaceholderRecord {}

export const useRealtimeNotifications = () => ({
  notifications: [] as RealtimeNotification[],
  unreadCount: 0,
  markNotificationRead: () => {},
});
