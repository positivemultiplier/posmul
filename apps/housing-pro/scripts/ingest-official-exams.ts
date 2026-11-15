import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
// @ts-expect-error pdf-parse v2 export
import { PDFParse } from "pdf-parse";

type ImportanceTier = "S" | "A" | "B" | "C";

interface OfficialAnswersJson {
  first: Record<
    string,
    {
      year: number;
      type: string;
      회계원리: Array<number | number[]>;
      공동주택시설개론: Array<number | number[]>;
      민법: Array<number | number[]>;
    }
  >;
  second: Record<
    string,
    {
      year: number;
      type: string;
      주택관리관계법규: Array<number | number[]>;
      공동주택관리실무: Array<number | number[]>;
    }
  >;
}

interface ParsedQuestionRecord {
  exam_year: number;
  exam_round: number;
  exam_stage: "1차" | "2차";
  subject: string;
  question_number: number;
  question_type: "OBJECTIVE" | "SUBJECTIVE";
  question_text: string;
  box_content: string | null;
  correct_option_number: number | null;
  correct_options: number[] | null;
  subjective_answer: string | null;
  chapter_code: string;
  chapter_title: string;
  importance_tier: ImportanceTier;
  metadata: Record<string, unknown>;
  options: Array<{
    option_number: number;
    option_text: string;
    is_correct: boolean;
    mastery_tier: number;
    trap_summary: string;
    legal_citation: string;
  }>;
}

function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../.env.local");
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return result;
  for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[m[1]] = val;
    }
  }
  return result;
}

async function extractPdfText(filePath: string): Promise<string> {
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buf });
  await parser.load();
  const r = await parser.getText();
  const text = typeof r === "string" ? r : r?.text ?? "";
  await parser.destroy();
  return text;
}

function cleanExamText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\t+/g, " ")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/g, "")
    .replace(/\d{4}년도?\s+제\d+회\s+주택관리사보[^\n]*/g, "")
    .replace(/^\s*[AB]-\d+-\d+.*$/gm, "")
    .replace(/^\s*\[\d\s*차\s*\]\s*$/gm, "")
    .replace(/^\s*수험번호\s+성\s*명\s*$/gm, "");
}

function stripTrailingSectionHeaders(text: string): string {
  return text
    .replace(/\n\s*(?:공동주택시설개론|공동주택관리실무(?:\((?:객관식|주관식)\))?|주택관리관계법규(?:\((?:객관식|주관식)\))?|회계원리|민\s*법)\s*[\s\S]*$/m, (m, _offset, _str) => {
      // 과목 제목 줄이 문장 중간에 우연히 포함된 경우를 방지하기 위해 독립 라인인 경우만 제거
      const firstLine = m.trim().split("\n")[0].trim();
      if (
        /^(공동주택시설개론|공동주택관리실무(\((객관식|주관식)\))?|주택관리관계법규(\((객관식|주관식)\))?|회계원리|민\s*법)$/.test(
          firstLine
        )
      ) {
        return "";
      }
      return m;
    })
    .replace(/\n\s*※\s*아래\s*문제들에서[\s\S]*$/m, "")
    .trim();
}

function parseSequentialBlocks(rawText: string, startNum: number, endNum: number): Array<{ num: number; block: string }> {
  const text = cleanExamText(rawText);
  const lines = text.split("\n");
  const positions: Array<{ num: number; lineIdx: number }> = [];
  let expected = startNum;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const re = new RegExp(`^${expected}\\.(?:\\s+|$)`);
    if (re.test(trimmed)) {
      positions.push({ num: expected, lineIdx: i });
      expected++;
      if (expected > endNum) break;
    }
  }

  if (positions.length !== endNum - startNum + 1) {
    throw new Error(
      `Sequential parse mismatch: got ${positions.length}/${endNum - startNum + 1} (stopped before ${expected})`
    );
  }

  const items: Array<{ num: number; block: string }> = [];
  for (let i = 0; i < positions.length; i++) {
    const cur = positions[i];
    const nextIdx = i + 1 < positions.length ? positions[i + 1].lineIdx : lines.length;
    const block = stripTrailingSectionHeaders(lines.slice(cur.lineIdx, nextIdx).join("\n"));
    items.push({ num: cur.num, block });
  }
  return items;
}

function splitHeaderAndBox(header: string): { questionText: string; boxContent: string | null } {
  const cleaned = header.replace(/^\d+\.\s*/, "").replace(/[ \t]+/g, " ").trim();
  const boxStart = cleaned.search(/(?:<보\s*기>|\[보\s*기\]|\n\s*ㄱ\.)/);
  if (boxStart !== -1) {
    return {
      questionText: cleaned.slice(0, boxStart).replace(/\s+/g, " ").trim(),
      boxContent: cleaned.slice(boxStart).replace(/\s+/g, " ").trim(),
    };
  }
  // 줄바꿈 없이 'ㄱ. '이 나온 경우 (? 이후 또는 문장 끝 이후)
  const inlineBox = cleaned.search(/(?:\?|다\.|시오\.|따름\))\s+(?=ㄱ\.)/);
  if (inlineBox !== -1) {
    const qEnd = cleaned.indexOf("ㄱ.", inlineBox);
    if (qEnd > 0) {
      return {
        questionText: cleaned.slice(0, qEnd).replace(/\s+/g, " ").trim(),
        boxContent: cleaned.slice(qEnd).replace(/\s+/g, " ").trim(),
      };
    }
  }
  return {
    questionText: cleaned.replace(/\s+/g, " ").trim(),
    boxContent: null,
  };
}

function parseObjectiveBlock(block: string): {
  questionText: string;
  boxContent: string | null;
  options: Array<{ optionNumber: number; optionText: string }>;
} {
  const markers = ["①", "②", "③", "④", "⑤"];
  const idxs: number[] = [];
  let cursor = 0;
  for (const sym of markers) {
    const pos = block.indexOf(sym, cursor);
    if (pos === -1) {
      throw new Error(`Missing option marker ${sym} in block: ${block.slice(0, 120)}`);
    }
    idxs.push(pos);
    cursor = pos + 1;
  }

  const header = block.slice(0, idxs[0]);
  const { questionText, boxContent } = splitHeaderAndBox(header);

  const options: Array<{ optionNumber: number; optionText: string }> = [];
  for (let i = 0; i < 5; i++) {
    const start = idxs[i] + 1;
    const end = i < 4 ? idxs[i + 1] : block.length;
    const rawOpt = block.slice(start, end);
    const cleanedOpt = stripTrailingSectionHeaders(rawOpt).replace(/\s+/g, " ").trim();
    options.push({
      optionNumber: i + 1,
      optionText: cleanedOpt,
    });
  }

  return { questionText, boxContent, options };
}

function parseSubjectiveBlock(block: string): { questionText: string; boxContent: string | null } {
  const withoutNum = block.replace(/^\d+\.\s*/, "").trim();
  const lines = withoutNum.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    // 첫 문장(지시문: '...쓰시오.')과 보기 박스 분리
    const firstQEnd = withoutNum.search(/(?:쓰시오\.|고르시오\.|구하시오\.)(?:\s*\([^\n]*\))?/);
    if (firstQEnd !== -1) {
      const m = withoutNum.slice(firstQEnd).match(/^(?:쓰시오\.|고르시오\.|구하시오\.)(?:\s*\([^\n]*\))?/);
      const splitAt = firstQEnd + (m ? m[0].length : 0);
      const qTxt = withoutNum.slice(0, splitAt).replace(/\s+/g, " ").trim();
      const bTxt = withoutNum.slice(splitAt).replace(/\s+/g, " ").trim();
      if (bTxt.length > 0) {
        return { questionText: qTxt, boxContent: bTxt };
      }
    }
  }
  return {
    questionText: withoutNum.replace(/\s+/g, " ").trim(),
    boxContent: null,
  };
}

async function parseSubjectiveAnswersPdf(filePath: string): Promise<Map<number, string>> {
  const raw = await extractPdfText(filePath);
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\t+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^--\s*\d+\s+of\s+\d+\s*--$/.test(l));

  const map = new Map<number, string>();
  let inActiveSection = true;
  let hasTypedSections = lines.some((l) => /\(A형\)|\(B형\)/.test(l));
  let expected = 49;

  for (const line of lines) {
    if (hasTypedSections && line.startsWith("□")) {
      inActiveSection = /\(A형\)/.test(line);
      continue;
    }
    if (!inActiveSection) continue;
    if (line.startsWith("□")) continue;

    const m = line.match(new RegExp(`^(${expected})\\s+(.+)$`));
    if (m) {
      map.set(expected, m[2].replace(/\s+/g, " ").trim());
      expected++;
    } else if (expected > 49 && map.has(expected - 1) && !/^\d{2}\s+/.test(line) && !/^20\d{2}년/.test(line) && !/^주관식/.test(line)) {
      // 여러 줄에 걸친 복수인정 답안 이어 붙이기
      const prev = map.get(expected - 1)!;
      map.set(expected - 1, `${prev} ${line.replace(/\s+/g, " ").trim()}`);
    }
  }

  if (map.size !== 32) {
    throw new Error(`Subjective answers count mismatch in ${path.basename(filePath)}: got ${map.size}/32`);
  }
  return map;
}

function classifyChapterAndTier(
  stage: "1차" | "2차",
  subject: string,
  text: string,
  qNum: number
): { chapter_code: string; chapter_title: string; importance_tier: ImportanceTier } {
  if (stage === "1차") {
    if (subject === "회계원리") {
      if (/(원가|제조간접|표준원가|종합원가|개별원가|활동기준|CVP|손익분기|변동원가)/.test(text)) {
        return { chapter_code: "ACCT_COST", chapter_title: "원가·관리회계", importance_tier: "S" };
      }
      return { chapter_code: "ACCT_FIN", chapter_title: "재무회계", importance_tier: "S" };
    }
    if (subject === "공동주택시설개론") {
      if (/(철근|콘크리트|조적|철골|기초|지반|방수|미장|도장|창호|타일|목공사)/.test(text)) {
        return { chapter_code: "FACIL_STRUCT", chapter_title: "건축구조", importance_tier: "S" };
      }
      return { chapter_code: "FACIL_EQUIP", chapter_title: "건축설비", importance_tier: "S" };
    }
    // 민법
    if (qNum <= 24 || /(의사표시|대리|소멸시효|법률행위|권리능력|제한능력|법인|물건|조건|기한|무효|취소)/.test(text)) {
      return { chapter_code: "CIVIL_GEN", chapter_title: "민법총칙", importance_tier: "S" };
    }
    if (/(점유권|소유권|지상권|지역권|전세권|유치권|저당권|등기|물권)/.test(text)) {
      return { chapter_code: "CIVIL_REAL", chapter_title: "물권법", importance_tier: "A" };
    }
    return { chapter_code: "CIVIL_OBLIG", chapter_title: "채권법", importance_tier: "A" };
  }

  // 2차 시험: 5개년 출제비중 기반 S/A/B/C 분류
  if (subject === "주택관리관계법규") {
    if (/공동주택관리법/.test(text)) {
      return { chapter_code: "LAW_APT_MGMT", chapter_title: "공동주택관리법", importance_tier: "S" };
    }
    if (/주택법/.test(text)) {
      return { chapter_code: "LAW_HOUSING", chapter_title: "주택법", importance_tier: "S" };
    }
    if (/건축법/.test(text)) {
      return { chapter_code: "LAW_BUILDING", chapter_title: "건축법", importance_tier: "S" };
    }
    if (/(민간임대주택|공공주택|도시 및 주거환경정비)/.test(text)) {
      return { chapter_code: "LAW_RENT_REDEV", chapter_title: "임대·정비법", importance_tier: "A" };
    }
    if (/(시설물의 안전|화재의 예방|소방시설|전기사업|승강기 안전)/.test(text)) {
      return { chapter_code: "LAW_SAFETY_FACILITY", chapter_title: "안전·설비법", importance_tier: "A" };
    }
    if (/(도시재정비|소방기본법|집합건물)/.test(text)) {
      return { chapter_code: "LAW_MINOR", chapter_title: "틈새 소법령", importance_tier: "B" };
    }
    return { chapter_code: "LAW_APT_MGMT", chapter_title: "공동주택관리법", importance_tier: "A" };
  }

  // 공동주택관리실무 (5개년 출제비중표 기준)
  if (/(근로기준|임금|퇴직|연차|휴가|산재|산업재해|고용보험|국민연금|건강보험|노동조합|단체협약|최저임금|문서|인사)/.test(text)) {
    return { chapter_code: "PRAC_LABOR", chapter_title: "사무·인사/노무", importance_tier: "S" };
  }
  if (/(급수|급탕|배수|통기|위생|오수|정화조|난방|냉동|환기|공조|소방|옥내소화전|스프링클러|가스|전기|수전|변압기|조명|승강기|콘크리트|방수|하자|장기수선|보존|건설기준|피뢰|열관류|결로|부등률|펌프)/.test(text)) {
    return { chapter_code: "PRAC_FACILITY", chapter_title: "시설관리", importance_tier: "S" };
  }
  if (/(소독|청소|저수조|음식물|폐기물|층간소음|실내공기|라돈|환경|안전관리계획|안전점검|방재|경비|재난)/.test(text)) {
    return { chapter_code: "PRAC_ENV_SAFETY", chapter_title: "환경·안전관리", importance_tier: "S" };
  }
  if (/(회계|재무제표|예산|결산|리모델링|대외업무)/.test(text)) {
    return { chapter_code: "PRAC_ACCOUNT_EXT", chapter_title: "회계·대외·리모델링", importance_tier: "B" };
  }
  if (/(벌칙|과태료|주거관리이론)/.test(text)) {
    return { chapter_code: "PRAC_CUTOFF", chapter_title: "초저빈출 부록", importance_tier: "C" };
  }
  return { chapter_code: "PRAC_ORG_MGMT", chapter_title: "관리방법·관리조직", importance_tier: "S" };
}

function buildOptionMeta(
  optText: string,
  isCorrectStmt: boolean,
  citation: string
): { mastery_tier: number; trap_summary: string; legal_citation: string } {
  const numMatch = optText.match(
    /(\d+(?:분의\s*\d+)?\s*(?:일|월|년|호|세대|점|명|층|m|㎡|m²|억원|만원|원|%|퍼센트)(?:\s*(?:이내|이상|이하|전까지|미만|초과))?)/
  );
  if (numMatch) {
    return {
      mastery_tier: isCorrectStmt ? 2 : 4,
      trap_summary: isCorrectStmt
        ? `핵심 수치 '${numMatch[1].trim()}' 기준에 부합하는 옳은 내용입니다.`
        : `수치·기한 '${numMatch[1].trim()}' 함정 여부를 확인하세요.`,
      legal_citation: citation,
    };
  }
  if (/(국토교통부장관|시장ㆍ군수ㆍ구청장|시ㆍ도지사|입주자대표회의|관리주체|관리사무소장|사업주체)/.test(optText)) {
    const actor = optText.match(/(국토교통부장관|시장ㆍ군수ㆍ구청장|시ㆍ도지사|입주자대표회의|관리주체|관리사무소장|사업주체)/)?.[1] ?? "주체";
    return {
      mastery_tier: isCorrectStmt ? 2 : 3,
      trap_summary: isCorrectStmt
        ? `관할·의무 주체('${actor}')가 법령 기준과 일치합니다.`
        : `주체('${actor}') 바꿔치기 함정 여부를 확인하세요.`,
      legal_citation: citation,
    };
  }
  return {
    mastery_tier: 2,
    trap_summary: isCorrectStmt ? "법령·이론 기준에 부합하는 옳은 선지입니다." : "핵심 요건 불일치 오답 선지입니다.",
    legal_citation: citation,
  };
}

function normalizeAnswersArray(arr: Array<number | number[]>): number[][] {
  return arr.map((v) => (Array.isArray(v) ? v : [v]));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const answersPath = path.resolve(__dirname, "data/official-answers.json");
  const officialAnswers: OfficialAnswersJson = JSON.parse(fs.readFileSync(answersPath, "utf-8"));

  const records: ParsedQuestionRecord[] = [];

  // 1) 1차 시험 (23회 ~ 29회, 2020 ~ 2026)
  for (const [roundStr, entry] of Object.entries(officialAnswers.first)) {
    const round = Number(roundStr);
    const year = entry.year;
    const suffix = entry.type === "A" ? "_A형" : "";

    const sess1Path = `c:/G/posmul/주택관리사1차/${year}_제${round}회_1차_1교시_문제지${suffix}.pdf`;
    const sess2Path = `c:/G/posmul/주택관리사1차/${year}_제${round}회_1차_2교시_문제지${suffix}.pdf`;

    const ansAcct = normalizeAnswersArray(entry.회계원리);
    const ansFacil = normalizeAnswersArray(entry.공동주택시설개론);
    const ansCivil = normalizeAnswersArray(entry.민법);
    if (ansAcct.length !== 40 || ansFacil.length !== 40 || ansCivil.length !== 40) {
      throw new Error(`1차 ${round}회 정답 개수 오류`);
    }

    const blocks1 = parseSequentialBlocks(await extractPdfText(sess1Path), 1, 80);
    const blocks2 = parseSequentialBlocks(await extractPdfText(sess2Path), 1, 40);

    const process1st = (blocks: Array<{ num: number; block: string }>, isSession2: boolean) => {
      for (const b of blocks) {
        const subject = isSession2 ? "민법" : b.num <= 40 ? "회계원리" : "공동주택시설개론";
        const ansList = isSession2
          ? ansCivil[b.num - 1]
          : b.num <= 40
            ? ansAcct[b.num - 1]
            : ansFacil[b.num - 41];

        const parsed = parseObjectiveBlock(b.block);
        const fullText = `${parsed.questionText} ${parsed.boxContent ?? ""}`;
        const isNegative = /(아닌\s*것은|옳지\s*않은|틀린\s*것은|해당하지\s*않는|포함되지\s*않는)/.test(parsed.questionText);
        const isBoxOrCalc =
          Boolean(parsed.boxContent) ||
          /(모두\s*고른|모두\s*몇|순서대로|짝지은|얼마인가|금액은|원가는|이익은|비용은|수량차이|몇\s*개)/.test(parsed.questionText) ||
          parsed.options.every((o) => o.optionText.length <= 16);
        const oxEligible = !isBoxOrCalc && ansList.length === 1;
        const { chapter_code, chapter_title, importance_tier } = classifyChapterAndTier("1차", subject, fullText, b.num);

        records.push({
          exam_year: year,
          exam_round: round,
          exam_stage: "1차",
          subject,
          question_number: b.num,
          question_type: "OBJECTIVE",
          question_text: parsed.questionText,
          box_content: parsed.boxContent,
          correct_option_number: ansList[0],
          correct_options: ansList,
          subjective_answer: null,
          chapter_code,
          chapter_title,
          importance_tier,
          metadata: {
            examType: entry.type,
            isNegativeQuestion: isNegative,
            oxEligible,
            multipleCorrect: ansList.length > 1,
          },
          options: parsed.options.map((opt) => {
            const isAnswer = ansList.includes(opt.optionNumber);
            const isTrueStmt = oxEligible ? (isNegative ? !isAnswer : isAnswer) : isAnswer;
            const meta = buildOptionMeta(opt.optionText, isTrueStmt, `${year}년 제${round}회 ${subject} ${b.num}번`);
            return {
              option_number: opt.optionNumber,
              option_text: opt.optionText,
              is_correct: isTrueStmt,
              ...meta,
            };
          }),
        });
      }
    };

    process1st(blocks1, false);
    process1st(blocks2, true);
    console.log(`✅ [1차] ${year}년 제${round}회 파싱 완료: 120문항`);
  }

  // 2) 2차 시험 (22회 ~ 28회, 2019 ~ 2025)
  for (const [roundStr, entry] of Object.entries(officialAnswers.second)) {
    const round = Number(roundStr);
    const year = entry.year;
    const suffix = entry.type === "A" ? "_A형" : "";

    const examPath = `c:/G/posmul/주택관리사2차/${year}_제${round}회_2차_문제지${suffix}.pdf`;
    const subjAnsPath = `c:/G/posmul/정답/${year}_제${round}회_2차_정답_주관식.pdf`;
    const ocrJsonPath = path.resolve(__dirname, `data/parsed-${year}-2nd.json`);

    const ansLaw = normalizeAnswersArray(entry.주택관리관계법규);
    const ansPrac = normalizeAnswersArray(entry.공동주택관리실무);
    if (ansLaw.length !== 24 || ansPrac.length !== 24) {
      throw new Error(`2차 ${round}회 객관식 정답 개수 오류`);
    }

    const subjMap = await parseSubjectiveAnswersPdf(subjAnsPath);

    type ParsedSecondItem = {
      num: number;
      questionText: string;
      boxContent: string | null;
      options: Array<{ optionNumber: number; optionText: string }>;
      isOcr: boolean;
    };

    const items: ParsedSecondItem[] = [];
    if (fs.existsSync(ocrJsonPath)) {
      const ocrList = JSON.parse(fs.readFileSync(ocrJsonPath, "utf-8")) as Array<{
        questionNumber: number;
        questionText: string;
        boxContent: string | null;
        options?: Array<{ optionNumber: number; optionText: string }>;
      }>;
      for (const q of ocrList.sort((a, b) => a.questionNumber - b.questionNumber)) {
        items.push({
          num: q.questionNumber,
          questionText: q.questionText,
          boxContent: q.boxContent ?? null,
          options: q.options ?? [],
          isOcr: true,
        });
      }
      console.log(`🤖 [2차 OCR 로드] ${year}년 제${round}회: ${items.length}문항 (${path.basename(ocrJsonPath)})`);
    } else {
      const blocks = parseSequentialBlocks(await extractPdfText(examPath), 1, 80);
      for (const b of blocks) {
        if (b.num <= 48) {
          const parsed = parseObjectiveBlock(b.block);
          items.push({
            num: b.num,
            questionText: parsed.questionText,
            boxContent: parsed.boxContent,
            options: parsed.options,
            isOcr: false,
          });
        } else {
          const parsed = parseSubjectiveBlock(b.block);
          items.push({
            num: b.num,
            questionText: parsed.questionText,
            boxContent: parsed.boxContent,
            options: [],
            isOcr: false,
          });
        }
      }
    }

    for (const item of items) {
      const isObjective = item.num <= 48;
      const subject =
        item.num <= 24 || (item.num >= 49 && item.num <= 64) ? "주택관리관계법규" : "공동주택관리실무";

      if (isObjective) {
        if (item.options.length !== 5) {
          throw new Error(`2차 ${round}회 #${item.num} 선지 개수 오류: ${item.options.length}개`);
        }
        const ansList = item.num <= 24 ? ansLaw[item.num - 1] : ansPrac[item.num - 25];
        const fullText = `${item.questionText} ${item.boxContent ?? ""}`;
        const isNegative = /(아닌\s*것은|옳지\s*않은|틀린\s*것은|해당하지\s*않는|포함되지\s*않는)/.test(
          item.questionText
        );
        const isBoxOrCalc =
          Boolean(item.boxContent) ||
          /(모두\s*고른|모두\s*몇|순서대로|짝지은|얼마인가|몇\s*개)/.test(item.questionText) ||
          item.options.every((o) => o.optionText.length <= 16);
        const oxEligible = !isBoxOrCalc && ansList.length === 1;
        const { chapter_code, chapter_title, importance_tier } = classifyChapterAndTier("2차", subject, fullText, item.num);

        records.push({
          exam_year: year,
          exam_round: round,
          exam_stage: "2차",
          subject,
          question_number: item.num,
          question_type: "OBJECTIVE",
          question_text: item.questionText,
          box_content: item.boxContent,
          correct_option_number: ansList[0],
          correct_options: ansList,
          subjective_answer: null,
          chapter_code,
          chapter_title,
          importance_tier,
          metadata: {
            examType: entry.type,
            isNegativeQuestion: isNegative,
            oxEligible,
            multipleCorrect: ansList.length > 1,
            ...(item.isOcr ? { ocrExtracted: true } : {}),
          },
          options: item.options.map((opt) => {
            const isAnswer = ansList.includes(opt.optionNumber);
            const isTrueStmt = oxEligible ? (isNegative ? !isAnswer : isAnswer) : isAnswer;
            const meta = buildOptionMeta(opt.optionText, isTrueStmt, `${year}년 제${round}회 ${subject} ${item.num}번`);
            return {
              option_number: opt.optionNumber,
              option_text: opt.optionText,
              is_correct: isTrueStmt,
              ...meta,
            };
          }),
        });
      } else {
        const subjAns = subjMap.get(item.num);
        if (!subjAns) throw new Error(`Missing subjective answer for ${round}회 #${item.num}`);
        const fullText = `${item.questionText} ${item.boxContent ?? ""} ${subjAns}`;
        const { chapter_code, chapter_title, importance_tier } = classifyChapterAndTier("2차", subject, fullText, item.num);

        records.push({
          exam_year: year,
          exam_round: round,
          exam_stage: "2차",
          subject,
          question_number: item.num,
          question_type: "SUBJECTIVE",
          question_text: item.questionText,
          box_content: item.boxContent,
          correct_option_number: null,
          correct_options: null,
          subjective_answer: subjAns,
          chapter_code,
          chapter_title,
          importance_tier,
          metadata: {
            examType: entry.type,
            oxEligible: false,
            ...(item.isOcr ? { ocrExtracted: true } : {}),
          },
          options: [],
        });
      }
    }
    console.log(`✅ [2차] ${year}년 제${round}회 파싱 완료: ${items.length}문항 (객관식 48 + 주관식 32)`);
  }

  console.log(`\n📊 총 추출 문항 수: ${records.length}문항 (선지 총 ${records.reduce((s, r) => s + r.options.length, 0)}개)`);

  if (dryRun) {
    const sampleSubj = records.find((r) => r.question_type === "SUBJECTIVE" && r.exam_round === 27);
    const sample1st = records.find((r) => r.exam_round === 29 && r.subject === "민법" && r.question_number === 1);
    console.log("\n[DRY-RUN 샘플 - 2026 제29회 1차 민법 1번]", JSON.stringify(sample1st, null, 2));
    console.log("\n[DRY-RUN 샘플 - 2024 제27회 2차 주관식 49번]", JSON.stringify(sampleSubj, null, 2));
    return;
  }

  // Supabase 적재
  const env = loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) exam_questions 배치 upsert (100개씩)
  const qIdMap = new Map<string, string>();
  const Q_BATCH = 100;
  for (let i = 0; i < records.length; i += Q_BATCH) {
    const batch = records.slice(i, i + Q_BATCH).map(({ options: _opts, ...q }) => q);
    const { data, error } = await supabase
      .schema("vertical_housing")
      .from("exam_questions")
      .upsert(batch, { onConflict: "exam_round,subject,question_number" })
      .select("id,exam_round,subject,question_number");

    if (error) {
      throw new Error(`exam_questions upsert error at batch ${i}: ${JSON.stringify(error)}`);
    }
    for (const row of data ?? []) {
      qIdMap.set(`${row.exam_round}|${row.subject}|${row.question_number}`, row.id);
    }
  }
  console.log(`💾 exam_questions 적재 완료: ${qIdMap.size}건`);

  // 2) exam_options 배치 upsert (250개씩)
  const allOptions: Array<{
    question_id: string;
    option_number: number;
    option_text: string;
    is_correct: boolean;
    mastery_tier: number;
    trap_summary: string;
    legal_citation: string;
  }> = [];

  for (const r of records) {
    if (r.options.length === 0) continue;
    const qId = qIdMap.get(`${r.exam_round}|${r.subject}|${r.question_number}`);
    if (!qId) throw new Error(`Missing question_id for ${r.exam_round}|${r.subject}|${r.question_number}`);
    for (const o of r.options) {
      allOptions.push({ question_id: qId, ...o });
    }
  }

  const O_BATCH = 250;
  let insertedOpts = 0;
  for (let i = 0; i < allOptions.length; i += O_BATCH) {
    const batch = allOptions.slice(i, i + O_BATCH);
    const { error } = await supabase
      .schema("vertical_housing")
      .from("exam_options")
      .upsert(batch, { onConflict: "question_id,option_number" });

    if (error) {
      throw new Error(`exam_options upsert error at batch ${i}: ${JSON.stringify(error)}`);
    }
    insertedOpts += batch.length;
  }
  console.log(`💾 exam_options 적재 완료: ${insertedOpts}건`);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
