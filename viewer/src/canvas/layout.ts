// Virtual canvas resolution — everything is drawn in this coordinate space
// then scaled up with imageSmoothingEnabled=false for pixel art look
export const VIRT_W = 480
export const VIRT_H = 320

// Building layout in virtual coords
export const BLDG_X = 150
export const BLDG_W = 180
export const BLDG_R = BLDG_X + BLDG_W  // 330

export const ROOF_PEAK_Y = 22
export const ROOF_BASE_Y = 45
export const FLOOR_H = 36
export const GROUND_H = 30

// Floor y-positions (top edge of each floor)
export const FLOOR_Y = {
  apt6: ROOF_BASE_Y,                                    // 45
  apt5: ROOF_BASE_Y + FLOOR_H,                          // 81
  apt4: ROOF_BASE_Y + FLOOR_H,                          // 81 (same floor, right side)
  apt3: ROOF_BASE_Y + FLOOR_H * 2,                      // 117
  apt2: ROOF_BASE_Y + FLOOR_H * 2,                      // 117 (same floor, right side)
  apt1: ROOF_BASE_Y + FLOOR_H * 3,                      // 153
  ground: ROOF_BASE_Y + FLOOR_H * 4,                    // 189
}

export const STREET_Y = FLOOR_Y.ground + GROUND_H       // 219
export const GROUND_Y = STREET_Y + 16                    // 235

// Split point for double apartments
export const BLDG_MID = BLDG_X + BLDG_W / 2             // 240

// Window definitions per apartment
export interface WindowDef {
  x: number; y: number; w: number; h: number
}

export const WINDOWS: Record<string, WindowDef[]> = {
  'Apartment 6': [
    { x: BLDG_X + 25, y: FLOOR_Y.apt6 + 6, w: 22, h: 24 },
    { x: BLDG_R - 47, y: FLOOR_Y.apt6 + 6, w: 22, h: 24 },
  ],
  'Apartment 5': [
    { x: BLDG_X + 20, y: FLOOR_Y.apt5 + 6, w: 22, h: 24 },
  ],
  'Apartment 4': [
    { x: BLDG_MID + 20, y: FLOOR_Y.apt4 + 6, w: 22, h: 24 },
  ],
  'Apartment 3': [
    { x: BLDG_X + 20, y: FLOOR_Y.apt3 + 6, w: 22, h: 24 },
  ],
  'Apartment 2': [
    { x: BLDG_MID + 20, y: FLOOR_Y.apt2 + 6, w: 22, h: 24 },
  ],
  'Apartment 1': [
    { x: BLDG_X + 25, y: FLOOR_Y.apt1 + 6, w: 22, h: 24 },
    { x: BLDG_R - 47, y: FLOOR_Y.apt1 + 6, w: 22, h: 24 },
  ],
}

// Clickable regions for each location (in virtual coords)
export interface ClickRegion {
  x: number; y: number; w: number; h: number; label: string
}

export const CLICK_REGIONS: Record<string, ClickRegion> = {
  'Apartment 6': { x: BLDG_X, y: FLOOR_Y.apt6, w: BLDG_W, h: FLOOR_H, label: 'Whg 6 — Suki' },
  'Apartment 5': { x: BLDG_X, y: FLOOR_Y.apt5, w: BLDG_W / 2, h: FLOOR_H, label: 'Whg 5 — Marco & Sarah' },
  'Apartment 4': { x: BLDG_MID, y: FLOOR_Y.apt4, w: BLDG_W / 2, h: FLOOR_H, label: 'Whg 4 — Hakim' },
  'Apartment 3': { x: BLDG_X, y: FLOOR_Y.apt3, w: BLDG_W / 2, h: FLOOR_H, label: 'Whg 3 — Rolf' },
  'Apartment 2': { x: BLDG_MID, y: FLOOR_Y.apt2, w: BLDG_W / 2, h: FLOOR_H, label: 'Whg 2 — leer' },
  'Apartment 1': { x: BLDG_X, y: FLOOR_Y.apt1, w: BLDG_W, h: FLOOR_H, label: 'Whg 1 — Marta' },
  'Entrance Hall': { x: BLDG_X, y: FLOOR_Y.ground, w: BLDG_W * 0.6, h: GROUND_H, label: 'Eingang' },
  'Mailboxes': { x: BLDG_X + BLDG_W * 0.6, y: FLOOR_Y.ground, w: BLDG_W * 0.4, h: GROUND_H, label: 'Briefkästen' },
  'Späti': { x: 40, y: STREET_Y - 32, w: 90, h: 32, label: 'Späti' },
  'Zum Anker': { x: 350, y: STREET_Y - 32, w: 90, h: 32, label: 'Zum Anker' },
  'Backyard': { x: BLDG_X + 10, y: GROUND_Y + 5, w: BLDG_W - 20, h: 50, label: 'Hinterhof' },
  'Stairwell': { x: BLDG_R, y: FLOOR_Y.apt6, w: 20, h: FLOOR_H * 4 + GROUND_H, label: 'Treppenhaus' },
}

// Where agents appear on the exterior (center position)
export const AGENT_POS_EXTERIOR: Record<string, { x: number; y: number; inside: boolean }> = {
  'Apartment 6': { x: BLDG_X + BLDG_W / 2, y: FLOOR_Y.apt6 + FLOOR_H - 4, inside: true },
  'Apartment 5': { x: BLDG_X + BLDG_W / 4, y: FLOOR_Y.apt5 + FLOOR_H - 4, inside: true },
  'Apartment 4': { x: BLDG_MID + BLDG_W / 4, y: FLOOR_Y.apt4 + FLOOR_H - 4, inside: true },
  'Apartment 3': { x: BLDG_X + BLDG_W / 4, y: FLOOR_Y.apt3 + FLOOR_H - 4, inside: true },
  'Apartment 2': { x: BLDG_MID + BLDG_W / 4, y: FLOOR_Y.apt2 + FLOOR_H - 4, inside: true },
  'Apartment 1': { x: BLDG_X + BLDG_W / 2, y: FLOOR_Y.apt1 + FLOOR_H - 4, inside: true },
  'Entrance Hall': { x: BLDG_X + 40, y: STREET_Y - 2, inside: false },
  'Mailboxes': { x: BLDG_R - 30, y: STREET_Y - 2, inside: false },
  'Stairwell': { x: BLDG_R + 10, y: FLOOR_Y.apt3 + FLOOR_H / 2, inside: true },
  'Backyard': { x: BLDG_X + BLDG_W / 2, y: GROUND_Y + 30, inside: false },
  'Späti': { x: 85, y: STREET_Y - 2, inside: false },
  'Zum Anker': { x: 395, y: STREET_Y - 2, inside: false },
}

// Interior room dimensions (fills most of the virtual canvas when zoomed in)
export const ROOM_W = 420
export const ROOM_H = 240
export const ROOM_X = (VIRT_W - ROOM_W) / 2
export const ROOM_Y = (VIRT_H - ROOM_H) / 2 + 10
