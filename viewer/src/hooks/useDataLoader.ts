import { useEffect } from 'react'
import { useSimStore } from '../state/useSimStore'
import { api } from '../api/client'

function padTickId(tick: number): string {
  return 'tick_' + tick.toString().padStart(5, '0')
}

export function useDataLoader() {
  const { dispatch } = useSimStore()

  useEffect(() => {
    async function load() {
      // Fetch world state
      const worldState = await api.state()
      if (worldState) {
        dispatch({ type: 'SET_WORLD_STATE', payload: worldState })
      }

      // Fetch available ticks
      const tickIds = await api.ticks()
      if (tickIds && tickIds.length > 0) {
        // Parse tick numbers from 'tick_00001' format
        const nums = tickIds
          .map((id) => {
            const m = id.match(/(\d+)$/)
            return m ? parseInt(m[1], 10) : NaN
          })
          .filter((n) => !isNaN(n))
          .sort((a, b) => a - b)

        dispatch({ type: 'SET_TICKS', payload: nums })

        // Load latest tick
        const latest = nums[nums.length - 1]
        const tickData = await api.tick(padTickId(latest))
        if (tickData) {
          dispatch({ type: 'SET_TICK_DATA', payload: { tick: latest, data: tickData } })
        }
      }
    }

    load()
  }, [dispatch])
}
