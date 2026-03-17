import { BLDG, ENV } from './colors'
import { ROOM_W, ROOM_H, ROOM_X, ROOM_Y } from './layout'

export function drawInterior(ctx: CanvasRenderingContext2D, location: string) {
  const x = ROOM_X
  const y = ROOM_Y
  const w = ROOM_W
  const h = ROOM_H

  // Dark border around room
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4)

  switch (location) {
    case 'Apartment 1': drawApt1Marta(ctx, x, y, w, h); break
    case 'Apartment 2': drawApt2Empty(ctx, x, y, w, h); break
    case 'Apartment 3': drawApt3Rolf(ctx, x, y, w, h); break
    case 'Apartment 4': drawApt4Hakim(ctx, x, y, w, h); break
    case 'Apartment 5': drawApt5MarcoSarah(ctx, x, y, w, h); break
    case 'Apartment 6': drawApt6Suki(ctx, x, y, w, h); break
    case 'Späti': drawSpaeti(ctx, x, y, w, h); break
    case 'Zum Anker': drawZumAnker(ctx, x, y, w, h); break
    case 'Backyard': drawBackyardInterior(ctx, x, y, w, h); break
    case 'Stairwell': drawStairwellInterior(ctx, x, y, w, h); break
    case 'Entrance Hall': drawEntranceHall(ctx, x, y, w, h); break
    case 'Mailboxes': drawMailboxes(ctx, x, y, w, h); break
    default: drawGenericRoom(ctx, x, y, w, h); break
  }
}

// --- Apt 1: Marta's — warm, old-fashioned, cozy ---
function drawApt1Marta(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Walls — warm beige
  ctx.fillStyle = '#e8d8c0'
  ctx.fillRect(x, y, w, h)

  // Wallpaper pattern (subtle floral)
  ctx.fillStyle = '#e0d0b8'
  for (let py = y; py < y + h - 30; py += 12) {
    for (let px = x; px < x + w; px += 16) {
      const off = ((py / 12) % 2) * 8
      ctx.fillRect(px + off + 6, py + 4, 3, 3)
    }
  }

  // Floor — dark wood
  ctx.fillStyle = '#8a6a40'
  ctx.fillRect(x, y + h - 30, w, 30)
  // Floor boards
  ctx.fillStyle = '#7a5a30'
  for (let px = x; px < x + w; px += 24) {
    ctx.fillRect(px, y + h - 30, 1, 30)
  }
  ctx.fillStyle = '#9a7a50'
  ctx.fillRect(x, y + h - 16, w, 1)

  // Baseboard
  ctx.fillStyle = '#c0a070'
  ctx.fillRect(x, y + h - 32, w, 3)

  // Crown molding
  ctx.fillStyle = '#d0c0a0'
  ctx.fillRect(x, y, w, 3)

  // Old sofa (left side)
  ctx.fillStyle = '#8a5a40'
  ctx.fillRect(x + 30, y + h - 55, 70, 25)
  ctx.fillStyle = '#a06a48'
  ctx.fillRect(x + 32, y + h - 53, 66, 18)
  // Cushions
  ctx.fillStyle = '#b07a58'
  ctx.fillRect(x + 35, y + h - 50, 28, 14)
  ctx.fillRect(x + 66, y + h - 50, 28, 14)
  // Armrest
  ctx.fillStyle = '#8a5a40'
  ctx.fillRect(x + 28, y + h - 60, 8, 30)
  ctx.fillRect(x + 98, y + h - 60, 8, 30)
  // Legs
  ctx.fillStyle = '#5a3a20'
  ctx.fillRect(x + 32, y + h - 30, 4, 3)
  ctx.fillRect(x + 94, y + h - 30, 4, 3)

  // Doily on small table
  ctx.fillStyle = '#5a4030'
  ctx.fillRect(x + 120, y + h - 44, 30, 14)
  // Doily
  ctx.fillStyle = '#f0e8e0'
  ctx.fillRect(x + 125, y + h - 46, 20, 2)
  // Tea cup
  ctx.fillStyle = '#e0e8f0'
  ctx.fillRect(x + 131, y + h - 50, 8, 5)
  ctx.fillStyle = '#d0d8e8'
  ctx.fillRect(x + 139, y + h - 48, 3, 3)

  // Old TV (right side)
  ctx.fillStyle = '#4a4040'
  ctx.fillRect(x + 280, y + h - 70, 50, 38)
  ctx.fillStyle = '#3a3a4a'
  ctx.fillRect(x + 284, y + h - 66, 42, 28)
  // Screen glow
  ctx.fillStyle = '#5a6a8a'
  ctx.fillRect(x + 286, y + h - 64, 38, 24)
  // TV stand
  ctx.fillStyle = '#5a4030'
  ctx.fillRect(x + 275, y + h - 32, 60, 4)
  ctx.fillRect(x + 278, y + h - 28, 6, 3)
  ctx.fillRect(x + 326, y + h - 28, 6, 3)
  // Antenna
  ctx.fillStyle = '#808080'
  ctx.fillRect(x + 300, y + h - 78, 1, 8)
  ctx.fillRect(x + 296, y + h - 82, 1, 6)
  ctx.fillRect(x + 304, y + h - 82, 1, 6)

  // Plants on windowsill
  drawPottedPlant(ctx, x + 180, y + 30)
  drawPottedPlant(ctx, x + 200, y + 32)

  // Armchair
  ctx.fillStyle = '#907050'
  ctx.fillRect(x + 350, y + h - 55, 40, 25)
  ctx.fillStyle = '#a08060'
  ctx.fillRect(x + 354, y + h - 52, 32, 18)
  ctx.fillRect(x + 348, y + h - 58, 8, 28)
  ctx.fillRect(x + 386, y + h - 58, 8, 28)

  // Kitchen counter (back wall, right)
  ctx.fillStyle = '#d0c0a0'
  ctx.fillRect(x + w - 80, y + h - 80, 70, 50)
  ctx.fillStyle = '#b0a080'
  ctx.fillRect(x + w - 78, y + h - 78, 66, 2)
  // Stove
  ctx.fillStyle = '#e0e0e0'
  ctx.fillRect(x + w - 60, y + h - 76, 30, 20)
  ctx.fillStyle = '#303030'
  ctx.fillRect(x + w - 56, y + h - 72, 8, 8)
  ctx.fillRect(x + w - 44, y + h - 72, 8, 8)

  // Wall clock
  ctx.fillStyle = '#c0a060'
  fillCircleInterior(ctx, x + 220, y + 20, 8)
  ctx.fillStyle = '#f0e8d0'
  fillCircleInterior(ctx, x + 220, y + 20, 6)
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(x + 220, y + 16, 1, 4) // hour
  ctx.fillRect(x + 220, y + 20, 4, 1) // minute

  // Rug
  ctx.fillStyle = '#a06048'
  ctx.fillRect(x + 60, y + h - 28, 80, 16)
  ctx.fillStyle = '#c07858'
  ctx.fillRect(x + 64, y + h - 26, 72, 12)
  ctx.fillStyle = '#b06848'
  ctx.fillRect(x + 68, y + h - 24, 64, 8)

  // Window
  drawInteriorWindow(ctx, x + 170, y + 10, 40, 50)

  // Framed photo
  ctx.fillStyle = '#6a5040'
  ctx.fillRect(x + 50, y + 15, 18, 22)
  ctx.fillStyle = '#c0b0a0'
  ctx.fillRect(x + 52, y + 17, 14, 18)
}

// --- Apt 2: Empty — bare, dusty ---
function drawApt2Empty(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Bare gray walls
  ctx.fillStyle = '#c8c0b8'
  ctx.fillRect(x, y, w, h)

  // Stained patches
  ctx.fillStyle = '#b8b0a8'
  ctx.fillRect(x + 60, y + 30, 40, 30)
  ctx.fillRect(x + 200, y + 50, 30, 20)

  // Concrete floor
  ctx.fillStyle = '#a09888'
  ctx.fillRect(x, y + h - 30, w, 30)
  // Cracks in floor
  ctx.fillStyle = '#908878'
  ctx.fillRect(x + 80, y + h - 25, 40, 1)
  ctx.fillRect(x + 85, y + h - 24, 1, 8)
  ctx.fillRect(x + 250, y + h - 20, 30, 1)

  // Cobwebs in corners
  ctx.fillStyle = 'rgba(200, 200, 200, 0.4)'
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(x + i, y + i, 1, 1)
    ctx.fillRect(x + i * 2, y + i, 1, 1)
  }
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(x + w - 1 - i, y + i, 1, 1)
    ctx.fillRect(x + w - 1 - i * 2, y + i, 1, 1)
  }

  // Dust spots on floor
  ctx.fillStyle = 'rgba(180, 170, 160, 0.5)'
  ctx.fillRect(x + 100, y + h - 28, 20, 3)
  ctx.fillRect(x + 300, y + h - 26, 15, 2)
  ctx.fillRect(x + 180, y + h - 24, 25, 2)

  // Bare lightbulb wire from ceiling
  ctx.fillStyle = '#404040'
  ctx.fillRect(x + w / 2, y, 1, 30)
  ctx.fillStyle = '#e0d080'
  ctx.fillRect(x + w / 2 - 2, y + 28, 5, 6)
  ctx.fillStyle = '#f0e0a0'
  ctx.fillRect(x + w / 2 - 1, y + 30, 3, 3)

  // Window (dirty)
  ctx.fillStyle = '#d0c8b0'
  ctx.fillRect(x + 170, y + 15, 42, 52)
  ctx.fillStyle = '#8090a0'
  ctx.fillRect(x + 172, y + 17, 38, 48)
  ctx.fillStyle = '#a0a898'
  ctx.fillRect(x + 172, y + 17, 10, 12) // dirt
  ctx.fillStyle = '#d0c8b0'
  ctx.fillRect(x + 190, y + 17, 1, 48) // cross
  ctx.fillRect(x + 172, y + 40, 38, 1)

  // Ghost of where furniture was (lighter patches on wall)
  ctx.fillStyle = '#d0c8c0'
  ctx.fillRect(x + 40, y + h - 90, 50, 60) // sofa mark
  ctx.fillRect(x + 300, y + h - 80, 40, 50) // shelf mark
}

// --- Apt 3: Rolf's — dark wood, workbench, sparse ---
function drawApt3Rolf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Dark walls
  ctx.fillStyle = '#8a7a68'
  ctx.fillRect(x, y, w, h)

  // Wood paneling (lower half)
  ctx.fillStyle = '#6a5a40'
  ctx.fillRect(x, y + h / 2 - 20, w, h / 2 + 20)
  // Panel lines
  ctx.fillStyle = '#5a4a30'
  for (let px = x; px < x + w; px += 30) {
    ctx.fillRect(px, y + h / 2 - 20, 1, h / 2 + 20)
  }

  // Floor — worn wood
  ctx.fillStyle = '#7a6a48'
  ctx.fillRect(x, y + h - 30, w, 30)
  ctx.fillStyle = '#6a5a38'
  for (let px = x; px < x + w; px += 20) {
    ctx.fillRect(px, y + h - 30, 1, 30)
  }

  // Workbench (left)
  ctx.fillStyle = '#5a4a30'
  ctx.fillRect(x + 20, y + h - 70, 100, 8)
  // Legs
  ctx.fillRect(x + 22, y + h - 62, 4, 32)
  ctx.fillRect(x + 114, y + h - 62, 4, 32)
  // Tools on bench
  ctx.fillStyle = '#808080'
  ctx.fillRect(x + 30, y + h - 76, 2, 8) // screwdriver
  ctx.fillRect(x + 40, y + h - 78, 8, 4) // hammer head
  ctx.fillRect(x + 43, y + h - 74, 2, 8) // hammer handle
  ctx.fillStyle = '#a0a0a0'
  ctx.fillRect(x + 60, y + h - 74, 12, 3) // wrench
  // Vise
  ctx.fillStyle = '#606060'
  ctx.fillRect(x + 90, y + h - 80, 12, 10)
  ctx.fillRect(x + 92, y + h - 84, 8, 4)

  // Beer crate
  ctx.fillStyle = '#c0a040'
  ctx.fillRect(x + 150, y + h - 42, 24, 14)
  ctx.fillStyle = '#a08020'
  ctx.fillRect(x + 150, y + h - 42, 24, 2)
  // Bottles
  ctx.fillStyle = '#406030'
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + 153 + i * 5, y + h - 50, 3, 10)
  }

  // Simple bed (right)
  ctx.fillStyle = '#6a5a48'
  ctx.fillRect(x + 280, y + h - 50, 80, 20)
  ctx.fillStyle = '#8a7a68'
  ctx.fillRect(x + 282, y + h - 48, 76, 14)
  // Pillow
  ctx.fillStyle = '#c0b8a0'
  ctx.fillRect(x + 340, y + h - 48, 16, 10)
  // Blanket
  ctx.fillStyle = '#5a6a4a'
  ctx.fillRect(x + 284, y + h - 46, 52, 10)
  // Bed frame
  ctx.fillStyle = '#5a4a38'
  ctx.fillRect(x + 358, y + h - 56, 4, 26)
  ctx.fillRect(x + 278, y + h - 52, 4, 22)

  // Window
  drawInteriorWindow(ctx, x + 180, y + 10, 40, 50)

  // Calendar on wall
  ctx.fillStyle = '#e0d8c0'
  ctx.fillRect(x + 240, y + 20, 16, 20)
  ctx.fillStyle = '#c04040'
  ctx.fillRect(x + 240, y + 20, 16, 5)

  // Coat hook with jacket
  ctx.fillStyle = '#404040'
  ctx.fillRect(x + 50, y + 30, 2, 6)
  ctx.fillStyle = '#6a6a6a'
  ctx.fillRect(x + 44, y + 36, 14, 20)
}

// --- Apt 4: Hakim's — clean, modern, studious ---
function drawApt4Hakim(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Clean white walls
  ctx.fillStyle = '#f0ece8'
  ctx.fillRect(x, y, w, h)

  // Floor — light laminate
  ctx.fillStyle = '#d0c0a0'
  ctx.fillRect(x, y + h - 30, w, 30)
  ctx.fillStyle = '#c8b898'
  for (let px = x; px < x + w; px += 28) {
    ctx.fillRect(px, y + h - 30, 1, 30)
  }
  ctx.fillRect(x, y + h - 16, w, 1)

  // Desk with monitors (left)
  ctx.fillStyle = '#d0c0a0'
  ctx.fillRect(x + 30, y + h - 65, 120, 6)
  // Desk legs
  ctx.fillStyle = '#808080'
  ctx.fillRect(x + 32, y + h - 59, 2, 29)
  ctx.fillRect(x + 146, y + h - 59, 2, 29)
  // Monitor 1
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(x + 40, y + h - 95, 50, 30)
  ctx.fillStyle = '#3a5a8a'
  ctx.fillRect(x + 42, y + h - 93, 46, 26)
  // Code on screen
  ctx.fillStyle = '#60c060'
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x + 45, y + h - 90 + i * 4, 15 + (i % 3) * 8, 2)
  }
  // Monitor stand
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(x + 60, y + h - 65, 10, 4)
  // Monitor 2
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(x + 95, y + h - 90, 40, 25)
  ctx.fillStyle = '#4a6a9a'
  ctx.fillRect(x + 97, y + h - 88, 36, 21)
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(x + 110, y + h - 65, 10, 4)
  // Keyboard
  ctx.fillStyle = '#303030'
  ctx.fillRect(x + 55, y + h - 68, 40, 4)
  // Mouse
  ctx.fillStyle = '#404040'
  ctx.fillRect(x + 100, y + h - 68, 6, 4)

  // Bookshelf (right wall)
  ctx.fillStyle = '#8a7050'
  ctx.fillRect(x + 300, y + 20, 80, 140)
  // Shelves
  for (let sy = 0; sy < 5; sy++) {
    ctx.fillStyle = '#7a6040'
    ctx.fillRect(x + 300, y + 20 + sy * 28, 80, 3)
    // Books
    const bookColors = ['#c04040', '#4060c0', '#40a060', '#c0a040', '#8040a0', '#c06040']
    for (let bi = 0; bi < 6; bi++) {
      ctx.fillStyle = bookColors[(bi + sy * 2) % bookColors.length]
      const bw = 8 + (bi % 3) * 2
      ctx.fillRect(x + 304 + bi * 12, y + 23 + sy * 28, bw, 24)
    }
  }

  // Prayer rug
  ctx.fillStyle = '#2a6048'
  ctx.fillRect(x + 200, y + h - 28, 50, 20)
  ctx.fillStyle = '#3a7058'
  ctx.fillRect(x + 204, y + h - 26, 42, 16)
  // Pattern
  ctx.fillStyle = '#c0a040'
  ctx.fillRect(x + 220, y + h - 24, 10, 2)
  ctx.fillRect(x + 218, y + h - 22, 14, 1)
  ctx.fillRect(x + 224, y + h - 26, 2, 4)

  // Window
  drawInteriorWindow(ctx, x + 170, y + 10, 40, 50)

  // Desk lamp
  ctx.fillStyle = '#e0e0e0'
  ctx.fillRect(x + 38, y + h - 80, 2, 15)
  ctx.fillStyle = '#404040'
  ctx.fillRect(x + 34, y + h - 84, 10, 5)
  ctx.fillStyle = '#f0e890'
  ctx.fillRect(x + 36, y + h - 80, 6, 2)
}

// --- Apt 5: Marco & Sarah — creative, lived-in, slightly messy ---
function drawApt5MarcoSarah(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Warm off-white walls
  ctx.fillStyle = '#f0e8e0'
  ctx.fillRect(x, y, w, h)

  // Floor — wood
  ctx.fillStyle = '#b09870'
  ctx.fillRect(x, y + h - 30, w, 30)
  ctx.fillStyle = '#a08860'
  for (let px = x; px < x + w; px += 22) {
    ctx.fillRect(px, y + h - 30, 1, 30)
  }

  // Desk 1 — Marco's (left, slightly messy)
  ctx.fillStyle = '#b0a080'
  ctx.fillRect(x + 20, y + h - 60, 80, 6)
  ctx.fillRect(x + 22, y + h - 54, 2, 24)
  ctx.fillRect(x + 96, y + h - 54, 2, 24)
  // Laptop
  ctx.fillStyle = '#303030'
  ctx.fillRect(x + 35, y + h - 72, 30, 12)
  ctx.fillStyle = '#4a6a8a'
  ctx.fillRect(x + 37, y + h - 70, 26, 8)
  ctx.fillRect(x + 35, y + h - 60, 30, 2) // keyboard part
  // Coffee cup
  ctx.fillStyle = '#e0d0c0'
  ctx.fillRect(x + 75, y + h - 67, 6, 6)
  ctx.fillStyle = '#6a4a30'
  ctx.fillRect(x + 76, y + h - 66, 4, 4)
  // Papers scattered
  ctx.fillStyle = '#f0e8e0'
  ctx.fillRect(x + 28, y + h - 64, 8, 6)
  ctx.fillRect(x + 24, y + h - 62, 6, 8)

  // Desk 2 — Sarah's (right, neater)
  ctx.fillStyle = '#b0a080'
  ctx.fillRect(x + 300, y + h - 60, 80, 6)
  ctx.fillRect(x + 302, y + h - 54, 2, 24)
  ctx.fillRect(x + 376, y + h - 54, 2, 24)
  // Monitor
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(x + 320, y + h - 85, 40, 25)
  ctx.fillStyle = '#5a4a6a'
  ctx.fillRect(x + 322, y + h - 83, 36, 21)
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(x + 335, y + h - 60, 10, 4)
  // Notebook
  ctx.fillStyle = '#c0a0b0'
  ctx.fillRect(x + 305, y + h - 64, 12, 8)

  // Couch (center)
  ctx.fillStyle = '#6a7a6a'
  ctx.fillRect(x + 140, y + h - 52, 90, 22)
  ctx.fillStyle = '#7a8a7a'
  ctx.fillRect(x + 144, y + h - 50, 82, 16)
  // Cushions
  ctx.fillStyle = '#8a9a8a'
  ctx.fillRect(x + 148, y + h - 48, 35, 12)
  ctx.fillRect(x + 188, y + h - 48, 35, 12)
  // Arms
  ctx.fillStyle = '#6a7a6a'
  ctx.fillRect(x + 136, y + h - 56, 8, 26)
  ctx.fillRect(x + 226, y + h - 56, 8, 26)
  // Throw pillow
  ctx.fillStyle = '#c08060'
  ctx.fillRect(x + 150, y + h - 50, 10, 10)

  // Plants
  drawPottedPlant(ctx, x + 260, y + h - 55)
  drawPottedPlant(ctx, x + 120, y + 28)

  // Hanging plant
  ctx.fillStyle = '#808080'
  ctx.fillRect(x + 280, y, 1, 20)
  drawHangingPlant(ctx, x + 275, y + 18)

  // Slightly messy: shoes by door
  ctx.fillStyle = '#4a3a2a'
  ctx.fillRect(x + 10, y + h - 34, 8, 4)
  ctx.fillStyle = '#c04060'
  ctx.fillRect(x + 6, y + h - 34, 8, 4)

  // Window
  drawInteriorWindow(ctx, x + 170, y + 10, 40, 50)

  // Poster on wall
  ctx.fillStyle = '#e0d0c0'
  ctx.fillRect(x + 60, y + 15, 24, 30)
  ctx.fillStyle = '#c09060'
  ctx.fillRect(x + 62, y + 17, 20, 26)
  ctx.fillStyle = '#e0a070'
  ctx.fillRect(x + 66, y + 22, 12, 8)
}

// --- Apt 6: Suki's — bright, colorful, bookish, bohemian ---
function drawApt6Suki(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Bright warm walls
  ctx.fillStyle = '#f8f0e0'
  ctx.fillRect(x, y, w, h)

  // Floor — light wood
  ctx.fillStyle = '#c8b890'
  ctx.fillRect(x, y + h - 30, w, 30)
  ctx.fillStyle = '#b8a880'
  for (let px = x; px < x + w; px += 18) {
    ctx.fillRect(px, y + h - 30, 1, 30)
  }

  // Book stacks everywhere
  const stackPositions = [
    { bx: x + 40, by: y + h - 55, count: 5 },
    { bx: x + 90, by: y + h - 48, count: 3 },
    { bx: x + 350, by: y + h - 50, count: 4 },
    { bx: x + 200, by: y + h - 42, count: 2 },
  ]
  const bookColors = ['#c04040', '#4060c0', '#40a060', '#c0a040', '#8040a0', '#c06040', '#4090a0']
  for (const stack of stackPositions) {
    for (let i = 0; i < stack.count; i++) {
      ctx.fillStyle = bookColors[(i + stack.bx) % bookColors.length]
      ctx.fillRect(stack.bx, stack.by + i * 5, 20 + (i % 3) * 4, 4)
    }
  }

  // Bookshelf on wall
  ctx.fillStyle = '#a08060'
  ctx.fillRect(x + 20, y + 20, 80, 100)
  for (let sy = 0; sy < 4; sy++) {
    ctx.fillStyle = '#906a4a'
    ctx.fillRect(x + 20, y + 20 + sy * 25, 80, 3)
    for (let bi = 0; bi < 5; bi++) {
      ctx.fillStyle = bookColors[(bi + sy) % bookColors.length]
      ctx.fillRect(x + 24 + bi * 14, y + 23 + sy * 25, 10, 22)
    }
  }

  // Posters on wall
  ctx.fillStyle = '#e06080'
  ctx.fillRect(x + 130, y + 15, 30, 40)
  ctx.fillStyle = '#f08090'
  ctx.fillRect(x + 132, y + 17, 26, 36)
  // Second poster
  ctx.fillStyle = '#6080e0'
  ctx.fillRect(x + 250, y + 20, 25, 35)
  ctx.fillStyle = '#80a0f0'
  ctx.fillRect(x + 252, y + 22, 21, 31)

  // Yoga mat (rolled up or flat)
  ctx.fillStyle = '#8060a0'
  ctx.fillRect(x + 300, y + h - 32, 60, 6)
  ctx.fillStyle = '#9070b0'
  ctx.fillRect(x + 302, y + h - 31, 56, 4)

  // Fairy lights along ceiling
  ctx.fillStyle = '#808080'
  ctx.fillRect(x + 10, y + 4, w - 20, 1)
  const lightColors = ['#f0e060', '#f08060', '#60e0a0', '#6080e0', '#e060a0']
  for (let lx = x + 15; lx < x + w - 10; lx += 12) {
    ctx.fillStyle = lightColors[Math.floor((lx - x) / 12) % lightColors.length]
    ctx.fillRect(lx, y + 5, 3, 3)
    // Glow
    ctx.fillStyle = lightColors[Math.floor((lx - x) / 12) % lightColors.length] + '40'
    ctx.fillRect(lx - 1, y + 4, 5, 5)
  }

  // Small desk/table
  ctx.fillStyle = '#b0a080'
  ctx.fillRect(x + 160, y + h - 55, 60, 6)
  ctx.fillRect(x + 162, y + h - 49, 2, 19)
  ctx.fillRect(x + 216, y + h - 49, 2, 19)
  // Laptop
  ctx.fillStyle = '#404040'
  ctx.fillRect(x + 170, y + h - 65, 24, 10)
  ctx.fillStyle = '#5a7a9a'
  ctx.fillRect(x + 172, y + h - 63, 20, 6)
  ctx.fillRect(x + 170, y + h - 55, 24, 2)
  // Mug
  ctx.fillStyle = '#e06080'
  ctx.fillRect(x + 200, y + h - 62, 6, 6)

  // Plants
  drawPottedPlant(ctx, x + w - 50, y + h - 50)

  // Window
  drawInteriorWindow(ctx, x + 180, y + 10, 40, 50)

  // Cushion on floor
  ctx.fillStyle = '#e0a060'
  ctx.fillRect(x + 120, y + h - 36, 16, 8)
  ctx.fillStyle = '#c08040'
  ctx.fillRect(x + 122, y + h - 35, 12, 6)
}

// --- Späti ---
function drawSpaeti(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Floor — tiles
  ctx.fillStyle = '#c0b8a8'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#b0a898'
  ctx.fillRect(x, y + h - 30, w, 30)
  for (let px = x; px < x + w; px += 16) {
    for (let py = y + h - 30; py < y + h; py += 16) {
      ctx.fillStyle = (((px + py) / 16) % 2 < 1) ? '#b8b0a0' : '#c8c0b0'
      ctx.fillRect(px, py, 15, 15)
    }
  }

  // Walls
  ctx.fillStyle = '#d8d0c0'
  ctx.fillRect(x, y, w, h - 30)

  // Shelves along back wall
  for (let row = 0; row < 4; row++) {
    const sy = y + 15 + row * 35
    ctx.fillStyle = '#8a7a60'
    ctx.fillRect(x + 10, sy, w - 20, 3)
    // Products on shelves
    const prodColors = ['#e04040', '#40a0e0', '#e0c040', '#40c080', '#e080c0', '#c06040', '#4080e0']
    for (let i = 0; i < Math.floor((w - 30) / 14); i++) {
      ctx.fillStyle = prodColors[i % prodColors.length]
      const pw = 8 + (i % 3) * 2
      const ph = 16 + ((i + row) % 3) * 6
      ctx.fillRect(x + 16 + i * 14, sy - ph, pw, ph)
    }
  }

  // Counter (front)
  ctx.fillStyle = '#6a5a40'
  ctx.fillRect(x + 20, y + h - 60, w - 40, 8)
  ctx.fillStyle = '#5a4a30'
  ctx.fillRect(x + 22, y + h - 52, 4, 22)
  ctx.fillRect(x + w - 64, y + h - 52, 4, 22)

  // Cash register
  ctx.fillStyle = '#303030'
  ctx.fillRect(x + w / 2 - 10, y + h - 72, 20, 12)
  ctx.fillStyle = '#505050'
  ctx.fillRect(x + w / 2 - 8, y + h - 70, 16, 6)

  // Fridge (right side)
  ctx.fillStyle = '#e0e0e0'
  ctx.fillRect(x + w - 50, y + 20, 35, 120)
  ctx.fillStyle = '#d0d0d0'
  ctx.fillRect(x + w - 48, y + 22, 31, 56)
  ctx.fillRect(x + w - 48, y + 82, 31, 56)
  // Handle
  ctx.fillStyle = '#a0a0a0'
  ctx.fillRect(x + w - 50, y + 50, 2, 12)
  ctx.fillRect(x + w - 50, y + 100, 2, 12)
  // Drinks inside
  ctx.fillStyle = '#40a040'
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + w - 44 + i * 7, y + 26, 5, 20)
  }
}

// --- Zum Anker ---
function drawZumAnker(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Dark wood interior
  ctx.fillStyle = '#4a3a28'
  ctx.fillRect(x, y, w, h)

  // Floor — dark wood
  ctx.fillStyle = '#3a2a18'
  ctx.fillRect(x, y + h - 30, w, 30)
  ctx.fillStyle = '#2a1a10'
  for (let px = x; px < x + w; px += 20) {
    ctx.fillRect(px, y + h - 30, 1, 30)
  }

  // Bar counter (long, prominent)
  ctx.fillStyle = '#6a5030'
  ctx.fillRect(x + 30, y + h - 70, 200, 10)
  ctx.fillStyle = '#5a4020'
  ctx.fillRect(x + 32, y + h - 60, 4, 30)
  ctx.fillRect(x + 224, y + h - 60, 4, 30)
  // Bar top shine
  ctx.fillStyle = '#7a6040'
  ctx.fillRect(x + 32, y + h - 70, 196, 2)

  // Beer taps
  ctx.fillStyle = '#c0a040'
  ctx.fillRect(x + 80, y + h - 86, 4, 16)
  ctx.fillRect(x + 100, y + h - 86, 4, 16)
  ctx.fillRect(x + 120, y + h - 86, 4, 16)
  // Tap handles
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(x + 78, y + h - 90, 8, 5)
  ctx.fillRect(x + 98, y + h - 90, 8, 5)
  ctx.fillRect(x + 118, y + h - 90, 8, 5)

  // Beer glasses on counter
  ctx.fillStyle = '#e0d080'
  ctx.fillRect(x + 50, y + h - 78, 6, 8)
  ctx.fillRect(x + 150, y + h - 78, 6, 8)
  ctx.fillStyle = '#f0e8c0'
  ctx.fillRect(x + 51, y + h - 79, 4, 2) // foam

  // Bar stools
  for (let i = 0; i < 4; i++) {
    const sx = x + 50 + i * 45
    ctx.fillStyle = '#5a4a30'
    ctx.fillRect(sx, y + h - 54, 14, 4)
    ctx.fillRect(sx + 5, y + h - 50, 4, 20)
    ctx.fillRect(sx + 2, y + h - 32, 10, 2)
  }

  // Tables (right side)
  for (let i = 0; i < 2; i++) {
    const tx = x + 280 + i * 60
    const ty = y + h - 55
    ctx.fillStyle = '#5a4020'
    ctx.fillRect(tx, ty, 40, 6)
    ctx.fillRect(tx + 16, ty + 6, 8, 25)
  }

  // Bottles behind bar (back wall)
  const bottleColors = ['#406030', '#a06020', '#304060', '#a04040', '#c0a040']
  for (let row = 0; row < 2; row++) {
    ctx.fillStyle = '#4a3a20'
    ctx.fillRect(x + 40, y + 20 + row * 35, 180, 3) // shelf
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = bottleColors[i % bottleColors.length]
      ctx.fillRect(x + 45 + i * 14, y + 5 + row * 35, 5, 18)
      ctx.fillRect(x + 46 + i * 14, y + 3 + row * 35, 3, 4)
    }
  }

  // Mirror behind bar
  ctx.fillStyle = '#6a8090'
  ctx.fillRect(x + 60, y + 95, 100, 40)
  ctx.fillStyle = '#8a7060'
  ctx.fillRect(x + 58, y + 93, 104, 2)
  ctx.fillRect(x + 58, y + 135, 104, 2)
  ctx.fillRect(x + 58, y + 93, 2, 44)
  ctx.fillRect(x + 160, y + 93, 2, 44)

  // Warm lights
  ctx.fillStyle = '#f0d060'
  ctx.fillRect(x + 100, y + 4, 4, 4)
  ctx.fillRect(x + 300, y + 4, 4, 4)
  ctx.fillStyle = 'rgba(240, 208, 96, 0.15)'
  ctx.fillRect(x + 90, y, 24, 30)
  ctx.fillRect(x + 290, y, 24, 30)
}

// --- Backyard interior ---
function drawBackyardInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Sky backdrop
  ctx.fillStyle = '#80b8e0'
  ctx.fillRect(x, y, w, h / 3)

  // Building back wall
  ctx.fillStyle = BLDG.brick
  ctx.fillRect(x, y + h / 3 - 20, w, 30)
  ctx.fillStyle = BLDG.brickDark
  for (let px = x; px < x + w; px += 12) {
    ctx.fillRect(px, y + h / 3 - 20, 1, 30)
  }

  // Grass ground
  ctx.fillStyle = ENV.grass
  ctx.fillRect(x, y + h / 3 + 10, w, h - h / 3 - 10)
  ctx.fillStyle = ENV.grassDark
  for (let py = y + h / 3 + 10; py < y + h; py += 4) {
    for (let px = x; px < x + w; px += 8) {
      ctx.fillRect(px + ((py / 4) % 2) * 4, py, 3, 1)
    }
  }

  // Fence
  ctx.fillStyle = ENV.fenceWood
  ctx.fillRect(x, y + h / 3 + 8, w, 3)
  ctx.fillRect(x, y + h / 3 + 20, w, 2)
  for (let px = x; px < x + w; px += 10) {
    ctx.fillRect(px, y + h / 3 + 5, 3, 20)
  }

  // Big tree
  ctx.fillStyle = ENV.treeTrunk
  ctx.fillRect(x + 80, y + h / 3, 8, 60)
  ctx.fillStyle = ENV.treeLeaf
  fillCircleInterior(ctx, x + 84, y + h / 3 - 5, 25)
  ctx.fillStyle = ENV.treeLeafLight
  fillCircleInterior(ctx, x + 78, y + h / 3 - 12, 14)

  // Bench
  ctx.fillStyle = ENV.fenceWood
  ctx.fillRect(x + 180, y + h - 55, 50, 4)
  ctx.fillRect(x + 182, y + h - 51, 4, 15)
  ctx.fillRect(x + 224, y + h - 51, 4, 15)
  ctx.fillRect(x + 180, y + h - 62, 2, 10)
  ctx.fillRect(x + 228, y + h - 62, 2, 10)
  ctx.fillRect(x + 180, y + h - 62, 50, 2)

  // Laundry line
  ctx.fillStyle = '#a0a0a0'
  ctx.fillRect(x + 260, y + h / 3 + 15, 120, 1)
  ctx.fillStyle = '#707070'
  ctx.fillRect(x + 260, y + h / 3 + 15, 2, 30)
  ctx.fillRect(x + 378, y + h / 3 + 15, 2, 30)
  const clothColors = ['#e0e0e0', '#a0c0e0', '#e0a0a0', '#c0e0a0', '#e0c0e0']
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = clothColors[i]
    ctx.fillRect(x + 270 + i * 22, y + h / 3 + 16, 14, 16)
    ctx.fillRect(x + 272 + i * 22, y + h / 3 + 32, 10, 4)
  }

  // Flower pots
  drawPottedPlant(ctx, x + 140, y + h - 42)
  drawPottedPlant(ctx, x + 160, y + h - 38)
}

// --- Stairwell interior ---
function drawStairwellInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Walls
  ctx.fillStyle = '#c8c0b0'
  ctx.fillRect(x, y, w, h)

  // Floor
  ctx.fillStyle = '#a09880'
  ctx.fillRect(x, y + h - 20, w, 20)

  // Stairs going up (perspective view)
  for (let i = 0; i < 8; i++) {
    const stairY = y + h - 40 - i * 22
    const indent = i * 15
    // Stair tread
    ctx.fillStyle = '#b0a890'
    ctx.fillRect(x + 60 + indent, stairY, w - 120 - indent * 2, 8)
    // Stair riser
    ctx.fillStyle = '#a09878'
    ctx.fillRect(x + 60 + indent, stairY + 8, w - 120 - indent * 2, 14)
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.fillRect(x + 60 + indent, stairY + 7, w - 120 - indent * 2, 2)
  }

  // Railing (left side)
  ctx.fillStyle = '#5a4a3a'
  for (let i = 0; i < 8; i++) {
    const ry = y + h - 35 - i * 22
    const rx = x + 55 + i * 15
    ctx.fillRect(rx, ry - 10, 2, 22)
  }
  // Handrail
  ctx.fillStyle = '#4a3a2a'
  for (let i = 0; i < 7; i++) {
    const ry1 = y + h - 45 - i * 22
    const rx1 = x + 55 + i * 15
    ctx.fillRect(rx1, ry1, 17, 2)
  }

  // Doors on landings
  const doorY = [y + h - 60, y + h - 125]
  for (const dy of doorY) {
    // Left door
    ctx.fillStyle = BLDG.door
    ctx.fillRect(x + 20, dy - 20, 24, 34)
    ctx.fillStyle = '#c0a040'
    ctx.fillRect(x + 40, dy, 2, 2)
    // Right door
    ctx.fillStyle = BLDG.door
    ctx.fillRect(x + w - 44, dy - 20, 24, 34)
    ctx.fillStyle = '#c0a040'
    ctx.fillRect(x + w - 28, dy, 2, 2)
  }

  // Light fixture
  ctx.fillStyle = '#f0e080'
  ctx.fillRect(x + w / 2 - 3, y + 4, 6, 6)
  ctx.fillStyle = '#c0b060'
  ctx.fillRect(x + w / 2 - 1, y, 2, 4)
  // Light cone
  ctx.fillStyle = 'rgba(240, 224, 128, 0.1)'
  ctx.fillRect(x + w / 2 - 30, y + 10, 60, 40)

  // Window
  drawInteriorWindow(ctx, x + w / 2 - 15, y + 20, 30, 40)
}

// --- Entrance Hall ---
function drawEntranceHall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Walls
  ctx.fillStyle = '#d8d0c0'
  ctx.fillRect(x, y, w, h)

  // Tiled floor (checkerboard)
  for (let py = y + h - 40; py < y + h; py += 10) {
    for (let px = x; px < x + w; px += 10) {
      ctx.fillStyle = (((px - x + py - y) / 10) % 2 < 1) ? '#e0d8c8' : '#c0b8a8'
      ctx.fillRect(px, py, 10, 10)
    }
  }

  // Front door (large, centered)
  ctx.fillStyle = BLDG.doorFrame
  ctx.fillRect(x + w / 2 - 30, y + h - 120, 60, 80)
  ctx.fillStyle = BLDG.door
  ctx.fillRect(x + w / 2 - 26, y + h - 116, 52, 76)
  // Door panels
  ctx.fillStyle = '#3a2018'
  ctx.fillRect(x + w / 2 - 22, y + h - 112, 20, 30)
  ctx.fillRect(x + w / 2 + 2, y + h - 112, 20, 30)
  // Glass
  ctx.fillStyle = '#6a8090'
  ctx.fillRect(x + w / 2 - 20, y + h - 110, 16, 26)
  ctx.fillRect(x + w / 2 + 4, y + h - 110, 16, 26)
  // Handle
  ctx.fillStyle = '#c0a040'
  ctx.fillRect(x + w / 2 + 18, y + h - 76, 4, 4)
  ctx.fillRect(x + w / 2 - 22, y + h - 76, 4, 4)

  // Transom window above door
  ctx.fillStyle = '#6a8090'
  ctx.fillRect(x + w / 2 - 26, y + h - 130, 52, 12)
  ctx.fillStyle = BLDG.doorFrame
  ctx.fillRect(x + w / 2, y + h - 130, 1, 12)

  // Light fixture (hanging)
  ctx.fillStyle = '#c0b060'
  ctx.fillRect(x + w / 2 - 1, y, 2, 15)
  ctx.fillStyle = '#f0e890'
  ctx.fillRect(x + w / 2 - 6, y + 14, 12, 8)
  ctx.fillStyle = '#e0d880'
  ctx.fillRect(x + w / 2 - 4, y + 16, 8, 4)
  // Light glow
  ctx.fillStyle = 'rgba(240, 232, 144, 0.08)'
  ctx.fillRect(x + w / 2 - 40, y + 20, 80, 60)

  // Side table with plant
  ctx.fillStyle = '#8a7050'
  ctx.fillRect(x + 40, y + h - 60, 30, 4)
  ctx.fillRect(x + 42, y + h - 56, 4, 16)
  ctx.fillRect(x + 64, y + h - 56, 4, 16)
  drawPottedPlant(ctx, x + 48, y + h - 70)

  // Intercom panel
  ctx.fillStyle = '#d0d0d0'
  ctx.fillRect(x + w - 50, y + h - 100, 20, 30)
  ctx.fillStyle = '#a0a0a0'
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(x + w - 47, y + h - 96 + i * 4, 14, 3)
  }
}

// --- Mailboxes ---
function drawMailboxes(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Wall
  ctx.fillStyle = '#d0c8b8'
  ctx.fillRect(x, y, w, h)

  // Floor
  ctx.fillStyle = '#b0a890'
  ctx.fillRect(x, y + h - 30, w, 30)

  // Mailbox panel (large, centered)
  const panelW = 240
  const panelH = 140
  const px = x + (w - panelW) / 2
  const py = y + 30

  ctx.fillStyle = '#a09878'
  ctx.fillRect(px, py, panelW, panelH)

  // 6 mailbox slots (2 columns, 3 rows)
  const labels = ['Apt 1 - Fischer', 'Apt 2 - leer', 'Apt 3 - Neumann', 'Apt 4 - Mansour', 'Apt 5 - Berger/Klein', 'Apt 6 - Tanaka']
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const mx = px + 10 + col * 118
      const my = py + 10 + row * 44
      const idx = row * 2 + col

      // Mailbox body
      ctx.fillStyle = '#c0b898'
      ctx.fillRect(mx, my, 104, 38)
      // Slot
      ctx.fillStyle = '#2a2018'
      ctx.fillRect(mx + 8, my + 6, 88, 4)
      // Label area
      ctx.fillStyle = '#f0e8d0'
      ctx.fillRect(mx + 8, my + 16, 68, 14)
      // Label text (tiny dots representing text)
      ctx.fillStyle = '#2a2a2a'
      const label = labels[idx]
      for (let ci = 0; ci < Math.min(label.length, 16); ci++) {
        if (label[ci] !== ' ') {
          ctx.fillRect(mx + 10 + ci * 4, my + 20, 3, 1)
          ctx.fillRect(mx + 10 + ci * 4, my + 22, 2, 1)
          ctx.fillRect(mx + 10 + ci * 4, my + 24, 3, 1)
        }
      }
      // Lock
      ctx.fillStyle = '#c0a040'
      ctx.fillRect(mx + 84, my + 18, 8, 8)
      ctx.fillStyle = '#a08020'
      ctx.fillRect(mx + 86, my + 22, 4, 2)
    }
  }

  // Light fixture
  ctx.fillStyle = '#e0d880'
  ctx.fillRect(x + w / 2 - 4, y + 4, 8, 6)
}

// --- Generic room fallback ---
function drawGenericRoom(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#d8d0c0'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#a09880'
  ctx.fillRect(x, y + h - 30, w, 30)
  drawInteriorWindow(ctx, x + w / 2 - 20, y + 15, 40, 50)
}

// --- Helpers ---
function drawInteriorWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Frame
  ctx.fillStyle = BLDG.windowFrame
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4)
  // Glass — sky color
  ctx.fillStyle = '#a0c8e8'
  ctx.fillRect(x, y, w, h)
  // Light gradient
  ctx.fillStyle = '#c0d8f0'
  ctx.fillRect(x, y, w, h / 3)
  // Cross bars
  ctx.fillStyle = BLDG.windowFrame
  ctx.fillRect(x + Math.floor(w / 2), y, 1, h)
  ctx.fillRect(x, y + Math.floor(h / 2), w, 1)
  // Sill
  ctx.fillStyle = BLDG.cornice
  ctx.fillRect(x - 3, y + h + 1, w + 6, 3)
  // Curtains
  ctx.fillStyle = 'rgba(240, 230, 210, 0.6)'
  ctx.fillRect(x, y, 6, h)
  ctx.fillRect(x + w - 6, y, 6, h)
}

function drawPottedPlant(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Pot
  ctx.fillStyle = '#b06030'
  ctx.fillRect(x - 4, y + 6, 10, 8)
  ctx.fillRect(x - 5, y + 5, 12, 2)
  // Soil
  ctx.fillStyle = '#4a3020'
  ctx.fillRect(x - 3, y + 5, 8, 2)
  // Leaves
  ctx.fillStyle = '#4a8a2a'
  ctx.fillRect(x - 2, y, 6, 6)
  ctx.fillRect(x - 5, y + 1, 4, 4)
  ctx.fillRect(x + 3, y + 1, 4, 4)
  ctx.fillStyle = '#5a9a3a'
  ctx.fillRect(x - 1, y - 2, 4, 3)
  ctx.fillRect(x + 1, y + 2, 2, 2)
}

function drawHangingPlant(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Pot
  ctx.fillStyle = '#b06030'
  ctx.fillRect(x, y, 10, 6)
  // Trailing leaves
  ctx.fillStyle = '#4a8a2a'
  ctx.fillRect(x - 2, y + 6, 4, 6)
  ctx.fillRect(x + 8, y + 6, 4, 8)
  ctx.fillRect(x + 2, y + 4, 6, 4)
  ctx.fillStyle = '#5a9a3a'
  ctx.fillRect(x - 4, y + 10, 3, 4)
  ctx.fillRect(x + 10, y + 12, 3, 4)
}

function fillCircleInterior(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        ctx.fillRect(cx + dx, cy + dy, 1, 1)
      }
    }
  }
}
