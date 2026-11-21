// PosMul 안전 가드 훅 (PreToolUse: run_command)
// - 파괴적이거나 프로젝트 절대 금지 원칙에 위배되는 셸 명령만 선별 차단합니다.
// - JSON 파싱 실패 등 예기치 않은 오류 시에는 에이전트 마비를 막기 위해 Fail-Open(allow)으로 동작합니다.

function allow() {
  process.stdout.write(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(JSON.stringify({ decision: "deny", reason }));
  process.exit(0);
}

let rawInput = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  rawInput += chunk;
});

process.stdin.on("end", () => {
  try {
    if (!rawInput || !rawInput.trim()) {
      return allow();
    }

    const payload = JSON.parse(rawInput);
    const cmd = String(
      payload?.toolCall?.args?.CommandLine ??
        payload?.toolCall?.args?.commandLine ??
        payload?.toolCall?.args?.command ??
        ""
    ).trim();

    if (!cmd) {
      return allow();
    }

    // 1. main 브랜치 직접 작업/푸시 차단
    if (
      /\bgit\s+(checkout|switch)\s+main(\s|$|;|&|\|)/i.test(cmd) ||
      /\bgit\s+push\b[^\r\n;&|]*\bmain(\s|$|;|&|\|)/i.test(cmd)
    ) {
      return deny(
        "[Safety Hook 차단] main 브랜치 직접 작업/푸시는 금지되어 있습니다. develop 브랜치를 사용하고 main 병합은 사용자가 직접 수행합니다."
      );
    }

    // 2. 전체 스테이징(git add -A / --all / git add .) 차단
    if (/\bgit\s+add\s+(-A|--all|\.(?:\s|$|;|&|\|))/i.test(cmd)) {
      return deny(
        "[Safety Hook 차단] git add -A / git add . 전체 스테이징은 금지되어 있습니다. 수정한 파일 경로만 명시해 커밋하거나 scripts/ship.ps1 -Files 를 사용하세요."
      );
    }

    // 3. 파괴적 Git 명령 차단
    if (
      /\bgit\s+reset\s+--hard\b/i.test(cmd) ||
      /\bgit\s+push\b[^\r\n;&|]*(\s--force(\s|$)|\s-f(\s|$))/i.test(cmd)
    ) {
      return deny(
        "[Safety Hook 차단] 파괴적 Git 명령(reset --hard / push --force)이 차단되었습니다. 필요 시 사용자에게 직접 확인을 받으세요."
      );
    }

    // 4. 금지된 패키지 매니저(npm/yarn) 및 Supabase CLI DB 조작 차단
    if (
      /(?:^|[;&|]\s*)(npm|yarn)\s+(install|i|add|run|test|build)\b/i.test(cmd) ||
      /\bsupabase\s+db\s+(push|reset)\b/i.test(cmd)
    ) {
      return deny(
        "[Safety Hook 차단] PosMul 모노레포는 pnpm/turbo 전용이며, DB 변경은 Supabase CLI 대신 Supabase MCP(apply_migration)만 사용합니다."
      );
    }

    return allow();
  } catch {
    return allow();
  }
});

process.stdin.on("error", () => {
  allow();
});
