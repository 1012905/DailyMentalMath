import zh from "./locales/zh.js";

let en = null;
const enLoader = () => import("./locales/en.js").then((m) => { en = m.default; });

/* Preload en on idle to minimize switch latency */
const ric = typeof window !== "undefined" && (window.requestIdleCallback || ((fn) => setTimeout(fn, 2000)));
if (ric) ric(() => { if (!en) enLoader(); });

export function t(lang, key, ...args) {
  const dict = (lang === "en" && en) ? en : zh;
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
