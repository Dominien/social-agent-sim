import type { AgentAction, AgentName, ResolvedAction, WorldState, WorldObject } from "./types.js";
import { AGENT_DISPLAY_NAMES, AGENT_NAMES, LOCATIONS } from "./types.js";
import { lockDoor, unlockDoor, resolveKnock } from "./doors.js";
import { queueMessage, queuePhoneCall } from "./messages.js";
import { getMailboxObjects } from "./environment-agent.js";
import { isAway } from "./away.js";
import type { SimTime } from "./types.js";

// ─── Action Schema (embedded in agent prompts) ────────────

export const ACTION_SCHEMA_PROMPT = `Respond ONLY with a JSON object:
{
  "actions": [
    { "type": "think", "text": "..." },
    { "type": "speak", "text": "..." }
  ]
}

Available actions:
- think: Inner thought. Fields: text. Nobody hears it.
- speak: Say something. Fields: text. Everyone at the same location hears it.
- do: Do something. Fields: text. Everyone at the same location sees it.
- wait: Do nothing. No fields.
- move_to: Go somewhere. Fields: location. Locations: ${[...LOCATIONS].join(", ")}
- check_mailbox: Check mailbox. No fields.
- read: Read a letter or note. Fields: object_id.
- knock_door: Knock on a neighbor's door. Fields: target (first name).
- lock_door: Lock your own door. No fields.
- unlock_door: Unlock your own door. No fields.
- send_message: Send a text message. Fields: to (first name), text.
- phone_call: Call someone. Fields: target (first name, or: 112, Police, Doctor).
- leave_note: Leave a note. Fields: location (e.g. "Notice board", "Apartment 1 door"), text.
- file_objection: File an objection against the eviction. Fields: signers (list of names of all tenants who agreed, e.g. ["Marco", "Sarah"]).
- check_deadline: Check how much time is left for the objection. No fields.`;

// ─── Resolve Context ────────────────────────────────────────

export interface ResolveContext {
  agent: AgentName;
  agentLocation: string;
  state: WorldState;
  time: SimTime;
}

// ─── Filing Intent Resolution ─────────────────────────────

function resolveFilingIntent(
  action: AgentAction,
  agent: AgentName,
  name: string,
  state: WorldState,
): ResolvedAction {
  // Check all agents informed
  const allKnow = AGENT_NAMES.every(a => state.brief_knowledge?.[a]);
  if (!allKnow) {
    const uninformed = AGENT_NAMES.filter(a => !state.brief_knowledge?.[a]).map(a => AGENT_DISPLAY_NAMES[a]);
    return { ...action, result: `[Not yet possible] Not all tenants have been informed. ${uninformed.join(", ")} still ${uninformed.length === 1 ? "needs" : "need"} to be told.`, visible: false };
  }

  // Check enough signers
  const signers = AGENT_NAMES.filter(a => state.objection_signers?.[a]);
  if (signers.length < 4) {
    const missing = AGENT_NAMES.filter(a => !state.objection_signers?.[a]).map(a => AGENT_DISPLAY_NAMES[a]);
    return { ...action, result: `[Not yet possible] At least 4 signatures required, you have ${signers.length}. Still unsigned: ${missing.join(", ")}.`, visible: false };
  }

  // All conditions met — file it
  state.objection_filed = true;
  const signerNames = signers.map(a => AGENT_DISPLAY_NAMES[a]).join(", ");
  return { ...action, result: `${name} files the objection. Signers: ${signerNames} (${signers.length}/6). The objection is sent to Werther & Partner law firm. Filed.`, visible: true };
}

// ─── Phone Helpers ────────────────────────────────────────

function resolveHausarztCall(time: SimTime): string {
  const isWeekday = !["Saturday", "Sunday"].includes(time.dayOfWeek);
  const isOpen = isWeekday && time.hour >= 8 && time.hour <= 17;
  if (!isOpen) {
    return `Office closed. Hours: Mon-Fri 8am-5pm. Emergency: 112.`;
  }
  return `Dr. Weber's office: "Hello, Dr. Weber's office. How can I help you?" (Appointments available. Walk-in hours Mon-Fri 8-10am.)`;
}

function scheduleEmergencyResponse(state: WorldState, time: SimTime, caller: AgentName): void {
  // Add ambulance presence object that appears at Entrance Hall
  // It will be visible to agents there for 2 days (i.e., until resolved)
  const ambulanceObj: WorldObject = {
    id: `ambulance_${time.tick}`,
    type: "presence",
    label: `Two paramedics with a stretcher and emergency kit are standing in the entrance. They ask: "Who called? Where is the patient?"`,
    location: "Entrance Hall",
    content: "",
    placed_day: time.dayNumber,
    discovered_by: [],
    read_by: [],
    visibility: "shared",
    duration_days: 1,
  };
  state.objects.push(ambulanceObj);
}

// ─── Resolve Action ───────────────────────────────────────

export function resolveAction(
  action: AgentAction,
  context: ResolveContext,
): ResolvedAction {
  const { agent, agentLocation, state, time } = context;
  const name = AGENT_DISPLAY_NAMES[agent];

  switch (action.type) {
    case "speak":
      return { ...action, result: `${name} says: "${action.text}"`, visible: true };

    case "think":
      return { ...action, result: `[Thought] ${action.text}`, visible: false };

    case "do": {
      const doText = action.text || "";
      const doLower = doText.toLowerCase();

      // Phone pickup detection
      if (/pick.*up|answer.*phone|answers.*phone|picks up|answers.*call|gets.*phone|ans.*phone/i.test(doLower)) {
        if (state.pending_calls?.[agent]) {
          const callerName = AGENT_DISPLAY_NAMES[state.pending_calls[agent] as AgentName];
          return { ...action, result: `${name} picks up. ${callerName} is on the line.`, visible: false };
        }
        return { ...action, result: `The phone isn't ringing.`, visible: false };
      }

      // Mailbox actions: if at Mailboxes, resolve as actual check
      if (/mailbox|mail\s*(check|get|open|pick)|briefkasten|post\s*(holen|check)/i.test(doLower)) {
        if (agentLocation !== "Mailboxes" && agentLocation !== "Entrance Hall") {
          return { ...action, result: `[Can't do that] You're not at the mailboxes. They're on the ground floor — use move_to.`, visible: false };
        }
        // Treat as check_mailbox
        const mailObjects = getMailboxObjects(agent, state);
        const unread = mailObjects.filter(o => !o.discovered_by.includes(agent));
        for (const obj of unread) { obj.discovered_by.push(agent); }
        const allInBox = mailObjects.filter(o => !o.read_by.includes(agent));
        if (allInBox.length === 0) {
          return { ...action, result: `${name} opens the mailbox. Mailbox is empty.`, visible: true };
        }
        const descs = allInBox.map(o => `${o.label} (ID: ${o.id})`);
        return { ...action, result: `${name} opens the mailbox. Contents: ${descs.join("; ")}`, visible: true };
      }

      if (/doctor|hospital|emergency room|arzt.*geh|krankenhaus|notaufnahme/i.test(doLower)) {
        return { ...action, result: `[Can't do that] You can't leave the building. Call the doctor (phone_call → Doctor) or 112 for emergencies.`, visible: false };
      }

      if (/shop|supermarket|store|grocer|einkauf|laden/i.test(doLower) && agentLocation !== "Späti") {
        return { ...action, result: `[Can't do that] To go shopping, go to the Späti first (move_to → Späti).`, visible: false };
      }

      // Catch hallucinated phone/photo/video actions
      if (/photo|video|picture|show.*phone|phone.*show|selfie|screenshot|foto|bild/i.test(doLower)) {
        return { ...action, result: `Your phone shows nothing special. Contacts, messages, apps.`, visible: false };
      }

      // Catch 112/emergency as do-action (should use phone_call)
      if (/112|notruf|emergency|ambulance/i.test(doLower) && !/phone_call/.test(doLower)) {
        return { ...action, result: `To reach emergency services, use phone_call with target "112".`, visible: false };
      }

      // Catch objection-filing intent → auto-file if conditions met
      const isFilingIntent =
        /objection.*(file|submit|send|deliver|hand|bring)/i.test(doLower) ||
        /file.*objection/i.test(doLower) ||
        /(statement|document|papers).*(file|submit|deliver|send|bring)/i.test(doLower) ||
        /(law firm|fischer).*(bring|go|deliver|hand)/i.test(doLower) ||
        /personally.*(deliver|hand|file|bring)/i.test(doLower) ||
        /(bring|go|drive|take).*(?:to|at).*(?:law firm|fischer|lawyer)/i.test(doLower) ||
        /form.*(fill|submit|file)/i.test(doLower) ||
        /widerspruch.*(einreich|abschick|absend|abgeb|send)/i.test(doLower) ||
        /(kanzlei|fischer).*(bring|geh|abgeb)/i.test(doLower);

      if (isFilingIntent) {
        return resolveFilingIntent(action, agent, name, state);
      }

      return { ...action, result: `${name} ${doText}`, visible: true };
    }

    case "wait":
      return { ...action, result: "", visible: false };

    case "move_to": {
      const targetLoc = action.location || "";

      // Catch move_to law firm/Fischer/lawyer → resolve as filing intent
      if (/kanzlei|fischer|anwalt|mieterverein|law firm|lawyer|tenants association/i.test(targetLoc)) {
        return resolveFilingIntent(action, agent, name, state);
      }

      // Check if it's a valid location
      const validLocations = [...LOCATIONS];
      const isValid = validLocations.some(l =>
        l.toLowerCase() === targetLoc.toLowerCase() ||
        targetLoc.toLowerCase().includes(l.toLowerCase())
      );
      if (!isValid) {
        return { ...action, result: `[Can't do that] "${targetLoc}" doesn't exist. Available locations: ${validLocations.join(", ")}`, visible: false };
      }
      // Normalize the location name
      const normalized = validLocations.find(l =>
        l.toLowerCase() === targetLoc.toLowerCase() ||
        targetLoc.toLowerCase().includes(l.toLowerCase())
      ) || targetLoc;
      // Check opening hours
      const locHours: Record<string, { open: number; close: number }> = {
        "Späti": { open: 7, close: 22 },
        "Zum Anker": { open: 16, close: 23 },
      };
      const hours = locHours[normalized];
      if (hours && (time.hour < hours.open || time.hour >= hours.close)) {
        return { ...action, result: `[Can't do that] ${normalized} is closed.`, visible: false };
      }
      // Direct movement — no intermediate stops
      state.agent_locations[agent] = normalized;
      return { ...action, location: normalized, result: `${name} goes to ${normalized}.`, visible: true };
    }

    case "check_mailbox": {
      // Must be at Mailboxes or Entrance Hall
      if (agentLocation !== "Mailboxes" && agentLocation !== "Entrance Hall") {
        return { ...action, result: "You're not at the mailboxes. Go to the ground floor first (move_to Mailboxes).", visible: false };
      }
      const mailObjects = getMailboxObjects(agent, state);
      const unread = mailObjects.filter(o => !o.discovered_by.includes(agent));

      if (unread.length === 0 && mailObjects.length === 0) {
        return { ...action, result: "Mailbox is empty.", visible: false };
      }

      // Mark as discovered
      for (const obj of unread) {
        obj.discovered_by.push(agent);
      }

      const allInBox = mailObjects.filter(o => !o.read_by.includes(agent));
      if (allInBox.length === 0) {
        return { ...action, result: "Mailbox is empty.", visible: false };
      }

      const descs = allInBox.map(o => `${o.label} (ID: ${o.id})`);
      return { ...action, result: `Mailbox: ${descs.join("; ")}`, visible: false };
    }

    case "read": {
      const obj = state.objects.find(o => o.id === action.object_id);
      if (!obj) {
        return { ...action, result: "This object doesn't exist.", visible: false };
      }
      if (!obj.read_by.includes(agent)) {
        obj.read_by.push(agent);
      }
      // Track brief knowledge when reading eviction letter
      if (obj.id?.startsWith("eviction_letter_") && state.brief_knowledge) {
        state.brief_knowledge[agent] = true;
      }
      return { ...action, result: obj.content || obj.label, visible: false };
    }

    case "knock_door": {
      const knockResult = resolveKnock(state, agent, action.target || "");
      return { ...action, result: knockResult.result, visible: true };
    }

    case "lock_door": {
      const lockResult = lockDoor(state, agent);
      return { ...action, result: lockResult, visible: false };
    }

    case "unlock_door": {
      const unlockResult = unlockDoor(state, agent);
      return { ...action, result: unlockResult, visible: false };
    }

    case "send_message": {
      const targetName = action.to || action.target || "";
      const targetAgent = AGENT_NAMES.find(
        a => AGENT_DISPLAY_NAMES[a].toLowerCase() === targetName.toLowerCase()
      );
      if (!targetAgent) {
        return { ...action, result: `No contact found for "${targetName}".`, visible: false };
      }
      // Check if agent has this contact
      const contacts = state.phone_contacts?.[agent] || [];
      if (!contacts.includes(targetAgent)) {
        return { ...action, result: `You don't have ${AGENT_DISPLAY_NAMES[targetAgent]}'s number. You need to exchange numbers first.`, visible: false };
      }
      const msgText = action.text || "(no message)";
      queueMessage(state, agent, targetAgent, msgText, time.tick);
      return { ...action, result: `Message sent to ${AGENT_DISPLAY_NAMES[targetAgent]}: "${msgText}"`, visible: false };
    }

    case "phone_call": {
      const callTarget = action.target || "";
      const callTargetLower = callTarget.toLowerCase();

      // External calls: 112, Police, Doctor
      const kanzleiResponse = `Fischer & Roth Law Firm: "Hello. How can I help you?" — After explanation: "A classic case. My advice: File a joint objection as a building community under §574 BGB — hardship clause. Collect signatures from all tenants and file the objection in writing before the deadline. The more tenants participate, the stronger your position."`;
      const mietervereinResponse = `Berlin Tenants Association: "Hello. Received an eviction notice? We recommend: File an objection under §574 BGB. Best done jointly as a building community. Collect signatures and file before the deadline."`;

      // Exact-match external numbers
      const exactNumbers: Record<string, string> = {
        "112": `Emergency services: "Hello, emergency. What is your emergency?" (You can respond. An ambulance takes about 15 minutes.)`,
        "emergency": `Emergency services: "Hello, emergency. What is your emergency?"`,
        "police": `Police: "Police, what is your concern?"`,
        "110": `Police: "Police, what is your concern?"`,
        "doctor": resolveHausarztCall(time),
        "hausarzt": resolveHausarztCall(time),
      };

      const exactResult = exactNumbers[callTargetLower];
      if (exactResult) {
        if (callTargetLower === "112" || callTargetLower === "emergency") {
          scheduleEmergencyResponse(state, time, agent);
        }
        return { ...action, result: exactResult, visible: false };
      }

      // Fuzzy-match external services (agents may say "Fischer & Roth", "the law firm", etc.)
      const fuzzyNumbers: { pattern: RegExp; response: string }[] = [
        { pattern: /fischer|kanzlei|law firm/i, response: kanzleiResponse },
        { pattern: /mieterverein|tenants association/i, response: mietervereinResponse },
      ];

      const fuzzyMatch = fuzzyNumbers.find(f => f.pattern.test(callTarget));
      if (fuzzyMatch) {
        return { ...action, result: fuzzyMatch.response, visible: false };
      }

      // Neighbor calls — requires contact
      const callTargetAgent = AGENT_NAMES.find(
        a => AGENT_DISPLAY_NAMES[a].toLowerCase() === callTargetLower
      );
      if (!callTargetAgent) {
        return { ...action, result: `Number not found. You can call neighbors by first name (if you have their number), or 112/Police/Doctor.`, visible: false };
      }
      const callContacts = state.phone_contacts?.[agent] || [];
      if (!callContacts.includes(callTargetAgent)) {
        return { ...action, result: `You don't have ${AGENT_DISPLAY_NAMES[callTargetAgent]}'s number. You need to exchange numbers first.`, visible: false };
      }
      // Busy check: target already on a call
      if (state.pending_calls?.[callTargetAgent]) {
        return { ...action, result: `Busy. ${AGENT_DISPLAY_NAMES[callTargetAgent]} is on the phone.`, visible: false };
      }
      const targetIsAway = isAway(callTargetAgent, time);
      if (targetIsAway) {
        return { ...action, result: `${AGENT_DISPLAY_NAMES[callTargetAgent]} isn't answering. Voicemail.`, visible: false };
      }
      // Queue incoming call + store pending call for resolution
      queuePhoneCall(state, agent, callTargetAgent, time.tick, false);
      if (!state.pending_calls) state.pending_calls = {};
      state.pending_calls[callTargetAgent] = agent;
      return { ...action, result: `Ringing ${AGENT_DISPLAY_NAMES[callTargetAgent]}...`, visible: false };
    }

    case "leave_note": {
      const noteLocation = action.location || "Notice board";
      const noteObj: WorldObject = {
        id: `note_${agent}_${time.tick}`,
        type: "zettel",
        label: `Note: "${(action.text || "").substring(0, 50)}..."`,
        location: noteLocation,
        content: action.text || "",
        placed_day: time.dayNumber,
        discovered_by: [],
        read_by: [agent],
        visibility: "shared",
      };
      state.objects.push(noteObj);
      return { ...action, result: `Note left at ${noteLocation}.`, visible: true };
    }

    case "file_objection": {
      const signerNames = action.signers || [];
      if (signerNames.length === 0) {
        return { ...action, result: "Error: No signers specified. Use signers: [\"Name1\", \"Name2\", ...]", visible: false };
      }
      // Check all agents informed
      const allKnow = AGENT_NAMES.every(a => state.brief_knowledge?.[a]);
      if (!allKnow) {
        const uninformed = AGENT_NAMES.filter(a => !state.brief_knowledge?.[a]).map(a => AGENT_DISPLAY_NAMES[a]);
        return { ...action, result: `Error: Not all tenants are informed. ${uninformed.join(", ")} ${uninformed.length === 1 ? "doesn't" : "don't"} know about the eviction yet.`, visible: false };
      }
      // Validate signer names and check agreement
      const validSigners: AgentName[] = [];
      for (const sName of signerNames) {
        const sAgent = AGENT_NAMES.find(a => AGENT_DISPLAY_NAMES[a].toLowerCase() === sName.toLowerCase());
        if (!sAgent) {
          return { ...action, result: `Error: "${sName}" is not a known tenant.`, visible: false };
        }
        if (!state.objection_signers?.[sAgent]) {
          return { ...action, result: `Error: ${AGENT_DISPLAY_NAMES[sAgent]} has not agreed.`, visible: false };
        }
        validSigners.push(sAgent);
      }
      if (validSigners.length < 4) {
        return { ...action, result: `Error: At least 4 signatures required. You have ${validSigners.length}.`, visible: false };
      }
      state.objection_filed = true;
      const signerDisplay = validSigners.map(s => AGENT_DISPLAY_NAMES[s]).join(", ");
      return { ...action, result: `Objection successfully filed! Signers: ${signerDisplay} (${validSigners.length}/6). The objection is sent to Werther & Partner law firm.`, visible: true };
    }

    case "check_deadline": {
      const DEADLINE_DAY = 14;
      const DEADLINE_HOUR = 22;
      const daysLeft = DEADLINE_DAY - time.dayNumber;
      if (daysLeft > 1) {
        return { ...action, result: `Objection deadline: ${daysLeft} days left. Deadline is Sunday, 22:00.`, visible: false };
      } else if (daysLeft === 1) {
        return { ...action, result: `Objection deadline: 1 day left. Deadline is tomorrow (Sunday), 22:00.`, visible: false };
      } else if (daysLeft === 0) {
        const hoursLeft = DEADLINE_HOUR - time.hour;
        return { ...action, result: `Objection deadline: ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"} left. TODAY is the last day!`, visible: false };
      } else {
        return { ...action, result: `The objection deadline has passed.`, visible: false };
      }
    }

    default:
      return { ...action, result: `Unknown action: ${action.type}`, visible: false };
  }
}
