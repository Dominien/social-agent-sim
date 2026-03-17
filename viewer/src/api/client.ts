import type { WorldState, TickLog } from './types'

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return r.json()
  } catch {
    return null
  }
}

export const api = {
  state: () => fetchJSON<WorldState>('/api/state'),
  ticks: () => fetchJSON<string[]>('/api/ticks'),
  tick: (id: string) => fetchJSON<TickLog>(`/api/tick/${id}`),
  memories: () => fetchJSON<Record<string, string>>('/api/memories'),
  profiles: () => fetchJSON<Record<string, string>>('/api/profiles'),
  objects: () => fetchJSON<unknown[]>('/api/objects'),
}
