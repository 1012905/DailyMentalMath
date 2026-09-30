import { For } from "solid-js";
import { formatAnswer, formatTime } from "../lib/math.js";
import { t } from "../lib/i18n.js";

export default function HistoryPanel(props) {
  return (
    <div class="section-card" style={{
      display: props.visible ? "block" : "none",
      animation: props.visible ? "cardFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" : "none",
    }}>
      <div class="section-title">{t(props.lang, "historyTitle")}</div>
      <div class="history-list">
        <For each={props.history}>
          {(h, i) => (
            <div class="history-item" style={{ "animation-delay": i() * 0.05 + "s" }}>
              <span class="icon">{h.correct ? "✅" : "❌"}</span>
              <span class="detail">
                {h.question} = <b>{formatAnswer(h.correctAns)}</b>
                {!h.correct ? t(props.lang, "wrongAnswerNote", h.userAns) : ""}
              </span>
              <span class="time">{formatTime(h.elapsed)}s</span>
            </div>
          )}
        </For>
        {props.history.length === 0 && (
          <div class="history-item" style={{ opacity: 0.5, textAlign: "center" }}>{t(props.lang, "historyEmpty")}</div>
        )}
      </div>
    </div>
  );
}
