"use server";

import { resolveAuthenticatedUser } from "@/lib/auth-provision";
import { supabaseAdmin } from "@/lib/supabase";
import { tokenizeTextWithKnowledgeGraph } from "@/data/knowledge-graph-housing";
import { CURRICULUM_ORDER_MAP } from "@/data/study-textbooks";

export type MnemonicType = "ACRONYM" | "STORY" | "COMPARE" | "TIP";

export interface ConceptMnemonicItem {
  id: string;
  conceptId: string;
  authorName: string;
  mnemonicType: MnemonicType;
  shortHook: string;
  detailNote: string | null;
  upvoteCount: number;
  isSeed: boolean;
  isMine: boolean;
  hasVoted: boolean;
  createdAt: string;
}

/** 특정 개념 노드의 집단지성 암기법 목록 (인기투표 순) 조회 */
export async function fetchConceptMnemonicsAction(conceptId: string): Promise<{
  success: boolean;
  items: ConceptMnemonicItem[];
  error?: string;
}> {
  try {
    const cleanId = conceptId.trim();
    if (!cleanId) return { success: true, items: [] };

    const sessionUser = await resolveAuthenticatedUser();

    const { data: rows, error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("concept_mnemonics")
      .select(
        "id, concept_id, author_user_id, author_name, mnemonic_type, short_hook, detail_note, upvote_count, is_seed, created_at"
      )
      .eq("concept_id", cleanId)
      .order("upvote_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return { success: false, items: [], error: error.message };
    }

    const votedSet = new Set<string>();
    if (sessionUser?.id && rows && rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const { data: votes } = await supabaseAdmin
        .schema("vertical_housing")
        .from("concept_mnemonic_votes")
        .select("mnemonic_id")
        .eq("voter_user_id", sessionUser.id)
        .in("mnemonic_id", ids);

      for (const v of votes || []) {
        votedSet.add(v.mnemonic_id);
      }
    }

    const items: ConceptMnemonicItem[] = (rows || []).map((r) => ({
      id: r.id,
      conceptId: r.concept_id,
      authorName: r.author_name || "익명 수험생",
      mnemonicType: (r.mnemonic_type as MnemonicType) || "ACRONYM",
      shortHook: r.short_hook,
      detailNote: r.detail_note ?? null,
      upvoteCount: Number(r.upvote_count ?? 0),
      isSeed: Boolean(r.is_seed),
      isMine: Boolean(sessionUser?.id && r.author_user_id === sessionUser.id),
      hasVoted: votedSet.has(r.id),
      createdAt: r.created_at,
    }));

    return { success: true, items };
  } catch (err) {
    return {
      success: false,
      items: [],
      error: err instanceof Error ? err.message : "암기법 조회 실패",
    };
  }
}

/** 나만의 암기법(두문자·스토리·비교팁) 등록 */
export async function createConceptMnemonicAction(input: {
  conceptId: string;
  mnemonicType: MnemonicType;
  shortHook: string;
  detailNote?: string;
}): Promise<{
  success: boolean;
  item?: ConceptMnemonicItem;
  requiresLogin?: boolean;
  error?: string;
}> {
  try {
    const sessionUser = await resolveAuthenticatedUser();
    if (!sessionUser?.id) {
      return {
        success: false,
        requiresLogin: true,
        error: "로그인하면 나만의 암기법을 공유하고 추천을 받을 수 있습니다.",
      };
    }

    const cleanConceptId = input.conceptId.trim();
    const cleanHook = input.shortHook.trim();
    const cleanDetail = (input.detailNote || "").trim();

    if (!cleanConceptId || cleanHook.length < 2 || cleanHook.length > 140) {
      return {
        success: false,
        error: "한 줄 암기법은 2자 이상 140자 이하로 입력해 주세요.",
      };
    }

    const displayName =
      (sessionUser.user_metadata?.full_name as string | undefined) ||
      (sessionUser.user_metadata?.name as string | undefined) ||
      sessionUser.email?.split("@")[0] ||
      "수험생";

    const { data: inserted, error } = await supabaseAdmin
      .schema("vertical_housing")
      .from("concept_mnemonics")
      .insert({
        concept_id: cleanConceptId,
        author_user_id: sessionUser.id,
        author_name: displayName.slice(0, 20),
        mnemonic_type: input.mnemonicType,
        short_hook: cleanHook,
        detail_note: cleanDetail ? cleanDetail.slice(0, 500) : null,
        upvote_count: 1,
        is_seed: false,
      })
      .select(
        "id, concept_id, author_name, mnemonic_type, short_hook, detail_note, upvote_count, is_seed, created_at"
      )
      .single();

    if (error || !inserted) {
      return { success: false, error: error?.message || "암기법 등록 실패" };
    }

    // 작성자 본인 기본 1표 자동 등록
    await supabaseAdmin
      .schema("vertical_housing")
      .from("concept_mnemonic_votes")
      .insert({
        mnemonic_id: inserted.id,
        voter_user_id: sessionUser.id,
      });

    return {
      success: true,
      item: {
        id: inserted.id,
        conceptId: inserted.concept_id,
        authorName: inserted.author_name,
        mnemonicType: inserted.mnemonic_type as MnemonicType,
        shortHook: inserted.short_hook,
        detailNote: inserted.detail_note ?? null,
        upvoteCount: Number(inserted.upvote_count ?? 1),
        isSeed: false,
        isMine: true,
        hasVoted: true,
        createdAt: inserted.created_at,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "암기법 등록 중 오류 발생",
    };
  }
}

/** 암기법 인기투표(👍 추천) 토글 (1인 1표 중복 차단) */
export async function toggleMnemonicVoteAction(mnemonicId: string): Promise<{
  success: boolean;
  voted?: boolean;
  upvoteCount?: number;
  requiresLogin?: boolean;
  error?: string;
}> {
  try {
    const sessionUser = await resolveAuthenticatedUser();
    if (!sessionUser?.id) {
      return {
        success: false,
        requiresLogin: true,
        error: "로그인하면 베스트 암기법에 투표할 수 있습니다.",
      };
    }

    const { data: existing } = await supabaseAdmin
      .schema("vertical_housing")
      .from("concept_mnemonic_votes")
      .select("id")
      .eq("mnemonic_id", mnemonicId)
      .eq("voter_user_id", sessionUser.id)
      .maybeSingle();

    const { data: currentRow } = await supabaseAdmin
      .schema("vertical_housing")
      .from("concept_mnemonics")
      .select("upvote_count")
      .eq("id", mnemonicId)
      .single();

    if (!currentRow) {
      return { success: false, error: "암기법을 찾을 수 없습니다." };
    }

    let nextCount = Number(currentRow.upvote_count ?? 0);
    let voted = false;

    if (existing?.id) {
      await supabaseAdmin
        .schema("vertical_housing")
        .from("concept_mnemonic_votes")
        .delete()
        .eq("id", existing.id);
      nextCount = Math.max(0, nextCount - 1);
      voted = false;
    } else {
      const { error: insErr } = await supabaseAdmin
        .schema("vertical_housing")
        .from("concept_mnemonic_votes")
        .insert({
          mnemonic_id: mnemonicId,
          voter_user_id: sessionUser.id,
        });
      if (insErr) {
        return { success: false, error: insErr.message };
      }
      nextCount += 1;
      voted = true;
    }

    await supabaseAdmin
      .schema("vertical_housing")
      .from("concept_mnemonics")
      .update({ upvote_count: nextCount })
      .eq("id", mnemonicId);

    return { success: true, voted, upvoteCount: nextCount };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "투표 처리 중 오류 발생",
    };
  }
}

export interface LiveGraphQuestionItem {
  id: string;
  examYear: number;
  examRound: number;
  subject: string;
  questionNumber: number;
  detailCode: string | null;
  chapterTitle: string | null;
  questionText: string;
  boxContent: string | null;
  options: Array<{
    number: number;
    text: string;
    isCorrect: boolean;
    trapSummary: string | null;
  }>;
  correctOptions: number[];
  matchedConceptCount: number;
  matchedContrastCount: number;
}

export interface GraphChapterSummary {
  code: string;
  subject: string;
  title: string;
  topicNo: string | null;
  questionCount: number;
}

/**
 * 라이브 Supabase DB의 실제 주택관리사 2차 기출 560문항(법규 280 · 실무 280)에서
 * 지식 그래프 개념·대조어가 자동 매칭되는 객관식 기출 1문항을 즉시 불러옵니다.
 * → 문제를 수동으로 하드코딩하지 않고, 2차 기출 전량에 자동으로 꼬리물기가 작동합니다!
 */
export async function fetchLive2ndGraphQuestionAction(input?: {
  subject?: "ALL" | "주택관리관계법규" | "공동주택관리실무";
  keyword?: string;
  excludeIds?: string[];
}): Promise<{
  success: boolean;
  question?: LiveGraphQuestionItem;
  totalPoolCount?: number;
  error?: string;
}> {
  try {
    const subjectFilter = input?.subject || "ALL";
    const keyword = (input?.keyword || "").trim();
    const excludeSet = new Set(input?.excludeIds || []);

    let query = supabaseAdmin
      .schema("vertical_housing")
      .from("exam_questions")
      .select(
        "id, exam_year, exam_round, subject, chapter_title, question_number, question_text, box_content, correct_options"
      )
      .eq("exam_stage", "2차")
      .eq("question_type", "OBJECTIVE")
      .neq("law_status", "DEPRECATED")
      .order("exam_year", { ascending: false })
      .order("question_number", { ascending: true })
      .limit(360);

    if (subjectFilter !== "ALL") {
      query = query.eq("subject", subjectFilter);
    }

    const { data: qRows, error: qErr } = await query;
    if (qErr) return { success: false, error: qErr.message };
    if (!qRows || qRows.length === 0) {
      return { success: false, error: "조건에 맞는 2차 기출 문항이 없습니다." };
    }

    // 중복 회피 + 셔플 후 최대 45문항의 선지만 빠르게 조회
    const pool = qRows.filter((q) => !excludeSet.has(q.id));
    const workingPool = pool.length > 0 ? pool : qRows;
    const shuffled = [...workingPool].sort(() => Math.random() - 0.5);
    const sampleQuestions = keyword
      ? workingPool.slice(0, 120)
      : shuffled.slice(0, 40);

    const qIds = sampleQuestions.map((q) => q.id);
    const { data: optRows, error: optErr } = await supabaseAdmin
      .schema("vertical_housing")
      .from("exam_options")
      .select("question_id, option_number, option_text, is_correct, trap_summary")
      .in("question_id", qIds)
      .order("option_number", { ascending: true });

    if (optErr) return { success: false, error: optErr.message };

    const optMap = new Map<
      string,
      Array<{ number: number; text: string; isCorrect: boolean; trapSummary: string | null }>
    >();
    for (const row of optRows || []) {
      const list = optMap.get(row.question_id) || [];
      list.push({
        number: row.option_number,
        text: row.option_text,
        isCorrect: Boolean(row.is_correct),
        trapSummary: row.trap_summary ?? null,
      });
      optMap.set(row.question_id, list);
    }

    const candidates: LiveGraphQuestionItem[] = [];

    for (const q of sampleQuestions) {
      const opts = optMap.get(q.id) || [];
      if (opts.length < 4) continue;
      const correctArr = Array.isArray(q.correct_options)
        ? q.correct_options.map(Number).filter((n) => !Number.isNaN(n))
        : [];
      if (correctArr.length === 0) continue;

      const combined = `${q.question_text} ${q.box_content || ""} ${opts
        .map((o) => o.text)
        .join(" ")}`;

      if (keyword && !combined.includes(keyword)) continue;

      const tokens = tokenizeTextWithKnowledgeGraph(combined, combined);
      const conceptSet = new Set<string>();
      const contrastSet = new Set<string>();
      for (const tk of tokens) {
        if (tk.kind === "concept" && tk.conceptId) conceptSet.add(tk.conceptId);
        if (tk.kind === "contrast" && tk.axisId) contrastSet.add(tk.axisId);
      }

      if (conceptSet.size === 0 && contrastSet.size === 0 && !keyword) {
        continue;
      }

      candidates.push({
        id: q.id,
        examYear: q.exam_year,
        examRound: q.exam_round,
        subject: q.subject,
        questionNumber: q.question_number,
        detailCode: null,
        chapterTitle: q.chapter_title ?? null,
        questionText: q.question_text,
        boxContent: q.box_content ?? null,
        options: opts,
        correctOptions: correctArr,
        matchedConceptCount: conceptSet.size,
        matchedContrastCount: contrastSet.size,
      });
    }

    if (candidates.length === 0) {
      return {
        success: false,
        error: keyword
          ? `"${keyword}" 키워드가 포함된 2차 객관식 기출을 찾지 못했습니다.`
          : "연결된 개념이 있는 2차 기출을 찾지 못했습니다.",
      };
    }

    // 링크가 풍부한(개념+대조어 2개 이상) 문항 우선 랜덤 선택
    const richCandidates = candidates.filter(
      (c) => c.matchedConceptCount + c.matchedContrastCount >= 2
    );
    const pickPool = richCandidates.length > 0 ? richCandidates : candidates;
    const picked = pickPool[Math.floor(Math.random() * pickPool.length)];

    return {
      success: true,
      question: picked,
      totalPoolCount: qRows.length,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "실제 2차 기출 조회 실패",
    };
  }
}

/**
 * 지식맵 '단원별 기출' 선택용 단원 목록 집계 (초경량 컬럼만 조회)
 */
export async function fetchGraphChapterSummaryAction(input?: {
  subject?: "ALL" | "주택관리관계법규" | "공동주택관리실무";
}): Promise<{
  success: boolean;
  chapters: GraphChapterSummary[];
  totalQuestions: number;
  error?: string;
}> {
  try {
    const subjectFilter = input?.subject || "ALL";
    let query = supabaseAdmin
      .schema("vertical_housing")
      .from("exam_questions")
      .select("subject, detail_code, chapter_code, detail_title, chapter_title")
      .eq("exam_stage", "2차")
      .eq("question_type", "OBJECTIVE")
      .neq("law_status", "DEPRECATED")
      .limit(1000);

    if (subjectFilter !== "ALL") {
      query = query.eq("subject", subjectFilter);
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, chapters: [], totalQuestions: 0, error: error.message };
    }

    const rows = (data ?? []) as Array<{
      subject: string;
      detail_code: string | null;
      chapter_code: string | null;
      detail_title: string | null;
      chapter_title: string | null;
    }>;

    const map = new Map<string, GraphChapterSummary>();
    for (const r of rows) {
      const code = r.detail_code || r.chapter_code || "ETC";
      const mapKey = `${r.subject}::${code}`;
      const existing = map.get(mapKey);
      if (existing) {
        existing.questionCount += 1;
      } else {
        const meta = CURRICULUM_ORDER_MAP[code];
        const rawTitle = meta?.title || r.detail_title || r.chapter_title || code;
        map.set(mapKey, {
          code,
          subject: r.subject,
          title: rawTitle,
          topicNo: meta?.topicNo ?? null,
          questionCount: 1,
        });
      }
    }

    const chapters = Array.from(map.values()).sort((a, b) => {
      const orderA = CURRICULUM_ORDER_MAP[a.code]?.globalOrder ?? 9999;
      const orderB = CURRICULUM_ORDER_MAP[b.code]?.globalOrder ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return b.questionCount - a.questionCount;
    });

    return {
      success: true,
      chapters,
      totalQuestions: rows.length,
    };
  } catch (err) {
    return {
      success: false,
      chapters: [],
      totalQuestions: 0,
      error: err instanceof Error ? err.message : "단원 목록 조회 실패",
    };
  }
}

/**
 * 지식맵 단원별 기출 점진적 배치 로드 (기본 5문항씩 초고속 조회 + 백그라운드 프리페치 대응)
 */
export async function fetchChapterGraphQuestionsAction(input?: {
  subject?: "ALL" | "주택관리관계법규" | "공동주택관리실무";
  detailCode?: string | null;
  offset?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  questions: LiveGraphQuestionItem[];
  totalCount: number;
  hasMore: boolean;
  nextOffset: number;
  error?: string;
}> {
  try {
    const subjectFilter = input?.subject || "ALL";
    const detailCode = input?.detailCode?.trim() || null;
    const safeOffset = Math.max(0, Math.floor(input?.offset ?? 0));
    const safeLimit = Math.max(1, Math.min(15, Math.floor(input?.limit ?? 5)));

    let query = supabaseAdmin
      .schema("vertical_housing")
      .from("exam_questions")
      .select(
        "id, exam_year, exam_round, subject, detail_code, chapter_title, detail_title, question_number, question_text, box_content, correct_options",
        { count: "exact" }
      )
      .eq("exam_stage", "2차")
      .eq("question_type", "OBJECTIVE")
      .neq("law_status", "DEPRECATED")
      .order("exam_year", { ascending: false })
      .order("question_number", { ascending: true });

    if (subjectFilter !== "ALL") {
      query = query.eq("subject", subjectFilter);
    }
    if (detailCode) {
      query = query.or(`detail_code.eq.${detailCode},chapter_code.eq.${detailCode}`);
    }

    const { data: qRows, count, error: qErr } = await query.range(
      safeOffset,
      safeOffset + safeLimit - 1
    );

    if (qErr) {
      return {
        success: false,
        questions: [],
        totalCount: 0,
        hasMore: false,
        nextOffset: safeOffset,
        error: qErr.message,
      };
    }

    const rows = qRows ?? [];
    const totalCount = count ?? safeOffset + rows.length;
    if (rows.length === 0) {
      return {
        success: true,
        questions: [],
        totalCount,
        hasMore: false,
        nextOffset: safeOffset,
      };
    }

    const qIds = rows.map((q) => q.id);
    const { data: optRows, error: optErr } = await supabaseAdmin
      .schema("vertical_housing")
      .from("exam_options")
      .select("question_id, option_number, option_text, is_correct, trap_summary")
      .in("question_id", qIds)
      .order("option_number", { ascending: true });

    if (optErr) {
      return {
        success: false,
        questions: [],
        totalCount,
        hasMore: false,
        nextOffset: safeOffset,
        error: optErr.message,
      };
    }

    const optMap = new Map<
      string,
      Array<{ number: number; text: string; isCorrect: boolean; trapSummary: string | null }>
    >();
    for (const row of optRows || []) {
      const list = optMap.get(row.question_id) || [];
      list.push({
        number: row.option_number,
        text: row.option_text,
        isCorrect: Boolean(row.is_correct),
        trapSummary: row.trap_summary ?? null,
      });
      optMap.set(row.question_id, list);
    }

    const questions: LiveGraphQuestionItem[] = [];
    for (const q of rows) {
      const opts = optMap.get(q.id) || [];
      const correctArr = Array.isArray(q.correct_options)
        ? q.correct_options.map(Number).filter((n) => !Number.isNaN(n))
        : [];
      const combined = `${q.question_text} ${q.box_content || ""} ${opts
        .map((o) => o.text)
        .join(" ")}`;
      const tokens = tokenizeTextWithKnowledgeGraph(combined, combined);
      const conceptSet = new Set<string>();
      const contrastSet = new Set<string>();
      for (const tk of tokens) {
        if (tk.kind === "concept" && tk.conceptId) conceptSet.add(tk.conceptId);
        if (tk.kind === "contrast" && tk.axisId) contrastSet.add(tk.axisId);
      }

      const code = q.detail_code ?? null;
      const meta = code ? CURRICULUM_ORDER_MAP[code] : undefined;

      questions.push({
        id: q.id,
        examYear: q.exam_year,
        examRound: q.exam_round,
        subject: q.subject,
        questionNumber: q.question_number,
        detailCode: code,
        chapterTitle: meta?.title || q.detail_title || q.chapter_title || null,
        questionText: q.question_text,
        boxContent: q.box_content ?? null,
        options: opts,
        correctOptions: correctArr,
        matchedConceptCount: conceptSet.size,
        matchedContrastCount: contrastSet.size,
      });
    }

    const nextOffset = safeOffset + rows.length;
    const hasMore = rows.length === safeLimit && nextOffset < totalCount;

    return {
      success: true,
      questions,
      totalCount,
      hasMore,
      nextOffset,
    };
  } catch (err) {
    return {
      success: false,
      questions: [],
      totalCount: 0,
      hasMore: false,
      nextOffset: 0,
      error: err instanceof Error ? err.message : "단원별 기출 조회 실패",
    };
  }
}
