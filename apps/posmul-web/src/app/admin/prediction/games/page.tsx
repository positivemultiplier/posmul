import React from "react";
import Link from "next/link";
import { ExternalLink, PlusCircle, Scale, ShieldCheck } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  AdminBadge,
  AdminCard,
  AdminCardContent,
  AdminCardDescription,
  AdminCardHeader,
  AdminCardTitle,
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from "../../components/shadcn-admin-ui";

export const revalidate = 0;

export default async function GamesListPage() {
  const { data: games } = await supabaseAdmin
    .schema("prediction")
    .from("prediction_games")
    .select(
      "game_id, slug, title, category, subcategory, status, data_source, external_id, settlement_type, registration_end, settlement_date, min_bet_amount, max_bet_amount, created_at"
    )
    .in("status", ["ACTIVE", "SETTLED", "CLOSED"])
    .order("created_at", { ascending: false })
    .limit(100);

  const allGames = games || [];
  const activeGames = allGames.filter((g) => g.status === "ACTIVE");
  const settledGames = allGames.filter((g) => g.status === "SETTLED");

  return (
    <div className="space-y-6">
      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            🎮 전체 예측 게임 마스터 테이블
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Supabase prediction.prediction_games 실시간 DB 연동 · 총 {allGames.length}개 등록됨
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/prediction/settlement"
            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>정산 센터</span>
          </Link>
          <Link
            href="/admin/prediction/games/create"
            className="px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>신규 예측 생성</span>
          </Link>
        </div>
      </div>

      {/* 1. 진행 중인 활성 게임 테이블 */}
      <AdminCard>
        <AdminCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <AdminCardTitle className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>진행 중인 예측 마켓 ({activeGames.length}개)</span>
              </AdminCardTitle>
              <AdminCardDescription>
                현재 유저들이 PMP로 베팅 참여 중인 공식 예측 게임 목록
              </AdminCardDescription>
            </div>
            <AdminBadge variant="success">ACTIVE</AdminBadge>
          </div>
        </AdminCardHeader>
        <AdminCardContent>
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>카테고리</AdminTableHead>
                <AdminTableHead>게임 제목 & 슬러그</AdminTableHead>
                <AdminTableHead>공인 데이터 오라클</AdminTableHead>
                <AdminTableHead>베팅 범위</AdminTableHead>
                <AdminTableHead>마감 시각</AdminTableHead>
                <AdminTableHead className="text-right">액션</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {activeGames.map((game) => (
                <AdminTableRow key={game.game_id}>
                  <AdminTableCell>
                    <AdminBadge variant="secondary">{game.category}</AdminBadge>
                    {game.subcategory && (
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        {game.subcategory}
                      </div>
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="font-bold text-white max-w-md line-clamp-1">
                      {game.title}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      /{game.slug || game.game_id}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant="info">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{game.data_source || "manual"}</span>
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-xs text-zinc-300">
                    {(game.min_bet_amount || 100).toLocaleString()} ~{" "}
                    {(game.max_bet_amount || 50000).toLocaleString()} PMP
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-xs text-zinc-400">
                    {game.registration_end
                      ? new Date(game.registration_end).toLocaleDateString("ko-KR")
                      : "-"}
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/prediction/${game.slug || game.game_id}`}
                        target="_blank"
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <span>마켓 열기</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Link
                        href="/admin/prediction/settlement"
                        className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold"
                      >
                        정산
                      </Link>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </AdminCardContent>
      </AdminCard>

      {/* 2. 정산 완료된 게임 테이블 */}
      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle>
            🏆 정산 완료된 게임 ({settledGames.length}개)
          </AdminCardTitle>
          <AdminCardDescription>
            오라클 또는 운영자 판정을 통해 승자에게 PMC 상금 배분이 완료된 게임
          </AdminCardDescription>
        </AdminCardHeader>
        <AdminCardContent>
          {settledGames.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              아직 정산 완료된 게임이 없습니다.
            </div>
          ) : (
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>카테고리</AdminTableHead>
                  <AdminTableHead>게임 제목</AdminTableHead>
                  <AdminTableHead>데이터 소스</AdminTableHead>
                  <AdminTableHead>정산일</AdminTableHead>
                  <AdminTableHead className="text-right">상세</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {settledGames.map((game) => (
                  <AdminTableRow key={game.game_id}>
                    <AdminTableCell>
                      <AdminBadge variant="outline">{game.category}</AdminBadge>
                    </AdminTableCell>
                    <AdminTableCell className="font-bold text-zinc-300">
                      {game.title}
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminBadge variant="secondary">
                        {game.data_source || "manual"}
                      </AdminBadge>
                    </AdminTableCell>
                    <AdminTableCell className="font-mono text-xs text-zinc-400">
                      {game.settlement_date
                        ? new Date(game.settlement_date).toLocaleDateString("ko-KR")
                        : "-"}
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <Link
                        href={`/prediction/${game.slug || game.game_id}`}
                        target="_blank"
                        className="text-sky-400 hover:underline text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <span>결과 보기</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          )}
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
