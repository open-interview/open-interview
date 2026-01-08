/**
 * Available scene types for SVG generation
 */
export type SceneType = 
  | 'architecture'
  | 'scaling'
  | 'database'
  | 'deployment'
  | 'security'
  | 'debugging'
  | 'testing'
  | 'performance'
  | 'api'
  | 'monitoring'
  | 'frontend'
  | 'success'
  | 'error'
  | 'default';

/**
 * Options for SVG generation
 */
export interface GenerateOptions {
  /** Width of the SVG (default: 700) */
  width?: number;
  /** Height of the SVG (default: 420) */
  height?: number;
  /** Theme name or custom theme colors */
  theme?: string;
  /** Force a specific scene type instead of auto-detection */
  scene?: SceneType;
}

/**
 * Result of SVG generation
 */
export interface GenerateResult {
  /** The generated SVG string */
  svg: string;
  /** The detected or specified scene type */
  scene: SceneType;
  /** Width of the generated SVG */
  width: number;
  /** Height of the generated SVG */
  height: number;
}

/**
 * Code line for code snippet component
 */
export interface CodeLine {
  /** The text content of the line */
  t: string;
  /** Whether to highlight this line */
  hl?: boolean;
}

/**
 * Terminal line for terminal block component
 */
export interface TerminalLine {
  /** The text content of the line */
  t: string;
  /** Whether this is an error line */
  err?: boolean;
  /** Whether this is a success line */
  ok?: boolean;
}

/**
 * Theme color definitions
 */
export interface ThemeColors {
  bg: string;
  card: string;
  elevated: string;
  border: string;
  text: string;
  muted: string;
  dim: string;
  blue: string;
  purple: string;
  green: string;
  cyan: string;
  orange: string;
  red: string;
  pink: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}
