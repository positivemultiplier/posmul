import fs from "node:fs";
import path from "node:path";
import { supabaseAdmin } from "../src/lib/supabase";

interface ParsedSection {
  sectionCode: string;
  detailCode: string;
  subject: string;
  chapterTitle: string;
  sectionTitle: string;
  keywords: string[];
  bodyMd: string;
  sourceFile: string;
  sortOrder: number;
}

const FOLDER_SUBJECT_MAP: Record<string, string> = {
  "01-civil": "민법",
  "02-accounting": "회계원리",
  "03-facility": "공동주택시설개론",
  "04-law": "주택관리관계법규",
  "05-practice": "공동주택관리실무",
};

function parseMarkdownFile(absPath: string, rootDir: string): ParsedSection[] {
  const relPath = path.relative(rootDir, absPath).replace(/\\/g, "/");
  const folder = relPath.split("/")[0] || "";
  const subject = FOLDER_SUBJECT_MAP[folder] || "일반";
  const raw = fs.readFileSync(absPath, "utf8");

  const h1Match = raw.match(/^#\s+\[([A-Z0-9_]+)\]\s+(.+)$/m);
  const detailCode = h1Match?.[1]?.trim() || path.basename(absPath, ".md");
  const chapterTitle = h1Match?.[2]?.trim() || detailCode;

  const sectionRegex = /^##\s+\[([A-Z0-9_-]+)\]\s+(.+)$/gm;
  const matches = Array.from(raw.matchAll(sectionRegex));

  if (matches.length === 0) return [];

  const sections: ParsedSection[] = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const sectionCode = cur[1].trim();
    const sectionTitle = cur[2].trim();
    const bodyStart = (cur.index ?? 0) + cur[0].length;
    const bodyEnd = next?.index ?? raw.length;
    const rawBody = raw.slice(bodyStart, bodyEnd).trim();

    let keywords: string[] = [];
    const kwMatch = rawBody.match(/^>\s*\*\*키워드:\*\*\s*(.+)$/m);
    if (kwMatch) {
      keywords = kwMatch[1]
        .split(/[,，]+/)
        .map((k) => k.trim())
        .filter(Boolean);
    }

    const cleanBody = rawBody.replace(/^>\s*\*\*키워드:\*\*\s*.+\r?\n*/m, "").trim();

    sections.push({
      sectionCode,
      detailCode,
      subject,
      chapterTitle,
      sectionTitle,
      keywords,
      bodyMd: cleanBody,
      sourceFile: relPath,
      sortOrder: i + 1,
    });
  }

  return sections;
}

function walkMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files.sort();
}

function scoreSectionForOption(
  section: ParsedSection,
  optionText: string,
  questionText: string,
  trapSummary: string
): number {
  const haystack = `${optionText} ${questionText} ${trapSummary}`.toLowerCase();
  let score = 0;

  for (const kw of section.keywords) {
    const cleanKw = kw.toLowerCase();
    if (cleanKw.length < 2) continue;
    if (optionText.toLowerCase().includes(cleanKw)) {
      score += 5;
    } else if (haystack.includes(cleanKw)) {
      score += 2;
    }
  }

  const titleTokens = section.sectionTitle
    .split(/[\s·(),/]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2);
  for (const tok of titleTokens) {
    if (optionText.toLowerCase().includes(tok)) {
      score += 3;
    } else if (haystack.includes(tok)) {
      score += 1;
    }
  }

  return score;
}

async function main() {
  const theoryDir = path.resolve(process.cwd(), "content/theory");
  const mdFiles = walkMarkdownFiles(theoryDir);

  if (mdFiles.length === 0) {
    console.error("No markdown theory files found in:", theoryDir);
    process.exit(1);
  }

  const allSections: ParsedSection[] = [];
  for (const file of mdFiles) {
    allSections.push(...parseMarkdownFile(file, theoryDir));
  }

  console.log(`Parsed ${mdFiles.length} markdown files -> ${allSections.length} theory sections.`);

  // 1. vertical_housing.theory_sections 업서트
  const nowIso = new Date().toISOString();
  const upsertRows = allSections.map((s) => ({
    section_code: s.sectionCode,
    detail_code: s.detailCode,
    subject: s.subject,
    chapter_title: s.chapterTitle,
    section_title: s.sectionTitle,
    keywords: s.keywords,
    body_md: s.bodyMd,
    source_file: s.sourceFile,
    sort_order: s.sortOrder,
    updated_at: nowIso,
  }));

  for (let i = 0; i < upsertRows.length; i += 100) {
    const chunk = upsertRows.slice(i, i + 100);
    const { error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("theory_sections")
      .upsert(chunk, { onConflict: "section_code" });
    if (error) {
      throw new Error(`Upsert theory_sections failed: ${error.message}`);
    }
  }
  console.log("Synced vertical_housing.theory_sections successfully.");

  // 2. detail_code -> sections 매핑 맵 구성
  const sectionsByDetail = new Map<string, ParsedSection[]>();
  for (const sec of allSections) {
    if (!sectionsByDetail.has(sec.detailCode)) {
      sectionsByDetail.set(sec.detailCode, []);
    }
    sectionsByDetail.get(sec.detailCode)!.push(sec);
  }

  // 3. 1,400제 및 5,880선지 조회 후 소주제 앵커 매핑
  const qDetailMap = new Map<string, { detailCode: string; questionText: string }>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("exam_questions")
      .select("id, detail_code, question_text")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const q of data) {
      if (q.detail_code) {
        qDetailMap.set(q.id, {
          detailCode: q.detail_code,
          questionText: q.question_text || "",
        });
      }
    }
    if (data.length < 1000) break;
  }

  const allOptions: Array<{
    id: string;
    question_id: string;
    option_text: string;
    trap_summary: string | null;
  }> = [];

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("exam_options")
      .select("id, question_id, option_text, trap_summary")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    allOptions.push(...data);
    if (data.length < 1000) break;
  }

  const updatesBySection = new Map<string, string[]>();
  let exactMatchedCount = 0;
  let fallbackCount = 0;

  for (const opt of allOptions) {
    const qMeta = qDetailMap.get(opt.question_id);
    if (!qMeta) continue;
    const candidates = sectionsByDetail.get(qMeta.detailCode);
    if (!candidates || candidates.length === 0) continue;

    let bestSection = candidates[0];
    let bestScore = 0;
    for (const cand of candidates) {
      const sc = scoreSectionForOption(
        cand,
        opt.option_text || "",
        qMeta.questionText,
        opt.trap_summary || ""
      );
      if (sc > bestScore) {
        bestScore = sc;
        bestSection = cand;
      }
    }

    if (bestScore > 0) exactMatchedCount++;
    else fallbackCount++;

    if (!updatesBySection.has(bestSection.sectionCode)) {
      updatesBySection.set(bestSection.sectionCode, []);
    }
    updatesBySection.get(bestSection.sectionCode)!.push(opt.id);
  }

  // 섹션 단위 배치 UPDATE (220회 내외로 5,880선지 초고속 반영)
  let updatedTotal = 0;
  for (const [sectionCode, optIds] of updatesBySection.entries()) {
    for (let i = 0; i < optIds.length; i += 200) {
      const chunk = optIds.slice(i, i + 200);
      const { error } = await supabaseAdmin
        .schema("vertical_housing")
        .from("exam_options")
        .update({ theory_section_code: sectionCode })
        .in("id", chunk);
      if (error) {
        throw new Error(`Update exam_options(${sectionCode}) failed: ${error.message}`);
      }
      updatedTotal += chunk.length;
    }
  }

  console.log(
    `Mapped ${updatedTotal} options -> exactKeywordMatch=${exactMatchedCount}, fallbackFirstSection=${fallbackCount}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
