import type { AgentName, ResolvedAction } from "./types.js";

// Adjacency map: which locations can hear each other
const ADJACENCY: Record<string, string[]> = {
  "Apartment 1": ["Stairwell"],
  "Apartment 3": ["Stairwell", "Apartment 4"],
  "Apartment 4": ["Stairwell", "Apartment 3"],
  "Apartment 5": ["Stairwell", "Apartment 4"],
  "Apartment 6": ["Stairwell", "Apartment 5"],
};

// Keywords that indicate loud actions
const LOUD_KEYWORDS = [
  "music", "drill", "hammer", "hammering", "scream", "yell", "bang",
  "door slam", "crying", "cries", "sobbing", "vacuum", "loud",
  "hits", "throws", "rumble", "stomp",
];

function isLoudAction(text: string): boolean {
  const lower = text.toLowerCase();
  return LOUD_KEYWORDS.some(k => lower.includes(k));
}

function describeLoudAction(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("music")) return "Loud music";
  if (lower.includes("drill") || lower.includes("hammer")) return "Drilling or hammering";
  if (lower.includes("scream") || lower.includes("yell")) return "Someone screaming";
  if (lower.includes("crying") || lower.includes("cries") || lower.includes("sobbing")) return "Someone crying";
  if (lower.includes("vacuum")) return "Vacuum cleaner";
  if (lower.includes("bang") || lower.includes("hits") || lower.includes("throws")) return "Loud noise";
  if (lower.includes("rumble") || lower.includes("stomp")) return "Rumbling";
  return "Loud noise";
}

/**
 * Get sounds audible to an agent based on what other agents did this tick.
 * @param agent The listening agent
 * @param agentLocation Where the listening agent is
 * @param allActions Map of agent -> their actions this tick (only agents at their apartments)
 * @param agentLocations Map of agent -> current location
 */
export function getSounds(
  agent: AgentName,
  agentLocation: string,
  allActions: Record<string, ResolvedAction[]>,
  agentLocations: Record<string, string>,
): string[] {
  const sounds: string[] = [];
  const hearable = ADJACENCY[agentLocation];
  if (!hearable) return sounds;

  for (const [otherAgent, actions] of Object.entries(allActions)) {
    if (otherAgent === agent) continue;
    const otherLocation = agentLocations[otherAgent];
    if (!otherLocation || !hearable.includes(otherLocation)) continue;

    let hasVoice = false;
    let hasLoud = false;
    let loudDesc = "";

    for (const action of actions) {
      if (action.type === "speak" && !hasVoice) {
        hasVoice = true;
      }
      if (action.type === "do" && action.text && isLoudAction(action.text) && !hasLoud) {
        hasLoud = true;
        loudDesc = describeLoudAction(action.text);
      }
    }

    if (hasVoice) {
      sounds.push(`Muffled voices from ${otherLocation}.`);
    }
    if (hasLoud) {
      sounds.push(`${loudDesc} from ${otherLocation}.`);
    }
  }

  return sounds;
}
