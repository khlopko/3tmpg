import { GAMES_PER_AXIS } from "./constants";
import type { CellMark, GameOutcome, SubGame, GameState } from "./types";

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diags
];

function checkOutcome(cells: CellMark[]): GameOutcome {
  for (const [a, b, c] of WIN_LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[b] === cells[c]) {
      return cells[a] as "x" | "o";
    }
  }
  if (cells.every((c) => c !== null)) return "draw";
  return null;
}

/** Simple seeded RNG for reproducible mock data */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateCompletedGame(rng: () => number): SubGame {
  const cells: CellMark[] = Array(9).fill(null);
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  // Fisher-Yates shuffle
  for (let i = 8; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  let turn: CellMark = rng() < 0.5 ? "x" : "o";
  for (const idx of order) {
    cells[idx] = turn;
    const outcome = checkOutcome(cells);
    if (outcome) return { cells, outcome };
    turn = turn === "x" ? "o" : "x";
  }
  return { cells, outcome: "draw" };
}

function generateInProgressGame(rng: () => number, moveCount: number): SubGame {
  const cells: CellMark[] = Array(9).fill(null);
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = 8; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  let turn: CellMark = "x";
  for (let m = 0; m < moveCount; m++) {
    cells[order[m]] = turn;
    if (checkOutcome(cells)) {
      // Already resolved unexpectedly, return as-is
      return { cells, outcome: checkOutcome(cells) };
    }
    turn = turn === "x" ? "o" : "x";
  }
  return { cells, outcome: null };
}

function emptyGame(): SubGame {
  return { cells: Array(9).fill(null), outcome: null };
}

/** Distance from nearest corner (normalized 0..1) */
function cornerDistance(gr: number, gc: number): number {
  const center = (GAMES_PER_AXIS - 1) / 2;
  const maxDist = center; // ~166
  const corners = [
    [0, 0], [0, GAMES_PER_AXIS - 1],
    [GAMES_PER_AXIS - 1, 0], [GAMES_PER_AXIS - 1, GAMES_PER_AXIS - 1],
  ];
  let minDist = Infinity;
  for (const [cr, cc] of corners) {
    const d = Math.sqrt((gr - cr) ** 2 + (gc - cc) ** 2);
    if (d < minDist) minDist = d;
  }
  return Math.min(1, minDist / maxDist);
}

export function createGameState(): GameState {
  const rng = mulberry32(42);
  const games: SubGame[] = new Array(GAMES_PER_AXIS * GAMES_PER_AXIS);

  for (let gr = 0; gr < GAMES_PER_AXIS; gr++) {
    for (let gc = 0; gc < GAMES_PER_AXIS; gc++) {
      const idx = gr * GAMES_PER_AXIS + gc;
      const dist = cornerDistance(gr, gc);
      const roll = rng();

      if (dist < 0.2) {
        // Near corners: mostly completed
        games[idx] = roll < 0.85 ? generateCompletedGame(rng) : generateInProgressGame(rng, 2 + Math.floor(rng() * 4));
      } else if (dist < 0.45) {
        // Mid-range: mix of completed and in-progress
        if (roll < 0.4) games[idx] = generateCompletedGame(rng);
        else if (roll < 0.7) games[idx] = generateInProgressGame(rng, 1 + Math.floor(rng() * 5));
        else games[idx] = emptyGame();
      } else if (dist < 0.7) {
        // Getting toward center: mostly empty or barely started
        if (roll < 0.1) games[idx] = generateInProgressGame(rng, 1 + Math.floor(rng() * 3));
        else games[idx] = emptyGame();
      } else {
        // Center region: all empty
        games[idx] = emptyGame();
      }
    }
  }

  return { games, currentPlayer: "x" };
}
