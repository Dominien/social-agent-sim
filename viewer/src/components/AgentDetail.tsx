import { useEffect } from 'react'
import { useSimStore } from '../state/useSimStore'
import { api } from '../api/client'
import { AGENT_DISPLAY, type AgentName } from '../api/types'

const AGENT_COLORS: Record<string, string> = {
  marco: 'var(--agent-marco)',
  sarah: 'var(--agent-sarah)',
  marta: 'var(--agent-marta)',
  hakim: 'var(--agent-hakim)',
  suki: 'var(--agent-suki)',
  rolf: 'var(--agent-rolf)',
}

export function AgentDetail() {
  const { state, dispatch } = useSimStore()
  const { selectedAgent, worldState, memories } = state

  useEffect(() => {
    if (selectedAgent && !memories) {
      api.memories().then((data) => {
        if (data) dispatch({ type: 'SET_MEMORIES', payload: data })
      })
    }
  }, [selectedAgent, memories, dispatch])

  if (!selectedAgent) return null

  const displayName =
    AGENT_DISPLAY[selectedAgent as AgentName] ?? selectedAgent
  const color = AGENT_COLORS[selectedAgent] ?? 'var(--text)'
  const location = worldState?.agent_locations?.[selectedAgent] ?? '\u2014'
  const body = worldState?.body?.[selectedAgent]
  const memoryText = memories?.[selectedAgent]
  const excerpt = memoryText ? memoryText.substring(0, 600) : null
  const truncated = memoryText && memoryText.length > 600

  return (
    <div className="agent-detail">
      <div className="agent-detail-header">
        <div>
          <span className="agent-detail-name" style={{ color }}>
            {displayName}
          </span>
          <span className="agent-detail-loc">{location}</span>
        </div>
        <button
          className="agent-detail-close"
          onClick={() => dispatch({ type: 'SELECT_AGENT', payload: null })}
        >
          {'\u00D7'}
        </button>
      </div>

      {body && (
        <div className="detail-stats">
          {Object.entries(body).map(([key, val]) => (
            <div key={key} className="stat-row">
              <span className="stat-label">{key}</span>
              <span className="stat-value">{String(val)}</span>
            </div>
          ))}
        </div>
      )}

      {excerpt && (
        <div className="detail-memory">
          <h3>Memory</h3>
          <pre>
            {excerpt}
            {truncated ? '\u2026' : ''}
          </pre>
        </div>
      )}
    </div>
  )
}
