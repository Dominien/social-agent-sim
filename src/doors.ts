import type { AgentName, WorldState } from "./types.js";
import { AGENT_HOMES, AGENT_DISPLAY_NAMES } from "./types.js";

/**
 * Lock the agent's door.
 */
export function lockDoor(state: WorldState, agent: AgentName): string {
  const home = AGENT_HOMES[agent];
  state.doors[home] = "locked";
  return "You lock the door.";
}

/**
 * Unlock the agent's door.
 */
export function unlockDoor(state: WorldState, agent: AgentName): string {
  const home = AGENT_HOMES[agent];
  state.doors[home] = "unlocked";
  return "You unlock the door.";
}

/**
 * Resolve a knock_door action.
 * Returns result string for the knocking agent.
 * Also queues a sound for the target if they're home.
 */
export function resolveKnock(
  state: WorldState,
  knocker: AgentName,
  targetName: string,
): { result: string; targetHome: boolean; doorOpen: boolean } {
  // Find target agent
  const target = Object.entries(AGENT_DISPLAY_NAMES).find(
    ([, name]) => name.toLowerCase() === targetName.toLowerCase(),
  )?.[0] as AgentName | undefined;

  if (!target) {
    return { result: `Nobody named ${targetName} lives here.`, targetHome: false, doorOpen: false };
  }

  const targetHome = AGENT_HOMES[target];
  const currentLocation = state.agent_locations[target];
  const isHome = currentLocation === targetHome;

  if (!isHome) {
    return { result: "Nobody opens.", targetHome: false, doorOpen: false };
  }

  const doorState = state.doors[targetHome] || "unlocked";
  if (doorState === "locked") {
    return { result: "Nobody opens.", targetHome: true, doorOpen: false };
  }

  return {
    result: `${AGENT_DISPLAY_NAMES[target]} opens the door.`,
    targetHome: true,
    doorOpen: true,
  };
}

/**
 * Get the apartment name from a target name (for knock perception).
 */
export function getAgentApartment(targetName: string): string | null {
  const target = Object.entries(AGENT_DISPLAY_NAMES).find(
    ([, name]) => name.toLowerCase() === targetName.toLowerCase(),
  )?.[0] as AgentName | undefined;

  if (!target) return null;
  return AGENT_HOMES[target];
}
