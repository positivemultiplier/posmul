"use client";

import { useState, FormEvent } from "react";
import { createClient } from "../../../lib/supabase/client";
import { FadeIn, HoverLift } from "../../../shared/ui/components/animations";
import {
  Chrome,
  Loader2,
  Sparkles,
  Mail,
  Lock,
  UserCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const SIDO_LIST = [
  "서울특별시",
  "경기도",
  "부산광역시",
  "인천광역시",
  "대전광역시",
  "대구광역시",
  "광주광역시",
  "울산광역시",
  "세종특별자치시",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

export default function SignupPage() {
  const [mode, setMode] = useState<"social" | "email">("social");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 입력 필드 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [sido, setSido] = useState("서울특별시");

  // 약관 동의 상태
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // 닉네임 중복 확인 상태
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSuccess, setNicknameSuccess] = useState<string | null>(null);

  // 닉네임 중복 확인 핸들러
  const handleCheckNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameError("닉네임을 입력해 주세요.");
      setNicknameSuccess(null);
      setNicknameChecked(false);
      return;
    }

    if (trimmed.length < 2 || trimmed.length > 12) {
      setNicknameError("닉네임은 2자 이상 12자 이하여야 합니다.");
      setNicknameSuccess(null);
      setNicknameChecked(false);
      return;
    }

    setCheckingNickname(true);
    setNicknameError(null);
    setNicknameSuccess(null);

    try {
      const res = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (data.available) {
        setNicknameSuccess(data.message || "사용 가능한 멋진 시민 닉네임입니다!");
        setNicknameChecked(true);
        setNicknameError(null);
      } else {
        setNicknameError(data.message || "이미 사용 중인 닉네임입니다.");
        setNicknameChecked(false);
        setNicknameSuccess(null);
      }
    } catch {
      setNicknameError("중복 확인 중 네트워크 오류가 발생했습니다.");
      setNicknameChecked(false);
    } finally {
      setCheckingNickname(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "소셜 회원가입 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const trimmedNickname = nickname.trim();

    // 1. 닉네임 검증
    if (!trimmedNickname) {
      setError("활동 닉네임을 입력해 주세요.");
      setIsLoading(false);
      return;
    }

    if (!nicknameChecked) {
      setError("닉네임 [중복 확인]을 완료해 주세요.");
      setIsLoading(false);
      return;
    }

    // 2. 비밀번호 검증
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setIsLoading(false);
      return;
    }

    // 3. 필수 약관 동의 검증
    if (!agreeAge || !agreeTerms || !agreePrivacy) {
      setError("만 14세 이상 확인 및 필수 이용약관에 동의해 주세요.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: trimmedNickname,
            nickname: trimmedNickname,
            username: trimmedNickname,
            sido: sido,
            agree_marketing: agreeMarketing,
          },
        },
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이메일 회원가입 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">가입 신청 완료!</h2>
              <p className="text-emerald-300 font-bold text-sm mb-4">
                환영합니다, <span className="underline">{nickname}</span> 시민님!
              </p>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                <span className="text-white font-semibold">{email}</span>로<br />
                계정 활성화 인증 메일을 발송했습니다.
              </p>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 mb-8 space-y-1.5 text-left">
                <p className="font-bold text-amber-300">🎁 신규 시민 스타터 패키지 증정</p>
                <p>• 무위험 예측 포인트: <strong>+10,000 PMP</strong></p>
                <p>• 나눔·가치 화폐: <strong>+1,000 PMC</strong></p>
                <p>• 소속 활동 지역: <strong>{sido}</strong></p>
              </div>
              <Link
                href="/auth/login"
                className="block w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
              >
                로그인 화면으로 이동
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <FadeIn>
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm text-gray-300">
                가입 시 10,000 PMP + 1,000 PMC 즉시 지급!
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold mb-2.5 bg-gradient-to-r from-blue-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              주권시민 회원가입
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              공인 데이터 오라클 예측과 실시간 LIVE 응원톡에 참여하세요
            </p>
          </div>

          {/* Signup Card */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 -z-10"></div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
              <button
                type="button"
                onClick={() => setMode("social")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 ${
                  mode === "social"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                소셜 1초 가입
              </button>
              <button
                type="button"
                onClick={() => setMode("email")}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 ${
                  mode === "email"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                이메일 직접 가입
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-300 font-medium">{error}</p>
              </div>
            )}

            {mode === "social" ? (
              /* Social Signup */
              <div className="space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed text-center pb-2">
                  소셜 로그인으로 가입 시, 가입 직후 대시보드에서 <strong>활동 닉네임과 지역</strong>을 간편하게 설정할 수 있습니다.
                </p>

                <HoverLift>
                  <button
                    onClick={handleGoogleSignup}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Chrome className="w-5 h-5 text-red-500" />
                    )}
                    <span>Google로 계속하기</span>
                  </button>
                </HoverLift>

                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FEE500] text-[#000000] rounded-xl font-bold opacity-50 cursor-not-allowed text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.79 1.84 5.24 4.61 6.63-.2.73-.73 2.73-.84 3.16-.13.52.19.51.4.37.16-.11 2.54-1.73 3.53-2.4.7.1 1.42.15 2.15.15 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
                  </svg>
                  <span>Kakao로 계속하기 (준비중)</span>
                </button>
              </div>
            ) : (
              /* Email Signup Form */
              <form onSubmit={handleEmailSignup} className="space-y-4">
                {/* 활동 닉네임 & 중복 확인 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-300 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>활동 닉네임 (Display Name)</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-gray-500">2~12자 (한글/영문/숫자/밑줄)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => {
                          setNickname(e.target.value);
                          setNicknameChecked(false);
                          setNicknameError(null);
                          setNicknameSuccess(null);
                        }}
                        placeholder="예: 예측마스터_서울"
                        required
                        className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition-colors ${
                          nicknameChecked
                            ? "border-emerald-500/60"
                            : nicknameError
                            ? "border-rose-500/60"
                            : "border-white/10 focus:border-blue-500"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={checkingNickname || !nickname.trim()}
                      onClick={handleCheckNickname}
                      className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-bold transition-colors shrink-0"
                    >
                      {checkingNickname ? "확인중..." : "중복 확인"}
                    </button>
                  </div>

                  {nicknameSuccess && (
                    <p className="mt-1.5 text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{nicknameSuccess}</span>
                    </p>
                  )}
                  {nicknameError && (
                    <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{nicknameError}</span>
                    </p>
                  )}
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    이메일 계정 <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* 활동 지역 (시·도) */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>내 활동 지역 (지역 랭킹 & 예산 감시 연동)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={sido}
                    onChange={(e) => setSido(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {SIDO_LIST.map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 비밀번호 & 확인 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      비밀번호 <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="최소 6자"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      비밀번호 확인 <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="재입력"
                        required
                        className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 약관 동의 체크박스 그룹 */}
                <div className="pt-2 pb-1 border-t border-white/10 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeAge}
                      onChange={(e) => setAgreeAge(e.target.checked)}
                      className="mt-0.5 rounded accent-blue-500"
                    />
                    <span className="text-xs text-gray-300">
                      <span className="text-blue-400 font-bold">[필수]</span> 만 14세 이상입니다.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded accent-blue-500"
                    />
                    <span className="text-xs text-gray-300">
                      <span className="text-blue-400 font-bold">[필수]</span>{" "}
                      <Link href="/terms" target="_blank" className="underline hover:text-white">
                        서비스 이용약관
                      </Link>
                      에 동의합니다.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="mt-0.5 rounded accent-blue-500"
                    />
                    <span className="text-xs text-gray-300">
                      <span className="text-blue-400 font-bold">[필수]</span>{" "}
                      <Link href="/privacy" target="_blank" className="underline hover:text-white">
                        개인정보 수집 및 이용
                      </Link>
                      에 동의합니다.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeMarketing}
                      onChange={(e) => setAgreeMarketing(e.target.checked)}
                      className="mt-0.5 rounded accent-blue-500"
                    />
                    <span className="text-xs text-gray-400">
                      [선택] 주요 예측 게임 마감 및 오라클 정산 알림 수신에 동의합니다.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>시민 가입 완료 (+10,000 PMP 받기)</span>
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#161726] text-gray-400">이미 계정이 있으신가요?</span>
              </div>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-xs sm:text-sm text-blue-400 hover:underline font-semibold"
              >
                기존 계정으로 로그인하기 →
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
