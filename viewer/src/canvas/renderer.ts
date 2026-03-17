import type { AgentName } from '../api/types'
import type { SimState } from '../state/useSimStore'
import type { CameraState } from './camera'
import type { ActiveBubble, ActiveReaction } from './effects'
import { VIRT_W, VIRT_H, ROOM_X, ROOM_Y, ROOM_W, ROOM_H, AGENT_POS_EXTERIOR, CLICK_REGIONS } from './layout'
import { drawSky } from './sky'
import { drawBuilding } from './building'
import { drawInterior } from './interiors'
import { drawExteriorAgents, drawInteriorAgents } from './agents'
import {
  drawSpeechBubble, drawReactionEmote,
  updateBubbles, updateReactions,
  getEmoteForToolCall,
} from './effects'
import { getTransform } from './camera'

export interface AnimState {
  time: number
  agentPositions: Record<string, { x: number; y: number; targetX: number; targetY: number }>
  activeBubbles: ActiveBubble[]
  activeReactions: ActiveReaction[]
  weatherParticles: WeatherParticle[]
}

interface WeatherParticle {
  x: number
  y: number
  speed: number
  size: number
  type: 'rain' | 'snow'
}

export function createAnimState(): AnimState {
  return {
    time: 0,
    agentPositions: {},
    activeBubbles: [],
    activeReactions: [],
    weatherParticles: [],
  }
}

export function updateAnimState(dt: number, anim: AnimState, state: SimState): AnimState {
  const time = anim.time + dt

  // Update agent positions (lerp toward targets)
  const agentPositions = { ...anim.agentPositions }
  if (state.worldState) {
    for (const [agent, location] of Object.entries(state.worldState.agent_locations)) {
      const pos = AGENT_POS_EXTERIOR[location]
      if (!pos) continue

      if (!agentPositions[agent]) {
        agentPositions[agent] = { x: pos.x, y: pos.y, targetX: pos.x, targetY: pos.y }
      } else {
        agentPositions[agent] = {
          ...agentPositions[agent],
          targetX: pos.x,
          targetY: pos.y,
        }
      }

      // Lerp
      const curr = agentPositions[agent]
      const lerpT = 1 - Math.exp(-3 * dt)
      agentPositions[agent] = {
        ...curr,
        x: curr.x + (curr.targetX - curr.x) * lerpT,
        y: curr.y + (curr.targetY - curr.y) * lerpT,
      }
    }
  }

  // Update bubbles and reactions
  const activeBubbles = updateBubbles(anim.activeBubbles, dt)
  const activeReactions = updateReactions(anim.activeReactions, dt)

  // Update weather
  const weatherParticles = updateWeather(anim.weatherParticles, dt, state.worldState?.weather ?? '')

  return { time, agentPositions, activeBubbles, activeReactions, weatherParticles }
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  bufferCtx: CanvasRenderingContext2D,
  state: SimState,
  camera: CameraState,
  anim: AnimState,
) {
  // Clear buffer
  bufferCtx.clearRect(0, 0, VIRT_W, VIRT_H)

  const hour = getHourFromState(state)
  const transform = getTransform(camera)

  bufferCtx.save()
  bufferCtx.translate(transform.offsetX, transform.offsetY)
  bufferCtx.scale(transform.scale, transform.scale)

  if (state.viewMode === 'interior' && state.focusedLocation) {
    renderInteriorMode(bufferCtx, state, anim)
  } else {
    renderExteriorMode(bufferCtx, state, anim, hour)
  }

  bufferCtx.restore()

  // Draw weather overlay (in virtual coords, not affected by camera)
  drawWeatherParticles(bufferCtx, anim.weatherParticles)

  // Scale buffer to fill entire main canvas (stretch to fit)
  const canvasW = ctx.canvas.width
  const canvasH = ctx.canvas.height
  ctx.clearRect(0, 0, canvasW, canvasH)

  ;(ctx as any).imageSmoothingEnabled = false
  ctx.drawImage(bufferCtx.canvas, 0, 0, VIRT_W, VIRT_H, 0, 0, canvasW, canvasH)

  // Draw UI text on main canvas at full resolution (crisp text)
  const scaleX = canvasW / VIRT_W
  const scaleY = canvasH / VIRT_H
  drawUIOverlays(ctx, state, scaleX, scaleY)
}

function renderExteriorMode(
  ctx: CanvasRenderingContext2D,
  state: SimState,
  anim: AnimState,
  hour: number,
) {
  // Sky
  drawSky(ctx, hour, 45, anim.time)

  // Occupied locations for window glow
  const occupied = new Set<string>()
  if (state.worldState) {
    for (const loc of Object.values(state.worldState.agent_locations)) {
      occupied.add(loc)
    }
  }

  // Building
  drawBuilding(ctx, occupied)

  // Activity indicators — pulsing highlight on locations with conversations
  drawActivityIndicators(ctx, state.activeLocations, anim.time)

  // Location labels on building (subtle, to hint clickability)
  drawLocationLabels(ctx, state.activeLocations)

  // Agents
  if (state.worldState) {
    drawExteriorAgents(ctx, state.worldState.agent_locations, state.selectedAgent, anim.time)
  }

  // Speech bubbles
  for (const bubble of anim.activeBubbles) {
    const agentPos = anim.agentPositions[bubble.agentName]
    if (agentPos) {
      drawSpeechBubble(ctx, agentPos.x, agentPos.y - 16, bubble.text, bubble.type)
    }
  }

  // Reaction emotes
  for (const reaction of anim.activeReactions) {
    const progress = reaction.timer / reaction.maxTime
    const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3
    drawReactionEmote(ctx, reaction.x, reaction.y, reaction.emoteType, alpha)
  }
}

function renderInteriorMode(
  ctx: CanvasRenderingContext2D,
  state: SimState,
  anim: AnimState,
) {
  const location = state.focusedLocation
  if (!location) return

  // Dark background
  ctx.fillStyle = '#0a0808'
  ctx.fillRect(0, 0, VIRT_W, VIRT_H)

  // Draw room
  drawInterior(ctx, location)

  // Draw agents in the room
  if (state.worldState) {
    const agentsHere: AgentName[] = []
    for (const [agent, loc] of Object.entries(state.worldState.agent_locations)) {
      if (loc === location) agentsHere.push(agent as AgentName)
    }
    if (agentsHere.length > 0) {
      drawInteriorAgents(ctx, agentsHere, ROOM_X, ROOM_Y, ROOM_W, ROOM_H, state.selectedAgent, anim.time)
    }
  }

  // Bubbles (in interior)
  for (const bubble of anim.activeBubbles) {
    if (state.worldState && state.worldState.agent_locations[bubble.agentName] === location) {
      const interiorX = ROOM_X + ROOM_W / 2
      const interiorY = ROOM_Y + ROOM_H - 40
      drawSpeechBubble(ctx, interiorX, interiorY, bubble.text, bubble.type)
    }
  }

  // Reactions (in interior)
  for (const reaction of anim.activeReactions) {
    if (state.worldState && state.worldState.agent_locations[reaction.agentName] === location) {
      const progress = reaction.timer / reaction.maxTime
      const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3
      const ry = ROOM_Y + ROOM_H / 2 - progress * 20
      drawReactionEmote(ctx, ROOM_X + ROOM_W / 2, ry, reaction.emoteType, alpha)
    }
  }
}

// --- Activity indicators on building exterior ---
function drawActivityIndicators(ctx: CanvasRenderingContext2D, activeLocations: Set<string>, time: number) {
  if (activeLocations.size === 0) return

  const pulse = 0.5 + 0.5 * Math.sin(time * 4) // 0..1 pulsing

  for (const loc of activeLocations) {
    const region = CLICK_REGIONS[loc]
    if (!region) continue

    // Pulsing border highlight
    const alpha = Math.floor(40 + pulse * 60)
    ctx.fillStyle = `rgba(232, 164, 74, ${alpha / 255})`
    // Top edge
    ctx.fillRect(region.x, region.y, region.w, 1)
    // Bottom edge
    ctx.fillRect(region.x, region.y + region.h - 1, region.w, 1)
    // Left edge
    ctx.fillRect(region.x, region.y, 1, region.h)
    // Right edge
    ctx.fillRect(region.x + region.w - 1, region.y, 1, region.h)

    // Small speech icon (4x4 bubble) near the top-right of active region
    const iconX = region.x + region.w - 8
    const iconY = region.y + 2
    const iconAlpha = 0.6 + pulse * 0.4
    ctx.fillStyle = `rgba(255, 255, 255, ${iconAlpha})`
    ctx.fillRect(iconX, iconY, 5, 3)
    ctx.fillRect(iconX + 1, iconY + 3, 1, 1) // speech tail
  }
}

// --- Location labels on building ---
function drawLocationLabels(ctx: CanvasRenderingContext2D, activeLocations: Set<string>) {
  const labelDefs: { loc: string; x: number; y: number; text: string }[] = [
    { loc: 'Apartment 6', x: CLICK_REGIONS['Apartment 6'].x + 2, y: CLICK_REGIONS['Apartment 6'].y + 2, text: 'Suki' },
    { loc: 'Apartment 5', x: CLICK_REGIONS['Apartment 5'].x + 2, y: CLICK_REGIONS['Apartment 5'].y + 2, text: 'Marco&Sarah' },
    { loc: 'Apartment 4', x: CLICK_REGIONS['Apartment 4'].x + 2, y: CLICK_REGIONS['Apartment 4'].y + 2, text: 'Hakim' },
    { loc: 'Apartment 3', x: CLICK_REGIONS['Apartment 3'].x + 2, y: CLICK_REGIONS['Apartment 3'].y + 2, text: 'Rolf' },
    { loc: 'Apartment 2', x: CLICK_REGIONS['Apartment 2'].x + 2, y: CLICK_REGIONS['Apartment 2'].y + 2, text: 'leer' },
    { loc: 'Apartment 1', x: CLICK_REGIONS['Apartment 1'].x + 2, y: CLICK_REGIONS['Apartment 1'].y + 2, text: 'Marta' },
  ]

  for (const def of labelDefs) {
    const isActive = activeLocations.has(def.loc)
    // Background pill
    const textW = def.text.length * 4 + 3
    ctx.fillStyle = isActive ? 'rgba(232, 164, 74, 0.7)' : 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(def.x, def.y, textW, 7)
    // Text
    ctx.fillStyle = isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)'
    drawPixelText(ctx, def.text, def.x + 1, def.y + 1)
  }
}

// Tiny 3x5 pixel font for buffer canvas labels
function drawPixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === ' ') continue
    // Simple 3-line representation per character
    ctx.fillRect(x + i * 4, y + 0, 3, 1)
    ctx.fillRect(x + i * 4, y + 2, 2, 1)
    ctx.fillRect(x + i * 4, y + 4, 3, 1)
  }
}

function drawUIOverlays(
  ctx: CanvasRenderingContext2D,
  state: SimState,
  sx: number,
  sy: number,
) {
  // Interior mode: location name header + instructions
  if (state.viewMode === 'interior' && state.focusedLocation) {
    const label = CLICK_REGIONS[state.focusedLocation]?.label || state.focusedLocation

    // Location name banner at top
    const fontSize = Math.floor(Math.min(sx, sy) * 12)
    ctx.font = `bold ${fontSize}px 'SF Mono', 'Fira Code', monospace`
    const textW = ctx.measureText(label).width
    const bannerW = textW + 40 * sx
    const bannerX = (ctx.canvas.width - bannerW) / 2
    const bannerY = 48 * sy // below top bar

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(bannerX, bannerY, bannerW, 28 * sy)
    ctx.fillStyle = '#e8a44a'
    ctx.fillText(label, bannerX + 20 * sx, bannerY + 19 * sy)

    // "ESC or click here to go back" hint at bottom-left
    const hintFontSize = Math.floor(Math.min(sx, sy) * 9)
    ctx.font = `${hintFontSize}px 'SF Mono', 'Fira Code', monospace`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fillText('ESC to go back', 12 * sx, ctx.canvas.height - 70 * sy)
  }

  // Exterior mode: "Click an apartment to enter" hint (subtle, at bottom)
  if (state.viewMode === 'exterior') {
    const hintFontSize = Math.floor(Math.min(sx, sy) * 8)
    ctx.font = `${hintFontSize}px 'SF Mono', 'Fira Code', monospace`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillText('Click a window to enter', 12 * sx, ctx.canvas.height - 70 * sy)
  }
}

function getHourFromState(state: SimState): number {
  if (!state.worldState?.current_time) return 12
  const match = state.worldState.current_time.match(/(\d{1,2}):(\d{2})/)
  if (match) return parseInt(match[1], 10)
  return 12
}

// --- Weather ---
function updateWeather(particles: WeatherParticle[], dt: number, weather: string): WeatherParticle[] {
  const isRain = weather.toLowerCase().includes('rain') || weather.toLowerCase().includes('regen')
  const isSnow = weather.toLowerCase().includes('snow') || weather.toLowerCase().includes('schnee')

  if (!isRain && !isSnow) return []

  const type = isSnow ? 'snow' : 'rain'
  let updated = particles
    .map(p => ({
      ...p,
      y: p.y + p.speed * dt * 60,
      x: p.x + (type === 'snow' ? Math.sin(p.y * 0.05) * 0.3 : 0),
    }))
    .filter(p => p.y < VIRT_H)

  const spawnRate = type === 'rain' ? 3 : 1
  for (let i = 0; i < spawnRate; i++) {
    if (Math.random() < 0.3) {
      updated.push({
        x: Math.random() * VIRT_W,
        y: -2,
        speed: type === 'rain' ? 2 + Math.random() * 2 : 0.5 + Math.random() * 0.5,
        size: type === 'rain' ? 1 : 2,
        type,
      })
    }
  }

  if (updated.length > 100) {
    updated = updated.slice(updated.length - 100)
  }

  return updated
}

function drawWeatherParticles(ctx: CanvasRenderingContext2D, particles: WeatherParticle[]) {
  for (const p of particles) {
    if (p.type === 'rain') {
      ctx.fillStyle = 'rgba(160, 180, 220, 0.5)'
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 3)
    } else {
      ctx.fillStyle = 'rgba(240, 240, 255, 0.7)'
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size)
    }
  }
}

export function addBubble(anim: AnimState, agentName: string, text: string, type: 'speak' | 'think'): AnimState {
  const bubble: ActiveBubble = {
    agentName, text, type,
    timer: 0,
    maxTime: 3,
  }
  return {
    ...anim,
    activeBubbles: [...anim.activeBubbles, bubble],
  }
}

export function addReaction(anim: AnimState, agentName: string, emoteType: string, x: number, y: number): AnimState {
  const reaction: ActiveReaction = {
    agentName, emoteType,
    x, y,
    startY: y,
    timer: 0,
    maxTime: 2,
  }
  return {
    ...anim,
    activeReactions: [...anim.activeReactions, reaction],
  }
}

export function processTickActions(anim: AnimState, state: SimState): AnimState {
  if (!state.tickData) return anim

  let updated = anim
  for (const [_loc, locData] of Object.entries(state.tickData.locations)) {
    for (const round of locData.rounds) {
      for (const action of round.actions) {
        for (const tc of action.tool_calls) {
          const emoteType = getEmoteForToolCall(tc.tool, tc.args)
          if (emoteType) {
            const agentPos = anim.agentPositions[action.agent]
            const x = agentPos?.x ?? VIRT_W / 2
            const y = agentPos?.y ?? VIRT_H / 2
            updated = addReaction(updated, action.agent, emoteType, x, y - 10)
          }

          if (tc.tool === 'speak') {
            const text = (tc.args.text || tc.args.message || '') as string
            if (text) {
              updated = addBubble(updated, action.agent, text, 'speak')
            }
          } else if (tc.tool === 'think') {
            const text = (tc.args.text || tc.args.thought || '') as string
            if (text) {
              updated = addBubble(updated, action.agent, text, 'think')
            }
          } else if (tc.tool === 'do') {
            const text = (tc.args.text || '') as string
            if (text) {
              updated = addBubble(updated, action.agent, text, 'speak')
            }
          }
        }
      }
    }
  }

  return updated
}
