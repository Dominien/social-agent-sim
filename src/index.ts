import "dotenv/config";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  unlinkSync,
  copyFileSync,
  mkdirSync,
} from "fs";
import { join } from "path";
import { readWorldState } from "./memory.js";
import { runSimulation } from "./engine.js";
import { runInterview } from "./interview.js";

const DATA_DIR = join(process.cwd(), "data");
const INITIAL_MEMORIES_DIR = join(DATA_DIR, "memory_initial");

// ─── Initial memory backups for reset ──────────────────────

function backupInitialMemories(): void {
  if (!existsSync(INITIAL_MEMORIES_DIR)) {
    mkdirSync(INITIAL_MEMORIES_DIR, { recursive: true });
    const memoryDir = join(DATA_DIR, "memory");
    for (const file of readdirSync(memoryDir)) {
      if (file.endsWith(".md")) {
        copyFileSync(join(memoryDir, file), join(INITIAL_MEMORIES_DIR, file));
      }
    }
  }
}

function resetSimulation(): void {
  console.log("Resetting simulation to initial state...\n");

  // Restore initial memories
  if (existsSync(INITIAL_MEMORIES_DIR)) {
    const memoryDir = join(DATA_DIR, "memory");
    for (const file of readdirSync(INITIAL_MEMORIES_DIR)) {
      copyFileSync(join(INITIAL_MEMORIES_DIR, file), join(memoryDir, file));
    }
    console.log("  Restored initial memory files.");
  }

  // Reset world state
  const initialWorldState = {
    current_tick: 0,
    current_time: "Simulation not started",
    weather: "Cloudy, 8°C",
    agent_locations: {
      marco: "Apartment 5",
      sarah: "Apartment 5",
      marta: "Apartment 1",
      rolf: "Apartment 3",
      hakim: "Apartment 4",
      suki: "Apartment 6",
    },
    body: {
      marco: { hunger: 1, energy: 9, sleep_quality: "good" },
      sarah: { hunger: 1, energy: 9, sleep_quality: "good" },
      marta: { hunger: 1, energy: 8, sleep_quality: "fair" },
      rolf: { hunger: 2, energy: 7, sleep_quality: "fair" },
      hakim: { hunger: 1, energy: 9, sleep_quality: "good" },
      suki: { hunger: 2, energy: 8, sleep_quality: "good" },
    },
    finances: {
      marco: { balance: 4000, monthly_income: 2800, current_rent: 580, new_rent: null },
      sarah: { balance: 2000, monthly_income: 1400, current_rent: 0, new_rent: null },
      marta: { balance: 8000, monthly_income: 1200, current_rent: 420, new_rent: null },
      rolf: { balance: 1500, monthly_income: 2200, current_rent: 480, new_rent: null },
      hakim: { balance: 35000, monthly_income: 5500, current_rent: 620, new_rent: null },
      suki: { balance: 600, monthly_income: 800, current_rent: 380, new_rent: null },
    },
    fridges: {
      "Apartment 1": { items: [{name:"Milk",quantity:1},{name:"Bread",quantity:1},{name:"Butter",quantity:1},{name:"Eggs",quantity:3}] },
      "Apartment 3": { items: [{name:"Bread",quantity:1},{name:"Cheese",quantity:1},{name:"Beer",quantity:3}] },
      "Apartment 4": { items: [{name:"Bread",quantity:1},{name:"Cheese",quantity:1},{name:"Milk",quantity:1}] },
      "Apartment 5": { items: [{name:"Pasta",quantity:2},{name:"Cheese",quantity:1},{name:"Milk",quantity:1},{name:"Eggs",quantity:4}] },
      "Apartment 6": { items: [{name:"Bread",quantity:1},{name:"Cheese",quantity:1}] },
    },
    doors: {
      "Apartment 1": "unlocked",
      "Apartment 3": "unlocked",
      "Apartment 4": "unlocked",
      "Apartment 5": "unlocked",
      "Apartment 6": "unlocked",
    },
    message_queue: {
      marco: [] as unknown[],
      sarah: [] as unknown[],
      marta: [] as unknown[],
      rolf: [] as unknown[],
      hakim: [] as unknown[],
      suki: [] as unknown[],
    },
    objects: [] as unknown[],
    action_feedback: {
      marco: [] as string[],
      sarah: [] as string[],
      marta: [] as string[],
      rolf: [] as string[],
      hakim: [] as string[],
      suki: [] as string[],
    },
    acquaintances: {
      marco: ["sarah"],       // lives with Sarah
      sarah: ["marco"],       // lives with Marco
      marta: ["marco", "sarah", "rolf", "hakim", "suki"],  // 25 years, knows everyone
      rolf: ["marta"],        // Marta fixed his faucet story
      hakim: ["marta"],       // Marta is persistent
      suki: [] as string[],   // new, knows nobody
    },
    phone_contacts: {
      marco: ["sarah"],       // cohabitants have each other's numbers
      sarah: ["marco"],
      marta: [] as string[],
      rolf: [] as string[],
      hakim: [] as string[],
      suki: [] as string[],
    },
    pending_calls: {} as Record<string, string>,
    returned_from_work: {
      marco: false,
      sarah: false,
      marta: false,
      rolf: false,
      hakim: false,
      suki: false,
    },
    brief_reminder_sent: false,
    brief_knowledge: {
      marco: false,
      sarah: false,
      marta: false,
      rolf: false,
      hakim: false,
      suki: false,
    },
    objection_signers: {
      marco: false,
      sarah: false,
      marta: false,
      rolf: false,
      hakim: false,
      suki: false,
    },
    objection_filed: false,
  };

  writeFileSync(
    join(DATA_DIR, "world_state.json"),
    JSON.stringify(initialWorldState, null, 2),
  );
  console.log("  Reset world state.");

  // Reset object schedule (unmark placed flags)
  const schedulePath = join(DATA_DIR, "object_schedule.json");
  if (existsSync(schedulePath)) {
    const schedule = JSON.parse(readFileSync(schedulePath, "utf-8"));
    for (const entry of schedule) {
      entry.placed = false;
    }
    writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));
    console.log("  Reset object schedule.");
  }

  // Reset objects.json
  writeFileSync(join(DATA_DIR, "objects.json"), "[]");

  // Clear logs
  const logsDir = join(DATA_DIR, "logs");
  if (existsSync(logsDir)) {
    for (const file of readdirSync(logsDir)) {
      if (file.endsWith(".json")) {
        unlinkSync(join(logsDir, file));
      }
    }
    console.log("  Cleared tick logs.");
  }

  console.log("\nSimulation reset complete. Run `npm start` to begin.\n");
}

// ─── Graceful Shutdown ──────────────────────────────────────

function setupShutdown(): void {
  let shuttingDown = false;

  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("\n\nShutting down gracefully...");
    console.log("Resume with: npm run resume");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// ─── CLI ───────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle --reset
  if (args.includes("--reset")) {
    resetSimulation();
    return;
  }

  setupShutdown();

  // Backup initial memories on first run
  backupInitialMemories();

  // Handle --interview <agent>
  const interviewIdx = args.indexOf("--interview");
  if (interviewIdx >= 0) {
    const agentName = args[interviewIdx + 1];
    if (!agentName) {
      console.log("Usage: npm run interview -- <agent>");
      console.log("Agents: Marco, Sarah, Marta, Rolf, Hakim, Suki");
      return;
    }
    await runInterview(agentName);
    return;
  }

  // Handle --resume
  if (args.includes("--resume")) {
    const worldState = readWorldState();
    const lastTick = worldState.current_tick;
    console.log(`Resuming from tick ${lastTick + 1}...`);
    await runSimulation(lastTick + 1);
    return;
  }

  // Handle --tick-once
  if (args.includes("--tick-once")) {
    const worldState = readWorldState();
    const nextTick = worldState.current_tick + 1;
    await runSimulation(nextTick, true);
    return;
  }

  // Handle --from N
  const fromIdx = args.indexOf("--from");
  if (fromIdx >= 0 && args[fromIdx + 1]) {
    const from = parseInt(args[fromIdx + 1]);
    await runSimulation(from);
    return;
  }

  // Default: start from beginning or resume
  const worldState = readWorldState();
  if (worldState.current_tick > 0) {
    console.log(`Simulation in progress (tick ${worldState.current_tick}).`);
    console.log("Use --resume to continue or --reset to start over.");
    return;
  }

  await runSimulation();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
