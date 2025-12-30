"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Eye, Award, Share2, Bookmark, CheckCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";

// Mock 기사 상세 데이터
const MOCK_ARTICLE = {
    id: "news-p001",
    title: "2025년 주요 법률 개정안 10가지",
    summary: "올해 시행되는 주요 법률 개정안을 정리했습니다.",
    category: "policy",
    categoryLabel: "정책·법률",
    source: "법률저널",
    author: "김정책 기자",
    publishedAt: "2024-12-30",
    readTime: 8,
    viewCount: 15600,
    pmpReward: 25,
    content: `
## 1. 노동법 개정 - 주 4.5일제 시범 도입

2025년 상반기부터 일부 공공기관에서 주 4.5일 근무제가 시범 도입됩니다.
금요일 오후 반일 근무를 통해 워라밸을 개선하고자 하는 취지입니다.

### 적용 대상
- 중앙행정기관 50개 부처
- 지방자치단체 시범 지역

---

## 2. 세법 개정 - 가상자산 과세 유예

가상자산 양도소득세 시행이 2027년으로 2년 추가 유예되었습니다.
투자자 보호 체계 구축을 위한 준비 기간이 필요하다는 것이 유예 사유입니다.

---

## 3. 환경법 개정 - 일회용품 규제 강화

카페, 음식점 등에서 일회용 컵 제공이 전면 금지됩니다.
다회용 컵 보증금제가 전국으로 확대 시행됩니다.

### 벌칙
- 1차 위반: 경고
- 2차 위반: 과태료 50만원
- 3차 이상: 과태료 200만원

---

## 4. 부동산법 개정 - 청약 제도 개편

무주택 실수요자 우선 공급 비율이 상향됩니다.
생애최초 특별공급 물량이 기존 25%에서 35%로 확대됩니다.

---

## 5. 개인정보보호법 개정 - AI 규제

AI 학습에 개인정보 활용 시 명시적 동의가 필요합니다.
AI 생성 콘텐츠 표시제가 의무화됩니다.
  `.trim(),
    quiz: [
        {
            id: 1,
            question: "주 4.5일제가 시범 도입되는 시기는?",
            options: ["2025년 상반기", "2025년 하반기", "2026년", "2024년"],
            answer: 0,
        },
        {
            id: 2,
            question: "가상자산 과세는 언제까지 유예되었나요?",
            options: ["2025년", "2026년", "2027년", "2028년"],
            answer: 2,
        },
    ],
    relatedArticles: [
        { id: "news-p002", title: "디지털 플랫폼 공정거래법 해설" },
        { id: "news-e001", title: "2025년 세제 개편안 핵심 정리" },
    ],
};

export default function NewsArticleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const category = params?.category as string;
    const articleId = params?.articleId as string;

    const [readProgress, setReadProgress] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuiz, setCurrentQuiz] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);

    const handleQuizAnswer = (optionIndex: number) => {
        setSelectedAnswer(optionIndex);
        if (optionIndex === MOCK_ARTICLE.quiz[currentQuiz].answer) {
            setCorrectCount((prev) => prev + 1);
        }
    };

    const handleNextQuiz = () => {
        if (currentQuiz < MOCK_ARTICLE.quiz.length - 1) {
            setCurrentQuiz((prev) => prev + 1);
            setSelectedAnswer(null);
        } else {
            setQuizCompleted(true);
        }
    };

    const earnedPmp = quizCompleted ? Math.round(MOCK_ARTICLE.pmpReward * (correctCount / MOCK_ARTICLE.quiz.length)) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="text-sm text-slate-500">
                                <Link href="/forum/news" className="hover:text-slate-300">News</Link>
                                <span className="mx-2">/</span>
                                <Link href={`/forum/news/${category}`} className="hover:text-slate-300">{MOCK_ARTICLE.categoryLabel}</Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsBookmarked(!isBookmarked)}
                                className={`p-2 rounded-full transition-colors ${isBookmarked ? "bg-yellow-500/20 text-yellow-400" : "hover:bg-white/10"}`}
                            >
                                <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
                            </button>
                            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Hero Image */}
                <div className="aspect-[21/9] bg-slate-800 rounded-2xl flex items-center justify-center text-6xl text-slate-600">
                    📰
                </div>

                {/* Article Header */}
                <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-sm">
                        {MOCK_ARTICLE.categoryLabel}
                    </span>
                    <h1 className="text-3xl font-bold text-white">{MOCK_ARTICLE.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{MOCK_ARTICLE.source}</span>
                        <span>·</span>
                        <span>{MOCK_ARTICLE.author}</span>
                        <span>·</span>
                        <span>{MOCK_ARTICLE.publishedAt}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {MOCK_ARTICLE.readTime}분 읽기
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {MOCK_ARTICLE.viewCount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Article Content */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 md:p-8">
                        <div className="prose prose-invert prose-lg max-w-none">
                            {MOCK_ARTICLE.content.split('\n').map((line, idx) => {
                                if (line.startsWith('## ')) {
                                    return <h2 key={idx} className="text-xl font-bold text-white mt-8 mb-4">{line.replace('## ', '')}</h2>;
                                }
                                if (line.startsWith('### ')) {
                                    return <h3 key={idx} className="text-lg font-semibold text-slate-300 mt-6 mb-2">{line.replace('### ', '')}</h3>;
                                }
                                if (line === '---') {
                                    return <hr key={idx} className="border-slate-700 my-6" />;
                                }
                                if (line.startsWith('- ')) {
                                    return <li key={idx} className="text-slate-300 ml-4">{line.replace('- ', '')}</li>;
                                }
                                if (line.trim()) {
                                    return <p key={idx} className="text-slate-300 leading-relaxed mb-4">{line}</p>;
                                }
                                return null;
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Quiz Section */}
                <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-700/50">
                    <CardContent className="p-6">
                        {!quizStarted ? (
                            <div className="text-center space-y-4">
                                <Award className="w-12 h-12 text-yellow-400 mx-auto" />
                                <h3 className="text-xl font-bold text-white">이해도 퀴즈</h3>
                                <p className="text-slate-400">퀴즈를 풀고 최대 <span className="text-yellow-400 font-bold">{MOCK_ARTICLE.pmpReward} PMP</span>를 획득하세요!</p>
                                <Button
                                    onClick={() => setQuizStarted(true)}
                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400"
                                >
                                    퀴즈 시작하기
                                </Button>
                            </div>
                        ) : !quizCompleted ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-400">
                                        문제 {currentQuiz + 1} / {MOCK_ARTICLE.quiz.length}
                                    </span>
                                    <span className="text-sm text-yellow-400">
                                        정답 {correctCount}개
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white">{MOCK_ARTICLE.quiz[currentQuiz].question}</h3>
                                <div className="space-y-2">
                                    {MOCK_ARTICLE.quiz[currentQuiz].options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuizAnswer(idx)}
                                            disabled={selectedAnswer !== null}
                                            className={`w-full p-4 rounded-lg text-left transition-all ${selectedAnswer === null
                                                    ? "bg-slate-800 hover:bg-slate-700 text-white"
                                                    : selectedAnswer === idx
                                                        ? idx === MOCK_ARTICLE.quiz[currentQuiz].answer
                                                            ? "bg-green-900/50 border-green-500 text-green-400"
                                                            : "bg-red-900/50 border-red-500 text-red-400"
                                                        : idx === MOCK_ARTICLE.quiz[currentQuiz].answer
                                                            ? "bg-green-900/50 text-green-400"
                                                            : "bg-slate-800/50 text-slate-500"
                                                } border ${selectedAnswer === idx ? "border-current" : "border-transparent"}`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                {selectedAnswer !== null && (
                                    <Button onClick={handleNextQuiz} className="w-full">
                                        {currentQuiz < MOCK_ARTICLE.quiz.length - 1 ? "다음 문제" : "결과 확인"}
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                                <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                                <h3 className="text-xl font-bold text-white">퀴즈 완료!</h3>
                                <p className="text-slate-300">
                                    {MOCK_ARTICLE.quiz.length}문제 중 <span className="text-yellow-400 font-bold">{correctCount}개</span> 정답
                                </p>
                                <div className="p-4 rounded-xl bg-yellow-900/30">
                                    <p className="text-sm text-slate-400">획득 PMP</p>
                                    <p className="text-3xl font-bold text-yellow-400">+{earnedPmp} PMP</p>
                                </div>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>

                {/* Related Articles */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">관련 기사</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {MOCK_ARTICLE.relatedArticles.map((related) => (
                            <Link key={related.id} href={`/forum/news/${category}/${related.id}`}>
                                <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-700/50 transition-all cursor-pointer">
                                    <CardContent className="p-4">
                                        <p className="text-white font-medium">{related.title}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Back Link */}
                <div className="text-center pt-4">
                    <Link href={`/forum/news/${category}`} className="text-sm text-slate-500 hover:text-slate-300">
                        ← 목록으로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}
