import type { AgentName } from '../api/types'
import { AGENT_COLORS, AGENT_STYLE } from './colors'
import { SPRITES, resolveColor } from './sprites'
import { AGENT_POS_EXTERIOR } from './layout'

export function drawAgentSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  agentName: AgentName,
  scale: number,
  frame: 'idle' | 'walk',
) {
  const sprite = SPRITES[agentName]
  if (!sprite) return

  const data = frame === 'walk' ? sprite.walk : sprite.idle
  const pw = scale  // pixel width
  const ph = scale  // pixel height

  // Sprite is 10x14, draw centered at x, anchored at bottom y
  const startX = Math.floor(x - (10 * pw) / 2)
  const startY = Math.floor(y - 14 * ph)

  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < data[row].length; col++) {
      const color = resolveColor(data[row][col], agentName)
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(
        startX + col * pw,
        startY + row * ph,
        Math.ceil(pw),
        Math.ceil(ph),
      )
    }
  }
}

export function drawAgentSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  agentName: AgentName,
) {
  const color = AGENT_COLORS[agentName]
  ctx.fillStyle = color

  // Tiny 4x6 silhouette shape: head + body
  // Head (2x2 centered)
  ctx.fillRect(x + 1, y, 2, 2)
  // Body (4x3)
  ctx.fillRect(x, y + 2, 4, 3)
  // Legs (2x1)
  ctx.fillRect(x, y + 5, 1, 1)
  ctx.fillRect(x + 3, y + 5, 1, 1)
}

export function drawAgentHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  agentName: AgentName,
  time: number,
) {
  const color = AGENT_COLORS[agentName]
  const pulse = Math.sin(time * 4) * 0.3 + 0.4
  ctx.fillStyle = color + Math.floor(pulse * 255).toString(16).padStart(2, '0')
  // Draw a small circle indicator under the agent
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (Math.abs(dx) + Math.abs(dy) <= 3) {
        ctx.fillRect(x + dx, y + dy, 1, 1)
      }
    }
  }
}

export interface AgentRenderInfo {
  name: AgentName
  x: number
  y: number
  frame: 'idle' | 'walk'
}

export function getExteriorAgentPositions(
  agentLocations: Record<string, string>,
): AgentRenderInfo[] {
  // Group agents by location
  const byLocation: Record<string, AgentName[]> = {}
  for (const [agent, location] of Object.entries(agentLocations)) {
    if (!byLocation[location]) byLocation[location] = []
    byLocation[location].push(agent as AgentName)
  }

  const result: AgentRenderInfo[] = []

  for (const [location, agents] of Object.entries(byLocation)) {
    const pos = AGENT_POS_EXTERIOR[location]
    if (!pos) continue

    // Spread agents horizontally if multiple at the same location
    const spread = agents.length > 1 ? 8 : 0
    const startOffset = -(agents.length - 1) * spread / 2

    for (let i = 0; i < agents.length; i++) {
      result.push({
        name: agents[i],
        x: pos.x + startOffset + i * spread,
        y: pos.y,
        frame: 'idle',
      })
    }
  }

  return result
}

export function drawExteriorAgents(
  ctx: CanvasRenderingContext2D,
  agentLocations: Record<string, string>,
  selectedAgent: string | null,
  time: number,
) {
  const byLocation: Record<string, AgentName[]> = {}
  for (const [agent, location] of Object.entries(agentLocations)) {
    if (!byLocation[location]) byLocation[location] = []
    byLocation[location].push(agent as AgentName)
  }

  for (const [location, agents] of Object.entries(byLocation)) {
    const pos = AGENT_POS_EXTERIOR[location]
    if (!pos) continue

    if (pos.inside) {
      // Draw silhouettes in windows
      const spread = agents.length > 1 ? 6 : 0
      const startOffset = -(agents.length - 1) * spread / 2
      for (let i = 0; i < agents.length; i++) {
        const ax = pos.x + startOffset + i * spread - 2
        const ay = pos.y - 8
        drawAgentSilhouette(ctx, ax, ay, agents[i])
      }
    } else {
      // Draw full sprites outside
      const spread = agents.length > 1 ? 12 : 0
      const startOffset = -(agents.length - 1) * spread / 2
      const walkFrame = Math.floor(time * 2) % 2 === 0
      for (let i = 0; i < agents.length; i++) {
        const ax = pos.x + startOffset + i * spread
        const ay = pos.y

        if (selectedAgent === agents[i]) {
          drawAgentHighlight(ctx, ax, ay + 1, agents[i], time)
        }
        drawAgentSprite(ctx, ax, ay, agents[i], 1, walkFrame ? 'walk' : 'idle')
      }
    }
  }
}

export function drawInteriorAgents(
  ctx: CanvasRenderingContext2D,
  agents: AgentName[],
  roomX: number,
  roomY: number,
  roomW: number,
  roomH: number,
  selectedAgent: string | null,
  time: number,
) {
  const floorY = roomY + roomH - 4
  const spread = agents.length > 1 ? Math.min(40, (roomW - 40) / agents.length) : 0
  const startX = roomX + roomW / 2 - (agents.length - 1) * spread / 2

  for (let i = 0; i < agents.length; i++) {
    const ax = startX + i * spread
    const ay = floorY
    const walkFrame = Math.floor(time * 2) % 2 === 0

    if (selectedAgent === agents[i]) {
      drawAgentHighlight(ctx, ax, ay + 1, agents[i], time)
    }
    drawAgentSprite(ctx, ax, ay, agents[i], 2, walkFrame ? 'walk' : 'idle')

    // Name label
    ctx.fillStyle = AGENT_STYLE[agents[i]].clothes
    const labelW = agents[i].length * 4 + 4
    ctx.fillRect(ax - labelW / 2, ay - 30, labelW, 7)
    drawTinyText(ctx, agents[i], ax - labelW / 2 + 2, ay - 29, '#ffffff')
  }
}

// Minimal 3x5 pixel font for agent names
const TINY_FONT: Record<string, number[]> = {
  'a': [0b010, 0b101, 0b111, 0b101, 0b101],
  'b': [0b110, 0b101, 0b110, 0b101, 0b110],
  'c': [0b011, 0b100, 0b100, 0b100, 0b011],
  'd': [0b110, 0b101, 0b101, 0b101, 0b110],
  'e': [0b111, 0b100, 0b110, 0b100, 0b111],
  'f': [0b111, 0b100, 0b110, 0b100, 0b100],
  'g': [0b011, 0b100, 0b101, 0b101, 0b011],
  'h': [0b101, 0b101, 0b111, 0b101, 0b101],
  'i': [0b111, 0b010, 0b010, 0b010, 0b111],
  'j': [0b001, 0b001, 0b001, 0b101, 0b010],
  'k': [0b101, 0b110, 0b100, 0b110, 0b101],
  'l': [0b100, 0b100, 0b100, 0b100, 0b111],
  'm': [0b101, 0b111, 0b111, 0b101, 0b101],
  'n': [0b101, 0b111, 0b111, 0b101, 0b101],
  'o': [0b010, 0b101, 0b101, 0b101, 0b010],
  'p': [0b110, 0b101, 0b110, 0b100, 0b100],
  'q': [0b010, 0b101, 0b101, 0b110, 0b011],
  'r': [0b110, 0b101, 0b110, 0b101, 0b101],
  's': [0b011, 0b100, 0b010, 0b001, 0b110],
  't': [0b111, 0b010, 0b010, 0b010, 0b010],
  'u': [0b101, 0b101, 0b101, 0b101, 0b010],
  'v': [0b101, 0b101, 0b101, 0b010, 0b010],
  'w': [0b101, 0b101, 0b111, 0b111, 0b101],
  'x': [0b101, 0b101, 0b010, 0b101, 0b101],
  'y': [0b101, 0b101, 0b010, 0b010, 0b010],
  'z': [0b111, 0b001, 0b010, 0b100, 0b111],
  ' ': [0b000, 0b000, 0b000, 0b000, 0b000],
}

function drawTinyText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.fillStyle = color
  let cx = x
  for (const ch of text.toLowerCase()) {
    const glyph = TINY_FONT[ch]
    if (!glyph) { cx += 4; continue }
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (glyph[row] & (1 << (2 - col))) {
          ctx.fillRect(cx + col, y + row, 1, 1)
        }
      }
    }
    cx += 4
  }
}

export { drawTinyText }
