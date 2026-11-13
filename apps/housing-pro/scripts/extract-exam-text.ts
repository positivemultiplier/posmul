import * as fs from "fs";
import * as path from "path";
// @ts-expect-error pdf-parse v2 export
import { PDFParse } from "pdf-parse";

async function main() {
  const filePath = "c:\\G\\주택관리사2차\\2026년 제29회 주택관리사보 2차시험 시험 문제지.pdf";
  console.log(`📖 PDF 파일 읽는 중: ${filePath}`);

  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  await parser.load();

  const textResult = await parser.getText();
  const text = typeof textResult === "string" ? textResult : (textResult?.text ?? JSON.stringify(textResult));

  console.log(`✅ 텍스트 추출 완료! 전체 텍스트 길이: ${text.length}자`);

  console.log("\n--- [텍스트 샘플 처음 1500자] ---");
  console.log(text.slice(0, 1500));
  console.log("--- [텍스트 샘플 끝] ---\n");

  const outDir = path.join(__dirname, "../sample-output");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, "extracted-2026-exam.txt");
  fs.writeFileSync(outPath, text, "utf-8");
  console.log(`💾 전체 텍스트가 저장되었습니다: ${outPath}`);

  await parser.destroy();
}

main().catch(console.error);
