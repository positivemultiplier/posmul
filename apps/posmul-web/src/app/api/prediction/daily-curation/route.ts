import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { JOB_GROUPS } from "@/shared/constants/regions-and-jobs";

export const dynamic = "force-dynamic";

export interface DailyCurationItem {
  id: string;
  gameId?: string;
  title: string;
  summary: string;
  category: string;
  impactArea: string; // 예: "고용·노동", "산업규제", "세무·금융", "기술혁신"
  options: Array<{ id: string; label: string; odds?: number }>;
  closingDateText: string;
  participantsCount: number;
  totalBetAmount: number;
  sourceType: "BILL" | "NEWS" | "GAME";
  isOfficialGame: boolean;
}

// 직업군별 폴백 시의성 추천 데이터 (게임 DB에 부족할 경우 풍성하게 채워주는 프리미엄 큐레이션)
const JOB_PREDICTION_PRESETS: Record<string, DailyCurationItem[]> = {
  IT_DEVELOPER: [
    {
      id: "cur-it-1",
      title: "인공지능(AI) 기본법 연내 국회 본회의 최종 통과 여부",
      summary: "AI 생성물 워터마크 표시 의무화 및 고위험 AI 규제 체계를 담은 AI 기본법의 연내 통과를 예측합니다.",
      category: "정책/IT",
      impactArea: "기술규제",
      options: [{ id: "opt_1", label: "가결 (통과)" }, { id: "opt_2", label: "부결/이월" }],
      closingDateText: "D-14 (2026.10.04)",
      participantsCount: 142,
      totalBetAmount: 24500,
      sourceType: "BILL",
      isOfficialGame: true,
    },
    {
      id: "cur-it-2",
      title: "글로벌 빅테크 망사용료 의무화 법안 국회 가결될까?",
      summary: "국내 ISP와 해외 CP 간 망사용료 공정 분담 법제화가 정기국회에서 타결될 것인지 예측합니다.",
      category: "IT/통신",
      impactArea: "산업비용",
      options: [{ id: "opt_1", label: "의무화 통과" }, { id: "opt_2", label: "자율협상 유지" }],
      closingDateText: "D-20 (2026.10.10)",
      participantsCount: 98,
      totalBetAmount: 18200,
      sourceType: "BILL",
      isOfficialGame: true,
    },
    {
      id: "cur-it-3",
      title: "IT 스타트업 주 52시간제 '연구개발 직군 예외 유연화' 연내 도입 여부",
      summary: "R&D 및 SW 개발직군에 대한 주 52시간 유연근무제 확대 개정안의 입법 실현 가능성을 예측합니다.",
      category: "노동/정책",
      impactArea: "근무환경",
      options: [{ id: "opt_1", label: "도입 확정" }, { id: "opt_2", label: "현행 유지" }],
      closingDateText: "D-30 (2026.10.20)",
      participantsCount: 215,
      totalBetAmount: 38900,
      sourceType: "NEWS",
      isOfficialGame: true,
    },
    {
      id: "cur-it-4",
      title: "국산 파운데이션 LLM 모델 글로벌 벤치마크 TOP 5 진입 성공할까?",
      summary: "정부 및 국내 포털 컨소시엄이 공개하는 한국어 특화 초거대 AI 모델의 글로벌 MMLU 순위 진입을 전망합니다.",
      category: "기술혁신",
      impactArea: "산업경쟁력",
      options: [{ id: "opt_1", label: "TOP 5 진입" }, { id: "opt_2", label: "진입 실패" }],
      closingDateText: "D-45 (2026.11.04)",
      participantsCount: 88,
      totalBetAmount: 15400,
      sourceType: "GAME",
      isOfficialGame: true,
    },
    {
      id: "cur-it-5",
      title: "공공 소프트웨어 사업 대기업 참여 제한 전면 해제 개정안 통과 여부",
      summary: "행정망 전산사고 재발 방지를 위한 대기업 공공 SI 참여 허용 소프트웨어진흥법 개정안을 예측합니다.",
      category: "공공SW",
      impactArea: "수주시장",
      options: [{ id: "opt_1", label: "전면 해제 통과" }, { id: "opt_2", label: "제한 유지" }],
      closingDateText: "D-25 (2026.10.15)",
      participantsCount: 167,
      totalBetAmount: 29800,
      sourceType: "BILL",
      isOfficialGame: true,
    },
  ],
  SELF_EMPLOYED: [
    {
      id: "cur-self-1",
      title: "주요 배달앱 중개수수료 5% 상한제 법제화 연내 실현될까?",
      summary: "외식업 소상공인 부담 완화를 위한 정부·국회의 배달플랫폼 상생협약 및 법정 수수료 상한제 도입 여부입니다.",
      category: "상생/유통",
      impactArea: "영업이익",
      options: [{ id: "opt_1", label: "수수료 상한 법제화" }, { id: "opt_2", label: "자율 상생안 합의" }],
      closingDateText: "D-15 (2026.10.05)",
      participantsCount: 312,
      totalBetAmount: 54000,
      sourceType: "BILL",
      isOfficialGame: true,
    },
    {
      id: "cur-self-2",
      title: "2027년도 최저임금 시급 1만 500원 돌파 여부",
      summary: "고물가 속 최저임금위원회의 내년도 최저시급 심의 결과가 10,500원 이상으로 타결될 것인지 예측합니다.",
      category: "노동/고용",
      impactArea: "인건비",
      options: [{ id: "opt_1", label: "10,500원 이상" }, { id: "opt_2", label: "10,500원 미만" }],
      closingDateText: "D-40 (2026.10.30)",
      participantsCount: 420,
      totalBetAmount: 88000,
      sourceType: "NEWS",
      isOfficialGame: true,
    },
    {
      id: "cur-self-3",
      title: "2027년도 지역화폐(지역사랑상품권) 국비 지원 예산 증액안 통과될까?",
      summary: "골목상권 활성화를 위한 지역화폐 국비 지원 예산의 본회의 원안 통과 여부를 예측합니다.",
      category: "예산/정책",
      impactArea: "골목매출",
      options: [{ id: "opt_1", label: "증액 통과" }, { id: "opt_2", label: "삭감/유지" }],
      closingDateText: "D-50 (2026.11.09)",
      participantsCount: 195,
      totalBetAmount: 32000,
      sourceType: "BILL",
      isOfficialGame: true,
    },
    {
      id: "cur-self-4",
      title: "상가건물 임대차보호법 계약갱신청구권 10년 ➔ 12년 확대 개정안",
      summary: "영세 자영업자의 영업권 안정을 위한 임대차 갱신 기간 연장안의 입법 가능성을 예측합니다.",
      category: "부동산/상가",
      impactArea: "임대비용",
      options: [{ id: "opt_1", label: "가결 (확대)" }, { id: "opt_2", label: "부결 (현행10년)" }],
      closingDateText: "D-28 (2026.10.18)",
      participantsCount: 178,
      totalBetAmount: 26500,
      sourceType: "BILL",
      isOfficialGame: true,
    },
    {
      id: "cur-self-5",
      title: "간이과세자 적용 기준 연매출 1억 2천만원 상향안 시행 여부",
      summary: "소상공인 세부담 완화를 위한 부가가치세법 간이과세 기준액 상향 개정안의 시행 시점을 예측합니다.",
      category: "세무/재정",
      impactArea: "세무부담",
      options: [{ id: "opt_1", label: "연내 시행" }, { id: "opt_2", label: "보류/유예" }],
      closingDateText: "D-35 (2026.10.25)",
      participantsCount: 220,
      totalBetAmount: 39500,
      sourceType: "NEWS",
      isOfficialGame: true,
    },
  ],
  FINANCE: [
    {
      id: "cur-fin-1",
      title: "금융투자소득세(금투세) 최종 폐지 입법 국회 본회의 처리 여부",
      summary: "국내 주식시장 세제 불확실성 해소를 위한 금투세 폐지 개정안의 본회의 최종 가결을 예측합니다.",
      category: "세무/금융",
      impactArea: "증시수급",
      options: [{ id: "opt_1", label: "폐지 가결" }, { id: "opt_2", label: "유예/수정" }],
      closingDateText: "D-10 (2026.09.30)",
      participantsCount: 890,
      totalBetAmount: 165000,
      sourceType: "BILL",
      isOfficialGame: true,
    },
    {
      id: "cur-fin-2",
      title: "한국은행 금융통화위원회 다음 회의에서 기준금리 인하 단행할까?",
      summary: "소비 진작과 가계부채 관리를 고려한 차기 금통위 기준금리 0.25%p 인하 여부를 전망합니다.",
      category: "통화/거시",
      impactArea: "유동성",
      options: [{ id: "opt_1", label: "0.25%p 인하" }, { id: "opt_2", label: "동결" }],
      closingDateText: "D-22 (2026.10.12)",
      participantsCount: 650,
      totalBetAmount: 112000,
      sourceType: "NEWS",
      isOfficialGame: true,
    },
    {
      id: "cur-fin-3",
      title: "코스피(KOSPI) 지수 2026년 4분기 2,850선 돌파 마감 여부",
      summary: "반도체 수출 호조와 밸류업 프로그램 확산에 힘입은 코스피 지수의 4분기 최고치 경신 여부입니다.",
      category: "증시전망",
      impactArea: "투자수익",
      options: [{ id: "opt_1", label: "2,850선 돌파" }, { id: "opt_2", label: "2,850선 미달" }],
      closingDateText: "D-60 (2026.11.19)",
      participantsCount: 510,
      totalBetAmount: 94000,
      sourceType: "GAME",
      isOfficialGame: true,
    },
    {
      id: "cur-fin-4",
      title: "공매도 전산시스템(NSDS) 구축 완료 및 전면 재개 시점 준수 여부",
      summary: "불법 무차입 공매도 방지를 위한 중앙전산시스템 구축 완료 및 예정 기한 내 재개 여부를 예측합니다.",
      category: "제도/시장",
      impactArea: "시장투명성",
      options: [{ id: "opt_1", label: "예정일 재개" }, { id: "opt_2", label: "추가 연기" }],
      closingDateText: "D-30 (2026.10.20)",
      participantsCount: 380,
      totalBetAmount: 67000,
      sourceType: "NEWS",
      isOfficialGame: true,
    },
    {
      id: "cur-fin-5",
      title: "스트레스 DSR 3단계 규제 2027년 상반기 예정대로 전국 확대 시행될까?",
      summary: "가계대출 총량 관리를 위한 스트레스 DSR의 제2금융권 및 전세자금대출 확대 여부를 예측합니다.",
      category: "부동산/대출",
      impactArea: "대출한도",
      options: [{ id: "opt_1", label: "원안 시행" }, { id: "opt_2", label: "유예/완화" }],
      closingDateText: "D-45 (2026.11.04)",
      participantsCount: 290,
      totalBetAmount: 51000,
      sourceType: "BILL",
      isOfficialGame: true,
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobGroup = searchParams.get("jobGroup") || "IT_DEVELOPER";

    const targetJob = JOB_GROUPS.find((j) => j.id === jobGroup) || JOB_GROUPS[0];
    const keywords = targetJob.keywords;

    // 1. DB에서 활성 상태인 예측 게임 조회
    const { data: dbGames } = await supabaseAdmin
      .schema("prediction")
      .from("prediction_games")
      .select("game_id, title, description, category, game_options, closing_date, total_participants, total_bet_amount")
      .eq("status", "ACTIVE")
      .limit(20);

    const mappedGames: DailyCurationItem[] = [];

    (dbGames || []).forEach((g) => {
      const matchKeyword = keywords.some(
        (kw) => g.title.includes(kw) || (g.description && g.description.includes(kw))
      );

      if (matchKeyword) {
        const rawOptions = (g.game_options as any)?.options || [];
        mappedGames.push({
          id: g.game_id,
          gameId: g.game_id,
          title: g.title,
          summary: g.description || "이 예측에 대한 직무 영향도를 분석하고 투표하세요.",
          category: g.category || "일반예측",
          impactArea: "직무관련정책",
          options: rawOptions.map((o: any) => ({ id: o.id, label: o.label })),
          closingDateText: g.closing_date ? new Date(g.closing_date).toLocaleDateString("ko-KR") : "마감 임박",
          participantsCount: g.total_participants || 0,
          totalBetAmount: Number(g.total_bet_amount) || 0,
          sourceType: "GAME",
          isOfficialGame: true,
        });
      }
    });

    // 2. 직업군별 큐레이션 프리셋과 조합하여 정확히 5개 맞춤 세트 구성
    const presetList = JOB_PREDICTION_PRESETS[jobGroup] || JOB_PREDICTION_PRESETS.IT_DEVELOPER;
    const combined: DailyCurationItem[] = [...mappedGames];

    presetList.forEach((preset) => {
      if (combined.length < 5 && !combined.some((c) => c.title === preset.title)) {
        combined.push(preset);
      }
    });

    const final5 = combined.slice(0, 5);

    return NextResponse.json({
      success: true,
      jobGroup: targetJob.id,
      jobName: targetJob.name,
      jobIcon: targetJob.icon,
      jobDescription: targetJob.description,
      items: final5,
    });
  } catch (error: any) {
    console.error("[Daily Curation API Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
