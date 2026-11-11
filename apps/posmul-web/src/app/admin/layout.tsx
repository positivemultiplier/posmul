import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requireAdminSession } from "@/shared/lib/security/admin-auth";
import { AdminSidebarShell } from "./components/AdminSidebarShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await requireAdminSession();

  if (!auth.ok) {
    if (auth.reason === "UNAUTHORIZED") {
      redirect("/auth/login?redirect=/admin");
    }

    return (
      <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-zinc-950/90 p-7 text-center shadow-2xl space-y-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">
              403 Forbidden
            </p>
            <h1 className="text-xl font-black text-white">
              관리자 접근 권한이 없습니다
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              이 페이지는 PosMul 지정 관리자 계정만 접근할 수 있습니다.
              {auth.user?.email ? (
                <>
                  <br />
                  현재 로그인: <span className="text-zinc-200 font-semibold">{auth.user.email}</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Link
              href="/prediction"
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-100 transition"
            >
              예측 마켓으로 돌아가기
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-xs font-semibold text-zinc-300 transition"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdminSidebarShell>{children}</AdminSidebarShell>;
}
