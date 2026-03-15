import type { BodyState, SimTime, ResolvedAction } from "./types.js";

/**
 * Update body state each tick. Pure code drift.
 */
export function updateBodyState(state: BodyState, time: SimTime): void {
  // Hunger increases every ~4 hours
  if (time.hour % 4 === 0) {
    state.hunger = Math.min(5, state.hunger + 1);
  }

  // Energy decreases in the afternoon/evening
  if (time.hour >= 14) {
    state.energy = Math.max(0, Math.round((state.energy - 0.5) * 10) / 10);
  }

  // Sleep quality randomized each morning (first tick of day)
  if (time.hour === 7) {
    const roll = Math.random();
    state.sleep_quality = roll < 0.5 ? "good" : roll < 0.85 ? "fair" : "poor";
    // Reset energy based on sleep quality
    state.energy = state.sleep_quality === "good" ? 9 : state.sleep_quality === "fair" ? 7 : 5;
    // Reset hunger
    state.hunger = 1;
  }
}

/**
 * Check agent actions for eating/cooking and update body state accordingly.
 */
export function processBodyActions(state: BodyState, actions: ResolvedAction[]): void {
  for (const action of actions) {
    if (action.type !== "do" || !action.text) continue;
    const text = action.text.toLowerCase();

    // Eating/cooking reduces hunger
    if (text.includes("eat") || text.includes("eats") || text.includes("cook") ||
        text.includes("breakfast") || text.includes("dinner") || text.includes("lunch") ||
        text.includes("bread") || text.includes("cornflakes") || text.includes("toast")) {
      state.hunger = Math.max(0, state.hunger - 2);
    }

    // Coffee/tea gives slight energy boost
    if (text.includes("coffee") || text.includes("tea")) {
      state.energy = Math.min(10, state.energy + 0.5);
    }
  }
}

/**
 * Build body state perception string for the agent.
 */
export function bodyPerception(state: BodyState): string {
  const parts: string[] = [];

  if (state.hunger >= 4) {
    parts.push("You're very hungry.");
  } else if (state.hunger >= 3) {
    parts.push("You're hungry.");
  }

  if (state.energy <= 3) {
    parts.push("You're very tired.");
  } else if (state.energy <= 5) {
    parts.push("You're tired.");
  }

  if (state.sleep_quality === "poor") {
    parts.push("You slept poorly last night.");
  }

  return parts.length > 0 ? `(${parts.join(" ")})` : "";
}
