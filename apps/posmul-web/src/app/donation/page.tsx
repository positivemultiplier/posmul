import { Suspense } from "react";
import Link from "next/link";
import { ShinyText } from "@/shared/ui/components/motion/ShinyText";
import { SpotlightCard } from "@/shared/ui/components/motion/SpotlightCard";
import { NumberTicker } from "@/shared/ui/components/motion/NumberTicker";
import { MotionDiv, fadeInVariants, staggerContainerVariants, slideUpVariants } from "@/shared/ui/components/motion/MotionComponents";
import { createClient } from "../../lib/supabase/server";

// --- Types ---
interface DonationStats {
  totalAmount: number;
  totalDonors: number;
  todaysDonationCount: number;
}

// --- Server Actions (Mock for now, will integrate later) ---
async function getDonationStats(): Promise<DonationStats> {
  // Simulate delay
  // await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    totalAmount: 124500000,
    totalDonors: 15420,
    todaysDonationCount: 142,
  };
}

// --- Components ---

function HeroSection({ stats }: { stats: DonationStats }) {
  return (
    <div className="relative py-20 px-4 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-200">오늘 {stats.todaysDonationCount}명이 참여했습니다</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            세상을 바꾸는 힘, <br />
            <ShinyText text="당신의 따뜻한 마음" speed={4} className="mt-2" />
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            PosMul과 함께 더 나은 미래를 만들어가세요. <br />
            투명한 기부 생태계가 당신의 선한 영향력을 증명합니다.
          </p>
        </MotionDiv>

        {/* Stats Grid */}
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-12"
        >
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="text-sm text-gray-400 mb-1">총 누적 기부금</div>
            <div className="text-4xl font-bold text-white flex items-center justify-center gap-1">
              <NumberTicker value={stats.totalAmount} />
              <span className="text-2xl text-purple-400">PMC</span>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="text-sm text-gray-400 mb-1">함께한 기부자</div>
            <div className="text-4xl font-bold text-white">
              <NumberTicker value={stats.totalDonors} />
              <span className="text-2xl text-gray-500 ml-1">명</span>
            </div>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
}

function DominionGateway() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">어디에 기부하시겠습니까?</h2>
      <MotionDiv
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <Link href="/donation/institute">
          <SpotlightCard className="h-full p-8 group cursor-pointer border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-colors">
            <div className="flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                🏛️
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">기부 단체 (Institutes)</h3>
              <p className="text-gray-400 flex-1 leading-relaxed">
                검증된 NGO와 비영리 단체의 캠페인에 직접 후원하세요.
                투명성 보고서를 통해 기부금 사용 내역을 확인할 수 있습니다.
              </p>
              <div className="mt-6 flex items-center text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                단체 찾아보기 →
              </div>
            </div>
          </SpotlightCard>
        </Link>

        <Link href="/donation/opinion-leader">
          <SpotlightCard className="h-full p-8 group cursor-pointer border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-colors">
            <div className="flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                🌟
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">오피니언 리더 (Leaders)</h3>
              <p className="text-gray-400 flex-1 leading-relaxed">
                내가 신뢰하는 인플루언서가 추천하는 캠페인에 동참하세요.
                리더의 영향력과 함께 선한 영향력을 확산할 수 있습니다.
              </p>
              <div className="mt-6 flex items-center text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                리더 찾아보기 →
              </div>
            </div>
          </SpotlightCard>
        </Link>
      </MotionDiv>
    </div>
  );
}

function LiveTickerMock() {
  return (
    <div className="bg-black/20 border-y border-white/5 py-3 overflow-hidden">
      <div className="flex whitespace-nowrap animate-marquee">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="inline-flex items-center mx-8 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            <span className="font-bold text-gray-200 mr-2">User{100 + i}</span>님이
            <span className="text-white font-medium mx-1">10,000 PMC</span>를
            <span className="text-gray-300 mx-1">환경재단</span>에 기부했습니다.
            <span className="text-xs text-gray-600 ml-2">{i}분 전</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DonationPage() {
  const stats = await getDonationStats();

  return (
    <main className="min-h-screen bg-gray-950 text-white selection:bg-purple-500/30">
      <HeroSection stats={stats} />
      <LiveTickerMock />
      <DominionGateway />

      {/* Footer Area / Additional Info */}
      <div className="py-20 text-center text-gray-600 text-sm">
        <p>PosMul Donation Platform &copy; 2025</p>
      </div>
    </main>
  );
}
