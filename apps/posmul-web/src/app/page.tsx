import { Card, Badge } from "../shared/ui";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            🚀 <span className="text-blue-600">PosMul</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 mb-4">
            AI 시대 직접민주주의 플랫폼
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
            예측 게임과 지역 경제 연동을 통한 혁신적인 직접민주주의 실험 플랫폼입니다.
            PMP와 PMC를 활용하여 더 나은 사회를 만들어가세요.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/prediction" 
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              🎯 예측 게임 시작하기
            </Link>
            <Link 
              href="/investment" 
              className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              💰 투자 참여하기
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ✨ 주요 기능
          </h2>
          <p className="text-xl text-gray-600">
            PosMul이 제공하는 혁신적인 기능들을 경험해보세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 예측 게임 */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-6xl mb-6 text-center">🎯</div>
            <h3 className="text-2xl font-bold mb-4 text-center">예측 게임</h3>
            <p className="text-gray-600 mb-6 text-center">
              스포츠, 정치, 경제 등 다양한 분야의 예측 게임에 참여하고 PMP를 획득하세요.
            </p>
            <div className="flex justify-center gap-2 mb-4">
              <Badge variant="secondary">스포츠</Badge>
              <Badge variant="secondary">정치</Badge>
              <Badge variant="secondary">경제</Badge>
            </div>
            <Link 
              href="/prediction"
              className="block w-full text-center py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              게임 둘러보기 →
            </Link>
          </Card>

          {/* 투자 시스템 */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-6xl mb-6 text-center">💰</div>
            <h3 className="text-2xl font-bold mb-4 text-center">투자 시스템</h3>
            <p className="text-gray-600 mb-6 text-center">
              지역 경제와 연동된 투자 시스템으로 실제 가치를 창출하세요.
            </p>
            <div className="flex justify-center gap-2 mb-4">
              <Badge variant="secondary">PMP</Badge>
              <Badge variant="secondary">PMC</Badge>
              <Badge variant="secondary">지역경제</Badge>
            </div>
            <Link 
              href="/investment"
              className="block w-full text-center py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              투자 시작하기 →
            </Link>
          </Card>

          {/* 포럼 & 토론 */}
          <Card className="p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-6xl mb-6 text-center">💬</div>
            <h3 className="text-2xl font-bold mb-4 text-center">포럼 & 토론</h3>
            <p className="text-gray-600 mb-6 text-center">
              직접민주주의의 핵심인 토론과 의견 교환을 통해 더 나은 결정을 내리세요.
            </p>
            <div className="flex justify-center gap-2 mb-4">
              <Badge variant="secondary">토론</Badge>
              <Badge variant="secondary">투표</Badge>
              <Badge variant="secondary">의견수렴</Badge>
            </div>
            <Link 
              href="/forum"
              className="block w-full text-center py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              포럼 참여하기 →
            </Link>
          </Card>
        </div>
      </section>

      {/* Economy Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              📊 경제 현황
            </h2>
            <p className="text-xl text-gray-600">
              실시간 PosMul 경제 생태계 현황
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">12,500</div>
              <div className="text-gray-600">총 PMP 발행량</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">8,750</div>
              <div className="text-gray-600">총 PMC 보유량</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">247</div>
              <div className="text-gray-600">활성 예측 게임</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">1,523</div>
              <div className="text-gray-600">참여 사용자</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            🌟 지금 시작하세요!
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            AI 시대 직접민주주의의 새로운 경험을 시작해보세요.
            당신의 참여가 더 나은 미래를 만들어갑니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup"
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              회원가입하기
            </Link>
            <Link 
              href="/auth/login"
              className="px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              로그인하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}