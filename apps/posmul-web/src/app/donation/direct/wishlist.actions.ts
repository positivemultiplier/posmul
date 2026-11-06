"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
 * 4. 위시리스트 후원 PMC 누적
 */
export async function donateToWishlist(requestId: string, amount: number) {
  try {
    const supabase = await createClient();

    // 현재 금액 조회
    const { data: current } = await supabase
      .schema("donation")
      .from("funding_wishlist_requests")
      .select("current_funded_amount")
      .eq("id", requestId)
      .single();

    const newAmount = (current?.current_funded_amount || 0) + amount;

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
      return { success: false, error: error.message };
    }

    revalidatePath("/donation/direct");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

