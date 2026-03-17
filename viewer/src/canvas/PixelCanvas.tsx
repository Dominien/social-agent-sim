import { useRef, useEffect, useCallback } from 'react'
import { useSimStore } from '../state/useSimStore'
import { VIRT_W, VIRT_H, CLICK_REGIONS, ROOM_X, ROOM_Y, ROOM_W, ROOM_H } from './layout'
import { createCamera, updateCamera, zoomToLocation, zoomOut, type CameraState } from './camera'
import { renderFrame, createAnimState, updateAnimState, processTickActions, type AnimState } from './renderer'

export function PixelCanvas() {
  const { stateRef, dispatch } = useSimStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bufferRef = useRef<HTMLCanvasElement | null>(null)
  const cameraRef = useRef<CameraState>(createCamera())
  const animRef = useRef<AnimState>(createAnimState())
  const lastTimeRef = useRef<number>(0)
  const lastTickRef = useRef<number | null>(null)
  const rafIdRef = useRef<number>(0)

  // Create buffer canvas once
  useEffect(() => {
    const buffer = document.createElement('canvas')
    buffer.width = VIRT_W
    buffer.height = VIRT_H
    bufferRef.current = buffer
  }, [])

  // Handle resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.clientWidth * window.devicePixelRatio
    canvas.height = canvas.clientHeight * window.devicePixelRatio
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  // Animation loop
  useEffect(() => {
    const loop = (timestamp: number) => {
      const canvas = canvasRef.current
      const buffer = bufferRef.current
      if (!canvas || !buffer) {
        rafIdRef.current = requestAnimationFrame(loop)
        return
      }

      const ctx = canvas.getContext('2d')
      const bufferCtx = buffer.getContext('2d')
      if (!ctx || !bufferCtx) {
        rafIdRef.current = requestAnimationFrame(loop)
        return
      }

      // Delta time (capped)
      const dt = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.1) : 0.016
      lastTimeRef.current = timestamp

      const state = stateRef.current

      // Process new tick actions
      if (state.currentTick !== null && state.currentTick !== lastTickRef.current) {
        lastTickRef.current = state.currentTick
        animRef.current = processTickActions(animRef.current, state)
      }

      // Update camera
      cameraRef.current = updateCamera(cameraRef.current, dt)

      // Update animation state
      animRef.current = updateAnimState(dt, animRef.current, state)

      // Render
      renderFrame(ctx, bufferCtx, state, cameraRef.current, animRef.current)

      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafIdRef.current)
  }, [stateRef])

  // Click handling
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()

    // Screen coords -> virtual coords (stretch mapping)
    const virtX = ((e.clientX - rect.left) / rect.width) * VIRT_W
    const virtY = ((e.clientY - rect.top) / rect.height) * VIRT_H

    // Bounds check
    if (virtX < 0 || virtX >= VIRT_W || virtY < 0 || virtY >= VIRT_H) return

    const state = stateRef.current

    // Interior mode: click outside room to go back, click inside for agents
    if (state.viewMode === 'interior') {
      const inRoom = virtX >= ROOM_X && virtX < ROOM_X + ROOM_W &&
                     virtY >= ROOM_Y && virtY < ROOM_Y + ROOM_H

      if (!inRoom) {
        // Clicked outside the room — go back to exterior
        dispatch({ type: 'SET_VIEW_MODE', payload: { mode: 'exterior' } })
        cameraRef.current = zoomOut(cameraRef.current)
        return
      }

      // Click inside room — select an agent if present
      if (state.worldState && state.focusedLocation) {
        for (const [agent, loc] of Object.entries(state.worldState.agent_locations)) {
          if (loc === state.focusedLocation) {
            dispatch({ type: 'SELECT_AGENT', payload: agent })
            return
          }
        }
      }
      return
    }

    // Exterior mode: check click regions
    for (const [location, region] of Object.entries(CLICK_REGIONS)) {
      if (
        virtX >= region.x && virtX < region.x + region.w &&
        virtY >= region.y && virtY < region.y + region.h
      ) {
        dispatch({ type: 'SET_VIEW_MODE', payload: { mode: 'interior', location } })
        cameraRef.current = zoomToLocation(cameraRef.current, location)
        return
      }
    }

    // Check if clicking near an agent on the exterior
    if (state.worldState) {
      let closestAgent: string | null = null
      let closestDist = 15 // max click distance in virtual pixels
      for (const [agent, loc] of Object.entries(state.worldState.agent_locations)) {
        const pos = animRef.current.agentPositions[agent]
        if (!pos) continue
        const dx = virtX - pos.x
        const dy = virtY - pos.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < closestDist) {
          closestDist = dist
          closestAgent = agent
        }
      }
      if (closestAgent) {
        dispatch({ type: 'SELECT_AGENT', payload: closestAgent })
        return
      }
    }

    // Clicking empty space deselects
    dispatch({ type: 'SELECT_AGENT', payload: null })
  }, [stateRef, dispatch])

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer',
          imageRendering: 'pixelated',
          background: '#0a0808',
        }}
      />
    </div>
  )
}
