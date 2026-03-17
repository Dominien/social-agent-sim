import { useEffect } from 'react'
import { useSimStore } from '../state/useSimStore'
import { api } from '../api/client'

function padTickId(tick: number): string {
  return 'tick_' + tick.toString().padStart(5, '0')
}

export function usePolling() {
  const { stateRef, dispatch } = useSimStore()

  useEffect(() => {
    const interval = setInterval(async () => {
      const tickIds = await api.ticks()
      if (!tickIds || tickIds.length === 0) return

      const nums = tickIds
        .map((id) => {
          const m = id.match(/(\d+)$/)
          return m ? parseInt(m[1], 10) : NaN
        })
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b)

      const s = stateRef.current
      const prevMax =
        s.availableTicks.length > 0
          ? s.availableTicks[s.availableTicks.length - 1]
          : -1
      const newMax = nums[nums.length - 1]

      dispatch({ type: 'SET_TICKS', payload: nums })

      // Auto-load latest tick if we're currently viewing the latest (or no tick yet)
      const isViewingLatest = s.currentTick === null || s.currentTick === prevMax
      if (newMax > prevMax && isViewingLatest) {
        const data = await api.tick(padTickId(newMax))
        if (data) {
          dispatch({ type: 'SET_TICK_DATA', payload: { tick: newMax, data } })
        }
        // Also refresh world state
        const worldState = await api.state()
        if (worldState) {
          dispatch({ type: 'SET_WORLD_STATE', payload: worldState })
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [stateRef, dispatch])
}
