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
