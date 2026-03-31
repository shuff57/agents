#!/usr/bin/env node
/**
 * Plan mode auto-prompt hook
 * When the user enters plan mode (EnterPlanMode tool), suggest ultrawork or deep-interview.
 */
const input = JSON.parse(require("fs").readFileSync("/dev/stdin", "utf8"));
const toolName = input.tool_name || "";

if (toolName === "EnterPlanMode") {
  // Surface available planning workflows
  process.stdout.write(JSON.stringify({
    decision: "allow",
    reason: [
      "📋 Plan mode activated. Available workflows:",
      "  /ultrawork <task>        — 5-phase autonomous: explore→plan→decide→execute→verify",
      "  /deep-interview <task>   — Socratic requirements clarification, then build",
      "  /gsd:quick <task>        — GSD quick mode with atomic commits",
      "  /gsd:new-project         — Full GSD project planning",
      "",
      "Or continue planning manually."
    ].join("\n")
  }));
} else {
  process.stdout.write(JSON.stringify({ decision: "allow" }));
}
