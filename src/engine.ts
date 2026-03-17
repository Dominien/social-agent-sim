import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type {
  AgentName,
  AgentTurnResult,
  EncounterType,
  ResolvedAction,
  SimTime,
  TickLog,
  TickLogLocation,
  TickLogRound,
  WorldState,
} from "./types.js";
import { AGENT_NAMES, AGENT_DISPLAY_NAMES, AGENT_HOMES } from "./types.js";
import { tickToTime, ticksPerDay } from "./time.js";
import {
  readWorldState,
  writeWorldState,
  writeTickLog,
  readAgentMemory,
  updateAgentMemoryFromActions,
  updateRelationships,
  injectWorkMemory,
} from "./memory.js";
import { getWeather, placeScheduledObjects, getVisibleSharedObjects, cleanExpiredObjects } from "./environment-agent.js";
import { runAgentTurn } from "./agent-runner.js";
import { getLLMStats } from "./llm.js";
import { isAway, awayReason, workMemorySummary, workHours } from "./away.js";
import { updateBodyState, processBodyActions, bodyPerception } from "./body.js";
import { processMonthly, processSpending, financePerception } from "./finances.js";
import { getSounds } from "./sounds.js";
import { deliverMessages } from "./messages.js";
import type { ResolveContext } from "./tools.js";

const DATA_DIR = join(process.cwd(), "data");

// ─── Cohabitants ────────────────────────────────────────────

const COHABITANTS: Record<string, string[]> = {
  marco: ["Sarah"],
  sarah: ["Marco"],
  marta: [],
  rolf: [],
  hakim: [],
  suki: [],
};

// ─── Unknown Agent Descriptions ─────────────────────────────

const AGENT_DESCRIPTIONS: Record<string, string> = {
  marco: "the young man from the 3rd floor",
  sarah: "the young woman from the 3rd floor",
  marta: "the older woman from the 1st floor",
  rolf: "the man from the 2nd floor",
  hakim: "the man from across the hall, 3rd floor",
  suki: "the young woman from the top floor",
};

function describeAgent(agent: AgentName, observer: AgentName, state: WorldState): string {
  const knows = state.acquaintances?.[observer]?.includes(agent);
  if (knows) {
    return AGENT_DISPLAY_NAMES[agent];
  }
  return AGENT_DESCRIPTIONS[agent] || "someone";
}

// ─── External Location Hours ────────────────────────────────

const LOCATION_HOURS: Record<string, { open: number; close: number }> = {
  "Späti": { open: 7, close: 22 },
  "Zum Anker": { open: 16, close: 23 },
};

const EXTERNAL_LOCATIONS = ["Späti", "Zum Anker", "Backyard"];

// ─── Service Staff (Zum Anker & Späti) ──────────────────────

interface ServiceResponse {
  line: string;        // Staff dialogue to inject into conversation
  delivery?: string;   // Food delivery description (injected next round)
  cost: number;        // Amount to deduct from ordering agent
}

const ANKER_MENU = [
  { pattern: /linsensuppe|lentil soup/i, name: "Lentil soup with bread", price: 8.50 },
  { pattern: /gulasch|goulash/i, name: "Goulash with bread", price: 10.50 },
  { pattern: /kartoffelpuffer|potato pancake/i, name: "Potato pancakes", price: 7.00 },
  { pattern: /brezel|laugenbrezel|pretzel/i, name: "Pretzel", price: 3.50 },
  { pattern: /currywurst/i, name: "Currywurst with fries", price: 9.00 },
  { pattern: /tagesgericht|daily special/i, name: "Daily special", price: 8.50 },
  { pattern: /\bbier\b|\bbeer\b|augustiner|pils|helles|lager/i, name: "Beer", price: 3.80 },
  { pattern: /wein|wine|schorle/i, name: "Wine spritzer", price: 4.50 },
  { pattern: /\bwasser\b|\bwater\b/i, name: "Water", price: 2.50 },
  { pattern: /kaffee|\bcoffee\b/i, name: "Coffee", price: 2.80 },
  { pattern: /\btee\b|\btea\b/i, name: "Tea", price: 2.50 },
  { pattern: /schnaps|korn|shot/i, name: "Schnapps", price: 3.00 },
];

function detectAnkerService(text: string): ServiceResponse | null {
  const lower = text.toLowerCase();

  // Follow-up / impatient
  if (/where.*order|how long|waiting|food coming|wo bleibt|wann kommt/i.test(lower)) {
    return { line: `Waiter: "Coming right up, just a moment."`, cost: 0 };
  }

  // Ask for menu
  if (/what.*have|what.*got|menu|what can|what.*offer|was gibt|speisekarte/i.test(lower)) {
    return {
      line: `Waiter: "Today we have lentil soup, goulash, potato pancakes, currywurst with fries, and pretzel. To drink: beer, wine, water, coffee, tea."`,
      cost: 0,
    };
  }

  // Payment / farewell
  if (/pay|check|bill|tab|keep the change|zahlen|rechnung|bezahlen|stimmt so/i.test(lower)) {
    return { line: `Waiter: "All settled. Have a nice evening."`, cost: 0 };
  }

  // Order detection — must contain ordering language
  if (!/order|i'll have|please|one|two|three|for me|i'd like|i would like|could i|we'll have|and a|another|give me|bestell|nehm|bitte|einmal|zweimal|ich hätte|ich möchte/i.test(lower)) {
    return null;
  }

  // Parse ordered items
  const items: { name: string; qty: number; price: number }[] = [];
  let totalCost = 0;

  for (const menuItem of ANKER_MENU) {
    const match = menuItem.pattern.exec(lower);
    if (!match) continue;
    // Look for quantity words before the matched item
    const before = lower.substring(Math.max(0, match.index - 15), match.index);
    let qty = 1;
    if (/three|drei(mal)?|3\b/.test(before)) qty = 3;
    else if (/two|zwei(mal)?|2\b/.test(before)) qty = 2;
    else if (/four|vier(mal)?|4\b/.test(before)) qty = 4;
    else if (/five|fünf(mal)?|5\b/.test(before)) qty = 5;

    items.push({ name: menuItem.name, qty, price: menuItem.price * qty });
    totalCost += menuItem.price * qty;
  }

  if (items.length === 0) {
    // Ordering language detected but nothing on the menu
    return {
      line: `Waiter: "Sorry, we don't have that. We have lentil soup, goulash, potato pancakes, currywurst, and pretzel."`,
      cost: 0,
    };
  }

  const itemStrs = items.map(i => i.qty > 1 ? `${i.qty}x ${i.name}` : i.name);
  const deliveryParts = items.map(i => i.qty > 1 ? `${i.qty} ${i.name}` : i.name);

  return {
    line: `Waiter: "Got it. ${itemStrs.join(", ")}. Coming right up."`,
    delivery: `Waiter brings ${deliveryParts.join(" and ")} to the table.`,
    cost: totalCost,
  };
}

function detectSpatiService(text: string): ServiceResponse | null {
  const lower = text.toLowerCase();

  if (/pay|how much|cost|total|checkout|register|zahlen|bezahlen|was kostet|kasse/i.test(lower)) {
    return { line: `Cashier: "That'll be 5.80 euros."`, cost: 0 };
  }

  if (/thanks|bye|goodbye|keep the change|see you|danke|tschüss/i.test(lower)) {
    return { line: `Cashier: "Thanks, have a nice day!"`, cost: 0 };
  }

  return null;
}

function detectServiceResponse(text: string, location: string): ServiceResponse | null {
  if (location === "Zum Anker") return detectAnkerService(text);
  if (location === "Späti") return detectSpatiService(text);
  return null;
}

/**
 * Check agent speak actions for service interactions (orders, payments).
 * In multi-agent conversations: injects staff responses into conversationSoFar,
 * queues deliveries for next round.
 * In solo/cooldown: pushes responses into action_feedback.
 */
function handleServiceInteractions(
  actions: ResolvedAction[],
  location: string,
  agent: AgentName,
  state: WorldState,
  conversationSoFar: string[] | null,
  pendingDeliveries: string[] | null,
  logLevel: string,
): void {
  if (location !== "Zum Anker" && location !== "Späti") return;

  for (const action of actions) {
    if (action.type !== "speak" || !action.text) continue;

    const resp = detectServiceResponse(action.text, location);
    if (!resp) continue;

    if (logLevel !== "minimal") console.log(`    ${resp.line}`);

    // Inject response into conversation or action_feedback
    if (conversationSoFar) {
      conversationSoFar.push(resp.line);
    } else {
      if (!state.action_feedback[agent]) state.action_feedback[agent] = [];
      state.action_feedback[agent].push(resp.line);
    }

    // Queue delivery
    if (resp.delivery) {
      if (pendingDeliveries) {
        pendingDeliveries.push(resp.delivery);
      } else {
        if (!state.action_feedback[agent]) state.action_feedback[agent] = [];
        state.action_feedback[agent].push(resp.delivery);
      }
    }

    // Deduct cost
    if (resp.cost > 0 && state.finances[agent]) {
      state.finances[agent].balance -= resp.cost;
    }
  }
}

// ─── Enforce Closing Hours ──────────────────────────────────

function enforceClosingHours(time: SimTime, state: WorldState, logLevel: string): void {
  for (const [location, hours] of Object.entries(LOCATION_HOURS)) {
    if (time.hour >= hours.close || time.hour < hours.open) {
      for (const [agent, loc] of Object.entries(state.agent_locations)) {
        if (loc === location) {
          state.agent_locations[agent] = AGENT_HOMES[agent as AgentName];
          if (logLevel !== "minimal") {
            console.log(`  [Closing] ${AGENT_DISPLAY_NAMES[agent as AgentName]} goes home (${location} closed)`);
          }
        }
      }
    }
  }
}

// ─── Morning Reset ──────────────────────────────────────────

function morningReset(state: WorldState, logLevel: string): void {
  for (const agent of AGENT_NAMES) {
    const loc = state.agent_locations[agent];
    if (loc && loc !== "away" && loc !== AGENT_HOMES[agent]) {
      state.agent_locations[agent] = AGENT_HOMES[agent];
      if (logLevel !== "minimal") {
        console.log(`  [Night] ${AGENT_DISPLAY_NAMES[agent]} was still at ${loc} — now home`);
      }
    }
  }
}

// ─── Night Memory Injection ─────────────────────────────────

function injectSleepMemory(time: SimTime, state: WorldState): void {
  // Only on day 2+ (no sleep entry on the very first day)
  if (time.dayNumber <= 1) return;

  for (const agent of AGENT_NAMES) {
    const body = state.body[agent];
    const quality = body?.sleep_quality || "okay";

    // Check if recent memory has high-stress content → worse sleep
    const memory = readAgentMemory(agent);
    const recentStress = /eviction|fear|argument|police|emergency|crying|scream/i.test(
      memory.split("\n").slice(-5).join(" ")
    );

    const finalQuality = recentStress && quality === "good" ? "restless" :
                          quality === "good" ? "well" :
                          quality === "fair" ? "okay" : "poorly";

    const entry = `Night. Slept (${finalQuality}). New day.`;

    // Append directly to memory file
    const memPath = join(DATA_DIR, "memory", `${agent}.md`);
    const content = readFileSync(memPath, "utf-8");

    // Find "## Experiences" section and append entry
    if (content.includes("## Experiences")) {
      const updated = content.replace(
        /## Experiences\n(\*\(Nothing yet\)\*\n)?/,
        `## Experiences\n`
      );
      // Append the sleep entry before the last section
      const wichtigesIdx = updated.indexOf("## Important");
      if (wichtigesIdx > 0) {
        const before = updated.substring(0, wichtigesIdx).trimEnd();
        const after = updated.substring(wichtigesIdx);
        const newContent = before + "\n" + entry + "\n\n" + after;
        writeFileSync(memPath, newContent);
      }
    }
  }
}

// ─── Interaction Cooldown ───────────────────────────────────

// Module-level tracking (resets on restart, which is fine)
const lastInteractions: Map<string, { tick: number; location: string }> = new Map();

function interactionKey(agents: string[]): string {
  return [...agents].sort().join("+");
}

function shouldSuppressInteraction(
  agents: AgentName[],
  location: string,
  currentTick: number,
  state: WorldState,
  allMovements: { agent: string; from: string; to: string }[],
): boolean {
  if (agents.length < 2) return false;

  // If any agent just arrived at this location, allow interaction (new stimulus)
  const justArrived = agents.some(a =>
    allMovements.some(m => m.agent === a && m.to === location)
  );
  if (justArrived) return false;

  // Check all pairs
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const key = interactionKey([agents[i], agents[j]]);
      const last = lastInteractions.get(key);

      if (!last) return false;  // never interacted → allow
      if (last.location !== location) return false;  // different place → allow
      if (currentTick - last.tick > 3) return false;  // 3+ hours gap → allow

      // Check for new stimuli
      const hasNewMessages = agents.some(a =>
        (state.message_queue[a]?.length || 0) > 0
      );
      if (hasNewMessages) return false;  // new message → allow
    }
  }

  return true;  // same place, recently talked, nothing new → suppress
}

function recordInteraction(agents: AgentName[], location: string, tick: number): void {
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const key = interactionKey([agents[i], agents[j]]);
      lastInteractions.set(key, { tick, location });
    }
  }
}

// ─── Encounter Type ─────────────────────────────────────────

function getEncounterType(location: string): EncounterType {
  if (["Stairwell", "Mailboxes", "Entrance Hall"].includes(location)) return "passing";
  if (["Backyard", "Späti", "Zum Anker"].includes(location)) return "coincidence";
  return "deliberate";
}

function maxRounds(encounterType: EncounterType, agents?: AgentName[]): number {
  const configMax = parseInt(process.env.MAX_CONVERSATION_ROUNDS || "8");
  switch (encounterType) {
    case "passing": return Math.min(2, configMax);
    case "coincidence": return Math.min(configMax, configMax);
    case "deliberate": {
      // Cohabitants (same home) get fewer rounds — they see each other every tick,
      // so 8 rounds of banter spirals into infinite loops
      if (agents && agents.length === 2) {
        const homes = agents.map(a => AGENT_HOMES[a]);
        if (homes[0] === homes[1]) return Math.min(3, configMax);
      }
      return configMax;
    }
  }
}

// ─── Resolve Phone Calls ──────────────────────────────────────

const PICKUP_PATTERN = /picks.*up|answer|answers.*phone|answers.*call|gets.*phone|pick up/i;
const HANGUP_PATTERN = /hangs up|hang up|ends.*call|ends.*conversation/i;

async function resolvePhoneCalls(
  state: WorldState,
  time: SimTime,
  agentFullResults: Record<string, ResolvedAction[]>,
  locationResults: Record<string, TickLogLocation>,
  logLevel: string,
): Promise<void> {
  if (!state.pending_calls) return;

  const pendingEntries = Object.entries(state.pending_calls);
  if (pendingEntries.length === 0) return;

  for (const [target, caller] of pendingEntries) {
    const targetAgent = target as AgentName;
    const callerAgent = caller as AgentName;
    const targetName = AGENT_DISPLAY_NAMES[targetAgent];
    const callerName = AGENT_DISPLAY_NAMES[callerAgent];

    // Check if target picked up (scan their do actions for pickup pattern)
    const targetActions = agentFullResults[targetAgent] || [];
    const pickedUp = targetActions.some(a =>
      a.type === "do" && a.result && PICKUP_PATTERN.test(a.result)
    );

    if (!pickedUp) {
      // Target didn't pick up — notify caller
      if (!state.action_feedback[callerAgent]) state.action_feedback[callerAgent] = [];
      state.action_feedback[callerAgent].push(`${targetName} didn't answer.`);
      delete state.pending_calls[target];
      if (logLevel !== "minimal") {
        console.log(`  [Phone] ${targetName} didn't answer (call from ${callerName})`);
      }
      continue;
    }

    // --- Phone conversation: up to 3 rounds ---
    if (logLevel !== "minimal") {
      console.log(`  [Call: ${callerName} ↔ ${targetName}]`);
    }

    const conversationLog: string[] = [];
    const phoneActions: Record<string, ResolvedAction[]> = { [callerAgent]: [], [targetAgent]: [] };
    let ended = false;

    for (let round = 1; round <= 3; round++) {
      if (ended) break;

      // --- Caller's turn ---
      const callerPerception = round === 1
        ? `${time.timeLabel}. You're on the phone.\n\n[Phone] ${targetName} picked up.${conversationLog.length > 0 ? `\n\nConversation so far:\n${conversationLog.join("\n")}` : ""}\n\nYour turn.`
        : `${time.timeLabel}. You're on the phone with ${targetName}.\n\nConversation so far:\n${conversationLog.join("\n")}\n\nYour turn.`;

      const callerLoc = state.agent_locations[callerAgent] || AGENT_HOMES[callerAgent];
      const callerCtx: ResolveContext = { agent: callerAgent, agentLocation: callerLoc, state, time };
      const callerResult = await runAgentTurn(callerAgent, callerPerception, callerCtx);

      for (const a of callerResult.actions) {
        phoneActions[callerAgent].push(a);
        if (a.type === "speak" && a.text) {
          conversationLog.push(`${callerName}: "${a.text}"`);
          if (logLevel !== "minimal") console.log(`    ${callerName}: "${a.text}"`);
        } else if (a.type === "do" && a.text && HANGUP_PATTERN.test(a.text)) {
          conversationLog.push(`${callerName} hangs up.`);
          ended = true;
          break;
        }
      }
      // If caller only waited, end call
      if (callerResult.actions.every(a => a.type === "wait" || a.type === "think")) {
        ended = true;
        break;
      }

      if (ended) break;

      // --- Target's turn ---
      const targetPerception = `${time.timeLabel}. You're on the phone with ${callerName}.\n\nConversation so far:\n${conversationLog.join("\n")}\n\nYour turn.`;

      const targetLoc = state.agent_locations[targetAgent] || AGENT_HOMES[targetAgent];
      const targetCtx: ResolveContext = { agent: targetAgent, agentLocation: targetLoc, state, time };
      const targetResult = await runAgentTurn(targetAgent, targetPerception, targetCtx);

      for (const a of targetResult.actions) {
        phoneActions[targetAgent].push(a);
        if (a.type === "speak" && a.text) {
          conversationLog.push(`${targetName}: "${a.text}"`);
          if (logLevel !== "minimal") console.log(`    ${targetName}: "${a.text}"`);
        } else if (a.type === "do" && a.text && HANGUP_PATTERN.test(a.text)) {
          conversationLog.push(`${targetName} hangs up.`);
          ended = true;
          break;
        }
      }
      // If target only waited, end call
      if (targetResult.actions.every(a => a.type === "wait" || a.type === "think")) {
        ended = true;
      }
    }

    // Push phone actions into agentFullResults so memory picks them up
    if (!agentFullResults[callerAgent]) agentFullResults[callerAgent] = [];
    agentFullResults[callerAgent].push(...phoneActions[callerAgent]);
    if (!agentFullResults[targetAgent]) agentFullResults[targetAgent] = [];
    agentFullResults[targetAgent].push(...phoneActions[targetAgent]);

    // Log phone conversation in locationResults
    const phoneLocKey = `[Call: ${callerName} ↔ ${targetName}]`;
    const phoneRounds: TickLogRound[] = [{
      round: 1,
      actions: [
        { agent: callerAgent, tool_calls: phoneActions[callerAgent].map(a => actionToLogEntry(a)) },
        { agent: targetAgent, tool_calls: phoneActions[targetAgent].map(a => actionToLogEntry(a)) },
      ],
    }];
    locationResults[phoneLocKey] = { agents: [callerAgent, targetAgent], rounds: phoneRounds };

    // Clean up pending call
    delete state.pending_calls[target];
  }
}

// ─── Build Perception ───────────────────────────────────────

function buildPerception(
  agent: AgentName,
  location: string,
  time: SimTime,
  weather: string,
  state: WorldState,
  sounds: string[],
  messages: string,
  bodyStr: string,
  financeStr: string,
): string {
  const lines: string[] = [];

  // Time, location, weather
  lines.push(`${time.timeLabel}. ${location}. ${weather}.`);

  // Return from work context — tell the agent what happened (nothing) to prevent hallucination
  if (state.returned_from_work?.[agent]) {
    lines.push(`You just got back. ${workMemorySummary(agent)}`);
    state.returned_from_work[agent] = false;
  }

  // Who's here (use acquaintance names or descriptions)
  const others: string[] = [];
  const otherAgentKeys: AgentName[] = [];
  for (const [a, loc] of Object.entries(state.agent_locations)) {
    if (a !== agent && loc === location) {
      const aName = a as AgentName;
      otherAgentKeys.push(aName);
      others.push(describeAgent(aName, agent, state));
    }
  }
  if (others.length > 0) {
    lines.push(others.map(n => `${n} is here.`).join(" "));
  } else {
    lines.push("You are alone.");
  }

  // Cohabitant absence — where is your partner/roommate?
  const cohabitants = COHABITANTS[agent] || [];
  for (const cohabName of cohabitants) {
    if (!others.includes(cohabName)) {
      // Find the cohabitant's agent key
      const cohabAgent = AGENT_NAMES.find(a => AGENT_DISPLAY_NAMES[a] === cohabName);
      if (cohabAgent) {
        const cohabLoc = state.agent_locations[cohabAgent];
        if (cohabLoc === "away") {
          lines.push(`${cohabName} is away (${awayReason(cohabAgent)}).`);
        } else if (cohabLoc && cohabLoc !== location) {
          lines.push(`${cohabName} is not here.`);
        }
      }
    }
  }

  // External location context — you are a customer, it closes
  const hours = LOCATION_HOURS[location];
  if (hours) {
    const timeLeft = hours.close - time.hour;
    if (timeLeft <= 1) {
      lines.push(`${location} is closing soon. You're a customer.`);
    } else {
      lines.push(`${location} is open until ${hours.close}:00. You're a customer.`);
    }
  } else if (location === "Backyard") {
    lines.push("You're in the building's backyard.");
  }

  // Visible shared objects at this location
  const visibleObjects = getVisibleSharedObjects(location, state, time.dayNumber);
  for (const obj of visibleObjects) {
    lines.push(obj.label);
  }

  // Incoming messages/calls
  if (messages) {
    lines.push(messages);
  }

  // Sounds from adjacent apartments
  if (sounds.length > 0) {
    lines.push(sounds.join(" "));
  }

  // Body state
  if (bodyStr) {
    lines.push(bodyStr);
  }

  // Fridge contents (only when at home)
  const agentHome = AGENT_HOMES[agent];
  if (location === agentHome && state.fridges?.[agentHome]) {
    const fridge = state.fridges[agentHome];
    if (fridge.items.length === 0) {
      lines.push("Fridge: empty.");
    } else {
      const itemStrs = fridge.items.map(i =>
        i.quantity > 1 ? `${i.name} (${i.quantity}x)` : i.name
      );
      lines.push(`Fridge: ${itemStrs.join(", ")}.`);
    }
  }

  // Finance info
  if (financeStr) {
    lines.push(financeStr);
  }

  // Action feedback from last tick (failed actions, corrections)
  const feedback = state.action_feedback?.[agent];
  if (feedback && feedback.length > 0) {
    for (const fb of feedback) {
      lines.push(`[${fb}]`);
    }
    state.action_feedback[agent] = [];
  }

  // Deadline countdown for agents who know about the eviction letter
  if (state.brief_knowledge?.[agent]) {
    const DEADLINE_DAY = 14;
    const DEADLINE_HOUR = 22;
    const daysLeft = DEADLINE_DAY - time.dayNumber;
    if (daysLeft > 1) {
      lines.push(`(Objection deadline: ${daysLeft} days left.)`);
    } else if (daysLeft === 1) {
      lines.push(`(Objection deadline: 1 day left. Tomorrow is the last day.)`);
    } else if (daysLeft === 0) {
      const hoursLeft = DEADLINE_HOUR - time.hour;
      if (hoursLeft > 0) {
        lines.push(`(Objection deadline: ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"} left. TODAY is the last day!)`);
      }
    }
    if (state.objection_filed) {
      lines.push("(Objection has been filed.)");
    }
  }

  return lines.join("\n");
}

// ─── Helper: Convert action to log entry ───────────────────

function actionToLogEntry(a: ResolvedAction): { tool: string; args: Record<string, unknown>; result: string } {
  const args: Record<string, unknown> = {};
  if (a.text) args.text = a.text;
  if (a.location) args.location = a.location;
  if (a.target) args.target = a.target;
  if (a.object_id) args.object_id = a.object_id;
  if (a.to) args.to = a.to;
  return { tool: a.type, args, result: a.result };
}

// ─── Helper: Log actions to console ────────────────────────

function logActions(result: AgentTurnResult, logLevel: string): void {
  if (logLevel === "minimal") return;
  for (const action of result.actions) {
    if (action.type === "speak") {
      console.log(`    ${AGENT_DISPLAY_NAMES[result.agent]}: "${action.text}"`);
    } else if (action.type === "do") {
      console.log(`    ${AGENT_DISPLAY_NAMES[result.agent]}: ${action.text}`);
    } else if (action.type === "think" && logLevel === "verbose") {
      console.log(`    ${AGENT_DISPLAY_NAMES[result.agent]} [thinks]: ${(action.text || "").substring(0, 80)}`);
    } else if (action.type === "knock_door") {
      console.log(`    ${AGENT_DISPLAY_NAMES[result.agent]}: knocks at ${action.target}'s`);
    } else if (action.type === "move_to") {
      console.log(`    ${AGENT_DISPLAY_NAMES[result.agent]}: → ${action.location}`);
    } else if (action.type === "send_message") {
      console.log(`    ${AGENT_DISPLAY_NAMES[result.agent]}: 📱 → ${action.to || action.target}`);
    }
  }
}

// ─── Process Monthly Finances ──────────────────────────────

function handleMonthlyFinances(state: WorldState, time: SimTime): Record<string, string[]> {
  // Process on day 1 of each month (every 30 days)
  if (time.hour !== 7 || ((time.dayNumber - 1) % 30) !== 0 || time.dayNumber === 1) return {};

  const monthlyEvents: Record<string, string[]> = {};
  for (const agent of AGENT_NAMES) {
    const finances = state.finances[agent];
    if (finances) {
      monthlyEvents[agent] = processMonthly(agent, finances);
    }
  }
  return monthlyEvents;
}

// ─── Fridge Processing ──────────────────────────────────────

const FOOD_PATTERNS: Record<string, string> = {
  "milk": "Milk",
  "bread": "Bread",
  "dark bread": "Dark bread",
  "cheese": "Cheese",
  "butter": "Butter",
  "eggs": "Eggs",
  "egg ": "Eggs",
  "pasta": "Pasta",
  "noodle": "Pasta",
  "tomato sauce": "Tomato sauce",
  "sauce": "Tomato sauce",
  "fruit": "Fruit",
  "apple": "Apples",
  "water": "Water",
  "soup": "Canned soup",
  "vegetable": "Vegetables",
  "beer": "Beer",
  "sausage": "Sausage",
  "yogurt": "Yogurt",
  "rice": "Rice",
  "cornflakes": "Cornflakes",
  "toast": "Toast",
  "jam": "Jam",
  "coffee": "Coffee",
  "tea": "Tea",
};

function processFridgeActions(
  agent: AgentName,
  actions: ResolvedAction[],
  location: string,
  state: WorldState,
): void {
  const home = AGENT_HOMES[agent];

  // Shopping at Späti → add items to home fridge
  if (location === "Späti") {
    for (const action of actions) {
      if (action.type !== "do" || !action.text) continue;
      const text = action.text.toLowerCase();
      if (!/buy|pay|grab|take|shelf|checkout/i.test(text)) continue;

      const fridge = state.fridges[home];
      if (!fridge) continue;

      let addedAny = false;
      for (const [pattern, itemName] of Object.entries(FOOD_PATTERNS)) {
        if (text.includes(pattern)) {
          const existing = fridge.items.find(i => i.name === itemName);
          if (existing) {
            existing.quantity += 1;
          } else {
            fridge.items.push({ name: itemName, quantity: 1 });
          }
          addedAny = true;
        }
      }

      // Generic shopping without specific items → add basics
      if (!addedAny && /groceries|shopping|food/i.test(text)) {
        const basics = ["Bread", "Milk", "Cheese"];
        for (const item of basics) {
          const existing = fridge.items.find(i => i.name === item);
          if (existing) {
            existing.quantity += 1;
          } else {
            fridge.items.push({ name: item, quantity: 1 });
          }
        }
      }
    }
  }

  // Eating/cooking at home → remove items from fridge
  if (location === home) {
    const fridge = state.fridges[home];
    if (!fridge || fridge.items.length === 0) return;

    for (const action of actions) {
      if (action.type !== "do" || !action.text) continue;
      const text = action.text.toLowerCase();

      // Taking items out of fridge (even if not eating yet)
      if (/fridge|take out|get out|pull out/i.test(text)) {
        // Find which item they're taking
        for (const item of [...fridge.items]) {
          const itemLower = item.name.toLowerCase();
          if (text.includes(itemLower)) {
            item.quantity -= 1;
            if (item.quantity <= 0) {
              fridge.items = fridge.items.filter(i => i !== item);
            }
            break;
          }
        }
        continue; // don't double-count as eating
      }

      // Check if they ate/cooked a specific item
      let consumed = false;
      for (const item of [...fridge.items]) {
        const itemLower = item.name.toLowerCase();
        if (text.includes(itemLower)) {
          item.quantity -= 1;
          if (item.quantity <= 0) {
            fridge.items = fridge.items.filter(i => i !== item);
          }
          consumed = true;
          break;
        }
      }

      // Generic eating/cooking → consume first available item
      if (!consumed && /eat|eats|cook|breakfast|lunch|dinner|scramble|fry|pan|stove|prepare/i.test(text)) {
        if (fridge.items.length > 0) {
          fridge.items[0].quantity -= 1;
          if (fridge.items[0].quantity <= 0) {
            fridge.items.shift();
          }
        }
      }
    }
  }
}

// ─── Main Tick Handler ──────────────────────────────────────

async function handleTick(
  tick: number,
  time: SimTime,
): Promise<TickLog> {
  const logLevel = process.env.LOG_LEVEL || "normal";

  // Read state
  const state = readWorldState();

  // Migration guards for phone system
  if (!state.phone_contacts) state.phone_contacts = { marco: ["sarah"], sarah: ["marco"], marta: [], rolf: [], hakim: [], suki: [] };
  if (!state.pending_calls) state.pending_calls = {};

  // Migration guards for endgame tracking
  if (!state.brief_knowledge) {
    state.brief_knowledge = { marco: false, sarah: false, marta: false, suki: false, hakim: false, rolf: false };
  }
  if (!state.objection_signers) {
    state.objection_signers = { marco: false, sarah: false, marta: false, suki: false, hakim: false, rolf: false };
  }
  if (state.objection_filed === undefined) state.objection_filed = false;

  // First tick of a new day?
  const isNewDay = time.hour === 7;
  const prevDayNumber = tick > 1 ? tickToTime(tick - 1).dayNumber : 0;
  const dayChanged = time.dayNumber !== prevDayNumber;

  // Morning reset: everyone goes home overnight
  if (dayChanged) {
    morningReset(state, logLevel);
    injectSleepMemory(time, state);
  }

  // Place scheduled objects on new days
  if (dayChanged) {
    const newObjects = placeScheduledObjects(time.dayNumber, state);
    if (newObjects.length > 0 && logLevel !== "minimal") {
      console.log(`  [Objects] ${newObjects.length} new objects placed`);
    }
    cleanExpiredObjects(state, time.dayNumber);
  }

  // Update weather (changes daily)
  if (dayChanged || !state.weather) {
    state.weather = getWeather(time.dayNumber);
  }

  // Enforce closing hours — kick agents out of closed locations
  enforceClosingHours(time, state, logLevel);

  // Monthly finances
  const monthlyEvents = handleMonthlyFinances(state, time);

  // Determine which agents are awake and available
  const awakeAgents: AgentName[] = [];
  const awayAgents: AgentName[] = [];

  for (const agent of AGENT_NAMES) {
    if (isAway(agent, time)) {
      awayAgents.push(agent);
      state.agent_locations[agent] = "away";
    } else {
      // If agent was away and just returned, place at home + flag + inject work memory
      if (state.agent_locations[agent] === "away") {
        state.agent_locations[agent] = AGENT_HOMES[agent];
        if (!state.returned_from_work) state.returned_from_work = {};
        state.returned_from_work[agent] = true;

        // Inject work memory so the LLM doesn't hallucinate work events
        injectWorkMemory(agent, time, workMemorySummary(agent), workHours(agent));
      }
      awakeAgents.push(agent);
    }
  }

  if (logLevel !== "minimal") {
    if (awayAgents.length > 0) {
      const awayNames = awayAgents.map(a => `${AGENT_DISPLAY_NAMES[a]} (${awayReason(a)})`).join(", ");
      console.log(`  [Away] ${awayNames}`);
    }
  }

  // Update body states for all awake agents
  for (const agent of awakeAgents) {
    if (state.body[agent]) {
      updateBodyState(state.body[agent], time);
    }
  }

  // One-time Hausverwaltung SMS: nudge agents to check their mailbox (Day 7 — same day letters arrive)
  if (time.dayNumber >= 7 && !state.brief_reminder_sent) {
    for (const agent of AGENT_NAMES) {
      if (!state.message_queue[agent]) state.message_queue[agent] = [];
      state.message_queue[agent].push({
        from: "Hausverwaltung Krüger GmbH",
        type: "message",
        text: "Dear tenants, there is a letter from the property management in your mailbox. Please take note. Best regards, Krüger GmbH",
        sent_tick: time.tick,
      });
    }
    state.brief_reminder_sent = true;
    if (logLevel !== "minimal") {
      console.log("  [SMS] Hausverwaltung Krüger GmbH → all tenants: mailbox notice");
    }
  }

  // One-time law firm ad: phone notification about legal help (Day 8+)
  const anyoneKnows = Object.values(state.brief_knowledge).some(v => v);
  if (time.dayNumber >= 8 && anyoneKnows && !state.kanzlei_ad_sent) {
    for (const agent of AGENT_NAMES) {
      if (!state.message_queue[agent]) state.message_queue[agent] = [];
      state.message_queue[agent].push({
        from: "Advertisement",
        type: "message",
        text: "Received an eviction notice? Fischer & Roth Law Firm — Tenant law specialists. Free initial consultation. Call: Fischer & Roth",
        sent_tick: time.tick,
      });
    }
    state.kanzlei_ad_sent = true;
    if (logLevel !== "minimal") {
      console.log("  [Ad] Fischer & Roth Law Firm → all tenants: tenant law help");
    }
  }

  // Collect previous tick's actions for sounds (will be populated as we go)
  const allTickActions: Record<string, ResolvedAction[]> = {};

  // Group awake agents by location
  const agentsByLocation: Record<string, AgentName[]> = {};
  for (const agent of awakeAgents) {
    const loc = state.agent_locations[agent] || AGENT_HOMES[agent];
    if (!agentsByLocation[loc]) agentsByLocation[loc] = [];
    agentsByLocation[loc].push(agent);
  }

  // Log locations
  if (logLevel !== "minimal") {
    for (const [loc, agents] of Object.entries(agentsByLocation)) {
      const names = agents.map(a => AGENT_DISPLAY_NAMES[a]).join(", ");
      console.log(`  [Location] ${loc}: ${names}`);
    }
  }

  // Process all locations
  const locationResults: Record<string, TickLogLocation> = {};
  const allMovements: { agent: string; from: string; to: string }[] = [];
  const agentFullResults: Record<string, ResolvedAction[]> = {};

  // Process each location group
  const locationPromises = Object.entries(agentsByLocation).map(
    async ([location, agents]) => {
      const rounds: TickLogRound[] = [];
      const encounterType = agents.length > 1 ? getEncounterType(location) : "passing";
      const maxR = agents.length > 1 ? maxRounds(encounterType, agents as AgentName[]) : 1;

      const isSolo = agents.length === 1;
      const conversationSoFar: string[] = [];
      const activeAgents = [...agents];

      if (isSolo) {
        // --- SOLO: single agent, one call ---
        const agent = agents[0];
        const messages = deliverMessages(state, agent, time.tick);
        const bodyStr = state.body[agent] ? bodyPerception(state.body[agent]) : "";
        const isMonthStart = time.hour === 7 && ((time.dayNumber - 1) % 30) === 0 && time.dayNumber > 1;
        const finStr = state.finances[agent]
          ? financePerception(state.finances[agent], isMonthStart, monthlyEvents[agent])
          : "";
        const sounds = getSounds(agent, location, allTickActions, state.agent_locations);
        const perception = buildPerception(
          agent, location, time, state.weather, state,
          sounds, messages, bodyStr, finStr,
        );
        const context: ResolveContext = { agent, agentLocation: location, state, time };
        const result = await runAgentTurn(agent, perception, context);
        logActions(result, logLevel);
        handleServiceInteractions(result.actions, location, agent, state, null, null, logLevel);
        if (result.pendingMove) {
          allMovements.push({ agent, from: location, to: result.pendingMove });
        }
        if (!agentFullResults[agent]) agentFullResults[agent] = [];
        agentFullResults[agent].push(...result.actions);
        allTickActions[agent] = result.actions;
        rounds.push({
          round: 1,
          actions: [{ agent, tool_calls: result.actions.map(a => actionToLogEntry(a)) }],
        });
      } else {
        // --- MULTI-AGENT: fully sequential from Round 1 ---
        const suppress = shouldSuppressInteraction(agents, location, time.tick, state, allMovements);

        if (suppress) {
          // Cooldown: each agent gets a solo call but no conversation
          if (logLevel === "verbose") {
            console.log(`    [Cooldown] ${agents.map(a => AGENT_DISPLAY_NAMES[a]).join(", ")} — nothing new`);
          }
          const round1Actions: { agent: AgentName; tool_calls: { tool: string; args: Record<string, unknown>; result: string }[] }[] = [];
          for (const agent of agents) {
            const messages = deliverMessages(state, agent, time.tick);
            const bodyStr = state.body[agent] ? bodyPerception(state.body[agent]) : "";
            const isMonthStart = time.hour === 7 && ((time.dayNumber - 1) % 30) === 0 && time.dayNumber > 1;
            const finStr = state.finances[agent]
              ? financePerception(state.finances[agent], isMonthStart, monthlyEvents[agent])
              : "";
            const sounds = getSounds(agent, location, allTickActions, state.agent_locations);
            const perception = buildPerception(
              agent, location, time, state.weather, state,
              sounds, messages, bodyStr, finStr,
            );
            const context: ResolveContext = { agent, agentLocation: location, state, time };
            const result = await runAgentTurn(agent, perception, context);
            logActions(result, logLevel);
            handleServiceInteractions(result.actions, location, agent, state, null, null, logLevel);
            if (result.pendingMove) {
              allMovements.push({ agent, from: location, to: result.pendingMove });
            }
            if (!agentFullResults[agent]) agentFullResults[agent] = [];
            agentFullResults[agent].push(...result.actions);
            allTickActions[agent] = result.actions;
            round1Actions.push({ agent, tool_calls: result.actions.map(a => actionToLogEntry(a)) });
          }
          rounds.push({ round: 1, actions: round1Actions });
        } else {
          // Sequential conversation: Round 1 is also sequential
          const pendingDeliveries: string[] = [];
          for (let round = 1; round <= maxR; round++) {
            // Deliver pending food/drinks from previous round
            if (pendingDeliveries.length > 0) {
              for (const d of pendingDeliveries) {
                conversationSoFar.push(d);
                if (logLevel !== "minimal") console.log(`    ${d}`);
              }
              pendingDeliveries.length = 0;
            }
            let anyoneSpoke = false;
            const roundActions: { agent: AgentName; tool_calls: { tool: string; args: Record<string, unknown>; result: string }[] }[] = [];

            for (const agent of [...activeAgents]) {
              let perception: string;

              if (round === 1 && conversationSoFar.length === 0) {
                // First agent in Round 1: full perception, no conversation context yet
                const messages = deliverMessages(state, agent, time.tick);
                const bodyStr = state.body[agent] ? bodyPerception(state.body[agent]) : "";
                const isMonthStart = time.hour === 7 && ((time.dayNumber - 1) % 30) === 0 && time.dayNumber > 1;
                const finStr = state.finances[agent]
                  ? financePerception(state.finances[agent], isMonthStart, monthlyEvents[agent])
                  : "";
                const sounds = getSounds(agent, location, allTickActions, state.agent_locations);
                perception = buildPerception(
                  agent, location, time, state.weather, state,
                  sounds, messages, bodyStr, finStr,
                );
              } else if (round === 1) {
                // Subsequent agents in Round 1: full perception + what was said so far
                const messages = deliverMessages(state, agent, time.tick);
                const bodyStr = state.body[agent] ? bodyPerception(state.body[agent]) : "";
                const isMonthStart = time.hour === 7 && ((time.dayNumber - 1) % 30) === 0 && time.dayNumber > 1;
                const finStr = state.finances[agent]
                  ? financePerception(state.finances[agent], isMonthStart, monthlyEvents[agent])
                  : "";
                const sounds = getSounds(agent, location, allTickActions, state.agent_locations);
                const base = buildPerception(
                  agent, location, time, state.weather, state,
                  sounds, messages, bodyStr, finStr,
                );
                perception = `${base}\n\nCurrent conversation:\n${conversationSoFar.join("\n")}\n\nYour turn.`;
              } else {
                // Round 2+: conversation context only
                perception = `${time.timeLabel}. ${location}. ${state.weather}.\n\nCurrent conversation:\n${conversationSoFar.join("\n")}\n\nYour turn.`;
              }

              const context: ResolveContext = { agent, agentLocation: location, state, time };
              let result: AgentTurnResult;
              try {
                result = await runAgentTurn(agent, perception, context);
              } catch (err) {
                console.error(`  [ERROR] ${AGENT_DISPLAY_NAMES[agent]} LLM call failed: ${(err as Error).message?.slice(0, 80)}`);
                // Fall back to a wait action so the simulation can continue
                result = { agent, actions: [{ type: "wait", result: "", visible: false }] };
              }
              logActions(result, logLevel);

              // Add visible actions to conversation history
              for (const a of result.actions) {
                if (a.type === "speak" && a.result) {
                  conversationSoFar.push(a.result);
                  anyoneSpoke = true;
                } else if (a.type === "do" && a.visible && a.result) {
                  conversationSoFar.push(a.result);
                  anyoneSpoke = true;
                } else if (a.type === "move_to") {
                  conversationSoFar.push(`${AGENT_DISPLAY_NAMES[agent]} leaves.`);
                  allMovements.push({ agent, from: location, to: a.location || "" });
                }
              }

              // Service staff responses (Zum Anker, Späti)
              handleServiceInteractions(result.actions, location, agent, state, conversationSoFar, pendingDeliveries, logLevel);

              if (!agentFullResults[agent]) agentFullResults[agent] = [];
              agentFullResults[agent].push(...result.actions);
              allTickActions[agent] = result.actions;
              roundActions.push({ agent, tool_calls: result.actions.map(a => actionToLogEntry(a)) });

              // Remove from active if they moved away
              if (result.pendingMove) {
                const idx = activeAgents.indexOf(agent);
                if (idx >= 0) activeAgents.splice(idx, 1);
              }
            }

            rounds.push({ round, actions: roundActions });

            // Exit if nobody spoke this round or <2 agents remain
            if (!anyoneSpoke || activeAgents.length < 2) break;
          }

          // Remaining deliveries after conversation ends → action_feedback
          if (pendingDeliveries.length > 0) {
            for (const a of agents) {
              if (!state.action_feedback[a]) state.action_feedback[a] = [];
              for (const d of pendingDeliveries) {
                state.action_feedback[a].push(d);
              }
            }
            if (logLevel !== "minimal") {
              for (const d of pendingDeliveries) console.log(`    ${d}`);
            }
          }

          recordInteraction(agents, location, time.tick);
        }
      }

      locationResults[location] = { agents, rounds };
    },
  );

  await Promise.all(locationPromises);

  // Resolve movements — update agent_locations
  for (const move of allMovements) {
    state.agent_locations[move.agent] = move.to;
  }

  // Update acquaintances: agents who interacted learn each other's names
  if (!state.acquaintances) state.acquaintances = {};
  for (const [location, locData] of Object.entries(locationResults)) {
    if (!locData.agents || locData.agents.length < 2) continue;
    // If any speech happened, agents at this location now know each other
    const hasSpeech = locData.rounds.some(r =>
      r.actions.some(a => a.tool_calls.some(tc => tc.tool === "speak")),
    );
    if (hasSpeech) {
      for (const a of locData.agents) {
        if (!state.acquaintances[a]) state.acquaintances[a] = [];
        if (!state.phone_contacts[a]) state.phone_contacts[a] = [];
        for (const b of locData.agents) {
          if (a !== b) {
            if (!state.acquaintances[a].includes(b)) {
              state.acquaintances[a].push(b);
            }
            if (!state.phone_contacts[a].includes(b)) {
              state.phone_contacts[a].push(b);
            }
          }
        }
      }
    }
  }

  // Track brief knowledge and agreement from conversations
  const BRIEF_KEYWORDS = /letter|eviction|rent increase|objection|property management|krüger|werther|vesta|owner|displacement|renovation|modernization|law firm|§574|§573/i;
  const AGREEMENT_KEYWORDS = /\b(yes|in|sign|i'll do|count me|sure|absolutely|agreed|together|let's do|me too|of course|certainly|definitely)\b/i;

  for (const [, locData] of Object.entries(locationResults)) {
    if (!locData.agents || locData.agents.length < 2) continue;

    // Collect all speech at this location
    const allSpeech: { agent: string; text: string }[] = [];
    for (const round of locData.rounds) {
      for (const agentActions of round.actions) {
        for (const tc of agentActions.tool_calls) {
          if (tc.tool === "speak" && tc.args.text) {
            allSpeech.push({ agent: agentActions.agent, text: tc.args.text as string });
          }
        }
      }
    }

    // Did anyone mention the brief?
    const briefMentioned = allSpeech.some(s => BRIEF_KEYWORDS.test(s.text));
    if (briefMentioned) {
      // All agents present now know about the brief
      for (const agent of locData.agents) {
        if (!state.brief_knowledge[agent]) {
          state.brief_knowledge[agent] = true;
          if (logLevel !== "minimal") {
            console.log(`  [Letter] ${AGENT_DISPLAY_NAMES[agent as AgentName]} learns about the eviction`);
          }
        }
      }
      // Check for agreement from agents who now know
      for (const speech of allSpeech) {
        const agent = speech.agent;
        if (state.brief_knowledge[agent] && AGREEMENT_KEYWORDS.test(speech.text)) {
          if (!state.objection_signers[agent]) {
            state.objection_signers[agent] = true;
            if (logLevel !== "minimal") {
              console.log(`  [Signature] ${AGENT_DISPLAY_NAMES[agent as AgentName]} agrees to the objection`);
            }
          }
        }
      }
    }
  }

  // Resolve pending phone calls (pickup → conversation, no pickup → feedback)
  await resolvePhoneCalls(state, time, agentFullResults, locationResults, logLevel);

  // Track brief knowledge from phone conversations (resolvePhoneCalls adds to locationResults)
  for (const [locKey, locData] of Object.entries(locationResults)) {
    if (!locKey.startsWith("[Call:")) continue;
    if (!locData.agents || locData.agents.length < 2) continue;

    const phoneSpeech: { agent: string; text: string }[] = [];
    for (const round of locData.rounds) {
      for (const agentActions of round.actions) {
        for (const tc of agentActions.tool_calls) {
          if (tc.tool === "speak" && tc.args.text) {
            phoneSpeech.push({ agent: agentActions.agent, text: tc.args.text as string });
          }
        }
      }
    }

    const briefOnPhone = phoneSpeech.some(s => BRIEF_KEYWORDS.test(s.text));
    if (briefOnPhone) {
      for (const agent of locData.agents) {
        if (!state.brief_knowledge[agent]) {
          state.brief_knowledge[agent] = true;
          if (logLevel !== "minimal") {
            console.log(`  [Letter/Phone] ${AGENT_DISPLAY_NAMES[agent as AgentName]} learns about the eviction`);
          }
        }
      }
      for (const speech of phoneSpeech) {
        if (state.brief_knowledge[speech.agent] && AGREEMENT_KEYWORDS.test(speech.text)) {
          if (!state.objection_signers[speech.agent]) {
            state.objection_signers[speech.agent] = true;
            if (logLevel !== "minimal") {
              console.log(`  [Signature/Phone] ${AGENT_DISPLAY_NAMES[speech.agent as AgentName]} agrees`);
            }
          }
        }
      }
    }
  }

  // Process body actions (eating, etc.)
  for (const agent of awakeAgents) {
    const actions = agentFullResults[agent] || [];
    const agentLoc = state.agent_locations[agent] || AGENT_HOMES[agent];
    if (state.body[agent]) {
      processBodyActions(state.body[agent], actions);
    }
    if (state.finances[agent]) {
      processSpending(state.finances[agent], actions, agentLoc);
    }
  }

  // Process fridge: eating removes items, shopping adds items
  for (const agent of awakeAgents) {
    const actions = agentFullResults[agent] || [];
    const agentLoc = state.agent_locations[agent] || AGENT_HOMES[agent];
    processFridgeActions(agent, actions, agentLoc, state);
  }

  // Update agent memories
  for (const agent of awakeAgents) {
    const actions = agentFullResults[agent] || [];
    if (actions.length === 0) continue;

    const location = state.agent_locations[agent] || AGENT_HOMES[agent];
    const otherNames: string[] = [];
    for (const [a, loc] of Object.entries(state.agent_locations)) {
      if (a !== agent && loc === location) {
        otherNames.push(AGENT_DISPLAY_NAMES[a as AgentName] || a);
      }
    }

    updateAgentMemoryFromActions(agent, time, location, otherNames, actions);
    updateRelationships(agent, actions, otherNames);
  }

  // Check endgame condition: deadline is Day 14, 22:00
  const DEADLINE_DAY = 14;
  const DEADLINE_HOUR = 22;
  if (time.dayNumber > DEADLINE_DAY || (time.dayNumber === DEADLINE_DAY && time.hour >= DEADLINE_HOUR)) {
    if (!state.simulation_result) {
      const allKnow = AGENT_NAMES.every(a => state.brief_knowledge[a]);
      const signerCount = Object.values(state.objection_signers).filter(v => v).length;
      const signerNames = AGENT_NAMES.filter(a => state.objection_signers[a]).map(a => AGENT_DISPLAY_NAMES[a]);
      const missingNames = AGENT_NAMES.filter(a => !state.objection_signers[a]).map(a => AGENT_DISPLAY_NAMES[a]);
      const uninformedNames = AGENT_NAMES.filter(a => !state.brief_knowledge[a]).map(a => AGENT_DISPLAY_NAMES[a]);

      if (state.objection_filed && signerCount >= 4 && allKnow) {
        state.simulation_result = {
          result: "PASS",
          message: `Objection filed. ${signerCount}/6 signatures. All tenants informed.`,
          details: { signers: signerNames, missing: missingNames },
        };
      } else {
        state.simulation_result = {
          result: "FAIL",
          message: "Deadline expired.",
          details: {
            filed: state.objection_filed,
            signerCount,
            signers: signerNames,
            unsigned: missingNames,
            allInformed: allKnow,
            uninformed: uninformedNames,
          },
        };
      }

      const r = state.simulation_result;
      console.log(`\n╔══════════════════════════════════════════╗`);
      console.log(`║  ENDGAME: ${r.result === "PASS" ? "PASSED" : "FAILED"}${" ".repeat(30 - (r.result === "PASS" ? 6 : 6))}║`);
      console.log(`╠══════════════════════════════════════════╣`);
      console.log(`║  ${r.message}`);
      if (r.result === "PASS") {
        console.log(`║  Signers: ${signerNames.join(", ")}`);
      } else {
        console.log(`║  Objection filed: ${state.objection_filed ? "Yes" : "No"}`);
        console.log(`║  Signatures: ${signerCount}/6 (${signerNames.join(", ") || "none"})`);
        console.log(`║  All informed: ${allKnow ? "Yes" : `No (${uninformedNames.join(", ")})`}`);
      }
      console.log(`╚══════════════════════════════════════════╝`);
    }
  }

  // Update world state
  state.current_tick = tick;
  state.current_time = time.timeLabel;
  writeWorldState(state);

  // Build tick log
  const tickLog: TickLog = {
    tick,
    simulated_time: time.timeLabel,
    is_night: false,
    environment: {
      weather: state.weather,
    },
    locations: locationResults,
    movements: allMovements,
    world_state_summary: `Day ${time.dayNumber}, ${awakeAgents.length} active, ${awayAgents.length} away`,
  };

  writeTickLog(tick, tickLog);
  return tickLog;
}

// ─── Main Engine ───────────────────────────────────────────

export async function runTick(tick: number): Promise<TickLog> {
  const time = tickToTime(tick);
  const logLevel = process.env.LOG_LEVEL || "normal";

  console.log(
    `\n═══ Tick ${tick} — ${time.timeLabel} (Day ${time.dayNumber}, W${time.weekNumber}) ═══`,
  );

  const startTime = Date.now();
  const tickLog = await handleTick(tick, time);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const stats = getLLMStats();

  if (logLevel !== "minimal") {
    console.log(
      `  [${elapsed}s | LLM: ${stats.totalCalls} calls | ~${stats.totalTokensIn} tokens]`,
    );
  }

  return tickLog;
}

export async function runSimulation(
  startTick: number = 1,
  singleTick: boolean = false,
): Promise<void> {
  const tickInterval = parseInt(process.env.TICK_INTERVAL_MS || "0");

  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║       HAUSWELT: ENDGAME                  ║`);
  console.log(`║   14 days to file the objection           ║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  Start: Tick ${startTick} (${tickToTime(startTick).timeLabel})`);
  console.log(`║  Character Model: ${process.env.CHARACTER_MODEL || "haiku"}`);
  console.log(`║  Tick Interval: ${tickInterval}ms`);
  console.log(`║  Ctrl+C to stop`);
  console.log(`╚══════════════════════════════════════════╝`);

  let tick = startTick;

  while (true) {
    try {
      await runTick(tick);
    } catch (error) {
      console.error(`\n[ERROR] Tick ${tick} failed:`, error);
      console.error(`Resume with: npm run resume`);

      const ws = readWorldState();
      ws.current_tick = tick - 1;
      writeWorldState(ws);
      throw error;
    }

    // Check if endgame resolved
    const ws = readWorldState();
    if (ws.simulation_result) {
      console.log(`\n  Simulation ended: ${ws.simulation_result.result}`);
      break;
    }

    if (singleTick) break;

    tick++;

    if (tickInterval > 0) {
      await new Promise(resolve => setTimeout(resolve, tickInterval));
    }
  }

  const stats = getLLMStats();
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║         SIMULATION PAUSED                ║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  Last tick: ${tick}`);
  console.log(`║  Total LLM calls: ${stats.totalCalls}`);
  console.log(`║  Estimated tokens: ~${stats.totalTokensIn}`);
  console.log(`╚══════════════════════════════════════════╝`);
}
