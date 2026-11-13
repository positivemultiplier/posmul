/**
 * Housing-Pro 기출문제 5선지 단위 분해 & 1~5회독 티어링 LLM 배치 스크립트
 * 
 * [목적]
 * 5지선다 기출문제를 입력받아:
 * 1) 5개 개별 선지 단위로 분해
 * 2) 1~5회독 난이도 티어 (1: 20% 기초, 2: 40% 빈출기한, 3: 60% 예외, 4: 80% 판례, 5: 100% 지엽함정) 배정
 * 3) 3초 컷 1줄 함정 키워드 교정 해설(trap_summary) 생성
 * 4) 근거 법령 조항(legal_citation) 매핑
 * 
 * [사용법]
 * tsx scripts/parse-exam-to-options.ts --input=./raw-exam.txt --output=./parsed-exam.json
 * (API 키 없을 시 내장된 골든 샘플로 시뮬레이션 동작)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

export interface ParsedOption {
  optionNumber: number;
  optionText: string;
  isCorrect: boolean;
  masteryTier: 1 | 2 | 3 | 4 | 5;
  trapSummary: string;
  legalCitation: string;
}

export interface ParsedQuestion {
  examYear: number;
  examRound: number;
  subject: "RELATION_LAW" | "MANAGEMENT_PRACTICE";
  questionNumber: number;
  questionText: string;
  boxContent?: string;
  correctOptionNumber: number;
  options: ParsedOption[];
}

const GOLDEN_SAMPLE_PROMPT = `
당신은 주택관리사보 2차 국가공인시험(공동주택관리실무 / 주택관리관계법규)의 최고 수험 전문가입니다.
주어진 5지선다 기출문제를 분석하여 아래 JSON 규격에 맞게 분해하세요:

[규칙]
1. 각 문항의 5개 선지(1~5번)를 개별 선지 객체로 쪼갭니다.
2. 각 선지의 masteryTier(1~5)를 다음 기준에 따라 엄격히 분류하세요:
   - 1등급 (20% 1회독): 법률의 대원칙, 기초 용어, 가장 핵심적인 기본 뼈대 선지
   - 2등급 (40% 2회독): 시험에 매년 반복 출제되는 법정 기한, 숫자, 정족수 선지
   - 3등급 (60% 3회독): 본문 뒤에 붙는 '다만 ~' 단서 조항 및 예외 규정 선지
   - 4등급 (80% 4회독): 대법원 판례, 헌법재판소 결정, 국토교통부 주요 유권해석 선지
   - 5등급 (100% 5회독): 수험생을 떨어뜨리기 위한 지엽적 함정, 구석 시행규칙 서식 선지
3. trapSummary는 스마트폰 출퇴근길에 3초 만에 훑을 수 있는 "1줄 직관 교정 문장"으로 작성하세요.
   (예: "30일 전이 아닌 회계연도 개시 1개월 전까지 제출해야 합니다.")
4. legalCitation은 근거 법조문(예: "공동주택관리법 시행령 제26조 제1항")을 명확히 기재하세요.
`;

// 샘플 원문 기출문제 (테스트용)
const SAMPLE_RAW_TEXT = `
[제27회 관계법규 14번]
14. 공동주택관리법령상 관리비등의 사업계획서 및 예산서에 관한 설명으로 옳지 않은 것은?
① 관리주체는 다음 회계연도에 관한 사업계획서 및 예산서를 작성하여야 한다.
② 관리주체는 사업계획서 및 예산서를 회계연도 개시 30일 전까지 입주자대표회의에 제출하여 승인을 받아야 한다.
③ 승인받은 사업계획 및 예산을 변경하려면 입주자대표회의의 승인을 다시 받아야 한다.
④ 관리주체는 매 분기말 다음 달 말일까지 관리비등의 집행을 위한 세부 사업계획서를 작성하여 입주자대표회의에 보고할 수 있다.
⑤ 관리주체는 회계연도마다 사업실적서 및 결산서를 작성하여 회계연도 종료 후 2개월 이내에 입주자대표회의에 제출하여야 한다.
(정답: 2번)
`;

async function main() {
  console.log("==================================================================");
  console.log("🚀 Housing-Pro 기출문제 선지 분해 & 회독 티어링 배치 파이프라인");
  console.log("==================================================================");

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("ℹ️ GEMINI_API_KEY 환경변수가 설정되지 않아, 내장된 골든 샘플로 파싱을 시뮬레이션합니다.\n");

    const sampleOutput: ParsedQuestion = {
      examYear: 2024,
      examRound: 27,
      subject: "RELATION_LAW",
      questionNumber: 14,
      questionText: "공동주택관리법령상 관리비등의 사업계획서 및 예산서에 관한 설명으로 옳지 않은 것은?",
      correctOptionNumber: 2,
      options: [
        {
          optionNumber: 1,
          optionText: "관리주체는 다음 회계연도에 관한 사업계획서 및 예산서를 작성하여야 한다.",
          isCorrect: true,
          masteryTier: 1,
          trapSummary: "관리주체의 사업계획서 수립은 가장 기초적인 의무 원칙입니다.",
          legalCitation: "공동주택관리법 시행령 제26조 제1항",
        },
        {
          optionNumber: 2,
          optionText: "관리주체는 사업계획서 및 예산서를 회계연도 개시 30일 전까지 입주자대표회의에 제출하여 승인을 받아야 한다.",
          isCorrect: false,
          masteryTier: 2,
          trapSummary: "30일 전이 아닌 '회계연도 개시 1개월 전까지' 제출해야 합니다.",
          legalCitation: "공동주택관리법 시행령 제26조 제1항",
        },
        {
          optionNumber: 3,
          optionText: "승인받은 사업계획 및 예산을 변경하려면 입주자대표회의의 승인을 다시 받아야 한다.",
          isCorrect: true,
          masteryTier: 2,
          trapSummary: "예산 변경 시에도 입대의 재승인이 필수입니다.",
          legalCitation: "공동주택관리법 시행령 제26조 제2항",
        },
        {
          optionNumber: 4,
          optionText: "관리주체는 매 분기말 다음 달 말일까지 관리비등의 집행을 위한 세부 사업계획서를 작성하여 입주자대표회의에 보고할 수 있다.",
          isCorrect: true,
          masteryTier: 3,
          trapSummary: "분기별 집행 현황 보고 규정(보고할 수 있다)에 부합합니다.",
          legalCitation: "공동주택관리법 시행규칙 제7조",
        },
        {
          optionNumber: 5,
          optionText: "관리주체는 회계연도마다 사업실적서 및 결산서를 작성하여 회계연도 종료 후 2개월 이내에 입주자대표회의에 제출하여야 한다.",
          isCorrect: true,
          masteryTier: 2,
          trapSummary: "결산서는 회계연도 종료 후 '2개월 이내' 제출이 맞습니다.",
          legalCitation: "공동주택관리법 시행령 제26조 제3항",
        },
      ],
    };

    const outDir = path.join(__dirname, "../sample-output");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outFile = path.join(outDir, "parsed-exam-sample.json");
    fs.writeFileSync(outFile, JSON.stringify([sampleOutput], null, 2), "utf-8");

    console.log(`✅ 골든 샘플 분해 결과가 생성되었습니다: ${outFile}`);
    console.log("\n[생성된 선지 요약]");
    sampleOutput.options.forEach((opt) => {
      console.log(
        `  • ${opt.optionNumber}번 선지 [${opt.masteryTier}회독 티어] (${opt.isCorrect ? "O" : "X-함정"}) -> ${opt.trapSummary}`
      );
    });
    return;
  }

  // 실제 Gemini API 호출 파이프라인
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  console.log("🤖 Gemini 모델을 호출하여 원문 기출문제를 선지 단위로 파싱 중...");

  const prompt = `${GOLDEN_SAMPLE_PROMPT}

[입력 기출문제 원문]
${SAMPLE_RAW_TEXT}

반드시 JSON 포맷만 반환하세요. JSON Schema: ParsedQuestion[]
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsedData = JSON.parse(cleanedJson);

    const outDir = path.join(__dirname, "../sample-output");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outFile = path.join(outDir, "parsed-exam-result.json");
    fs.writeFileSync(outFile, JSON.stringify(parsedData, null, 2), "utf-8");

    console.log(`🎉 성공적으로 기출문제가 선지 단위로 분해되었습니다: ${outFile}`);
  } catch (error) {
    console.error("❌ LLM 파싱 중 오류 발생:", error);
  }
}

main().catch(console.error);

