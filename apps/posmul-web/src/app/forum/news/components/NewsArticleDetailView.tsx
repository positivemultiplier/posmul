"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  MessageSquare,
  Share2,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/shared/ui/components/base/Card";
import { Button } from "@/shared/ui/components/base";
import {
  getNewsCategoryMeta,
  NewsArticleDetail,
} from "@/bounded-contexts/forum/domain/value-objects/news-article.types";
import type { QuizSubmissionResult } from "@/bounded-contexts/forum/infrastructure/repositories/supabase-news.repository";

interface DetailApiResponse {
  success: boolean;
  data?: {
    article: NewsArticleDetail;
    isAuthenticated: boolean;
  };
}

interface QuizApiResponse {
  success: boolean;
  data?: QuizSubmissionResult;
  error?: { code: string; message: string };
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-400 hover:underline font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function ArticleMarkdownBody({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-slate-300 leading-relaxed">
      {content.split("\n").map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return null;
        if (line.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-xl font-bold text-white pt-4 pb-1 border-b border-slate-800/80">
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-base font-bold text-emerald-300 pt-3">
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line === "---") {
          return <hr key={idx} className="border-slate-800 my-5" />;
        }
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={idx}
              className="p-3.5 rounded-xl bg-slate-900/90 border-l-4 border-emerald-500/60 text-xs text-slate-300"
            >
              {renderInlineMarkdown(line.replace(/^>\s*/, ""))}
            </blockquote>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <li key={idx} className="ml-5 list-disc text-slate-300 text-sm md:text-base">
              {renderInlineMarkdown(line.slice(2))}
            </li>
          );
        }
        return (
          <p key={idx} className="text-sm md:text-base text-slate-300">
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

export function NewsArticleDetailView({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/forum/news/${articleId}`, { cache: "no-store" });
        const json = (await res.json()) as DetailApiResponse;
        if (active && json.success && json.data) {
          setArticle(json.data.article);
          setIsAuthenticated(json.data.isAuthenticated);
        }
      } catch (err) {
        console.error("[NewsArticleDetailView] load error:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [articleId]);

  const handleSelectOption = (qIndex: number, optionIndex: number) => {
    if (quizResult || article?.quizCompleted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
    setQuizError(null);
  };

  const handleSubmitQuiz = async () => {
    if (!article) return;
    const answers = article.quiz.map((_, idx) => selectedAnswers[idx] ?? -1);
    if (answers.some((a) => a < 0)) {
      setQuizError("모든 문항의 답을 선택한 뒤 제출해 주세요.");
      return;
    }

    setIsSubmittingQuiz(true);
    setQuizError(null);
    try {
      const res = await fetch(`/api/forum/news/${article.id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const json = (await res.json()) as QuizApiResponse;
      if (json.success && json.data) {
        setQuizResult(json.data);
      } else {
        setQuizError(json.error?.message || "퀴즈 제출에 실패했습니다.");
      }
    } catch {
      setQuizError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // clipboard fallback ignored
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090b12] text-slate-200 p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-10 w-48 bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-900 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#090b12] text-slate-200 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-lg font-bold text-white">기사를 찾을 수 없습니다.</p>
          <Link href="/forum/news" className="text-sm text-emerald-400 hover:underline">
            ← 뉴스룸 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const catMeta = getNewsCategoryMeta(article.category);
  const publishedDateStr = new Date(article.publishedAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[#090b12] text-slate-200">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Link href="/forum/news" className="hover:text-white">
              News
            </Link>
            <span>/</span>
            <Link href={`/forum/news?category=${article.category}`} className="hover:text-white">
              {catMeta.shortLabel}
            </Link>
          </div>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs flex items-center gap-1.5 text-slate-300"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copiedShare ? "링크 복사됨" : "공유"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 헤더 메타 */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${catMeta.badgeClass}`}>
              {catMeta.label}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {article.regionName}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              PosMul AI 데스크 ({article.aiModel})
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pb-4 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <span>출처: <strong className="text-slate-200">{article.sourceName}</strong></span>
              <span>·</span>
              <span>{publishedDateStr}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {article.readTimeMinutes}분 읽기
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {article.viewCount.toLocaleString()}
              </span>
            </div>

            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-semibold flex items-center gap-1"
              >
                원문 자료 보기 <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* 3줄 핵심 요약 카드 */}
        {article.threeLineSummary.length > 0 && (
          <Card className="bg-emerald-950/20 border-emerald-500/30">
            <CardContent className="p-5 space-y-2">
              <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                AI 데스크 3줄 핵심 요약
              </div>
              <ul className="space-y-1.5 text-sm text-slate-200">
                {article.threeLineSummary.map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">{i + 1}.</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 본문 */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-6 md:p-8">
            <ArticleMarkdownBody content={article.content} />
          </CardContent>
        </Card>

        {/* 팩트체크 투명성 배지 */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200">AI 팩트체크 메모: </span>
            {article.factCheckNote}
          </div>
        </div>

        {/* 이해도 퀴즈 & 실제 PMP 적립 */}
        {article.quiz.length > 0 && (
          <Card className="bg-gradient-to-br from-amber-950/25 via-slate-900 to-slate-900 border-amber-500/30">
            <CardContent className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">이해도 확인 퀴즈</h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  최대 +{article.pmpReward} PMP 실지급
                </span>
              </div>

              {article.quizCompleted && !quizResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      이미 이 기사의 퀴즈를 완료하셨습니다.
                    </div>
                    <span className="text-amber-300 font-bold text-sm">
                      +{article.quizAwardedPmp} PMP 지급됨
                    </span>
                  </div>

                  {article.solvedQuizDetails?.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-sm">
                      <p className="font-semibold text-white">Q{idx + 1}. {q.question}</p>
                      <p className="text-emerald-400 text-xs">정답: {q.options[q.answerIndex]}</p>
                      <p className="text-slate-400 text-xs">{q.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : quizResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-1">
                    <p className="text-sm text-slate-300">
                      {quizResult.totalQuestions}문제 중{" "}
                      <strong className="text-amber-300">{quizResult.correctCount}문제 정답</strong>
                    </p>
                    <p className="text-2xl font-black text-amber-300">
                      {quizResult.alreadySolved
                        ? `이미 수령 완료 (+${quizResult.awardedPmp} PMP)`
                        : `+${quizResult.awardedPmp} PMP 지갑 지급 완료!`}
                    </p>
                    {!quizResult.alreadySolved && (
                      <p className="text-xs text-slate-400">
                        오늘 남은 포럼 획득 가능 한도: {quizResult.dailyRemaining.toLocaleString()} PMP
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {quizResult.quizResults.map((r, idx) => (
                      <div
                        key={r.id}
                        className={`p-4 rounded-xl border text-sm space-y-1 ${
                          r.isCorrect
                            ? "bg-emerald-950/20 border-emerald-500/30"
                            : "bg-rose-950/20 border-rose-500/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold text-white">
                          {r.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span>Q{idx + 1}. {r.question}</span>
                        </div>
                        <p className="text-xs text-emerald-300 pl-6">
                          정답: {article.quiz[idx]?.options[r.answerIndex]}
                        </p>
                        <p className="text-xs text-slate-400 pl-6">{r.explanation}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-5">
                  {!isAuthenticated && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
                      <span>퀴즈를 풀고 실제 PMP를 지갑에 적립하려면 로그인이 필요합니다.</span>
                      <Link href="/auth/login" className="text-emerald-400 font-bold hover:underline">
                        로그인하기 →
                      </Link>
                    </div>
                  )}

                  {article.quiz.map((q, qIdx) => (
                    <div key={q.id} className="space-y-2.5">
                      <p className="text-sm font-bold text-white">
                        Q{qIdx + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => {
                          const selected = selectedAnswers[qIdx] === oIdx;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleSelectOption(qIdx, oIdx)}
                              className={`p-3 rounded-xl text-left text-xs md:text-sm border transition-all ${
                                selected
                                  ? "bg-amber-500/20 border-amber-400 text-amber-100 font-semibold"
                                  : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600"
                              }`}
                            >
                              {oIdx + 1}. {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {quizError && <p className="text-xs text-rose-400">{quizError}</p>}

                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz || !isAuthenticated}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold"
                  >
                    {isSubmittingQuiz ? "채점 및 PMP 지급 중..." : "정답 제출하고 PMP 받기"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* PosMul 공론장 · 예측 연결 카드 */}
        {(article.predictionHook || article.linkedGames.length > 0) && (
          <Card className="bg-blue-950/20 border-blue-500/30">
            <CardContent className="p-5 space-y-3">
              <div className="text-xs font-extrabold text-blue-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                토론 & 예측으로 이어가기
              </div>
              {article.predictionHook && (
                <p className="text-sm text-slate-200 font-medium">
                  💡 제안 이슈: &ldquo;{article.predictionHook}&rdquo;
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/forum/write"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  이 뉴스로 공론장 토론 열기 →
                </Link>
                <Link
                  href="/prediction"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  예측 시장 둘러보기
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 관련 기사 */}
        {article.relatedArticles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300">같은 섹션 관련 브리핑</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {article.relatedArticles.map((related) => (
                <Link key={related.id} href={`/forum/news/${related.category}/${related.id}`}>
                  <Card className="bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer">
                    <CardContent className="p-4 space-y-1">
                      <span className="text-[11px] text-teal-300">{related.regionName}</span>
                      <p className="text-sm text-white font-semibold line-clamp-2">{related.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
