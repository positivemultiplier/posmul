import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

export interface CachedQuestionCatalogRow {
  id: string;
  exam_year: number;
  exam_round: number;
  exam_stage: string;
  subject: string;
  chapter_code: string | null;
  chapter_title: string | null;
  detail_code: string | null;
  detail_title: string | null;
}

export interface CachedPublicQuestionRow {
  id: string;
  exam_year: number;
  exam_round: number;
  exam_stage: string;
  subject: string;
  detail_code: string | null;
  chapter_title: string | null;
  importance_tier: string | null;
  question_number: number;
  question_type: "OBJECTIVE" | "SUBJECTIVE";
  question_text: string;
  box_content: string | null;
  correct_options: number[] | null;
  subjective_answer: string | null;
  law_status: string | null;
  amended_note: string | null;
  original_snapshot: Record<string, unknown> | null;
  metadata: { isNegativeQuestion?: boolean } | null;
}

export interface CachedPublicOptionRow {
  id: string;
  question_id: string;
  option_number: number;
  option_text: string;
  is_correct: boolean;
  trap_summary: string | null;
  legal_citation: string | null;
  theory_section_code: string | null;
  repeat_count: number | null;
  appeared_citations: unknown;
  is_amended: boolean | null;
  amended_note: string | null;
  original_option_text: string | null;
}

export interface CachedSolveSetBundle {
  questions: CachedPublicQuestionRow[];
  options: CachedPublicOptionRow[];
  totalInSet: number;
  appliedDifficulty: "ALL" | "SA" | "SAB";
}

/**
 * 전체 기출 카탈로그 메타(1,400제) 1시간 서버 캐시
 * (기출 문항 데이터는 거의 변하지 않으므로 매 요청 풀스캔을 원천 제거)
 */
export const getCachedExamQuestionCatalog = unstable_cache(
  async (): Promise<CachedQuestionCatalogRow[]> => {
    const allRows: CachedQuestionCatalogRow[] = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabaseAdmin
        .schema("vertical_housing")
        .from("exam_questions")
        .select(
          "id, exam_year, exam_round, exam_stage, subject, chapter_code, chapter_title, detail_code, detail_title"
        )
        .neq("law_status", "DEPRECATED")
        .order("exam_year", { ascending: false })
        .order("question_number", { ascending: true })
        .range(from, from + PAGE - 1);

      if (error) {
        throw new Error(error.message);
      }
      if (!data || data.length === 0) break;
      allRows.push(...(data as CachedQuestionCatalogRow[]));
      if (data.length < PAGE) break;
    }
    return allRows;
  },
  ["housing-pro-exam-catalog-v1"],
  { revalidate: 3600 }
);

/**
 * 특정 세트(최대 20제)의 공개 문항 + 선지 전체를 1방에 1시간 서버 캐시
 */
export const getCachedSolveSetPublicBundle = unstable_cache(
  async (
    setKey: string,
    requestedDifficulty: "ALL" | "SA" | "SAB",
    maxQuestions: number
  ): Promise<CachedSolveSetBundle> => {
    const parts = setKey.split("::");
    const kind = parts[0];
    const safeMax = Math.max(1, Math.min(20, Math.floor(maxQuestions)));

    let sliceIndex = 0;
    if (kind === "CHAPTER") sliceIndex = Number(parts[4]) || 0;
    else if (kind === "ROUND") sliceIndex = Number(parts[5]) || 0;
    else {
      return { questions: [], options: [], totalInSet: 0, appliedDifficulty: "ALL" };
    }

    const from = sliceIndex * 20;
    const to = from + safeMax - 1;

    const buildQuery = (diff: "ALL" | "SA" | "SAB") => {
      let q = supabaseAdmin
        .schema("vertical_housing")
        .from("exam_questions")
        .select(
          `
          id,
          exam_year,
          exam_round,
          exam_stage,
          subject,
          detail_code,
          chapter_title,
          importance_tier,
          question_number,
          question_type,
          question_text,
          box_content,
          correct_options,
          subjective_answer,
          law_status,
          amended_note,
          original_snapshot,
          metadata
        `,
          { count: "exact" }
        )
        .neq("law_status", "DEPRECATED");

      if (diff === "SA") q = q.in("importance_tier", ["S", "A"]);
      else if (diff === "SAB") q = q.in("importance_tier", ["S", "A", "B"]);

      if (kind === "CHAPTER") {
        const [, stage, subject, code] = parts;
        q = q
          .eq("exam_stage", stage)
          .eq("subject", subject)
          .or(`detail_code.eq.${code},chapter_code.eq.${code}`)
          .order("exam_year", { ascending: false })
          .order("question_number", { ascending: true });
      } else if (kind === "ROUND") {
        const [, yearStr, roundStr, stage, subject] = parts;
        q = q
          .eq("exam_year", Number(yearStr))
          .eq("exam_round", Number(roundStr))
          .eq("exam_stage", stage)
          .eq("subject", subject)
          .order("question_number", { ascending: true });
      }
      return q;
    };

    let appliedDifficulty: "ALL" | "SA" | "SAB" = requestedDifficulty;
    let { data: qRows, count: totalMatched, error: qErr } = await buildQuery(
      requestedDifficulty
    ).range(from, to);

    if (!qErr && (!qRows || qRows.length === 0) && requestedDifficulty !== "ALL") {
      appliedDifficulty = "ALL";
      const fallback = await buildQuery("ALL").range(from, to);
      qRows = fallback.data;
      totalMatched = fallback.count;
      qErr = fallback.error;
    }

    if (qErr) {
      throw new Error(qErr.message);
    }

    const questions = (qRows ?? []) as CachedPublicQuestionRow[];
    const totalInSet = Math.max(
      0,
      Math.min(safeMax, (totalMatched ?? from + questions.length) - from)
    );

    if (questions.length === 0) {
      return { questions: [], options: [], totalInSet, appliedDifficulty };
    }

    const qIds = questions.map((q) => q.id);
    const { data: optRows, error: optErr } = await supabaseAdmin
      .schema("vertical_housing")
      .from("exam_options")
      .select(
        "id, question_id, option_number, option_text, is_correct, trap_summary, legal_citation, theory_section_code, repeat_count, appeared_citations, is_amended, amended_note, original_option_text"
      )
      .in("question_id", qIds)
      .order("option_number", { ascending: true });

    if (optErr) {
      throw new Error(optErr.message);
    }

    return {
      questions,
      options: (optRows ?? []) as CachedPublicOptionRow[],
      totalInSet,
      appliedDifficulty,
    };
  },
  ["housing-pro-solve-set-bundle-v1"],
  { revalidate: 3600 }
);
