"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { StudyAnalyticsResult, TopicAnalyticsItem } from "@/app/actions/exam-study.actions";
import { getMutedSubjectColor, getMutedTopicColor } from "@/lib/study-theme";

interface PassRoiStatsViewProps {
  analytics: StudyAnalyticsResult | null;
  loading: boolean;
}

export function PassRoiStatsView({ analytics, loading }: PassRoiStatsViewProps) {
  const [selectedRoiTopic, setSelectedRoiTopic] = useState<TopicAnalyticsItem | null>(null);

  const scatterData = useMemo(() => {
    const topics = analytics?.topics || [];
    const maxQuestions = Math.max(10, ...topics.map((t) => t.totalQuestions));
    return { topics, maxQuestions };
  }, [analytics]);

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-[var(--hp-text-3)]">
        합격 예측 및 출제 ROI 데이터를 분석하는 중...
      </div>
    );
  }

  if (!analytics || !analytics.success) {
    return (
      <div className="p-6 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-center space-y-2 text-xs text-[var(--hp-text-2)]">
        <div>기출 풀이 데이터가 연결되면 합격 예측과 4사분면 ROI 차트가 활성화됩니다.</div>
        <Link
          href="/study/solve"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] font-medium mt-2"
        >
          <span>기출 문제 풀기</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" />
        </Link>
      </div>
    );
  }

  const { overall, subjects: subjAnalytics, stagePredictions } = analytics;
  const optStats = overall.optionStats;
  const optTotal = Math.max(1, optStats.oCount + optStats.starCount + optStats.xCount);

  return (
    <div className="space-y-6">
      {/* ① 1·2차 예상 합격 확률 요약 */}
      <section className="grid grid-cols-2 gap-2.5">
        {stagePredictions.map((st) => (
          <div
            key={st.examStage}
            className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px] text-[var(--hp-text-3)]">
              <span>{st.examStage} 예상 합격률</span>
              <span className="hp-tabular">
                {st.solvedCount}/{st.totalQuestions}제
              </span>
            </div>
            <div className="text-2xl font-light hp-tabular text-[var(--hp-text)]">
              {st.passProbability !== null ? `${st.passProbability}%` : "-"}
            </div>
            <div className="text-[11px] text-[var(--hp-text-2)] hp-tabular">
              {st.predictedAvg !== null
                ? `예상 평균 ${st.predictedAvg}점`
                : "문항 풀이 후 산출"}
            </div>
          </div>
        ))}
      </section>

      {/* ② 과목별 예상 점수 Bullet Chart (40점 과락선 · 60점 합격선 SVG) */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--hp-text)]">과목별 예상 점수 · 과락 진단</span>
          <span className="text-[10.5px] hp-tabular text-[var(--hp-text-3)]">
            과락 40 · 합격 60
          </span>
        </div>

        <div className="space-y-3">
          {subjAnalytics.map((s, idx) => {
            const color = getMutedSubjectColor(s.subject, s.color, idx);
            const score = s.predictedScore ?? 0;
            const low = s.scoreRange ? s.scoreRange[0] : score;
            const high = s.scoreRange ? s.scoreRange[1] : score;

            return (
              <div key={s.subject} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[var(--hp-text)]">{s.shortTitle}</span>
                    {s.cutlineRisk === "DANGER" && (
                      <span className="text-[10px] text-[var(--hp-danger)]">과락위험</span>
                    )}
                  </span>
                  <span className="hp-tabular text-[11px] text-[var(--hp-text-2)]">
                    {s.predictedScore !== null ? `${s.predictedScore}점` : "미측정"} · 풀이{" "}
                    {s.progressPct}%
                  </span>
                </div>

                <svg viewBox="0 0 280 18" className="w-full h-4">
                  {/* 배경 트랙 */}
                  <rect x="0" y="5" width="280" height="8" rx="4" fill="var(--hp-surface-2)" />
                  {/* 과락(40점) 이하 영역 미세 강조 */}
                  <rect
                    x="0"
                    y="5"
                    width="112"
                    height="8"
                    rx="4"
                    fill="#C97B63"
                    opacity="0.14"
                  />
                  {/* 신뢰 구간 범위 바 */}
                  {s.predictedScore !== null && (
                    <>
                      <rect
                        x={(low / 100) * 280}
                        y="5"
                        width={Math.max(4, ((high - low) / 100) * 280)}
                        height="8"
                        rx="3"
                        fill={color}
                        opacity="0.35"
                      />
                      <circle cx={(score / 100) * 280} cy="9" r="4" fill={color} />
                    </>
                  )}
                  {/* 40점 과락선 */}
                  <line
                    x1="112"
                    x2="112"
                    y1="1"
                    y2="17"
                    stroke="var(--hp-danger)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  {/* 60점 합격선 */}
                  <line
                    x1="168"
                    x2="168"
                    y1="1"
                    y2="17"
                    stroke="var(--hp-success)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                </svg>
              </div>
            );
          })}
        </div>
      </section>

      {/* ③ 4사분면 ROI 산점도 (출제빈도 × 내 정답률 Scatter Plot SVG) */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--hp-text)]">4사분면 출제 ROI 매트릭스</span>
          <span className="text-[10.5px] text-[var(--hp-text-3)]">점 탭 시 단원 기출 직행</span>
        </div>

        <svg viewBox="0 0 300 200" className="w-full h-52 bg-[var(--hp-bg)] rounded-lg border border-[var(--hp-border)]">
          {/* 우하단 최우선 공략 영역 은은한 배경 */}
          <rect x="150" y="100" width="142" height="86" fill="#C97B63" opacity="0.09" />
          {/* 십자 축 (중간 빈도 / 60% 정답률 기준선) */}
          <line x1="150" x2="150" y1="14" y2="186" stroke="var(--hp-border-strong)" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="22" x2="292" y1="100" y2="100" stroke="var(--hp-border-strong)" strokeWidth="0.8" strokeDasharray="3 3" />

          {/* 사분면 라벨 */}
          <text x="28" y="26" fontSize="8.5" fill="var(--hp-text-3)">저빈출 · 고정답</text>
          <text x="286" y="26" textAnchor="end" fontSize="8.5" fill="var(--hp-success)">합격 안전지대</text>
          <text x="28" y="180" fontSize="8.5" fill="var(--hp-text-3)">저빈출 · 보완</text>
          <text x="286" y="180" textAnchor="end" fontSize="8.5" fill="var(--hp-danger)">최우선 공략 (고빈출·약점)</text>

          {/* 단원 점들 */}
          {scatterData.topics.map((t, idx) => {
            const xRatio = Math.min(1, t.totalQuestions / scatterData.maxQuestions);
            // 미풀이 단원은 Y=15% 지점에 표시해 고빈출 미풀이 단원이 자연스럽게 우하단 공략존에 잡힘
            const yPct = t.accuracyPct !== null ? t.accuracyPct : 15;
            const cx = 28 + xRatio * 256;
            const cy = 180 - (yPct / 100) * 156;
            const isSelected = selectedRoiTopic?.chapterCode === t.chapterCode;
            const dotColor = getMutedTopicColor(undefined, idx);

            return (
              <circle
                key={t.chapterCode}
                cx={cx}
                cy={cy}
                r={isSelected ? 6 : 3.8}
                fill={dotColor}
                stroke={isSelected ? "var(--hp-accent)" : "none"}
                strokeWidth={isSelected ? 1.5 : 0}
                opacity={selectedRoiTopic && !isSelected ? 0.45 : 0.9}
                className="cursor-pointer transition-all"
                onClick={() => setSelectedRoiTopic(t)}
              />
            );
          })}
        </svg>

        {selectedRoiTopic && (
          <div className="p-3 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="font-medium text-[var(--hp-text)] truncate">
                {selectedRoiTopic.numberedTitle}
              </div>
              <div className="text-[11px] hp-tabular text-[var(--hp-text-3)] mt-0.5">
                {selectedRoiTopic.subjectShort} · 역대 {selectedRoiTopic.totalQuestions}제 ·{" "}
                {selectedRoiTopic.accuracyPct !== null
                  ? `정답률 ${selectedRoiTopic.accuracyPct}%`
                  : "미풀이"}
              </div>
            </div>
            <Link
              href={`/study/solve?chapter=${encodeURIComponent(selectedRoiTopic.chapterCode)}`}
              className="px-2.5 py-1.5 rounded-md bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] text-[11px] font-medium flex items-center gap-1 shrink-0"
            >
              <span>기출</span>
              <ArrowRight className="w-3 h-3 stroke-[1.75]" />
            </Link>
          </div>
        )}
      </section>

      {/* ④ 보기 O / ★ / X 마스터리 퍼널 */}
      <section className="p-4 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--hp-text)]">선지(O · ★ · X) 정복률</span>
          <Link
            href="/study/ox?mode=weak"
            className="text-[11px] text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-0.5"
          >
            <span>약점 복습</span>
            <ArrowRight className="w-3 h-3 stroke-[1.5]" />
          </Link>
        </div>

        <div className="h-2.5 w-full rounded-full bg-[var(--hp-surface-2)] overflow-hidden flex">
          <div
            style={{ width: `${(optStats.oCount / optTotal) * 100}%`, backgroundColor: "#5B8C73" }}
          />
          <div
            style={{ width: `${(optStats.starCount / optTotal) * 100}%`, backgroundColor: "#B89B5E" }}
          />
          <div
            style={{ width: `${(optStats.xCount / optTotal) * 100}%`, backgroundColor: "#C97B63" }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[11px] hp-tabular">
          <div className="p-2 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)]">
            <div className="text-[var(--hp-success)]">O 숙지</div>
            <div className="font-medium mt-0.5">{optStats.oCount}개</div>
          </div>
          <div className="p-2 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)]">
            <div className="text-[var(--hp-warn)]">★ 애매함</div>
            <div className="font-medium mt-0.5">{optStats.starCount}개</div>
          </div>
          <div className="p-2 rounded-lg bg-[var(--hp-bg)] border border-[var(--hp-border)]">
            <div className="text-[var(--hp-danger)]">X 함정</div>
            <div className="font-medium mt-0.5">{optStats.xCount}개</div>
          </div>
        </div>
      </section>
    </div>
  );
}
