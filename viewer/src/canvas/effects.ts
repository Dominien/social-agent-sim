import { EMOTES, EMOTE_PALETTE } from './sprites'
import type { EmotePx } from './sprites'

export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  type: 'speak' | 'think',
) {
  const maxChars = 20
  const displayText = text.length > maxChars ? text.slice(0, maxChars - 2) + '..' : text
  const charW = 4
  const padding = 3
  const bubbleW = displayText.length * charW + padding * 2
  const bubbleH = 10
  const bx = Math.floor(x - bubbleW / 2)
  const by = Math.floor(y - bubbleH - 6)

  if (type === 'think') {
    // Thought bubble: rounded with dots trailing down
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(bx + 1, by, bubbleW - 2, bubbleH)
    ctx.fillRect(bx, by + 1, bubbleW, bubbleH - 2)
    // Border
    ctx.fillStyle = '#b0b0b0'
    ctx.fillRect(bx + 1, by, bubbleW - 2, 1)
    ctx.fillRect(bx + 1, by + bubbleH - 1, bubbleW - 2, 1)
    ctx.fillRect(bx, by + 1, 1, bubbleH - 2)
    ctx.fillRect(bx + bubbleW - 1, by + 1, 1, bubbleH - 2)
    // Trailing dots
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(x - 1, by + bubbleH + 1, 3, 3)
    ctx.fillStyle = '#b0b0b0'
    ctx.fillRect(x - 1, by + bubbleH + 1, 3, 1)
    ctx.fillRect(x - 1, by + bubbleH + 3, 3, 1)
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(x, by + bubbleH + 5, 2, 2)
  } else {
    // Speech bubble with pointer
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(bx + 1, by, bubbleW - 2, bubbleH)
    ctx.fillRect(bx, by + 1, bubbleW, bubbleH - 2)
    // Border
    ctx.fillStyle = '#808080'
    ctx.fillRect(bx + 1, by, bubbleW - 2, 1)
    ctx.fillRect(bx + 1, by + bubbleH - 1, bubbleW - 2, 1)
    ctx.fillRect(bx, by + 1, 1, bubbleH - 2)
    ctx.fillRect(bx + bubbleW - 1, by + 1, 1, bubbleH - 2)
    // Pointer triangle
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 2, by + bubbleH, 4, 1)
    ctx.fillRect(x - 1, by + bubbleH + 1, 2, 1)
    ctx.fillRect(x, by + bubbleH + 2, 1, 1)
    // Pointer border
    ctx.fillStyle = '#808080'
    ctx.fillRect(x - 3, by + bubbleH, 1, 1)
    ctx.fillRect(x - 2, by + bubbleH + 1, 1, 1)
    ctx.fillRect(x - 1, by + bubbleH + 2, 1, 1)
    ctx.fillRect(x + 2, by + bubbleH, 1, 1)
    ctx.fillRect(x + 1, by + bubbleH + 1, 1, 1)
  }

  // Text
  drawBubbleText(ctx, displayText, bx + padding, by + 2, '#1a1a1a')
}

export function drawReactionEmote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  emoteType: string,
  alpha: number,
) {
  const emote = EMOTES[emoteType]
  if (!emote) return

  const size = 1 // each emote pixel = 1 virtual pixel
  const startX = Math.floor(x - 4)
  const startY = Math.floor(y - 4)

  for (let row = 0; row < emote.length; row++) {
    for (let col = 0; col < emote[row].length; col++) {
      const px = emote[row][col] as EmotePx
      const color = EMOTE_PALETTE[px]
      if (!color) continue
      if (alpha < 1) {
        ctx.fillStyle = hexToRgba(color, alpha)
      } else {
        ctx.fillStyle = color
      }
      ctx.fillRect(startX + col * size, startY + row * size, size, size)
    }
  }
}

export function getEmoteForToolCall(tool: string, args: Record<string, unknown>): string | null {
  switch (tool) {
    // Actual tool names from the simulation engine (src/types.ts)
    case 'speak':
      return 'speech'
    case 'think':
      return 'thought'
    case 'do': {
      // Context-based: parse the action text for keywords
      const text = String(args.text || '').toLowerCase()
      if (text.match(/cook|eat|breakfast|lunch|dinner|food|fridge|bread|egg|coffee/)) return 'food'
      if (text.match(/sleep|nap|bed|rest|yawn|tired/)) return 'zzz'
      if (text.match(/read|book|letter|newspaper|mail/)) return 'paper'
      if (text.match(/music|sing|hum|guitar|radio/)) return 'music'
      return 'exclamation' // generic action indicator
    }
    case 'move_to':
      return 'footsteps'
    case 'check_mailbox':
    case 'read':
    case 'leave_note':
      return 'paper'
    case 'knock_door':
      return 'exclamation'
    case 'phone_call':
    case 'send_message':
      return 'phone'
    case 'lock_door':
    case 'unlock_door':
      return null
    case 'file_objection':
    case 'check_deadline':
      return 'paper'
    case 'wait':
      return null
    default:
      if (args.text || args.message) return 'speech'
      return null
  }
}

export interface ActiveBubble {
  agentName: string
  text: string
  type: 'speak' | 'think'
  timer: number
  maxTime: number
}

export interface ActiveReaction {
  agentName: string
  emoteType: string
  x: number
  y: number
  startY: number
  timer: number
  maxTime: number
}

export function updateBubbles(bubbles: ActiveBubble[], dt: number): ActiveBubble[] {
  return bubbles
    .map(b => ({ ...b, timer: b.timer + dt }))
    .filter(b => b.timer < b.maxTime)
}

export function updateReactions(reactions: ActiveReaction[], dt: number): ActiveReaction[] {
  return reactions
    .map(r => ({
      ...r,
      timer: r.timer + dt,
      y: r.startY - (r.timer / r.maxTime) * 12, // float upward
    }))
    .filter(r => r.timer < r.maxTime)
}

// Simple 3x5 pixel font for bubble text
const BUBBLE_FONT: Record<string, number[]> = {
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
  '.': [0b000, 0b000, 0b000, 0b000, 0b010],
  ',': [0b000, 0b000, 0b000, 0b010, 0b100],
  '!': [0b010, 0b010, 0b010, 0b000, 0b010],
  '?': [0b110, 0b001, 0b010, 0b000, 0b010],
  '-': [0b000, 0b000, 0b111, 0b000, 0b000],
  "'": [0b010, 0b010, 0b000, 0b000, 0b000],
}

function drawBubbleText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.fillStyle = color
  let cx = x
  for (const ch of text.toLowerCase()) {
    const glyph = BUBBLE_FONT[ch]
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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
