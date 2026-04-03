import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve("/c/Users/shuff57/Documents/GitHub/agent-evo");
const ROSTER_DIR = path.join(REPO_ROOT, "roster");
const BACKUPS_DIR = path.join(REPO_ROOT, "evolution/backups");
const EVOLUTION_LOG = path.join(REPO_ROOT, "_workspace/_evolution_log.jsonl");
const METRICS_SUMMARY = path.join(
  REPO_ROOT,
  "_workspace/_metrics/summary.jsonl"
);
const MAX_BACKUPS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src: string, dest: string): void {
  ensureDir(dest);
  if (!fs.existsSync(src)) return;
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFile(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function readLastNLines(filePath: string, n: number): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines.slice(-n);
}

function log(message: string): void {
  const entry =
    JSON.stringify({ timestamp: new Date().toISOString(), message }) + "\n";
  const logPath = path.join(REPO_ROOT, "_workspace/_rollback_log.jsonl");
  ensureDir(path.dirname(logPath));
  fs.appendFileSync(logPath, entry, "utf8");
  console.info(`[rollback] ${message}`);
}

// ---------------------------------------------------------------------------
// createSnapshot
// ---------------------------------------------------------------------------

export function createSnapshot(generation: number): void {
  const backupDir = path.join(BACKUPS_DIR, `gen-${generation}`);
  ensureDir(backupDir);

  // Copy roster/*.md
  copyDir(ROSTER_DIR, backupDir);

  // Copy teams.yaml
  copyFile(
    path.join(REPO_ROOT, "teams.yaml"),
    path.join(backupDir, "teams.yaml")
  );

  // Copy agent-chain.yaml
  copyFile(
    path.join(REPO_ROOT, "agent-chain.yaml"),
    path.join(backupDir, "agent-chain.yaml")
  );

  log(`Snapshot created for generation ${generation} at ${backupDir}`);
}

// ---------------------------------------------------------------------------
// pruneBackups
// ---------------------------------------------------------------------------

export function pruneBackups(): void {
  if (!fs.existsSync(BACKUPS_DIR)) return;

  const dirs = fs
    .readdirSync(BACKUPS_DIR)
    .filter((d) => /^gen-\d+$/.test(d))
    .map((d) => ({ name: d, gen: parseInt(d.replace("gen-", ""), 10) }))
    .sort((a, b) => a.gen - b.gen);

  // Never delete gen-0
  const deleteable = dirs.filter((d) => d.gen !== 0);
  const toDelete = deleteable.slice(0, Math.max(0, dirs.length - MAX_BACKUPS));

  for (const entry of toDelete) {
    const dirPath = path.join(BACKUPS_DIR, entry.name);
    fs.rmSync(dirPath, { recursive: true, force: true });
    log(`Pruned backup: ${entry.name}`);
  }
}

// ---------------------------------------------------------------------------
// rollbackToGeneration
// ---------------------------------------------------------------------------

export function rollbackToGeneration(generation: number): void {
  const backupDir = path.join(BACKUPS_DIR, `gen-${generation}`);

  if (!fs.existsSync(backupDir)) {
    throw new Error(
      `[rollback] No backup found for generation ${generation} at ${backupDir}`
    );
  }

  ensureDir(ROSTER_DIR);

  // Restore all files from backup dir to roster/ and repo root
  for (const entry of fs.readdirSync(backupDir)) {
    const srcPath = path.join(backupDir, entry);
    if (!fs.statSync(srcPath).isFile()) continue;

    if (entry.endsWith(".md")) {
      fs.copyFileSync(srcPath, path.join(ROSTER_DIR, entry));
    } else if (entry === "teams.yaml" || entry === "agent-chain.yaml") {
      fs.copyFileSync(srcPath, path.join(REPO_ROOT, entry));
    }
  }

  log(`Rolled back to generation ${generation} from ${backupDir}`);
}

// ---------------------------------------------------------------------------
// rollbackToFactory
// ---------------------------------------------------------------------------

export function rollbackToFactory(): void {
  rollbackToGeneration(0);
}

// ---------------------------------------------------------------------------
// checkAutoRollback
// ---------------------------------------------------------------------------

export interface AutoRollbackResult {
  shouldRollback: boolean;
  reason: string;
  targetGeneration: number;
}

export function checkAutoRollback(summaryPath?: string): AutoRollbackResult {
  const filePath = summaryPath ?? METRICS_SUMMARY;
  const lines = readLastNLines(filePath, 6);

  if (lines.length < 2) {
    return {
      shouldRollback: false,
      reason: "Insufficient metrics data",
      targetGeneration: 0,
    };
  }

  interface SessionMetrics {
    completion_rate?: number;
    retry_rate?: number;
    generation?: number;
  }

  const sessions: SessionMetrics[] = lines
    .map((line) => {
      try {
        return JSON.parse(line) as SessionMetrics;
      } catch {
        return null;
      }
    })
    .filter((s): s is SessionMetrics => s !== null);

  if (sessions.length < 2) {
    return {
      shouldRollback: false,
      reason: "Could not parse metrics data",
      targetGeneration: 0,
    };
  }

  const current = sessions[sessions.length - 1];
  const history = sessions.slice(0, -1);

  const avgCompletion =
    history.reduce((sum, s) => sum + (s.completion_rate ?? 0), 0) /
    history.length;
  const avgRetry =
    history.reduce((sum, s) => sum + (s.retry_rate ?? 0), 0) / history.length;

  const currentCompletion = current.completion_rate ?? 0;
  const currentRetry = current.retry_rate ?? 0;

  const currentGen = getCurrentGeneration();
  const targetGeneration = Math.max(0, currentGen - 1);

  // completion_rate dropped >20%
  if (avgCompletion > 0 && currentCompletion < avgCompletion * 0.8) {
    return {
      shouldRollback: true,
      reason: `Completion rate dropped from avg ${(avgCompletion * 100).toFixed(1)}% to ${(currentCompletion * 100).toFixed(1)}% (>${20}% decline)`,
      targetGeneration,
    };
  }

  // retry_rate increased >30%
  if (avgRetry > 0 && currentRetry > avgRetry * 1.3) {
    return {
      shouldRollback: true,
      reason: `Retry rate increased from avg ${(avgRetry * 100).toFixed(1)}% to ${(currentRetry * 100).toFixed(1)}% (>${30}% increase)`,
      targetGeneration,
    };
  }

  return {
    shouldRollback: false,
    reason: "Metrics within acceptable bounds",
    targetGeneration: currentGen,
  };
}

// ---------------------------------------------------------------------------
// getCurrentGeneration
// ---------------------------------------------------------------------------

export function getCurrentGeneration(): number {
  if (!fs.existsSync(EVOLUTION_LOG)) return 0;

  const lines = readLastNLines(EVOLUTION_LOG, 200);
  let maxGen = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as { generation?: number };
      if (typeof entry.generation === "number" && entry.generation > maxGen) {
        maxGen = entry.generation;
      }
    } catch {
      // Skip unparseable lines
    }
  }

  return maxGen;
}

// ---------------------------------------------------------------------------
// harness_rollback tool definition
// ---------------------------------------------------------------------------

export const harnessRollbackTool = {
  name: "harness_rollback",
  description:
    "Roll back the agent roster to a previous generation snapshot. Use factory:true to restore the original gen-0 state.",
  parameters: {
    type: "object" as const,
    properties: {
      generation: {
        type: "number",
        description: "Target generation number to roll back to",
      },
      factory: {
        type: "boolean",
        description: "If true, roll back to factory defaults (generation 0)",
      },
    },
    required: [],
  },
  execute: async (params: {
    generation?: number;
    factory?: boolean;
  }): Promise<string> => {
    if (params.factory) {
      rollbackToFactory();
      return "Rolled back to factory defaults (generation 0).";
    }

    if (typeof params.generation === "number") {
      rollbackToGeneration(params.generation);
      return `Rolled back to generation ${params.generation}.`;
    }

    throw new Error(
      "harness_rollback requires either factory:true or a generation number."
    );
  },
};
