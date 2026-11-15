"use server";

import { supabaseAdmin } from "@/lib/supabase";

export type LawStatus = "VALID" | "NEEDS_REVIEW" | "AMENDED_MODIFIED" | "DEPRECATED";

export interface OxCitationItem {
  year: number;
  round: number;
  stage: string;
  subject: string;
  questionNumber: number;
  optionNumber: number;
  isCorrect: boolean;
  optionText: string;
}

export interface OriginalQuestionSnapshot {
  question_text?: string;
  box_content?: string | null;
  correct_options?: number[] | null;
  subjective_answer?: string | null;
}

export interface ExamOxCardItem {
  id: string;
  questionId: string;
  examYear: number;
  examRound: number;
  examStage: string;
  subject: string;
  chapterTitle: string | null;
  importanceTier: string | null;
  questionNumber: number;
  questionText: string;
  optionNumber: number;
  statement: string;
  isCorrectStatement: boolean;
  masteryTier: number;
  trapCorrection: string | null;
  citation: string | null;
  repeatCount: number;
  appearedCitations: OxCitationItem[];
  lawStatus: LawStatus;
  amendedNote: string | null;
  isAmendedOption: boolean;
  originalOptionText: string | null;
  originalQuestionSnapshot: OriginalQuestionSnapshot | null;
}

export interface AmendedQuestionPreviewItem {
  id: string;
  examYear: number;
  examRound: number;
  examStage: string;
  subject: string;
  chapterTitle: string | null;
  questionNumber: number;
  questionType: string;
  questionText: string;
  boxContent: string | null;
  subjectiveAnswer: string | null;
  lawStatus: LawStatus;
  amendedNote: string | null;
  originalSnapshot: OriginalQuestionSnapshot | null;
}

export interface FetchExamOxCardsInput {
  subject?: string;
  maxTier?: number;
  onlyRepeated?: boolean;
  limit?: number;
}

interface JoinedQuestionRow {
  id: string;
  exam_year: number;
  exam_round: number;
  exam_stage: string;
  subject: string;
  chapter_title: string | null;
  importance_tier: string | null;
  question_number: number;
  question_text: string;
  law_status: LawStatus | null;
  amended_note: string | null;
  original_snapshot: OriginalQuestionSnapshot | null;
  metadata: { oxEligible?: boolean } | null;
}

interface RawOptionJoinedRow {
  id: string;
  question_id: string;
  option_number: number;
  option_text: string;
  is_correct: boolean;
  mastery_tier: number | null;
  trap_summary: string | null;
  legal_citation: string | null;
  repeat_count: number | null;
  appeared_citations: OxCitationItem[] | null;
  is_amended: boolean | null;
  amended_note: string | null;
  original_option_text: string | null;
  question: JoinedQuestionRow | JoinedQuestionRow[];
}

/**
 * 실제 DB(vertical_housing.exam_options + exam_questions)에서
 * 출제 연도·회차·반복출제 이력·개정 반영 여부를 포함한 O/X 훈련 카드를 조회합니다.
 */
export async function fetchExamOxCardsAction(
  input: FetchExamOxCardsInput = {}
): Promise<{ success: boolean; cards: ExamOxCardItem[]; totalMatched: number; error?: string }> {
  try {
    const { subject = "ALL", maxTier = 5, onlyRepeated = false, limit = 60 } = input;

    let query = supabaseAdmin
      .schema("vertical_housing")
      .from("exam_options")
      .select(
        `
        id,
        question_id,
        option_number,
        option_text,
        is_correct,
        mastery_tier,
        trap_summary,
        legal_citation,
        repeat_count,
        appeared_citations,
        is_amended,
        amended_note,
        original_option_text,
        question:exam_questions!inner(
          id,
          exam_year,
          exam_round,
          exam_stage,
          subject,
          chapter_title,
          importance_tier,
          question_number,
          question_text,
          law_status,
          amended_note,
          original_snapshot,
          metadata
        )
      `,
        { count: "exact" }
      )
      .lte("mastery_tier", maxTier)
      .neq("question.law_status", "DEPRECATED")
      .eq("question.metadata->>oxEligible", "true");

    if (subject !== "ALL") {
      query = query.eq("question.subject", subject);
    }
    if (onlyRepeated) {
      query = query.gte("repeat_count", 2);
    }

    const { data, count, error } = await query
      .order("repeat_count", { ascending: false })
      .order("mastery_tier", { ascending: true })
      .limit(limit);

    if (error) {
      return { success: false, cards: [], totalMatched: 0, error: error.message };
    }

    const rows = (data ?? []) as unknown as RawOptionJoinedRow[];
    const cards: ExamOxCardItem[] = rows.map((row) => {
      const q = Array.isArray(row.question) ? row.question[0] : row.question;
      const citations = Array.isArray(row.appeared_citations) ? row.appeared_citations : [];
      const qLawStatus: LawStatus = q.law_status ?? "VALID";

      return {
        id: row.id,
        questionId: row.question_id,
        examYear: q.exam_year,
        examRound: q.exam_round,
        examStage: q.exam_stage,
        subject: q.subject,
        chapterTitle: q.chapter_title,
        importanceTier: q.importance_tier,
        questionNumber: q.question_number,
        questionText: q.question_text,
        optionNumber: row.option_number,
        statement: row.option_text,
        isCorrectStatement: row.is_correct,
        masteryTier: row.mastery_tier ?? 2,
        trapCorrection: row.trap_summary,
        citation: row.legal_citation,
        repeatCount: row.repeat_count ?? 1,
        appearedCitations: citations,
        lawStatus: qLawStatus,
        amendedNote: row.amended_note || q.amended_note || null,
        isAmendedOption: Boolean(row.is_amended),
        originalOptionText: row.original_option_text ?? null,
        originalQuestionSnapshot: q.original_snapshot ?? null,
      };
    });

    return {
      success: true,
      cards,
      totalMatched: count ?? cards.length,
    };
  } catch (err) {
    return {
      success: false,
      cards: [],
      totalMatched: 0,
      error: err instanceof Error ? err.message : "DB 조회 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 현행법 개정 반영(AMENDED_MODIFIED) 및 개정 확인 필요(NEEDS_REVIEW) 문항 목록 조회
 */
export async function fetchLawAmendedQuestionsAction(): Promise<{
  success: boolean;
  items: AmendedQuestionPreviewItem[];
  error?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("exam_questions")
      .select(
        "id, exam_year, exam_round, exam_stage, subject, chapter_title, question_number, question_type, question_text, box_content, subjective_answer, law_status, amended_note, original_snapshot"
      )
      .in("law_status", ["AMENDED_MODIFIED", "NEEDS_REVIEW"])
      .order("law_status", { ascending: true })
      .order("exam_year", { ascending: false })
      .order("question_number", { ascending: true })
      .limit(50);

    if (error) {
      return { success: false, items: [], error: error.message };
    }

    const rows = (data ?? []) as Array<{
      id: string;
      exam_year: number;
      exam_round: number;
      exam_stage: string;
      subject: string;
      chapter_title: string | null;
      question_number: number;
      question_type: string;
      question_text: string;
      box_content: string | null;
      subjective_answer: string | null;
      law_status: LawStatus;
      amended_note: string | null;
      original_snapshot: OriginalQuestionSnapshot | null;
    }>;

    return {
      success: true,
      items: rows.map((r) => ({
        id: r.id,
        examYear: r.exam_year,
        examRound: r.exam_round,
        examStage: r.exam_stage,
        subject: r.subject,
        chapterTitle: r.chapter_title,
        questionNumber: r.question_number,
        questionType: r.question_type,
        questionText: r.question_text,
        boxContent: r.box_content,
        subjectiveAnswer: r.subjective_answer,
        lawStatus: r.law_status,
        amendedNote: r.amended_note,
        originalSnapshot: r.original_snapshot,
      })),
    };
  } catch (err) {
    return {
      success: false,
      items: [],
      error: err instanceof Error ? err.message : "개정 문항 조회 실패",
    };
  }
}

// ============================================================
// 모바일 20제 인터랙티브 문제·지문(O/★/X) 체크 & 1문제 즉시 저장
// ============================================================

export type MarkStatus = "O" | "STAR" | "X";

export interface StudySetSummary {
  setKey: string;
  category: "CHAPTER" | "ROUND";
  examStage: string;
  subject: string;
  title: string;
  subtitle: string;
  questionCount: number;
  solvedCount: number;
}

export interface SolveOptionItem {
  id: string;
  optionNumber: number;
  optionText: string;
  isCorrect: boolean;
  repeatCount: number;
  appearedCitations: OxCitationItem[];
  isAmended: boolean;
  amendedNote: string | null;
  originalOptionText: string | null;
  savedMark: MarkStatus | null;
}

export interface SolveQuestionItem {
  id: string;
  examYear: number;
  examRound: number;
  examStage: string;
  subject: string;
  chapterTitle: string | null;
  importanceTier: string | null;
  questionNumber: number;
  questionType: "OBJECTIVE" | "SUBJECTIVE";
  questionText: string;
  boxContent: string | null;
  correctOptions: number[];
  subjectiveAnswer: string | null;
  lawStatus: LawStatus;
  amendedNote: string | null;
  originalSnapshot: OriginalQuestionSnapshot | null;
  isNegativeQuestion: boolean;
  options: SolveOptionItem[];
  savedSelectedOption: number | null;
  savedSubjectiveInput: string | null;
  savedIsCorrect: boolean | null;
  savedQuestionMark: MarkStatus | null;
  savedBoxMarks: Record<string, MarkStatus>;
}

interface RawQuestionCatalogRow {
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

/**
 * DB 1,400문항을 기반으로 단원별 20제 / 회차별 20제 세트 목록과 풀이 진행도 조회
 */
export async function fetchStudySolveSetsAction(clientKey: string): Promise<{
  success: boolean;
  sets: StudySetSummary[];
  weakOptionCount: number;
  error?: string;
}> {
  try {
    const allRows: RawQuestionCatalogRow[] = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabaseAdmin
        .schema("vertical_housing")
        .from("exam_questions")
        .select("id, exam_year, exam_round, exam_stage, subject, chapter_code, chapter_title, detail_code, detail_title")
        .neq("law_status", "DEPRECATED")
        .order("exam_year", { ascending: false })
        .order("question_number", { ascending: true })
        .range(from, from + PAGE - 1);

      if (error) return { success: false, sets: [], weakOptionCount: 0, error: error.message };
      if (!data || data.length === 0) break;
      allRows.push(...(data as RawQuestionCatalogRow[]));
      if (data.length < PAGE) break;
    }

    const [{ data: qLogs }, { count: weakOptCnt }] = await Promise.all([
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_question_logs")
        .select("question_id")
        .eq("client_key", clientKey),
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_option_logs")
        .select("id", { count: "exact", head: true })
        .eq("client_key", clientKey)
        .in("mark_status", ["STAR", "X"]),
    ]);

    const solvedSet = new Set((qLogs ?? []).map((r: { question_id: string }) => r.question_id));
    const sets: StudySetSummary[] = [];

    // 1) 공식 49개 세부 단원별 20제 묶음 (각 단원의 문항들을 20개 단위로 슬라이스)
    const byChapter = new Map<string, RawQuestionCatalogRow[]>();
    for (const r of allRows) {
      const code = r.detail_code || r.chapter_code || "ETC";
      const key = `${r.exam_stage}::${r.subject}::${code}`;
      if (!byChapter.has(key)) byChapter.set(key, []);
      byChapter.get(key)!.push(r);
    }

    const sortedChapterEntries = Array.from(byChapter.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    for (const [groupKey, list] of sortedChapterEntries) {
      const [stage, subject, code] = groupKey.split("::");
      const chapterTitle = list[0]?.detail_title || list[0]?.chapter_title || code;
      const chunkCount = Math.ceil(list.length / 20);
      for (let i = 0; i < chunkCount; i++) {
        const slice = list.slice(i * 20, (i + 1) * 20);
        const solvedInSlice = slice.filter((q) => solvedSet.has(q.id)).length;
        sets.push({
          setKey: `CHAPTER::${stage}::${subject}::${code}::${i}`,
          category: "CHAPTER",
          examStage: stage,
          subject,
          title: `${chapterTitle} SET ${String(i + 1).padStart(2, "0")}`,
          subtitle: `${stage} · ${subject} (${slice.length}제 / 총 ${list.length}제 중)`,
          questionCount: slice.length,
          solvedCount: solvedInSlice,
        });
      }
    }

    // 2) 회차별 20제 쪼개기 (최신 연도 순)
    const byRound = new Map<string, RawQuestionCatalogRow[]>();
    for (const r of allRows) {
      const key = `${r.exam_year}::${r.exam_round}::${r.exam_stage}::${r.subject}`;
      if (!byRound.has(key)) byRound.set(key, []);
      byRound.get(key)!.push(r);
    }

    for (const [groupKey, list] of byRound.entries()) {
      const [yearStr, roundStr, stage, subject] = groupKey.split("::");
      const chunkCount = Math.ceil(list.length / 20);
      for (let i = 0; i < chunkCount; i++) {
        const slice = list.slice(i * 20, (i + 1) * 20);
        const solvedInSlice = slice.filter((q) => solvedSet.has(q.id)).length;
        sets.push({
          setKey: `ROUND::${yearStr}::${roundStr}::${stage}::${subject}::${i}`,
          category: "ROUND",
          examStage: stage,
          subject,
          title: `${yearStr}년 ${roundStr}회 ${subject} #${i + 1}`,
          subtitle: `${stage} 기출 20제 분할 (${slice.length}문항)`,
          questionCount: slice.length,
          solvedCount: solvedInSlice,
        });
      }
    }

    return {
      success: true,
      sets,
      weakOptionCount: weakOptCnt ?? 0,
    };
  } catch (err) {
    return {
      success: false,
      sets: [],
      weakOptionCount: 0,
      error: err instanceof Error ? err.message : "세트 카탈로그 조회 실패",
    };
  }
}

/**
 * 선택한 20제 세트의 문항·선지·기존 풀이/마킹 이력을 로드합니다.
 */
export async function fetchSolveSetQuestionsAction(
  clientKey: string,
  setKey: string
): Promise<{
  success: boolean;
  questions: SolveQuestionItem[];
  error?: string;
}> {
  try {
    const parts = setKey.split("::");
    const kind = parts[0];

    let query = supabaseAdmin
      .schema("vertical_housing")
      .from("exam_questions")
      .select(
        `
        id,
        exam_year,
        exam_round,
        exam_stage,
        subject,
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
      `
      )
      .neq("law_status", "DEPRECATED");

    let sliceIndex = 0;
    if (kind === "CHAPTER") {
      const [, stage, subject, code, idxStr] = parts;
      sliceIndex = Number(idxStr) || 0;
      query = query
        .eq("exam_stage", stage)
        .eq("subject", subject)
        .or(`detail_code.eq.${code},chapter_code.eq.${code}`)
        .order("exam_year", { ascending: false })
        .order("question_number", { ascending: true });
    } else if (kind === "ROUND") {
      const [, yearStr, roundStr, stage, subject, idxStr] = parts;
      sliceIndex = Number(idxStr) || 0;
      query = query
        .eq("exam_year", Number(yearStr))
        .eq("exam_round", Number(roundStr))
        .eq("exam_stage", stage)
        .eq("subject", subject)
        .order("question_number", { ascending: true });
    } else {
      return { success: false, questions: [], error: "지원하지 않는 세트 키입니다." };
    }

    const from = sliceIndex * 20;
    const { data: qRows, error: qErr } = await query.range(from, from + 19);
    if (qErr) return { success: false, questions: [], error: qErr.message };

    const rawQuestions = (qRows ?? []) as Array<{
      id: string;
      exam_year: number;
      exam_round: number;
      exam_stage: string;
      subject: string;
      chapter_title: string | null;
      importance_tier: string | null;
      question_number: number;
      question_type: "OBJECTIVE" | "SUBJECTIVE";
      question_text: string;
      box_content: string | null;
      correct_options: number[] | null;
      subjective_answer: string | null;
      law_status: LawStatus | null;
      amended_note: string | null;
      original_snapshot: OriginalQuestionSnapshot | null;
      metadata: { isNegativeQuestion?: boolean } | null;
    }>;

    if (rawQuestions.length === 0) {
      return { success: true, questions: [] };
    }

    const qIds = rawQuestions.map((q) => q.id);
    const [{ data: optRows, error: optErr }, { data: qLogs }, { data: optLogs }] = await Promise.all([
      supabaseAdmin
        .schema("vertical_housing")
        .from("exam_options")
        .select(
          "id, question_id, option_number, option_text, is_correct, repeat_count, appeared_citations, is_amended, amended_note, original_option_text"
        )
        .in("question_id", qIds)
        .order("option_number", { ascending: true }),
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_question_logs")
        .select("question_id, selected_option, subjective_input, is_correct, question_mark, box_marks")
        .eq("client_key", clientKey)
        .in("question_id", qIds),
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_option_logs")
        .select("option_id, mark_status")
        .eq("client_key", clientKey)
        .in("question_id", qIds),
    ]);

    if (optErr) return { success: false, questions: [], error: optErr.message };

    const optsByQ = new Map<string, SolveOptionItem[]>();
    const optMarkMap = new Map<string, MarkStatus>(
      ((optLogs ?? []) as Array<{ option_id: string; mark_status: MarkStatus }>).map((l) => [
        l.option_id,
        l.mark_status,
      ])
    );

    for (const o of (optRows ?? []) as Array<{
      id: string;
      question_id: string;
      option_number: number;
      option_text: string;
      is_correct: boolean;
      repeat_count: number | null;
      appeared_citations: OxCitationItem[] | null;
      is_amended: boolean | null;
      amended_note: string | null;
      original_option_text: string | null;
    }>) {
      if (!optsByQ.has(o.question_id)) optsByQ.set(o.question_id, []);
      optsByQ.get(o.question_id)!.push({
        id: o.id,
        optionNumber: o.option_number,
        optionText: o.option_text,
        isCorrect: o.is_correct,
        repeatCount: o.repeat_count ?? 1,
        appearedCitations: Array.isArray(o.appeared_citations) ? o.appeared_citations : [],
        isAmended: Boolean(o.is_amended),
        amendedNote: o.amended_note,
        originalOptionText: o.original_option_text,
        savedMark: optMarkMap.get(o.id) ?? null,
      });
    }

    const qLogMap = new Map(
      ((qLogs ?? []) as Array<{
        question_id: string;
        selected_option: number | null;
        subjective_input: string | null;
        is_correct: boolean | null;
        question_mark: MarkStatus | null;
        box_marks: Record<string, MarkStatus> | null;
      }>).map((l) => [l.question_id, l])
    );

    const items: SolveQuestionItem[] = rawQuestions.map((q) => {
      const saved = qLogMap.get(q.id);
      return {
        id: q.id,
        examYear: q.exam_year,
        examRound: q.exam_round,
        examStage: q.exam_stage,
        subject: q.subject,
        chapterTitle: q.chapter_title,
        importanceTier: q.importance_tier,
        questionNumber: q.question_number,
        questionType: q.question_type,
        questionText: q.question_text,
        boxContent: q.box_content,
        correctOptions: q.correct_options ?? [],
        subjectiveAnswer: q.subjective_answer,
        lawStatus: q.law_status ?? "VALID",
        amendedNote: q.amended_note,
        originalSnapshot: q.original_snapshot,
        isNegativeQuestion: Boolean(q.metadata?.isNegativeQuestion),
        options: optsByQ.get(q.id) ?? [],
        savedSelectedOption: saved?.selected_option ?? null,
        savedSubjectiveInput: saved?.subjective_input ?? null,
        savedIsCorrect: saved?.is_correct ?? null,
        savedQuestionMark: saved?.question_mark ?? null,
        savedBoxMarks: saved?.box_marks ?? {},
      };
    });

    return { success: true, questions: items };
  } catch (err) {
    return {
      success: false,
      questions: [],
      error: err instanceof Error ? err.message : "문항 세트 로드 실패",
    };
  }
}

export interface SaveSingleQuestionSolveInput {
  clientKey: string;
  setKey: string;
  questionId: string;
  selectedOption: number | null;
  subjectiveInput: string | null;
  isCorrect: boolean | null;
  questionMark: MarkStatus | null;
  boxMarks?: Record<string, MarkStatus>;
  optionMarks: Array<{ optionId: string; markStatus: MarkStatus }>;
}

/**
 * 1문항 단위로 답안 및 지문별(O/★/X) 마킹을 즉시 DB에 upsert합니다.
 */
export async function saveSingleQuestionSolveAction(
  input: SaveSingleQuestionSolveInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const { error: qErr } = await supabaseAdmin
      .schema("vertical_housing")
      .from("study_question_logs")
      .upsert(
        {
          client_key: input.clientKey,
          set_key: input.setKey,
          question_id: input.questionId,
          selected_option: input.selectedOption,
          subjective_input: input.subjectiveInput,
          is_correct: input.isCorrect,
          question_mark: input.questionMark,
          box_marks: input.boxMarks ?? {},
          updated_at: nowIso,
        },
        { onConflict: "client_key,question_id" }
      );

    if (qErr) return { success: false, error: qErr.message };

    if (input.optionMarks.length > 0) {
      const optRows = input.optionMarks.map((m) => ({
        client_key: input.clientKey,
        question_id: input.questionId,
        option_id: m.optionId,
        mark_status: m.markStatus,
        mastered_by_ox: false,
        updated_at: nowIso,
      }));
      const { error: oErr } = await supabaseAdmin
        .schema("vertical_housing")
        .from("study_option_logs")
        .upsert(optRows, { onConflict: "client_key,option_id" });

      if (oErr) return { success: false, error: oErr.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "저장 중 오류 발생",
    };
  }
}

/**
 * 사용자가 /study/solve에서 ★ 또는 X로 체크한 약점 선지들을 1줄 O/X 카드로 불러옵니다.
 */
export async function fetchUserWeakOxCardsAction(clientKey: string): Promise<{
  success: boolean;
  cards: ExamOxCardItem[];
  markMap: Record<string, MarkStatus>;
  error?: string;
}> {
  try {
    const { data: logs, error: logErr } = await supabaseAdmin
      .schema("vertical_housing")
      .from("study_option_logs")
      .select("option_id, mark_status")
      .eq("client_key", clientKey)
      .in("mark_status", ["STAR", "X"])
      .order("updated_at", { ascending: false })
      .limit(80);

    if (logErr) return { success: false, cards: [], markMap: {}, error: logErr.message };
    const logRows = (logs ?? []) as Array<{ option_id: string; mark_status: MarkStatus }>;
    if (logRows.length === 0) return { success: true, cards: [], markMap: {} };

    const markMap: Record<string, MarkStatus> = {};
    for (const l of logRows) markMap[l.option_id] = l.mark_status;

    const { data, error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("exam_options")
      .select(
        `
        id,
        question_id,
        option_number,
        option_text,
        is_correct,
        mastery_tier,
        trap_summary,
        legal_citation,
        repeat_count,
        appeared_citations,
        is_amended,
        amended_note,
        original_option_text,
        question:exam_questions!inner(
          id,
          exam_year,
          exam_round,
          exam_stage,
          subject,
          chapter_title,
          importance_tier,
          question_number,
          question_text,
          law_status,
          amended_note,
          original_snapshot,
          metadata
        )
      `
      )
      .in(
        "id",
        logRows.map((r) => r.option_id)
      );

    if (error) return { success: false, cards: [], markMap, error: error.message };

    const rows = (data ?? []) as unknown as RawOptionJoinedRow[];
    const cards: ExamOxCardItem[] = rows.map((row) => {
      const q = Array.isArray(row.question) ? row.question[0] : row.question;
      return {
        id: row.id,
        questionId: row.question_id,
        examYear: q.exam_year,
        examRound: q.exam_round,
        examStage: q.exam_stage,
        subject: q.subject,
        chapterTitle: q.chapter_title,
        importanceTier: q.importance_tier,
        questionNumber: q.question_number,
        questionText: q.question_text,
        optionNumber: row.option_number,
        statement: row.option_text,
        isCorrectStatement: row.is_correct,
        masteryTier: row.mastery_tier ?? 2,
        trapCorrection: row.trap_summary,
        citation: row.legal_citation,
        repeatCount: row.repeat_count ?? 1,
        appearedCitations: Array.isArray(row.appeared_citations) ? row.appeared_citations : [],
        lawStatus: q.law_status ?? "VALID",
        amendedNote: row.amended_note || q.amended_note || null,
        isAmendedOption: Boolean(row.is_amended),
        originalOptionText: row.original_option_text ?? null,
        originalQuestionSnapshot: q.original_snapshot ?? null,
      };
    });

    return { success: true, cards, markMap };
  } catch (err) {
    return {
      success: false,
      cards: [],
      markMap: {},
      error: err instanceof Error ? err.message : "약점 O/X 로드 실패",
    };
  }
}

/**
 * O/X 복습에서 맞힌 약점 지문을 'O(완전 정복)'으로 승격 저장합니다.
 */
export async function promoteWeakOptionToOAction(
  clientKey: string,
  optionId: string
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("study_option_logs")
      .update({
        mark_status: "O",
        mastered_by_ox: true,
        updated_at: new Date().toISOString(),
      })
      .eq("client_key", clientKey)
      .eq("option_id", optionId);

    return { success: !error };
  } catch {
    return { success: false };
  }
}

export interface ChapterProgressSummary {
  solvedCount: number;
  correctCount: number;
}

export interface StudyMatrixSyncCell {
  keyword: string;
  status: "done";
  minutes: number;
  updatedAt: string;
  source: "db";
}

function toKstDateISO(isoTimestamp: string): string {
  const dt = new Date(isoTimestamp);
  if (Number.isNaN(dt.getTime())) return isoTimestamp.slice(0, 10);
  const kst = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * /study/solve에서 사용자가 실제로 푼 문제 이력(study_question_logs)을
 * 한국시간(KST) 날짜 × 단원(chapter_code) 단위로 집계하여 플래너 매트릭스와 연동합니다.
 */
export async function fetchStudyMatrixSyncAction(clientKey: string): Promise<{
  success: boolean;
  matrixCells: Record<string, StudyMatrixSyncCell>;
  chapterTotals: Record<string, ChapterProgressSummary>;
  error?: string;
}> {
  try {
    if (!clientKey) {
      return { success: true, matrixCells: {}, chapterTotals: {} };
    }

    interface JoinedLogRow {
      question_id: string;
      is_correct: boolean | null;
      solved_at: string | null;
      updated_at: string | null;
      question:
        | { detail_code: string | null; chapter_code: string | null }
        | Array<{ detail_code: string | null; chapter_code: string | null }>;
    }

    const allLogs: JoinedLogRow[] = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabaseAdmin
        .schema("vertical_housing")
        .from("study_question_logs")
        .select("question_id, is_correct, solved_at, updated_at, question:exam_questions!inner(detail_code, chapter_code)")
        .eq("client_key", clientKey)
        .range(from, from + PAGE - 1);

      if (error) {
        return { success: false, matrixCells: {}, chapterTotals: {}, error: error.message };
      }
      if (!data || data.length === 0) break;
      allLogs.push(...(data as unknown as JoinedLogRow[]));
      if (data.length < PAGE) break;
    }

    const dailyMap = new Map<string, { solved: number; correct: number }>();
    const chapterTotals: Record<string, ChapterProgressSummary> = {};

    for (const row of allLogs) {
      const q = Array.isArray(row.question) ? row.question[0] : row.question;
      const chapterCode = q?.detail_code || q?.chapter_code;
      if (!chapterCode) continue;

      if (!chapterTotals[chapterCode]) {
        chapterTotals[chapterCode] = { solvedCount: 0, correctCount: 0 };
      }
      chapterTotals[chapterCode].solvedCount += 1;
      if (row.is_correct === true) {
        chapterTotals[chapterCode].correctCount += 1;
      }

      const ts = row.updated_at || row.solved_at;
      if (!ts) continue;
      const dateISO = toKstDateISO(ts);
      const cellKey = `top-${chapterCode}::${dateISO}`;

      const prev = dailyMap.get(cellKey) ?? { solved: 0, correct: 0 };
      prev.solved += 1;
      if (row.is_correct === true) prev.correct += 1;
      dailyMap.set(cellKey, prev);
    }

    const matrixCells: Record<string, StudyMatrixSyncCell> = {};
    for (const [cellKey, agg] of dailyMap.entries()) {
      const dateISO = cellKey.split("::")[1] || "";
      matrixCells[cellKey] = {
        keyword: `${agg.solved}제·${agg.correct}O`,
        status: "done",
        minutes: Math.max(5, agg.solved * 2),
        updatedAt: dateISO,
        source: "db",
      };
    }

    return {
      success: true,
      matrixCells,
      chapterTotals,
    };
  } catch (err) {
    return {
      success: false,
      matrixCells: {},
      chapterTotals: {},
      error: err instanceof Error ? err.message : "DB 매트릭스 동기화 실패",
    };
  }
}
