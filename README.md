# Hauswelt

**Identity is not a property. Identity is a process.**

A multi-agent social simulation where 6 AI agents live in a Berlin apartment building. No personality traits are programmed. No behavioral scripts exist. Each agent receives only a two-line seed — name, age, occupation, apartment number — and a world they can perceive and act in.

What emerges over 14 simulated days is not what you'd expect from language models.

---

## The Thesis

The dominant approach to giving AI agents "personality" is to describe it in the system prompt: *"You are cheerful and helpful"*, *"You are a cautious analyst."* This works for chatbots. It fails for agents.

Hauswelt tests the counter-thesis: **identity emerges from context, not from description.** Give agents a body (hunger, fatigue), a place (apartment, stairwell, backyard), neighbors they don't know yet, and time that passes — and watch what happens.

The simulation ran for 14 days. The agents were never told to be interesting. They became interesting anyway.

---

## The Building

```
Schillerstraße 14, Berlin-Neukölln

┌─────────────────────────────────┐
│  Top floor   │ Apt 6  (Suki)   │
├──────────────┼─────────────────┤
│  3rd floor   │ Apt 5  (Marco   │
│              │        & Sarah) │
│              │ Apt 4  (Hakim)  │
├──────────────┼─────────────────┤
│  2nd floor   │ Apt 3  (Rolf)   │
├──────────────┼─────────────────┤
│  1st floor   │ Apt 1  (Marta)  │
│              │ Apt 2  (empty)  │
├──────────────┼─────────────────┤
│  Ground fl.  │ Entrance Hall   │
│              │ Mailboxes       │
├──────────────┼─────────────────┤
│  Outside     │ Backyard        │
│              │ Späti           │
│              │ Zum Anker (bar) │
└──────────────┴─────────────────┘
```

### The Agents

| Agent | Age | Occupation | Apartment | Schedule |
|-------|-----|-----------|-----------|----------|
| **Marco** | 24 | Web developer (remote) | Apt 5, 3rd floor | Always home |
| **Sarah** | 24 | Social work student / daycare worker | Apt 5, 3rd floor | Away Wed-Fri 8-15 |
| **Marta** | 62 | Retired, widowed | Apt 1, 1st floor | Always home |
| **Rolf** | 55 | Construction worker, divorced | Apt 3, 2nd floor | Away Mon-Fri 8-17 |
| **Hakim** | 38 | IT consultant | Apt 4, 3rd floor | Away Mon-Fri 9-18 |
| **Suki** | 23 | Political science student | Apt 6, top floor | Away Mon-Fri 8-12 (some days) |

Each agent's entire personality seed is two lines. That's it. Everything else — their voice, their relationships, their decisions — emerges from experience.

---

## What Happened: 14 Days

### Days 1-5: Strangers

The agents begin as strangers in a building. They share walls but not words.

**The soup incident (Day 2).** Marta cooks soup and decides to bring some to her neighbor. She knocks on Rolf's door. He opens it, surprised. Nobody has knocked on his door in months. They share the soup. This is the first voluntary social interaction in the simulation — and it was not scripted.

**Marco and Sarah's quiet crisis.** Marco works from home. Sarah leaves for work three days a week. By Day 3, their conversations have become transactional: groceries, schedules, who's cooking. The simulation reveals something uncomfortable — proximity without shared experience produces distance, not closeness.

**Suki's isolation.** Suki lives on the top floor. She goes to university, comes home, studies. By Day 4, her memory file shows a pattern: location entries with no other names. She is alone most of the time, and the memory system makes this visible.

**Marta's persistence.** Marta, the retired widow who has lived here 25 years, begins appearing in the stairwell at strategic times. She's the only agent who consistently initiates contact. Not because she was told to be social — but because she is always home, always available, and her two-line seed gives her nothing else to do.

### Days 7-9: The Letter Arrives

On Day 7, an eviction letter appears in every mailbox. The building has been sold to VESTA Immobilien Verwaltungs GmbH. All tenants must leave. They have 14 days to file a joint objection under §574 BGB.

Not everyone checks their mail on the same day. The information spreads unevenly — through stairwell conversations, text messages, phone calls. Some agents learn about the eviction from the letter itself. Others hear about it from neighbors before they've even opened their mailbox.

**The SMS nudge.** On Day 8, the property management sends an SMS: *"There is a letter from property management in your mailbox. Please take note."* This is the engine ensuring every agent has a fair chance to discover the plot — without forcing them to act.

### Days 10-13: Community Forms

What follows is the most remarkable sequence in the simulation.

**The causal chain.** Marta tells Marco about the letter in the stairwell. Marco tells Sarah when she gets home from work. Sarah, the social work student, starts texting other tenants. Suki, who has been isolated for 9 days, receives a text message — her first social contact from a neighbor.

The agents begin to organize. Not because they were told to. Not because there's a "cooperation" parameter. But because the eviction letter creates shared context — and shared context, when combined with the tools to act (phone calls, text messages, door-knocking), produces collective action.

**Signature collection.** To file the objection, at least 4 of 6 tenants must agree. The engine tracks this: who knows about the letter, who has expressed agreement, who has signed. Agents must physically or digitally communicate to spread awareness and collect support.

### Day 14: The Deadline

The objection deadline is Day 14 at 22:00. The simulation tracks whether the agents managed to:
1. Inform all 6 tenants about the eviction
2. Collect at least 4 signatures
3. File the objection before the deadline

**Rolf's door.** In several simulation runs, Rolf is the hardest tenant to reach. He works construction Mon-Fri 8-17. He comes home tired. He locks his door. When neighbors knock, sometimes he doesn't open. This isn't programmed reclusiveness — it's emergent behavior from his schedule, his fatigue system, and his lack of existing social connections.

This is the thesis moment: Rolf's isolation isn't a personality trait. It's the result of his work schedule, his body state, and his history of non-interaction. Identity through context.

---

## The Endgame System

The simulation has a win condition: file a joint objection before the deadline.

### Object Schedule

| Day | Event |
|-----|-------|
| 7 | Eviction letters placed in all mailboxes |
| 8 | SMS from property management: "Check your mailbox" |
| 8+ | Ad from Fischer & Roth Law Firm (when any agent learns about eviction) |
| 14 | Renovation notice posted in stairwell |
| 21 | Personalized buyout offers in mailboxes |
| 30 | Investors visit the building |

### Tracking

The engine tracks three things:
- **brief_knowledge**: Which agents know about the eviction letter (learned by reading it or hearing about it)
- **objection_signers**: Which agents have expressed agreement to the objection (detected from conversation keywords)
- **objection_filed**: Whether someone has filed the objection (requires ≥4 signers + all informed)

### Win Condition

**PASS**: Objection filed before Day 14 22:00 with ≥4 signatures and all tenants informed.
**FAIL**: Deadline passes without successful filing.

---

## Interview Mode

You can talk to any agent after (or during) a simulation:

```bash
npm run interview -- Marco
```

The agent responds based only on what they've experienced — their memory file, their current body state, the time of day. They don't have access to information they haven't encountered in the simulation.

---

## Architecture

### Tick Structure

Each tick = 1 simulated hour (7:00-22:00, 16 ticks per day). Night is skipped — agents sleep, their body state resets, and a sleep memory entry is injected.

```
Tick → Time mapping:
  Tick 1  = Monday 07:00
  Tick 16 = Monday 22:00
  Tick 17 = Tuesday 07:00
  ...
  Tick 224 = Sunday 22:00 (Day 14)
```

### Engine vs. Agent Control

The engine controls the world. Agents control their behavior.

**Engine responsibilities:**
- Time, weather, body state (hunger, energy, sleep)
- Location management, opening hours, closing-time enforcement
- Object placement (letters, notices) on schedule
- Sound propagation between adjacent apartments
- Phone system (call → ring → pickup → conversation)
- Service staff at Späti and Zum Anker (menu, ordering, payment)
- Memory compression (recent 20 entries verbatim, older compressed)
- Endgame tracking (letter knowledge, signatures, filing)
- Acquaintance system (agents learn names through interaction)

**Agent responsibilities:**
- Deciding what to do (speak, move, think, wait, call, message, etc.)
- All dialogue content
- Social initiative (knocking on doors, starting conversations)
- Emotional responses

### The Minimal Prompt

Each agent receives:
1. A two-line seed (name, age, job, apartment)
2. Their memory file (people, experiences, important items)
3. Current perception (time, location, who's here, weather, body state, messages)
4. The action schema (JSON format, available actions)

No personality adjectives. No behavioral instructions. No "you are friendly" or "you tend to be cautious." The prompt is ~200 tokens of structure + variable perception.

---

## Key Findings

1. **Identity emerges from schedule.** Marco and Rolf have completely different social patterns — not because of personality traits, but because Marco is always home and Rolf is never home during the day.

2. **Proximity ≠ connection.** Marco and Sarah share an apartment but develop less novel interaction than Marta and Suki, who live on different floors. Shared space without shared events produces routine, not relationship.

3. **The first mover matters.** Marta consistently initiates contact because she has time (retired) and proximity (1st floor near the entrance). Her social role emerges from her circumstances, not from instructions.

4. **Information spreads through trust networks.** The eviction letter doesn't spread uniformly. It follows the social graph that agents built during Days 1-7. Agents who made connections early become information hubs.

5. **Body state shapes behavior.** Hungry agents go to the Späti. Tired agents stay home. Poor sleep makes agents less likely to initiate social contact. These aren't personality traits — they're environmental pressures.

6. **Collective action requires infrastructure.** The agents can't organize without phone numbers. They can't get phone numbers without meeting. They can't meet without being in the same place at the same time. The causal chain from isolation to collective action is long and fragile.

7. **Isolation is structural, not personal.** Rolf isn't antisocial. He works 8-17, comes home exhausted, and has no existing connections. His isolation is the predictable result of his constraints.

---

## Failure Modes

### Haiku vs. Sonnet

The simulation was designed for **Claude Haiku** (fast, cheap, ~$0.50/day of simulation). Results with different models:

| Model | Cost/day | Behavior |
|-------|----------|----------|
| Haiku | ~$0.50 | Functional. Agents are terse, sometimes passive. Works for the core mechanics. |
| Sonnet | ~$5.00 | Richer dialogue, more initiative, better social reasoning. The "real" experience. |

Haiku agents tend to wait more, produce shorter dialogue, and miss subtle social cues — but still organize when the eviction letter provides clear motivation.

Sonnet agents initiate more social contact, produce more naturalistic dialogue, and form stronger opinions about neighbors.

---

## The 12 Engine Fixes

Over 5 iterations, we identified 12 design principles that make the simulation work:

| # | Principle | What it prevents |
|---|-----------|-----------------|
| 1 | Sequential conversation turns | Agents talking past each other |
| 2 | Interaction cooldown (3-tick gap) | Infinite loops at same location |
| 3 | Acquaintance-gated names | Agents knowing strangers' names |
| 4 | Encounter-type round limits | 8-round conversations in hallways |
| 5 | Body state drift (not events) | Ignoring hunger/fatigue |
| 6 | Phone number exchange requirement | Unrealistic instant contact |
| 7 | Filing requires all-informed + 4 signatures | Trivial endgame |
| 8 | Sleep memory injection | Memory gaps between days |
| 9 | Fridge system with consumption tracking | Agents never needing to shop |
| 10 | Service staff at Zum Anker and Späti | Dead locations with no interaction |
| 11 | Sound propagation between apartments | Apartments as sensory voids |
| 12 | Memory compression (20 recent + summaries) | Context window overflow |

---

## Setup

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Installation

```bash
git clone https://github.com/your-username/hauswelt.git
cd hauswelt
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### Running

```bash
# Start a fresh simulation
npm run reset && npm start

# Resume a paused simulation
npm run resume

# Run a single tick
npm run tick

# Interview an agent
npm run interview -- Marco

# Start the web viewer
npm run viewer
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | (required) | Your Anthropic API key |
| `CHARACTER_MODEL` | `haiku` | Model for agent behavior: `haiku` or `sonnet` |
| `LOG_LEVEL` | `normal` | Output verbosity: `minimal`, `normal`, `verbose` |
| `TICK_INTERVAL_MS` | `0` | Delay between ticks in milliseconds |

### Project Structure

```
hauswelt/
├── src/
│   ├── index.ts          # CLI entry point, reset logic
│   ├── engine.ts         # Main simulation loop, perception builder
│   ├── agent-runner.ts   # Agent prompt construction, LLM calls
│   ├── tools.ts          # Action schema, action resolution
│   ├── types.ts          # TypeScript types, constants
│   ├── time.ts           # Tick-to-time conversion
│   ├── memory.ts         # Memory read/write/compression
│   ├── body.ts           # Hunger, energy, sleep
│   ├── finances.ts       # Income, rent, spending
│   ├── doors.ts          # Door lock/unlock/knock
│   ├── sounds.ts         # Sound propagation
│   ├── messages.ts       # Text messages, phone calls
│   ├── away.ts           # Work/university schedules
│   ├── environment-agent.ts  # Weather, object placement
│   ├── interview.ts      # Interview mode
│   ├── llm.ts            # Claude API wrapper
│   └── server.ts         # Web viewer API
├── data/
│   ├── profiles/         # Agent seed files (2 lines each)
│   ├── memory/           # Live agent memory (updated each tick)
│   ├── memory_initial/   # Clean memory templates (for reset)
│   ├── object_content/   # Letter and notice content
│   ├── object_schedule.json  # When objects appear
│   ├── ground_truth.json     # Agent financial facts
│   ├── world_state.json      # Current simulation state
│   └── logs/             # Per-tick JSON logs
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## API

The web viewer (`npm run viewer`) exposes these endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/state` | Current world state |
| `GET /api/agents` | All agent locations and status |
| `GET /api/agent/:name` | Single agent details + memory |
| `GET /api/ticks` | List of available tick logs |
| `GET /api/tick/:number` | Single tick log |
| `GET /api/objects` | All world objects |

---

## The Answer

The question was: can AI agents develop identity without being told who they are?

After 14 simulated days, across multiple runs with different models, the answer is: **yes, but not the way you'd expect.**

The agents don't develop rich inner lives or consistent personality traits in the way a novelist would write them. What they develop is something more fundamental: **behavioral patterns that emerge from structural constraints.** Marta is social because she's retired and lives near the entrance. Rolf is isolated because he works long hours and has no prior connections. Marco and Sarah drift apart because remote work and different schedules reduce shared experience.

These aren't personality traits. They're consequences of architecture — both the building's architecture and the simulation's architecture.

And when the eviction letter arrives, the agents who built connections during the "boring" first week are the ones who can mobilize. The social graph determines the outcome. Not instructions, not personality prompts, not behavioral scripts.

Identity through context. Empirically validated.

---

## License

MIT — see [LICENSE](LICENSE).
