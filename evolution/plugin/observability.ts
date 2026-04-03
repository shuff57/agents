/**
 * observability.ts
 * Collects structured signals during OpenCode sessions using native plugin hooks.
 * Exports getHooks() to be wired by index.ts.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const AGENTS_DIR =
  process.env.AGENTS_DIR ?? path.join(os.homedir(), "Documents", "GitHub", "agents");

const METRICS_DIR = path.join(AGENTS_DIR, "_workspace", "_metrics");
const MODEL_PRICING_PATH = path.join(AGENTS_DIR, "model-pricing.json");
const OHO_CONFIG_PATH = path.join(AGENTS_DIR, "oh-my-opencode.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type JsonRecord = Record<string, unknown>;

interface ToolExecuteAfterPayload {
  tool_name?: string;
  args?: JsonRecord;
  result?: unknown;
  error?: { code?: string; message?: string };
  duration_ms?: number;
  tokens?: { input?: number; output?: number };
  model?: string;
  agent?: string;
}

interface ChatMessagePayload {
  role?: "user" | "assistant" | "system";
  content?: string;
  agent?: string;
}

interface SessionMetric {
  event: string;
  ts: string;
  [key: string]: unknown;
}

interface ModelPricing {
  [model: string]: { input_per_1k?: number; output_per_1k?: number };
}

interface OhoConfig {
  agents?: { [agentName: string]: { model?: string } };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sessionFilePath(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(METRICS_DIR, `session-${date}.jsonl`);
}

function appendJsonl(filePath: string, record: JsonRecord): void {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8");
}

function loadJsonFile<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function wordOverlapRatio(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean));
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  for (const w of setA) {
    if (setB.has(w)) overlap++;
  }
  return overlap / Math.min(setA.size, setB.size);
}

const CORRECTION_PHRASES = [
  "no,",
  "no ",
  "wrong",
  "not that",
  "incorrect",
  "try again",
  "that's not",
  "thats not",
];

function isCorrection(content: string): boolean {
  const lower = content.toLowerCase();
  return CORRECTION_PHRASES.some((p) => lower.includes(p));
}

// ---------------------------------------------------------------------------
// Session-level mutable state (lives for the process lifetime)
// ---------------------------------------------------------------------------

const state = {
  turnNumber: 0,
  lastUserMessage: "",
  currentAgent: "",
  skillsLoaded: new Set<string>(),
};

// ---------------------------------------------------------------------------
// OmO config cache
// ---------------------------------------------------------------------------

let _ohoConfig: OhoConfig | null = null;

function ohoConfig(): OhoConfig {
  if (!_ohoConfig) {
    _ohoConfig = loadJsonFile<OhoConfig>(OHO_CONFIG_PATH, {});
  }
  return _ohoConfig;
}

function agentConfiguredModel(agentName: string): string | undefined {
  return ohoConfig().agents?.[agentName]?.model;
}

// ---------------------------------------------------------------------------
// Hook: tool.execute.after
// ---------------------------------------------------------------------------

function onToolExecuteAfter(payload: ToolExecuteAfterPayload): void {
  const startTime = Date.now();
  const toolName = payload.tool_name ?? "unknown";
  const success = payload.error == null;
  const errorCode = payload.error?.code ?? null;
  const durationMs = payload.duration_ms ?? 0;
  const tokenInput = payload.tokens?.input ?? 0;
  const tokenOutput = payload.tokens?.output ?? 0;
  const modelUsed = payload.model ?? "unknown";
  const agentName = payload.agent ?? "";

  const metric: SessionMetric = {
    event: "tool.execute.after",
    ts: new Date().toISOString(),
    tool_name: toolName,
    duration_ms: durationMs,
    success,
    error_code: errorCode,
    token_input: tokenInput,
    token_output: tokenOutput,
    model_used: modelUsed,
    agent_name: agentName,
  };

  appendJsonl(sessionFilePath(), metric);

  // Skill tracking
  if (toolName === "skill") {
    const skillName =
      (payload.args?.skill as string) ??
      (payload.args?.name as string) ??
      "unknown";
    state.skillsLoaded.add(skillName);
    appendJsonl(sessionFilePath(), {
      event: "skill.loaded",
      ts: new Date().toISOString(),
      skill_name: skillName,
      agent_name: agentName,
    });
  }

  // OmO routing inference
  if (agentName) {
    const configuredModel = agentConfiguredModel(agentName);
    if (configuredModel && configuredModel !== modelUsed) {
      appendJsonl(sessionFilePath(), {
        event: "routing_inference",
        ts: new Date().toISOString(),
        agent_name: agentName,
        configured_model: configuredModel,
        actual_model: modelUsed,
        probable_failover: true,
        tool_name: toolName,
      });
    }
  }

  void startTime; // suppress unused-var lint
}

// ---------------------------------------------------------------------------
// Hook: chat.message
// ---------------------------------------------------------------------------

function onChatMessage(payload: ChatMessagePayload): void {
  const role = payload.role ?? "unknown";
  const content = payload.content ?? "";
  const agentName = payload.agent ?? "";

  state.turnNumber += 1;

  let isRephrase = false;
  let isCorrect = false;
  let isAgentSwitch = false;

  if (role === "user") {
    // Rephrase detection
    if (state.lastUserMessage) {
      isRephrase = wordOverlapRatio(content, state.lastUserMessage) > 0.6;
    }
    state.lastUserMessage = content;

    // Correction detection
    isCorrect = isCorrection(content);
  }

  // Agent switch detection
  if (agentName && state.currentAgent && agentName !== state.currentAgent) {
    isAgentSwitch = true;
  }
  if (agentName) {
    state.currentAgent = agentName;
  }

  appendJsonl(sessionFilePath(), {
    event: "chat.message",
    ts: new Date().toISOString(),
    role,
    turn_number: state.turnNumber,
    agent_name: agentName,
    is_rephrase: isRephrase,
    is_correction: isCorrect,
    is_agent_switch: isAgentSwitch,
  });
}

// ---------------------------------------------------------------------------
// Session summary
// ---------------------------------------------------------------------------

export function computeSessionSummary(): void {
  const filePath = sessionFilePath();
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
  const records = lines.map((l) => {
    try {
      return JSON.parse(l) as SessionMetric;
    } catch {
      return null;
    }
  }).filter((r): r is SessionMetric => r !== null);

  const toolEvents = records.filter((r) => r.event === "tool.execute.after");
  const chatEvents = records.filter((r) => r.event === "chat.message");
  const skillEvents = records.filter((r) => r.event === "skill.loaded");
  const routingEvents = records.filter((r) => r.event === "routing_inference");

  // Completion rate: ratio of successful tool calls
  const totalTools = toolEvents.length;
  const successfulTools = toolEvents.filter((r) => r.success === true).length;
  const completionRate = totalTools > 0 ? successfulTools / totalTools : 0;

  // Avg turns to complete (turns per successful tool)
  const totalTurns = chatEvents.length;
  const avgTurnsToComplete = successfulTools > 0 ? totalTurns / successfulTools : 0;

  // Retry rate: rephrase events / total user turns
  const userTurns = chatEvents.filter((r) => r.role === "user");
  const rephraseCount = userTurns.filter((r) => r.is_rephrase === true).length;
  const retryRate = userTurns.length > 0 ? rephraseCount / userTurns.length : 0;

  // Agent switch rate
  const agentSwitches = chatEvents.filter((r) => r.is_agent_switch === true).length;
  const agentSwitchRate = totalTurns > 0 ? agentSwitches / totalTurns : 0;

  // Negative feedback
  const negativeFeedbackCount = userTurns.filter((r) => r.is_correction === true).length;

  // Token cost + dollar cost
  const totalInputTokens = toolEvents.reduce((acc, r) => acc + ((r.token_input as number) ?? 0), 0);
  const totalOutputTokens = toolEvents.reduce((acc, r) => acc + ((r.token_output as number) ?? 0), 0);
  const tokenCost = { input: totalInputTokens, output: totalOutputTokens };

  const pricing = loadJsonFile<ModelPricing>(MODEL_PRICING_PATH, {});
  let dollarCost = 0;
  for (const evt of toolEvents) {
    const model = (evt.model_used as string) ?? "unknown";
    const p = pricing[model];
    if (p) {
      dollarCost +=
        (((evt.token_input as number) ?? 0) / 1000) * (p.input_per_1k ?? 0) +
        (((evt.token_output as number) ?? 0) / 1000) * (p.output_per_1k ?? 0);
    }
  }

  // Model utilization: count per model
  const modelUtil: Record<string, number> = {};
  for (const evt of toolEvents) {
    const m = (evt.model_used as string) ?? "unknown";
    modelUtil[m] = (modelUtil[m] ?? 0) + 1;
  }

  // Skill load frequency
  const skillFreq: Record<string, number> = {};
  for (const evt of skillEvents) {
    const s = (evt.skill_name as string) ?? "unknown";
    skillFreq[s] = (skillFreq[s] ?? 0) + 1;
  }

  // Unused skills: loaded but not in inventory (placeholder — inventory TBD)
  const loadedSkills = Array.from(new Set(skillEvents.map((e) => e.skill_name as string)));
  const unusedSkills: string[] = []; // requires inventory comparison at caller level

  // Manual pattern count: approximate by correction + rephrase events
  const manualPatternCount = rephraseCount + negativeFeedbackCount;

  const summary = {
    event: "session.summary",
    ts: new Date().toISOString(),
    session_date: new Date().toISOString().slice(0, 10),
    completion_rate: completionRate,
    avg_turns_to_complete: avgTurnsToComplete,
    retry_rate: retryRate,
    agent_switch_rate: agentSwitchRate,
    negative_feedback_count: negativeFeedbackCount,
    token_cost: tokenCost,
    dollar_cost: dollarCost,
    model_utilization: modelUtil,
    skill_load_frequency: skillFreq,
    unused_skills: unusedSkills,
    loaded_skills: loadedSkills,
    manual_pattern_count: manualPatternCount,
    routing_inferences: routingEvents.length,
  };

  const summaryPath = path.join(METRICS_DIR, "summary.jsonl");
  appendJsonl(summaryPath, summary);
}

// ---------------------------------------------------------------------------
// Hook definitions
// ---------------------------------------------------------------------------

export interface HookDefinition {
  event: string;
  handler: (payload: JsonRecord) => void;
}

export function getHooks(): HookDefinition[] {
  return [
    {
      event: "tool.execute.after",
      handler: (payload) => onToolExecuteAfter(payload as ToolExecuteAfterPayload),
    },
    {
      event: "chat.message",
      handler: (payload) => onChatMessage(payload as ChatMessagePayload),
    },
  ];
}
