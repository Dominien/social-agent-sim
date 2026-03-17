import { BLDG, ENV } from './colors'
import {
  VIRT_W, VIRT_H,
  BLDG_X, BLDG_W, BLDG_R, BLDG_MID,
  ROOF_PEAK_Y, ROOF_BASE_Y, FLOOR_H, FLOOR_Y,
  STREET_Y, GROUND_Y,
  WINDOWS,
} from './layout'

export function drawBuilding(ctx: CanvasRenderingContext2D, occupiedLocations: Set<string>) {
  drawStreetAndSidewalk(ctx)
  drawSpaetiShop(ctx)
  drawZumAnkerBar(ctx)
  drawBuildingFacade(ctx, occupiedLocations)
  drawRoof(ctx)
  drawGroundFloor(ctx)
  drawStairwell(ctx)
  drawBackyard(ctx)
}

function drawStreetAndSidewalk(ctx: CanvasRenderingContext2D) {
  // Sidewalk
  ctx.fillStyle = ENV.sidewalk
  ctx.fillRect(0, STREET_Y, VIRT_W, 16)

  // Sidewalk edge detail
  ctx.fillStyle = '#a09880'
  ctx.fillRect(0, STREET_Y, VIRT_W, 1)
  ctx.fillRect(0, STREET_Y + 15, VIRT_W, 1)

  // Sidewalk tile lines
  ctx.fillStyle = '#a8a088'
  for (let x = 0; x < VIRT_W; x += 20) {
    ctx.fillRect(x, STREET_Y + 1, 1, 14)
  }

  // Street
  ctx.fillStyle = ENV.street
  ctx.fillRect(0, GROUND_Y, VIRT_W, VIRT_H - GROUND_Y)

  // Street center line (dashed)
  ctx.fillStyle = ENV.streetLine
  for (let x = 10; x < VIRT_W; x += 16) {
    ctx.fillRect(x, GROUND_Y + 20, 8, 2)
  }
}

function drawBuildingFacade(ctx: CanvasRenderingContext2D, occupied: Set<string>) {
  // Main facade
  ctx.fillStyle = BLDG.brick
  ctx.fillRect(BLDG_X, ROOF_BASE_Y, BLDG_W, FLOOR_Y.ground + 30 - ROOF_BASE_Y)

  // Brick texture
  for (let y = ROOF_BASE_Y; y < FLOOR_Y.ground + 30; y += 4) {
    const offset = ((y / 4) % 2) * 6
    ctx.fillStyle = (y % 8 < 4) ? BLDG.brickDark : BLDG.brickLight
    for (let x = BLDG_X + offset; x < BLDG_R; x += 12) {
      ctx.fillRect(x, y, 1, 4)
    }
    // Mortar lines
    ctx.fillStyle = BLDG.mortar
    ctx.fillRect(BLDG_X, y + 3, BLDG_W, 1)
  }

  // Smooth over with semi-transparent base
  ctx.fillStyle = BLDG.brick + 'a0'
  ctx.fillRect(BLDG_X, ROOF_BASE_Y, BLDG_W, FLOOR_Y.ground + 30 - ROOF_BASE_Y)

  // Cornices between floors
  const corniceFloors = [FLOOR_Y.apt5, FLOOR_Y.apt3, FLOOR_Y.apt1, FLOOR_Y.ground]
  for (const fy of corniceFloors) {
    drawCornice(ctx, fy)
  }

  // Floor divider for split apartments (vertical line at BLDG_MID)
  ctx.fillStyle = BLDG.mortar
  ctx.fillRect(BLDG_MID, FLOOR_Y.apt5, 1, FLOOR_H * 2)

  // Windows
  for (const [loc, wins] of Object.entries(WINDOWS)) {
    const isOccupied = occupied.has(loc)
    for (const w of wins) {
      drawWindow(ctx, w.x, w.y, w.w, w.h, isOccupied)
    }
  }

  // Flower boxes under Marta's (Apt 1) and Suki's (Apt 6) windows
  const flowerBoxLocations = ['Apartment 1', 'Apartment 6']
  for (const loc of flowerBoxLocations) {
    const wins = WINDOWS[loc]
    if (!wins) continue
    for (const w of wins) {
      drawFlowerBox(ctx, w.x, w.y + w.h, w.w)
    }
  }

  // Address sign
  drawAddressSign(ctx, BLDG_X + BLDG_W / 2 - 20, FLOOR_Y.ground + 3)

  // Side edges of building
  ctx.fillStyle = BLDG.brickDark
  ctx.fillRect(BLDG_X, ROOF_BASE_Y, 2, STREET_Y - ROOF_BASE_Y)
  ctx.fillRect(BLDG_R - 2, ROOF_BASE_Y, 2, STREET_Y - ROOF_BASE_Y)
}

function drawCornice(ctx: CanvasRenderingContext2D, y: number) {
  ctx.fillStyle = BLDG.cornice
  ctx.fillRect(BLDG_X - 2, y - 2, BLDG_W + 4, 3)
  ctx.fillStyle = BLDG.brickDark
  ctx.fillRect(BLDG_X - 2, y + 1, BLDG_W + 4, 1)
  // Dentil detail
  ctx.fillStyle = BLDG.cornice
  for (let x = BLDG_X; x < BLDG_R; x += 6) {
    ctx.fillRect(x, y - 4, 3, 2)
  }
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, glowing: boolean) {
  // Frame
  ctx.fillStyle = BLDG.windowFrame
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2)

  // Glass / interior
  if (glowing) {
    ctx.fillStyle = BLDG.windowGlow
    ctx.fillRect(x, y, w, h)
    // Brighter center glow
    ctx.fillStyle = BLDG.windowGlowBright
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4)
  } else {
    ctx.fillStyle = BLDG.windowDark
    ctx.fillRect(x, y, w, h)
    // Slight reflection
    ctx.fillStyle = '#3a3a5a'
    ctx.fillRect(x + 1, y + 1, 3, 3)
  }

  // Window cross bars
  ctx.fillStyle = BLDG.windowFrame
  ctx.fillRect(x + Math.floor(w / 2), y, 1, h)
  ctx.fillRect(x, y + Math.floor(h / 2), w, 1)

  // Sill
  ctx.fillStyle = BLDG.cornice
  ctx.fillRect(x - 2, y + h, w + 4, 2)
}

function drawFlowerBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Box
  ctx.fillStyle = '#6a4030'
  ctx.fillRect(x, y + 2, w, 4)
  // Soil
  ctx.fillStyle = '#4a3020'
  ctx.fillRect(x + 1, y + 2, w - 2, 2)
  // Flowers
  const flowerColors = ['#e06060', '#e0a0d0', '#f0d040', '#e07070', '#d080c0']
  for (let i = 0; i < Math.floor(w / 4); i++) {
    const fx = x + 2 + i * 4
    ctx.fillStyle = '#3a8a2a'
    ctx.fillRect(fx + 1, y, 1, 3) // stem
    ctx.fillStyle = flowerColors[i % flowerColors.length]
    ctx.fillRect(fx, y - 1, 3, 2) // bloom
  }
}

function drawAddressSign(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Sign background
  ctx.fillStyle = BLDG.sign
  ctx.fillRect(x, y, 40, 10)
  // Border
  ctx.fillStyle = BLDG.brickDark
  ctx.fillRect(x, y, 40, 1)
  ctx.fillRect(x, y + 9, 40, 1)
  ctx.fillRect(x, y, 1, 10)
  ctx.fillRect(x + 39, y, 1, 10)
  // "14" in pixel text (simplified)
  ctx.fillStyle = '#2a2a2a'
  // "1"
  ctx.fillRect(x + 14, y + 2, 1, 6)
  ctx.fillRect(x + 13, y + 3, 1, 1)
  ctx.fillRect(x + 13, y + 8, 3, 1)
  // "4"
  ctx.fillRect(x + 18, y + 2, 1, 4)
  ctx.fillRect(x + 18, y + 5, 4, 1)
  ctx.fillRect(x + 21, y + 2, 1, 6)
  // Small dots for "Schillerstr."
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(x + 5 + i * 3, y + 3, 2, 1)
  }
}

function drawRoof(ctx: CanvasRenderingContext2D) {
  // Pitched roof triangle
  const centerX = BLDG_X + BLDG_W / 2
  const roofOverhang = 6

  for (let y = ROOF_PEAK_Y; y <= ROOF_BASE_Y; y++) {
    const progress = (y - ROOF_PEAK_Y) / (ROOF_BASE_Y - ROOF_PEAK_Y)
    const halfWidth = (BLDG_W / 2 + roofOverhang) * progress
    const leftX = Math.floor(centerX - halfWidth)
    const rightX = Math.ceil(centerX + halfWidth)

    // Alternate tile colors per row
    ctx.fillStyle = (y % 3 === 0) ? BLDG.roofDark : (y % 3 === 1) ? BLDG.roof : BLDG.roofLight
    ctx.fillRect(leftX, y, rightX - leftX, 1)
  }

  // Roof ridge
  ctx.fillStyle = BLDG.roofDark
  ctx.fillRect(centerX - 2, ROOF_PEAK_Y, 4, 2)

  // Chimney
  ctx.fillStyle = BLDG.brickDark
  ctx.fillRect(BLDG_X + BLDG_W * 0.7, ROOF_PEAK_Y - 8, 8, 12)
  ctx.fillStyle = BLDG.cornice
  ctx.fillRect(BLDG_X + BLDG_W * 0.7 - 1, ROOF_PEAK_Y - 9, 10, 2)

  // Roof overhang shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.fillRect(BLDG_X - 4, ROOF_BASE_Y, BLDG_W + 8, 2)
}

function drawGroundFloor(ctx: CanvasRenderingContext2D) {
  // Ground floor base
  ctx.fillStyle = '#a08068'
  ctx.fillRect(BLDG_X, FLOOR_Y.ground, BLDG_W, 30)

  // Entrance door (arched)
  const doorX = BLDG_X + 30
  const doorY = FLOOR_Y.ground + 4
  const doorW = 20
  const doorH = 26

  // Door frame
  ctx.fillStyle = BLDG.doorFrame
  ctx.fillRect(doorX - 2, doorY - 2, doorW + 4, doorH + 2)

  // Arch top
  for (let dx = 0; dx < doorW + 4; dx++) {
    const dist = Math.abs(dx - (doorW + 4) / 2)
    const archH = Math.floor(Math.sqrt(Math.max(0, ((doorW + 4) / 2) ** 2 - dist ** 2)) * 0.3)
    ctx.fillStyle = BLDG.doorFrame
    ctx.fillRect(doorX - 2 + dx, doorY - 2 - archH, 1, archH)
  }

  // Door panels
  ctx.fillStyle = BLDG.door
  ctx.fillRect(doorX, doorY, doorW, doorH)

  // Door split
  ctx.fillStyle = BLDG.doorFrame
  ctx.fillRect(doorX + doorW / 2, doorY, 1, doorH)

  // Door handle
  ctx.fillStyle = '#c0a040'
  ctx.fillRect(doorX + doorW / 2 + 3, doorY + doorH / 2, 2, 2)
  ctx.fillRect(doorX + doorW / 2 - 4, doorY + doorH / 2, 2, 2)

  // Door glass panels
  ctx.fillStyle = '#3a4a5a'
  ctx.fillRect(doorX + 3, doorY + 3, 6, 10)
  ctx.fillRect(doorX + doorW / 2 + 2, doorY + 3, 6, 10)

  // Mailboxes area (right side of ground floor)
  ctx.fillStyle = '#907060'
  ctx.fillRect(BLDG_MID + 10, FLOOR_Y.ground + 6, 40, 20)
  // Individual mailbox slots
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      ctx.fillStyle = '#b0a090'
      ctx.fillRect(BLDG_MID + 13 + col * 18, FLOOR_Y.ground + 8 + row * 6, 14, 5)
      ctx.fillStyle = '#706050'
      ctx.fillRect(BLDG_MID + 13 + col * 18, FLOOR_Y.ground + 8 + row * 6, 14, 1)
    }
  }
}

function drawStairwell(ctx: CanvasRenderingContext2D) {
  // Stairwell column on right side
  const sx = BLDG_R
  const sw = 20

  ctx.fillStyle = '#b09878'
  ctx.fillRect(sx, FLOOR_Y.apt6, sw, STREET_Y - FLOOR_Y.apt6)

  // Stairwell windows (small)
  const stairFloors = [FLOOR_Y.apt6, FLOOR_Y.apt5, FLOOR_Y.apt3, FLOOR_Y.apt1]
  for (const fy of stairFloors) {
    ctx.fillStyle = BLDG.windowFrame
    ctx.fillRect(sx + 6, fy + 8, 8, 14)
    ctx.fillStyle = '#4a5a6a'
    ctx.fillRect(sx + 7, fy + 9, 6, 12)
    // Cross bar
    ctx.fillStyle = BLDG.windowFrame
    ctx.fillRect(sx + 7, fy + 14, 6, 1)
  }

  // Stairwell edge
  ctx.fillStyle = BLDG.brickDark
  ctx.fillRect(sx, FLOOR_Y.apt6, 1, STREET_Y - FLOOR_Y.apt6)
  ctx.fillRect(sx + sw - 1, FLOOR_Y.apt6, 1, STREET_Y - FLOOR_Y.apt6)
}

function drawSpaetiShop(ctx: CanvasRenderingContext2D) {
  const sx = 40
  const sy = STREET_Y - 32
  const sw = 90
  const sh = 32

  // Building body
  ctx.fillStyle = '#c0b898'
  ctx.fillRect(sx, sy, sw, sh)

  // Flat roof
  ctx.fillStyle = '#706858'
  ctx.fillRect(sx - 2, sy - 2, sw + 4, 4)

  // Awning
  ctx.fillStyle = '#c04040'
  ctx.fillRect(sx - 4, sy + 2, sw + 8, 6)
  // Awning stripes
  ctx.fillStyle = '#e06060'
  for (let x = sx - 4; x < sx + sw + 4; x += 8) {
    ctx.fillRect(x, sy + 2, 4, 6)
  }
  // Awning edge
  ctx.fillStyle = '#a03030'
  ctx.fillRect(sx - 4, sy + 7, sw + 8, 1)

  // Shop window
  ctx.fillStyle = '#3a5a6a'
  ctx.fillRect(sx + 4, sy + 10, 42, 18)
  // Window frame
  ctx.fillStyle = '#e0d8c0'
  ctx.fillRect(sx + 3, sy + 9, 44, 1)
  ctx.fillRect(sx + 3, sy + 28, 44, 1)
  ctx.fillRect(sx + 3, sy + 9, 1, 20)
  ctx.fillRect(sx + 46, sy + 9, 1, 20)

  // Items in window (colorful rectangles)
  const itemColors = ['#e06040', '#40a0e0', '#e0c040', '#40c080', '#e080c0']
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = itemColors[i]
    ctx.fillRect(sx + 6 + i * 8, sy + 18, 6, 8)
  }

  // Door
  ctx.fillStyle = '#4a4030'
  ctx.fillRect(sx + 56, sy + 10, 14, 20)
  ctx.fillStyle = '#c0a040'
  ctx.fillRect(sx + 68, sy + 20, 2, 2)

  // Neon "SPÄTI" sign area
  ctx.fillStyle = '#306030'
  ctx.fillRect(sx + 10, sy + 3, 30, 6)
  // Glowing text dots
  ctx.fillStyle = '#60e060'
  // S
  ctx.fillRect(sx + 12, sy + 4, 3, 1)
  ctx.fillRect(sx + 12, sy + 5, 1, 1)
  ctx.fillRect(sx + 12, sy + 6, 3, 1)
  ctx.fillRect(sx + 14, sy + 7, 1, 1)
  ctx.fillRect(sx + 12, sy + 8, 3, 1)
  // P
  ctx.fillRect(sx + 17, sy + 4, 1, 5)
  ctx.fillRect(sx + 17, sy + 4, 3, 1)
  ctx.fillRect(sx + 19, sy + 5, 1, 1)
  ctx.fillRect(sx + 17, sy + 6, 3, 1)
  // Ä
  ctx.fillRect(sx + 22, sy + 4, 3, 1)
  ctx.fillRect(sx + 22, sy + 5, 1, 4)
  ctx.fillRect(sx + 24, sy + 5, 1, 4)
  ctx.fillRect(sx + 22, sy + 6, 3, 1)
  // T
  ctx.fillRect(sx + 27, sy + 4, 3, 1)
  ctx.fillRect(sx + 28, sy + 4, 1, 5)
  // I
  ctx.fillRect(sx + 32, sy + 4, 1, 5)

  // Beverage crate outside
  ctx.fillStyle = '#c0a040'
  ctx.fillRect(sx + 76, sy + 24, 10, 6)
  ctx.fillStyle = '#a08030'
  ctx.fillRect(sx + 76, sy + 24, 10, 1)
}

function drawZumAnkerBar(ctx: CanvasRenderingContext2D) {
  const bx = 350
  const by = STREET_Y - 32
  const bw = 90
  const bh = 32

  // Building body
  ctx.fillStyle = '#8a7060'
  ctx.fillRect(bx, by, bw, bh)

  // Flat roof
  ctx.fillStyle = '#504840'
  ctx.fillRect(bx - 2, by - 2, bw + 4, 4)

  // Sign board
  ctx.fillStyle = '#2a2018'
  ctx.fillRect(bx + 10, by + 2, 50, 10)
  ctx.fillStyle = '#d0a040'
  // "ZUM" rough pixels
  ctx.fillRect(bx + 14, by + 4, 2, 1)
  ctx.fillRect(bx + 13, by + 5, 1, 1)
  ctx.fillRect(bx + 14, by + 6, 2, 1)
  ctx.fillRect(bx + 18, by + 4, 1, 3)
  ctx.fillRect(bx + 19, by + 6, 1, 1)
  ctx.fillRect(bx + 20, by + 4, 1, 3)
  ctx.fillRect(bx + 23, by + 4, 1, 3)
  ctx.fillRect(bx + 24, by + 5, 1, 1)
  ctx.fillRect(bx + 25, by + 4, 1, 3)
  // Anchor symbol
  ctx.fillRect(bx + 34, by + 4, 4, 1)
  ctx.fillRect(bx + 35, by + 4, 2, 5)
  ctx.fillRect(bx + 33, by + 8, 6, 1)
  ctx.fillRect(bx + 33, by + 7, 1, 1)
  ctx.fillRect(bx + 38, by + 7, 1, 1)

  // Large window
  ctx.fillStyle = '#2a3040'
  ctx.fillRect(bx + 6, by + 14, 36, 16)
  // Warm light from inside
  ctx.fillStyle = 'rgba(255, 220, 140, 0.3)'
  ctx.fillRect(bx + 6, by + 14, 36, 16)
  // Window frame
  ctx.fillStyle = '#5a4a3a'
  ctx.fillRect(bx + 5, by + 13, 38, 1)
  ctx.fillRect(bx + 5, by + 30, 38, 1)
  ctx.fillRect(bx + 5, by + 13, 1, 18)
  ctx.fillRect(bx + 42, by + 13, 1, 18)
  ctx.fillRect(bx + 23, by + 13, 1, 18)

  // Door
  ctx.fillStyle = '#3a2a1a'
  ctx.fillRect(bx + 52, by + 10, 16, 20)
  // Door frame
  ctx.fillStyle = '#5a4a3a'
  ctx.fillRect(bx + 51, by + 9, 18, 1)
  ctx.fillRect(bx + 51, by + 9, 1, 22)
  ctx.fillRect(bx + 68, by + 9, 1, 22)
  // Handle
  ctx.fillStyle = '#c0a040'
  ctx.fillRect(bx + 65, by + 20, 2, 2)
  // Small window in door
  ctx.fillStyle = '#4a5a6a'
  ctx.fillRect(bx + 55, by + 12, 10, 8)

  // Beer sign
  ctx.fillStyle = '#e0c040'
  ctx.fillRect(bx + 74, by + 12, 10, 12)
  ctx.fillStyle = '#a08020'
  ctx.fillRect(bx + 76, by + 14, 6, 8)
  ctx.fillStyle = '#e0c040'
  ctx.fillRect(bx + 77, by + 15, 4, 5)
  // Foam
  ctx.fillStyle = '#f0e8d0'
  ctx.fillRect(bx + 76, by + 14, 6, 2)
}

function drawBackyard(ctx: CanvasRenderingContext2D) {
  // Ground behind the building (below street level, as if looking down)
  const byStart = GROUND_Y + 5
  const byEnd = VIRT_H

  // Grass
  ctx.fillStyle = ENV.grass
  ctx.fillRect(BLDG_X, byStart, BLDG_W, byEnd - byStart)

  // Grass texture
  ctx.fillStyle = ENV.grassDark
  for (let y = byStart; y < byEnd; y += 3) {
    for (let x = BLDG_X; x < BLDG_R; x += 7) {
      const offset = ((y / 3) % 2) * 3
      ctx.fillRect(x + offset, y, 2, 1)
    }
  }

  // Fence
  ctx.fillStyle = ENV.fenceWood
  ctx.fillRect(BLDG_X, byStart, BLDG_W, 2) // top rail
  ctx.fillRect(BLDG_X, byStart + 8, BLDG_W, 1) // bottom rail
  for (let x = BLDG_X; x < BLDG_R; x += 6) {
    ctx.fillRect(x, byStart, 2, 10) // fence posts
    // Pointed tops
    ctx.fillRect(x, byStart - 1, 2, 1)
  }

  // Tree
  const treeX = BLDG_X + 30
  const treeY = byStart + 10
  // Trunk
  ctx.fillStyle = ENV.treeTrunk
  ctx.fillRect(treeX, treeY, 4, 16)
  // Canopy
  ctx.fillStyle = ENV.treeLeaf
  fillPixelCircle(ctx, treeX + 2, treeY - 2, 10)
  ctx.fillStyle = ENV.treeLeafLight
  fillPixelCircle(ctx, treeX, treeY - 4, 6)

  // Bench
  const benchX = BLDG_X + 70
  const benchY = byStart + 22
  ctx.fillStyle = ENV.fenceWood
  ctx.fillRect(benchX, benchY, 20, 2) // seat
  ctx.fillRect(benchX, benchY + 2, 2, 4) // left leg
  ctx.fillRect(benchX + 18, benchY + 2, 2, 4) // right leg
  ctx.fillRect(benchX, benchY - 4, 1, 4) // back left
  ctx.fillRect(benchX + 19, benchY - 4, 1, 4) // back right
  ctx.fillRect(benchX, benchY - 4, 20, 1) // backrest

  // Laundry line
  const lineY = byStart + 12
  ctx.fillStyle = '#a0a0a0'
  ctx.fillRect(BLDG_X + 100, lineY, 60, 1) // line
  // Posts
  ctx.fillStyle = '#707070'
  ctx.fillRect(BLDG_X + 100, lineY, 1, 14)
  ctx.fillRect(BLDG_X + 159, lineY, 1, 14)
  // Hanging clothes
  const clothColors = ['#e0e0e0', '#a0c0e0', '#e0a0a0', '#a0e0a0']
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = clothColors[i]
    const cx = BLDG_X + 108 + i * 14
    ctx.fillRect(cx, lineY + 1, 8, 6)
    ctx.fillRect(cx + 1, lineY + 7, 6, 2)
  }
}

function fillPixelCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        ctx.fillRect(cx + dx, cy + dy, 1, 1)
      }
    }
  }
}
