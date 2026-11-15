import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../.env.local");
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return result;
  for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
    if (m) {
      result[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

interface RawOptionRow {
  id: string;
  question_id: string;
  option_number: number;
  option_text: string;
  is_correct: boolean;
  question: {
    exam_year: number;
    exam_round: number;
    exam_stage: string;
    subject: string;
    chapter_code: string | null;
    question_number: number;
    law_status: string | null;
  };
}

interface CitationItem {
  year: number;
  round: number;
  stage: string;
  subject: string;
  questionNumber: number;
  optionNumber: number;
  isCorrect: boolean;
  optionText: string;
}

function normalizeExact(text: string): string {
  return text
    .replace(/[\s·ㆍ.,?!"'「」『』()\[\]“”‘’]/g, "")
    .replace(/(이다|한다|된다|있다|없다)$/g, (m) => m);
}

function buildSkeletonKey(text: string): string {
  let s = text
    .replace(/[\s·ㆍ.,?!"'「」『』“”‘’]/g, "")
    // 종결 어미의 긍정/부정 변형 통일
    .replace(
      /(하여야한다|해야한다|하지아니하여야한다|하지않아도된다|할수있다|할수없다|하지아니한다|하지않는다|포함된다|포함되지아니한다|포함되지않는다|포함한다|제외한다|제외된다|해당한다|해당하지아니한다|해당하지않는다|인정된다|인정되지아니한다|성립한다|성립하지아니한다|유효하다|무효이다|무효로한다|취소할수있다|취소할수없다|존재한다|존재하지아니한다|아니한다|않는다|아니다|이다|한다|된다|있다|없다)$/g,
      "#END#"
    );

  // 긴 문장(22자 이상)은 조항 번호(제N조/제N항/제N호)를 제외한 수량 숫자(일/개월/년/명/세대/퍼센트/분수)를 #N#으로 치환해 숫자 함정 변형도 같은 논점으로 포착
  if (s.length >= 22) {
    s = s.replace(/(?<!제)\d+(분의\d+)?(?=(일|개월|년|명|세대|호|층|회|배|%|퍼센트|원|미터|m|㎡))/gi, "#N#");
  }
  return s;
}

function charTrigrams(str: string): Set<string> {
  const clean = str.replace(/#END#|#N#/g, "");
  const set = new Set<string>();
  for (let i = 0; i <= clean.length - 3; i++) {
    set.add(clean.slice(i, i + 3));
  }
  return set;
}

function trigramDice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const g of a) {
    if (b.has(g)) inter++;
  }
  return (2 * inter) / (a.size + b.size);
}

async function main() {
  const env = loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials");

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) 전체 선지 + 문항 메타 로드 (1,000건씩 페이지네이션)
  const rows: RawOptionRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .schema("vertical_housing")
      .from("exam_options")
      .select(
        "id, question_id, option_number, option_text, is_correct, question:exam_questions!inner(exam_year, exam_round, exam_stage, subject, chapter_code, question_number, law_status)"
      )
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Load exam_options error: ${JSON.stringify(error)}`);
    if (!data || data.length === 0) break;

    for (const r of data as unknown as Array<Record<string, unknown>>) {
      const qRaw = Array.isArray(r.question) ? r.question[0] : r.question;
      rows.push({
        id: r.id as string,
        question_id: r.question_id as string,
        option_number: r.option_number as number,
        option_text: r.option_text as string,
        is_correct: r.is_correct as boolean,
        question: qRaw as RawOptionRow["question"],
      });
    }
    if (data.length < PAGE) break;
  }

  console.log(`📥 로드된 전체 선지 수: ${rows.length}건`);

  // 2) 클러스터링 그룹 키 (1차는 과목별, 2차 법규·실무 및 시설개론 법령은 교차 허용)
  const getPoolGroup = (row: RawOptionRow): string => {
    if (row.question.exam_stage === "2차") return "2차_법규실무";
    return `1차_${row.question.subject}`;
  };

  // 서술형 지문(정규화 길이 >= 18자)만 클러스터링 대상, 단답/숫자 선지는 독립 1건 유지
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let cur = id;
    while (parent.get(cur) !== cur) {
      cur = parent.get(cur)!;
    }
    let walk = id;
    while (walk !== cur) {
      const nxt = parent.get(walk)!;
      parent.set(walk, cur);
      walk = nxt;
    }
    return cur;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };

  const exactBuckets = new Map<string, string[]>();
  const skelBuckets = new Map<string, string[]>();
  const eligibleTrigrams: Array<{
    id: string;
    pool: string;
    len: number;
    trigrams: Set<string>;
    row: RawOptionRow;
  }> = [];

  for (const r of rows) {
    parent.set(r.id, r.id);
    const norm = normalizeExact(r.option_text);
    if (norm.length < 18) continue;

    const pool = getPoolGroup(r);
    const exactKey = `${pool}|${norm}`;
    const skel = buildSkeletonKey(r.option_text);
    const skelKey = `${pool}|${skel}`;

    if (!exactBuckets.has(exactKey)) exactBuckets.set(exactKey, []);
    exactBuckets.get(exactKey)!.push(r.id);

    if (!skelBuckets.has(skelKey)) skelBuckets.set(skelKey, []);
    skelBuckets.get(skelKey)!.push(r.id);

    if (norm.length >= 26) {
      eligibleTrigrams.push({
        id: r.id,
        pool,
        len: norm.length,
        trigrams: charTrigrams(skel),
        row: r,
      });
    }
  }

  for (const ids of exactBuckets.values()) {
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
  }
  for (const ids of skelBuckets.values()) {
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
  }

  // 3) 고신뢰 유사도(trigram Dice >= 0.84, 길이 비율 >= 0.80) 보완 병합 (같은 pool 내부에서만)
  const byPool = new Map<string, typeof eligibleTrigrams>();
  for (const item of eligibleTrigrams) {
    if (!byPool.has(item.pool)) byPool.set(item.pool, []);
    byPool.get(item.pool)!.push(item);
  }

  let similarityMerges = 0;
  for (const items of byPool.values()) {
    // 앞 4글자 + 중간 조각 인덱스 대신 길이순 정렬 후 ±20% 범위 내 비교 (수백~천여 건이라 수십 ms 내 완료)
    items.sort((a, b) => a.len - b.len);
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      const maxLen = Math.ceil(a.len * 1.2);
      for (let j = i + 1; j < items.length; j++) {
        const b = items[j];
        if (b.len > maxLen) break;
        if (find(a.id) === find(b.id)) continue;
        // 서로 다른 문항에서만 병합 (같은 문항 내 선지끼리는 제외)
        if (a.row.question_id === b.row.question_id) continue;

        const sim = trigramDice(a.trigrams, b.trigrams);
        if (sim >= 0.84) {
          union(a.id, b.id);
          similarityMerges++;
        }
      }
    }
  }
  console.log(`🔗 유사도(Dice >= 0.84) 추가 병합: ${similarityMerges}쌍`);

  // 4) 클러스터 그룹핑
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  const clusterGroups = new Map<string, RawOptionRow[]>();
  for (const r of rows) {
    const root = find(r.id);
    if (!clusterGroups.has(root)) clusterGroups.set(root, []);
    clusterGroups.get(root)!.push(r);
  }

  const multiClusters: Array<{
    subject: string;
    chapter_code: string | null;
    canonical_text: string;
    skeleton_key: string;
    repeat_count: number;
    distinct_year_count: number;
    appeared_years: number[];
    appeared_citations: CitationItem[];
    optionIds: string[];
  }> = [];

  for (const members of clusterGroups.values()) {
    // 정렬: 최신 연도 순 -> 회차 -> 문항번호
    members.sort((a, b) => {
      if (a.question.exam_year !== b.question.exam_year) return a.question.exam_year - b.question.exam_year;
      if (a.question.exam_stage !== b.question.exam_stage) return a.question.exam_stage.localeCompare(b.question.exam_stage);
      return a.question.question_number - b.question.question_number;
    });

    const years = Array.from(new Set(members.map((m) => m.question.exam_year))).sort((a, b) => a - b);
    const citations: CitationItem[] = members.map((m) => ({
      year: m.question.exam_year,
      round: m.question.exam_round,
      stage: m.question.exam_stage,
      subject: m.question.subject,
      questionNumber: m.question.question_number,
      optionNumber: m.option_number,
      isCorrect: m.is_correct,
      optionText: m.option_text,
    }));

    const latest = members[members.length - 1];
    multiClusters.push({
      subject: latest.question.subject,
      chapter_code: latest.question.chapter_code,
      canonical_text: latest.option_text,
      skeleton_key: buildSkeletonKey(latest.option_text),
      repeat_count: members.length,
      distinct_year_count: years.length,
      appeared_years: years,
      appeared_citations: citations,
      optionIds: members.map((m) => m.id),
    });
  }

  const repeatedOnly = multiClusters.filter((c) => c.repeat_count >= 2);
  const multiYearOnly = multiClusters.filter((c) => c.distinct_year_count >= 2);
  console.log(`📊 전체 논점 클러스터: ${multiClusters.length}개`);
  console.log(`   - 2회 이상 반복 출제 지문 클러스터: ${repeatedOnly.length}개 (포함 선지 ${repeatedOnly.reduce((s, c) => s + c.repeat_count, 0)}개)`);
  console.log(`   - 2개년 이상 교차 출제 지문 클러스터: ${multiYearOnly.length}개`);

  console.log("\n🔥 상위 반복 출제 지문 Top 10 미리보기:");
  for (const c of [...multiYearOnly].sort((a, b) => b.distinct_year_count - a.distinct_year_count || b.repeat_count - a.repeat_count).slice(0, 10)) {
    console.log(
      `  [${c.subject} | ${c.distinct_year_count}개년 총 ${c.repeat_count}회 (${c.appeared_years.join(",")})] ${c.canonical_text.slice(0, 65)}...`
    );
  }

  // 5) DB 반영 (기존 cluster_id 해제 -> option_clusters 비우고 다회/단일 클러스터 저장)
  // 실제로는 2회 이상 반복 클러스터만 option_clusters에 저장하거나, 전체를 저장할지 결정:
  // 2회 이상 반복 지문만 option_clusters에 마스터로 저장하고, 1회 지문도 exam_options.appeared_citations = [자기 출처]로 모두 채우면
  // 5,880개 전부에 대해 "어느 연도 몇번 지문인지 + 총 몇번 나왔는지"가 100% 일관되게 조회된다!
  console.log("\n💾 DB 업데이트 시작...");

  // 기존 option_clusters 초기화 (재실행 안전)
  const { error: resetErr } = await supabase
    .schema("vertical_housing")
    .from("exam_options")
    .update({ cluster_id: null })
    .not("cluster_id", "is", null);
  if (resetErr) throw new Error(`Reset cluster_id failed: ${JSON.stringify(resetErr)}`);

  const { error: delErr } = await supabase
    .schema("vertical_housing")
    .from("option_clusters")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) throw new Error(`Delete option_clusters failed: ${JSON.stringify(delErr)}`);

  // 2회 이상 반복 클러스터 insert (반환된 id를 해당 option들에 연결)
  const CLUSTER_BATCH = 100;
  const clusterIdByOptId = new Map<string, string>();
  for (let i = 0; i < repeatedOnly.length; i += CLUSTER_BATCH) {
    const slice = repeatedOnly.slice(i, i + CLUSTER_BATCH);
    const payload = slice.map(({ optionIds: _ids, ...rest }) => rest);
    const { data: inserted, error } = await supabase
      .schema("vertical_housing")
      .from("option_clusters")
      .insert(payload)
      .select("id");
    if (error || !inserted) throw new Error(`Insert clusters failed: ${JSON.stringify(error)}`);
    inserted.forEach((row, idx) => {
      for (const optId of slice[idx].optionIds) {
        clusterIdByOptId.set(optId, row.id);
      }
    });
  }
  console.log(`💾 option_clusters 저장 완료: ${repeatedOnly.length}건`);

  // exam_options 업데이트 (repeat_count, appeared_citations, cluster_id)
  // 5,880건을 개별 update하면 느리므로, (cluster 단위 + 단일 건 배치) upsert 사용!
  // 참고: upsert에는 NOT NULL 컬럼(question_id, option_number, option_text, is_correct)이 필요할 수 있으므로,
  // cluster 그룹별 update(in("id", optionIds))로 2회 이상 그룹은 한 번에 처리하고,
  // 1회 단독 지문도 100건씩 묶거나 Postgres SQL/RPC 또는 병렬 update로 빠르게 반영한다.
  for (const c of repeatedOnly) {
    const cid = clusterIdByOptId.get(c.optionIds[0])!;
    const { error } = await supabase
      .schema("vertical_housing")
      .from("exam_options")
      .update({
        cluster_id: cid,
        repeat_count: c.repeat_count,
        appeared_citations: c.appeared_citations,
      })
      .in("id", c.optionIds);
    if (error) throw new Error(`Update repeated cluster failed: ${JSON.stringify(error)}`);
  }
  console.log(`💾 반복 지문 선지 업데이트 완료: ${repeatedOnly.reduce((s, c) => s + c.repeat_count, 0)}건`);

  // 1회 단독 지문은 repeat_count = 1, appeared_citations = [자기 출처 1건] 설정 (병렬 20개씩)
  const singles = multiClusters.filter((c) => c.repeat_count === 1);
  const CONC = 20;
  for (let i = 0; i < singles.length; i += CONC) {
    const chunk = singles.slice(i, i + CONC);
    await Promise.all(
      chunk.map(async (c) => {
        const { error } = await supabase
          .schema("vertical_housing")
          .from("exam_options")
          .update({
            cluster_id: null,
            repeat_count: 1,
            appeared_citations: c.appeared_citations,
          })
          .eq("id", c.optionIds[0]);
        if (error) throw new Error(`Update single option failed: ${JSON.stringify(error)}`);
      })
    );
  }
  console.log(`💾 단일 지문 선지 citation 채움 완료: ${singles.length}건`);
  console.log("🎉 전체 보기지문 연도/반복출제 클러스터링 완료!");
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
