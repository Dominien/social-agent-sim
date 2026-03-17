import { useSimProvider, SimContext } from './state/useSimStore'
import { PixelCanvas } from './canvas/PixelCanvas'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { Timeline } from './components/Timeline'
import { useDataLoader } from './hooks/useDataLoader'
import { useKeyboard } from './hooks/useKeyboard'
import { usePolling } from './hooks/usePolling'
import './App.css'

function AppInner() {
  useDataLoader()
  useKeyboard()
  usePolling()

  return (
    <>
      <PixelCanvas />
      <TopBar />
      <Sidebar />
      <Timeline />
    </>
  )
}

export function App() {
  const store = useSimProvider()

  return (
    <SimContext.Provider value={store}>
      <AppInner />
    </SimContext.Provider>
  )
}
