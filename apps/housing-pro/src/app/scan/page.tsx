"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Sparkles,
  Star,
  X,
  RefreshCw,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Lock,
  ScanLine,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  SwitchCamera,
  CameraOff,
  Check,
} from "lucide-react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { getUserSerialStatusAction } from "@/app/actions/serial.actions";
import { SerialRegisterModal } from "@/components/auth/serial-register-modal";
import { REAL_2026_EXAM_QUESTIONS, ExamQuestionMaster } from "@/data/mock-exam-questions";
import type {
  OptionMarkType,
  ScannedQuestionGrading,
} from "@/app/api/scan/vision/route";

interface PagePreset {
  pageNumber: number;
  label: string;
  questionNumbers: number[];
}

const EXAM_PAGE_PRESETS: PagePreset[] = [
  { pageNumber: 1, label: "p.1 (제1문 ~ 제3문)", questionNumbers: [1, 2, 3] },
  { pageNumber: 2, label: "p.2 (제4문 ~ 제6문)", questionNumbers: [4, 5, 6] },
  { pageNumber: 3, label: "p.3 (제7문 ~ 제9문)", questionNumbers: [7, 8, 9] },
  { pageNumber: 4, label: "p.4 (제10문 ~ 제12문)", questionNumbers: [10, 11, 12] },
];

type ScanInputMode = "LIVE_CAMERA" | "PAPER_MARKING" | "PHOTO_UPLOAD";

export default function BookAiScanPage() {
  const router = useRouter();

  // 입력 모드: 실시간 카메라 | 시험지 손글씨 마킹 시뮬레이터 | 사진 업로드
  const [inputMode, setInputMode] = useState<ScanInputMode>("LIVE_CAMERA");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const currentPreset = EXAM_PAGE_PRESETS[selectedPresetIndex];

  // 카메라 스트림 상태
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paperCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);

  // 수험생 시험지 마킹 상태 (문제 정답 선택 1~5 + 선지별 O/★/X)
  const [paperSelectedAnswers, setPaperSelectedAnswers] = useState<Record<number, number>>({
    1: 5, // 1번 정답 5 (⭕ 정답)
    2: 1, // 2번 정답 3인데 1 선택 (❌ 오답)
    3: 5, // 3번 정답 5 (⭕ 정답이지만 ★ 포함 위장정답)
    4: 1,
    5: 2,
    6: 2,
    7: 4,
    8: 2,
    9: 3,
    10: 3,
    11: 2,
    12: 1,
  });

  const [paperOptionMarks, setPaperOptionMarks] = useState<
    Record<number, Record<number, OptionMarkType>>
  >({
    1: { 1: "O", 2: "STAR", 3: "O", 4: "O", 5: "O" },
    2: { 1: "STAR", 2: "O", 3: "X", 4: "O", 5: "O" },
    3: { 1: "O", 2: "STAR", 3: "O", 4: "X", 5: "O" },
    4: { 1: "O", 2: "STAR", 3: "O", 4: "O", 5: "X" },
    5: { 1: "O", 2: "X", 3: "STAR", 4: "O", 5: "STAR" },
    6: { 1: "O", 2: "O", 3: "STAR", 4: "O", 5: "O" },
  });

  // 스캔 및 정품 시리얼 상태
  const [isScanning, setIsScanning] = useState(false);
  const [userBalance, setUserBalance] = useState(1000);
  const [isSerialVerified, setIsSerialVerified] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [verifiedBookTitle, setVerifiedBookTitle] = useState<string | null>(null);

  // Vision AI 판독 및 채점 결과 상태
  const [engineUsed, setEngineUsed] = useState<string>("");
  const [gradedQuestions, setGradedQuestions] = useState<ScannedQuestionGrading[]>([]);
  const [rewardInfo, setRewardInfo] = useState<{
    earnedPmp: number;
    message: string;
    isSerialVerified?: boolean;
  } | null>(null);

  // 초기 시리얼 인증 상태 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("housing_pro_serial_auth");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.serialCode) {
            setIsSerialVerified(true);
            setVerifiedBookTitle(parsed.bookTitle || null);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    getUserSerialStatusAction("user-demo-housing-1").then((res) => {
      if (res.isRegistered) {
        setIsSerialVerified(true);
        if (res.bookTitle) setVerifiedBookTitle(res.bookTitle);
      }
    });
  }, []);

  // 카메라 중지 헬퍼
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // 실시간 웹캠 / 스마트폰 후면 카메라 시작
  const startCamera = useCallback(
    async (preferredFacing: "environment" | "user" = facingMode) => {
      setCameraError(null);
      stopCamera();

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "현재 브라우저/환경에서 카메라 장치에 접근할 수 없습니다. '시험지 마킹 스캔' 또는 '사진 업로드'를 이용하세요."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredFacing },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setCameraError(
          `카메라 권한 또는 장치를 찾을 수 없습니다 (${msg}). 아래 '시험지 마킹 & 스캔' 모드에서 즉시 테스트하실 수 있습니다.`
        );
        setCameraActive(false);
      }
    },
    [facingMode, stopCamera]
  );

  // 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 종이 시험지 + 손글씨 답안 체크 & O/★/X 마킹을 실제 Canvas 이미지로 렌더링
  const renderMarkedExamPaperToCanvas = useCallback((): string => {
    const canvas = paperCanvasRef.current || document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // 1. 종이 시험지 질감 배경
    ctx.fillStyle = "#FAF8F2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 상단 시험지 헤더
    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(
      `2026년도 제29회 주택관리사보 2차 [주택관리관계법규] (p.${currentPreset.pageNumber})`,
      28,
      38
    );

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 50);
    ctx.lineTo(canvas.width - 24, 50);
    ctx.stroke();

    // 우측 상단 O/★/X 마킹 범례
    ctx.fillStyle = "#DC2626";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("손글씨 마킹: [O 앎] [★ 헷갈림] [X 모름] + 답안 체크", 370, 38);

    let yCursor = 82;
    const circleNums = ["①", "②", "③", "④", "⑤"];

    for (const qNum of currentPreset.questionNumbers) {
      const qData: ExamQuestionMaster | undefined = REAL_2026_EXAM_QUESTIONS.find(
        (q) => q.questionNumber === qNum
      );
      if (!qData) continue;

      const selectedAns = paperSelectedAnswers[qNum] ?? qData.correctOption;
      const qMarks = paperOptionMarks[qNum] ?? {
        1: "O",
        2: "O",
        3: "O",
        4: "O",
        5: "O",
      };

      // 문제 번호 및 지문 출력
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 15px sans-serif";
      const qTitle = `${qData.questionNumber}. ${qData.questionText.slice(0, 44)}...`;
      ctx.fillText(qTitle, 28, yCursor);

      // 수험생이 문제 번호 옆에 적어둔 내 답안 표시 (빨간 볼펜 느낌)
      ctx.fillStyle = "#DC2626";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText(`[내 답: ${circleNums[selectedAns - 1]}]`, 595, yCursor);

      yCursor += 26;

      // 5개 선지 및 손글씨 O / ★ / X 마킹 렌더링
      for (const opt of qData.options) {
        const mark = qMarks[opt.optionNumber] ?? "O";
        const isPickedAnswer = opt.optionNumber === selectedAns;

        // 마킹 박스 영역 [ O | ★ | X ]
        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 1;
        ctx.strokeRect(32, yCursor - 14, 34, 20);

        if (mark === "STAR") {
          ctx.fillStyle = "#D97706";
          ctx.font = "bold 16px sans-serif";
          ctx.fillText("★", 41, yCursor + 2);
        } else if (mark === "X") {
          ctx.fillStyle = "#DC2626";
          ctx.font = "bold 16px sans-serif";
          ctx.fillText("X", 43, yCursor + 2);
        } else {
          ctx.fillStyle = "#059669";
          ctx.font = "bold 14px sans-serif";
          ctx.fillText("O", 43, yCursor + 1);
        }

        // 선지 원문자 번호 (수험생이 고른 정답 번호에는 빨간 동그라미 마킹!)
        ctx.fillStyle = isPickedAnswer ? "#DC2626" : "#1E293B";
        ctx.font = isPickedAnswer ? "bold 15px sans-serif" : "14px sans-serif";
        ctx.fillText(circleNums[opt.optionNumber - 1], 76, yCursor);

        if (isPickedAnswer) {
          ctx.strokeStyle = "#DC2626";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(83, yCursor - 5, 11, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 선지 텍스트
        ctx.fillStyle = "#334155";
        ctx.font = "13px sans-serif";
        const shortOpt =
          opt.optionText.length > 46 ? `${opt.optionText.slice(0, 46)}...` : opt.optionText;
        ctx.fillText(shortOpt, 102, yCursor);

        yCursor += 30;
      }

      // 문항 구분선
      yCursor += 10;
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(28, yCursor);
      ctx.lineTo(canvas.width - 28, yCursor);
      ctx.stroke();
      yCursor += 26;
    }

    return canvas.toDataURL("image/jpeg", 0.9);
  }, [currentPreset, paperSelectedAnswers, paperOptionMarks]);

  // 마킹 변경 시 시험지 캔버스 즉시 업데이트
  useEffect(() => {
    renderMarkedExamPaperToCanvas();
  }, [renderMarkedExamPaperToCanvas]);

  // 스캔된 ★/X 선지들을 localStorage에 동기화하여 /study/ox 복습 페이지와 직결
  const syncScannedMarksToStorage = useCallback((questions: ScannedQuestionGrading[]) => {
    if (typeof window === "undefined") return;

    const weakCardIds: string[] = [];
    const markMap: Record<string, OptionMarkType> = {};

    for (const q of questions) {
      for (const opt of q.options) {
        markMap[opt.optionId] = opt.userMark;
        if (opt.userMark === "STAR" || opt.userMark === "X") {
          weakCardIds.push(opt.optionId);
        }
      }
    }

    localStorage.setItem(
      "housing_pro_scanned_ox_session",
      JSON.stringify({
        scannedAt: new Date().toISOString(),
        weakCardIds,
        markMap,
      })
    );
  }, []);

  // 공통 Vision AI 판독 & 채점 API 호출 함수
  const runVisionScanApi = async (
    imageDataUrl: string,
    includeClientMarkingSheet: boolean
  ) => {
    setIsScanning(true);
    setCapturedImageUrl(imageDataUrl);

    try {
      const clientMarkingSheet = includeClientMarkingSheet
        ? currentPreset.questionNumbers.map((qNum) => {
            const rawMarks = paperOptionMarks[qNum] ?? {
              1: "O",
              2: "O",
              3: "O",
              4: "O",
              5: "O",
            };
            return {
              questionNumber: qNum,
              selectedOption: paperSelectedAnswers[qNum] ?? 1,
              optionMarks: {
                "1": rawMarks[1] ?? "O",
                "2": rawMarks[2] ?? "O",
                "3": rawMarks[3] ?? "O",
                "4": rawMarks[4] ?? "O",
                "5": rawMarks[5] ?? "O",
              },
            };
          })
        : undefined;

      const response = await fetch("/api/scan/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          userId: "user-demo-housing-1",
          pageNumber: currentPreset.pageNumber,
          targetQuestionNumbers: currentPreset.questionNumbers,
          clientMarkingSheet,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.gradedQuestions)) {
        setEngineUsed(data.engineUsed || "Vision AI");
        setGradedQuestions(data.gradedQuestions);
        syncScannedMarksToStorage(data.gradedQuestions);

        if (data.reward) {
          setRewardInfo({
            earnedPmp: data.reward.earnedPmp,
            message: data.reward.message,
            isSerialVerified: data.reward.isSerialVerified ?? isSerialVerified,
          });
          if (data.reward.newBalance) {
            setUserBalance(data.reward.newBalance);
          }
        }
      }
    } catch (err) {
      console.error("[Vision Scan Error]:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // 1) 실시간 비디오 카메라에서 프레임 캡처 후 스캔
  const handleCaptureFromLiveCamera = async () => {
    if (cameraActive && videoRef.current) {
      const video = videoRef.current;
      const canvas = captureCanvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 960;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        await runVisionScanApi(dataUrl, false);
        return;
      }
    }

    // 카메라가 꺼져 있거나 웹캠이 없는 환경에서 촬영 버튼 클릭 시: 마킹된 시험지 캔버스 이미지를 캡처해 판독
    const fallbackPaperUrl = renderMarkedExamPaperToCanvas();
    await runVisionScanApi(fallbackPaperUrl, true);
  };

  // 2) 시험지 마킹 스튜디오에서 캡처 & 스캔
  const handleScanMarkedPaper = async () => {
    const dataUrl = renderMarkedExamPaperToCanvas();
    await runVisionScanApi(dataUrl, true);
  };

  // 3) 스마트폰 카메라 촬영 / 갤러리 사진 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await runVisionScanApi(dataUrl, false);
      }
    };
    reader.readAsDataURL(file);
  };

  // 결과 카드에서 수험생이 선지 O / ★ / X 마킹을 터치로 즉시 수정하는 핸들러
  const handleToggleResultOptionMark = (
    questionNumber: number,
    optionNumber: number,
    nextMark: OptionMarkType
  ) => {
    setGradedQuestions((prev) => {
      const updated = prev.map((q) => {
        if (q.questionNumber !== questionNumber) return q;
        const newOptions = q.options.map((opt) =>
          opt.optionNumber === optionNumber ? { ...opt, userMark: nextMark } : opt
        );
        const hasWeak = newOptions.some(
          (o) => o.userMark === "STAR" || o.userMark === "X"
        );
        return {
          ...q,
          isDisguisedCorrect: q.isQuestionCorrect && hasWeak,
          options: newOptions,
        };
      });
      syncScannedMarksToStorage(updated);
      return updated;
    });
  };

  // 결과 카드에서 내 선택 답안(①~⑤) 변경 시 즉시 재채점하는 핸들러
  const handleChangeSelectedAnswer = (questionNumber: number, newSelectedOption: number) => {
    setGradedQuestions((prev) => {
      const updated = prev.map((q) => {
        if (q.questionNumber !== questionNumber) return q;
        const isRight = newSelectedOption === q.correctOption;
        const hasWeak = q.options.some(
          (o) => o.userMark === "STAR" || o.userMark === "X"
        );
        return {
          ...q,
          selectedOption: newSelectedOption,
          isQuestionCorrect: isRight,
          isDisguisedCorrect: isRight && hasWeak,
        };
      });
      return updated;
    });
  };

  // 실시간 집계 계산
  const totalQuestions = gradedQuestions.length;
  const correctQuestionsCount = gradedQuestions.filter((q) => q.isQuestionCorrect).length;
  const disguisedCorrectCount = gradedQuestions.filter((q) => q.isDisguisedCorrect).length;

  let totalO = 0;
  let totalStar = 0;
  let totalX = 0;
  for (const q of gradedQuestions) {
    for (const o of q.options) {
      if (o.userMark === "O") totalO++;
      else if (o.userMark === "STAR") totalStar++;
      else if (o.userMark === "X") totalX++;
    }
  }
  const totalWeakOptions = totalStar + totalX;

  return (
    <MobileAppShell>
      {/* 상단 앱 헤더 */}
      <header className="px-4 py-3 bg-[#16161C] border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#FF5A36]" />
          <h1 className="text-sm font-black text-white">AI 카메라 채점 & O·★·X 스캐너</h1>
        </div>

        {isSerialVerified ? (
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>정품인증 (+40 PMP)</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsSerialModalOpen(true)}
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/[0.08] text-amber-300 border border-amber-500/30 flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3" />
            <span>정품 키 등록</span>
          </button>
        )}
      </header>

      {/* 시리얼 미등록 배너 */}
      {!isSerialVerified && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-amber-200 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              정품 시리얼 등록 시 스캔당 <strong>+40 PMP</strong> 즉시 적립!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSerialModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] shrink-0"
          >
            등록
          </button>
        </div>
      )}

      <div className="px-4 py-3 space-y-3.5">
        {/* 1. 스캔 입력 모드 3탭 전환 바 */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#0E0E12] p-1 rounded-2xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setInputMode("LIVE_CAMERA")}
            className={`py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition ${
              inputMode === "LIVE_CAMERA"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>실시간 카메라</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setInputMode("PAPER_MARKING");
            }}
            className={`py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition ${
              inputMode === "PAPER_MARKING"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>시험지 마킹·스캔</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setInputMode("PHOTO_UPLOAD");
            }}
            className={`py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition ${
              inputMode === "PHOTO_UPLOAD"
                ? "bg-[#FF5A36] text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>사진 업로드</span>
          </button>
        </div>

        {/* 2. 스캔할 기출문제집 페이지 선택 바 */}
        <div className="flex items-center justify-between gap-2 bg-[#16161C] px-3 py-2 rounded-xl border border-white/[0.06]">
          <span className="text-[11px] font-bold text-slate-300 shrink-0">
            📖 스캔 페이지:
          </span>
          <div className="grid grid-cols-4 gap-1 flex-1">
            {EXAM_PAGE_PRESETS.map((preset, idx) => (
              <button
                key={preset.pageNumber}
                type="button"
                onClick={() => setSelectedPresetIndex(idx)}
                className={`py-1 rounded-lg text-[10px] font-black transition ${
                  selectedPresetIndex === idx
                    ? "bg-white text-slate-950"
                    : "bg-[#0E0E12] text-slate-400 hover:text-white border border-white/[0.05]"
                }`}
              >
                p.{preset.pageNumber} ({preset.questionNumbers[0]}~{preset.questionNumbers[2]}번)
              </button>
            ))}
          </div>
        </div>

        {/* 숨김 처리된 캡처용 캔버스 & 파일 인풋 */}
        <canvas ref={captureCanvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* ================================================================= */}
        {/* 모드 A: 📷 실시간 카메라 촬영 (WebRTC getUserMedia + 뷰파인더) */}
        {/* ================================================================= */}
        {inputMode === "LIVE_CAMERA" && (
          <div className="relative rounded-3xl bg-[#0A0A0D] border border-white/[0.1] p-4 overflow-hidden shadow-2xl space-y-3">
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#121216] overflow-hidden min-h-[250px] flex flex-col items-center justify-center">
              {/* 모서리 L자 스캔 가이드라인 */}
              <span className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-[#FF5A36] rounded-tl-lg z-20 pointer-events-none" />
              <span className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-[#FF5A36] rounded-tr-lg z-20 pointer-events-none" />
              <span className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-[#FF5A36] rounded-bl-lg z-20 pointer-events-none" />
              <span className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-[#FF5A36] rounded-br-lg z-20 pointer-events-none" />

              {/* 레이저 스캔바 애니메이션 */}
              <div
                className={`absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[#FF5A36] to-transparent shadow-[0_0_12px_#FF5A36] z-20 pointer-events-none transition-all duration-700 ${
                  isScanning ? "top-3/4 opacity-100 animate-pulse" : "top-1/2 opacity-75"
                }`}
              />

              {/* 실시간 비디오 스트림 */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-[260px] object-cover ${cameraActive ? "block" : "hidden"}`}
              />

              {/* 카메라 비활성 시 안내 화면 */}
              {!cameraActive && (
                <div className="p-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF5A36]/15 border border-[#FF5A36]/40 text-[#FF5A36] flex items-center justify-center mx-auto">
                    <ScanLine className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10.5px] font-black text-[#FF7A59]">
                      문제 정답(①~⑤) 자동 채점 + 선지별 O · ★ · X 동시 판독
                    </div>
                    <h2 className="text-sm font-black text-white">
                      스마트폰 카메라로 문제집을 비추세요
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      문제에 체크한 내 답과 선지 옆 ★/X 표시를 AI가 한 번에 인식합니다
                    </p>
                  </div>

                  {cameraError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[10.5px] text-rose-200 text-left">
                      {cameraError}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startCamera("environment")}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-black flex items-center gap-1.5 border border-white/[0.1]"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span>실시간 카메라 켜기</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInputMode("PAPER_MARKING")}
                      className="px-3.5 py-2 rounded-xl bg-[#FF5A36]/20 hover:bg-[#FF5A36]/30 text-[#FF7A59] text-xs font-black flex items-center gap-1.5 border border-[#FF5A36]/30"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>시험지 직접 마킹·스캔</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 카메라 켜진 상태 상단 컨트롤 바 */}
              {cameraActive && (
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = facingMode === "environment" ? "user" : "environment";
                      setFacingMode(next);
                      startCamera(next);
                    }}
                    className="p-2 rounded-xl bg-black/70 text-white border border-white/20"
                    title="카메라 전환"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/40"
                    title="카메라 끄기"
                  >
                    <CameraOff className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 촬영 및 AI 판독 실행 버튼 */}
            <button
              type="button"
              onClick={handleCaptureFromLiveCamera}
              disabled={isScanning}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(255,90,54,0.4)] transition disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Vision AI 정답 채점 & O·★·X 판독 중...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>
                    {cameraActive
                      ? "📸 현재 카메라 화면 촬영 & AI 채점·판독"
                      : "📸 기출문제지 촬영 & AI 정답 채점·O/★/X 판독 실행"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* 모드 B: 📝 시험지 손글씨 마킹 스튜디오 (O·★·X 및 문제 답안 직접 체크 후 스캔) */}
        {/* ================================================================= */}
        {inputMode === "PAPER_MARKING" && (
          <div className="rounded-3xl bg-[#16161C] border border-white/[0.1] p-4 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div>
                <span className="text-[10px] font-black text-[#FF7A59]">
                  실제 시험지 마킹 ➔ 카메라 캡처 ➔ Vision AI 판독·채점
                </span>
                <h2 className="text-xs font-black text-white">
                  종이 시험지에 내 답안(①~⑤)과 선지별 O · ★ · X를 마킹해보세요
                </h2>
              </div>
            </div>

            {/* 문항별 답안 선택 & 선지별 O/★/X 마킹 컨트롤러 */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {currentPreset.questionNumbers.map((qNum) => {
                const qData = REAL_2026_EXAM_QUESTIONS.find((q) => q.questionNumber === qNum);
                if (!qData) return null;

                const selectedAns = paperSelectedAnswers[qNum] ?? qData.correctOption;
                const qMarks = paperOptionMarks[qNum] ?? {
                  1: "O",
                  2: "O",
                  3: "O",
                  4: "O",
                  5: "O",
                };

                return (
                  <div
                    key={qNum}
                    className="p-3 rounded-2xl bg-[#0E0E12] border border-white/[0.06] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-white">
                        제{qNum}문. <span className="text-slate-400 font-normal text-[11px]">{qData.questionText.slice(0, 28)}...</span>
                      </span>
                    </div>

                    {/* 수험생이 선택한 문제 정답 (①~⑤) */}
                    <div className="flex items-center justify-between bg-[#16161C] px-2.5 py-1.5 rounded-xl border border-white/[0.05]">
                      <span className="text-[10.5px] font-bold text-amber-300">
                        ✏️ 내가 고른 문제 답안:
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((optNum) => (
                          <button
                            key={optNum}
                            type="button"
                            onClick={() =>
                              setPaperSelectedAnswers((prev) => ({
                                ...prev,
                                [qNum]: optNum,
                              }))
                            }
                            className={`w-6 h-6 rounded-full text-[11px] font-black transition ${
                              selectedAns === optNum
                                ? "bg-rose-600 text-white ring-2 ring-rose-400"
                                : "bg-[#0E0E12] text-slate-400 hover:text-white border border-white/[0.08]"
                            }`}
                          >
                            {optNum}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 선지 1~5번 각각의 O / ★ / X 마킹 선택 */}
                    <div className="space-y-1.5">
                      {qData.options.map((opt) => {
                        const currentMark = qMarks[opt.optionNumber] ?? "O";
                        return (
                          <div
                            key={opt.id}
                            className="flex items-center justify-between gap-2 text-[11px] bg-[#141419] px-2.5 py-1.5 rounded-xl border border-white/[0.04]"
                          >
                            <span className="text-slate-300 truncate flex-1">
                              <strong className="text-white mr-1">
                                {opt.optionNumber}번.
                              </strong>
                              {opt.optionText}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              {(["O", "STAR", "X"] as OptionMarkType[]).map((m) => {
                                const label = m === "STAR" ? "★" : m;
                                const active = currentMark === m;
                                const activeStyle =
                                  m === "O"
                                    ? "bg-emerald-600 text-white"
                                    : m === "STAR"
                                    ? "bg-amber-500 text-slate-950"
                                    : "bg-rose-600 text-white";

                                return (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() =>
                                      setPaperOptionMarks((prev) => ({
                                        ...prev,
                                        [qNum]: {
                                          ...(prev[qNum] ?? {
                                            1: "O",
                                            2: "O",
                                            3: "O",
                                            4: "O",
                                            5: "O",
                                          }),
                                          [opt.optionNumber]: m,
                                        },
                                      }))
                                    }
                                    className={`w-6 h-6 rounded-lg text-[10.5px] font-black transition ${
                                      active
                                        ? activeStyle
                                        : "bg-[#0A0A0D] text-slate-500 border border-white/[0.06]"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 실제 생성된 종이 시험지 캔버스 프리뷰 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                <span>📄 카메라 스캔 대상 실제 시험지 렌더링 프리뷰</span>
                <span className="font-mono text-[#FF7A59]">720×920 JPEG</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/[0.12] bg-[#FAF8F2]">
                <canvas
                  ref={paperCanvasRef}
                  className="w-full h-auto block"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleScanMarkedPaper}
              disabled={isScanning}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(255,90,54,0.4)] transition disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>마킹된 시험지 Vision AI 판독 및 채점 중...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>📸 위 마킹 시험지 촬영 스캔 & 자동 채점 실행</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* 모드 C: 🖼️ 스마트폰 카메라 사진 직접 촬영 / 갤러리 이미지 업로드 */}
        {/* ================================================================= */}
        {inputMode === "PHOTO_UPLOAD" && (
          <div className="rounded-3xl bg-[#16161C] border border-white/[0.1] p-5 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#FF5A36]/15 border border-[#FF5A36]/40 text-[#FF5A36] flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-black text-white">
                스마트폰 기본 카메라 촬영 또는 시험지 사진 선택
              </h2>
              <p className="text-[11px] text-slate-400">
                종이 문제집에 답안과 O · ★ · X를 표시한 사진을 올리면 AI가 즉시 채점하고 선지를 분류합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              <Upload className="w-4 h-4" />
              <span>사진 찍기 / 갤러리에서 문제집 이미지 선택</span>
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* 🎯 3. AI 카메라 스캔 결과: 문제 정답 채점 + 선지별 O · ★ · X 판별 보드 */}
        {/* ================================================================= */}
        {gradedQuestions.length > 0 && (
          <div className="rounded-3xl bg-[#1A1A21] border border-[#FF5A36]/40 p-4 space-y-4 shadow-2xl">
            {/* 상단 요약 헤더 */}
            <div className="flex items-start justify-between gap-2 border-b border-white/[0.08] pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FF5A36]/20 text-[#FF7A59]">
                    {engineUsed}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    p.{currentPreset.pageNumber} 판독 완료
                  </span>
                </div>
                <h3 className="text-sm font-black text-white pt-0.5">
                  문제 자동 채점 & 선지 O · ★ · X 분류 결과
                </h3>
              </div>

              {rewardInfo && rewardInfo.earnedPmp > 0 ? (
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-black text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/30">
                    +{rewardInfo.earnedPmp} PMP 적립
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    잔액 {userBalance.toLocaleString()}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSerialModalOpen(true)}
                  className="text-[10px] font-black text-amber-300 bg-amber-950/70 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1 shrink-0"
                >
                  <Lock className="w-3 h-3" />
                  <span>정품인증 시 +40 PMP</span>
                </button>
              )}
            </div>

            {/* 촬영 이미지 썸네일 & 문제 채점 스코어보드 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-[#121216] border border-white/[0.06] text-center">
                <div className="text-[10px] text-slate-400 font-bold">문제 정답률</div>
                <div className="text-base font-black text-white mt-0.5">
                  {correctQuestionsCount} / {totalQuestions}문항
                </div>
                <div className="text-[10px] font-bold text-emerald-400">
                  ({Math.round((correctQuestionsCount / Math.max(1, totalQuestions)) * 100)}점)
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#121216] border border-white/[0.06] text-center">
                <div className="text-[10px] text-slate-400 font-bold">위장 정답 적발</div>
                <div className="text-base font-black text-amber-400 mt-0.5">
                  {disguisedCorrectCount}문항
                </div>
                <div className="text-[10px] text-amber-300/80">
                  맞혔지만 ★/X 포함
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#121216] border border-white/[0.06] text-center">
                <div className="text-[10px] text-slate-400 font-bold">선지 O·★·X 구분</div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-black mt-1">
                  <span className="text-emerald-400">O {totalO}</span>
                  <span className="text-amber-400">★ {totalStar}</span>
                  <span className="text-rose-400">X {totalX}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  약점 {totalWeakOptions}개 추출
                </div>
              </div>
            </div>

            {/* 캡처된 이미지 미니 프리뷰 */}
            {capturedImageUrl && (
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#121216] border border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedImageUrl}
                  alt="스캔된 시험지"
                  className="w-14 h-16 object-cover rounded-lg border border-white/10 shrink-0"
                />
                <div className="text-[11px] text-slate-300 space-y-0.5">
                  <div className="font-black text-white flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>카메라 이미지 비전 인식 완료</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-snug">
                    아래에서 문항별 <strong>내 답안 채점 결과(⭕/❌)</strong>와 선지별 <strong>O · ★ · X 구분</strong>을 확인·터치 보정할 수 있습니다.
                  </p>
                </div>
              </div>
            )}

            {/* 문항별 정답 체크 & 5개 선지 O·★·X 상세 카드 리스트 */}
            <div className="space-y-3">
              {gradedQuestions.map((q) => (
                <div
                  key={q.questionNumber}
                  className={`p-3.5 rounded-2xl border space-y-3 ${
                    q.isQuestionCorrect
                      ? "bg-[#121615] border-emerald-500/30"
                      : "bg-[#191215] border-rose-500/40"
                  }`}
                >
                  {/* 문항 채점 결과 배너 */}
                  <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-white">
                          제{q.questionNumber}문
                        </span>

                        {q.isQuestionCorrect ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-black flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>⭕ 문제 정답! (내 답 {q.selectedOption}번)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/40 text-[10.5px] font-black flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>
                              ❌ 오답 (내 답 {q.selectedOption}번 → 실제 정답 {q.correctOption}번)
                            </span>
                          </span>
                        )}

                        {q.isDisguisedCorrect && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>위장정답 주의</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11.5px] text-slate-300 font-bold leading-snug">
                        {q.questionText}
                      </p>
                    </div>
                  </div>

                  {/* 내 선택 답안 빠른 수정 바 */}
                  <div className="flex items-center justify-between text-[10.5px] bg-black/30 px-2.5 py-1.5 rounded-xl">
                    <span className="text-slate-400">
                      인식된 내 답안: <strong className="text-white">{q.selectedOption}번</strong>{" "}
                      / 실제 정답: <strong className="text-emerald-400">{q.correctOption}번</strong>
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleChangeSelectedAnswer(q.questionNumber, num)}
                          className={`w-5 h-5 rounded-full text-[10px] font-black transition ${
                            q.selectedOption === num
                              ? q.isQuestionCorrect
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-rose-500 text-white"
                              : num === q.correctOption
                              ? "border border-emerald-400 text-emerald-300"
                              : "bg-white/[0.06] text-slate-400"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5개 선지 각각의 O / ★ / X 판별 및 실제 선지 O/X 해설 */}
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isAnswerOpt = opt.optionNumber === q.correctOption;
                      return (
                        <div
                          key={opt.optionId}
                          className={`p-2.5 rounded-xl border text-[11px] space-y-1.5 transition ${
                            opt.userMark === "STAR"
                              ? "bg-amber-950/25 border-amber-500/40"
                              : opt.userMark === "X"
                              ? "bg-rose-950/25 border-rose-500/40"
                              : "bg-[#14141A] border-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`font-black ${
                                    isAnswerOpt ? "text-emerald-400" : "text-slate-300"
                                  }`}
                                >
                                  {opt.optionNumber}번 선지
                                  {isAnswerOpt && " (문제 정답 선지)"}
                                </span>

                                <span
                                  className={`text-[9.5px] font-black px-1.5 py-0.2 rounded ${
                                    opt.isCorrectStatement
                                      ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                                      : "bg-rose-950 text-rose-300 border border-rose-500/30"
                                  }`}
                                >
                                  법령상 {opt.isCorrectStatement ? "옳음(O)" : "틀림(X)"}
                                </span>
                              </div>

                              <p className="text-slate-200 leading-snug">{opt.optionText}</p>
                            </div>

                            {/* O / ★ / X 구분 버튼 (터치로 즉시 변경 가능) */}
                            <div className="flex items-center gap-1 shrink-0">
                              {(["O", "STAR", "X"] as OptionMarkType[]).map((markType) => {
                                const active = opt.userMark === markType;
                                const btnStyle =
                                  markType === "O"
                                    ? active
                                      ? "bg-emerald-600 text-white shadow"
                                      : "bg-black/40 text-slate-500"
                                    : markType === "STAR"
                                    ? active
                                      ? "bg-amber-400 text-slate-950 shadow"
                                      : "bg-black/40 text-slate-500"
                                    : active
                                    ? "bg-rose-600 text-white shadow"
                                    : "bg-black/40 text-slate-500";

                                return (
                                  <button
                                    key={markType}
                                    type="button"
                                    onClick={() =>
                                      handleToggleResultOptionMark(
                                        q.questionNumber,
                                        opt.optionNumber,
                                        markType
                                      )
                                    }
                                    className={`w-6 h-6 rounded-lg font-black text-[10.5px] transition ${btnStyle}`}
                                  >
                                    {markType === "STAR" ? "★" : markType}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* ★ 또는 X로 분류된 선지(또는 오답 문항)는 즉시 1줄 함정 해설 노출 */}
                          {(opt.userMark !== "O" || !q.isQuestionCorrect) && (
                            <div className="text-[10.5px] text-amber-300/90 bg-black/30 px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2">
                              <span>💡 {opt.trapCorrection}</span>
                              <span className="text-[9.5px] text-slate-400 font-mono shrink-0">
                                {opt.masteryTier}회독
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 하단: 검출된 ★/X 약점 선지 3초 컷 O/X 복습 직결 버튼 */}
            <button
              type="button"
              onClick={() => router.push("/study/ox?mode=scan")}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5A36] to-[#FF8008] hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(255,90,54,0.4)] transition"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>
                검출된 ★/X 약점 선지 ({totalWeakOptions}개) 3초 컷 O/X 복습 시작
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 정품 시리얼 등록 모달 (z-50) */}
      <SerialRegisterModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        onSuccess={(data) => {
          setIsSerialVerified(true);
          setVerifiedBookTitle(data.bookTitle);
        }}
      />
    </MobileAppShell>
  );
}
