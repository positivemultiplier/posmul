import type { DraftResult } from "../../domain/services/llm-classifier.service";

export interface QualityGateResult {
  ok: boolean;
  reason?: string;
}

const BANNED_ABSTRACT_OPTIONS = [
  "홈팀 승리",
  "원정팀 승리",
  "홈팀",
  "원정팀",
  "메이저 걸그룹",
  "보이그룹",
  "국내 대작",
  "외화 블록버스터",
  "대형 기획사",
  "중소 기획사",
  "상위 시드팀",
  "하위 시드팀",
  "주요 빅매치",
  "해당 작품",
  "옵션 1",
  "옵션 2",
  "기타",
];

const BANNED_VAGUE_TITLE_PHRASES = [
  "주요 맞대결",
  "예상 아티스트 군",
  "배급사·작품군",
  "작품군은?",
  "품목군은?",
  "아티스트 군은?",
  "진영은?",
  "주요 투자 자산군",
  "빅매치 양팀",
  "예능 시청률 1위는?",
  "시청률 1위 방송사는?",
];

const DOMAIN_CROSSCHECK_RULES: Array<{
  name: string;
  sourceRegex: RegExp;
  forbiddenTitleRegex: RegExp;
}> = [
  {
    name: "crypto-vs-sports-entertainment",
    sourceRegex: /비트코인|BTC|이더리움|ETH|리플|솔라나|암호화폐|가상자산/i,
    forbiddenTitleRegex: /해외축구|프리미어리그|박스오피스|멜론|써클|예능|국회\s*본회의/i,
  },
  {
    name: "fx-rate-vs-unrelated",
    sourceRegex: /원\/달러|USD\/KRW|달러\s*환율|외환시장/i,
    forbiddenTitleRegex: /해외축구|박스오피스|멜론|써클|예능\s*시청률|비트코인/i,
  },
  {
    name: "sports-vs-finance",
    sourceRegex: /프리미어리그|챔피언스리그|분데스리가|라리가|K리그|KBO|LCK|축구/i,
    forbiddenTitleRegex: /기준금리|소비자물가|원\/달러|비트코인|이더리움|박스오피스/i,
  },
  {
    name: "politics-vs-entertainment",
    sourceRegex: /국회|법안|의원|본회의|위원회|개정안/i,
    forbiddenTitleRegex: /해외축구|프리미어리그|박스오피스|멜론|차트\s*1위|비트코인/i,
  },
];

const CROSS_LINGUAL_SYNONYMS: Array<[RegExp, RegExp]> = [
  [/\bbitcoin\b|\bbtc\b/i, /비트코인|BTC/i],
  [/\bethereum\b|\beth\b/i, /이더리움|ETH/i],
  [/\busd\/krw\b|\bexchange rate\b/i, /원\/달러|환율|달러/i],
  [/\bnasdaq\b|\bqqq\b/i, /나스닥|미국\s*증시/i],
  [/\bsamsung\b/i, /삼성/i],
  [/\bhyundai\b/i, /현대/i],
  [/\bpremier league\b|\bepl\b/i, /프리미어리그|EPL|잉글랜드/i],
  [/\bchampions league\b|\bucl\b/i, /챔피언스리그|UCL/i],
  [/\barsenal\b/i, /아스널/i],
  [/\bchelsea\b/i, /첼시/i],
  [/\bliverpool\b/i, /리버풀/i],
  [/\bmanchester city\b/i, /맨체스터\s*시티|맨시티/i],
  [/\breal madrid\b/i, /레알\s*마드리드/i],
  [/\bbayern\b/i, /바이에른|뮌헨/i],
  [/\bfed\b|\bfomc\b|\binterest rate\b/i, /연준|FOMC|기준금리|금리/i],
];

const STOPWORDS = new Set([
  "오늘", "내일", "이번", "금주", "다음", "최근", "관련", "대한", "통해",
  "예상", "전망", "기준", "결과", "여부", "돌파", "상승", "하락", "기록",
  "발표", "시장", "국내", "한국", "글로벌", "the", "and", "for", "with",
  "will", "that", "this", "from",
]);

function extractKeyTokens(text: string): string[] {
  const matches = text.match(/[가-힣]{2,}|[A-Za-z0-9]{2,}/g) ?? [];
  const unique = new Set<string>();
  for (const token of matches) {
    const normalized = token.toLowerCase();
    if (!STOPWORDS.has(normalized) && !/^\d+$/.test(normalized)) {
      unique.add(normalized);
    }
  }
  return Array.from(unique);
}

function validateTitleAndSummary(title: string, summary: string): QualityGateResult | null {
  if (title.length < 10 || title.length > 180) {
    return { ok: false, reason: `Invalid title length (${title.length})` };
  }
  const vagueMatch = BANNED_VAGUE_TITLE_PHRASES.find((phrase) => title.includes(phrase));
  if (vagueMatch) {
    return { ok: false, reason: `Vague template phrase in title: ${vagueMatch}` };
  }
  if (summary.length < 30) {
    return { ok: false, reason: `Summary too short (${summary.length} chars)` };
  }
  return null;
}

function validatePredictionOptions(
  predictionType: string | undefined,
  rawOptions: unknown[] | undefined,
  resolutionCriteria: string | undefined
): QualityGateResult | null {
  const options = Array.isArray(rawOptions)
    ? rawOptions.map((o) => String(o).trim()).filter(Boolean)
    : [];

  if (options.length < 2 || options.length > 8) {
    return { ok: false, reason: `Invalid options count (${options.length})` };
  }
  if (predictionType === "BINARY" && options.length !== 2) {
    return { ok: false, reason: `BINARY game must have exactly 2 options (got ${options.length})` };
  }
  if (new Set(options).size !== options.length) {
    return { ok: false, reason: "Duplicate options detected" };
  }
  for (const opt of options) {
    if (opt.length > 50) {
      return { ok: false, reason: `Option too long: ${opt.slice(0, 20)}...` };
    }
    const banned = BANNED_ABSTRACT_OPTIONS.find(
      (b) => opt === b || opt.includes(`${b} (`)
    );
    if (banned) {
      return { ok: false, reason: `Abstract placeholder option rejected: ${opt}` };
    }
  }
  if ((resolutionCriteria ?? "").trim().length < 8) {
    return { ok: false, reason: "resolutionCriteria too short or missing" };
  }
  return null;
}

function validateTopicAlignment(
  sourceContent: string,
  title: string,
  summary: string,
  options: string[]
): QualityGateResult | null {
  const mismatch = DOMAIN_CROSSCHECK_RULES.find(
    (rule) => rule.sourceRegex.test(sourceContent) && rule.forbiddenTitleRegex.test(title)
  );
  if (mismatch) {
    return { ok: false, reason: `Domain mismatch detected (${mismatch.name})` };
  }

  const sourceTokens = extractKeyTokens(sourceContent);
  if (sourceTokens.length < 2) return null;

  const draftCombined = `${title} ${summary} ${options.join(" ")}`.toLowerCase();
  const hasDirectOverlap = sourceTokens.some(
    (token) =>
      draftCombined.includes(token) ||
      (token.length >= 3 && draftCombined.includes(token.slice(0, 3)))
  );
  if (hasDirectOverlap) return null;

  const hasSynonymOverlap = CROSS_LINGUAL_SYNONYMS.some(
    ([srcRe, dstRe]) => srcRe.test(sourceContent) && dstRe.test(`${title} ${summary}`)
  );
  if (!hasSynonymOverlap) {
    return { ok: false, reason: "Draft lacks keyword alignment with source content" };
  }
  return null;
}

/**
 * 생성된 예측 게임 초안의 품질·구체성·원문 일관성 검증 게이트
 */
export function validateGeneratedDraft(
  sourceContent: string,
  draft: DraftResult
): QualityGateResult {
  if (!draft || typeof draft !== "object") {
    return { ok: false, reason: "Draft object is missing" };
  }

  const title = (draft.title ?? "").trim();
  const summary = (draft.summary ?? "").trim();
  const pred = draft.predictionDraft;

  const headerErr = validateTitleAndSummary(title, summary);
  if (headerErr) return headerErr;
  if (!pred) return { ok: false, reason: "predictionDraft section is missing" };

  const optionsErr = validatePredictionOptions(
    pred.predictionType,
    pred.options,
    pred.resolutionCriteria
  );
  if (optionsErr) return optionsErr;

  const options = pred.options.map((o) => String(o).trim()).filter(Boolean);
  const alignErr = validateTopicAlignment(sourceContent, title, summary, options);
  if (alignErr) return alignErr;

  return { ok: true };
}
