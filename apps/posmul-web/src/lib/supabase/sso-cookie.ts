export function resolveCrossSubdomainCookieDomain(hostOrHostname?: string | null): string | undefined {
  if (!hostOrHostname) return undefined;
  const hostname = hostOrHostname.split(":")[0].trim().toLowerCase();
  if (hostname === "posmul.com" || hostname.endsWith(".posmul.com")) {
    return ".posmul.com";
  }
  return undefined;
}

export function resolveTrustedRedirectUrl(redirectOrigin: string, rawNext?: string | null): string {
  const candidate = (rawNext || "/").trim();
  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    return `${redirectOrigin}${candidate}`;
  }
  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();
    const isTrustedPosmul = host === "posmul.com" || host.endsWith(".posmul.com");
    const isLocalDev = process.env.NODE_ENV === "development" && (host === "localhost" || host === "127.0.0.1");
    if (isTrustedPosmul || isLocalDev) {
      return parsed.toString();
    }
  } catch {
    // fallback below
  }
  return `${redirectOrigin}/`;
}
