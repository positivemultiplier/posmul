import Link from "next/link";
import { Sparkles } from "lucide-react";
import EconomyStats from "../bounded-contexts/economy/presentation/components/EconomyStats";
import {
  FadeInClient,
  ScaleInClient,
  HoverLiftClient,
  StaggerContainerClient
} from "./HomeClientComponents";

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] min-h-screen text-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <FadeInClient>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">AI 시대 예측 마켓 플랫폼</span>
            </div>
          </FadeInClient>

          <FadeInClient delay={0.1}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              PosMul
            </h1>
          </FadeInClient>

          <FadeInClient delay={0.2}>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl mx-auto">
              직접민주주의를 실현하는 예측 플랫폼
            </p>
          </FadeInClient>

          <FadeInClient delay={0.3}>
            <p className="text-base text-gray-400 max-w-3xl mx-auto mb-12">
              예측 게임과 지역 경제 연동을 통한 혁신적인 직접민주주의 실험 플랫폼입니다.
              PMP와 PMC를 활용하여 더 나은 사회를 만들어가세요.
            </p>
          </FadeInClient>

          <FadeInClient delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <HoverLiftClient>
                <Link
                  href="/prediction"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
                >
                  🎯 예측 게임 시작하기
                </Link>
              </HoverLiftClient>
              <HoverLiftClient>
                <Link
                  href="/investment"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  💰 투자 참여하기
                </Link>
              </HoverLiftClient>
            </div>
          </FadeInClient>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FadeInClient>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
              ✨ 주요 기능
            </h2>
            <p className="text-xl text-gray-400">
              PosMul이 제공하는 혁신적인 기능들을 경험해보세요
            </p>
          </div>
        </FadeInClient>

        <StaggerContainerClient
          features={[
            {
              icon: "TrendingUp",
              title: "예측 게임",
              description: "스포츠, 정치, 경제 등 다양한 분야의 예측 게임에 참여하고 PMP를 획득하세요.",
              badges: ["스포츠", "정치", "경제"],
              link: "/prediction",
              gradient: "from-blue-500/10 to-purple-500/10",
            },
            {
              icon: "Sparkles",
              title: "투자 시스템",
              description: "지역 경제와 연동된 투자 시스템으로 실제 가치를 창출하세요.",
              badges: ["PMP", "PMC", "지역경제"],
              link: "/investment",
              gradient: "from-green-500/10 to-emerald-500/10",
            },
            {
              icon: "MessageCircle",
              title: "포럼 & 토론",
              description: "직접민주주의의 핵심인 토론과 의견 교환을 통해 더 나은 결정을 내리세요.",
              badges: ["토론", "투표", "의견수렴"],
              link: "/forum",
              gradient: "from-purple-500/10 to-pink-500/10",
            },
          ]}
        />
      </section>

      {/* Economy Stats Section */}
      <section className="bg-black/20 backdrop-blur-sm py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInClient>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                📊 경제 현황
              </h2>
              <p className="text-xl text-gray-400">
                실시간 PosMul 경제 생태계 현황
              </p>
            </div>
          </FadeInClient>

          <ScaleInClient delay={0.2}>
            <EconomyStats />
          </ScaleInClient>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <FadeInClient>
          <div className="relative overflow-hidden rounded-3xl p-12 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 -z-10"></div>

            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              🌟 지금 시작하세요!
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              AI 시대 직접민주주의의 새로운 경험을 시작해보세요.
              당신의 참여가 더 나은 미래를 만들어갑니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <HoverLiftClient>
                <Link
                  href="/auth/signup"
                  className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-xl"
                >
                  회원가입하기
                </Link>
              </HoverLiftClient>
              <HoverLiftClient>
                <Link
                  href="/auth/login"
                  className="px-8 py-4 border-2 border-white/30 text-white text-lg font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  로그인하기
                </Link>
              </HoverLiftClient>
            </div>
          </div>
        </FadeInClient>
      </section>
    </div>
  );
}
