import { Show, For } from "solid-js";
import { loadStatsHistory } from "../hooks/usePractice.js";
import { t } from "../lib/i18n.js";

export default function LeaderboardPanel(props) {
  const { lang } = props;
  const stats = () => loadStatsHistory();

  const bestSession = () => {
    const s = stats();
    if (s.length === 0) return null;
    return s.reduce((best, cur) => (cur.accuracy > best.accuracy ? cur : best), s[0]);
  };

  const totalAnswered = () => stats().reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCorrect = () => stats().reduce((sum, s) => sum + (s.correct || 0), 0);
  const overallAcc = () => totalAnswered() > 0 ? (totalCorrect() / totalAnswered() * 100).toFixed(0) : 0;

  if (stats().length === 0) {
    return (
      <div class="section-card">
        <div class="section-title">{t(lang, "leaderboardTitle")}</div>
        <div class="lb-empty">{t(lang, "leaderboardEmpty")}</div>
      </div>
    );
  }

  return (
    <div class="section-card">
      <div class="section-title">{t(lang, "leaderboardTitle")}</div>
      <div class="leaderboard">
        <div class="lb-row">
          <span class="lb-rank top1">📊</span>
          <span class="lb-user">{t(lang, "leaderboardOverallAcc")}</span>
          <span class="lb-score">{overallAcc()}%</span>
          <span class="lb-accuracy">{totalCorrect()}/{totalAnswered()} {t(lang, "leaderboardQuestionUnit")}</span>
        </div>
        <div class="lb-row">
          <span class="lb-rank top2">🏅</span>
          <span class="lb-user">{t(lang, "leaderboardBestAcc")}</span>
          <span class="lb-score">{bestSession() ? (bestSession().accuracy * 100).toFixed(0) : 0}%</span>
          <span class="lb-accuracy">{bestSession() ? bestSession().correct : 0}/{bestSession() ? bestSession().total : 0}</span>
        </div>
        <div class="lb-row">
          <span class="lb-rank top3">📝</span>
          <span class="lb-user">{t(lang, "leaderboardTotalSessions")}</span>
          <span class="lb-score">{stats().length}</span>
          <span class="lb-accuracy">{t(lang, "leaderboardCountUnit")}</span>
        </div>
      </div>
    </div>
  );
}
