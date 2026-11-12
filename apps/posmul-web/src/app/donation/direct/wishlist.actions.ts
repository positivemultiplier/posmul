"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  deductPmcForDonation,
  recordDonationTransaction,
  rollbackPmcForDonation,
} from "@/bounded-contexts/donation/infrastructure/pmc-donation-ledger";

export interface WishlistSubmissionData {
  projectId: string;
  facilityName: string;
  facilityType: string;
  regionCity: string;
  regionDistrict: string;
  contactPerson: string;
  contactPhone: string;
  businessLicenseNumber?: string;
  neededQuantity: number;
  story: string;
}

/**
 * 1. 복지시설의 K-위시리스트 물품 신청 등록
 */
export async function submitWishlistRequest(data: WishlistSubmissionData) {
  try {
    const supabase = await createClient();

    const { data: inserted, error } = await supabase
      .schema("donation")
      .from("funding_wishlist_requests")
      .insert({
        project_id: data.projectId,
        facility_name: data.facilityName,
        facility_type: data.facilityType,
        region_city: data.regionCity,
        region_district: data.regionDistrict,
        contact_person: data.contactPerson,
        contact_phone: data.contactPhone,
        business_license_number: data.businessLicenseNumber || "검증 심사 중",
        needed_quantity: data.neededQuantity,
        story: data.story,
        status: "pending",
        current_funded_amount: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("submitWishlistRequest DB Error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/donation/direct");
    return { success: true, data: inserted };
  } catch (err: any) {
    console.error("submitWishlistRequest Exception:", err);
    return { success: false, error: err.message || "서버 처리 중 오류가 발생했습니다." };
  }
}

/**
 * 2. 관리자: 대기 중인 위시리스트 신청 승인 처리 (Verified)
 */
export async function approveWishlistRequest(requestId: string, adminNotes?: string) {
  try {
    const supabase = await createClient();

    const { data: updated, error } = await supabase
      .schema("donation")
      .from("funding_wishlist_requests")
      .update({
        status: "approved",
        verified_at: new Date().toISOString(),
        admin_notes: adminNotes || "고유번호증 및 복지시설 인가 서류 100% 검증 완료",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error("approveWishlistRequest DB Error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/donation/direct");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 3. 위시리스트 상태별 목록 조회 (pending / approved)
 */
export async function getWishlistRequests(status?: "pending" | "approved" | "rejected") {
  try {
    const supabase = await createClient();

    let query = supabase
      .schema("donation")
      .from("funding_wishlist_requests")
      .select(`
        *,
        project:project_id (
          id,
          title,
          product_name,
          manufacturer,
          unit_price
        )
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("getWishlistRequests Error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("getWishlistRequests Exception:", err);
    return [];
  }
}

/**
 * 4. 위시리스트 후원 PMC 차감 및 누적
 */
export async function donateToWishlist(requestId: string, amount: number) {
  try {
    const pmcAmount = Number(amount);
    if (!Number.isFinite(pmcAmount) || pmcAmount <= 0) {
      return { success: false, error: "유효한 기부 금액이 필요합니다." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const { data: current, error: reqError } = await supabase
      .schema("donation")
      .from("funding_wishlist_requests")
      .select("current_funded_amount, facility_name")
      .eq("id", requestId)
      .single();

    if (reqError || !current) {
      return { success: false, error: "후원 대상 위시리스트를 찾을 수 없습니다." };
    }

    const deductResult = await deductPmcForDonation(supabase, user.id, pmcAmount);
    if (deductResult.ok === false) {
      return { success: false, error: deductResult.error };
    }

    const newAmount = (Number(current.current_funded_amount) || 0) + pmcAmount;
    const { data: updated, error } = await supabase
      .schema("donation")
      .from("funding_wishlist_requests")
      .update({
        current_funded_amount: newAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      await rollbackPmcForDonation(supabase, user.id, deductResult.previousBalance);
      return { success: false, error: error.message };
    }

    await recordDonationTransaction({
      supabase,
      userId: user.id,
      pmcAmount,
      description: `K-물품 위시리스트 후원: ${current.facility_name || "복지시설"}`,
      metadata: {
        source: "WISHLIST_DONATION",
        wishlist_request_id: requestId,
        facility_name: current.facility_name,
      },
    });

    revalidatePath("/donation/direct");
    return { success: true, data: updated, newBalance: deductResult.newBalance };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "기부 처리 중 오류가 발생했습니다.",
    };
  }
}

