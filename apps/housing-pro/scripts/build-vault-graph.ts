/**
 * Obsidian Vault (.md) → 라이브 Supabase 기출 1,400제 실제 출제 빈도 자동 집계 컴파일러
 * 실행: pnpm --filter @posmul/housing-pro build:vault
 *
 * 동작:
 * 1. content/vault/housing/ 하위 모든 개념 .md 파일 재귀 스캔 (README.md 제외)
 * 2. YAML Frontmatter + 섹션(## 핵심 특징, ## 기출 함정, ## 소장Pro 실무 팁) 파싱
 * 3. Supabase vertical_housing.exam_questions + exam_options 전체 조회
 * 4. 각 개념의 aliases가 실제 기출 문항·선지에 등장한 연도·회차·총 횟수·최근 3년 추세 자동 집계
 * 5. src/data/generated-vault-graph.json 으로 컴파일 (런타임 0ms 조회!)
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createClient } from "@supabase/supabase-js";

interface CompiledConceptNode {
  id: string;
  vaultPath: string;
  title: string;
  englishTitle?: string;
  aliases: string[];
  examStage: "1차" | "2차";
  subject: string;
  chapterCode?: string;
  category: string;
  tags: string[];
  summaryBullets: string[];
  trapWarning: string;
  examCount: number;
  examYears: number[];
  recent3YCount: number;
  recentTrend: "UP" | "FLAT" | "DOWN";
  contrastAxisId?: string;
  contrastSide?: string;
  sameGroupIds: string[];
  contrastIds: string[];
  dbSearchKeyword: string;
  lawRef?: string;
  proFieldTip?: string;
}

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

function walkMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
      results.push(...walkMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".md") && entry.name.toLowerCase() !== "readme.md") {
      results.push(full);
    }
  }
  return results;
}

function parseYamlArray(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return [];
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];
  return inner
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function parseMarkdownConcept(filePath: string, vaultRoot: string): CompiledConceptNode | null {
  const content = fs.readFileSync(filePath, "utf-8");
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) return null;

  const fmText = fmMatch[1];
  const body = fmMatch[2];
  const fm: Record<string, string> = {};

  for (const line of fmText.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    fm[k] = v;
  }

  if (!fm.id || !fm.title) return null;

  const extractSection = (heading: string): string => {
    const re = new RegExp(`##\\s+${heading}\\r?\\n([\\s\\S]*?)(?=\\r?\\n##\\s+|$)`);
    const m = body.match(re);
    return m ? m[1].trim() : "";
  };

  const summaryRaw = extractSection("핵심 특징");
  const summaryBullets = summaryRaw
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  const trapWarning = extractSection("기출 함정")
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•>]\s*/, "").trim())
    .filter(Boolean)
    .join(" ");

  const proFieldTip = extractSection("소장Pro 실무 팁")
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•>]\s*/, "").trim())
    .filter(Boolean)
    .join(" ");

  // Raw frontmatter values for array parsing (before quote stripping)
  const rawFmLine = (key: string) => {
    const m = fmText.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return m ? m[1].trim() : "";
  };

  const relPath = path.relative(vaultRoot, filePath).replace(/\\/g, "/");

  return {
    id: fm.id,
    vaultPath: relPath,
    title: fm.title,
    ...(fm.english_title ? { englishTitle: fm.english_title } : {}),
    aliases: parseYamlArray(rawFmLine("aliases")),
    examStage: fm.exam_stage === "1차" ? "1차" : "2차",
    subject: fm.subject || "주택관리관계법규",
    ...(fm.chapter_code ? { chapterCode: fm.chapter_code } : {}),
    category: fm.category || "핵심 개념",
    tags: parseYamlArray(rawFmLine("tags")),
    summaryBullets: summaryBullets.length > 0 ? summaryBullets : [fm.title],
    trapWarning: trapWarning || "기출 단골 키워드입니다. 연관 선지 표현을 정확히 비교하세요.",
    examCount: 0,
    examYears: [],
    recent3YCount: 0,
    recentTrend: "FLAT",
    ...(fm.contrast_axis_id ? { contrastAxisId: fm.contrast_axis_id } : {}),
    ...(fm.contrast_side ? { contrastSide: fm.contrast_side } : {}),
    sameGroupIds: parseYamlArray(rawFmLine("same_group_ids")),
    contrastIds: parseYamlArray(rawFmLine("contrast_ids")),
    dbSearchKeyword: fm.db_search_keyword || fm.title,
    ...(fm.law_ref ? { lawRef: fm.law_ref } : {}),
    ...(proFieldTip ? { proFieldTip } : {}),
  };
}

async function fetchAllExamCorpus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn("⚠️ Supabase 환경변수가 없어 DB 출제 빈도 집계를 건너뜁니다.");
    return [];
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. 전체 기출 문항 조회 (1,400제)
  const questions: Array<{
    id: string;
    exam_year: number;
    subject: string;
    question_text: string;
    box_content: string | null;
  }> = [];

  for (let offset = 0; offset < 3000; offset += 500) {
    const { data, error } = await supabase
      .schema("vertical_housing")
      .from("exam_questions")
      .select("id, exam_year, subject, question_text, box_content")
      .range(offset, offset + 499);
    if (error || !data || data.length === 0) break;
    questions.push(...data);
    if (data.length < 500) break;
  }

  // 2. 전체 선지 조회 (5,880선지)
  const optionsByQ = new Map<string, string[]>();
  for (let offset = 0; offset < 10000; offset += 1000) {
    const { data, error } = await supabase
      .schema("vertical_housing")
      .from("exam_options")
      .select("question_id, option_text")
      .range(offset, offset + 999);
    if (error || !data || data.length === 0) break;
    for (const row of data) {
      const list = optionsByQ.get(row.question_id) || [];
      list.push(row.option_text);
      optionsByQ.set(row.question_id, list);
    }
    if (data.length < 1000) break;
  }

  return questions.map((q) => {
    const fullText = `${q.question_text} ${q.box_content || ""} ${(optionsByQ.get(q.id) || []).join(" ")}`;
    return {
      id: q.id,
      examYear: q.exam_year,
      subject: q.subject,
      fullText,
      compactText: fullText.replace(/\s+/g, ""),
    };
  });
}

async function main() {
  loadEnvLocal();
  const vaultRoot = path.resolve(process.cwd(), "content", "vault", "housing");
  const mdFiles = walkMarkdownFiles(vaultRoot);
  const nodes: CompiledConceptNode[] = [];

  for (const file of mdFiles) {
    const parsed = parseMarkdownConcept(file, vaultRoot);
    if (parsed) nodes.push(parsed);
  }

  const corpus = await fetchAllExamCorpus();
  console.log(`📚 Vault 파일 ${nodes.length}개 로드 · 라이브 DB 기출 ${corpus.length}문항 스캔 중...`);

  for (const node of nodes) {
    // 같은 과목(또는 2차 법규↔실무 교차 허용) 내 실제 기출 문항 매칭
    const matchYears = new Set<number>();
    let matchedQCount = 0;
    let recent3Y = 0;
    let olderCount = 0;

    // 너무 짧은 1글자 별칭("티", "캡" 등)은 오매칭 방지를 위해 배관 문맥 함께 확인
    const shortSafeAliases = node.aliases
      .filter((a) => a.length >= 2)
      .map((a) => ({ raw: a, compact: a.replace(/\s+/g, "") }));
    const singleCharAliases = node.aliases.filter((a) => a.length === 1);

    for (const q of corpus) {
      const sameSubject =
        q.subject === node.subject ||
        (node.examStage === "2차" &&
          (q.subject === "주택관리관계법규" || q.subject === "공동주택관리실무"));
      if (!sameSubject) continue;

      let hit = shortSafeAliases.some(
        (a) => q.fullText.includes(a.raw) || q.compactText.includes(a.compact)
      );
      if (!hit && singleCharAliases.length > 0 && q.fullText.includes("배관")) {
        hit = singleCharAliases.some((a) => q.fullText.includes(a));
      }

      if (hit) {
        matchedQCount += 1;
        matchYears.add(q.examYear);
        if (q.examYear >= 2023) recent3Y += 1;
        else olderCount += 1;
      }
    }

    node.examCount = matchedQCount;
    node.examYears = Array.from(matchYears).sort((a, b) => a - b);
    node.recent3YCount = recent3Y;
    node.recentTrend =
      recent3Y >= 3 && recent3Y >= olderCount
        ? "UP"
        : recent3Y === 0 && olderCount >= 2
          ? "DOWN"
          : "FLAT";
  }

  // 정렬: 2차 우선 → 출제 횟수 내림차순
  nodes.sort((a, b) => {
    if (a.examStage !== b.examStage) return a.examStage === "2차" ? -1 : 1;
    return b.examCount - a.examCount;
  });

  // =========================================================================
  // Vault 무결성 자동 검증기 (대규모 확장 시 ID 중복·깨진 링크·별칭 충돌 차단)
  // =========================================================================
  const idSet = new Set<string>();
  const duplicateIds: string[] = [];
  for (const n of nodes) {
    if (idSet.has(n.id)) duplicateIds.push(n.id);
    idSet.add(n.id);
  }

  const brokenRefs: string[] = [];
  const aliasOwner = new Map<string, string>();
  const aliasCollisions: string[] = [];
  const zeroHitStage2: string[] = [];

  for (const n of nodes) {
    for (const refId of [...n.sameGroupIds, ...n.contrastIds]) {
      if (!idSet.has(refId)) {
        brokenRefs.push(`${n.id} -> ${refId}`);
      }
    }
    for (const alias of n.aliases) {
      const prev = aliasOwner.get(alias);
      if (prev && prev !== n.id) {
        aliasCollisions.push(`"${alias}": ${prev} ↔ ${n.id}`);
      } else {
        aliasOwner.set(alias, n.id);
      }
    }
    if (n.examStage === "2차" && n.examCount === 0) {
      zeroHitStage2.push(n.id);
    }
  }

  const outputPath = path.resolve(process.cwd(), "src", "data", "generated-vault-graph.json");

  // 2차 실제 기출 커버리지율(%) 산출
  const stage2Corpus = corpus.filter(
    (q) => q.subject === "주택관리관계법규" || q.subject === "공동주택관리실무"
  );
  const stage2Aliases = nodes
    .filter((n) => n.examStage === "2차")
    .flatMap((n) =>
      n.aliases
        .filter((a) => a.length >= 2)
        .map((a) => ({ raw: a, compact: a.replace(/\s+/g, "") }))
    );

  let stage2CoveredCount = 0;
  for (const q of stage2Corpus) {
    if (stage2Aliases.some((a) => q.fullText.includes(a.raw) || q.compactText.includes(a.compact))) {
      stage2CoveredCount += 1;
    }
  }
  const stage2CoveragePercent =
    stage2Corpus.length > 0
      ? Number(((stage2CoveredCount / stage2Corpus.length) * 100).toFixed(1))
      : 0;

  const payload = {
    generatedAt: new Date().toISOString(),
    totalQuestionsScanned: corpus.length,
    totalNodes: nodes.length,
    stage2TotalQuestions: stage2Corpus.length,
    stage2CoveredQuestions: stage2CoveredCount,
    stage2CoveragePercent,
    nodes,
  };

  // 컴팩트 JSON 출력으로 번들 용량 최소화
  const serialized = JSON.stringify(payload);
  fs.writeFileSync(outputPath, serialized, "utf-8");

  const rawKb = (Buffer.byteLength(serialized, "utf-8") / 1024).toFixed(1);
  const gzipKb = (zlib.gzipSync(serialized).length / 1024).toFixed(1);

  console.log(`✅ 생성 완료: ${outputPath}`);
  console.log(
    `📊 2차 실제 기출 커버리지: ${stage2CoveredCount}/${stage2Corpus.length}문항 (${stage2CoveragePercent}%)`
  );
  console.log(`📦 번들 용량 진단: Raw ${rawKb} KB / Gzip ${gzipKb} KB (노드 ${nodes.length}개)`);
  if (nodes.length >= 300) {
    console.warn("⚠️ 노드가 300개를 초과했습니다. 과목별 지연 로딩(Lazy Split) 전환을 권장합니다.");
  }

  // 무결성 리포트 출력
  console.log("🛡️ Vault 무결성 자동 검증 결과:");
  console.log(`   - ID 중복: ${duplicateIds.length}건`);
  console.log(`   - 깨진 내부 링크: ${brokenRefs.length}건`);
  console.log(`   - 별칭(Alias) 충돌: ${aliasCollisions.length}건`);
  console.log(`   - 2차 0회 출제 고아 개념: ${zeroHitStage2.length}건`);
  if (duplicateIds.length > 0) console.error("   ❌ 중복 ID:", duplicateIds.join(", "));
  if (brokenRefs.length > 0) console.warn("   ⚠️ 깨진 링크:", brokenRefs.join(", "));
  if (aliasCollisions.length > 0) console.warn("   ⚠️ 별칭 충돌:", aliasCollisions.join(", "));

  console.log("🔥 2차 최다 빈출 TOP 10 (실제 DB 기출 집계):");
  for (const n of nodes.filter((x) => x.examStage === "2차").slice(0, 10)) {
    console.log(
      `   - [${n.subject.slice(0, 4)}] ${n.title}: 실제 ${n.examCount}문항 출제 (${n.examYears.join(",") || "-"})`
    );
  }
}

void main();
