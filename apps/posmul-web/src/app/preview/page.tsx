/**
 * UI 컴포넌트 프리뷰 페이지
 *
 * Phase 1-4에서 구현한 컴포넌트들을 테스트할 수 있는 페이지입니다.
 * /preview 경로에서 접근 가능합니다.
 */
import { Metadata } from "next";

import ComponentPreviewClient from "./ComponentPreviewClient";

export const metadata: Metadata = {
    title: "UI 컴포넌트 프리뷰 | PosMul",
    description: "Phase 1-4 UI 컴포넌트 테스트 페이지",
};

export default function PreviewPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        🧪 UI 컴포넌트 프리뷰
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Phase 1-4에서 구현한 컴포넌트들을 테스트합니다.
                    </p>
                </header>

                <ComponentPreviewClient />
            </div>
        </div>
    );
}
