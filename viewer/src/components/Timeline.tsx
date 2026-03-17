import { useCallback } from 'react'
import { useSimStore } from '../state/useSimStore'
import { api } from '../api/client'

function padTickId(tick: number): string {
  return 'tick_' + tick.toString().padStart(5, '0')
}

export function Timeline() {
  const { state, dispatch } = useSimStore()
  const { availableTicks, currentTick } = state

  const idx = currentTick !== null ? availableTicks.indexOf(currentTick) : -1
  const hasPrev = idx > 0
  const hasNext = idx >= 0 && idx < availableTicks.length - 1
  const latestTick = availableTicks.length > 0 ? availableTicks[availableTicks.length - 1] : null
  const isLive = currentTick !== null && currentTick === latestTick

  const loadTick = useCallback(
    async (tick: number) => {
      const data = await api.tick(padTickId(tick))
      if (data) {
        dispatch({ type: 'SET_TICK_DATA', payload: { tick, data } })
      }
      // Also refresh world state when navigating
      const worldState = await api.state()
      if (worldState) {
        dispatch({ type: 'SET_WORLD_STATE', payload: worldState })
      }
    },
    [dispatch],
  )

  const goPrev = () => {
    if (hasPrev) loadTick(availableTicks[idx - 1])
  }

  const goNext = () => {
    if (hasNext) loadTick(availableTicks[idx + 1])
  }

  const goLatest = () => {
    if (latestTick !== null && latestTick !== currentTick) {
      loadTick(latestTick)
    }
  }

  const tickInfo =
    currentTick !== null
      ? `Tick ${currentTick} (${idx + 1}/${availableTicks.length})`
      : 'No ticks yet'

  return (
    <div className="timeline-bar">
      <div className="tl-controls">
        <button disabled={!hasPrev} onClick={goPrev} title="Previous tick">
          {'\u25C0'}
        </button>
        <button disabled={!hasNext} onClick={goNext} title="Next tick">
          {'\u25B6'}
        </button>
        {!isLive && latestTick !== null && (
          <button className="tl-go-latest" onClick={goLatest} title="Jump to latest">
            LATEST {'\u25B6\u25B6'}
          </button>
        )}
        {isLive && (
          <span className="tl-live-indicator">LIVE</span>
        )}
      </div>

      <div className="tl-track">
        {availableTicks.map((t) => (
          <div
            key={t}
            className={`tick-marker${t === currentTick ? ' active' : ''}${t === latestTick ? ' latest' : ''}`}
            title={`Tick ${t}`}
            onClick={() => loadTick(t)}
          />
        ))}
      </div>

      <div className="tl-info">{tickInfo}</div>
    </div>
  )
}
