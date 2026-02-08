import { createCamera, getVisibleRange } from "./camera";
import { createGameState } from "./game-state";
import { createInputState, setupInput } from "./input";
import { render } from "./renderer";

// --- Canvas setup ---
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const zoomDisplay = document.getElementById("zoom-level")!;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  input.dirty = true;
}

// --- Initialize state ---
const cam = createCamera();
const state = createGameState();
const input = createInputState();

// --- Wire up input ---
setupInput(canvas, cam, state, input);

// --- Handle resize ---
window.addEventListener("resize", resize);
resize();

// --- Render loop (dirty-flag) ---
function frame() {
  if (input.dirty) {
    input.dirty = false;
    const range = getVisibleRange(cam, window.innerWidth, window.innerHeight);
    render(ctx, cam, range, state.games, input.hoveredGameRow, input.hoveredGameCol);
    zoomDisplay.textContent = cam.zoom.toFixed(2);
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
