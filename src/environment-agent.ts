import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { SimTime, WorldState, WorldObject, ObjectScheduleEntry, AgentName } from "./types.js";
import { AGENT_NAMES } from "./types.js";

const DATA_DIR = join(process.cwd(), "data");

// ─── Weather Table ──────────────────────────────────────────

const WEATHER_TABLE = [
  "Cloudy, 8°C",
  "Sunny, 12°C",
  "Rain, 6°C",
  "Overcast, 10°C",
  "Foggy, 4°C",
  "Partly cloudy, 15°C",
  "Cold and clear, 2°C",
  "Drizzle, 7°C",
  "Warm, 18°C",
  "Grey, 9°C",
  "Cloudy, 11°C",
  "Sunny and mild, 16°C",
  "Rain and wind, 5°C",
  "Overcast, 7°C",
];

export function getWeather(dayNumber: number): string {
  const base = (dayNumber - 1) % WEATHER_TABLE.length;
  // Slight variation: every 3rd day, shift by 1
  const variation = dayNumber % 3 === 0 ? 1 : 0;
  return WEATHER_TABLE[(base + variation) % WEATHER_TABLE.length];
}

// ─── Object Placement ───────────────────────────────────────

function readObjectContent(filePath: string): string {
  try {
    const fullPath = join(process.cwd(), filePath);
    return readFileSync(fullPath, "utf-8").trim();
  } catch {
    return "";
  }
}

export function placeScheduledObjects(dayNumber: number, state: WorldState): WorldObject[] {
  const schedulePath = join(DATA_DIR, "object_schedule.json");
  let schedule: ObjectScheduleEntry[];
  try {
    schedule = JSON.parse(readFileSync(schedulePath, "utf-8"));
  } catch {
    return [];
  }

  const newObjects: WorldObject[] = [];

  for (const entry of schedule) {
    if (entry.trigger.day !== dayNumber || entry.placed) continue;

    for (const objDef of entry.objects) {
      if (objDef.target === "*") {
        // One per agent (e.g., letters in mailboxes)
        for (const agent of AGENT_NAMES) {
          const id = (objDef.id_template || objDef.id || "").replace("{agent}", agent);
          const location = (objDef.location_template || objDef.location || "").replace("{agent}", agent);

          let content = objDef.content || "";
          if (objDef.content_file) {
            const contentFile = objDef.content_file.replace("{agent}", agent);
            content = readObjectContent(contentFile);
          }

          const obj: WorldObject = {
            id,
            type: objDef.type,
            label: objDef.label,
            location,
            content,
            placed_day: dayNumber,
            discovered_by: [],
            read_by: [],
            visibility: objDef.visibility,
            duration_days: objDef.duration_days,
          };

          state.objects.push(obj);
          newObjects.push(obj);
        }
      } else {
        // Single object
        const id = objDef.id || objDef.id_template || `obj_${dayNumber}_${newObjects.length}`;
        let content = objDef.content || "";
        if (objDef.content_file) {
          content = readObjectContent(objDef.content_file);
        }

        const obj: WorldObject = {
          id,
          type: objDef.type,
          label: objDef.label,
          location: objDef.location || "",
          content,
          placed_day: dayNumber,
          discovered_by: [],
          read_by: [],
          visibility: objDef.visibility,
          duration_days: objDef.duration_days,
        };

        state.objects.push(obj);
        newObjects.push(obj);
      }
    }

    entry.placed = true;
  }

  // Write back the schedule with placed flags
  if (newObjects.length > 0) {
    writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));
  }

  return newObjects;
}

// ─── Get Visible Objects ─────────────────────────────────────

/**
 * Get objects visible to an agent at a specific location.
 * - Private objects (mailbox): only returned for check_mailbox action
 * - Shared objects: auto-visible when agent is at that location
 * - Presence objects: auto-visible, temporary
 */
export function getVisibleSharedObjects(location: string, state: WorldState, dayNumber: number): WorldObject[] {
  return state.objects.filter(obj => {
    if (obj.visibility !== "shared") return false;
    if (obj.location !== location) return false;
    // Check expiry for presence type
    if (obj.type === "presence" && obj.duration_days) {
      if (dayNumber > obj.placed_day + obj.duration_days) return false;
    }
    return true;
  });
}

/**
 * Get mailbox objects for an agent.
 */
export function getMailboxObjects(agent: AgentName, state: WorldState): WorldObject[] {
  return state.objects.filter(obj => {
    if (obj.visibility !== "private") return false;
    if (obj.location !== `briefkasten:${agent}`) return false;
    return true;
  });
}

/**
 * Clean up expired presence objects.
 */
export function cleanExpiredObjects(state: WorldState, dayNumber: number): void {
  state.objects = state.objects.filter(obj => {
    if (obj.type === "presence" && obj.duration_days) {
      return dayNumber <= obj.placed_day + obj.duration_days;
    }
    return true;
  });
}
