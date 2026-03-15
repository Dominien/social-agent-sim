import type { AgentName, SimTime } from "./types.js";
import { isWeekday } from "./time.js";

/**
 * Returns true if the agent is away from the building (at work/uni/daycare).
 * Away agents get no LLM calls during those hours.
 */
export function isAway(agent: AgentName, time: SimTime): boolean {
  // Rolf: construction worker, works Mon-Fri 8-17
  if (agent === "rolf" && isWeekday(time) && time.hour >= 8 && time.hour <= 17) return true;

  // Hakim: IT consultant, at client Mon-Fri 9-18
  if (agent === "hakim" && isWeekday(time) && time.hour >= 9 && time.hour <= 18) return true;

  // Sarah: daycare, works Wed/Thu/Fri 8-15
  if (agent === "sarah" && ["Wednesday", "Thursday", "Friday"].includes(time.dayOfWeek)
    && time.hour >= 8 && time.hour <= 15) return true;

  // Suki: student, at uni Mon-Fri 8-12 (not every day — 60% chance she's there)
  // Note: we use deterministic check based on tick to avoid randomness issues
  if (agent === "suki" && isWeekday(time) && time.hour >= 8 && time.hour <= 12) {
    // Use tick number to deterministically decide if she goes to uni today
    // She goes ~3 out of 5 weekdays
    const dayHash = (time.dayNumber * 7 + 3) % 5;
    if (dayHash < 3) return true;
  }

  // Marco: works remote → never away
  // Marta: retired → never away
  return false;
}

/**
 * Returns a human-readable reason for being away (for logging).
 */
export function awayReason(agent: AgentName): string {
  switch (agent) {
    case "rolf": return "Work (construction site)";
    case "hakim": return "Work (client)";
    case "sarah": return "Work (daycare)";
    case "suki": return "University";
    default: return "Away";
  }
}
