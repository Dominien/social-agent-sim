import { createContext, useContext, useReducer, useRef, useCallback, type Dispatch } from 'react'
import type { WorldState, TickLog } from '../api/types'

export interface SimState {
  worldState: WorldState | null
  tickData: TickLog | null
  availableTicks: number[]
  currentTick: number | null
  memories: Record<string, string> | null
  selectedAgent: string | null
  sidebarOpen: boolean
  viewMode: 'exterior' | 'interior'
  focusedLocation: string | null
  // Active locations with conversations (for building highlights)
  activeLocations: Set<string>
}

const initialState: SimState = {
  worldState: null,
  tickData: null,
  availableTicks: [],
  currentTick: null,
  memories: null,
  selectedAgent: null,
  sidebarOpen: true,
  viewMode: 'exterior',
  focusedLocation: null,
  activeLocations: new Set(),
}

type Action =
  | { type: 'SET_WORLD_STATE'; payload: WorldState }
  | { type: 'SET_TICK_DATA'; payload: { tick: number; data: TickLog } }
  | { type: 'SET_TICKS'; payload: number[] }
  | { type: 'SET_MEMORIES'; payload: Record<string, string> }
  | { type: 'SELECT_AGENT'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_VIEW_MODE'; payload: { mode: 'exterior' | 'interior'; location?: string | null } }

function getActiveLocations(data: TickLog): Set<string> {
  const active = new Set<string>()
  if (!data.locations) return active
  for (const [loc, locData] of Object.entries(data.locations)) {
    for (const round of locData.rounds) {
      for (const action of round.actions) {
        for (const tc of action.tool_calls) {
          if (tc.tool === 'speak' || tc.tool === 'do' || tc.tool === 'knock_door' || tc.tool === 'phone_call') {
            active.add(loc)
          }
        }
      }
    }
  }
  return active
}

function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case 'SET_WORLD_STATE':
      return { ...state, worldState: action.payload }
    case 'SET_TICK_DATA':
      return {
        ...state,
        currentTick: action.payload.tick,
        tickData: action.payload.data,
        activeLocations: getActiveLocations(action.payload.data),
      }
    case 'SET_TICKS':
      return { ...state, availableTicks: action.payload }
    case 'SET_MEMORIES':
      return { ...state, memories: action.payload }
    case 'SELECT_AGENT':
      return { ...state, selectedAgent: action.payload, sidebarOpen: action.payload ? true : state.sidebarOpen }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload.mode, focusedLocation: action.payload.location ?? null }
    default:
      return state
  }
}

interface SimContextValue {
  state: SimState
  dispatch: Dispatch<Action>
  stateRef: React.RefObject<SimState>
}

export const SimContext = createContext<SimContextValue | null>(null)

export function useSimStore() {
  const ctx = useContext(SimContext)
  if (!ctx) throw new Error('useSimStore must be inside SimProvider')
  return ctx
}

export function useSimProvider() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  const stableDispatch = useCallback((action: Action) => dispatch(action), [])
  return { state, dispatch: stableDispatch, stateRef }
}
