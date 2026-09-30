import zh from "./locales/zh.js";
import en from "./locales/en.js";

export function t(lang, key, ...args) {
  const dict = lang === "en" ? en : zh;
  const text = dict[key];
  if (!text) return key;
  if (args.length === 0) return text;
  return text.replace(/\{(\d+)\}/g, (_, i) => {
    const idx = parseInt(i, 10);
    return idx < args.length ? String(args[idx]) : `{${i}}`;
  });
}

export function getSystemLang() {
  if (typeof navigator === "undefined") return "zh";
  return navigator.language?.startsWith("zh") ? "zh" : "en";
}
