import { createSignal, createEffect, Show, For } from "solid-js";
import { isSupabaseReady, getDailyLeaderboard, submitDailyScore } from "../../shared/supabase.js";
import { t } from "../lib/i18n.js";

export default function LeaderboardPanel(props) {
  const { lang, user, lastSession } = props;
  const [entries, setEntries] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [submitted, setSubmitted] = createSignal(false);

  const loadBoard = async () => {
    if (!isSupabaseReady()) return;
    setLoading(true);
    try {
      const data = await getDailyLeaderboard();
      setEntries(data || []);
    } catch (e) {
      console.warn("Failed to load leaderboard:", e);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    if (user) loadBoard();
  });

  const handleSubmitScore = async () => {
    if (!user || !lastSession || submitted()) return;
    try {
      await submitDailyScore(
        user.id,
        lastSession.correct || 0,
        lastSession.accuracy || 0,
        lastSession.avgTime || 0
      );
      setSubmitted(true);
      loadBoard();
    } catch (e) {
      console.warn("Failed to submit score:", e);
    }
  };

  // Auto-submit when session ends and user is logged in
  createEffect(() => {
    if (lastSession && user && !submitted()) {
      handleSubmitScore();
    }
  });

  if (!isSupabaseReady()) {
    return (
      <div class="section-card">
        <div class="section-title">{t(lang(), "dailyLeaderboard") || "🏆 今日排行榜"}</div>
        <div class="lb-empty">配置 Supabase 后启用排行榜</div>
      </div>
    );
  }

  return (
    <div class="section-card">
      <div class="section-title">{t(lang(), "dailyLeaderboard") || "🏆 今日排行榜"}</div>

      <Show when={!user}>
        <div class="lb-empty">登录后可参与排行榜</div>
      </Show>

      <Show when={user && submitted()}>
        <div style="text-align:center;font-size:0.8rem;color:var(--color-success);margin-bottom:8px;">
          ✓ 成绩已提交
        </div>
      </Show>

      <Show when={loading()}>
        <div class="lb-empty">加载中…</div>
      </Show>

      <Show when={!loading() && entries().length === 0 && user}>
        <div class="lb-empty">今天还没有人提交成绩</div>
      </Show>

      <Show when={entries().length > 0}>
        <div class="leaderboard">
          <For each={entries()}>
            {(entry, idx) => (
              <div class="lb-row" style={{ "animation-delay": `${idx() * 40}ms` }}>
                <span class="lb-rank" classList={{
                  top1: idx() === 0, top2: idx() === 1, top3: idx() === 2
                }}>
                  {idx() + 1}
                </span>
                <span class="lb-user">
                  {entry.profiles?.username || entry.user_id?.slice(0, 8) || "匿名"}
                </span>
                <span class="lb-score">{entry.score} 题</span>
                <span class="lb-accuracy">{(entry.accuracy * 100).toFixed(0)}%</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
