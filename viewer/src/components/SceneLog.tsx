import { useSimStore } from '../state/useSimStore'
import { AGENT_DISPLAY, type TickLog, type ToolCall } from '../api/types'

function ToolCallView({ tc }: { tc: ToolCall }) {
  if (tc.tool === 'speak') {
    return <div className="tool-speak">{String(tc.args.text ?? '')}</div>
  }
  if (tc.tool === 'think') {
    return <div className="tool-think">{String(tc.args.text ?? '')}</div>
  }
  if (tc.tool === 'do') {
    return <div className="tool-action">{String(tc.args.text ?? '')}</div>
  }
  if (tc.tool === 'move_to') {
    return <div className="tool-move">{'\u2192'} {String(tc.args.location ?? '')}</div>
  }
  if (tc.tool === 'wait') {
    return null
  }
  return <div className="tool-other">[{tc.tool}] {tc.result ?? ''}</div>
}

function NightView({ tickData }: { tickData: TickLog }) {
  const reflections = tickData.night_reflections
  if (!reflections) {
    return <div className="no-data">Alle schlafen ruhig.</div>
  }

  const entries = Object.entries(reflections).filter(
    ([, refl]) => refl.type !== 'nothing' && refl.content,
  )

  if (entries.length === 0) {
    return <div className="no-data">Alle schlafen ruhig.</div>
  }

  return (
    <>
      {entries.map(([agent, refl]) => (
        <div key={agent} className="night-card">
          <div className="night-label">
            {AGENT_DISPLAY[agent as keyof typeof AGENT_DISPLAY] ?? agent} {'\u2014'} {refl.type}
          </div>
          <div className="night-content">{refl.content}</div>
        </div>
      ))}
    </>
  )
}

function LocationsView({ tickData }: { tickData: TickLog }) {
  const entries = Object.entries(tickData.locations)

  if (entries.length === 0) {
    return <div className="no-data">Keine aktiven Szenen.</div>
  }

  return (
    <>
      {tickData.environment && (
        <div className="env-info">
          {tickData.environment.weather}
          {tickData.environment.ambient && ` \u2014 ${tickData.environment.ambient}`}
        </div>
      )}

      {entries.map(([location, locData]) => {
        const hasInteraction = locData.agents && locData.agents.length > 1
        const cardClass = `location-card ${hasInteraction ? 'has-interaction' : 'solo'}`

        return (
          <div key={location} className={cardClass}>
            <div className="location-header">{location}</div>
            <div className="location-agents-label">
              {(locData.agents ?? [])
                .map((a) => AGENT_DISPLAY[a as keyof typeof AGENT_DISPLAY] ?? a)
                .join(', ')}
            </div>

            {locData.rounds?.map((round) => (
              <div key={round.round}>
                {(locData.rounds?.length ?? 0) > 1 && (
                  <div className="round-label">Runde {round.round}</div>
                )}
                {round.actions?.map((agentActions, ai) => (
                  <div key={`${agentActions.agent}-${ai}`} className="action-entry">
                    <div
                      className="action-agent"
                      data-agent={agentActions.agent}
                    >
                      {AGENT_DISPLAY[agentActions.agent as keyof typeof AGENT_DISPLAY] ??
                        agentActions.agent}
                    </div>
                    {agentActions.tool_calls?.map((tc, ti) => (
                      <ToolCallView key={ti} tc={tc} />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      })}

      {tickData.movements && tickData.movements.length > 0 && (
        <div className="movement-summary">
          <strong>Bewegungen:</strong>
          <br />
          {tickData.movements.map((m, i) => (
            <span key={i}>
              {AGENT_DISPLAY[m.agent as keyof typeof AGENT_DISPLAY] ?? m.agent}: {m.from}{' '}
              {'\u2192'} {m.to}
              <br />
            </span>
          ))}
        </div>
      )}
    </>
  )
}

export function SceneLog() {
  const { state } = useSimStore()
  const { tickData } = state

  if (!tickData) {
    return <div className="no-data">Keine Daten.</div>
  }

  if (tickData.is_night) {
    return <NightView tickData={tickData} />
  }

  if (tickData.locations) {
    return <LocationsView tickData={tickData} />
  }

  return <div className="no-data">Keine Daten.</div>
}
