"use client";

import React from "react";

interface TheoryMarkdownProps {
  markdown: string;
}

/**
 * 인라인 마크다운(**강조**, `코드`, 간단한 $수식$)을 React 노드로 변환합니다.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g);
  return tokens.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-amber-200">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-white/[0.08] text-sky-300 font-mono text-[0.9em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const cleaned = part
        .slice(1, -1)
        .replace(/\\;/g, " ")
        .replace(/\\sim/g, "~")
        .replace(/_\{?([0-9]+)\}?/g, "$1");
      return (
        <span key={key} className="font-mono text-emerald-300 font-medium">
          {cleaned}
        </span>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|") || !trimmed.includes("-")) return false;
  const cells = splitTableRow(trimmed);
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

export function TheoryMarkdown({ markdown }: TheoryMarkdownProps) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. GFM Table
    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const headers = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push(
        <div
          key={`tbl-${i}`}
          className="my-3 overflow-x-auto rounded-xl border border-white/[0.1] bg-[#0B0B10]"
        >
          <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
            <thead>
              <tr className="bg-white/[0.06] border-b border-white/[0.1]">
                {headers.map((h, hIdx) => (
                  <th
                    key={hIdx}
                    className="px-3 py-2 font-semibold text-zinc-200 whitespace-nowrap"
                  >
                    {renderInline(h, `th-${i}-${hIdx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02]">
                  {headers.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3 py-2 text-zinc-300 align-top leading-relaxed"
                    >
                      {renderInline(row[cIdx] ?? "", `td-${i}-${rIdx}-${cIdx}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 2. Callout / Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const joined = quoteLines.join(" ");
      const isTrap = joined.includes("함정") || joined.includes("⚠️");
      blocks.push(
        <div
          key={`bq-${i}`}
          className={`my-3 rounded-xl border px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
            isTrap
              ? "border-amber-500/35 bg-amber-500/10 text-amber-100"
              : "border-sky-500/30 bg-sky-500/10 text-sky-100"
          }`}
        >
          {renderInline(joined, `bq-${i}`)}
        </div>
      );
      continue;
    }

    // 3. Headings (### / ####)
    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h4
          key={`h3-${i}`}
          className="mt-4 mb-1.5 text-sm font-bold text-zinc-100 tracking-tight"
        >
          {renderInline(trimmed.slice(4), `h3-${i}`)}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("#### ")) {
      blocks.push(
        <h5
          key={`h4-${i}`}
          className="mt-3 mb-1 text-xs font-semibold text-zinc-200 uppercase tracking-wider"
        >
          {renderInline(trimmed.slice(5), `h4-${i}`)}
        </h5>
      );
      i++;
      continue;
    }

    // 4. Lists (- / * / 1.)
    if (/^(\s*)([-*]|\d+\.)\s+/.test(line)) {
      const listItems: Array<{ ordered: boolean; indent: boolean; num?: string; content: string }> = [];
      while (i < lines.length && /^(\s*)([-*]|\d+\.)\s+/.test(lines[i])) {
        const curLine = lines[i];
        const m = curLine.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (m) {
          listItems.push({
            indent: m[1].length >= 2,
            ordered: /^\d+\./.test(m[2]),
            num: m[2],
            content: m[3],
          });
        }
        i++;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2">
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2 text-xs sm:text-[13.5px] leading-relaxed text-zinc-200 ${
                item.indent ? "pl-5 text-zinc-300" : ""
              }`}
            >
              <span className="shrink-0 mt-0.5 text-indigo-400 font-semibold select-none">
                {item.ordered ? item.num : item.indent ? "◦" : "•"}
              </span>
              <span className="min-w-0 flex-1">
                {renderInline(item.content, `li-${i}-${idx}`)}
              </span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 5. Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].trim().startsWith("###") &&
      !/^(\s*)([-*]|\d+\.)\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(
        <p
          key={`p-${i}`}
          className="text-xs sm:text-[13.5px] leading-relaxed text-zinc-200 my-2"
        >
          {renderInline(paraLines.join(" "), `p-${i}`)}
        </p>
      );
    }
  }

  return <div className="space-y-1">{blocks}</div>;
}
