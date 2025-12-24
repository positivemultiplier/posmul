/**
 * Investment Page (Legacy)
 *
 * Investment 도메인은 Consume으로 명칭이 변경되었습니다.
 * 강제 redirect는 UX 혼란을 유발하므로, 안내 페이지로 유지합니다.
 *
 * @deprecated Use /consume instead
 * @author PosMul Development Team
 * @since 2024-12
 */
export default function InvestmentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-3xl font-bold">Investment (Legacy)</h1>
        <p className="mb-8 text-gray-300">
          기존 <span className="font-semibold">/invest</span> 경로는 이제
          <span className="font-semibold"> /consume</span>으로 통합되었습니다.
          자동 이동(redirect) 없이 아래 링크로 이동해주세요.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="/consume"
            className="rounded-lg bg-white/10 px-4 py-3 text-white hover:bg-white/15 transition"
          >
            /consume로 이동
          </a>
          <a
            href="/"
            className="rounded-lg bg-white/5 px-4 py-3 text-gray-200 hover:bg-white/10 transition"
          >
            홈으로 이동
          </a>
        </div>
      </div>
    </div>
  );
}
