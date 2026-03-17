import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { AgentName, SimTime, ResolvedAction, WorldState } from "./types.js";
import { AGENT_NAMES, AGENT_DISPLAY_NAMES } from "./types.js";

const DATA_DIR = join(process.cwd(), "data");

// ─── File Readers ──────────────────────────────────────────

export function readAgentMemory(agent: AgentName): string {
  const path = join(DATA_DIR, "memory", `${agent}.md`);
  return readFileSync(path, "utf-8");
}

export function readAgentProfile(agent: AgentName): string {
  const path = join(DATA_DIR, "profiles", `${agent}.md`);
  return readFileSync(path, "utf-8");
}

export function readWorldState(): WorldState {
  const path = join(DATA_DIR, "world_state.json");
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function writeWorldState(state: WorldState): void {
  const path = join(DATA_DIR, "world_state.json");
  writeFileSync(path, JSON.stringify(state, null, 2));
}

export function writeTickLog(tick: number, log: object): void {
  const logsDir = join(DATA_DIR, "logs");
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }
  const path = join(logsDir, `tick_${tick.toString().padStart(5, "0")}.json`);
  writeFileSync(path, JSON.stringify(log, null, 2));
}

// ─── Memory Parsing ────────────────────────────────────────

interface MemorySections {
  header: string;           // "# Marco"
  menschen: string[];       // relationship impressions
  erfahrungen: string[];    // experience entries
  wichtiges: string[];      // pinned important items
}

function parseMemory(content: string): MemorySections {
  const sections: MemorySections = {
    header: "",
    menschen: [],
    erfahrungen: [],
    wichtiges: [],
  };

  let currentSection: "header" | "menschen" | "erfahrungen" | "wichtiges" = "header";

  for (const line of content.split("\n")) {
    if (line.startsWith("# ")) {
      sections.header = line;
      continue;
    }

    if (line.startsWith("## People")) {
      currentSection = "menschen";
      continue;
    }
    if (line.startsWith("## Experiences")) {
      currentSection = "erfahrungen";
      continue;
    }
    if (line.startsWith("## Important")) {
      currentSection = "wichtiges";
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    switch (currentSection) {
      case "menschen":
        sections.menschen.push(trimmed);
        break;
      case "erfahrungen":
        if (trimmed !== "*(Nothing yet)*") {
          sections.erfahrungen.push(trimmed);
        }
        break;
      case "wichtiges":
        if (trimmed !== "*(Nothing)*") {
          sections.wichtiges.push(trimmed);
        }
        break;
    }
  }

  return sections;
}

function serializeMemory(sections: MemorySections): string {
  let out = sections.header + "\n\n";

  out += "## People\n";
  if (sections.menschen.length > 0) {
    out += sections.menschen.join("\n") + "\n";
  }
  out += "\n";

  out += "## Experiences\n";
  if (sections.erfahrungen.length === 0) {
    out += "*(Nothing yet)*\n";
  } else {
    out += sections.erfahrungen.join("\n") + "\n";
  }
  out += "\n";

  out += "## Important\n";
  if (sections.wichtiges.length === 0) {
    out += "*(Nothing)*\n";
  } else {
    out += sections.wichtiges.join("\n") + "\n";
  }

  return out;
}

// ─── Memory Compression ───────────────────────────────────

/**
 * Compress old experience entries.
 * Recent 20 stay verbatim. Older become one-liners. Oldest disappear.
 */
function compressExperiences(entries: string[]): string[] {
  if (entries.length <= 20) return entries;

  const recent = entries.slice(-20);
  const older = entries.slice(0, -20);

  // Compress older entries into weekly summaries
  // Group by week-ish (every 7 * 16 = 112 ticks is a week)
  const compressed: string[] = [];

  // Batch older entries into groups of 10 and summarize
  for (let i = 0; i < older.length; i += 10) {
    const batch = older.slice(i, i + 10);
    // Extract key info from batch
    const names = new Set<string>();
    const locations = new Set<string>();

    for (const entry of batch) {
      // Extract names mentioned
      for (const agent of AGENT_NAMES) {
        const displayName = AGENT_DISPLAY_NAMES[agent];
        if (entry.includes(displayName)) names.add(displayName);
      }
      // Extract first word of location after the time
      const locMatch = entry.match(/^\S+\s+\d+:\d+\.\s+([^.]+)\./);
      if (locMatch) locations.add(locMatch[1]);
    }

    const firstEntry = batch[0];
    const timeMatch = firstEntry.match(/^(\S+)/);
    const timeRef = timeMatch ? timeMatch[1] : "Earlier";

    let summary = `[${timeRef}]: `;
    if (names.size > 0) {
      summary += `Met ${[...names].join(", ")}. `;
    }
    summary += "Routine.";

    compressed.push(summary);
  }

  // Keep max 5 compressed summaries
  const trimmedCompressed = compressed.slice(-5);

  return [...trimmedCompressed, ...recent];
}

// ─── Work Memory Injection ────────────────────────────────

/**
 * Injects a work memory entry when an agent returns from work.
 * This fills the gap between "Night. Slept." and the current tick,
 * preventing the LLM from hallucinating work events.
 */
export function injectWorkMemory(
  agent: AgentName,
  time: SimTime,
  workSummary: string,
  workSchedule: string,
): void {
  const content = readAgentMemory(agent);
  const sections = parseMemory(content);

  const entry = `${time.dayOfWeek} ${workSchedule}. ${workSummary}`;
  sections.erfahrungen.push(entry);

  const path = join(DATA_DIR, "memory", `${agent}.md`);
  writeFileSync(path, serializeMemory(sections));
}

// ─── Update Memory from Actions ────────────────────────────

export function updateAgentMemoryFromActions(
  agent: AgentName,
  time: SimTime,
  location: string,
  otherAgents: string[],
  actions: ResolvedAction[],
): void {
  const content = readAgentMemory(agent);
  const sections = parseMemory(content);

  // Build fragmentary memory entry
  const parts: string[] = [];

  // Time and place
  const timeShort = `${time.dayOfWeek} ${time.hour.toString().padStart(2, "0")}:00`;
  const otherStr = otherAgents.length > 0
    ? `. ${otherAgents.join(", ")} ${otherAgents.length === 1 ? "was" : "were"} there`
    : "";
  parts.push(`${timeShort}. ${location}${otherStr}.`);

  // Only add non-wait actions
  let hasContent = false;
  for (const action of actions) {
    switch (action.type) {
      case "speak":
        parts.push(`Said: "${action.text}"`);
        hasContent = true;
        break;
      case "think":
        if (action.text && action.text.length > 0) {
          const short = action.text.length > 60 ? action.text.substring(0, 60) + "..." : action.text;
          parts.push(short);
          hasContent = true;
        }
        break;
      case "do":
        if (action.text) {
          parts.push(action.text);
          hasContent = true;
        }
        break;
      case "move_to":
        parts.push(`Went to ${action.location}.`);
        hasContent = true;
        break;
      case "check_mailbox":
        if (action.result && action.result !== "Mailbox is empty.") {
          parts.push(`Mail: ${action.result}`);
          hasContent = true;
        }
        break;
      case "read":
        parts.push(`Read letter.`);
        hasContent = true;
        break;
      case "knock_door":
        parts.push(`Knocked at ${action.target}'s door. ${action.result}`);
        hasContent = true;
        break;
      case "send_message":
        parts.push(`Sent message to ${action.to || action.target}.`);
        hasContent = true;
        break;
      case "phone_call":
        parts.push(`Called ${action.target}. ${action.result}`);
        hasContent = true;
        break;
      case "leave_note":
        parts.push(`Left a note.`);
        hasContent = true;
        break;
      case "lock_door":
        parts.push("Locked the door.");
        hasContent = true;
        break;
      // wait, unlock_door: skip in memory
    }
  }

  // Only add to memory if something actually happened
  if (hasContent) {
    const eventEntry = parts.join(" ");
    sections.erfahrungen.push(eventEntry);
  }

  // Pin significant events
  const hasSignificantContent = actions.some(a =>
    a.result && (
      a.result.toLowerCase().includes("eviction") ||
      a.result.toLowerCase().includes("law firm") ||
      a.result.toLowerCase().includes("personal use") ||
      a.result.toLowerCase().includes("relocation bonus") ||
      a.result.toLowerCase().includes("renovation")
    ),
  );
  if (hasSignificantContent) {
    const readAction = actions.find(a => a.type === "read");
    if (readAction) {
      const pinnedText = readAction.result.substring(0, 120);
      sections.wichtiges.push(`- ${time.timeLabel}: ${pinnedText}`);
      // Max 5 pinned items
      while (sections.wichtiges.length > 5) {
        sections.wichtiges.shift();
      }
    }
  }

  // Compress if needed
  sections.erfahrungen = compressExperiences(sections.erfahrungen);

  const path = join(DATA_DIR, "memory", `${agent}.md`);
  writeFileSync(path, serializeMemory(sections));
}

// ─── Update Relationships ──────────────────────────────────

/**
 * After interactions, update the People section if agent expressed
 * opinions about others.
 */
export function updateRelationships(
  agent: AgentName,
  actions: ResolvedAction[],
  otherAgents: string[],
): void {
  if (otherAgents.length === 0) return;

  const content = readAgentMemory(agent);
  const sections = parseMemory(content);

  // Check if agent's thoughts or speech mention other agents
  for (const action of actions) {
    if (action.type !== "think" && action.type !== "speak") continue;
    const text = action.text || "";

    for (const other of otherAgents) {
      if (!text.includes(other)) continue;

      // Check if we already have an entry for this person
      const existingIdx = sections.menschen.findIndex(
        entry => entry.startsWith(`- ${other}:`)
      );

      if (existingIdx === -1) {
        // New relationship entry — extract a brief impression
        const impression = text.length > 80 ? text.substring(0, 80) + "..." : text;
        sections.menschen.push(`- ${other}: ${impression}`);
      }
      // Don't update existing entries too frequently — let them accumulate naturally
    }
  }

  const path = join(DATA_DIR, "memory", `${agent}.md`);
  writeFileSync(path, serializeMemory(sections));
}

// ─── Helpers ───────────────────────────────────────────────

export function logsExist(): boolean {
  return existsSync(join(DATA_DIR, "logs", "tick_00001.json"));
}
