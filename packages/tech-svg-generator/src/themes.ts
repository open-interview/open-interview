import type { Theme, ThemeColors } from './types.js';

/**
 * GitHub-inspired dark theme (default)
 */
const githubDark: Theme = {
  name: 'github-dark',
  colors: {
    bg: '#0d1117',
    card: '#161b22',
    elevated: '#21262d',
    border: '#30363d',
    text: '#e6edf3',
    muted: '#8b949e',
    dim: '#6e7681',
    blue: '#58a6ff',
    purple: '#a371f7',
    green: '#3fb950',
    cyan: '#39c5cf',
    orange: '#d29922',
    red: '#f85149',
    pink: '#f778ba',
  }
};

/**
 * Dracula theme
 */
const dracula: Theme = {
  name: 'dracula',
  colors: {
    bg: '#282a36',
    card: '#44475a',
    elevated: '#6272a4',
    border: '#44475a',
    text: '#f8f8f2',
    muted: '#6272a4',
    dim: '#44475a',
    blue: '#8be9fd',
    purple: '#bd93f9',
    green: '#50fa7b',
    cyan: '#8be9fd',
    orange: '#ffb86c',
    red: '#ff5555',
    pink: '#ff79c6',
  }
};

/**
 * Nord theme
 */
const nord: Theme = {
  name: 'nord',
  colors: {
    bg: '#2e3440',
    card: '#3b4252',
    elevated: '#434c5e',
    border: '#4c566a',
    text: '#eceff4',
    muted: '#d8dee9',
    dim: '#4c566a',
    blue: '#88c0d0',
    purple: '#b48ead',
    green: '#a3be8c',
    cyan: '#8fbcbb',
    orange: '#d08770',
    red: '#bf616a',
    pink: '#b48ead',
  }
};

/**
 * One Dark theme
 */
const oneDark: Theme = {
  name: 'one-dark',
  colors: {
    bg: '#282c34',
    card: '#21252b',
    elevated: '#2c313a',
    border: '#3e4451',
    text: '#abb2bf',
    muted: '#5c6370',
    dim: '#4b5263',
    blue: '#61afef',
    purple: '#c678dd',
    green: '#98c379',
    cyan: '#56b6c2',
    orange: '#d19a66',
    red: '#e06c75',
    pink: '#c678dd',
  }
};

/**
 * Available themes
 */
export const THEMES: Record<string, Theme> = {
  'github-dark': githubDark,
  'dracula': dracula,
  'nord': nord,
  'one-dark': oneDark,
};

/**
 * Get theme by name, defaults to github-dark
 */
export function getTheme(name?: string): Theme {
  if (!name) return githubDark;
  return THEMES[name] || githubDark;
}
