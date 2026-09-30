/**
 * 反馈偏好读写 —— 独立成模块，避免 usePractice 与设置面板互相依赖。
 *
 * 默认**关闭**：音效与语音都由用户显式开启。
 * 理由：① 浏览器要求先有用户手势才能播音频，默认开启会让首次进答题页静默失败；
 *       ② 语音播报在公共场合很打扰，不该默认开。
 */

const SOUND_KEY = "dmm-sound";
const SPEECH_KEY = "dmm-speech";

function read(key) {
  try { return localStorage.getItem(key) === "1"; } catch { return false; }
}
function write(key, on) {
  try { localStorage.setItem(key, on ? "1" : "0"); } catch {}
}

export const isSoundOn = () => read(SOUND_KEY);
export const isSpeechOn = () => read(SPEECH_KEY);
export const setSoundOn = (on) => { write(SOUND_KEY, on); return !!on; };
export const setSpeechOn = (on) => { write(SPEECH_KEY, on); return !!on; };

/** 当前界面语言（与 usePractice 的 getLang 保持一致，避免循环依赖） */
export const currentLang = () => {
  try { return localStorage.getItem("math-lang") || "zh"; } catch { return "zh"; }
};
