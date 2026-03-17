import { useEffect, useCallback } from 'react'
import { useSimStore } from '../state/useSimStore'
import { api } from '../api/client'

function padTickId(tick: number): string {
  return 'tick_' + tick.toString().padStart(5, '0')
}

export function useKeyboard() {
  const { stateRef, dispatch } = useSimStore()

  const loadTick = useCallback(
    async (tick: number) => {
      const data = await api.tick(padTickId(tick))
      if (data) {
        dispatch({ type: 'SET_TICK_DATA', payload: { tick, data } })
      }
    },
    [dispatch],
  )

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const s = stateRef.current
      const { availableTicks, currentTick } = s
      const idx = currentTick !== null ? availableTicks.indexOf(currentTick) : -1

      switch (e.key) {
        case 'ArrowLeft':
          if (idx > 0) loadTick(availableTicks[idx - 1])
          break

        case 'ArrowRight':
          if (idx >= 0 && idx < availableTicks.length - 1)
            loadTick(availableTicks[idx + 1])
          break

        case 's':
        case 'S':
          dispatch({ type: 'TOGGLE_SIDEBAR' })
          break

        case 'Escape':
          if (s.viewMode === 'interior') {
            dispatch({
              type: 'SET_VIEW_MODE',
              payload: { mode: 'exterior', location: null },
            })
          }
          break

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          dispatch({
            type: 'SET_VIEW_MODE',
            payload: {
              mode: 'interior',
              location: `Apartment ${e.key}`,
            },
          })
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [stateRef, dispatch, loadTick])
}
