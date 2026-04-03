import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve("/c/Users/shuff57/Documents/GitHub/agent-evo");
const ROSTER_DIR = path.join(REPO_ROOT, "roster");
const GEN0_DIR = path.join(REPO_ROOT, "evolution/backups/gen-0");
const EVOLUTION_LOG = path.join(REPO_ROOT, "_workspace/_evolution_log.jsonl");
const AGENT_TESTS_DIR = path.join(REPO_ROOT, "evolution/tests/agents");
const SKILL_TESTS_DIR = path.join(REPO_ROOT, "evolution/tests/skills");
const CHAIN_TESTS_DIR = path.join(REPO_ROOT, "evolution/tests/chains");
const DRIFT_THRESHOLD = 0.4; // 40%

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DriftResult {
  drifted: boolean;
  percentage: number;
  agentName: string;
  semanticDrift?: boolean;
  semanticNote?: string;
}

export interface TestCase {
  index: number;
  input: string;
  expected: string;
}

export interface RegressionTestSuite {
  name: string;
  testCases: TestCase[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileLines(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split("\n");
}

function extractFrontmatterField(lines: string[], field: string): string {
  let inFrontmatter = false;
  for (const line of lines) {
    if (line.trim() === "---") {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        break; // End of frontmatter
      }
    }
    if (inFrontmatter) {
      const match = line.match(new RegExp(`^${field}:\\s*(.+)$`));
      if (match) return match[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  return "";
}

function computeLineDiffPercentage(
  linesA: string[],
  linesB: string[]
): number {
  if (linesA.length === 0 && linesB.length === 0) return 0;

  const setA = new Set(linesA);
  const setB = new Set(linesB);
  const totalLines = Math.max(linesA.length, linesB.length);

  let changedCount = 0;
  const maxLen = Math.max(linesA.length, linesB.length);

  for (let i = 0; i < maxLen; i++) {
    if (linesA[i] !== linesB[i]) {
      changedCount++;
    }
  }

  return totalLines > 0 ? changedCount / totalLines : 0;
}

function readLastNLines(filePath: string, n: number): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(-n);
}

// ---------------------------------------------------------------------------
// checkDrift
// ---------------------------------------------------------------------------

export function checkDrift(agentName: string): DriftResult {
  const currentPath = path.join(ROSTER_DIR, `${agentName}.md`);
  const gen0Path = path.join(GEN0_DIR, `${agentName}.md`);

  const currentLines = readFileLines(currentPath);
  const gen0Lines = readFileLines(gen0Path);

  if (currentLines.length === 0 || gen0Lines.length === 0) {
    return {
      drifted: false,
      percentage: 0,
      agentName,
      semanticDrift: false,
      semanticNote: gen0Lines.length === 0 ? "No gen-0 baseline found" : "Current file not found",
    };
  }

  const percentage = computeLineDiffPercentage(gen0Lines, currentLines);
  const drifted = percentage > DRIFT_THRESHOLD;

  // Semantic drift: compare description field in frontmatter
  const currentDescription = extractFrontmatterField(currentLines, "description");
  const gen0Description = extractFrontmatterField(gen0Lines, "description");
  const semanticDrift =
    currentDescription.length > 0 &&
    gen0Description.length > 0 &&
    currentDescription !== gen0Description;

  const semanticNote = semanticDrift
    ? `Description changed from "${gen0Description}" to "${currentDescription}"`
    : undefined;

  return {
    drifted,
    percentage: Math.round(percentage * 10000) / 100, // e.g. 0.423 -> 42.3
    agentName,
    semanticDrift,
    semanticNote,
  };
}

// ---------------------------------------------------------------------------
// shouldCheckDrift
// ---------------------------------------------------------------------------

export function shouldCheckDrift(agentName: string): boolean {
  const lines = readLastNLines(EVOLUTION_LOG, 500);
  let generationCount = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as {
        agentName?: string;
        agent?: string;
        generation?: number;
        type?: string;
      };
      const name = entry.agentName ?? entry.agent ?? "";
      if (name === agentName && typeof entry.generation === "number") {
        generationCount++;
      }
    } catch {
      // Skip unparseable lines
    }
  }

  if (generationCount === 0) return false;
  return generationCount % 5 === 0;
}

// ---------------------------------------------------------------------------
// Test parsing helpers
// ---------------------------------------------------------------------------

function parseTestFile(filePath: string, suiteName: string): RegressionTestSuite {
  if (!fs.existsSync(filePath)) {
    return { name: suiteName, testCases: [] };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const sections = content.split(/^## Test \d+/m).slice(1); // Skip preamble

  const testCases: TestCase[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    const inputMatch = section.match(/^Input:\s*\n([\s\S]*?)(?=^Expected:|$)/m);
    const expectedMatch = section.match(/^Expected:\s*\n([\s\S]*?)(?=^## |$)/m);

    const input = inputMatch ? inputMatch[1].trim() : "";
    const expected = expectedMatch ? expectedMatch[1].trim() : "";

    if (input || expected) {
      testCases.push({ index: i + 1, input, expected });
    }
  }

  return { name: suiteName, testCases };
}

// ---------------------------------------------------------------------------
// runAgentRegressionTests
// ---------------------------------------------------------------------------

export function runAgentRegressionTests(
  agentName: string
): RegressionTestSuite {
  const testPath = path.join(AGENT_TESTS_DIR, `${agentName}.test.md`);
  return parseTestFile(testPath, agentName);
}

// ---------------------------------------------------------------------------
// runSkillRegressionTests
// ---------------------------------------------------------------------------

export function runSkillRegressionTests(
  skillName: string
): RegressionTestSuite {
  const testPath = path.join(SKILL_TESTS_DIR, `${skillName}.test.md`);
  return parseTestFile(testPath, skillName);
}

// ---------------------------------------------------------------------------
// runChainRegressionTests
// ---------------------------------------------------------------------------

export function runChainRegressionTests(
  chainName: string
): RegressionTestSuite {
  const testPath = path.join(CHAIN_TESTS_DIR, `${chainName}.test.md`);
  return parseTestFile(testPath, chainName);
}
