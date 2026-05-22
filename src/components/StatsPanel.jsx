import { createEffect, createSignal } from "solid-js";
import { formatTime } from "../lib/math.js";
import { t } from "../lib/i18n.js";

function AnimatedNumber(props) {
  const [display, setDisplay] = createSignal(0);
  createEffect(() => {
    const target = props.value;
    if (!props.animate) { setDisplay(target); return; }
    const start = performance.now();
    const duration = 500;
    let raf;
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(eased * target);
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });
  return <span>{props.format ? props.format(display()) : Math.round(display())}</span>;
}

export default function StatsPanel(props) {
  const accuracy = () => props.answered > 0 ? (props.correct / props.answered) * 100 : 0;
  const avgTime = () => props.answered > 0 ? props.totalTime / props.answered : 0;
  const wrong = () => props.answered - props.correct;

  return (
    <div class="section-card" style={{
      animation: "cardFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
    }}>
      <div class="section-title">{t(props.lang, "sessionSummary")}</div>

      {/* Big accuracy circle */}
      <div class="result-acc-ring">
        <svg viewBox="0 0 100 100" class="result-acc-svg">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--glass-border)" stroke-width="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent-solid)" stroke-width="8"
            stroke-dasharray="263.9" stroke-dashoffset={263.9 * (1 - accuracy() / 100)}
            stroke-linecap="round" transform="rotate(-90 50 50)" />
        </svg>
        <div class="result-acc-text">
          <AnimatedNumber value={accuracy()} animate={props.visible !== false} format={(v) => Math.round(v) + "%"} />
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value"><AnimatedNumber value={props.answered} animate={props.visible !== false} /></div>
          <div class="stat-label">{t(props.lang, "totalQ")}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value"><AnimatedNumber value={props.correct} animate={props.visible !== false} /></div>
          <div class="stat-label">{t(props.lang, "correctQ")}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: var(--error-color)">{wrong()}</div>
          <div class="stat-label">{t(props.lang, "wrongQ")}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="font-size:1rem">{props.answered > 0 ? formatTime(avgTime()) + "s" : "0s"}</div>
          <div class="stat-label">{t(props.lang, "avgTime")}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="font-size:1rem">{props.answered > 0 ? formatTime(props.minTime) + "s" : "0s"}</div>
          <div class="stat-label">{t(props.lang, "bestTime")}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="font-size:1rem">{props.answered > 0 ? formatTime(props.maxTime) + "s" : "0s"}</div>
          <div class="stat-label">{t(props.lang, "worstTime")}</div>
        </div>
      </div>

      {props.mode === "timed" && (
        <div class="timed-result-info">
          {t(props.lang, "timeLeftLabel")}: {props.timeLeft?.toFixed?.(0) ?? props.timeLeft ?? 0}s
        </div>
      )}
    </div>
  );
}
