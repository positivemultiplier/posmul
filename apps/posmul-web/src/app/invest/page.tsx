/**
 * Investment Page - Redirect to Consume
 *
 * 이 페이지는 /consume으로 리다이렉트됩니다.
 * Investment 도메인은 Consume으로 명칭이 변경되었습니다.
 *
 * @deprecated Use /consume instead
 * @author PosMul Development Team
 * @since 2024-12
 */
import { redirect } from "next/navigation";

export default function InvestmentPage() {
  redirect("/consume");
}
