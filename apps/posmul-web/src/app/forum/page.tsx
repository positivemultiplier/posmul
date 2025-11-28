import { FadeIn } from "../../shared/ui/components/animations";
import { MessageSquare, TrendingUp, Lightbulb, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ForumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn>
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              💬 포럼
            </h1>
            <p className="text-xl text-gray-400">
              지식 공유와 협업의 공간
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">활성 토론</span>
              </div>
              <p className="text-2xl font-bold">42</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">아이디어</span>
              </div>
              <p className="text-2xl font-bold">127</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">참여자</span>
              </div>
              <p className="text-2xl font-bold">1,234</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">오늘 획득 PMP</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">8,500</p>
            </div>
          </div>

          {/* Main Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Debate */}
            <Link href="/forum/discussion">
              <div className="p-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl hover:border-blue-500/50 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">토론</h2>
                    <p className="text-sm text-gray-400">정책, 경제, 사회 이슈</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  다양한 주제에 대한 심층적인 토론과 의견 교환
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">활성 토론 42개</span>
                  <span className="text-blue-400 font-semibold flex items-center gap-2">
                    참여하기 <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>

            {/* Brainstorming */}
            <Link href="/forum/brainstorming">
              <div className="p-8 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-2xl hover:border-yellow-500/50 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Lightbulb className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">브레인스토밍</h2>
                    <p className="text-sm text-gray-400">혁신 아이디어 발굴</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  창의적인 아이디어 제안 및 협업 공간
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">진행 중인 아이디어 127개</span>
                  <span className="text-yellow-400 font-semibold flex items-center gap-2">
                    제안하기 <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Featured Topics */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">🔥 인기 토론</h2>
            <div className="space-y-4">
              {[
                {
                  title: "AI 시대의 직접민주주의는 가능한가?",
                  category: "정치",
                  participants: 156,
                  pmp: 1200
                },
                {
                  title: "지역 소상공인 지원책, 어떻게 개선할까?",
                  category: "경제",
                  participants: 89,
                  pmp: 800
                },
                {
                  title: "플랫폼 경제의 미래 전망",
                  category: "경제",
                  participants: 124,
                  pmp: 950
                }
              ].map((topic, index) => (
                <div
                  key={index}
                  className="p-6 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold mb-2">{topic.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                          {topic.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {topic.participants}명 참여
                        </span>
                        <span className="flex items-center gap-1 text-yellow-400">
                          <TrendingUp className="w-4 h-4" />
                          +{topic.pmp} PMP
                        </span>
                      </div>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300 transition-colors">
                      참여하기 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to Earn PMP */}
          <div className="p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6">💰 PMP 획득 방법</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  토론 참여
                </h3>
                <p className="text-sm text-gray-400">건설적인 의견 제시 시 최대 100 PMP</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  아이디어 제안
                </h3>
                <p className="text-sm text-gray-400">우수 아이디어 채택 시 최대 500 PMP</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-400" />
                  커뮤니티 활동
                </h3>
                <p className="text-sm text-gray-400">매일 접속 및 활동 시 최대 50 PMP</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
