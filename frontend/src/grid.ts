import { GAME_SIZE, GAMES_PER_AXIS } from "./constants";

/** Convert a cell coordinate (0..332) to the sub-game index (0..110) */
export function cellToGame(cell: number): number {
  return Math.floor(cell / GAME_SIZE);
}

/** Convert a sub-game index (0..110) to the first cell coordinate in that game */
export function gameToCell(game: number): number {
  return game * GAME_SIZE;
}

/** Convert a cell coordinate to the local position within its sub-game (0..2) */
export function cellToLocal(cell: number): number {
  return cell % GAME_SIZE;
}

/** Convert (gameRow, gameCol) to flat array index */
export function gameIndex(gameRow: number, gameCol: number): number {
  return gameRow * GAMES_PER_AXIS + gameCol;
}

/** Convert a local cell position (localRow, localCol) to flat cell index within a sub-game */
export function localCellIndex(localRow: number, localCol: number): number {
  return localRow * GAME_SIZE + localCol;
}

/** Clamp a game coordinate to valid range */
export function clampGame(g: number): number {
  return Math.max(0, Math.min(GAMES_PER_AXIS - 1, g));
}
