import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CharactersUniverseClient } from "./CharactersUniverseClient";

export const metadata: Metadata = {
  title: "포스멀 프렌즈 (PosMul Friends) | 세계관 & 캐릭터 도감",
  description:
    "PMP·MoneyWave·PMC·힐링룸을 잇는 PosMul 공식 7인 캐릭터 팀(웨이비, 올리, 온기, 모아, 아고, 범이, 루미)의 멀티뷰 도감과 감정 스티커를 만나보세요.",
};

export default function CharactersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#080a11] text-sm text-slate-400">
          포스멀 타운 친구들을 불러오는 중입니다...
        </div>
      }
    >
      <CharactersUniverseClient />
    </Suspense>
  );
}
