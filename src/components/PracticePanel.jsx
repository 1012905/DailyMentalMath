import { createEffect, Show } from "solid-js";
import { t } from "../lib/i18n.js";
import Numpad from "./Numpad.jsx";
import { speakQuestion, unlockAudio } from "../lib/feedback.js";

/* 触屏判定：maxTouchPoints 在 CDP 模拟与真机上都可靠，ontouchstart 作为兜底 */
const isTouch = () =>
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 0 ||
    "ontouchstart" in window ||
    window.matchMedia?.("(pointer: coarse)")?.matches === true);

export default function PracticePanel(props) {
  let inputRef;
  let feedbackRef;

  createEffect(() => {
    if (inputRef && !props.inputDisabled) {
      // 桌面用物理键盘输入；触屏以屏幕键盘为主，不弹系统键盘
      if (!isTouch()) inputRef.focus();
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

  /* 已答满设定题数：再点「下一题」不会出新题（状态机在 total 处停住），
     所以这里直接禁用并改文案，避免用户对着无反应的按钮反复点击。
     限时模式的 total 是 9999 占位，不会触发。 */
  const reachedLimit = () => props.total > 0 && props.index >= props.total;

  // Streak fire animation
  const streakClass = () => {
    if (props.streakFireLevel >= 2) return "streak-bar streak-blazing";
    if (props.streakFireLevel >= 1) return "streak-bar streak-hot";
    if (props.streak > 0) return "streak-bar streak-warm";
    return "streak-bar";
  };

  /* 答题进度：限时模式显示剩余时间，其余统一显示「已答 / 总量」 */
  const progressText = () =>
    props.mode === "timed"
      ? `${t(props.lang, "timeLeftLabel")} ${props.timeLeft}s`
      : `${props.index} / ${props.total}`;

  return (
    <section class="section-card practice-card" aria-label={t(props.lang, "practiceTitle")}>
      {/* ── 状态行：进度 + 连击 ── */}
      <div class="practice-status">
        <span class="practice-progress">{progressText()}</span>
        <div class="practice-status-right">
          <Show when={props.question}>
            <button
              class="icon-btn practice-speak"
              type="button"
              aria-label={t(props.lang, "replayBtn")}
              title={t(props.lang, "replayBtn")}
              onClick={() => { unlockAudio(); speakQuestion(props.question, props.lang); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M11 5 6.5 9H3.5v6h3L11 19V5Z" stroke="currentColor" stroke-width="1.8"
                  stroke-linejoin="round" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </Show>
          <div class={streakClass()}>
            <span class="streak-icon" aria-hidden="true">
              {props.streak >= 10 ? "🔥🔥" : props.streak >= 5 ? "🔥" : "💪"}
            </span>
            <span class="streak-count">{t(props.lang, "streakFireLabel", props.streak)}</span>
          </div>
        </div>
      </div>

      {/* ── Timed countdown ring ── */}
      <Show when={props.mode === "timed"}>
        <div class="timed-header">
          <div
            class="countdown-ring"
            role="timer"
            aria-live="off"
            aria-label={`${t(props.lang, "timeLeftLabel")} ${props.timeLeft}s`}
          >
            <svg viewBox="0 0 40 40" class="countdown-svg" aria-hidden="true">
              <circle cx="20" cy="20" r="17" fill="none" stroke="var(--glass-border)" stroke-width="3" />
              <circle cx="20" cy="20" r="17" fill="none"
                stroke={props.timeLeft <= 10 ? "var(--error-color)" : "var(--accent-solid)"}
                stroke-width="3" stroke-dasharray="106.8" stroke-dashoffset={106.8 * (1 - props.timeLeft / 60)}
                stroke-linecap="round" transform="rotate(-90 20 20)" />
            </svg>
            <span class="countdown-text" classList={{ "countdown-danger": props.timeLeft <= 10 }}>
              {props.timeLeft}s
            </span>
          </div>
        </div>
      </Show>

      {/* ── 算式 —— 视觉中心 ── */}
      <div class="question-display question-slide-in" key={props.question?.display || props.index}>
        <span class="question-num">
          {props.question ? t(props.lang, "questionPrefix", props.index + 1) : ""}
        </span>
        <span class="question-text" aria-live="polite">
          {props.question ? `${props.question.display} = ?` : ""}
        </span>
      </div>

      {/* ── 作答区 ── */}
      <div class="answer-area">
        <input
          ref={inputRef}
          type="text"
          inputmode="none"
          class={inputClass()}
          placeholder={t(props.lang, "answerPlaceholder")}
          autocomplete="off"
          autocorrect="off"
          spellcheck={false}
          aria-label={t(props.lang, "answerPlaceholder")}
          value={props.answerValue}
          onInput={(e) => props.onAnswerInput(e.target.value)}
          disabled={props.inputDisabled}
          readOnly={isTouch()}
        />
        <button
          class="glass-btn"
          onClick={props.onSubmit}
          disabled={props.submitDisabled}
        >
          {t(props.lang, "submitBtn")}
        </button>
      </div>

      {/* ── 数字键盘（触屏设备） ── */}
      <Numpad
        value={props.answerValue}
        onInput={props.onAnswerInput}
        disabled={props.inputDisabled}
        lang={props.lang}
      />

      {/* ── 反馈 ── */}
      <div
        ref={feedbackRef}
        class="feedback"
        classList={{ correct: props.feedbackType === "correct", wrong: props.feedbackType === "wrong" }}
        role="status"
        aria-live="polite"
      >
        {props.feedbackText}
      </div>

      {/* ── 错题解析 ── */}
      <Show when={props.explanation}>
        <div class="error-explanation">{props.explanation}</div>
      </Show>

      {/* ── 进度条（限时模式用倒计时环代替） ── */}
      <Show when={props.mode !== "timed"}>
        <div class="progress-wrap">
          <div class="progress-bar-outer" role="progressbar" aria-valuemin="0" aria-valuemax="100"
            aria-valuenow={Math.round(progressPct())}>
            <div class="progress-bar-inner" style={{ width: progressPct() + "%" }} />
          </div>
          <span class="progress-label">{props.index} / {props.total}</span>
        </div>
      </Show>

      {/* ── 操作按钮 ── */}
      <div class="btn-row">
        {/* 答满设定题数时，这个按钮不再是「下一题」（点了也不会出新题），
            直接变成可点的「查看结果」，避免出现「文案承诺动作但按钮被禁用」。 */}
        <Show
          when={reachedLimit()}
          fallback={
            <button class="btn-secondary" onClick={props.onNext} disabled={props.nextDisabled}>
              {t(props.lang, "nextBtn")}
            </button>
          }
        >
          <button class="btn-primary" onClick={props.onEnd}>
            {t(props.lang, "viewResultBtn")}
          </button>
        </Show>
        <button class="btn-secondary" onClick={props.onEnd}>{t(props.lang, "endBtn")}</button>
      </div>
    </section>
  );
}
