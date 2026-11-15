"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  KeyRound,
  Plus,
  Sparkles,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { useStudyCurriculum } from "@/lib/study-curriculum-store";
import { SerialRegisterModal } from "@/components/auth/serial-register-modal";
import { getUserSerialStatusAction } from "@/app/actions/serial.actions";

export default function TextbookCatalogPage() {
  const {
    activeBook,
    catalog,
    subjects,
    examDate,
    setExamDate,
    selectTextbook,
    addCustomTopic,
  } = useStudyCurriculum();

  const [previewBookId, setPreviewBookId] = useState<string | null>(activeBook.id);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicKeyword, setNewTopicKeyword] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 정품 시리얼 상태
  const [isSerialVerified, setIsSerialVerified] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);

  useEffect(() => {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      const cached = globalThis.localStorage.getItem("housing_pro_serial_auth");
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { serialCode?: string };
          if (parsed.serialCode) setIsSerialVerified(true);
        } catch {
          // ignore
        }
      }
    }
    getUserSerialStatusAction("user-demo-housing-1").then((res) => {
      if (res.isRegistered) setIsSerialVerified(true);
    });
  }, []);

  // 현재 교재의 첫 단원 기본 선택
  useEffect(() => {
    const firstUnit = subjects[0]?.units[0];
    if (firstUnit && !subjects.some((s) => s.units.some((u) => u.id === selectedUnitId))) {
      setSelectedUnitId(firstUnit.id);
    }
  }, [subjects, selectedUnitId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    globalThis.setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSelectBook = (bookId: string, title: string) => {
    selectTextbook(bookId);
    setPreviewBookId(bookId);
    showToast(`「${title}」 목차가 플래너·타이머·통계에 자동 세팅되었습니다!`);
  };

  const handleAddTopic = () => {
    if (!selectedUnitId || !newTopicTitle.trim()) return;
    addCustomTopic(selectedUnitId, newTopicTitle, newTopicKeyword);
    setNewTopicTitle("");
    setNewTopicKeyword("");
    showToast("커스텀 목차가 플래너 매트릭스에 추가되었습니다.");
  };

  return (
    <MobileAppShell>
      {/* 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#FF5A36]" />
          <h1 className="text-sm font-black text-white">교재 &amp; 자동 목차 설정</h1>
        </div>
        {isSerialVerified ? (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[10px] font-black flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>정품인증</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsSerialModalOpen(true)}
            className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3" />
            <span>시리얼 등록</span>
          </button>
        )}
      </header>

      {toastMsg && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="px-4 py-4 space-y-5">
        {/* 현재 적용 중인 교재 & 시험일(D-Day) */}
        <section className="p-4 rounded-2xl bg-gradient-to-br from-[#1E1B24] to-[#15151B] border border-[#FF5A36]/40 space-y-3 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#FF5A36]/20 text-[#FF7A59] text-[10px] font-black">
              현재 내 커리큘럼
            </span>
            <Link
              href="/study/planner"
              className="text-[11px] font-black text-[#FF7A59] flex items-center gap-1 hover:underline"
            >
              <span>플래너 매트릭스 열기</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div>
            <h2 className="text-sm font-black text-white">{activeBook.title}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{activeBook.subtitle}</p>
          </div>
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>목표 시험일 (D-Day 기준)</span>
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#0E0E12] border border-white/[0.12] text-[11px] font-mono font-bold text-white"
            />
          </div>
        </section>

        {/* 출시 교재 카탈로그 */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white">출시 교재 선택 (목차 자동 연동)</h3>
            <span className="text-[10px] text-slate-400 font-bold">총 {catalog.length}권</span>
          </div>

          {catalog.map((book) => {
            const isActive = book.id === activeBook.id;
            const isPreviewOpen = previewBookId === book.id;
            const topicCount = book.subjects.reduce(
              (acc, s) => acc + s.units.reduce((uAcc, u) => uAcc + u.topics.length, 0),
              0
            );

            return (
              <div
                key={book.id}
                className={`p-4 rounded-2xl border transition space-y-3 ${
                  isActive
                    ? "bg-[#1B1922] border-[#FF5A36]/60 shadow-md"
                    : "bg-[#1A1A21] border-white/[0.06]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-md text-[9.5px] font-black text-white"
                        style={{ backgroundColor: book.coverColor }}
                      >
                        {book.badge}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {book.subjects.length}과목 · {topicCount}세부목차
                      </span>
                      {book.requiresSerial && (
                        <span className="text-[9.5px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                          POD 정품연동
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-black text-white">{book.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-snug">{book.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreviewBookId(isPreviewOpen ? null : book.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#111116] border border-white/[0.08] text-[10.5px] font-bold text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    {isPreviewOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    <span>수록 목차 보기</span>
                  </button>

                  {isActive ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>적용 중</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectBook(book.id, book.title)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff6d4d] text-white text-[11px] font-black transition"
                    >
                      이 교재로 목차 자동 세팅
                    </button>
                  )}
                </div>

                {/* 수록 목차 아코디언 미리보기 */}
                {isPreviewOpen && (
                  <div className="pt-2.5 border-t border-white/[0.06] space-y-2">
                    {book.subjects.map((subj) => (
                      <div key={subj.id} className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-black text-white">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: subj.color }}
                          />
                          <span className="text-slate-400">[{subj.examStage}]</span>
                          <span>{subj.title}</span>
                        </div>
                        <div className="pl-3 space-y-1.5">
                          {subj.units.map((u) => (
                            <div key={u.id} className="space-y-1">
                              <div className="text-[9.5px] font-extrabold text-slate-400">
                                {u.title}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {u.topics.map((t) => (
                                  <span
                                    key={t.id}
                                    className="px-2 py-0.5 rounded-md bg-[#111116] border border-white/[0.06] text-[9.5px] text-slate-200 flex items-center gap-1"
                                  >
                                    {t.topicNo && (
                                      <span
                                        className="font-mono font-black"
                                        style={{ color: subj.color }}
                                      >
                                        {t.topicNo}.
                                      </span>
                                    )}
                                    <span>{t.title}</span>
                                    {typeof t.questionCount === "number" && (
                                      <span className="text-[8.5px] font-mono text-slate-500">
                                        ({t.questionCount})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* 나만의 커스텀 목차 추가 */}
        <section className="p-4 rounded-2xl bg-[#1A1A21] border border-white/[0.06] space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-black text-white">
            <Plus className="w-4 h-4 text-[#FF5A36]" />
            <span>내 교재에 커스텀 목차 추가</span>
          </div>

          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#101015] border border-white/[0.1] text-xs font-bold text-white"
          >
            {subjects.map((subj) =>
              subj.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  [{subj.examStage}] {subj.title} &gt; {unit.title}
                </option>
              ))
            )}
          </select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="세부 목차명 (예: 모의고사 1회 오답)"
              className="px-3 py-2 rounded-xl bg-[#101015] border border-white/[0.1] text-xs text-white"
            />
            <input
              type="text"
              value={newTopicKeyword}
              onChange={(e) => setNewTopicKeyword(e.target.value)}
              placeholder="매트릭스 키워드 (예: 모고1회)"
              className="px-3 py-2 rounded-xl bg-[#101015] border border-white/[0.1] text-xs text-white"
            />
          </div>

          <button
            type="button"
            onClick={handleAddTopic}
            className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-black transition"
          >
            목차 트리에 추가하기
          </button>
        </section>
      </div>

      <SerialRegisterModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        onSuccess={() => {
          setIsSerialVerified(true);
          showToast("정품 교재 시리얼이 인증되었습니다!");
        }}
      />
    </MobileAppShell>
  );
}
