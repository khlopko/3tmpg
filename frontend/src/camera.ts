import {
  ZOOM_MIN, ZOOM_MAX, WORLD_SIZE, GAME_PX, GAMES_PER_AXIS,
} from "./constants";
import { clampGame } from "./grid";
import type { Camera, VisibleRange } from "./types";

export function createCamera(): Camera {
  // Pick a random corner, then place the camera in the frontier zone
  // (distance 0.25–0.35 from corner — some played games, but not packed)
  const corners = [
    [0, 0],
    [0, GAMES_PER_AXIS - 1],
    [GAMES_PER_AXIS - 1, 0],
    [GAMES_PER_AXIS - 1, GAMES_PER_AXIS - 1],
  ];
  const corner = corners[Math.floor(Math.random() * corners.length)];
  const center = (GAMES_PER_AXIS - 1) / 2;
  const maxDist = center;

  // Target distance ~0.3 of maxDist from the corner, with some jitter
  const dist = (0.25 + Math.random() * 0.1) * maxDist;
  // Angle toward center with some spread
  const angleToCenter = Math.atan2(center - corner[0], center - corner[1]);
  const angle = angleToCenter + (Math.random() - 0.5) * 0.6;

  const targetGameRow = Math.round(corner[0] + Math.sin(angle) * dist);
  const targetGameCol = Math.round(corner[1] + Math.cos(angle) * dist);

  // World-space center of the target game
  const wx = targetGameCol * GAME_PX + GAME_PX / 2;
  const wy = targetGameRow * GAME_PX + GAME_PX / 2;

  // Zoom in enough to play (high LOD)
  const zoom = 1.0;
  return {
    offsetX: wx - (window.innerWidth / 2) / zoom,
    offsetY: wy - (window.innerHeight / 2) / zoom,
    zoom,
  };
}

/** Convert screen pixel (x,y) to world coordinates */
export function screenToWorld(cam: Camera, sx: number, sy: number): { wx: number; wy: number } {
  return {
    wx: cam.offsetX + sx / cam.zoom,
    wy: cam.offsetY + sy / cam.zoom,
  };
}

/** Convert world coordinates to screen pixel */
export function worldToScreen(cam: Camera, wx: number, wy: number): { sx: number; sy: number } {
  return {
    sx: (wx - cam.offsetX) * cam.zoom,
    sy: (wy - cam.offsetY) * cam.zoom,
  };
}

/** Apply zoom centered on a screen point */
export function zoomAt(cam: Camera, sx: number, sy: number, delta: number): void {
  const oldZoom = cam.zoom;
  const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, oldZoom * (1 - delta)));

  // Adjust offset so the world point under the cursor stays fixed
  const wx = cam.offsetX + sx / oldZoom;
  const wy = cam.offsetY + sy / oldZoom;
  cam.offsetX = wx - sx / newZoom;
  cam.offsetY = wy - sy / newZoom;
  cam.zoom = newZoom;
}

/** Pan camera by screen pixel deltas */
export function pan(cam: Camera, dsx: number, dsy: number): void {
  cam.offsetX -= dsx / cam.zoom;
  cam.offsetY -= dsy / cam.zoom;
}

/** Get the range of visible sub-games (inclusive) */
export function getVisibleRange(cam: Camera, canvasW: number, canvasH: number): VisibleRange {
  const topLeft = screenToWorld(cam, 0, 0);
  const bottomRight = screenToWorld(cam, canvasW, canvasH);

  return {
    startGameCol: clampGame(Math.floor(topLeft.wx / GAME_PX)),
    startGameRow: clampGame(Math.floor(topLeft.wy / GAME_PX)),
    endGameCol: clampGame(Math.floor(bottomRight.wx / GAME_PX)),
    endGameRow: clampGame(Math.floor(bottomRight.wy / GAME_PX)),
  };
}
