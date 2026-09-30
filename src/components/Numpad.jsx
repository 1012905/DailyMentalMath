import { For } from "solid-js";
import { t } from "../lib/i18n.js";
import { unlockAudio } from "../lib/feedback.js";

export default function Numpad(props) {
  const isTouchDevice = () =>
    typeof window !== "undefined" &&
    (navigator.maxTouchPoints > 0 ||
      "ontouchstart" in window ||
      window.matchMedia?.("(pointer: coarse)")?.matches === true);

  const handleInput = (val) => {
    if (props.disabled) return;
    // 在真实用户手势里解锁音频（浏览器自动播放策略要求）
    unlockAudio();
    // 触感反馈（仅支持的设备生效，失败静默）
    try { navigator.vibrate?.(8); } catch {}
    if (val === "del") {
      props.onInput(props.value.slice(0, -1));
    } else if (val === ".") {
      if (!props.value.includes(".")) {
        props.onInput(props.value + ".");
      }
    } else {
      props.onInput(props.value + val);
    }
  };

  const buttons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "del"],
  ];

  // 桌面端以物理键盘为主输入；移动端始终显示屏幕键盘。
  // `show` 允许父组件在任意设备上显式开启。
  if (!isTouchDevice() && !props.show) return null;

  return (
    <div class="numpad" role="group" aria-label={t(props.lang, "ariaNumpad")}>
      <For each={buttons}>{(row) => (
        <div class="numpad-row">
          <For each={row}>{(btn) => (
            <button
              class="numpad-btn"
              classList={{ "numpad-btn-del": btn === "del", "numpad-btn-dot": btn === "." }}
              onClick={() => handleInput(btn)}
              disabled={props.disabled}
              type="button"
              aria-label={btn === "del" ? t(props.lang, "ariaDelete") : btn}
            >
              {btn === "del" ? "⌫" : btn}
            </button>
          )}</For>
        </div>
      )}</For>
    </div>
  );
}
