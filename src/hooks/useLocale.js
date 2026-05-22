import { createSignal, createEffect } from "solid-js";
import { getSystemLang } from "../lib/i18n.js";

export function useLocale(storageKey = "math-lang") {
  const savedLang = localStorage.getItem(storageKey);
  const [lang, setLang] = createSignal(savedLang || getSystemLang());

  createEffect(() => {
    document.documentElement.lang = lang() === "en" ? "en" : "zh-CN";
    localStorage.setItem(storageKey, lang());
  });

  const toggleLang = () => setLang(lang() === "zh" ? "en" : "zh");

  return { lang, setLang, toggleLang };
}
