import type { AgentName, QueuedMessage, SimTime, WorldState } from "./types.js";
import { AGENT_DISPLAY_NAMES } from "./types.js";

/**
 * Queue a text message from one agent to another.
 */
export function queueMessage(
  state: WorldState,
  from: AgentName,
  to: string,
  text: string,
  tick: number,
): void {
  const targetAgent = to.toLowerCase() as AgentName;
  if (!state.message_queue[targetAgent]) {
    state.message_queue[targetAgent] = [];
  }
  state.message_queue[targetAgent].push({
    from,
    type: "message",
    text,
    sent_tick: tick,
  });
}

/**
 * Queue a phone call attempt.
 * If target is away or unreachable, queues as missed_call.
 * If target is home, queues as incoming_call (handled next tick).
 */
export function queuePhoneCall(
  state: WorldState,
  from: AgentName,
  target: string,
  tick: number,
  targetIsAway: boolean,
): string {
  const targetAgent = target.toLowerCase() as AgentName;
  if (!state.message_queue[targetAgent]) {
    state.message_queue[targetAgent] = [];
  }

  if (targetIsAway) {
    // Target is away — caller gets immediate feedback
    state.message_queue[targetAgent].push({
      from,
      type: "missed_call",
      sent_tick: tick,
    });
    return "Voicemail. No answer.";
  }

  // Target is home — they'll see "incoming_call" next tick
  state.message_queue[targetAgent].push({
    from,
    type: "incoming_call",
    sent_tick: tick,
  });
  return "Ringing...";
}

/**
 * Build perception text from queued messages for an agent.
 * Consumes the queue (messages are removed after delivery).
 */
export function deliverMessages(state: WorldState, agent: AgentName, currentTick: number): string {
  const queue = state.message_queue[agent];
  if (!queue || queue.length === 0) return "";

  const lines: string[] = [];

  for (const msg of queue) {
    const fromName = AGENT_DISPLAY_NAMES[msg.from as AgentName] || msg.from;
    const hoursSince = currentTick - msg.sent_tick;
    const timeAgo = hoursSince <= 1 ? "just now" : `${hoursSince} hours ago`;

    switch (msg.type) {
      case "message":
        lines.push(`Message from ${fromName} (${timeAgo}): "${msg.text}"`);
        break;
      case "missed_call":
        lines.push(`Missed call from ${fromName} (${timeAgo}).`);
        break;
      case "incoming_call":
        lines.push(`Your phone is ringing. ${fromName} is calling.`);
        break;
    }
  }

  // Clear the queue after delivery
  state.message_queue[agent] = [];

  return lines.join("\n");
}
