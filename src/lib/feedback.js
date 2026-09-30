/**
 * 答题反馈：音效 + 语音播报
 *
 * 设计约束
 *  1. 零资源文件 —— 音效用 Web Audio 实时合成，不引入 mp3/ogg，保持单文件构建。
 *  2. 不阻塞业务 —— 任何一步失败都静默吞掉，绝不让音频问题影响答题。
 *  3. 遵守自动播放策略 —— AudioContext 一律在首次用户手势（点击数字键/按钮）时
 *     创建并 resume，不在模块加载时创建，否则会被浏览器挂起。
 *  4. 默认关闭，由 prefs 控制（见 lib/prefs.js）。
 */
import { isSoundOn, isSpeechOn, currentLang } from "./prefs.js";

let ctx = null;
let master = null;
let unlocked = false;

/* ── 音频上下文：惰性创建 + 手势解锁 ── */
function ensureCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/**
 * 在真实用户手势处理器里调用一次，解锁音频。
 * iOS Safari 要求 resume 必须发生在手势调用栈内。
 */
export function unlockAudio() {
  if (unlocked) return;
  const c = ensureCtx();
  if (!c) return;
  unlocked = true;
}

/* ── 单音 ── */
function tone(freq, startAt, duration, { type = "sine", gain = 0.22 } = {}) {
  const c = ensureCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    // 短促的 attack + 指数衰减，听感干净不刺耳
    env.gain.setValueAtTime(0.0001, startAt);
    env.gain.exponentialRampToValueAtTime(gain, startAt + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(env);
    env.connect(master);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  } catch { /* 忽略 */ }
}

/* ── 音色：答对（上行三音）/ 答错（下行二音）/ 答满（收尾琶音） ── */
export function playCorrect() {
  if (!isSoundOn()) return;
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + 0.01;
  tone(880, t0, 0.10, { type: "sine", gain: 0.20 });
  tone(1174.66, t0 + 0.075, 0.13, { type: "sine", gain: 0.17 });
}

export function playWrong() {
  if (!isSoundOn()) return;
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + 0.01;
  tone(311.13, t0, 0.16, { type: "triangle", gain: 0.18 });
  tone(233.08, t0 + 0.11, 0.22, { type: "triangle", gain: 0.16 });
}

export function playFinish() {
  if (!isSoundOn()) return;
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + 0.01;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    tone(f, t0 + i * 0.09, 0.20, { type: "sine", gain: 0.18 });
  });
}

/* ── 语音播报 ── */
let voicesCache = null;
function pickVoice(lang) {
  try {
    if (!voicesCache) voicesCache = window.speechSynthesis.getVoices() || [];
    const want = lang === "en" ? /^en/i : /^zh/i;
    return voicesCache.find((v) => want.test(v.lang)) || null;
  } catch {
    return null;
  }
}

/**
 * 朗读题目。
 * @param {object} q 题目对象（含 display）
 * @param {string} lang 'zh' | 'en'
 */
export function speakQuestion(q, lang) {
  if (!isSpeechOn() || !q) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const L = lang || currentLang();
    // display 里的 × ÷ ≈ 直接读会很怪，替换成口语说法
    const spoken = String(q.display || "")
      .replace(/×/g, L === "en" ? " times " : " 乘 ")
      .replace(/÷/g, L === "en" ? " divided by " : " 除以 ")
      .replace(/≈/g, L === "en" ? " approximately " : " 约等于 ")
      .replace(/\+/g, L === "en" ? " plus " : " 加 ")
      .replace(/-/g, L === "en" ? " minus " : " 减 ")
      .replace(/\?/g, "")
      .trim();
    if (!spoken) return;

    const u = new SpeechSynthesisUtterance(spoken);
    u.lang = L === "en" ? "en-US" : "zh-CN";
    u.rate = 0.95;
    u.pitch = 1;
    const v = pickVoice(L);
    if (v) u.voice = v;
    window.speechSynthesis.cancel(); // 避免上一题还没读完就叠上来
    window.speechSynthesis.speak(u);
  } catch { /* 忽略 */ }
}

/** 立即停止播报（离开答题页/结束时调用） */
export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch { /* 忽略 */ }
}

/* Chromium 的语音列表是异步填充的，首次调用 getVoices() 常为空 */
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    window.speechSynthesis.onvoiceschanged = () => { voicesCache = null; };
  } catch { /* 忽略 */ }
}
