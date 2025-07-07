import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-8">🔍</div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          페이지를 찾을 수 없습니다
        </h2>
        
        <p className="text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          PosMul 홈페이지로 돌아가서 원하시는 콘텐츠를 찾아보세요.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="block w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            🏠 홈페이지로 돌아가기
          </Link>
          
          <Link 
            href="/prediction"
            className="block w-full py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            🎯 예측 게임 둘러보기
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          문제가 지속되면 관리자에게 문의해주세요.
        </div>
      </div>
    </div>
  );
}