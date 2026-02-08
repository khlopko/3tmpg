export type CellMark = "x" | "o" | null;

export type GameOutcome = "x" | "o" | "draw" | null; // null = in-progress or empty

export interface SubGame {
  cells: CellMark[];  // 9 elements, row-major [0..8]
  outcome: GameOutcome;
}

export interface GameState {
  games: SubGame[];          // Flat array, index = gameRow * 333 + gameCol
  currentPlayer: CellMark;   // Whose turn it is
}

export interface Camera {
  offsetX: number;  // World-space X of viewport top-left
  offsetY: number;  // World-space Y of viewport top-left
  zoom: number;     // Scale factor
}

export interface VisibleRange {
  startGameCol: number;
  endGameCol: number;
  startGameRow: number;
  endGameRow: number;
}
