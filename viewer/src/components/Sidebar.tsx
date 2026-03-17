import { useSimStore } from '../state/useSimStore'
import { AgentDetail } from './AgentDetail'
import { SceneLog } from './SceneLog'

export function Sidebar() {
  const { state, dispatch } = useSimStore()
  const { sidebarOpen, selectedAgent } = state

  return (
    <>
      <button
        className={`sidebar-toggle ${sidebarOpen ? '' : 'collapsed'}`}
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
      >
        {sidebarOpen ? '\u25B6' : '\u25C0'}
      </button>
      <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        {selectedAgent && <AgentDetail />}
        <h2>Szenen</h2>
        <SceneLog />
      </div>
    </>
  )
}
