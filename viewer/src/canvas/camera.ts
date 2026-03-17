import { CLICK_REGIONS } from './layout'
import { VIRT_W, VIRT_H, ROOM_X, ROOM_Y, ROOM_W, ROOM_H } from './layout'

export interface CameraState {
  x: number
  y: number
  zoom: number
  targetX: number
  targetY: number
  targetZoom: number
  transitioning: boolean
}

export function createCamera(): CameraState {
  return {
    x: 0,
    y: 0,
    zoom: 1,
    targetX: 0,
    targetY: 0,
    targetZoom: 1,
    transitioning: false,
  }
}

const LERP_SPEED = 4.0
const SNAP_THRESHOLD = 0.5

export function updateCamera(camera: CameraState, dt: number): CameraState {
  if (!camera.transitioning) return camera

  const t = 1 - Math.exp(-LERP_SPEED * dt)
  const newX = camera.x + (camera.targetX - camera.x) * t
  const newY = camera.y + (camera.targetY - camera.y) * t
  const newZoom = camera.zoom + (camera.targetZoom - camera.zoom) * t

  const dx = Math.abs(newX - camera.targetX)
  const dy = Math.abs(newY - camera.targetY)
  const dz = Math.abs(newZoom - camera.targetZoom)
  const done = dx < SNAP_THRESHOLD && dy < SNAP_THRESHOLD && dz < 0.005

  if (done) {
    return {
      x: camera.targetX,
      y: camera.targetY,
      zoom: camera.targetZoom,
      targetX: camera.targetX,
      targetY: camera.targetY,
      targetZoom: camera.targetZoom,
      transitioning: false,
    }
  }

  return {
    ...camera,
    x: newX,
    y: newY,
    zoom: newZoom,
  }
}

export function zoomToLocation(camera: CameraState, location: string): CameraState {
  const region = CLICK_REGIONS[location]
  if (!region) return camera

  // Zoom to show the room interior centered in the virtual canvas
  const targetZoom = 1 // Interior view is drawn at full virtual res
  const targetX = 0
  const targetY = 0

  return {
    ...camera,
    targetX,
    targetY,
    targetZoom,
    transitioning: true,
  }
}

export function zoomOut(camera: CameraState): CameraState {
  return {
    ...camera,
    targetX: 0,
    targetY: 0,
    targetZoom: 1,
    transitioning: true,
  }
}

export function isTransitioning(camera: CameraState): boolean {
  return camera.transitioning
}

export function getTransform(camera: CameraState): { offsetX: number; offsetY: number; scale: number } {
  return {
    offsetX: -camera.x * camera.zoom,
    offsetY: -camera.y * camera.zoom,
    scale: camera.zoom,
  }
}
