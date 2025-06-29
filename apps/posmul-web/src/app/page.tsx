import { Card } from "@posmul/shared-ui";
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          AI 시대 <span className="text-blue-600">직접민주주의</span> 플랫폼
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          예측 게임과 지역 경제 연동을 통해 시민이 직접 참여하는 새로운
          민주주의를 경험해보세요.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-lg bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
          >
            지금 시작하기
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-6 py-3 text-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500"
          >
            더 알아보기
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          주요 기능
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              예측 게임
            </h3>
            <p className="text-gray-600">
              다양한 사회적 이슈에 대한 예측에 참여하고, 정확도에 따라 포인트를
              획득하세요.
            </p>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-green-600 rounded"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Local League
            </h3>
            <p className="text-gray-600">
              지역 소상공인과의 거래를 통해 PMC 포인트를 적립하고 지역 경제에
              기여하세요.
            </p>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-purple-600 rounded"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Major League
            </h3>
            <p className="text-gray-600">
              기업 광고를 시청하고 참여하여 PMP 포인트를 획득하고 의견을
              제시하세요.
            </p>
          </Card>
        </div>
      </section>

      {/* Point System Section */}
      <section className="py-20 bg-gray-900 text-white rounded-2xl">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">포인트 시스템</h2>
          <p className="text-xl text-gray-300 mb-12">
            PMC와 PMP 두 가지 포인트로 다양한 활동에 참여하고 보상을 받으세요.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">PMC</h3>
              <p className="text-gray-300 mb-4">Posmul Coin</p>
              <ul className="text-left space-y-2 text-gray-300">
                <li>• Local League 거래 시 적립</li>
                <li>• 리뷰 작성 시 보너스</li>
                <li>• 월 구독자 특별 혜택</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-green-400 mb-4">PMP</h3>
              <p className="text-gray-300 mb-4">Posmul Point</p>
              <ul className="text-left space-y-2 text-gray-300">
                <li>• Major League 광고 시청</li>
                <li>• 설문조사 참여</li>
                <li>• 완전 시청 보너스</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          지금 바로 시작하세요
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          새로운 형태의 민주주의 참여를 경험해보세요.
        </p>
        <Link
          href="/auth/register"
          className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-lg px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
        >
          회원가입하기
        </Link>
      </section>
    </div>
  );
}
