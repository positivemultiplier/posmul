"use server";

import { PaginatedResult, Result } from "@posmul/auth-economy-sdk";
import { createClient } from "@/lib/supabase/server";
import { CreateDonationRequest, DonationSearchRequest } from "../application/dto/donation.dto";

/**
 * Phase 0 보안 하드닝:
 * 클라이언트 전달 donorId / donorBalance 를 신뢰하던 레거시 MCP 기반 Server Action 비활성화.
 * 정식 기부 경로(/api/donation/donate 또는 donateToWishlist)를 사용해야 합니다.
 */
export async function createDonationAction(
  _donorId: string,
  _request: CreateDonationRequest,
  _donorBalance: number
): Promise<Result<unknown>> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: new Error("UNAUTHORIZED: 로그인이 필요합니다."),
    };
  }

  return {
    success: false,
    error: new Error("LEGACY_ACTION_DISABLED: 정식 기부 API(/api/donation/donate)를 사용해 주세요."),
  };
}

export async function getDonationAction(_id: string): Promise<Result<unknown>> {
  return {
    success: false,
    error: new Error("LEGACY_ACTION_DISABLED: 정식 기부 API(/api/donation)를 사용해 주세요."),
  };
}

export async function listDonationsAction(
  _request: DonationSearchRequest
): Promise<Result<PaginatedResult<unknown>>> {
  return {
    success: false,
    error: new Error("LEGACY_ACTION_DISABLED: 정식 기부 API(/api/donation)를 사용해 주세요."),
  };
}
