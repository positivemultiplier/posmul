"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { resolveOwnerKeyAndUser } from "@/lib/auth-provision";
import { CURRICULUM_ORDER_MAP } from "@/data/study-textbooks";

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
  detailCode?: string | null;
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
  theorySectionCode?: string | null;
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
  detailCode?: string;
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
  detail_code?: string | null;
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
  theory_section_code?: string | null;
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
    const { subject = "ALL", detailCode, maxTier = 5, onlyRepeated = false, limit = 60 } = input;

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
        theory_section_code,
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
          detail_code,
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
    if (detailCode) {
      query = query.eq("question.detail_code", detailCode);
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
        detailCode: q.detail_code ?? null,
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
        theorySectionCode: row.theory_section_code ?? null,
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
      detail_code: string | null;
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
  trapSummary: string | null;
  legalCitation: string | null;
  theorySectionCode: string | null;
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
  detailCode: string | null;
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
    const { ownerKey } = await resolveOwnerKeyAndUser(clientKey);
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
        .eq("client_key", ownerKey),
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_option_logs")
        .select("id", { count: "exact", head: true })
        .eq("client_key", ownerKey)
        .in("mark_status", ["STAR", "X"]),
    ]);

    const solvedSet = new Set((qLogs ?? []).map((r: { question_id: string }) => r.question_id));
    const sets: StudySetSummary[] = [];

    // 1) 공식 69개 세부 단원별 20제 묶음 (교재 목차 순번 정렬 + 넘버링 부여)
    const byChapter = new Map<string, RawQuestionCatalogRow[]>();
    for (const r of allRows) {
      const code = r.detail_code || r.chapter_code || "ETC";
      const key = `${r.exam_stage}::${r.subject}::${code}`;
      if (!byChapter.has(key)) byChapter.set(key, []);
      byChapter.get(key)!.push(r);
    }

    const sortedChapterEntries = Array.from(byChapter.entries()).sort((a, b) => {
      const codeA = a[0].split("::")[2] || "";
      const codeB = b[0].split("::")[2] || "";
      const orderA = CURRICULUM_ORDER_MAP[codeA]?.globalOrder ?? 9999;
      const orderB = CURRICULUM_ORDER_MAP[codeB]?.globalOrder ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a[0].localeCompare(b[0]);
    });

    for (const [groupKey, list] of sortedChapterEntries) {
      const [stage, subject, code] = groupKey.split("::");
      const meta = CURRICULUM_ORDER_MAP[code];
      const rawTitle = meta?.title || list[0]?.detail_title || list[0]?.chapter_title || code;
      const chapterTitle = meta ? `${meta.topicNo}. ${rawTitle}` : rawTitle;
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
      detail_code: string | null;
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

    const { ownerKey } = await resolveOwnerKeyAndUser(clientKey);
    const qIds = rawQuestions.map((q) => q.id);
    const [{ data: optRows, error: optErr }, { data: qLogs }, { data: optLogs }] = await Promise.all([
      supabaseAdmin
        .schema("vertical_housing")
        .from("exam_options")
        .select(
          "id, question_id, option_number, option_text, is_correct, trap_summary, legal_citation, theory_section_code, repeat_count, appeared_citations, is_amended, amended_note, original_option_text"
        )
        .in("question_id", qIds)
        .order("option_number", { ascending: true }),
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_question_logs")
        .select("question_id, selected_option, subjective_input, is_correct, question_mark, box_marks")
        .eq("client_key", ownerKey)
        .in("question_id", qIds),
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_option_logs")
        .select("option_id, mark_status")
        .eq("client_key", ownerKey)
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
      trap_summary: string | null;
      legal_citation: string | null;
      theory_section_code: string | null;
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
        trapSummary: o.trap_summary ?? null,
        legalCitation: o.legal_citation ?? null,
        theorySectionCode: o.theory_section_code ?? null,
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
        detailCode: q.detail_code ?? null,
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
    const { user, ownerKey } = await resolveOwnerKeyAndUser(input.clientKey);
    const nowIso = new Date().toISOString();
    const { error: qErr } = await supabaseAdmin
      .schema("vertical_housing")
      .from("study_question_logs")
      .upsert(
        {
          client_key: ownerKey,
          user_id: user?.id ?? null,
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
        client_key: ownerKey,
        user_id: user?.id ?? null,
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
    const { ownerKey } = await resolveOwnerKeyAndUser(clientKey);
    const { data: logs, error: logErr } = await supabaseAdmin
      .schema("vertical_housing")
      .from("study_option_logs")
      .select("option_id, mark_status")
      .eq("client_key", ownerKey)
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
        theory_section_code,
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
          detail_code,
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
        detailCode: q.detail_code ?? null,
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
        theorySectionCode: row.theory_section_code ?? null,
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
    const { ownerKey } = await resolveOwnerKeyAndUser(clientKey);
    const { error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("study_option_logs")
      .update({
        mark_status: "O",
        mastered_by_ox: true,
        updated_at: new Date().toISOString(),
      })
      .eq("client_key", ownerKey)
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
    const { ownerKey } = await resolveOwnerKeyAndUser(clientKey);
    if (!ownerKey) {
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
        .eq("client_key", ownerKey)
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

// ============================================================================
// 7개년 출제빈도 · 문제풀이 진도 · 과목별 예상 점수 · 합격률 예측 통계
// ============================================================================

export interface TopicAnalyticsItem {
  chapterCode: string;
  topicNo: string;
  globalOrder: number;
  examStage: "1차" | "2차";
  subject: string;
  subjectShort: string;
  subjectColor: string;
  unitTitle: string;
  title: string;
  numberedTitle: string;
  totalQuestions: number;
  avgPerYear: number;
  shareInSubjectPct: number;
  recent3YCount: number;
  trend: "UP" | "FLAT" | "DOWN";
  yearlyCounts: Record<number, number>;
  highTierCount: number;
  solvedCount: number;
  correctCount: number;
  accuracyPct: number | null;
  optOCount: number;
  optStarCount: number;
  optXCount: number;
  priorityScore: number;
}

export interface SubjectAnalyticsItem {
  examStage: "1차" | "2차";
  subject: string;
  shortTitle: string;
  color: string;
  totalQuestions: number;
  solvedCount: number;
  progressPct: number;
  correctCount: number;
  rawAccuracyPct: number | null;
  weightedAccuracyPct: number | null;
  optionMasteryPct: number | null;
  predictedScore: number | null;
  scoreRange: [number, number] | null;
  cutlineRisk: "DANGER" | "CAUTION" | "PASS" | "UNMEASURED";
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  optOCount: number;
  optStarCount: number;
  optXCount: number;
  topPriorityTopic: {
    chapterCode: string;
    numberedTitle: string;
    totalQuestions: number;
    shareInSubjectPct: number;
    accuracyPct: number | null;
  } | null;
}

export interface StagePassPrediction {
  examStage: "1차" | "2차";
  subjects: string[];
  solvedCount: number;
  totalQuestions: number;
  measuredSubjectCount: number;
  predictedAvg: number | null;
  passProbability: number | null;
  minSubjectScore: number | null;
  failRiskSubjects: string[];
  status: "PASS_LIKELY" | "BORDERLINE" | "FAIL_RISK" | "INSUFFICIENT_DATA";
  summaryMessage: string;
}

export interface DailyStudyTrendPoint {
  dateISO: string;
  mmdd: string;
  solved: number;
  correct: number;
  accuracyPct: number;
}

export interface StudyAnalyticsResult {
  success: boolean;
  years: number[];
  overall: {
    totalQuestions: number;
    totalSolved: number;
    totalCorrect: number;
    progressPct: number;
    accuracyPct: number | null;
    optionStats: {
      totalMarks: number;
      oCount: number;
      starCount: number;
      xCount: number;
      masteryPct: number | null;
    };
    questionMarkStats: {
      oCount: number;
      starCount: number;
      xCount: number;
    };
  };
  topics: TopicAnalyticsItem[];
  subjects: SubjectAnalyticsItem[];
  stagePredictions: StagePassPrediction[];
  dailyTrend: DailyStudyTrendPoint[];
  error?: string;
}

const SUBJECT_PASS_ORDER: Array<{
  examStage: "1차" | "2차";
  subject: string;
  shortTitle: string;
  color: string;
}> = [
  { examStage: "1차", subject: "민법", shortTitle: "민법", color: "#3B82F6" },
  { examStage: "1차", subject: "회계원리", shortTitle: "회계원리", color: "#0EA5E9" },
  { examStage: "1차", subject: "공동주택시설개론", shortTitle: "시설개론", color: "#14B8A6" },
  { examStage: "2차", subject: "주택관리관계법규", shortTitle: "관계법규", color: "#FF5A36" },
  { examStage: "2차", subject: "공동주택관리실무", shortTitle: "관리실무", color: "#10B981" },
];

function logisticPassProb(margin: number, scale: number): number {
  return 1 / (1 + Math.exp(-(1.7 * margin) / Math.max(1, scale)));
}

function clampNum(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * DB 1,400문항 출제 빅데이터(2019~2025)와 사용자의 문제풀이·선지 이해도 이력을 결합해
 * 출제빈도, 학습진도, 과목별 예상 점수, 1차/2차 예상 합격률을 계산합니다.
 */
export async function fetchStudyAnalyticsAction(
  clientKey: string
): Promise<StudyAnalyticsResult> {
  const emptyOverall = {
    totalQuestions: 0,
    totalSolved: 0,
    totalCorrect: 0,
    progressPct: 0,
    accuracyPct: null,
    optionStats: { totalMarks: 0, oCount: 0, starCount: 0, xCount: 0, masteryPct: null },
    questionMarkStats: { oCount: 0, starCount: 0, xCount: 0 },
  };

  try {
    interface RawAnalyticsQuestion {
      id: string;
      exam_year: number;
      exam_stage: "1차" | "2차";
      subject: string;
      detail_code: string | null;
      detail_title: string | null;
      chapter_code: string | null;
      chapter_title: string | null;
      importance_tier: string | null;
    }

    const allQuestions: RawAnalyticsQuestion[] = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabaseAdmin
        .schema("vertical_housing")
        .from("exam_questions")
        .select(
          "id, exam_year, exam_stage, subject, detail_code, detail_title, chapter_code, chapter_title, importance_tier"
        )
        .neq("law_status", "DEPRECATED")
        .range(from, from + PAGE - 1);

      if (error) {
        return {
          success: false,
          years: [],
          overall: emptyOverall,
          topics: [],
          subjects: [],
          stagePredictions: [],
          dailyTrend: [],
          error: error.message,
        };
      }
      if (!data || data.length === 0) break;
      allQuestions.push(...(data as RawAnalyticsQuestion[]));
      if (data.length < PAGE) break;
    }

    interface RawQLog {
      question_id: string;
      is_correct: boolean | null;
      question_mark: MarkStatus | null;
      updated_at: string | null;
      solved_at: string | null;
    }
    interface RawOptLog {
      question_id: string;
      mark_status: MarkStatus;
    }

    const qLogs: RawQLog[] = [];
    const optLogs: RawOptLog[] = [];
    const { ownerKey } = await resolveOwnerKeyAndUser(clientKey);

    if (ownerKey) {
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabaseAdmin
          .schema("vertical_housing")
          .from("study_question_logs")
          .select("question_id, is_correct, question_mark, updated_at, solved_at")
          .eq("client_key", ownerKey)
          .range(from, from + PAGE - 1);
        if (error || !data || data.length === 0) break;
        qLogs.push(...(data as RawQLog[]));
        if (data.length < PAGE) break;
      }

      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabaseAdmin
          .schema("vertical_housing")
          .from("study_option_logs")
          .select("question_id, mark_status")
          .eq("client_key", ownerKey)
          .range(from, from + PAGE - 1);
        if (error || !data || data.length === 0) break;
        optLogs.push(...(data as RawOptLog[]));
        if (data.length < PAGE) break;
      }
    }

    const yearsSet = new Set<number>();
    const questionById = new Map<string, RawAnalyticsQuestion>();
    const subjectTotalCount = new Map<string, number>();

    for (const q of allQuestions) {
      yearsSet.add(q.exam_year);
      questionById.set(q.id, q);
      subjectTotalCount.set(q.subject, (subjectTotalCount.get(q.subject) ?? 0) + 1);
    }

    const years = Array.from(yearsSet).sort((a, b) => a - b);
    const totalYears = Math.max(1, years.length);
    const recentThresholdYear =
      years.length >= 3 ? years[years.length - 3] : (years[0] ?? 2023);

    const qLogByQId = new Map<string, RawQLog>();
    const dailyAggMap = new Map<string, { solved: number; correct: number }>();
    const qMarkCounts = { oCount: 0, starCount: 0, xCount: 0 };

    for (const l of qLogs) {
      qLogByQId.set(l.question_id, l);
      if (l.question_mark === "O") qMarkCounts.oCount += 1;
      else if (l.question_mark === "STAR") qMarkCounts.starCount += 1;
      else if (l.question_mark === "X") qMarkCounts.xCount += 1;

      const ts = l.updated_at || l.solved_at;
      if (ts) {
        const dateISO = toKstDateISO(ts);
        const cur = dailyAggMap.get(dateISO) ?? { solved: 0, correct: 0 };
        cur.solved += 1;
        if (l.is_correct === true) cur.correct += 1;
        dailyAggMap.set(dateISO, cur);
      }
    }

    const optAggByQId = new Map<string, { o: number; star: number; x: number }>();
    let totalOptO = 0;
    let totalOptStar = 0;
    let totalOptX = 0;

    for (const ol of optLogs) {
      const cur = optAggByQId.get(ol.question_id) ?? { o: 0, star: 0, x: 0 };
      if (ol.mark_status === "O") {
        cur.o += 1;
        totalOptO += 1;
      } else if (ol.mark_status === "STAR") {
        cur.star += 1;
        totalOptStar += 1;
      } else if (ol.mark_status === "X") {
        cur.x += 1;
        totalOptX += 1;
      }
      optAggByQId.set(ol.question_id, cur);
    }

    // 단원별 집계 버킷
    interface TopicBucket {
      chapterCode: string;
      examStage: "1차" | "2차";
      subject: string;
      rawTitle: string;
      totalQuestions: number;
      recent3YCount: number;
      prevYCount: number;
      yearlyCounts: Record<number, number>;
      highTierCount: number;
      solvedCount: number;
      correctCount: number;
      optOCount: number;
      optStarCount: number;
      optXCount: number;
    }

    const topicBuckets = new Map<string, TopicBucket>();
    for (const q of allQuestions) {
      const code = q.detail_code || q.chapter_code || "ETC";
      let b = topicBuckets.get(code);
      if (!b) {
        b = {
          chapterCode: code,
          examStage: q.exam_stage,
          subject: q.subject,
          rawTitle: q.detail_title || q.chapter_title || code,
          totalQuestions: 0,
          recent3YCount: 0,
          prevYCount: 0,
          yearlyCounts: {},
          highTierCount: 0,
          solvedCount: 0,
          correctCount: 0,
          optOCount: 0,
          optStarCount: 0,
          optXCount: 0,
        };
        topicBuckets.set(code, b);
      }

      b.totalQuestions += 1;
      b.yearlyCounts[q.exam_year] = (b.yearlyCounts[q.exam_year] ?? 0) + 1;
      if (q.exam_year >= recentThresholdYear) {
        b.recent3YCount += 1;
      } else {
        b.prevYCount += 1;
      }
      if (q.importance_tier === "S" || q.importance_tier === "A") {
        b.highTierCount += 1;
      }

      const log = qLogByQId.get(q.id);
      if (log) {
        b.solvedCount += 1;
        if (log.is_correct === true) b.correctCount += 1;
      }

      const oAgg = optAggByQId.get(q.id);
      if (oAgg) {
        b.optOCount += oAgg.o;
        b.optStarCount += oAgg.star;
        b.optXCount += oAgg.x;
      }
    }

    const recentYearsDenom = Math.min(3, years.length);
    const prevYearsDenom = Math.max(1, years.length - recentYearsDenom);

    const topics: TopicAnalyticsItem[] = Array.from(topicBuckets.values())
      .map((b) => {
        const meta = CURRICULUM_ORDER_MAP[b.chapterCode];
        const subjTotal = Math.max(1, subjectTotalCount.get(b.subject) ?? 280);
        const shareInSubjectPct =
          Math.round((b.totalQuestions / subjTotal) * 1000) / 10;
        const avgPerYear = Math.round((b.totalQuestions / totalYears) * 10) / 10;

        const recentAvg = b.recent3YCount / Math.max(1, recentYearsDenom);
        const prevAvg = years.length > recentYearsDenom ? b.prevYCount / prevYearsDenom : recentAvg;
        let trend: "UP" | "FLAT" | "DOWN" = "FLAT";
        if (recentAvg - prevAvg >= 0.45) trend = "UP";
        else if (prevAvg - recentAvg >= 0.45) trend = "DOWN";

        const accuracyPct =
          b.solvedCount > 0
            ? Math.round((b.correctCount / b.solvedCount) * 1000) / 10
            : null;

        // 공략 우선순위 점수: 출제비중이 높고, 아직 안 풀었거나 정답률이 낮을수록 높음
        const weaknessFactor =
          accuracyPct === null ? 0.85 : clampNum((100 - accuracyPct) / 100, 0.05, 1);
        const unsolvedBoost =
          1 - clampNum(b.solvedCount / Math.max(1, b.totalQuestions), 0, 1) * 0.35;
        const priorityScore =
          Math.round(shareInSubjectPct * weaknessFactor * unsolvedBoost * 10) / 10;

        return {
          chapterCode: b.chapterCode,
          topicNo: meta?.topicNo ?? "00",
          globalOrder: meta?.globalOrder ?? 999,
          examStage: meta?.examStage ?? b.examStage,
          subject: meta?.subject ?? b.subject,
          subjectShort: meta?.subjectShort ?? b.subject,
          subjectColor: meta?.subjectColor ?? "#FF5A36",
          unitTitle: meta?.unitTitle ?? "",
          title: meta?.title ?? b.rawTitle,
          numberedTitle: meta?.numberedTitle ?? b.rawTitle,
          totalQuestions: b.totalQuestions,
          avgPerYear,
          shareInSubjectPct,
          recent3YCount: b.recent3YCount,
          trend,
          yearlyCounts: b.yearlyCounts,
          highTierCount: b.highTierCount,
          solvedCount: b.solvedCount,
          correctCount: b.correctCount,
          accuracyPct,
          optOCount: b.optOCount,
          optStarCount: b.optStarCount,
          optXCount: b.optXCount,
          priorityScore,
        };
      })
      .sort((a, b) => a.globalOrder - b.globalOrder);

    // 과목별 통계 및 예상 점수 산출
    const subjects: SubjectAnalyticsItem[] = SUBJECT_PASS_ORDER.map((subjMeta) => {
      const sTopics = topics.filter((t) => t.subject === subjMeta.subject);
      const totalQ = Math.max(
        1,
        sTopics.reduce((sum, t) => sum + t.totalQuestions, 0)
      );
      const solvedCount = sTopics.reduce((sum, t) => sum + t.solvedCount, 0);
      const correctCount = sTopics.reduce((sum, t) => sum + t.correctCount, 0);
      const optOCount = sTopics.reduce((sum, t) => sum + t.optOCount, 0);
      const optStarCount = sTopics.reduce((sum, t) => sum + t.optStarCount, 0);
      const optXCount = sTopics.reduce((sum, t) => sum + t.optXCount, 0);

      const progressPct = Math.round((solvedCount / totalQ) * 1000) / 10;
      const rawAccuracyPct =
        solvedCount > 0 ? Math.round((correctCount / solvedCount) * 1000) / 10 : null;

      // 출제비중 가중 정답률
      let weightedSum = 0;
      let weightTotal = 0;
      for (const t of sTopics) {
        if (t.solvedCount > 0 && t.accuracyPct !== null) {
          const w = t.totalQuestions / totalQ;
          weightedSum += t.accuracyPct * w;
          weightTotal += w;
        }
      }
      const weightedAccuracyPct =
        weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 10) / 10 : null;

      const optTotal = optOCount + optStarCount + optXCount;
      const optionMasteryPct =
        optTotal > 0 ? Math.round((optOCount / optTotal) * 1000) / 10 : null;

      let predictedScore: number | null = null;
      let scoreRange: [number, number] | null = null;
      let cutlineRisk: "DANGER" | "CAUTION" | "PASS" | "UNMEASURED" = "UNMEASURED";
      let confidenceLevel: "HIGH" | "MEDIUM" | "LOW" | "NONE" = "NONE";

      if (solvedCount > 0 && weightedAccuracyPct !== null) {
        // 소표본 과대추정 방지용 베이지안 스무딩 (사전 평균 50점, 가중 표본 8문항)
        const PRIOR_SCORE = 50;
        const PRIOR_WEIGHT = 8;
        const baseScore =
          (weightedAccuracyPct * solvedCount + PRIOR_SCORE * PRIOR_WEIGHT) /
          (solvedCount + PRIOR_WEIGHT);

        // 지문(선지) 이해도 보정 (-5 ~ +3점)
        const optDelta =
          optionMasteryPct !== null
            ? clampNum(((optionMasteryPct - 65) / 100) * 10, -5, 3)
            : 0;

        predictedScore = Math.round(clampNum(baseScore + optDelta, 5, 98) * 10) / 10;

        const margin = Math.max(
          3,
          Math.round(16 / Math.sqrt(Math.max(1, solvedCount / 5)))
        );
        scoreRange = [
          Math.max(0, Math.round(predictedScore - margin)),
          Math.min(100, Math.round(predictedScore + margin)),
        ];

        if (predictedScore < 40) cutlineRisk = "DANGER";
        else if (predictedScore < 60) cutlineRisk = "CAUTION";
        else cutlineRisk = "PASS";

        if (solvedCount >= 80) confidenceLevel = "HIGH";
        else if (solvedCount >= 20) confidenceLevel = "MEDIUM";
        else confidenceLevel = "LOW";
      }

      const sortedPriority = [...sTopics].sort((a, b) => b.priorityScore - a.priorityScore);
      const topT = sortedPriority[0];

      return {
        examStage: subjMeta.examStage,
        subject: subjMeta.subject,
        shortTitle: subjMeta.shortTitle,
        color: subjMeta.color,
        totalQuestions: totalQ,
        solvedCount,
        progressPct,
        correctCount,
        rawAccuracyPct,
        weightedAccuracyPct,
        optionMasteryPct,
        predictedScore,
        scoreRange,
        cutlineRisk,
        confidenceLevel,
        optOCount,
        optStarCount,
        optXCount,
        topPriorityTopic: topT
          ? {
              chapterCode: topT.chapterCode,
              numberedTitle: topT.numberedTitle,
              totalQuestions: topT.totalQuestions,
              shareInSubjectPct: topT.shareInSubjectPct,
              accuracyPct: topT.accuracyPct,
            }
          : null,
      };
    });

    // 1차 / 2차 합격률 예측 (과락 40점 & 평균 60점 법정 기준)
    const stagePredictions: StagePassPrediction[] = (["1차", "2차"] as const).map(
      (stage) => {
        const stageSubjs = subjects.filter((s) => s.examStage === stage);
        const solvedCount = stageSubjs.reduce((sum, s) => sum + s.solvedCount, 0);
        const totalQuestions = stageSubjs.reduce((sum, s) => sum + s.totalQuestions, 0);
        const measured = stageSubjs.filter((s) => s.predictedScore !== null);

        if (measured.length === 0 || solvedCount < 3) {
          return {
            examStage: stage,
            subjects: stageSubjs.map((s) => s.shortTitle),
            solvedCount,
            totalQuestions,
            measuredSubjectCount: measured.length,
            predictedAvg: null,
            passProbability: null,
            minSubjectScore: null,
            failRiskSubjects: [],
            status: "INSUFFICIENT_DATA",
            summaryMessage: `${stage} 문제를 3문항 이상 풀면 예상 점수 및 합격 확률이 실시간 계산됩니다.`,
          };
        }

        // 미측정 과목이 있을 때는 측정된 과목 평균으로 표시하되 안내 문구 구분
        const scores = stageSubjs.map((s) => s.predictedScore);
        const avgMeasured =
          measured.reduce((sum, s) => sum + (s.predictedScore ?? 0), 0) / measured.length;
        const predictedAvg = Math.round(avgMeasured * 10) / 10;
        const minSubjectScore = Math.min(
          ...measured.map((s) => s.predictedScore ?? 0)
        );
        const failRiskSubjects = measured
          .filter((s) => (s.predictedScore ?? 0) < 40)
          .map((s) => s.shortTitle);

        // 합격 확률: 평균 60점 돌파 확률 × 과목별 40점 과락 회피 확률 곱
        const avgScale = Math.max(6, 14 - Math.min(8, solvedCount / 25));
        let passProb = logisticPassProb(predictedAvg - 60, avgScale);
        for (const s of measured) {
          const subjScale = Math.max(6, 14 - Math.min(8, s.solvedCount / 15));
          passProb *= logisticPassProb((s.predictedScore ?? 0) - 40, subjScale);
        }
        // 전 과목이 아직 측정되지 않았으면 표본 불완전성 반영
        if (measured.length < stageSubjs.length) {
          passProb *= 0.85;
        }
        const passProbability = Math.round(clampNum(passProb * 100, 1, 99));

        let status: StagePassPrediction["status"] = "BORDERLINE";
        if (failRiskSubjects.length > 0 || predictedAvg < 52) {
          status = "FAIL_RISK";
        } else if (predictedAvg >= 65 && minSubjectScore >= 48 && passProbability >= 65) {
          status = "PASS_LIKELY";
        }

        const missingNames = stageSubjs
          .filter((_, idx) => scores[idx] === null)
          .map((s) => s.shortTitle);

        let summaryMessage = "";
        if (failRiskSubjects.length > 0) {
          summaryMessage = `과락 위험(${failRiskSubjects.join(", ")} 40점 미만)! 해당 과목 빈출 단원부터 즉시 보강하세요.`;
        } else if (missingNames.length > 0) {
          summaryMessage = `미응시 과목(${missingNames.join(", ")})을 1세트 이상 풀면 ${stage} 전체 예측 정밀도가 완성됩니다.`;
        } else if (predictedAvg >= 60) {
          summaryMessage = `합격권(평균 60점+) 진입! 취약 단원 오답과 지문 ★/X 소거로 점수 굳히기에 들어가세요.`;
        } else {
          const gap = Math.round((60 - predictedAvg) * 10) / 10;
          summaryMessage = `합격 커트라인까지 평균 +${gap}점 필요! 출제비중 상위 단원 정복이 가장 빠릅니다.`;
        }

        return {
          examStage: stage,
          subjects: stageSubjs.map((s) => s.shortTitle),
          solvedCount,
          totalQuestions,
          measuredSubjectCount: measured.length,
          predictedAvg,
          passProbability,
          minSubjectScore,
          failRiskSubjects,
          status,
          summaryMessage,
        };
      }
    );

    const totalSolved = qLogByQId.size;
    const totalCorrect = Array.from(qLogByQId.values()).filter(
      (l) => l.is_correct === true
    ).length;
    const totalQAll = Math.max(1, allQuestions.length);
    const optTotalAll = totalOptO + totalOptStar + totalOptX;

    const dailyTrend: DailyStudyTrendPoint[] = Array.from(dailyAggMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([dateISO, agg]) => ({
        dateISO,
        mmdd: dateISO.slice(5).replace("-", "/"),
        solved: agg.solved,
        correct: agg.correct,
        accuracyPct:
          agg.solved > 0 ? Math.round((agg.correct / agg.solved) * 100) : 0,
      }));

    return {
      success: true,
      years,
      overall: {
        totalQuestions: allQuestions.length,
        totalSolved,
        totalCorrect,
        progressPct: Math.round((totalSolved / totalQAll) * 1000) / 10,
        accuracyPct:
          totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 1000) / 10 : null,
        optionStats: {
          totalMarks: optTotalAll,
          oCount: totalOptO,
          starCount: totalOptStar,
          xCount: totalOptX,
          masteryPct:
            optTotalAll > 0 ? Math.round((totalOptO / optTotalAll) * 1000) / 10 : null,
        },
        questionMarkStats: qMarkCounts,
      },
      topics,
      subjects,
      stagePredictions,
      dailyTrend,
    };
  } catch (err) {
    return {
      success: false,
      years: [],
      overall: emptyOverall,
      topics: [],
      subjects: [],
      stagePredictions: [],
      dailyTrend: [],
      error: err instanceof Error ? err.message : "통계 집계 실패",
    };
  }
}

export interface ChapterKeyPointOption {
  id: string;
  statement: string;
  isCorrect: boolean;
  citation: string | null;
  trapSummary: string | null;
  repeatCount: number;
  isAmended: boolean;
  amendedNote: string | null;
  examYear: number;
  questionNumber: number;
}

export interface ChapterStudyPacketResult {
  success: boolean;
  detailCode: string;
  totalQuestions: number;
  solvedCount: number;
  correctCount: number;
  recentYears: number[];
  amendedCount: number;
  keyOptions: ChapterKeyPointOption[];
  error?: string;
}

/**
 * 교재 없이 단원 학습센터(/study/books)에서 바로 공부할 수 있도록
 * 해당 세부 단원의 기출 통계·개정 문항·핵심 조문/함정 O/X 선지를 조회합니다.
 */
export async function fetchChapterStudyPacketAction(
  detailCode: string,
  clientKey?: string
): Promise<ChapterStudyPacketResult> {
  try {
    const { ownerKey } = await resolveOwnerKeyAndUser(clientKey);
    const { data: qRows, error: qErr } = await supabaseAdmin
      .schema("vertical_housing")
      .from("exam_questions")
      .select("id, exam_year, question_number, law_status")
      .or(`detail_code.eq.${detailCode},chapter_code.eq.${detailCode}`)
      .neq("law_status", "DEPRECATED")
      .order("exam_year", { ascending: false });

    if (qErr) {
      return {
        success: false,
        detailCode,
        totalQuestions: 0,
        solvedCount: 0,
        correctCount: 0,
        recentYears: [],
        amendedCount: 0,
        keyOptions: [],
        error: qErr.message,
      };
    }

    const questions = (qRows ?? []) as Array<{
      id: string;
      exam_year: number;
      question_number: number;
      law_status: string | null;
    }>;

    if (questions.length === 0) {
      return {
        success: true,
        detailCode,
        totalQuestions: 0,
        solvedCount: 0,
        correctCount: 0,
        recentYears: [],
        amendedCount: 0,
        keyOptions: [],
      };
    }

    const qIds = questions.map((q) => q.id);
    const qMetaById = new Map(questions.map((q) => [q.id, q]));
    const recentYears = Array.from(new Set(questions.map((q) => q.exam_year)))
      .sort((a, b) => b - a)
      .slice(0, 5);
    const amendedCount = questions.filter((q) => q.law_status === "AMENDED_MODIFIED").length;

    const [{ data: logs }, { data: optRows }] = await Promise.all([
      supabaseAdmin
        .schema("vertical_housing")
        .from("study_question_logs")
        .select("question_id, is_correct")
        .eq("client_key", ownerKey)
        .in("question_id", qIds),
      supabaseAdmin
        .schema("vertical_housing")
        .from("exam_options")
        .select(
          "id, question_id, option_text, is_correct, legal_citation, trap_summary, repeat_count, is_amended, amended_note, mastery_tier"
        )
        .in("question_id", qIds)
        .order("repeat_count", { ascending: false })
        .order("mastery_tier", { ascending: true })
        .limit(40),
    ]);

    const solvedCount = (logs ?? []).length;
    const correctCount = (logs ?? []).filter((l: { is_correct: boolean | null }) => l.is_correct === true).length;

    const seenTexts = new Set<string>();
    const keyOptions: ChapterKeyPointOption[] = [];
    for (const o of (optRows ?? []) as Array<{
      id: string;
      question_id: string;
      option_text: string;
      is_correct: boolean;
      legal_citation: string | null;
      trap_summary: string | null;
      repeat_count: number | null;
      is_amended: boolean | null;
      amended_note: string | null;
    }>) {
      const normalized = o.option_text.trim();
      if (normalized.length < 18 || seenTexts.has(normalized)) continue;
      if (/^[ㄱㄴㄷㄹㅁ,\s]+$/.test(normalized)) continue;
      seenTexts.add(normalized);
      const qMeta = qMetaById.get(o.question_id);
      keyOptions.push({
        id: o.id,
        statement: normalized,
        isCorrect: o.is_correct,
        citation: o.legal_citation,
        trapSummary: o.trap_summary,
        repeatCount: o.repeat_count ?? 1,
        isAmended: Boolean(o.is_amended),
        amendedNote: o.amended_note,
        examYear: qMeta?.exam_year ?? 2025,
        questionNumber: qMeta?.question_number ?? 1,
      });
      if (keyOptions.length >= 10) break;
    }

    return {
      success: true,
      detailCode,
      totalQuestions: questions.length,
      solvedCount,
      correctCount,
      recentYears,
      amendedCount,
      keyOptions,
    };
  } catch (err) {
    return {
      success: false,
      detailCode,
      totalQuestions: 0,
      solvedCount: 0,
      correctCount: 0,
      recentYears: [],
      amendedCount: 0,
      keyOptions: [],
      error: err instanceof Error ? err.message : "단원 학습 패킷 조회 실패",
    };
  }
}

export interface TheorySectionDoc {
  sectionCode: string;
  detailCode: string;
  subject: string;
  chapterTitle: string;
  sectionTitle: string;
  keywords: string[];
  bodyMd: string;
  sortOrder: number;
}

export interface TheoryBundleResponse {
  success: boolean;
  detailCode: string | null;
  targetSectionCode: string | null;
  sections: TheorySectionDoc[];
  error?: string;
}

/**
 * 2차 과목 이론(.md 동기화 DB: vertical_housing.theory_sections) 단원 및 소주제 섹션을 조회합니다.
 * sectionCode 만 넘어와도 해당 단원의 모든 소주제 섹션을 함께 반환하여 앞뒤 맥락 전환이 가능합니다.
 */
export async function fetchTheoryBundleAction(params: {
  sectionCode?: string | null;
  detailCode?: string | null;
}): Promise<TheoryBundleResponse> {
  try {
    let resolvedDetailCode = params.detailCode ?? null;
    const targetSectionCode = params.sectionCode ?? null;

    if (!resolvedDetailCode && targetSectionCode) {
      const { data: one } = await supabaseAdmin
        .schema("vertical_housing")
        .from("theory_sections")
        .select("detail_code")
        .eq("section_code", targetSectionCode)
        .maybeSingle();

      resolvedDetailCode = (one as { detail_code?: string } | null)?.detail_code ?? null;
      if (!resolvedDetailCode && targetSectionCode.includes("-")) {
        resolvedDetailCode = targetSectionCode.split("-")[0] ?? null;
      }
    }

    if (!resolvedDetailCode) {
      return {
        success: true,
        detailCode: null,
        targetSectionCode,
        sections: [],
      };
    }

    const { data, error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("theory_sections")
      .select(
        "section_code, detail_code, subject, chapter_title, section_title, keywords, body_md, sort_order"
      )
      .eq("detail_code", resolvedDetailCode)
      .order("sort_order", { ascending: true });

    if (error) {
      return {
        success: false,
        detailCode: resolvedDetailCode,
        targetSectionCode,
        sections: [],
        error: error.message,
      };
    }

    const sections: TheorySectionDoc[] = (data ?? []).map(
      (row: {
        section_code: string;
        detail_code: string;
        subject: string;
        chapter_title: string;
        section_title: string;
        keywords: string[] | null;
        body_md: string;
        sort_order: number | null;
      }) => ({
        sectionCode: row.section_code,
        detailCode: row.detail_code,
        subject: row.subject,
        chapterTitle: row.chapter_title,
        sectionTitle: row.section_title,
        keywords: Array.isArray(row.keywords) ? row.keywords : [],
        bodyMd: row.body_md,
        sortOrder: row.sort_order ?? 0,
      })
    );

    const activeSection =
      sections.find((s) => s.sectionCode === targetSectionCode)?.sectionCode ??
      sections[0]?.sectionCode ??
      null;

    return {
      success: true,
      detailCode: resolvedDetailCode,
      targetSectionCode: activeSection,
      sections,
    };
  } catch (err) {
    return {
      success: false,
      detailCode: params.detailCode ?? null,
      targetSectionCode: params.sectionCode ?? null,
      sections: [],
      error: err instanceof Error ? err.message : "이론 섹션 조회 실패",
    };
  }
}

export interface KeywordMatchedOption extends ChapterKeyPointOption {
  subject: string;
  chapterCode: string | null;
  chapterTitle: string | null;
}

export interface KeywordMatchedOptionsResult {
  success: boolean;
  keywordsUsed: string[];
  options: KeywordMatchedOption[];
  error?: string;
}

/**
 * 커스텀 책·단원 제목이나 자유 키워드로 관련 기출 O/X 지문을 빠르게 검색합니다.
 */
export async function searchStudyOptionsByKeywordsAction(
  rawQuery: string,
  subjectHint?: string
): Promise<KeywordMatchedOptionsResult> {
  try {
    // 번호·특수문자 제거 후 2글자 이상 핵심 토큰 최대 3개 추출
    const cleaned = rawQuery
      .replace(/^\s*(?:\d+\.|PART\s*\d+|제\s*\d+\s*[편장절])\s*/gi, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .trim();

    const stopWords = new Set(["총칙", "개요", "기본", "목차", "이론", "기출", "문제", "단원"]);
    const tokens = cleaned
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !stopWords.has(t));

    const keywordsUsed =
      tokens.length > 0 ? tokens.slice(0, 3) : cleaned.length >= 2 ? [cleaned] : [];

    if (keywordsUsed.length === 0) {
      return { success: true, keywordsUsed: [], options: [] };
    }

    const orFilters = keywordsUsed
      .flatMap((kw) => [
        `option_text.ilike.%${kw}%`,
        `trap_summary.ilike.%${kw}%`,
        `legal_citation.ilike.%${kw}%`,
      ])
      .join(",");

    const { data: optRows, error: optErr } = await supabaseAdmin
      .schema("vertical_housing")
      .from("exam_options")
      .select(
        "id, question_id, option_text, is_correct, legal_citation, trap_summary, repeat_count, is_amended, amended_note"
      )
      .or(orFilters)
      .order("repeat_count", { ascending: false })
      .limit(24);

    if (optErr) {
      return {
        success: false,
        keywordsUsed,
        options: [],
        error: optErr.message,
      };
    }

    const rawOpts = (optRows ?? []) as Array<{
      id: string;
      question_id: string;
      option_text: string;
      is_correct: boolean;
      legal_citation: string | null;
      trap_summary: string | null;
      repeat_count: number | null;
      is_amended: boolean | null;
      amended_note: string | null;
    }>;

    if (rawOpts.length === 0) {
      return { success: true, keywordsUsed, options: [] };
    }

    const qIds = Array.from(new Set(rawOpts.map((o) => o.question_id)));
    const { data: qRows } = await supabaseAdmin
      .schema("vertical_housing")
      .from("exam_questions")
      .select("id, subject, chapter_code, chapter_title, exam_year, question_number, law_status")
      .in("id", qIds)
      .neq("law_status", "DEPRECATED");

    const qMap = new Map(
      ((qRows ?? []) as Array<{
        id: string;
        subject: string;
        chapter_code: string | null;
        chapter_title: string | null;
        exam_year: number;
        question_number: number;
      }>).map((q) => [q.id, q])
    );

    const seenTexts = new Set<string>();
    const options: KeywordMatchedOption[] = [];

    for (const o of rawOpts) {
      const q = qMap.get(o.question_id);
      if (!q) continue;
      if (
        subjectHint &&
        subjectHint !== "ALL" &&
        !q.subject.includes(subjectHint.replace("주택관리", "").replace("공동주택", ""))
      ) {
        // 과목 힌트가 명시되어도 완전히 다른 과목만 제외하고, 유사하면 허용
      }
      const normText = o.option_text.trim();
      if (seenTexts.has(normText)) continue;
      seenTexts.add(normText);

      options.push({
        id: o.id,
        statement: normText,
        isCorrect: o.is_correct,
        citation: o.legal_citation,
        trapSummary: o.trap_summary,
        repeatCount: o.repeat_count ?? 1,
        isAmended: Boolean(o.is_amended),
        amendedNote: o.amended_note,
        examYear: q.exam_year,
        questionNumber: q.question_number,
        subject: q.subject,
        chapterCode: q.chapter_code,
        chapterTitle: q.chapter_title,
      });

      if (options.length >= 10) break;
    }

    return { success: true, keywordsUsed, options };
  } catch (err) {
    return {
      success: false,
      keywordsUsed: [],
      options: [],
      error: err instanceof Error ? err.message : "키워드 기출 검색 실패",
    };
  }
}
