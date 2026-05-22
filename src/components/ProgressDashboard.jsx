import { Show, For } from "solid-js";
import { loadStatsHistory } from "../hooks/usePractice.js";
import { t } from "../lib/i18n.js";

export default function ProgressDashboard(props) {
  const { lang } = props;

  const stats = () => loadStatsHistory();

  const totalSessions = () => stats().length;

  const totalQuestions = () => stats().reduce((sum, s) => sum + (s.total || 0), 0);

  const overallAccuracy = () => {
    const s = stats();
    if (s.length === 0) return 0;
    const correct = s.reduce((sum, stat) => sum + (stat.correct || 0), 0);
    const total = s.reduce((sum, stat) => sum + (stat.total || 0), 0);
    return total > 0 ? correct / total : 0;
  };

  const avgTime = () => {
    const s = stats();
    if (s.length === 0) return 0;
    const sum = s.reduce((acc, stat) => acc + (stat.avgTime || 0) * (stat.total || 0), 0);
    const total = s.reduce((acc, stat) => acc + (stat.total || 0), 0);
    return total > 0 ? sum / total : 0;
  };

  const bestStreak = () => {
    return Math.max(...stats().map((s) => s.maxStreak || 0), 0);
  };

  const recentAccuracy = () => {
    const recent = stats().slice(-5);
    if (recent.length === 0) return null;
    const c = recent.reduce((sum, s) => sum + (s.correct || 0), 0);
    const t = recent.reduce((sum, s) => sum + (s.total || 0), 0);
    return t > 0 ? c / t : 0;
  };

  // ── Accuracy trend (last 10 sessions) ──
  const accuracyTrend = () => {
    return stats().slice(-10).map((s) => s.accuracy || 0);
  };

  const maxTrend = () => Math.max(...accuracyTrend(), 0.01);

  // ── Calculate stats by operator (infer from session data) ──
  // Since we don't have per-operator breakdown, estimate from mode
  const modeBreakdown = () => {
    const breakdown = {};
    stats().forEach((s) => {
      const mode = s.mode || "free";
      breakdown[mode] = (breakdown[mode] || 0) + (s.total || 0);
    });
    return Object.entries(breakdown)
      .map(([mode, count]) => ({ mode, count }))
      .sort((a, b) => b.count - a.count);
  };

  return (
    <div class="progress-dashboard">
      {/* Summary Stats */}
      <div class="progress-summary">
        <div class="progress-stat">
          <div class="progress-stat-value">{totalSessions()}</div>
          <div class="progress-stat-label">{t(lang(), "totalSessions") || "练习次数"}</div>
        </div>
        <div class="progress-stat">
          <div class="progress-stat-value">{totalQuestions()}</div>
          <div class="progress-stat-label">{t(lang(), "totalQ")}</div>
        </div>
        <div class="progress-stat">
          <div class="progress-stat-value">{(overallAccuracy() * 100).toFixed(0)}%</div>
          <div class="progress-stat-label">{t(lang(), "accuracy")}</div>
        </div>
        <div class="progress-stat">
          <div class="progress-stat-value">{avgTime().toFixed(1)}s</div>
          <div class="progress-stat-label">{t(lang(), "avgTime")}</div>
        </div>
        <div class="progress-stat">
          <div class="progress-stat-value">{bestStreak()}</div>
          <div class="progress-stat-label">{t(lang(), "streakLabel")}</div>
        </div>
        <Show when={recentAccuracy() !== null}>
          <div class="progress-stat">
            <div class="progress-stat-value">{(recentAccuracy() * 100).toFixed(0)}%</div>
            <div class="progress-stat-label">{t(lang(), "recentAccuracy") || "近5次正确率"}</div>
          </div>
        </Show>
      </div>

      {/* Accuracy Trend Chart */}
      <Show when={accuracyTrend().length >= 2}>
        <div class="section-card" style="padding:var(--space-12);margin-bottom:0;">
          <div class="section-title" style="margin-bottom:var(--space-8);font-size:var(--text-small);">
            {t(lang(), "accuracyTrend") || "正确率趋势"}
          </div>
          <div class="chart-bars" style="height:60px;">
            <For each={accuracyTrend()}>
              {(val) => (
                <div class="chart-bar-wrapper" title={`${(val * 100).toFixed(0)}%`}>
                  <div class="chart-bar" style={{
                    height: `${(val / maxTrend()) * 100}%`,
                    background: val >= 0.8 ? "var(--color-success)" : val >= 0.5 ? "#f59e0b" : "var(--color-error)",
                  }} />
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Mode Breakdown */}
      <Show when={modeBreakdown().length > 0}>
        <div class="section-card" style="padding:var(--space-12);margin-bottom:0;">
          <div class="section-title" style="margin-bottom:var(--space-8);font-size:var(--text-small);">
            {t(lang(), "modeBreakdown") || "模式分布"}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <For each={modeBreakdown()}>
              {(m) => (
                <span class="weak-op-chip high">
                  {m.mode === "free" ? "🏃" : m.mode === "timed" ? "⏱️" : m.mode === "daily" ? "📅" : "🔁"}
                  {" "}{m.count}题
                </span>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
