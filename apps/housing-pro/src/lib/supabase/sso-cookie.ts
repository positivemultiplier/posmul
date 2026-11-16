export function resolveCrossSubdomainCookieDomain(hostOrHostname?: string | null): string | undefined {
  if (!hostOrHostname) return undefined;
  const hostname = hostOrHostname.split(":")[0].trim().toLowerCase();
  if (hostname === "posmul.com" || hostname.endsWith(".posmul.com")) {
    return ".posmul.com";
  }
  return undefined;
}

export function resolveSafeNextPath(rawNext?: string | null): string {
  const candidate = (rawNext || "/").trim();
  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    return candidate;
  }
  return "/";
}
