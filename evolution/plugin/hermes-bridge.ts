/**
 * hermes-bridge.ts
 * Wraps Hermes Agent CLI for memory operations.
 * Exports tool definitions to register as custom OpenCode tools.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const AGENTS_DIR =
  process.env.AGENTS_DIR ?? path.join(os.homedir(), "Documents", "GitHub", "agents");

const MEMORY_DIR = path.join(AGENTS_DIR, "_workspace", "_memory");
const FALLBACK_FILE = path.join(MEMORY_DIR, "fallback.jsonl");
const MIGRATED_MARKER = path.join(MEMORY_DIR, ".migrated");
const HIVEMIND_FILE = path.join(AGENTS_DIR, "memory", "hivemind", "memories.jsonl");

const HERMES_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolParameter {
  type: string;
  description?: string;
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>) => unknown;
}

interface FallbackEntry {
  content: string;
  tags: string;
  project: string;
  ts: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function appendJsonl(filePath: string, record: Record<string, unknown>): void {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8");
}

function isHermesAvailable(): boolean {
  try {
    execSync("hermes --version", {
      stdio: "ignore",
      timeout: 3_000,
    });
    return true;
  } catch {
    return false;
  }
}

function runHermes(args: string): string {
  const output = execSync(`hermes ${args}`, {
    timeout: HERMES_TIMEOUT_MS,
    encoding: "utf8",
  });
  return output.trim();
}

// ---------------------------------------------------------------------------
// harness_memory_save
// ---------------------------------------------------------------------------

function memorySave(args: Record<string, unknown>): unknown {
  const content = String(args.content ?? "");
  const tags = String(args.tags ?? "");
  const project = String(args.project ?? "");

  if (isHermesAvailable()) {
    try {
      const tagFlag = tags ? ` --tags "${tags.replace(/"/g, '\\"')}"` : "";
      const projectFlag = project ? ` --project "${project.replace(/"/g, '\\"')}"` : "";
      const cmd = `memory add --content "${content.replace(/"/g, '\\"')}"${tagFlag}${projectFlag} --format json`;
      const output = runHermes(cmd);
      try {
        return JSON.parse(output);
      } catch {
        return { success: true, raw: output };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[hermes-bridge] hermes CLI error, falling back to file: ${message}`);
    }
  }

  // Fallback: append to JSONL
  const entry: FallbackEntry = {
    content,
    tags,
    project,
    ts: new Date().toISOString(),
  };
  appendJsonl(FALLBACK_FILE, entry as unknown as Record<string, unknown>);
  return { success: true, fallback: true, file: FALLBACK_FILE };
}

// ---------------------------------------------------------------------------
// harness_memory_recall
// ---------------------------------------------------------------------------

function memoryRecall(args: Record<string, unknown>): unknown {
  const query = String(args.query ?? "");
  const limit = Number(args.limit ?? 10);

  if (isHermesAvailable()) {
    try {
      const cmd = `memory search --query "${query.replace(/"/g, '\\"')}" --limit ${limit} --format json`;
      const output = runHermes(cmd);
      try {
        return JSON.parse(output);
      } catch {
        return { results: [], raw: output };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[hermes-bridge] hermes CLI error, falling back to file grep: ${message}`);
    }
  }

  // Fallback: grep over fallback JSONL
  if (!fs.existsSync(FALLBACK_FILE)) {
    return { results: [], fallback: true };
  }

  const lines = fs.readFileSync(FALLBACK_FILE, "utf8").split("\n").filter(Boolean);
  const lowerQuery = query.toLowerCase();
  const matches: FallbackEntry[] = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as FallbackEntry;
      if (
        entry.content?.toLowerCase().includes(lowerQuery) ||
        entry.tags?.toLowerCase().includes(lowerQuery) ||
        entry.project?.toLowerCase().includes(lowerQuery)
      ) {
        matches.push(entry);
        if (matches.length >= limit) break;
      }
    } catch {
      // skip malformed lines
    }
  }

  return { results: matches, fallback: true };
}

// ---------------------------------------------------------------------------
// migrate_hivemind
// ---------------------------------------------------------------------------

export function migrateHivemind(): void {
  if (fs.existsSync(MIGRATED_MARKER)) {
    console.log("[hermes-bridge] Hivemind migration already completed. Skipping.");
    return;
  }

  if (!fs.existsSync(HIVEMIND_FILE)) {
    console.warn(`[hermes-bridge] Hivemind file not found at ${HIVEMIND_FILE}. Skipping migration.`);
    return;
  }

  const lines = fs.readFileSync(HIVEMIND_FILE, "utf8").split("\n").filter(Boolean);
  let migratedCount = 0;
  let errorCount = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as Record<string, unknown>;
      const content = String(entry.content ?? JSON.stringify(entry));
      const tags = Array.isArray(entry.tags)
        ? (entry.tags as string[]).join(",")
        : String(entry.tags ?? "hivemind-migration");
      const project = String(entry.project ?? "hivemind");

      memorySave({ content, tags, project });
      migratedCount++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[hermes-bridge] Failed to migrate entry: ${message}`);
      errorCount++;
    }
  }

  // Write marker so migration is idempotent
  ensureDir(MEMORY_DIR);
  fs.writeFileSync(
    MIGRATED_MARKER,
    JSON.stringify({
      migrated_at: new Date().toISOString(),
      count: migratedCount,
      errors: errorCount,
      source: HIVEMIND_FILE,
    }),
    "utf8"
  );

  console.log(
    `[hermes-bridge] Hivemind migration complete. Migrated: ${migratedCount}, Errors: ${errorCount}`
  );
}

// ---------------------------------------------------------------------------
// Exported tool definitions
// ---------------------------------------------------------------------------

export const hermesTools: ToolDefinition[] = [
  {
    name: "harness_memory_save",
    description:
      "Save a memory entry via Hermes Agent CLI. Falls back to local JSONL if Hermes is not installed.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The content to save to memory.",
        },
        tags: {
          type: "string",
          description: "Comma-separated tags for the memory entry.",
          default: "",
        },
        project: {
          type: "string",
          description: "Project name to associate with this memory.",
          default: "",
        },
      },
      required: ["content"],
    },
    execute: memorySave,
  },
  {
    name: "harness_memory_recall",
    description:
      "Search memory entries via Hermes Agent CLI. Falls back to file-based search if Hermes is not installed.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string.",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return.",
          default: 10,
        },
      },
      required: ["query"],
    },
    execute: memoryRecall,
  },
];
