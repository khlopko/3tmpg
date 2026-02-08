import { GAME_PX, GAME_SIZE, CELL_SIZE, ZOOM_SPEED, GAMES_PER_AXIS } from "./constants";
import { screenToWorld, zoomAt, pan } from "./camera";
import { cellToGame, cellToLocal, gameIndex, localCellIndex } from "./grid";
import type { Camera, GameState, CellMark } from "./types";

export interface InputState {
  isDragging: boolean;
  lastX: number;
  lastY: number;
  hoveredGameRow: number;
  hoveredGameCol: number;
  dirty: boolean;
}

export function createInputState(): InputState {
  return {
    isDragging: false,
    lastX: 0,
    lastY: 0,
    hoveredGameRow: -1,
    hoveredGameCol: -1,
    dirty: true, // Draw on first frame
  };
}

export function setupInput(
  canvas: HTMLCanvasElement,
  cam: Camera,
  state: GameState,
  input: InputState,
): void {
  // --- Mouse wheel: zoom ---
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY * ZOOM_SPEED;
    zoomAt(cam, e.offsetX, e.offsetY, delta);
    updateHover(e.offsetX, e.offsetY);
    input.dirty = true;
  }, { passive: false });

  // --- Mouse down: start drag ---
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
      input.isDragging = true;
      input.lastX = e.clientX;
      input.lastY = e.clientY;
      canvas.classList.add("dragging");
    }
  });

  // --- Mouse move: drag or hover ---
  window.addEventListener("mousemove", (e) => {
    if (input.isDragging) {
      const dx = e.clientX - input.lastX;
      const dy = e.clientY - input.lastY;
      pan(cam, dx, dy);
      input.lastX = e.clientX;
      input.lastY = e.clientY;
      input.dirty = true;
    }

    // Update hover (use canvas-relative coordinates)
    const rect = canvas.getBoundingClientRect();
    updateHover(e.clientX - rect.left, e.clientY - rect.top);
  });

  // --- Mouse up: stop drag ---
  window.addEventListener("mouseup", (e) => {
    if (e.button === 0 && input.isDragging) {
      input.isDragging = false;
      canvas.classList.remove("dragging");
    }
  });

  // --- Click: place mark ---
  canvas.addEventListener("click", (e) => {
    // Don't place if we were dragging
    if (Math.abs(e.clientX - input.lastX) > 3 || Math.abs(e.clientY - input.lastY) > 3) return;

    const { wx, wy } = screenToWorld(cam, e.offsetX, e.offsetY);
    const cellCol = Math.floor(wx / CELL_SIZE);
    const cellRow = Math.floor(wy / CELL_SIZE);

    if (cellCol < 0 || cellCol >= 333 || cellRow < 0 || cellRow >= 333) return;

    const gc = cellToGame(cellCol);
    const gr = cellToGame(cellRow);
    const lc = cellToLocal(cellCol);
    const lr = cellToLocal(cellRow);

    const idx = gameIndex(gr, gc);
    const game = state.games[idx];

    // Can't play in completed games
    if (game.outcome) return;

    const ci = localCellIndex(lr, lc);
    // Can't play in occupied cells
    if (game.cells[ci]) return;

    // Place the mark
    game.cells[ci] = state.currentPlayer;

    // Check for game outcome after placing
    const outcome = checkOutcome(game.cells);
    if (outcome) game.outcome = outcome;

    // Toggle player
    state.currentPlayer = state.currentPlayer === "x" ? "o" : "x";
    input.dirty = true;
  });

  // --- Touch support ---
  let touchStartDist = 0;
  let touchStartZoom = 0;

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      input.isDragging = true;
      input.lastX = e.touches[0].clientX;
      input.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      input.isDragging = false;
      touchStartDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
      touchStartZoom = cam.zoom;
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && input.isDragging) {
      const dx = e.touches[0].clientX - input.lastX;
      const dy = e.touches[0].clientY - input.lastY;
      pan(cam, dx, dy);
      input.lastX = e.touches[0].clientX;
      input.lastY = e.touches[0].clientY;
      input.dirty = true;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const rect = canvas.getBoundingClientRect();
      const scale = dist / touchStartDist;
      const newZoom = touchStartZoom * scale;
      const delta = -(newZoom - cam.zoom) / cam.zoom;
      zoomAt(cam, midX - rect.left, midY - rect.top, delta);
      input.dirty = true;
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      input.isDragging = false;
    }
  });

  function updateHover(sx: number, sy: number) {
    const { wx, wy } = screenToWorld(cam, sx, sy);
    const gc = Math.floor(wx / GAME_PX);
    const gr = Math.floor(wy / GAME_PX);
    const newGC = gc >= 0 && gc < GAMES_PER_AXIS ? gc : -1;
    const newGR = gr >= 0 && gr < GAMES_PER_AXIS ? gr : -1;
    if (newGR !== input.hoveredGameRow || newGC !== input.hoveredGameCol) {
      input.hoveredGameRow = newGR;
      input.hoveredGameCol = newGC;
      input.dirty = true;
    }
  }
}

// Inline win check for click handler
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkOutcome(cells: CellMark[]): "x" | "o" | "draw" | null {
  for (const [a, b, c] of WIN_LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[b] === cells[c]) {
      return cells[a] as "x" | "o";
    }
  }
  if (cells.every((c) => c !== null)) return "draw";
  return null;
}
