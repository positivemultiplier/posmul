import { NextRequest, NextResponse } from "next/server";
import {
  CUSTOM_SUBJECT_COLOR_PALETTE,
  estimateMinutesFromPages,
} from "@/data/study-textbooks";
import { resolveAuthenticatedUser } from "@/lib/auth-provision";

const MAX_TOC_TEXT_CHARS = 50_000;
const MAX_TOC_IMAGE_BASE64_CHARS = 8 * 1024 * 1024;

export interface ParsedTocNode {
  level: 0 | 1 | 2 | 3;
  title: string;
  pageStart?: number;
  pageEnd?: number;
  estimatedMinutes?: number;
}

export interface ParsedTocSubject {
  title: string;
  color: string;
  units: Array<{
    title: string;
    topics: Array<{
      title: string;
      estimatedMinutes: number;
      hierarchyPath?: string[];
      pageStart?: number;
      pageEnd?: number;
    }>;
  }>;
}

/** 줄 끝의 페이지 번호(p.14, 14쪽, ... 42, (14p) 등) 분리 추출 */
function extractTrailingPageNumber(rawLine: string): {
  title: string;
  pageStart?: number;
} {
  const trimmed = rawLine.trim();
  // 패턴 1: p.14 / P.14 / 14p / 14쪽 / (p.14) / [14쪽]
  const explicitMatch = trimmed.match(
    /^(.*?)(?:[\s·.…\-–—]+|\s*[\(\[])?(?:p\.?\s*(\d{1,4})|(\d{1,4})\s*(?:p|쪽|페이지))[\)\]]?\s*$/i
  );
  if (explicitMatch) {
    const num = Number(explicitMatch[2] || explicitMatch[3]);
    const cleanTitle = explicitMatch[1].replace(/[\s·.…\-–—]+$/, "").trim();
    if (cleanTitle.length >= 1 && num > 0 && num <= 3000) {
      return { title: cleanTitle, pageStart: num };
    }
  }

  // 패턴 2: 점선/공백 2칸 이상 뒤 숫자 ("제1장 총칙 .... 24" 또는 "01 용어정의   18")
  const dottedMatch = trimmed.match(/^(.*?)(?:\.{2,}|…+|\s{2,}|\t+)(\d{1,4})\s*$/);
  if (dottedMatch) {
    const num = Number(dottedMatch[2]);
    const cleanTitle = dottedMatch[1].replace(/[\s·.…\-–—]+$/, "").trim();
    if (cleanTitle.length >= 2 && num > 0 && num <= 3000) {
      return { title: cleanTitle, pageStart: num };
    }
  }

  return { title: trimmed };
}

/** 인접한 시작 페이지들을 이용해 끝 페이지(pageEnd)와 예상시간 자동 보간 */
function fillPageEndsAndMinutes(nodes: ParsedTocNode[]): ParsedTocNode[] {
  const result = nodes.map((n) => ({ ...n }));
  for (let i = 0; i < result.length; i += 1) {
    const cur = result[i];
    if (typeof cur.pageStart === "number" && typeof cur.pageEnd !== "number") {
      // 다음으로 나오는 유효한 pageStart 검색
      for (let j = i + 1; j < result.length; j += 1) {
        const nextStart = result[j].pageStart;
        if (typeof nextStart === "number" && nextStart >= cur.pageStart) {
          cur.pageEnd = Math.max(cur.pageStart, nextStart - 1);
          break;
        }
      }
    }
    if (
      typeof cur.pageStart === "number" &&
      typeof cur.pageEnd === "number" &&
      cur.pageEnd >= cur.pageStart
    ) {
      const pages = cur.pageEnd - cur.pageStart + 1;
      cur.estimatedMinutes = estimateMinutesFromPages(pages, cur.estimatedMinutes ?? 35);
    }
  }
  return result;
}

/** 규칙 기반 4단계 스마트 목차 파서 (과목 0 · 편/PART 1 · 장/CHAPTER 2 · 절/단원 3 + 페이지 추출) */
function parseTocNodesByRules(rawText: string, defaultSubjectTitle: string): ParsedTocNode[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, "  ").trimEnd())
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  const nodes: ParsedTocNode[] = [];
  let hasPart = false;
  let hasChapter = false;

  for (const rawLine of lines) {
    const leadingSpaces = rawLine.length - rawLine.trimStart().length;
    const trimmed = rawLine.trim();
    const { title: withoutPage, pageStart } = extractTrailingPageNumber(trimmed);
    if (!withoutPage) continue;

    // Level 0: 과목 ("# 민법", "SUBJECT 1 ...", "[과목] ...")
    if (/^(?:#\s*|SUBJECT\s*\d+\s+|\[과목\]\s*)/i.test(withoutPage)) {
      const sTitle = withoutPage.replace(/^(?:#\s*|SUBJECT\s*\d+\s+|\[과목\]\s*)/i, "").trim();
      nodes.push({ level: 0, title: sTitle, pageStart });
      continue;
    }

    // Level 1: 편/PART/대단원 ("## ...", "PART 01 ...", "제1편 ...", "Ⅰ. ...")
    if (/^(?:##\s*|PART\s*\d+[:.\s]+|제\s*\d+\s*편\b|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]\.\s+)/i.test(withoutPage)) {
      hasPart = true;
      const pTitle = withoutPage.replace(/^##\s*/, "").trim();
      nodes.push({ level: 1, title: pTitle, pageStart });
      continue;
    }

    // Level 2: 장/CHAPTER/중단원 ("### ...", "CHAPTER 01 ...", "제1장 ...")
    if (/^(?:###\s*|CHAPTER\s*\d+[:.\s]+|제\s*\d+\s*장\b)/i.test(withoutPage)) {
      hasChapter = true;
      const cTitle = withoutPage.replace(/^###\s*/, "").trim();
      nodes.push({ level: 2, title: cTitle, pageStart });
      continue;
    }

    // Level 3: 절/세부 단원 ("제1절 ...", "01. ...", "- ...", 들여쓰기)
    const cleanTitle = withoutPage.replace(/^[-•*]\s*/, "").trim();
    const inferredLevel: 0 | 1 | 2 | 3 =
      leadingSpaces >= 4 || (hasPart && hasChapter) || /^제\s*\d+\s*절\b/.test(cleanTitle)
        ? 3
        : hasPart || hasChapter
          ? 2
          : 2;

    nodes.push({
      level: inferredLevel,
      title: cleanTitle,
      pageStart,
      estimatedMinutes: 35,
    });
  }

  // 과목(Level 0)이 하나도 없으면 맨 앞에 기본 과목 보정
  if (nodes.length > 0 && !nodes.some((n) => n.level === 0)) {
    nodes.unshift({ level: 0, title: defaultSubjectTitle });
  }

  return fillPageEndsAndMinutes(nodes);
}

/** ParsedTocNode[] -> 기존 ParsedTocSubject[] 호환 변환 */
function nodesToParsedSubjects(
  nodes: ParsedTocNode[],
  defaultSubjectTitle: string
): ParsedTocSubject[] {
  const subjects: ParsedTocSubject[] = [];
  let curSubj: ParsedTocSubject | null = null;
  let curPartTitle = "";
  let curChapterTitle = "";
  let curUnit: ParsedTocSubject["units"][number] | null = null;

  const ensureSubj = (title: string) => {
    if (!curSubj) {
      curSubj = {
        title: title || defaultSubjectTitle,
        color:
          CUSTOM_SUBJECT_COLOR_PALETTE[
            subjects.length % CUSTOM_SUBJECT_COLOR_PALETTE.length
          ],
        units: [],
      };
      subjects.push(curSubj);
    }
    return curSubj;
  };

  const ensureUnit = (title: string) => {
    const subj = ensureSubj(defaultSubjectTitle);
    if (!curUnit) {
      curUnit = { title: title || "기본 목차", topics: [] };
      subj.units.push(curUnit);
    }
    return curUnit;
  };

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const nextNode = nodes[i + 1];
    const hasDeeperChild = Boolean(nextNode && nextNode.level > node.level);

    if (node.level === 0) {
      curSubj = {
        title: node.title,
        color:
          CUSTOM_SUBJECT_COLOR_PALETTE[
            subjects.length % CUSTOM_SUBJECT_COLOR_PALETTE.length
          ],
        units: [],
      };
      subjects.push(curSubj);
      curPartTitle = "";
      curChapterTitle = "";
      curUnit = null;
      continue;
    }

    if (node.level === 1 && hasDeeperChild) {
      const subj = ensureSubj(defaultSubjectTitle);
      curPartTitle = node.title;
      curChapterTitle = "";
      curUnit = { title: node.title, topics: [] };
      subj.units.push(curUnit);
      continue;
    }

    if (node.level === 2 && hasDeeperChild) {
      curChapterTitle = node.title;
      if (!curUnit) {
        ensureUnit(curPartTitle || node.title);
      }
      continue;
    }

    // 말단 체크포인트 노드
    const unit = ensureUnit(curPartTitle || "기본 목차");
    const hierarchyPath: string[] = [];
    if (curPartTitle && curPartTitle !== "기본 목차") hierarchyPath.push(curPartTitle);
    if (curChapterTitle && node.level >= 3) hierarchyPath.push(curChapterTitle);

    unit.topics.push({
      title: node.title,
      estimatedMinutes: node.estimatedMinutes ?? 35,
      ...(hierarchyPath.length > 0 ? { hierarchyPath } : {}),
      ...(typeof node.pageStart === "number" ? { pageStart: node.pageStart } : {}),
      ...(typeof node.pageEnd === "number" ? { pageEnd: node.pageEnd } : {}),
    });
  }

  return subjects.filter((s) => s.units.some((u) => u.topics.length > 0));
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await resolveAuthenticatedUser();
    if (!sessionUser?.id) {
      return NextResponse.json(
        { success: false, error: "AI 목차 분석을 사용하려면 먼저 로그인해 주세요." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      rawText?: string;
      imageBase64?: string;
      mimeType?: string;
      bookTitle?: string;
      defaultSubjectTitle?: string;
    };

    const rawText = (body.rawText || "").trim();
    const imageBase64 = (body.imageBase64 || "").trim();
    const mimeType = body.mimeType || "image/jpeg";
    const defaultSubjectTitle = (body.defaultSubjectTitle || "기본 과목").trim();
    const bookTitle = (body.bookTitle || "").trim();

    if (!rawText && !imageBase64) {
      return NextResponse.json(
        { success: false, error: "목차 텍스트 또는 이미지를 입력해 주세요." },
        { status: 400 }
      );
    }

    if (
      rawText.length > MAX_TOC_TEXT_CHARS ||
      imageBase64.length > MAX_TOC_IMAGE_BASE64_CHARS
    ) {
      return NextResponse.json(
        { success: false, error: "입력 텍스트 또는 이미지 크기가 허용 한도를 초과했습니다." },
        { status: 413 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const shouldUseGemini = Boolean(apiKey && (imageBase64 || rawText.length > 0));

    if (shouldUseGemini && apiKey) {
      try {
        const prompt = `당신은 수험서/교재 목차 구조화 AI입니다.
${bookTitle ? `교재명: ${bookTitle}\n` : ""}제공된 ${
          imageBase64 ? "목차 페이지 이미지" : "목차 텍스트"
        }에서 최대 4단계 계층(level 0~3)과 각 항목의 시작 페이지 번호(pageStart)를 추출하여 순수 JSON으로 반환하세요.
규칙:
1. level 의미:
   - 0: 과목 (단일 과목 책이면 "${defaultSubjectTitle}" 1개로 시작)
   - 1: 편 / PART / 대단원
   - 2: 장 / CHAPTER / 중단원
   - 3: 절 / 소단원 / 세부 체크포인트
   (책이 단순 2단 구조라면 0과 2만 써도 되며, 불필요한 가짜 계층을 억지로 만들지 마세요)
2. 제목 옆에 페이지 번호(p.14, 14쪽, ... 42 등)가 보이면 제목에서 숫자를 제거하고 정수 "pageStart" 필드에 정확히 넣으세요. 페이지가 없으면 생략하세요.
3. 머리말/광고/출판사 홍보 문구는 제외하고 학습 목차만 순서대로 추출하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "nodes": [
    { "level": 0, "title": "과목명" },
    { "level": 1, "title": "제1편 주택법", "pageStart": 12 },
    { "level": 2, "title": "제1장 총칙", "pageStart": 14 },
    { "level": 3, "title": "01. 용어의 정의", "pageStart": 14 }
  ]
}`;

        const parts: Array<Record<string, unknown>> = [{ text: prompt }];
        if (rawText) {
          parts.push({ text: `[목차 텍스트]\n${rawText}` });
        }
        if (imageBase64) {
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          });
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
            signal: AbortSignal.timeout(18000),
          }
        );

        if (response.ok) {
          const data = (await response.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText) as {
              nodes?: Array<{
                level?: number;
                title?: string;
                pageStart?: number;
                pageEnd?: number;
                estimatedMinutes?: number;
              }>;
            };
            const rawNodes: ParsedTocNode[] = (parsed.nodes || [])
              .filter((n) => n.title && String(n.title).trim().length > 0)
              .map((n) => {
                const lvl = Math.max(0, Math.min(3, Number(n.level ?? 2))) as 0 | 1 | 2 | 3;
                return {
                  level: lvl,
                  title: String(n.title).trim(),
                  ...(typeof n.pageStart === "number" && n.pageStart > 0
                    ? { pageStart: Math.round(n.pageStart) }
                    : {}),
                  ...(typeof n.pageEnd === "number" && n.pageEnd > 0
                    ? { pageEnd: Math.round(n.pageEnd) }
                    : {}),
                  ...(typeof n.estimatedMinutes === "number" && n.estimatedMinutes > 0
                    ? { estimatedMinutes: Math.min(180, Math.max(15, Math.round(n.estimatedMinutes))) }
                    : {}),
                };
              });

            if (rawNodes.length > 0) {
              const enriched = fillPageEndsAndMinutes(rawNodes);
              const subjects = nodesToParsedSubjects(enriched, defaultSubjectTitle);
              return NextResponse.json({
                success: true,
                engine: "gemini",
                nodes: enriched,
                subjects,
              });
            }
          }
        }
      } catch {
        // Gemini 실패 시 규칙 파서로 폴백
      }
    }

    if (rawText) {
      const ruleNodes = parseTocNodesByRules(rawText, defaultSubjectTitle);
      const ruleSubjects = nodesToParsedSubjects(ruleNodes, defaultSubjectTitle);
      return NextResponse.json({
        success: true,
        engine: "rule",
        nodes: ruleNodes,
        subjects: ruleSubjects,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "이미지에서 목차를 추출하지 못했습니다. Gemini API 키 설정을 확인하거나 텍스트로 붙여넣어 주세요.",
      },
      { status: 422 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "목차 파싱 중 오류 발생",
      },
      { status: 500 }
    );
  }
}
