import { createSignal, createEffect } from "solid-js";

const themes = ["pink", "blue", "green", "purple"];
const STORAGE_THEME = "math-theme";
const STORAGE_DARK = "math-dark";

function applyDark(dark, theme) {
  themes.forEach((t) => document.body.classList.remove("theme-" + t));
  document.body.classList.add("theme-" + theme);
  if (dark) document.body.setAttribute("data-theme", "dark");
  else document.body.removeAttribute("data-theme");
  localStorage.setItem(STORAGE_DARK, dark);
  localStorage.setItem(STORAGE_THEME, theme);
}

export function useTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME);
  const prefersDark = window.matchMedia("(prefers-color-scheme:dark)").matches;
  const saved = localStorage.getItem(STORAGE_DARK);
  const [currentTheme, setCurrentTheme] = createSignal(
    savedTheme && themes.includes(savedTheme)
      ? savedTheme
      : themes[Math.floor(Math.random() * themes.length)]
  );
  const [isDark, setIsDark] = createSignal(
    saved !== null ? saved === "true" : prefersDark
  );

  createEffect(() => { applyDark(isDark(), currentTheme()); });

  const toggleTheme = () => setIsDark(!isDark());

  return { currentTheme, setCurrentTheme, isDark, setIsDark, toggleTheme };
}
