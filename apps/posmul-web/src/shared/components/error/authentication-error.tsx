/**
 * 인증 에러 컴포넌트
 */
export function AuthenticationError({ message }: { message?: string }) {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">인증 오류</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{message || '로그인이 필요하거나 세션이 만료되었습니다.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 비즈니스 로직 에러 컴포넌트
 */
export function BusinessLogicError({ message }: { message?: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">처리 오류</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message || '요청을 처리하는 중 오류가 발생했습니다.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 권한 에러 컴포넌트
 */
export function ForbiddenError({ message }: { message?: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">접근 권한 없음</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message || '이 작업을 수행할 권한이 없습니다.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 네트워크 에러 컴포넌트
 */
export function NetworkError({ message }: { message?: string }) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">연결 오류</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>{message || '네트워크 연결을 확인해주세요.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
