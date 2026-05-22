import { createEffect } from "solid-js";
import { formatAnswer, formatTime } from "../lib/math.js";
import { t } from "../lib/i18n.js";
import Numpad from "./Numpad.jsx";

export default function PracticePanel(props) {
  let inputRef;
  let feedbackRef;

  createEffect(() => {
    if (inputRef && !props.inputDisabled) {
      // Only focus on desktop — mobile uses numpad
      if (!("ontouchstart" in window)) inputRef.focus();
    }
  });

  createEffect(() => {
    if (props.feedbackType && feedbackRef) {
      feedbackRef.classList.remove("animate-feedback-pop");
      void feedbackRef.offsetWidth;
      feedbackRef.classList.add("animate-feedback-pop");
    }
  });

  const inputClass = () => {
    let cls = "answer-input";
    if (props.feedbackType === "correct") cls += " correct-flash animate-pulse-glow";
    else if (props.feedbackType === "wrong") cls += " wrong-flash animate-shake";
    return cls;
  };

  const progressPct = () => props.total > 0 ? (props.index / props.total) * 100 : 0;

  // Streak fire animation
  const streakClass = () => {
    if (props.streakFireLevel >= 2) return "streak-bar streak-blazing";
    if (props.streakFireLevel >= 1) return "streak-bar streak-hot";
    if (props.streak > 0) return "streak-bar streak-warm";
    return "streak-bar";
  };

  return (
    <div class="section-card practice-card">
      <div class="section-title">{t(props.lang, "practiceTitle")}</div>

      {/* ── Timed countdown ── */}
      {props.mode === "timed" && (
        <div class="timed-header">
          <div class="countdown-ring">
            <svg viewBox="0 0 40 40" class="countdown-svg">
              <circle cx="20" cy="20" r="17" fill="none" stroke="var(--glass-border)" stroke-width="3" />
              <circle cx="20" cy="20" r="17" fill="none" stroke={props.timeLeft <= 10 ? "var(--error-color)" : "var(--accent-solid)"}
                stroke-width="3" stroke-dasharray="106.8" stroke-dashoffset={106.8 * (1 - props.timeLeft / 60)}
                stroke-linecap="round" transform="rotate(-90 20 20)" />
            </svg>
            <span class="countdown-text" classList={{ "countdown-danger": props.timeLeft <= 10 }}>
              {props.timeLeft}s
            </span>
          </div>
        </div>
      )}

      {/* ── Streak display ── */}
      <div class={streakClass()}>
        <span class="streak-icon">
          {props.streak >= 10 ? "🔥🔥" : props.streak >= 5 ? "🔥" : "🔥"}
        </span>
        <span class="streak-count">{t(props.lang, "streakFireLabel", props.streak)}</span>
      </div>

      {/* ── Question display with animation ── */}
      <div class="question-display question-slide-in" key={props.question?.display || props.index}>
        <span class="question-num">{props.question ? t(props.lang, "questionPrefix", props.index + 1) : ""}</span>
        <span class="question-text">{props.question ? `${props.question.display} = ?` : ""}</span>
      </div>

      {/* ── Answer area ── */}
      <div class="answer-area">
        <input
          ref={inputRef}
          type="text"
          inputmode="none"
          class={inputClass()}
          placeholder={t(props.lang, "answerPlaceholder")}
          autocomplete="off"
          value={props.answerValue}
          onInput={(e) => props.onAnswerInput(e.target.value)}
          disabled={props.inputDisabled}
          readOnly={"ontouchstart" in window}
        />
        <button class="glass-btn" onClick={props.onSubmit} disabled={props.submitDisabled}>{t(props.lang, "submitBtn")}</button>
      </div>

      {/* ── Numpad (mobile only) ── */}
      <Numpad
        value={props.answerValue}
        onInput={props.onAnswerInput}
        disabled={props.inputDisabled}
      />

      {/* ── Feedback ── */}
      <div ref={feedbackRef} class="feedback" classList={{ correct: props.feedbackType === "correct", wrong: props.feedbackType === "wrong" }}>
        {props.feedbackText}
      </div>

      {/* ── Error explanation ── */}
      {props.explanation && (
        <div class="error-explanation">
          {props.explanation}
        </div>
      )}

      {/* ── Progress bar ── */}
      {props.mode !== "timed" && (
        <div class="progress-wrap">
          <div class="progress-bar-outer"><div class="progress-bar-inner" style={{ width: progressPct() + "%" }} /></div>
          <span class="progress-label">{props.index} / {props.total}</span>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div class="btn-row">
        <button class="btn-secondary" onClick={props.onNext} disabled={props.nextDisabled}>
          {props.index >= props.total && props.mode !== "free" ? t(props.lang, "viewResultBtn") : t(props.lang, "nextBtn")}
        </button>
        <button class="btn-secondary" onClick={props.onEnd}>{t(props.lang, "endBtn")}</button>
      </div>
    </div>
  );
}
