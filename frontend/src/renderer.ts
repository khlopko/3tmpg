import {
  CELL_SIZE, GAME_PX, GAME_SIZE,
  GAME_BORDER_COLOR, GAME_BORDER_WIDTH,
  CELL_BORDER_COLOR, CELL_BORDER_WIDTH,
  TINT_A, TINT_B, HIGHLIGHT_COLOR,
  X_COLOR, O_COLOR, DRAW_COLOR, EMPTY_COLOR, BG_COLOR,
  LOD_LOW_THRESHOLD, LOD_MED_THRESHOLD,
} from "./constants";
import { worldToScreen } from "./camera";
import { gameIndex } from "./grid";
import type { Camera, VisibleRange, SubGame } from "./types";

type LOD = "low" | "medium" | "high";

function getLOD(zoom: number): LOD {
  if (zoom < LOD_LOW_THRESHOLD) return "low";
  if (zoom < LOD_MED_THRESHOLD) return "medium";
  return "high";
}

function outcomeColor(outcome: SubGame["outcome"]): string {
  switch (outcome) {
    case "x": return X_COLOR;
    case "o": return O_COLOR;
    case "draw": return DRAW_COLOR;
    default: return EMPTY_COLOR;
  }
}

function cellMarkColor(mark: "x" | "o"): string {
  return mark === "x" ? X_COLOR : O_COLOR;
}

/** Draw an X mark within a cell rectangle */
function drawX(ctx: CanvasRenderingContext2D, sx: number, sy: number, size: number): void {
  const pad = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(sx + pad, sy + pad);
  ctx.lineTo(sx + size - pad, sy + size - pad);
  ctx.moveTo(sx + size - pad, sy + pad);
  ctx.lineTo(sx + pad, sy + size - pad);
  ctx.strokeStyle = X_COLOR;
  ctx.lineWidth = Math.max(1, size * 0.12);
  ctx.lineCap = "round";
  ctx.stroke();
}

/** Draw an O mark within a cell rectangle */
function drawO(ctx: CanvasRenderingContext2D, sx: number, sy: number, size: number): void {
  const cx = sx + size / 2;
  const cy = sy + size / 2;
  const r = size * 0.3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = O_COLOR;
  ctx.lineWidth = Math.max(1, size * 0.12);
  ctx.stroke();
}

export function render(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  range: VisibleRange,
  games: SubGame[],
  hoveredGameRow: number,
  hoveredGameCol: number,
): void {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;

  // Clear
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  const lod = getLOD(cam.zoom);
  const { startGameRow, endGameRow, startGameCol, endGameCol } = range;

  for (let gr = startGameRow; gr <= endGameRow; gr++) {
    for (let gc = startGameCol; gc <= endGameCol; gc++) {
      const idx = gameIndex(gr, gc);
      const game = games[idx];

      // World-space origin of this game block
      const gwx = gc * GAME_PX;
      const gwy = gr * GAME_PX;

      // Screen-space origin and size
      const { sx, sy } = worldToScreen(cam, gwx, gwy);
      const screenSize = GAME_PX * cam.zoom;

      // Skip if entirely off-screen (safety margin)
      if (sx + screenSize < -2 || sy + screenSize < -2 || sx > w + 2 || sy > h + 2) continue;

      // Checkerboard tint
      const tint = (gr + gc) % 2 === 0 ? TINT_A : TINT_B;

      if (lod === "low") {
        // Inset by 1px so the dark background acts as a grid line between games
        const inset = Math.max(0.5, cam.zoom * 1.5);
        ctx.fillStyle = game.outcome ? outcomeColor(game.outcome) : tint;
        ctx.fillRect(sx + inset, sy + inset, screenSize - inset * 2, screenSize - inset * 2);
      } else if (lod === "medium") {
        // Background tint
        ctx.fillStyle = tint;
        ctx.fillRect(sx, sy, screenSize, screenSize);

        // Draw colored fills for each cell
        const cellScreen = screenSize / GAME_SIZE;
        for (let lr = 0; lr < GAME_SIZE; lr++) {
          for (let lc = 0; lc < GAME_SIZE; lc++) {
            const mark = game.cells[lr * GAME_SIZE + lc];
            if (mark) {
              ctx.fillStyle = cellMarkColor(mark);
              ctx.globalAlpha = 0.4;
              ctx.fillRect(
                sx + lc * cellScreen,
                sy + lr * cellScreen,
                cellScreen,
                cellScreen,
              );
              ctx.globalAlpha = 1;
            }
          }
        }

        // Game border
        ctx.strokeStyle = GAME_BORDER_COLOR;
        ctx.lineWidth = GAME_BORDER_WIDTH;
        ctx.strokeRect(sx, sy, screenSize, screenSize);
      } else {
        // HIGH LOD: full detail
        // Background tint
        ctx.fillStyle = tint;
        ctx.fillRect(sx, sy, screenSize, screenSize);

        const cellScreen = screenSize / GAME_SIZE;

        // Draw each cell
        for (let lr = 0; lr < GAME_SIZE; lr++) {
          for (let lc = 0; lc < GAME_SIZE; lc++) {
            const csx = sx + lc * cellScreen;
            const csy = sy + lr * cellScreen;

            // Cell border
            ctx.strokeStyle = CELL_BORDER_COLOR;
            ctx.lineWidth = CELL_BORDER_WIDTH;
            ctx.strokeRect(csx, csy, cellScreen, cellScreen);

            // Draw mark
            const mark = game.cells[lr * GAME_SIZE + lc];
            if (mark === "x") {
              drawX(ctx, csx, csy, cellScreen);
            } else if (mark === "o") {
              drawO(ctx, csx, csy, cellScreen);
            }
          }
        }

        // Game border (drawn on top)
        ctx.strokeStyle = GAME_BORDER_COLOR;
        ctx.lineWidth = GAME_BORDER_WIDTH;
        ctx.strokeRect(sx, sy, screenSize, screenSize);

        // Outcome overlay
        if (game.outcome) {
          ctx.fillStyle = outcomeColor(game.outcome);
          ctx.globalAlpha = 0.15;
          ctx.fillRect(sx, sy, screenSize, screenSize);
          ctx.globalAlpha = 1;
        }
      }

      // Highlight hovered game
      if (gr === hoveredGameRow && gc === hoveredGameCol) {
        ctx.strokeStyle = HIGHLIGHT_COLOR;
        ctx.lineWidth = Math.max(2, 3 / cam.zoom * cam.zoom);
        ctx.strokeRect(sx + 1, sy + 1, screenSize - 2, screenSize - 2);
      }
    }
  }
}
