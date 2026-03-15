// ─── Agent Types ───────────────────────────────────────────

export type AgentName = "marco" | "sarah" | "marta" | "hakim" | "suki" | "rolf";

export const AGENT_NAMES: AgentName[] = ["marco", "sarah", "marta", "hakim", "suki", "rolf"];

export const AGENT_DISPLAY_NAMES: Record<AgentName, string> = {
  marco: "Marco",
  sarah: "Sarah",
  marta: "Marta",
  hakim: "Hakim",
  suki: "Suki",
  rolf: "Rolf",
};

export const AGENT_HOMES: Record<AgentName, string> = {
  marta: "Apartment 1",
  rolf: "Apartment 3",
  hakim: "Apartment 4",
  marco: "Apartment 5",
  sarah: "Apartment 5",
  suki: "Apartment 6",
};

// ─── Location Types ────────────────────────────────────────

export const LOCATIONS = [
  "Apartment 1",
  "Apartment 2",
  "Apartment 3",
  "Apartment 4",
  "Apartment 5",
  "Apartment 6",
  "Stairwell",
  "Entrance Hall",
  "Mailboxes",
  "Backyard",
  "Späti",
  "Zum Anker",
] as const;

export type Location = (typeof LOCATIONS)[number];

// ─── Time Types ────────────────────────────────────────────

export interface SimTime {
  tick: number;           // absolute counter (hours since start)
  hour: number;           // 7-22 for day, -1 for night
  dayOfWeek: string;      // "Monday", "Tuesday", etc.
  dayNumber: number;      // 1, 2, 3, ... (infinite)
  weekNumber: number;     // 1, 2, 3, ...
  isNight: boolean;       // true during 23-07
  timeLabel: string;      // "Tuesday, 14:00"
}

// ─── World Objects ─────────────────────────────────────────

export interface WorldObject {
  id: string;
  type: "brief" | "aushang" | "presence" | "zettel";
  label: string;
  location: string;
  content: string;
  placed_day: number;
  discovered_by: string[];
  read_by: string[];
  visibility: "private" | "shared";
  duration_days?: number;
}

// ─── Encounter Types ───────────────────────────────────────

export type EncounterType = "passing" | "coincidence" | "deliberate";

// ─── Action Types ──────────────────────────────────────────

export type AgentActionType =
  | "speak"
  | "think"
  | "do"
  | "wait"
  | "move_to"
  | "check_mailbox"
  | "read"
  | "knock_door"
  | "lock_door"
  | "unlock_door"
  | "send_message"
  | "phone_call"
  | "leave_note"
  | "file_objection"
  | "check_deadline";

export interface AgentAction {
  type: AgentActionType;
  text?: string;
  location?: string;
  target?: string;
  object_id?: string;
  to?: string;
  signers?: string[];
}

export interface ResolvedAction extends AgentAction {
  result: string;
  visible: boolean;
}

export interface AgentTurnResult {
  agent: AgentName;
  actions: ResolvedAction[];
  pendingMove?: string;
}

// ─── Body State ────────────────────────────────────────────

export interface BodyState {
  hunger: number;          // 0 (full) to 5 (very hungry)
  energy: number;          // 0 (exhausted) to 10 (rested)
  sleep_quality: "good" | "fair" | "poor";
}

export interface FridgeItem {
  name: string;
  quantity: number;
}

export interface Fridge {
  items: FridgeItem[];
}

// ─── Finances ──────────────────────────────────────────────

export interface AgentFinances {
  balance: number;
  monthly_income: number;
  current_rent: number;
  new_rent: number | null;
}

// ─── Message Queue ─────────────────────────────────────────

export interface QueuedMessage {
  from: string;
  type: "message" | "missed_call" | "incoming_call";
  text?: string;
  sent_tick: number;
}

// ─── World State (persisted) ───────────────────────────────

export interface WorldState {
  current_tick: number;
  current_time: string;
  weather: string;
  agent_locations: Record<string, string>;
  body: Record<string, BodyState>;
  finances: Record<string, AgentFinances>;
  fridges: Record<string, Fridge>;
  doors: Record<string, "locked" | "unlocked">;
  message_queue: Record<string, QueuedMessage[]>;
  objects: WorldObject[];
  action_feedback: Record<string, string[]>;
  acquaintances: Record<string, string[]>;
  phone_contacts: Record<string, string[]>;
  pending_calls: Record<string, string>;  // target → caller (waiting for pickup)
  returned_from_work: Record<string, boolean>;
  brief_reminder_sent?: boolean;
  brief_knowledge: Record<string, boolean>;
  objection_signers: Record<string, boolean>;
  objection_filed: boolean;
  kanzlei_ad_sent?: boolean;
  simulation_result?: { result: "PASS" | "FAIL"; message: string; details: Record<string, unknown> };
}

// ─── Tick Log ──────────────────────────────────────────────

export interface TickLogRound {
  round: number;
  actions: {
    agent: string;
    tool_calls: { tool: string; args: Record<string, unknown>; result: string }[];
  }[];
}

export interface TickLogLocation {
  agents: string[];
  rounds: TickLogRound[];
}

export interface TickLog {
  tick: number;
  simulated_time: string;
  is_night: boolean;
  environment?: {
    weather: string;
  };
  locations: Record<string, TickLogLocation>;
  movements: { agent: string; from: string; to: string }[];
  world_state_summary: string;
}

// ─── Object Schedule ───────────────────────────────────────

export interface ObjectScheduleEntry {
  trigger: { day: number };
  comment?: string;
  placed: boolean;
  objects: ObjectScheduleDef[];
}

export interface ObjectScheduleDef {
  id?: string;
  id_template?: string;
  type: WorldObject["type"];
  label: string;
  target?: string;
  location?: string;
  location_template?: string;
  content?: string;
  content_file?: string;
  visibility: "private" | "shared";
  duration_days?: number;
}
