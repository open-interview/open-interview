// Override parent workspace postcss.config.js.
// Tailwind v4 CSS is handled by @tailwindcss/vite (Vite plugin),
// NOT via PostCSS, so this config intentionally has no tailwindcss plugin.
export default {
  plugins: {},
};
