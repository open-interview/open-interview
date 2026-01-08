/**
 * Tech SVG Generator
 * Generate clean, professional SVG illustrations for technical content
 */

export { generateSVG, generateIllustration, detectScene, getAvailableScenes } from './generator.js';
export { SCENES } from './scenes.js';
export { THEMES, getTheme } from './themes.js';
export { ICONS, getIconNames } from './icons.js';
export type { GenerateOptions, GenerateResult, SceneType, Theme, ThemeColors, CodeLine, TerminalLine } from './types.js';
