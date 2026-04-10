import type { Plugin } from "@opencode-ai/plugin";
import { createObservabilityHooks, computeSessionSummary } from "./observability";
import { createSafetyHooks, checkPendingProposals } from "./safety-guard";
import { createRollbackTool, checkAutoRollback, getCurrentGeneration } from "./rollback";
import * as path from "path";
import * as fs from "fs";

// Resolve AGENTS_DIR — the root of the agents repo
const AGENTS_DIR =
  process.env.AGENTS_DIR ||
  path.join(process.env.HOME || process.env.USERPROFILE || "~", "Documents", "GitHub", "agents");

const WORKSPACE = path.join(AGENTS_DIR, "_workspace");
const METRICS_DIR = path.join(WORKSPACE, "_metrics");
const EVOLUTION_LOG = path.join(WORKSPACE, "_evolution_log.jsonl");

const EvolutionEngine: Plugin = (input) => {
  const { directory } = input;

  // Ensure workspace directories exist
  for (const dir of [
    METRICS_DIR,
    path.join(WORKSPACE, "_evolution_staged"),
    path.join(WORKSPACE, "_deprecated_skills"),
    path.join(WORKSPACE, "_skill_audit"),
  ]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Get hooks from each module
  const observabilityHooks = createObservabilityHooks(AGENTS_DIR, WORKSPACE);
  const safetyHooks = createSafetyHooks(AGENTS_DIR, WORKSPACE);
  const rollbackTool = createRollbackTool(AGENTS_DIR);

  return {
    tool: [rollbackTool],

    "tool.execute.before": async (params) => {
      // Safety guard intercepts writes
      if (safetyHooks["tool.execute.before"]) {
        return safetyHooks["tool.execute.before"](params);
      }
    },

    "tool.execute.after": async (params) => {
      // Observability records metrics
      if (observabilityHooks["tool.execute.after"]) {
        observabilityHooks["tool.execute.after"](params);
      }
    },

    "chat.message": async (params) => {
      // Observability tracks conversation signals
      if (observabilityHooks["chat.message"]) {
        observabilityHooks["chat.message"](params);
      }
    },

    event: async (params) => {
      // Session lifecycle events
      if (observabilityHooks["event"]) {
        observabilityHooks["event"](params);
      }

      // On session end: compute summary + check auto-rollback
      if (params?.type === "session_end") {
        try {
          computeSessionSummary(AGENTS_DIR, WORKSPACE);

          const summaryPath = path.join(METRICS_DIR, "summary.jsonl");
          const rollbackCheck = checkAutoRollback(summaryPath);
          if (rollbackCheck.shouldRollback) {
            console.warn(
              `[evolution-engine] Auto-rollback triggered: ${rollbackCheck.reason}. ` +
                `Rolling back to gen-${rollbackCheck.targetGeneration}.`
            );
            const { rollbackToGeneration } = require("./rollback");
            rollbackToGeneration(AGENTS_DIR, rollbackCheck.targetGeneration);
          }
        } catch (err) {
          console.error("[evolution-engine] Error in session-end processing:", err);
        }
      }

      // On session start: check for pending proposals
      if (params?.type === "session_start") {
        try {
          const pending = checkPendingProposals(WORKSPACE);
          if (pending.length > 0) {
            console.log(
              `[evolution-engine] ${pending.length} pending evolution proposal(s) awaiting review.`
            );
          }
        } catch (err) {
          // Non-fatal — don't block session start
        }
      }
    },
  };
};

export default EvolutionEngine;
