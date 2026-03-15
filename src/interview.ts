import { createInterface } from "readline";
import type { AgentName } from "./types.js";
import { AGENT_NAMES, AGENT_DISPLAY_NAMES, AGENT_HOMES } from "./types.js";
import { readWorldState, readAgentProfile, readAgentMemory } from "./memory.js";
import { callClaude } from "./llm.js";
import { tickToTime } from "./time.js";
import { bodyPerception } from "./body.js";

function buildInterviewPrompt(
  agent: AgentName,
  conversationSoFar: string[],
  question: string,
): string {
  const name = AGENT_DISPLAY_NAMES[agent];
  const profile = readAgentProfile(agent);
  const memory = readAgentMemory(agent);
  const state = readWorldState();

  const location = state.agent_locations[agent] || AGENT_HOMES[agent];
  const time = state.current_tick > 0 ? tickToTime(state.current_tick) : null;
  const timeStr = time ? time.timeLabel : "Afternoon";
  const body = state.body[agent] ? bodyPerception(state.body[agent]) : "";

  const history = conversationSoFar.length > 0
    ? "\nConversation so far:\n" + conversationSoFar.join("\n") + "\n"
    : "";

  return `You are ${name}.

${profile}

${memory}

---

${timeStr}. ${location}. ${state.weather || "Cloudy."} ${body}

Someone is asking you questions. Answer as ${name} — naturally, in your own words. No JSON. Speak the way you always do. Brief and honest.
${history}
Question: "${question}"

${name}:`;
}

export async function runInterview(agentInput: string): Promise<void> {
  const agentKey = agentInput.toLowerCase() as AgentName;
  if (!AGENT_NAMES.includes(agentKey)) {
    console.log(`\nUnknown agent: "${agentInput}"`);
    console.log(`Available agents: ${AGENT_NAMES.map(a => AGENT_DISPLAY_NAMES[a]).join(", ")}`);
    return;
  }

  const name = AGENT_DISPLAY_NAMES[agentKey];
  const model = process.env.CHARACTER_MODEL || "haiku";

  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  INTERVIEW: ${name}${" ".repeat(Math.max(0, 28 - name.length))}║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  Ask ${name} anything.                     `);
  console.log(`║  Type "exit" to quit.                    `);
  console.log(`╚══════════════════════════════════════════╝\n`);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const conversationHistory: string[] = [];

  const askQuestion = (): void => {
    rl.question("You: ", async (question) => {
      const q = question.trim();
      if (!q || q.toLowerCase() === "exit" || q.toLowerCase() === "quit") {
        console.log(`\n${name}: "Bye."\n`);
        rl.close();
        return;
      }

      try {
        const prompt = buildInterviewPrompt(agentKey, conversationHistory, q);
        const response = await callClaude(prompt, { model });

        console.log(`\n${name}: ${response}\n`);

        conversationHistory.push(`Question: "${q}"`);
        conversationHistory.push(`${name}: ${response}`);
      } catch (err) {
        console.error(`\n[Error] ${err}\n`);
      }

      askQuestion();
    });
  };

  askQuestion();

  // Keep alive until readline closes
  await new Promise<void>((resolve) => {
    rl.on("close", resolve);
  });
}
