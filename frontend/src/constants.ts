// Grid dimensions
export const GRID_SIZE = 333;
export const GAME_SIZE = 3;
export const GAMES_PER_AXIS = 111;
export const TOTAL_GAMES = GAMES_PER_AXIS * GAMES_PER_AXIS;

// Cell sizing (world-space pixels)
export const CELL_SIZE = 30;
export const GAME_PX = CELL_SIZE * GAME_SIZE;
export const WORLD_SIZE = CELL_SIZE * GRID_SIZE;

// Borders
export const GAME_BORDER_WIDTH = 2;
export const CELL_BORDER_WIDTH = 0.5;

// Colors
export const BG_COLOR = "#1a1a1a";
export const GAME_BORDER_COLOR = "#333";
export const CELL_BORDER_COLOR = "#ccc";
export const TINT_A = "rgba(255,255,255,0.04)";
export const TINT_B = "rgba(255,255,255,0.10)";
export const HIGHLIGHT_COLOR = "rgba(255,200,50,0.6)";
export const X_COLOR = "#aaa";//"#2979ff";
export const O_COLOR = "#ef5350";
export const DRAW_COLOR = "#555";
export const EMPTY_COLOR = "rgba(255,255,255,0.08)";

// Zoom thresholds for LOD
export const LOD_LOW_THRESHOLD = 0.15;
export const LOD_MED_THRESHOLD = 0.5;

// Zoom limits
export const ZOOM_MIN = 0.02;
export const ZOOM_MAX = 4.0;
export const ZOOM_SPEED = 0.001;
