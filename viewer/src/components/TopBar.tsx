import { useSimStore } from '../state/useSimStore'

export function TopBar() {
  const { state } = useSimStore()
  const { tickData, currentTick } = state

  const simTime = tickData?.simulated_time ?? '\u2014'
  const weather = tickData?.environment?.weather ?? ''
  const tickLabel = currentTick !== null ? `Tick ${currentTick}` : ''

  return (
    <div className="top-bar">
      <div className="top-title">HAUSWELT</div>
      <div className="top-info">
        <span>{simTime}</span>
        <span>{weather}</span>
        <span>{tickLabel}</span>
      </div>
    </div>
  )
}
