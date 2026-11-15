import * as fs from "fs";
import * as path from "path";
// @ts-expect-error pdf-parse v2 export
import { PDFParse } from "pdf-parse";

interface OcrQuestion {
  questionNumber: number;
  subject: "주택관리관계법규" | "공동주택관리실무";
  questionType: "OBJECTIVE" | "SUBJECTIVE";
  questionText: string;
  boxContent: string | null;
  options: Array<{ optionNumber: number; optionText: string }>;
}

function loadGeminiKey(): string {
  if (process.env.GOOGLE_GEMINI_API_KEY) return process.env.GOOGLE_GEMINI_API_KEY;
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      const m = line.match(/^\s*GOOGLE_GEMINI_API_KEY\s*=\s*(.+)\s*$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  throw new Error("GOOGLE_GEMINI_API_KEY not found");
}

async function callGeminiOcrBatch(
  apiKey: string,
  pageImages: Array<{ pageNumber: number; data: Uint8Array }>
): Promise<OcrQuestion[]> {
  const pageList = pageImages.map((p) => p.pageNumber).join(", ");
  const prompt = `다음 이미지는 '2025년도 제28회 주택관리사보 2차 국가자격시험' 문제지 (${pageList}페이지)입니다.
표지/수험자 유의사항만 있는 페이지는 건너뛰고, 이미지에 보이는 모든 시험 문항을 누락 없이 오타 없이 정확히 텍스트로 옮겨 JSON으로 반환하세요.

규칙:
1. 문항 번호(questionNumber): 정수 (1~48은 객관식, 49~80은 주관식 단답형)
2. 과목(subject): 1~24 및 49~64는 "주택관리관계법규", 25~48 및 65~80은 "공동주택관리실무"
3. 유형(questionType): 1~48은 "OBJECTIVE", 49~80은 "SUBJECTIVE"
4. questionText: 문항 번호("1. ")를 제외한 문제 본문. 단, <보기>나 ㄱ, ㄴ, ㄷ 또는 법조문 박스/자료 표 내용은 boxContent에 분리하세요.
5. boxContent: 박스/보기/법조문 인용/표 내용 (없으면 null)
6. options: 객관식(1~48)은 ①~⑤ 5개 선지를 순서대로 { "optionNumber": 1..5, "optionText": "..." } 배열로 추출(번호 기호 ①~⑤ 제외). 주관식(49~80)은 빈 배열 []
7. 원문 한 글자, 숫자, 괄호 ( ㄱ ), ( ㄴ ) 기호까지 정확하게 유지하고 요약/생략하지 마세요. 페이지가 잘려 다음 페이지에 이어지는 문제는 현재 페이지에 보이는 선지까지만이라도 추출하거나 완전한 문항을 추출하세요.

반드시 순수 JSON만 출력하세요:
{
  "questions": [
    {
      "questionNumber": 1,
      "subject": "주택관리관계법규",
      "questionType": "OBJECTIVE",
      "questionText": "...",
      "boxContent": null,
      "options": [
        { "optionNumber": 1, "optionText": "..." }
      ]
    }
  ]
}`;

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  for (const img of pageImages) {
    parts.push({
      inline_data: {
        mime_type: "image/png",
        data: Buffer.from(img.data).toString("base64"),
      },
    });
  }

  const models = [
    "gemini-2.5-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
  ];
  const errors: string[] = [];

  for (let attempt = 1; attempt <= 4; attempt++) {
    for (const model of models) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90000);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.05,
                responseMimeType: "application/json",
                maxOutputTokens: 32768,
              },
            }),
          }
        );
        clearTimeout(timer);

        if (!res.ok) {
          const errBody = await res.text();
          errors.push(`try${attempt}:${model} HTTP ${res.status}: ${errBody.slice(0, 180)}`);
          // 429/503 시 잠깐 숨고르기 후 다음 모델로 전환
          if (res.status === 429 || res.status === 503) {
            await new Promise((r) => setTimeout(r, 2000));
          }
          continue;
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          errors.push(`try${attempt}:${model} empty text`);
          continue;
        }

        const parsed = JSON.parse(rawText);
        return Array.isArray(parsed.questions) ? parsed.questions : [];
      } catch (e) {
        clearTimeout(timer);
        errors.push(`try${attempt}:${model} err: ${(e as Error).message}`);
      }
    }
    const waitMs = 20000 * attempt;
    console.log(`⏳ [pages ${pageList}] 모든 모델 일시 제한 -> ${waitMs / 1000}초 대기 후 재시도 (${attempt}/4)`);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  throw new Error(`Gemini OCR failed for pages [${pageList}]: ${errors.slice(-6).join(" | ")}`);
}

async function main() {
  const apiKey = loadGeminiKey();
  const pdfPath = "c:/G/posmul/주택관리사2차/2025_제28회_2차_문제지.pdf";
  const outPath = path.resolve(__dirname, "data/parsed-2025-2nd.json");

  const parser = new PDFParse({ data: fs.readFileSync(pdfPath) });
  await parser.load();
  const info = await parser.getInfo();
  const totalPages = info.total;
  console.log(`📄 2025년 제28회 2차 PDF 총 ${totalPages}페이지 렌더링 시작...`);

  const allImages: Array<{ pageNumber: number; data: Uint8Array }> = [];
  for (let p = 1; p <= totalPages; p++) {
    const shot = await parser.getScreenshot({ partial: [p], desiredWidth: 1200 });
    const pageData = shot.pages?.[0]?.data;
    if (pageData) {
      allImages.push({ pageNumber: p, data: pageData });
    }
  }
  await parser.destroy();
  console.log(`🖼️ PNG 렌더링 완료: ${allImages.length}페이지 (2~${totalPages}p)`);

  const BATCH_SIZE = 2;
  const batches: Array<Array<{ pageNumber: number; data: Uint8Array }>> = [];
  for (let i = 0; i < allImages.length; i += BATCH_SIZE) {
    batches.push(allImages.slice(i, i + BATCH_SIZE));
  }

  const cacheMetaPath = path.resolve(__dirname, "data/parsed-2025-2nd-pages.json");
  const donePages = new Set<number>();
  const questionMap = new Map<number, OcrQuestion>();
  if (fs.existsSync(outPath)) {
    try {
      const cached: OcrQuestion[] = JSON.parse(fs.readFileSync(outPath, "utf-8"));
      for (const q of cached) questionMap.set(q.questionNumber, q);
      console.log(`♻️ 기존 문항 캐시 로드: ${questionMap.size}문항`);
    } catch {}
  }
  if (fs.existsSync(cacheMetaPath)) {
    try {
      const pages: number[] = JSON.parse(fs.readFileSync(cacheMetaPath, "utf-8"));
      for (const p of pages) donePages.add(p);
      console.log(`♻️ 기존 완료 페이지 캐시: ${donePages.size}페이지`);
    } catch {}
  }

  // 배치당 1개씩 순차 실행 + 매 배치 완료 즉시 JSON & 페이지 캐시 저장 (429 방지)
  for (let i = 0; i < batches.length; i++) {
    const b = batches[i];
    const pageNums = b.map((x) => x.pageNumber);
    if (pageNums.every((p) => donePages.has(p))) {
      console.log(`⏭️ Batch ${i + 1}/${batches.length} (pages ${pageNums.join(",")}) 캐시 스킵`);
      continue;
    }

    const qs = await callGeminiOcrBatch(apiKey, b);
    console.log(`✅ Batch ${i + 1}/${batches.length} (pages ${pageNums.join(",")}): ${qs.length}문항`);

    for (const q of qs) {
      if (q.questionNumber >= 1 && q.questionNumber <= 80) {
        const prev = questionMap.get(q.questionNumber);
        if (!prev || (q.options?.length ?? 0) >= (prev.options?.length ?? 0)) {
          questionMap.set(q.questionNumber, q);
        }
      }
    }
    for (const p of pageNums) donePages.add(p);

    fs.writeFileSync(
      outPath,
      JSON.stringify(Array.from(questionMap.values()).sort((a, b) => a.questionNumber - b.questionNumber), null, 2),
      "utf-8"
    );
    fs.writeFileSync(cacheMetaPath, JSON.stringify(Array.from(donePages).sort((a, b) => a - b)), "utf-8");

    // 배치 간 짧은 쿨다운
    if (i + 1 < batches.length) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // 경계 페이지에 걸려 선지 부족하거나 누락된 문항 탐지 후 순차 보완
  const missingOrIncomplete: number[] = [];
  for (let n = 1; n <= 80; n++) {
    const q = questionMap.get(n);
    if (!q || (n <= 48 && (q.options?.length ?? 0) < 5)) {
      missingOrIncomplete.push(n);
    }
  }

  if (missingOrIncomplete.length > 0) {
    console.log(`⚠️ 보완 필요 문항 감지: ${missingOrIncomplete.join(", ")} -> 배치 경계 순차 재추출 중...`);
    const boundaryPairs: Array<Array<{ pageNumber: number; data: Uint8Array }>> = [];
    for (let i = BATCH_SIZE - 1; i + 1 < allImages.length; i += BATCH_SIZE) {
      boundaryPairs.push([allImages[i], allImages[i + 1]]);
    }
    for (const pair of boundaryPairs) {
      // 아직 미해결 문항이 남았을 때만 요청
      const stillMissing = [];
      for (let n = 1; n <= 80; n++) {
        const q = questionMap.get(n);
        if (!q || (n <= 48 && (q.options?.length ?? 0) < 5)) stillMissing.push(n);
      }
      if (stillMissing.length === 0) break;

      const list = await callGeminiOcrBatch(apiKey, pair);
      let updated = false;
      for (const q of list) {
        if (q.questionNumber >= 1 && q.questionNumber <= 80) {
          const prev = questionMap.get(q.questionNumber);
          if (!prev || (q.options?.length ?? 0) > (prev.options?.length ?? 0)) {
            questionMap.set(q.questionNumber, q);
            updated = true;
          }
        }
      }
      if (updated) {
        fs.writeFileSync(
          outPath,
          JSON.stringify(Array.from(questionMap.values()).sort((a, b) => a.questionNumber - b.questionNumber), null, 2),
          "utf-8"
        );
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const finalList = Array.from(questionMap.values()).sort((a, b) => a.questionNumber - b.questionNumber);
  fs.writeFileSync(outPath, JSON.stringify(finalList, null, 2), "utf-8");

  const objOk = finalList.filter((q) => q.questionNumber <= 48 && q.options.length === 5).length;
  const subjOk = finalList.filter((q) => q.questionNumber >= 49).length;
  console.log(`🎉 2025 제28회 2차 OCR 저장 완료: 총 ${finalList.length}/80 (객관식 5선지 ${objOk}/48, 주관식 ${subjOk}/32)`);
  console.log(`💾 파일: ${outPath}`);
}

main().catch((err) => {
  console.error("❌ OCR Failed:", err);
  process.exit(1);
});
