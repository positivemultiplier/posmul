import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import Link from "next/link";
export default function PredictionInvestPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <FadeIn>
                    <h1 className="text-4xl font-bold mb-4">투자 예측 이관 안내</h1>
                    <p className="text-gray-300 mb-8">
                        투자 예측은 이제 <span className="font-semibold">소비 예측</span> 카테고리로 통합되었습니다.
                        <br />
                        아래에서 원하는 영역으로 이동해주세요. (강제 redirect는 하지 않습니다)
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <HoverLift>
                            <Link
                                href="/prediction/consume/money"
                                className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
                            >
                                <div className="text-2xl font-bold mb-2">MoneyConsume</div>
                                <div className="text-sm text-gray-300">Local League (지역 소비)</div>
                            </Link>
                        </HoverLift>

                        <HoverLift>
                            <Link
                                href="/prediction/consume/time"
                                className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
                            >
                                <div className="text-2xl font-bold mb-2">TimeConsume</div>
                                <div className="text-sm text-gray-300">Major League (광고/설문)</div>
                            </Link>
                        </HoverLift>

                        <HoverLift>
                            <Link
                                href="/prediction/consume/cloud"
                                className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
                            >
                                <div className="text-2xl font-bold mb-2">CloudConsume</div>
                                <div className="text-sm text-gray-300">Cloud Funding (펀딩)</div>
                            </Link>
                        </HoverLift>
                    </div>

                    <div className="mt-8">
                        <Link href="/prediction" className="text-sm text-gray-400 hover:text-gray-200">
                            ← 예측(Expect)으로 돌아가기
                        </Link>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
