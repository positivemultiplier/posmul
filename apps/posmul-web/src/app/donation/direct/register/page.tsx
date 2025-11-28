/**
 * 물품 등록 페이지
 * 
 * 직접 기부할 물품을 등록하는 페이지
 * 
 * @author PosMul Development Team
 * @since 2024-12
 */
import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { ItemRegisterClient } from "./client";

export default async function ItemRegisterPage() {
  const supabase = await createClient();

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser();

  // 로그인하지 않은 경우 리다이렉트
  if (!user) {
    redirect("/auth/login?redirect=/donation/direct/register");
  }

  return <ItemRegisterClient userId={user.id} />;
}
