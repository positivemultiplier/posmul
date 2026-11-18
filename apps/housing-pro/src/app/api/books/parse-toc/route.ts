import { NextRequest, NextResponse } from "next/server";
import { CUSTOM_SUBJECT_COLOR_PALETTE } from "@/data/study-textbooks";

export interface ParsedTocSubject {
  title: string;
  color: string;
  units: Array<{
    title: string;
    topics: Array<{
      title: string;
      estimatedMinutes: number;
    }>;
  }>;
}

/** 규칙 기반 스마트 목차 파서 (# 과목, PART/제N편/Ⅰ. 대단원, 나머지 단원) */
function parseTocByRules(rawText: string, defaultSubjectTitle: string): ParsedTocSubject[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const subjects: ParsedTocSubject[] = [];
  let currentSubj: ParsedTocSubject | null = null;
  let currentUnit: { title: string; topics: Array<{ title: string; estimatedMinutes: number }> } | null =
    null;

  const ensureSubject = (title: string) => {
    if (!currentSubj) {
      currentSubj = {
        title,
        color: CUSTOM_SUBJECT_COLOR_PALETTE[subjects.length % CUSTOM_SUBJECT_COLOR_PALETTE.length],
        units: [],
      };
      subjects.push(currentSubj);
    }
    return currentSubj;
  };

  const ensureUnit = (title: string) => {
    const subj = ensureSubject(defaultSubjectTitle);
    if (!currentUnit) {
      currentUnit = { title, topics: [] };
      subj.units.push(currentUnit);
    }
    return currentUnit;
  };

  for (const line of lines) {
    // 과목 구분선: "# 민법", "SUBJECT 1 주택관리관계법규", "[과목] 회계원리"
    const subjMatch = line.match(/^(?:#\s*|SUBJECT\s*\d+\s+|\[과목\]\s*)(.+)$/i);
    if (subjMatch) {
      const sTitle = subjMatch[1].trim();
      currentSubj = {
        title: sTitle,
        color: CUSTOM_SUBJECT_COLOR_PALETTE[subjects.length % CUSTOM_SUBJECT_COLOR_PALETTE.length],
        units: [],
      };
      subjects.push(currentSubj);
      currentUnit = null;
      continue;
    }

    // 대단원 구분선: "PART 01 ...", "제1편 ...", "Ⅰ. ...", "## ..."
    const unitMatch = line.match(/^(?:##\s*|PART\s*\d+[:.\s]+|제\s*\d+\s*편\s+)(.+)$/i);
    if (unitMatch) {
      const subj = ensureSubject(defaultSubjectTitle);
      currentUnit = {
        title: line.replace(/^##\s*/, "").trim(),
        topics: [],
      };
      subj.units.push(currentUnit);
      continue;
    }

    // 세부 단원 (앞의 불릿/기호만 살짝 정리)
    const cleanTopic = line
      .replace(/^[-•*]\s*/, "")
      .replace(/^CHAPTER\s*\d+[:.\s]*/i, "")
      .trim();
    if (!cleanTopic) continue;

    const unit = ensureUnit("기본 목차");
    unit.topics.push({
      title: cleanTopic,
      estimatedMinutes: 35,
    });
  }

  return subjects.filter((s) => s.units.some((u) => u.topics.length > 0));
}

export async function POST(req: NextRequest) {
  try {
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

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const shouldUseGemini = Boolean(apiKey && (imageBase64 || rawText.length > 0));

    if (shouldUseGemini && apiKey) {
      try {
        const prompt = `당신은 수험서/교재 목차 구조화 AI입니다.
${bookTitle ? `교재명: ${bookTitle}\n` : ""}제공된 ${
          imageBase64 ? "목차 페이지 이미지" : "목차 텍스트"
        }에서 과목(Subject) → 대단원(Unit) → 세부 단원(Topic) 구조를 추출하여 순수 JSON으로 반환하세요.
규칙:
1. 과목이 명시되어 있으면 과목별로 나누고, 단일 과목 책이면 "${defaultSubjectTitle}" 1개 과목으로 묶으세요. (과목명을 책 이름과 똑같이 반복하지 말고 실제 과목명 또는 "${defaultSubjectTitle}" 사용)
2. 페이지 번호(p.12, 123쪽 등)나 머리말/광고 문구는 제거하고 순수 학습 단원 제목만 추출하세요.
3. 각 세부 단원의 예상 학습 시간(estimatedMinutes)은 25~50분 사이 정수로 추천하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "subjects": [
    {
      "title": "과목명",
      "units": [
        {
          "title": "대단원명",
          "topics": [
            { "title": "세부 단원명", "estimatedMinutes": 35 }
          ]
        }
      ]
    }
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
            signal: AbortSignal.timeout(15000),
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
              subjects?: Array<{
                title?: string;
                units?: Array<{
                  title?: string;
                  topics?: Array<{ title?: string; estimatedMinutes?: number }>;
                }>;
              }>;
            };
            const normalized: ParsedTocSubject[] = (parsed.subjects || [])
              .filter((s) => s.title && Array.isArray(s.units))
              .map((s, idx) => ({
                title: String(s.title).trim(),
                color:
                  CUSTOM_SUBJECT_COLOR_PALETTE[idx % CUSTOM_SUBJECT_COLOR_PALETTE.length],
                units: (s.units || [])
                  .filter((u) => Array.isArray(u.topics) && u.topics.length > 0)
                  .map((u) => ({
                    title: String(u.title || "기본 목차").trim(),
                    topics: (u.topics || [])
                      .filter((t) => t.title && String(t.title).trim().length > 0)
                      .map((t) => ({
                        title: String(t.title).trim(),
                        estimatedMinutes:
                          typeof t.estimatedMinutes === "number" && t.estimatedMinutes > 0
                            ? Math.min(120, Math.max(15, Math.round(t.estimatedMinutes)))
                            : 35,
                      })),
                  })),
              }))
              .filter((s) => s.units.length > 0);

            if (normalized.length > 0) {
              return NextResponse.json({
                success: true,
                engine: "gemini",
                subjects: normalized,
              });
            }
          }
        }
      } catch {
        // Gemini 실패 시 아래 규칙 파서로 폴백
      }
    }

    if (rawText) {
      const ruleSubjects = parseTocByRules(rawText, defaultSubjectTitle);
      return NextResponse.json({
        success: true,
        engine: "rule",
        subjects: ruleSubjects,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "목차 이미지를 인식하지 못했습니다. 목차 텍스트를 직접 입력해 주세요.",
      },
      { status: 422 }
    );
  } catch (error) {
    console.error("[parse-toc] error:", error);
    return NextResponse.json(
      { success: false, error: "목차 파싱 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
