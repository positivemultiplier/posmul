import * as fs from "fs";
import * as path from "path";

export interface ExtractedQuestionRaw {
  questionNumber: number;
  questionText: string;
  boxContent?: string;
  options: Array<{
    optionNumber: number;
    optionText: string;
  }>;
}

export function parseExamRawText(rawText: string): ExtractedQuestionRaw[] {
  // 탭 문자 공백으로 정규화
  const text = rawText.replace(/\t+/g, " ");

  // 1. 페이지 머리글/바닥글 제거
  // 예: "2026년도 제29회 주택관리사보 2차 1교시 (25 – 1)" 및 "-- 1 of 25 --"
  const cleanedText = text
    .replace(/\d{4}년도\s+제\d+회\s+주택관리사보[^\n]+/g, "")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/g, "")
    .replace(/주택관리관계법규\(객관식\)/g, "");

  // 문항 번호 정규식: 1. ~ 40.
  // 숫자 뒤 점과 공백으로 시작하는 블록들 분할
  const questionRegex = /(?:^|\n)\s*(\d+)\.\s+([\s\S]*?)(?=(?:\n\s*\d+\.\s+|$))/g;

  const questions: ExtractedQuestionRaw[] = [];
  let match: RegExpExecArray | null;

  while ((match = questionRegex.exec(cleanedText)) !== null) {
    const qNum = parseInt(match[1], 10);
    const qBody = match[2].trim();

    // 1~40번 범위만 처리
    if (qNum < 1 || qNum > 50) continue;

    // 선지 기호 분리: ①, ②, ③, ④, ⑤
    const optionMatches = [
      { num: 1, idx: qBody.indexOf("①") },
      { num: 2, idx: qBody.indexOf("②") },
      { num: 3, idx: qBody.indexOf("③") },
      { num: 4, idx: qBody.indexOf("④") },
      { num: 5, idx: qBody.indexOf("⑤") },
    ].filter((o) => o.idx !== -1);

    if (optionMatches.length < 5) {
      // 5지선다가 아닌 경우(주관식/단답형 등)
      continue;
    }

    // 선지 시작 전까지가 문제 본문 + 박스 내용
    const questionHeader = qBody.slice(0, optionMatches[0].idx).trim();

    // 박스(ㄱ, ㄴ, ㄷ, ㄹ 등) 추출
    let questionText = questionHeader;
    let boxContent: string | undefined;

    const boxStartIdx = questionHeader.search(/(?:ㄱ\.|<보\s*기>|\[보\s*기\])/);
    if (boxStartIdx !== -1) {
      questionText = questionHeader.slice(0, boxStartIdx).trim();
      boxContent = questionHeader.slice(boxStartIdx).trim();
    }

    // 선지 5개 텍스트 추출
    const options: Array<{ optionNumber: number; optionText: string }> = [];
    for (let i = 0; i < 5; i++) {
      const currentStart = optionMatches[i].idx + 1; // 기호 다음부터
      const nextStart = i < 4 ? optionMatches[i + 1].idx : qBody.length;
      const optText = qBody.slice(currentStart, nextStart).trim().replace(/\s+/g, " ");

      options.push({
        optionNumber: i + 1,
        optionText: optText,
      });
    }

    questions.push({
      questionNumber: qNum,
      questionText: questionText.replace(/\s+/g, " "),
      boxContent: boxContent?.replace(/\s+/g, " "),
      options,
    });
  }

  return questions;
}

async function main() {
  const txtPath = path.join(__dirname, "../sample-output/extracted-2026-exam.txt");
  if (!fs.existsSync(txtPath)) {
    console.error(`파일을 찾을 수 없습니다: ${txtPath}`);
    return;
  }

  const rawText = fs.readFileSync(txtPath, "utf-8");
  const questions = parseExamRawText(rawText);

  console.log(`🎉 5지선다 문항 분해 완료: 총 ${questions.length}문항 (선지 총 ${questions.length * 5}개)`);

  // 첫 3문항 출력
  questions.slice(0, 3).forEach((q) => {
    console.log(`\n========================================`);
    console.log(`[문항 ${q.questionNumber}] ${q.questionText}`);
    if (q.boxContent) {
      console.log(`📦 보기: ${q.boxContent}`);
    }
    q.options.forEach((opt) => {
      console.log(`   ${opt.optionNumber}) ${opt.optionText}`);
    });
  });

  const outJson = path.join(__dirname, "../sample-output/parsed-2026-questions.json");
  fs.writeFileSync(outJson, JSON.stringify(questions, null, 2), "utf-8");
  console.log(`\n💾 ${questions.length}문항 분해 결과가 JSON으로 저장되었습니다: ${outJson}`);
}

main().catch(console.error);

