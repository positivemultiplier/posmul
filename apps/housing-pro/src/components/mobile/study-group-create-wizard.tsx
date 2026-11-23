"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  LampDesk,
  Lock,
  Plus,
  Users,
} from "lucide-react";
import { STUDY_CONE_CATALOG } from "@/data/mock-study-cones";
import type { CreateStudyRoomInput } from "@/lib/study-groups-store";

interface StudyGroupCreateWizardProps {
  isOpen: boolean;
  mode: "create" | "join" | "profile";
  initialStudyType?: "general" | "cam";
  targetRoomTitle?: string;
  targetRoomNicknameRule?: string;
  targetRoomPassword?: string;
  defaultNickname: string;
  defaultConeEmoji: string;
  onClose: () => void;
  onCreateComplete: (input: CreateStudyRoomInput) => void;
  onProfileComplete: (profile: { nickname: string; coneEmoji: string }) => void;
}

const CATEGORIES = ["자격증", "주택관리사 2차", "주택관리사 1차", "직장인", "새벽기상"];

export function StudyGroupCreateWizard({
  isOpen,
  mode,
  initialStudyType = "general",
  targetRoomTitle,
  targetRoomNicknameRule,
  targetRoomPassword,
  defaultNickname,
  defaultConeEmoji,
  onClose,
  onCreateComplete,
  onProfileComplete,
}: StudyGroupCreateWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // STEP 1: 기본 정보
  const [studyType, setStudyType] = useState<"general" | "cam">(initialStudyType);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState("자격증");
  const [goalHours, setGoalHours] = useState(4);
  const [capacity, setCapacity] = useState(30);
  const [notice, setNotice] = useState("");

  // STEP 2: 가입 방법
  const [joinMethod, setJoinMethod] = useState<"instant" | "approval">("instant");

  // STEP 3: 닉네임 규칙
  const [enableNicknameRule, setEnableNicknameRule] = useState(true);
  const [nicknameRule, setNicknameRule] = useState("");

  // STEP 4: 내 그룹 프로필 설정
  const [myNickname, setMyNickname] = useState(defaultNickname || "posmul");
  const [myConeEmoji, setMyConeEmoji] = useState(defaultConeEmoji || "");
  const [joinPasswordInput, setJoinPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStudyType(initialStudyType);
    setStep(mode === "create" ? 1 : 4);
    setTitle("");
    setPassword("");
    setCategory("자격증");
    setGoalHours(4);
    setCapacity(30);
    setNotice("");
    setJoinMethod("instant");
    setEnableNicknameRule(true);
    setNicknameRule("");
    setMyNickname(defaultNickname || "posmul");
    setMyConeEmoji(defaultConeEmoji || "");
    setJoinPasswordInput("");
    setPasswordError(null);
  }, [isOpen, mode, initialStudyType, defaultNickname, defaultConeEmoji]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (mode === "join" && targetRoomPassword) {
      if (joinPasswordInput.trim() !== targetRoomPassword) {
        setPasswordError("그룹 비밀번호가 일치하지 않습니다.");
        return;
      }
    }

    if (mode === "create") {
      if (!title.trim()) return;
      onCreateComplete({
        title,
        password: password || undefined,
        category,
        goalHours,
        capacity,
        notice,
        studyType,
        joinMethod,
        nicknameRule: enableNicknameRule ? nicknameRule : undefined,
        myNickname: myNickname.trim() || "posmul",
        myConeEmoji,
      });
    } else {
      onProfileComplete({
        nickname: myNickname.trim() || "posmul",
        coneEmoji: myConeEmoji,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[85] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-[440px] h-[92dvh] sm:h-auto sm:max-h-[88dvh] rounded-t-3xl sm:rounded-3xl bg-[#0D0D11] border border-white/[0.12] flex flex-col overflow-hidden text-white shadow-2xl pb-safe">
        {/* 상단 헤더 */}
        <div className="px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-[#14141B]">
          <button
            type="button"
            onClick={() => {
              if (mode === "create" && step > 1) {
                setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
              } else {
                onClose();
              }
            }}
            className="p-1 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{mode === "create" && step > 1 ? "이전" : "닫기"}</span>
          </button>

          <span className="text-xs font-black text-white">
            {mode === "create"
              ? step === 4
                ? "그룹 프로필 설정"
                : "그룹 만들기"
              : "그룹 프로필 설정"}
          </span>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5A36]/20 text-[#FF8A6B]">
            {mode === "create" ? `${step} / 4` : "참여"}
          </span>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* STEP 1: 기본 정보 (레퍼런스 6) */}
          {mode === "create" && step === 1 && (
            <div className="space-y-3.5">
              {/* 일반 스터디 vs 캠 스터디 선택 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStudyType("general")}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition ${
                    studyType === "general"
                      ? "bg-[#FF5A36]/15 border-[#FF5A36] text-white"
                      : "bg-[#16161D] border-white/[0.08] text-slate-400"
                  }`}
                >
                  <LampDesk className="w-4 h-4 text-[#FF7A59] shrink-0" />
                  <div>
                    <div className="text-xs font-black">일반 스터디</div>
                    <div className="text-[9.5px] text-slate-400">책상 불빛 열공</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setStudyType("cam")}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition ${
                    studyType === "cam"
                      ? "bg-[#FF5A36]/15 border-[#FF5A36] text-white"
                      : "bg-[#16161D] border-white/[0.08] text-slate-400"
                  }`}
                >
                  <Camera className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-xs font-black">캠 스터디</div>
                    <div className="text-[9.5px] text-slate-400">책상/공부 인증</div>
                  </div>
                </button>
              </div>

              {/* 그룹명 & 비밀번호 (iOS 자동 줌 방지 text-sm) */}
              <div className="rounded-2xl bg-[#16161D] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="그룹명을 적어주세요. (예: 주택관리사 29회 합격반)"
                  className="w-full min-h-[46px] px-3.5 py-3 bg-transparent text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none"
                />
                <div className="flex items-center px-3.5">
                  <Lock className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (선택 · 비워두면 공개방)"
                    className="w-full min-h-[44px] py-2.5 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 카테고리 · 일일 목표 시간 · 모집인원 */}
              <div className="rounded-2xl bg-[#16161D] border border-white/[0.08] divide-y divide-white/[0.06]">
                <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">카테고리</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-transparent text-right font-black text-[#FF8A6B] focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#16161D] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">일일 목표 시간</span>
                  <select
                    value={goalHours}
                    onChange={(e) => setGoalHours(Number(e.target.value))}
                    className="bg-transparent text-right font-black text-white focus:outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                      <option key={h} value={h} className="bg-[#16161D] text-white">
                        {h}시간
                      </option>
                    ))}
                  </select>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">모집인원</span>
                  <select
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="bg-transparent text-right font-black text-white focus:outline-none cursor-pointer"
                  >
                    {[10, 20, 30, 50, 100].map((cap) => (
                      <option key={cap} value={cap} className="bg-[#16161D] text-white">
                        {cap}명
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 소개 / 규칙 */}
              <textarea
                rows={3}
                value={notice}
                onChange={(e) => setNotice(e.target.value)}
                placeholder="어떤 그룹인지 설명해주세요. (가입 규칙 또는 응원 문구 등)"
                className="w-full p-3.5 rounded-2xl bg-[#16161D] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5A36]"
              />

              <div className="p-3 rounded-2xl bg-[#14141A] border border-white/[0.06] space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <span className="px-1.5 py-0.2 rounded bg-[#FF5A36] text-white text-[9px] font-black">
                    TIP
                  </span>
                  <span>이런 내용으로 소개해보세요.</span>
                </div>
                <div>· 어떤 규칙이 있나요? (예: 주 5일 출석, 미접속 3일 정리)</div>
                <div>· 어떤 사람들이 활동하나요? (예: 29회 동차 준비생, 직장인)</div>
              </div>
            </div>
          )}

          {/* STEP 2: 가입 방법 선택 (레퍼런스 7) */}
          {mode === "create" && step === 2 && (
            <div className="space-y-3.5">
              <h3 className="text-sm font-black text-white">가입 방법을 선택해주세요.</h3>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setJoinMethod("instant")}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                    joinMethod === "instant"
                      ? "bg-[#1A1617] border-[#FF5A36]"
                      : "bg-[#16161D] border-white/[0.08]"
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-white">바로가입</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      누구나 바로 입장해 함께 공부할 수 있어요.
                    </div>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      joinMethod === "instant" ? "border-[#FF5A36]" : "border-slate-600"
                    }`}
                  >
                    {joinMethod === "instant" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A36]" />
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setJoinMethod("approval")}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                    joinMethod === "approval"
                      ? "bg-[#1A1617] border-[#FF5A36]"
                      : "bg-[#16161D] border-white/[0.08]"
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-white">승인 후 가입</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      그룹장이 목표·출석 의지를 확인한 후 가입해요.
                    </div>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      joinMethod === "approval" ? "border-[#FF5A36]" : "border-slate-600"
                    }`}
                  >
                    {joinMethod === "approval" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A36]" />
                    )}
                  </span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#14141A] border border-white/[0.06] flex items-center gap-2 text-[11px] text-slate-300">
                <span className="px-1.5 py-0.2 rounded bg-[#FF5A36] text-white text-[9px] font-black shrink-0">
                  TIP
                </span>
                <span>승인을 받는 그룹이 평균 12% 더 좋은 출석률을 보입니다.</span>
              </div>
            </div>
          )}

          {/* STEP 3: 그룹 닉네임 규칙 (레퍼런스 8) */}
          {mode === "create" && step === 3 && (
            <div className="space-y-3.5">
              <div>
                <h3 className="text-sm font-black text-white">그룹 닉네임 규칙</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  그룹에서 사용할 닉네임 규칙을 안내해주세요.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#16161D] border border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-black text-white">그룹 닉네임 규칙</span>
                <button
                  type="button"
                  onClick={() => setEnableNicknameRule((prev) => !prev)}
                  className={`w-11 h-6 rounded-full p-0.5 transition ${
                    enableNicknameRule ? "bg-[#FF5A36]" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      enableNicknameRule ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {enableNicknameRule && (
                <input
                  type="text"
                  value={nicknameRule}
                  onChange={(e) => setNicknameRule(e.target.value)}
                  placeholder="닉네임 규칙을 입력해주세요. (예: 닉네임/하루 4시간)"
                  className="w-full px-3.5 py-3 rounded-2xl bg-[#16161D] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FF5A36]"
                />
              )}

              <div className="p-3 rounded-2xl bg-[#14141A] border border-white/[0.06] space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <span className="px-1.5 py-0.2 rounded bg-[#FF5A36] text-white text-[9px] font-black">
                    TIP
                  </span>
                  <span>닉네임 규칙이 있는 그룹이 평균 17% 더 오래 유지됩니다.</span>
                </div>
                <div>· 목표 회차·시험을 뒤에 입력 (예: 홍길동/29회동차)</div>
                <div>· 하루 목표시간 표기 (예: 소장꿈/하루 4시간)</div>
              </div>
            </div>
          )}

          {/* STEP 4: 그룹 프로필 설정 (레퍼런스 9) */}
          {step === 4 && (
            <div className="space-y-4">
              {targetRoomTitle && (
                <div className="p-3 rounded-2xl bg-[#16161D] border border-white/[0.08] text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF7A59] shrink-0" />
                  <span className="truncate">{targetRoomTitle}</span>
                </div>
              )}

              {mode === "join" && targetRoomPassword && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-300">
                    비공개 방 비밀번호
                  </label>
                  <input
                    type="password"
                    value={joinPasswordInput}
                    onChange={(e) => {
                      setJoinPasswordInput(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="그룹 비밀번호 입력"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#16161D] border border-white/[0.1] text-xs text-white"
                  />
                  {passwordError && (
                    <p className="text-[10.5px] text-rose-400 font-bold">{passwordError}</p>
                  )}
                </div>
              )}

              {/* 그룹 닉네임 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-white">
                  <span>그룹 닉네임</span>
                  {(enableNicknameRule && nicknameRule) || targetRoomNicknameRule ? (
                    <span className="text-[10px] font-bold text-[#FF8A6B]">
                      규칙: {nicknameRule || targetRoomNicknameRule}
                    </span>
                  ) : null}
                </div>
                <input
                  type="text"
                  value={myNickname}
                  onChange={(e) => setMyNickname(e.target.value)}
                  placeholder="이 방에서 표시할 닉네임 (예: posmul)"
                  className="w-full min-h-[46px] px-3.5 py-3 rounded-2xl bg-[#16161D] border border-[#FF5A36]/50 text-sm font-bold text-white focus:outline-none focus:border-[#FF5A36]"
                />
              </div>

              {/* 그룹 스터디콘 선택 (레퍼런스 9) */}
              <div className="space-y-2">
                <div className="text-xs font-black text-white">그룹 스터디콘</div>
                <div className="grid grid-cols-3 gap-2">
                  {STUDY_CONE_CATALOG.map((spec) => {
                    const selected = myConeEmoji === spec.badgeEmoji;
                    return (
                      <button
                        key={spec.coneType}
                        type="button"
                        onClick={() => setMyConeEmoji(spec.badgeEmoji)}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition ${
                          selected
                            ? "border-[#FF5A36] bg-[#FF5A36]/15"
                            : "border-white/[0.08] bg-[#16161D] hover:border-white/[0.2]"
                        }`}
                      >
                        <span className="text-3xl">{spec.badgeEmoji}</span>
                        <span className="text-[10px] font-bold text-slate-300 truncate max-w-full">
                          {spec.name.split(" ").pop()}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setMyConeEmoji("")}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition ${
                      myConeEmoji === ""
                        ? "border-[#FF5A36] bg-[#FF5A36]/15"
                        : "border-white/[0.08] bg-[#16161D] hover:border-white/[0.2]"
                    }`}
                  >
                    <span className="text-3xl"></span>
                    <span className="text-[10px] font-bold text-slate-300">기본 열공</span>
                  </button>

                  <Link
                    href="/study/more"
                    className="p-3 rounded-2xl border border-dashed border-white/[0.15] bg-[#14141A] hover:border-[#FF5A36] flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-bold">스토어</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 주황색 다음 / 완료 버튼 (48px 터치 영역) */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0D0D11]">
          {mode === "create" && step < 4 ? (
            <button
              type="button"
              disabled={step === 1 && !title.trim()}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              className="w-full min-h-[48px] rounded-2xl bg-[#FF5A36] hover:bg-[#ff6d4d] disabled:opacity-40 text-white text-sm font-black flex items-center justify-center gap-1 transition"
            >
              <span>다음 {step}/4</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!myNickname.trim()}
              onClick={handleFinish}
              className="w-full min-h-[48px] rounded-2xl bg-[#FF5A36] hover:bg-[#ff6d4d] disabled:opacity-40 text-white text-sm font-black transition"
            >
              완료
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
