const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Returns the current hour start in KST as an ISO string in UTC (Z).
 *
 * Example:
 * - If now is 2025-12-25T11:37:00Z (20:37 KST)
 * - Returns 2025-12-25T11:00:00Z (20:00 KST)
 */
export const getKstHourStartIso = (now: Date = new Date()): string => {
  const utcMs = now.getTime();
  const kstMs = utcMs + KST_OFFSET_MS;

  // Treat the shifted epoch as UTC so we can use getUTC* to read KST wall-clock.
  const kstDate = new Date(kstMs);
  const year = kstDate.getUTCFullYear();
  const month = kstDate.getUTCMonth();
  const day = kstDate.getUTCDate();
  const hour = kstDate.getUTCHours();

  const truncatedKstWallClockAsUtcMs = Date.UTC(year, month, day, hour, 0, 0, 0);
  const hourStartUtcMs = truncatedKstWallClockAsUtcMs - KST_OFFSET_MS;

  return new Date(hourStartUtcMs).toISOString();
};
