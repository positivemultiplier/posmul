"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  LampDesk,
  Lock,
  Users,
} from "lucide-react";
import type { CreateStudyRoomInput } from "@/lib/study-groups-store";
import {
  STUDY_CONE_FAMILIES,
  StudyConeAvatar,
  StudyConeEvolutionStrip,
  resolveStudyConeFamily,
  type StudyConeFamily,
} from "@/components/study/group/StudyConeAvatar";

interface StudyGroupCreateWizardProps {
  isOpen: boolean;
  mode: "create" | "join" | "profile";
  initialStudyType?: "general" | "cam";
  targetRoomTitle?: string;
  targetRoomNicknameRule?: string;
  targetRoomPassword?: string;
  defaultNickname: string;
  defaultConeEmoji: string;
  myTodaySeconds?: number;
  onClose: () => void;
  onCreateComplete: (input: CreateStudyRoomInput) => void;
  onProfileComplete: (profile: { nickname: string; coneEmoji: string }) => void;
}

const CATEGORIES = [
  "자유과목",
  "자격증",
  "주택관리사 1차",
  "주택관리사 2차",
  "직장인",
  "새벽기상",
];

export function StudyGroupCreateWizard({
  isOpen,
  mode,
  initialStudyType = "general",
  targetRoomTitle,
  targetRoomNicknameRule,
  targetRoomPassword,
  defaultNickname,
  defaultConeEmoji,
  myTodaySeconds = 0,
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
  const [myNickname, setMyNickname] = useState(defaultNickname || "수험생");
  const [selectedCone, setSelectedCone] = useState<StudyConeFamily>(
    resolveStudyConeFamily(defaultConeEmoji)
  );
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
    setMyNickname(defaultNickname || "수험생");
    setSelectedCone(resolveStudyConeFamily(defaultConeEmoji));
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
        title: title.trim(),
        password: password.trim() || undefined,
        category,
        goalHours,
        capacity,
        notice: notice.trim(),
        studyType,
        joinMethod,
        nicknameRule: enableNicknameRule ? nicknameRule.trim() : undefined,
        myNickname: myNickname.trim() || "수험생",
        myConeEmoji: selectedCone,
      });
    } else {
      onProfileComplete({
        nickname: myNickname.trim() || "수험생",
        coneEmoji: selectedCone,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[85] bg-[var(--hp-overlay)] backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] h-[90dvh] sm:h-auto sm:max-h-[86dvh] rounded-t-3xl sm:rounded-2xl bg-[var(--hp-bg)] border border-[var(--hp-border-strong)] flex flex-col overflow-hidden text-[var(--hp-text)] shadow-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="px-4 py-3.5 border-b border-[var(--hp-border)] flex items-center justify-between bg-[var(--hp-surface)]">
          <button
            type="button"
            onClick={() => {
              if (mode === "create" && step > 1) {
                setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
              } else {
                onClose();
              }
            }}
            className="px-1.5 py-1 rounded-lg text-[var(--hp-text-2)] hover:text-[var(--hp-text)] flex items-center gap-1 text-xs font-medium transition"
          >
            <ChevronLeft className="w-4 h-4 stroke-[1.75]" />
            <span>{mode === "create" && step > 1 ? "이전" : "닫기"}</span>
          </button>

          <span className="text-xs font-semibold text-[var(--hp-text)]">
            {mode === "create"
              ? step === 4
                ? "그룹 프로필 · 스터디콘"
                : "스터디 그룹 개설"
              : mode === "join"
                ? "스터디 그룹 참여"
                : "방 프로필 · 스터디콘"}
          </span>

          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--hp-surface-2)] border border-[var(--hp-border)] text-[var(--hp-text-2)] hp-tabular">
            {mode === "create" ? `${step} / 4` : mode === "join" ? "참여" : "프로필"}
          </span>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* STEP 1: 기본 정보 */}
          {mode === "create" && step === 1 && (
            <div className="space-y-3.5">
              {/* 일반 스터디 vs 캠 스터디 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStudyType("general")}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    studyType === "general"
                      ? "bg-[var(--hp-surface-2)] border-[var(--hp-accent)] text-[var(--hp-text)]"
                      : "bg-[var(--hp-surface)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
                  }`}
                >
                  <LampDesk className="w-4 h-4 stroke-[1.6] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">일반 스터디</div>
                    <div className="text-[10px] text-[var(--hp-text-3)]">타이머 순공 경쟁</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setStudyType("cam")}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                    studyType === "cam"
                      ? "bg-[var(--hp-surface-2)] border-[var(--hp-accent)] text-[var(--hp-text)]"
                      : "bg-[var(--hp-surface)] border-[var(--hp-border)] text-[var(--hp-text-2)]"
                  }`}
                >
                  <Camera className="w-4 h-4 stroke-[1.6] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">캠 스터디</div>
                    <div className="text-[10px] text-[var(--hp-text-3)]">책상·공부 인증</div>
                  </div>
                </button>
              </div>

              {/* 그룹명 & 비밀번호 */}
              <div className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] divide-y divide-[var(--hp-border)] overflow-hidden">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="그룹명 입력 (예: 제29회 동차 6시간 열공방)"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-transparent text-sm font-medium text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] focus:outline-none"
                />
                <div className="flex items-center px-3.5">
                  <Lock className="w-3.5 h-3.5 text-[var(--hp-text-3)] mr-2 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (선택 · 비워두면 공개방)"
                    className="w-full min-h-[42px] py-2 bg-transparent text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] focus:outline-none"
                  />
                </div>
              </div>

              {/* 카테고리 · 일일 목표 시간 · 모집인원 */}
              <div className="rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] divide-y divide-[var(--hp-border)]">
                <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--hp-text-2)]">카테고리</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-[var(--hp-surface)] text-right font-semibold text-[var(--hp-text)] focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--hp-text-2)]">일일 목표 시간</span>
                  <select
                    value={goalHours}
                    onChange={(e) => setGoalHours(Number(e.target.value))}
                    className="bg-[var(--hp-surface)] text-right font-semibold text-[var(--hp-text)] hp-tabular focus:outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                      <option key={h} value={h}>
                        {h}시간
                      </option>
                    ))}
                  </select>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--hp-text-2)]">모집인원</span>
                  <select
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="bg-[var(--hp-surface)] text-right font-semibold text-[var(--hp-text)] hp-tabular focus:outline-none cursor-pointer"
                  >
                    {[10, 20, 30, 50, 100].map((cap) => (
                      <option key={cap} value={cap}>
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
                placeholder="그룹 공지와 규칙을 적어주세요. (예: 주 5일 출석, 미접속 3일 정리)"
                className="w-full p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] focus:outline-none focus:border-[var(--hp-border-strong)]"
              />
            </div>
          )}

          {/* STEP 2: 가입 방법 */}
          {mode === "create" && step === 2 && (
            <div className="space-y-3">
              <div className="text-sm font-semibold">가입 방법을 선택하세요.</div>

              <div className="space-y-2">
                {(
                  [
                    {
                      id: "instant",
                      title: "바로가입",
                      desc: "누구나 즉시 입장해 함께 타이머를 켤 수 있습니다.",
                    },
                    {
                      id: "approval",
                      title: "승인 후 가입",
                      desc: "그룹장이 목표·출석 의지를 확인한 후 입장합니다.",
                    },
                  ] as const
                ).map((opt) => {
                  const selected = joinMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setJoinMethod(opt.id)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 transition ${
                        selected
                          ? "bg-[var(--hp-surface-2)] border-[var(--hp-accent)]"
                          : "bg-[var(--hp-surface)] border-[var(--hp-border)]"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-[var(--hp-text)]">
                          {opt.title}
                        </div>
                        <div className="text-[11px] text-[var(--hp-text-2)] mt-0.5">
                          {opt.desc}
                        </div>
                      </div>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? "border-[var(--hp-accent)]" : "border-[var(--hp-border-strong)]"
                        }`}
                      >
                        {selected && (
                          <span className="w-2 h-2 rounded-full bg-[var(--hp-accent)]" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: 그룹 닉네임 규칙 */}
          {mode === "create" && step === 3 && (
            <div className="space-y-3.5">
              <div>
                <div className="text-sm font-semibold">그룹 닉네임 규칙</div>
                <p className="text-[11px] text-[var(--hp-text-2)] mt-0.5">
                  방 멤버들의 목표가 한눈에 보이도록 규칙을 안내할 수 있습니다.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] flex items-center justify-between">
                <span className="text-xs font-medium">닉네임 규칙 사용</span>
                <button
                  type="button"
                  onClick={() => setEnableNicknameRule((prev) => !prev)}
                  className={`w-10 h-5 rounded-full p-0.5 transition ${
                    enableNicknameRule ? "bg-[var(--hp-accent)]" : "bg-[var(--hp-border-strong)]"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-[var(--hp-bg)] transition-transform ${
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
                  placeholder="예: 닉네임/목표회차 또는 닉네임/하루 4시간"
                  className="w-full h-10 px-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] placeholder:text-[var(--hp-text-3)] focus:outline-none focus:border-[var(--hp-border-strong)]"
                />
              )}
            </div>
          )}

          {/* STEP 4: 내 그룹 프로필 + 1시간 진화 스터디콘 선택 */}
          {step === 4 && (
            <div className="space-y-4">
              {targetRoomTitle && (
                <div className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--hp-text-2)] shrink-0" />
                  <span className="truncate">{targetRoomTitle}</span>
                </div>
              )}

              {mode === "join" && targetRoomPassword && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[var(--hp-text-2)]">
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
                    className="w-full h-10 px-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)] text-xs text-[var(--hp-text)] focus:outline-none focus:border-[var(--hp-border-strong)]"
                  />
                  {passwordError && (
                    <p className="text-[11px] text-[var(--hp-danger)]">{passwordError}</p>
                  )}
                </div>
              )}

              {/* 방별 닉네임 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>이 방에서 사용할 닉네임</span>
                  {(enableNicknameRule && nicknameRule) || targetRoomNicknameRule ? (
                    <span className="text-[10px] text-[var(--hp-text-2)] truncate max-w-[190px]">
                      규칙: {nicknameRule || targetRoomNicknameRule}
                    </span>
                  ) : null}
                </div>
                <input
                  type="text"
                  value={myNickname}
                  onChange={(e) => setMyNickname(e.target.value)}
                  placeholder="닉네임 입력"
                  className="w-full h-10 px-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border-strong)] text-sm font-medium text-[var(--hp-text)] focus:outline-none"
                />
              </div>

              {/* 5종 진화 스터디콘 선택 */}
              <div className="space-y-2">
                <div className="text-xs font-medium">
                  진화 스터디콘 선택 (1시간마다 모양 변화)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {STUDY_CONE_FAMILIES.map((spec) => {
                    const selected = selectedCone === spec.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => setSelectedCone(spec.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                          selected
                            ? "border-[var(--hp-accent)] bg-[var(--hp-surface-2)]"
                            : "border-[var(--hp-border)] bg-[var(--hp-surface)] hover:border-[var(--hp-border-strong)]"
                        }`}
                      >
                        <StudyConeAvatar
                          family={spec.id}
                          seconds={Math.max(myTodaySeconds, 3 * 3600 + 1800)}
                          isStudying
                          size={44}
                        />
                        <span className="text-[11px] font-medium truncate max-w-full">
                          {spec.shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 선택한 스터디콘의 0h~10h+ 1시간별 진화 미리보기 */}
              <div className="p-3 rounded-xl bg-[var(--hp-surface)] border border-[var(--hp-border)]">
                <StudyConeEvolutionStrip
                  family={selectedCone}
                  currentSeconds={myTodaySeconds}
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="p-4 border-t border-[var(--hp-border)] bg-[var(--hp-bg)]">
          {mode === "create" && step < 4 ? (
            <button
              type="button"
              disabled={step === 1 && !title.trim()}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              className="w-full h-11 rounded-xl bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] disabled:opacity-40 text-sm font-semibold flex items-center justify-center gap-1 transition hover:opacity-90"
            >
              <span>다음 ({step}/4)</span>
              <ChevronRight className="w-4 h-4 stroke-[1.75]" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!myNickname.trim()}
              onClick={handleFinish}
              className="w-full h-11 rounded-xl bg-[var(--hp-accent)] text-[var(--hp-accent-fg)] disabled:opacity-40 text-sm font-semibold transition hover:opacity-90"
            >
              {mode === "create" ? "그룹 개설 완료" : mode === "join" ? "이 그룹 참여하기" : "프로필 저장"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
