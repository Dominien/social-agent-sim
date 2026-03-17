import { getSkyColors } from './colors'
import { VIRT_W } from './layout'

const CLOUD_SHAPES = [
  { x: 60, y: 12, w: 30, h: 8 },
  { x: 200, y: 8, w: 40, h: 10 },
  { x: 380, y: 15, w: 35, h: 9 },
]

const STAR_POSITIONS = [
  { x: 20, y: 5 }, { x: 55, y: 18 }, { x: 90, y: 8 },
  { x: 130, y: 14 }, { x: 170, y: 4 }, { x: 210, y: 20 },
  { x: 260, y: 7 }, { x: 300, y: 16 }, { x: 340, y: 3 },
  { x: 370, y: 22 }, { x: 410, y: 10 }, { x: 450, y: 6 },
  { x: 35, y: 25 }, { x: 115, y: 28 }, { x: 275, y: 25 },
  { x: 430, y: 20 }, { x: 160, y: 30 }, { x: 320, y: 28 },
]

export function drawSky(ctx: CanvasRenderingContext2D, hour: number, skyHeight: number, time: number) {
  const colors = getSkyColors(hour)

  // Gradient sky using horizontal bands
  const steps = 16
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    const color = lerpColor(colors.top, colors.bottom, t)
    const bandY = Math.floor((i / steps) * skyHeight)
    const bandH = Math.ceil(skyHeight / steps) + 1
    ctx.fillStyle = color
    ctx.fillRect(0, bandY, VIRT_W, bandH)
  }

  // Sun or Moon
  if (hour >= 6 && hour < 20) {
    drawSun(ctx, hour, time)
  } else {
    drawMoon(ctx, hour)
  }

  // Stars at night
  if (hour < 6 || hour >= 20) {
    drawStars(ctx, hour, time)
  } else if (hour >= 18 && hour < 20) {
    // Fading in stars at dusk
    drawStars(ctx, hour, time, (hour - 18) / 2)
  }

  // Clouds (during daytime and twilight)
  if (hour >= 5 && hour < 22) {
    drawClouds(ctx, time, hour)
  }
}

function drawSun(ctx: CanvasRenderingContext2D, hour: number, _time: number) {
  // Sun arcs from east to west over the day
  const progress = (hour - 6) / 14 // 0..1 from 6am to 8pm
  const sunX = 40 + progress * (VIRT_W - 80)
  const sunY = 35 - Math.sin(progress * Math.PI) * 28

  // Glow
  ctx.fillStyle = 'rgba(255, 240, 180, 0.3)'
  fillCircle(ctx, sunX, sunY, 8)

  // Sun body
  ctx.fillStyle = '#ffe060'
  fillCircle(ctx, sunX, sunY, 5)

  // Bright center
  ctx.fillStyle = '#fff8c0'
  fillCircle(ctx, sunX, sunY, 3)
}

function drawMoon(ctx: CanvasRenderingContext2D, hour: number) {
  const nightProgress = hour >= 20 ? (hour - 20) / 10 : (hour + 4) / 10
  const moonX = 80 + nightProgress * (VIRT_W - 160)
  const moonY = 20 - Math.sin(nightProgress * Math.PI) * 12

  // Moon body
  ctx.fillStyle = '#e8e0d0'
  fillCircle(ctx, moonX, moonY, 5)

  // Crescent shadow
  ctx.fillStyle = getSkyColors(hour).top
  fillCircle(ctx, moonX + 2, moonY - 1, 4)
}

function drawStars(ctx: CanvasRenderingContext2D, _hour: number, time: number, alpha = 1) {
  for (let i = 0; i < STAR_POSITIONS.length; i++) {
    const s = STAR_POSITIONS[i]
    // Twinkle effect
    const twinkle = Math.sin(time * 2 + i * 1.7) * 0.3 + 0.7
    const a = Math.min(1, twinkle * alpha)
    ctx.fillStyle = `rgba(255, 255, 240, ${a})`
    ctx.fillRect(s.x, s.y, 1, 1)
    // Some stars get a cross sparkle
    if (i % 3 === 0 && twinkle > 0.85) {
      ctx.fillRect(s.x - 1, s.y, 1, 1)
      ctx.fillRect(s.x + 1, s.y, 1, 1)
      ctx.fillRect(s.x, s.y - 1, 1, 1)
      ctx.fillRect(s.x, s.y + 1, 1, 1)
    }
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, time: number, hour: number) {
  const brightness = (hour >= 6 && hour < 18) ? 1 : 0.4
  for (const cloud of CLOUD_SHAPES) {
    const drift = ((time * 3 + cloud.x) % (VIRT_W + 60)) - 30
    const alpha = 0.6 * brightness
    drawPixelCloud(ctx, drift, cloud.y, cloud.w, cloud.h, alpha)
  }
}

function drawPixelCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number) {
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
  // Main body
  ctx.fillRect(Math.floor(x), Math.floor(y + h * 0.3), w, Math.floor(h * 0.5))
  // Top bumps
  ctx.fillRect(Math.floor(x + w * 0.15), Math.floor(y), Math.floor(w * 0.3), Math.floor(h * 0.5))
  ctx.fillRect(Math.floor(x + w * 0.45), Math.floor(y + h * 0.1), Math.floor(w * 0.35), Math.floor(h * 0.45))
  // Slightly brighter highlight
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`
  ctx.fillRect(Math.floor(x + w * 0.2), Math.floor(y + h * 0.1), Math.floor(w * 0.2), Math.floor(h * 0.2))
}

function fillCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Pixel art circle using filled rects
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        ctx.fillRect(Math.floor(cx + dx), Math.floor(cy + dy), 1, 1)
      }
    }
  }
}

function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16)
  const ag = parseInt(a.slice(3, 5), 16)
  const ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16)
  const bg = parseInt(b.slice(3, 5), 16)
  const bb = parseInt(b.slice(5, 7), 16)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}
