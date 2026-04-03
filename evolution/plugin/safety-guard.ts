import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as child_process from "child_process";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve("/c/Users/shuff57/Documents/GitHub/agent-evo");
const STAGED_DIR = path.join(REPO_ROOT, "_workspace/_evolution_staged");
const CHECKSUMS_PATH = path.join(
  REPO_ROOT,
  "evolution/config/safety-checksums.json"
);
const PINS_PATH = path.join(REPO_ROOT, "evolution/config/agent-pins.json");
const TEST_SCRIPT = path.join(
  process.env.HOME || "/c/Users/shuff57",
  "Documents/GitHub/agent-evo/test.sh"
);

// ---------------------------------------------------------------------------
// Tier classification
// ---------------------------------------------------------------------------

type Tier = 1 | 1.25 | 1.5 | 2 | 3;

const TIER3_PATTERNS: RegExp[] = [
  /^evolution\/plugin\//,
  /^evolution\/config\/safety-checksums\.json$/,
  /^roster\/evolver\.md$/,
  /^opencode\.json$/,
];

const TIER2_PATTERNS: RegExp[] = [/^roster\/[^/]+\.md$/];

const TIER1_25_PATTERNS: RegExp[] = [/^agent-chain\.yaml$/];

const TIER1_5_PATTERNS: RegExp[] = [
  /^skills\/[^/]+\/_?new/,
  /^skills\/_deprecated\//,
  /^skills\/_imported\//,
];

const TIER1_PATTERNS: RegExp[] = [
  /^skills\/[^/]+\/SKILL\.md$/,
  /^teams\.yaml$/,
  /^oh-my-opencode\.json$/,
  /^model-pricing\.json$/,
];

function classifyPath(filePath: string): Tier {
  const rel = toRelative(filePath);

  for (const p of TIER3_PATTERNS) {
    if (p.test(rel)) return 3;
  }
  for (const p of TIER2_PATTERNS) {
    if (p.test(rel)) return 2;
  }
  for (const p of TIER1_5_PATTERNS) {
    if (p.test(rel)) return 1.5;
  }
  for (const p of TIER1_25_PATTERNS) {
    if (p.test(rel)) return 1.25;
  }
  for (const p of TIER1_PATTERNS) {
    if (p.test(rel)) return 1;
  }

  // Default: treat unrecognised paths as tier-1 (open)
  return 1;
}

function toRelative(filePath: string): string {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(REPO_ROOT, filePath);
  return path.relative(REPO_ROOT, abs).replace(/\\/g, "/");
}

// ---------------------------------------------------------------------------
// Mutation counters (per-session, module-scoped)
// ---------------------------------------------------------------------------

interface MutationCounters {
  agent_mutations: number;
  skill_mutations: number;
}

const counters: MutationCounters = {
  agent_mutations: 0,
  skill_mutations: 0,
};

const MAX_AGENT_MUTATIONS = 3;
const MAX_SKILL_MUTATIONS = 2;

function resetCounters(): void {
  counters.agent_mutations = 0;
  counters.skill_mutations = 0;
}

// ---------------------------------------------------------------------------
// Checksum verification
// ---------------------------------------------------------------------------

function sha256File(filePath: string): string {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(REPO_ROOT, filePath);
  if (!fs.existsSync(abs)) return "";
  const content = fs.readFileSync(abs);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function verifyTier3Checksums(): { valid: boolean; violations: string[] } {
  if (!fs.existsSync(CHECKSUMS_PATH)) {
    // No checksum file yet — treat as valid on first run
    return { valid: true, violations: [] };
  }

  const stored: Record<string, string> = JSON.parse(
    fs.readFileSync(CHECKSUMS_PATH, "utf8")
  );
  const violations: string[] = [];

  for (const [rel, expected] of Object.entries(stored)) {
    const actual = sha256File(path.join(REPO_ROOT, rel));
    if (actual !== expected) {
      violations.push(rel);
    }
  }

  return { valid: violations.length === 0, violations };
}

// ---------------------------------------------------------------------------
// Pin check
// ---------------------------------------------------------------------------

function isPinned(filePath: string): boolean {
  if (!fs.existsSync(PINS_PATH)) return false;
  const pins: string[] = JSON.parse(fs.readFileSync(PINS_PATH, "utf8"));
  const rel = toRelative(filePath);
  // Match by agent/skill name extracted from path
  const name = path.basename(filePath, path.extname(filePath));
  return pins.includes(name) || pins.includes(rel);
}

// ---------------------------------------------------------------------------
// Atomic write helpers
// ---------------------------------------------------------------------------

function atomicWrite(targetPath: string, content: string): void {
  const tmpPath = targetPath + ".tmp";
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(tmpPath, content, "utf8");
  fs.renameSync(tmpPath, targetPath);
}

function restoreFromTmp(targetPath: string): void {
  const tmpPath = targetPath + ".tmp";
  if (fs.existsSync(tmpPath)) {
    fs.renameSync(tmpPath, targetPath);
  }
}

// ---------------------------------------------------------------------------
// Post-mutation test gate
// ---------------------------------------------------------------------------

function runPostMutationTests(targetPath: string): {
  passed: boolean;
  error?: string;
} {
  try {
    child_process.execSync(`bash "${TEST_SCRIPT}"`, {
      stdio: "pipe",
      cwd: REPO_ROOT,
    });
    return { passed: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[safety-guard] test.sh failed: ${msg}`);
    restoreFromTmp(targetPath);
    return { passed: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Stage proposal
// ---------------------------------------------------------------------------

function stageProposal(
  targetPath: string,
  content: string,
  action: string
): string {
  fs.mkdirSync(STAGED_DIR, { recursive: true });
  const name = path.basename(targetPath);
  const timestamp = Date.now();
  const stagedPath = path.join(STAGED_DIR, `${timestamp}-${action}-${name}`);
  const proposal = {
    action,
    targetPath,
    content,
    stagedAt: new Date().toISOString(),
    summary: `Proposed ${action} of ${toRelative(targetPath)}`,
  };
  fs.writeFileSync(stagedPath, JSON.stringify(proposal, null, 2), "utf8");
  return stagedPath;
}

// ---------------------------------------------------------------------------
// Pending proposals
// ---------------------------------------------------------------------------

export interface PendingProposal {
  action: string;
  name: string;
  filepath: string;
  summary: string;
}

export function checkPendingProposals(): PendingProposal[] {
  if (!fs.existsSync(STAGED_DIR)) return [];

  const files = fs.readdirSync(STAGED_DIR).filter((f) => f.endsWith(".json") || !f.includes("."));
  const proposals: PendingProposal[] = [];

  for (const file of files) {
    const fullPath = path.join(STAGED_DIR, file);
    try {
      const raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      proposals.push({
        action: raw.action ?? "unknown",
        name: path.basename(raw.targetPath ?? file),
        filepath: fullPath,
        summary: raw.summary ?? `Staged proposal: ${file}`,
      });
    } catch {
      // Skip malformed proposal files
      proposals.push({
        action: "unknown",
        name: file,
        filepath: fullPath,
        summary: `Malformed proposal file: ${file}`,
      });
    }
  }

  return proposals;
}

// ---------------------------------------------------------------------------
// Hook factory
// ---------------------------------------------------------------------------

export function createSafetyGuardHooks() {
  // Reset counters at plugin load (session start)
  resetCounters();

  return {
    "tool.execute.before": async (ctx: {
      tool: string;
      params: Record<string, unknown>;
      caller?: { agentName?: string };
    }) => {
      const isWriteTool =
        ctx.tool === "write" ||
        ctx.tool === "edit" ||
        ctx.tool === "bash" ||
        ctx.tool.includes("write") ||
        ctx.tool.includes("edit");

      if (!isWriteTool) return; // Not a write — pass through

      const targetPath =
        (ctx.params.path as string) ||
        (ctx.params.file_path as string) ||
        (ctx.params.target as string) ||
        "";

      if (!targetPath) return; // Can't classify — pass through

      const tier = classifyPath(targetPath);
      const rel = toRelative(targetPath);

      // ----- Tier 3: always block -----
      if (tier === 3) {
        console.error(
          `[safety-guard] BLOCKED tier-3 write attempt to: ${rel} by ${ctx.caller?.agentName ?? "unknown"}`
        );
        throw new Error(
          `[safety-guard] BLOCKED: ${rel} is a locked tier-3 file and cannot be modified.`
        );
      }

      // ----- Verify tier-3 checksums before any mutation -----
      const checksumResult = verifyTier3Checksums();
      if (!checksumResult.valid) {
        console.error(
          `[safety-guard] CHECKSUM MISMATCH detected — all mutations blocked. Violations: ${checksumResult.violations.join(", ")}`
        );
        throw new Error(
          `[safety-guard] BLOCKED: Tier-3 file integrity violation detected. Mutations suspended. Files affected: ${checksumResult.violations.join(", ")}`
        );
      }

      // ----- Tier 2: evolver-only, pin check, mutation limit -----
      if (tier === 2) {
        const callerName = ctx.caller?.agentName ?? "";
        if (callerName !== "evolver") {
          throw new Error(
            `[safety-guard] BLOCKED: Only the evolver agent may modify tier-2 file ${rel}. Caller: ${callerName || "unknown"}.`
          );
        }

        if (isPinned(targetPath)) {
          throw new Error(
            `[safety-guard] BLOCKED: ${rel} is pinned and cannot be mutated this session.`
          );
        }

        if (counters.agent_mutations >= MAX_AGENT_MUTATIONS) {
          throw new Error(
            `[safety-guard] BLOCKED: Maximum agent mutations (${MAX_AGENT_MUTATIONS}) reached for this session.`
          );
        }

        counters.agent_mutations++;
        const content =
          (ctx.params.content as string) ||
          (ctx.params.new_string as string) ||
          "";
        const absTarget = path.isAbsolute(targetPath)
          ? targetPath
          : path.join(REPO_ROOT, targetPath);
        atomicWrite(absTarget, content);
        const testResult = runPostMutationTests(absTarget);
        if (!testResult.passed) {
          counters.agent_mutations--; // Rollback counter
          throw new Error(
            `[safety-guard] ROLLED BACK: test.sh failed after mutation to ${rel}. ${testResult.error}`
          );
        }
        return { intercept: true };
      }

      // ----- Tier 1.25 / 1.5: stage for human approval -----
      if (tier === 1.25 || tier === 1.5) {
        const content =
          (ctx.params.content as string) ||
          (ctx.params.new_string as string) ||
          "";
        const action = tier === 1.25 ? "chain-gated" : "skill-gated";
        const stagedPath = stageProposal(targetPath, content, action);
        console.info(
          `[safety-guard] Staged ${action} proposal for human approval: ${stagedPath}`
        );
        throw new Error(
          `[safety-guard] STAGED: ${rel} requires human approval (${action}). Proposal saved to: ${stagedPath}`
        );
      }

      // ----- Tier 1: allow, track skill mutations -----
      if (tier === 1) {
        if (counters.skill_mutations >= MAX_SKILL_MUTATIONS) {
          throw new Error(
            `[safety-guard] BLOCKED: Maximum skill mutations (${MAX_SKILL_MUTATIONS}) reached for this session.`
          );
        }
        counters.skill_mutations++;
        // Allow write to proceed normally — no interception
      }
    },
  };
}

export default createSafetyGuardHooks;
