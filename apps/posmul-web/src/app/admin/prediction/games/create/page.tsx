/**
 * 새 예측 게임 수동 생성 폼
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const categories = [
    { value: "economy", label: "📈 경제" },
    { value: "sports", label: "⚽ 스포츠" },
    { value: "entertainment", label: "🎬 엔터테인먼트" },
    { value: "politics", label: "🗳️ 정치" },
    { value: "technology", label: "💻 기술" },
];

const predictionTypes = [
    { value: "binary", label: "이진형 (Yes/No)" },
    { value: "wdl", label: "승무패" },
    { value: "ranking", label: "순위 예측" },
];

export default function CreateGamePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "economy",
        predictionType: "binary",
        option1Label: "Yes",
        option2Label: "No",
        option3Label: "",
        startTime: "",
        endTime: "",
        minimumStake: 1000,
        maximumStake: 50000,
        maxParticipants: 1000,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // TODO: 실제 API 호출
            console.log("Creating game:", formData);

            // 임시: 성공 시뮬레이션
            await new Promise((resolve) => setTimeout(resolve, 1000));

            alert("게임이 생성되었습니다!");
            router.push("/admin/prediction/games");
        } catch (error) {
            console.error("Error creating game:", error);
            alert("게임 생성에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/prediction" className="text-gray-500 hover:text-gray-700">
                            ← 돌아가기
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">새 예측 게임 생성</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
                    {/* 기본 정보 */}
                    <section className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                            📝 기본 정보
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    게임 제목 *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="예: 오늘 코스피 상승 or 하락?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    설명
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="게임에 대한 설명을 입력하세요."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        카테고리 *
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        예측 유형 *
                                    </label>
                                    <select
                                        name="predictionType"
                                        value={formData.predictionType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {predictionTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 선택지 */}
                    <section className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                            🎯 선택지
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        옵션 1 *
                                    </label>
                                    <input
                                        type="text"
                                        name="option1Label"
                                        value={formData.option1Label}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        옵션 2 *
                                    </label>
                                    <input
                                        type="text"
                                        name="option2Label"
                                        value={formData.option2Label}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            {formData.predictionType === "wdl" && (
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        옵션 3 (무승부)
                                    </label>
                                    <input
                                        type="text"
                                        name="option3Label"
                                        value={formData.option3Label}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="무승부"
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 시간 설정 */}
                    <section className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                            ⏰ 시간 설정
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    시작 시간 *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    종료 시간 *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 베팅 설정 */}
                    <section className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">
                            💰 베팅 설정
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    최소 스테이크 (PMP)
                                </label>
                                <input
                                    type="number"
                                    name="minimumStake"
                                    value={formData.minimumStake}
                                    onChange={handleChange}
                                    min={100}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    최대 스테이크 (PMP)
                                </label>
                                <input
                                    type="number"
                                    name="maximumStake"
                                    value={formData.maximumStake}
                                    onChange={handleChange}
                                    min={1000}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    최대 참여자
                                </label>
                                <input
                                    type="number"
                                    name="maxParticipants"
                                    value={formData.maxParticipants}
                                    onChange={handleChange}
                                    min={10}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 제출 버튼 */}
                    <div className="flex justify-end gap-4">
                        <Link
                            href="/admin/prediction"
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            취소
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {isSubmitting ? "생성 중..." : "게임 생성"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
