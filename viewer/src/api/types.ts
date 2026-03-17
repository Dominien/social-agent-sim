// Mirrored from backend src/types.ts — only what the viewer needs

export type AgentName = 'marco' | 'sarah' | 'marta' | 'hakim' | 'suki' | 'rolf'

export const AGENT_NAMES: AgentName[] = ['marco', 'sarah', 'marta', 'hakim', 'suki', 'rolf']

export const AGENT_DISPLAY: Record<AgentName, string> = {
  marco: 'Marco', sarah: 'Sarah', marta: 'Marta',
  hakim: 'Hakim', suki: 'Suki', rolf: 'Rolf',
}

export const AGENT_HOMES: Record<AgentName, string> = {
  marta: 'Apartment 1', rolf: 'Apartment 3', hakim: 'Apartment 4',
  marco: 'Apartment 5', sarah: 'Apartment 5', suki: 'Apartment 6',
}

export interface BodyState {
  hunger: number
  energy: number
  sleep_quality: 'good' | 'fair' | 'poor'
}

export interface AgentFinances {
  balance: number
  monthly_income: number
  current_rent: number
  new_rent: number | null
}

export interface WorldState {
  current_tick: number
  current_time: string
  weather: string
  agent_locations: Record<string, string>
  body: Record<string, BodyState>
  finances: Record<string, AgentFinances>
  doors: Record<string, 'locked' | 'unlocked'>
  objects: unknown[]
}

export interface ToolCall {
  tool: string
  args: Record<string, unknown>
  result: string
}

export interface TickLogRound {
  round: number
  actions: {
    agent: string
    tool_calls: ToolCall[]
  }[]
}

export interface TickLogLocation {
  agents: string[]
  rounds: TickLogRound[]
}

export interface TickLog {
  tick: number
  simulated_time: string
  is_night: boolean
  environment?: { weather: string; ambient?: string }
  locations: Record<string, TickLogLocation>
  movements: { agent: string; from: string; to: string }[]
  world_state_summary: string
  night_reflections?: Record<string, { type: string; content: string }>
}
