import type { AgentName } from '../api/types'

export const AGENT_COLORS: Record<AgentName, string> = {
  marco: '#5b8dd9',
  sarah: '#d95ba3',
  marta: '#d9a85b',
  hakim: '#5bd9a8',
  suki: '#d95b5b',
  rolf: '#8a8a8a',
}

// Agent clothing/feature colors for sprite rendering
export const AGENT_STYLE: Record<AgentName, {
  hair: string, clothes: string, skin: string, pants: string, shoes: string, detail?: string
}> = {
  marco:  { hair: '#3a2a1a', clothes: '#4a7ac4', skin: '#f0c8a0', pants: '#3a3a50', shoes: '#2a2a2a', detail: 'messy_hair' },
  sarah:  { hair: '#5a3020', clothes: '#c94a8a', skin: '#f0c8a0', pants: '#3a3a50', shoes: '#4a2a2a', detail: 'ponytail' },
  marta:  { hair: '#c0c0c0', clothes: '#c4944a', skin: '#e8c0a0', pants: '#6a5a40', shoes: '#4a3020', detail: 'bun' },
  rolf:   { hair: '#5a5a5a', clothes: '#6a6a6a', skin: '#e0b898', pants: '#4a4a4a', shoes: '#3a2a1a', detail: 'cap' },
  hakim:  { hair: '#1a1a1a', clothes: '#4ab898', skin: '#c8a078', pants: '#3a3a4a', shoes: '#2a2a2a', detail: 'neat' },
  suki:   { hair: '#1a1018', clothes: '#c44a4a', skin: '#f0d0a8', pants: '#3a3a50', shoes: '#2a2020', detail: 'long_hair' },
}

// Building palette
export const BLDG = {
  brick: '#c8886a',
  brickDark: '#a86848',
  brickLight: '#d8a080',
  mortar: '#d4c0a8',
  windowFrame: '#f0e0d0',
  windowDark: '#2a2a3a',
  windowGlow: '#ffe8a8',
  windowGlowBright: '#fff0c0',
  roof: '#904828',
  roofDark: '#703818',
  roofLight: '#b06838',
  door: '#4a3020',
  doorFrame: '#8a7060',
  cornice: '#e0d0c0',
  sign: '#f0e8d0',
}

// Environment
export const ENV = {
  sidewalk: '#b0a890',
  street: '#707068',
  streetLine: '#a0a090',
  grass: '#6a9a4a',
  grassDark: '#5a8a3a',
  treeTrunk: '#5a3a1a',
  treeLeaf: '#4a7a2a',
  treeLeafLight: '#6a9a3a',
  fenceWood: '#7a5a3a',
}

// Sky gradients for different times of day
export function getSkyColors(hour: number): { top: string; bottom: string } {
  if (hour >= 7 && hour < 9) return { top: '#f0a060', bottom: '#ffd8a0' }       // dawn
  if (hour >= 9 && hour < 12) return { top: '#68b0e8', bottom: '#c0e0ff' }      // morning
  if (hour >= 12 && hour < 16) return { top: '#4898d8', bottom: '#a0d0f0' }     // midday
  if (hour >= 16 && hour < 18) return { top: '#d89050', bottom: '#f0c880' }     // golden hour
  if (hour >= 18 && hour < 20) return { top: '#6a3860', bottom: '#d08060' }     // dusk
  if (hour >= 20 && hour < 22) return { top: '#1a1838', bottom: '#3a3058' }     // evening
  return { top: '#0a0818', bottom: '#1a1838' }                                   // night
}
