import type { User } from "@supabase/supabase-js";
import {
  assertAdminSession,
  blockInProduction,
  hasValidCronSecret,
  isAdminRoleValue,
  requireAdminApi,
  requireAdminSession,
  resolveAdminUser,
} from "../admin-auth";

const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockSchema = jest.fn(() => ({ from: mockFrom }));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

jest.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    schema: () => mockSchema(),
  },
}));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-123",
    email: "member@posmul.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

describe("admin-auth RBAC & security guards", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_EMAILS;
    delete process.env.VERCEL_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    mockMaybeSingle.mockResolvedValue({ data: { role: "user" }, error: null });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("isAdminRoleValue accepts only admin and super_admin", () => {
    expect(isAdminRoleValue("admin")).toBe(true);
    expect(isAdminRoleValue("super_admin")).toBe(true);
    expect(isAdminRoleValue("moderator")).toBe(false);
    expect(isAdminRoleValue("user")).toBe(false);
    expect(isAdminRoleValue(undefined)).toBe(false);
  });

  it("resolveAdminUser never trusts user_metadata role spoofing", async () => {
    const spoofedUser = makeUser({
      user_metadata: { role: "admin", is_admin: true },
      app_metadata: {},
    });

    const result = await resolveAdminUser(spoofedUser);
    expect(result).toEqual({ isAdmin: false, role: null, source: null });
  });

  it("resolveAdminUser authorizes app_metadata admin and DB profile admin", async () => {
    const appAdmin = makeUser({ app_metadata: { role: "admin" } });
    await expect(resolveAdminUser(appAdmin)).resolves.toEqual({
      isAdmin: true,
      role: "admin",
      source: "app_metadata",
    });

    const profileAdmin = makeUser({ app_metadata: {} });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { role: "super_admin" },
      error: null,
    });
    await expect(resolveAdminUser(profileAdmin)).resolves.toEqual({
      isAdmin: true,
      role: "super_admin",
      source: "profile",
    });
  });

  it("resolveAdminUser checks ADMIN_EMAILS only when email is confirmed", async () => {
    process.env.ADMIN_EMAILS = "boss@posmul.com";
    const unconfirmed = makeUser({
      email: "boss@posmul.com",
      email_confirmed_at: undefined,
      confirmed_at: undefined,
    });
    await expect(resolveAdminUser(unconfirmed)).resolves.toEqual({
      isAdmin: false,
      role: null,
      source: null,
    });

    const confirmed = makeUser({
      email: "BOSS@posmul.com",
      email_confirmed_at: "2026-01-01T00:00:00Z",
    });
    await expect(resolveAdminUser(confirmed)).resolves.toEqual({
      isAdmin: true,
      role: "admin",
      source: "env_email",
    });
  });

  it("requireAdminSession and assertAdminSession enforce auth and admin role", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(requireAdminSession()).resolves.toEqual({
      ok: false,
      reason: "UNAUTHORIZED",
      user: null,
    });

    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(assertAdminSession()).rejects.toThrow("UNAUTHORIZED");

    const normalUser = makeUser();
    mockGetUser.mockResolvedValueOnce({
      data: { user: normalUser },
      error: null,
    });
    await expect(assertAdminSession()).rejects.toThrow("FORBIDDEN");

    const adminUser = makeUser({ app_metadata: { role: "admin" } });
    mockGetUser.mockResolvedValueOnce({
      data: { user: adminUser },
      error: null,
    });
    await expect(assertAdminSession()).resolves.toEqual({
      user: adminUser,
      role: "admin",
    });
  });

  it("hasValidCronSecret fails closed when CRON_SECRET is unset", () => {
    const req = new Request("https://posmul.example/api/cron/feed-ingest", {
      headers: { authorization: "Bearer undefined" },
    });
    expect(hasValidCronSecret(req)).toBe(false);

    process.env.CRON_SECRET = "my-cron-secret";
    const badReq = new Request("https://posmul.example/api/cron/feed-ingest", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    expect(hasValidCronSecret(badReq)).toBe(false);

    const goodBearerReq = new Request(
      "https://posmul.example/api/cron/feed-ingest",
      {
        headers: { authorization: "Bearer my-cron-secret" },
      }
    );
    expect(hasValidCronSecret(goodBearerReq)).toBe(true);

    const goodQueryReq = new Request(
      "https://posmul.example/api/cron/feed-ingest?secret=my-cron-secret"
    );
    expect(hasValidCronSecret(goodQueryReq)).toBe(true);
    expect(hasValidCronSecret(goodQueryReq, false)).toBe(false);
  });

  it("requireAdminApi returns 401/403 for unauthenticated/non-admin and allows cron or admin", async () => {
    // 1. unauthenticated without cron secret
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const unauthRes = await requireAdminApi(
      new Request("https://posmul.example/api/admin/users")
    );
    expect(unauthRes.ok).toBe(false);
    if (!unauthRes.ok) expect(unauthRes.response?.status).toBe(401);

    // 2. authenticated non-admin
    mockGetUser.mockResolvedValueOnce({ data: { user: makeUser() }, error: null });
    const forbidRes = await requireAdminApi(
      new Request("https://posmul.example/api/admin/users")
    );
    expect(forbidRes.ok).toBe(false);
    if (!forbidRes.ok) expect(forbidRes.response?.status).toBe(403);

    // 3. valid CRON_SECRET when allowCronSecret is true
    process.env.CRON_SECRET = "cron-secret-123";
    const cronRes = await requireAdminApi(
      new Request("https://posmul.example/api/cron/prediction-settle", {
        headers: { authorization: "Bearer cron-secret-123" },
      }),
      { allowCronSecret: true }
    );
    expect(cronRes).toEqual({
      ok: true,
      authType: "cron",
      user: null,
      role: null,
    });

    // 4. CRON_SECRET ignored when allowCronSecret is false
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const disallowedCronRes = await requireAdminApi(
      new Request("https://posmul.example/api/admin/users", {
        headers: { authorization: "Bearer cron-secret-123" },
      }),
      { allowCronSecret: false }
    );
    expect(disallowedCronRes.ok).toBe(false);
    if (!disallowedCronRes.ok) expect(disallowedCronRes.response?.status).toBe(401);

    // 5. authenticated admin
    const adminUser = makeUser({ app_metadata: { role: "admin" } });
    mockGetUser.mockResolvedValueOnce({
      data: { user: adminUser },
      error: null,
    });
    const adminRes = await requireAdminApi(
      new Request("https://posmul.example/api/admin/users")
    );
    expect(adminRes).toEqual({
      ok: true,
      authType: "admin",
      user: adminUser,
      role: "admin",
    });
  });

  it("blockInProduction returns 404 in NODE_ENV=production or VERCEL_ENV=production", () => {
    expect(blockInProduction()).toBeNull();

    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const prodRes = blockInProduction();
    expect(prodRes).not.toBeNull();
    expect(prodRes?.status).toBe(404);

    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    process.env.VERCEL_ENV = "production";
    const vercelProdRes = blockInProduction();
    expect(vercelProdRes).not.toBeNull();
    expect(vercelProdRes?.status).toBe(404);
  });
});

