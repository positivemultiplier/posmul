"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Copy,
  Check,
  CheckSquare,
  Square,
  Camera,
  Scale,
  ArrowRight,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { PRO_DOCUMENT_TEMPLATES } from "@/data/mock-pro-community";
import { useProWorkspace } from "@/lib/pro-workspace-store";

export default function ProDocsWorkspacePage() {
  const { complexProfile } = useProWorkspace();
  const [selectedDocId, setSelectedDocId] = useState(PRO_DOCUMENT_TEMPLATES[0].id);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const currentDoc =
    PRO_DOCUMENT_TEMPLATES.find((d) => d.id === selectedDocId) ||
    PRO_DOCUMENT_TEMPLATES[0];

  // 우리 단지 스펙 자동 치환
  const renderedDraft = currentDoc.draftTemplate
    .replaceAll("{COMPLEX_NAME}", complexProfile.name)
    .replaceAll("{HOUSEHOLDS}", complexProfile.totalHouseholds.toLocaleString())
    .replaceAll("{HEATING}", complexProfile.heatingType);

  const handleCopy = async () => {
    try {
      await globalThis.navigator?.clipboard?.writeText(renderedDraft);
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleStep = (idx: number) => {
    const key = `${currentDoc.id}-${idx}`;
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <MobileAppShell isProMode>
      <header className="px-4 py-3 bg-[#0D1322] border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <h1 className="text-sm font-black text-white">입대의·공문 실무 코파일럿</h1>
        </div>
        <span className="text-[10.5px] font-bold text-sky-300 truncate max-w-[140px]">
          {complexProfile.name}
        </span>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* 서식 카테고리 선택 */}
        <div className="grid grid-cols-2 gap-2">
          {PRO_DOCUMENT_TEMPLATES.map((doc) => {
            const isSelected = doc.id === currentDoc.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedDocId(doc.id)}
                className={`p-3 rounded-2xl border text-left transition space-y-1 ${
                  isSelected
                    ? "bg-indigo-600/20 border-sky-400 shadow-md"
                    : "bg-[#121A2B] border-white/[0.08] hover:border-white/20"
                }`}
              >
                <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 text-[9.5px] font-black">
                  {doc.category}
                </span>
                <div className="text-[11.5px] font-extrabold text-white leading-snug line-clamp-2">
                  {doc.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* 법적 근거 & 필수 사전 체크리스트 */}
        <section className="p-4 rounded-2xl bg-[#121A2B] border border-white/[0.08] space-y-3">
          <div className="flex items-start gap-2 text-xs">
            <Scale className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-white">법적 근거 및 감사 포인트</div>
              <p className="text-[11px] text-amber-200/90 mt-0.5">{currentDoc.legalBasis}</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
            {currentDoc.checklist.map((step, idx) => {
              const checked = Boolean(checkedSteps[`${currentDoc.id}-${idx}`]);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleStep(idx)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-white/[0.05] flex items-center gap-2 text-left"
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span
                    className={`text-[11px] font-bold ${
                      checked ? "line-through text-slate-500" : "text-slate-200"
                    }`}
                  >
                    {step}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 자동 생성된 우리 단지 맞춤 초안 */}
        <section className="p-4 rounded-2xl bg-[#121A2B] border border-sky-500/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-white">
              {complexProfile.name} 자동 완성 초안
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-black flex items-center gap-1 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "복사 완료!" : "본문 복사"}</span>
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-950 border border-white/[0.06] text-[11px] text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
            {renderedDraft}
          </pre>
        </section>

        {/* 현장 문서/고지서 AI 스캔 연계 */}
        <Link
          href="/scan"
          className="p-4 rounded-2xl bg-[#121A2B] border border-white/[0.08] hover:border-sky-400/50 flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-white">현장 공문·점검표 AI 비전 판독</div>
              <div className="text-[10.5px] text-slate-400">
                종이 점검표·지자체 공문 촬영 분석 도구 열기
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>
    </MobileAppShell>
  );
}
