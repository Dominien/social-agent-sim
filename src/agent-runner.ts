import { readFileSync } from "fs";
import { join } from "path";
import type { AgentAction, AgentName, AgentTurnResult } from "./types.js";
import { AGENT_DISPLAY_NAMES } from "./types.js";
import { callClaudeJSON } from "./llm.js";
import { readAgentProfile, readAgentMemory } from "./memory.js";
import { ACTION_SCHEMA_PROMPT, resolveAction, type ResolveContext } from "./tools.js";

const DATA_DIR = join(process.cwd(), "data");

// ─── Ground Truth ──────────────────────────────────────────

interface GroundTruthEntry {
  monthly_income: string;
  can_afford_increase: string;
  savings: string;
}

let groundTruthCache: Record<string, GroundTruthEntry> | null = null;

function loadGroundTruth(): Record<string, GroundTruthEntry> {
  if (groundTruthCache) return groundTruthCache;
  try {
    const path = join(DATA_DIR, "ground_truth.json");
    groundTruthCache = JSON.parse(readFileSync(path, "utf-8"));
    return groundTruthCache!;
  } catch {
    return {};
  }
}

function getGroundTruth(agent: AgentName, perception: string, memory: string): string | undefined {
  const context = (perception + " " + memory).toLowerCase();
  const triggers = ["rent", "money", "pay", "afford", "eviction", "premium", "costs", "income", "balance"];
  if (!triggers.some(t => context.includes(t))) return undefined;

  const gt = loadGroundTruth()[agent];
  if (!gt) return undefined;

  return `You know: your income is ${gt.monthly_income}. You have ${gt.savings} in savings.`;
}

// ─── Minimal Agent Prompt ──────────────────────────────────

function buildPrompt(agent: AgentName, perception: string): string {
  const name = AGENT_DISPLAY_NAMES[agent];
  const profile = readAgentProfile(agent);
  const memory = readAgentMemory(agent);

  const groundTruth = getGroundTruth(agent, perception, memory);

  return `You are ${name}.

${profile}

Locations in the building: Apartment 1-6, Stairwell, Entrance Hall, Mailboxes (ground floor), Backyard. Outside: Späti, Zum Anker.
Your mailbox is at the Mailboxes on the ground floor — you need to use move_to to get there.

${memory}

---

${perception}
${groundTruth ? `\n(${groundTruth})` : ""}

${ACTION_SCHEMA_PROMPT}`;
}

// ─── Run Single Agent Turn ─────────────────────────────────

export async function runAgentTurn(
  agent: AgentName,
  perception: string,
  context: ResolveContext,
): Promise<AgentTurnResult> {
  const model = process.env.CHARACTER_MODEL || "haiku";
  const prompt = buildPrompt(agent, perception);

  const response = await callClaudeJSON<{ actions: AgentAction[] }>(prompt, { model });

  const actions = (response.actions || []).map((action) =>
    resolveAction(action, context),
  );

  // If no actions, default to wait
  if (actions.length === 0) {
    actions.push(resolveAction({ type: "wait" }, context));
  }

  const pendingMove = actions.find(a => a.type === "move_to")?.location;

  return { agent, actions, pendingMove };
}
