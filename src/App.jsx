import { createSignal, createEffect, Show, For, lazy, Suspense } from "solid-js";
import Header from "./components/Header.jsx";
const SettingsPanel = lazy(() => import("./components/SettingsPanel.jsx"));
const PracticePanel = lazy(() => import("./components/PracticePanel.jsx"));
const StatsPanel = lazy(() => import("./components/StatsPanel.jsx"));
const HistoryPanel = lazy(() => import("./components/HistoryPanel.jsx"));
import SkeletonPage from "./components/Skeleton.jsx";
import usePractice, { loadErrorBank, loadStatsHistory, loadAchievements, loadStreakDays } from "./hooks/usePractice.js";
import { t } from "./lib/i18n.js";
import { useTheme } from "./hooks/useTheme.js";
import { useLocale } from "./hooks/useLocale.js";
import ProgressDashboard from "./components/ProgressDashboard.jsx";
import LeaderboardPanel from "./components/LeaderboardPanel.jsx";

const ACHIEVEMENT_DEFS = [
  { id: "streak-7", emoji: "🔥", labelKey: "achvStreak7", descKey: "achvStreak7Desc" },
  { id: "speed-star", emoji: "⚡", labelKey: "achvSpeedStar", descKey: "achvSpeedStarDesc" },
  { id: "night-owl", emoji: "🌙", labelKey: "achvNightOwl", descKey: "achvNightOwlDesc" },
  { id: "perfectionist", emoji: "👑", labelKey: "achvPerfectionist", descKey: "achvPerfectionistDesc" },
  { id: "steady", emoji: "🪨", labelKey: "achvSteady", descKey: "achvSteadyDesc" },
  { id: "collector", emoji: "🏅", labelKey: "achvCollector", descKey: "achvCollectorDesc" },
  { id: "lightning", emoji: "⚡", labelKey: "achvLightning", descKey: "achvLightningDesc" },
  { id: "perfect-daily", emoji: "✨", labelKey: "achvPerfectDaily", descKey: "achvPerfectDailyDesc" },
];

export default function App() {
  const { currentTheme, setCurrentTheme, isDark, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLocale();

  const [page, setPage] = createSignal("settings"); // settings | practice | results
  const [questionType, setQuestionType] = createSignal("two-digit-addsub");
  const [questionCount, setQuestionCount] = createSignal(10);
  const [selectedMode, setSelectedMode] = createSignal("free");
  const [newAchvToast, setNewAchvToast] = createSignal("");

  const practice = usePractice();

  // track new achievements
  createEffect(() => {
    if (practice.isFinished()) {
      const unlocked = loadAchievements();
      const prevUnlocked = JSON.parse(sessionStorage.getItem("dmm-prev-achv") || "[]");
      const newly = unlocked.filter((a) => !prevUnlocked.find((p) => p.id === a.id));
      if (newly.length > 0) {
        const achv = ACHIEVEMENT_DEFS.find((a) => a.id === newly[0].id);
        if (achv) {
          setNewAchvToast(`${achv.emoji} ${t(lang(), achv.labelKey)}`);
          setTimeout(() => setNewAchvToast(""), 3000);
        }
      }
      sessionStorage.setItem("dmm-prev-achv", JSON.stringify(unlocked));
    }
  });

  const handleStart = () => {
    const type = questionType();
    localStorage.setItem("dmm-type", type);
    const mode = selectedMode();
    const opts = { questionType: type, count: questionCount() };
    practice.startPractice(mode, opts);
    setPage("practice");
  };

  const handleEnd = () => {
    practice.endSession();
    setPage("results");
  };

  const handleRetry = () => {
    handleStart();
  };

  const handleRetryErrors = () => {
    const type = questionType();
    const opts = { questionType: type };
    practice.startPractice("error-review", opts);
    setPage("practice");
  };

  // ── daily challenge share card ──
  const [showShareCard, setShowShareCard] = createSignal(false);

  const stats = () => {
    const s = loadStatsHistory();
    return s.length > 0 ? s[s.length - 1] : null;
  };

  const mockGlobalAvg = () => {
    // Mock: 72-88% based on time of day
    const base = 72 + (new Date().getHours() % 10);
    return Math.min(base + Math.floor(Math.random() * 10), 95);
  };

  const mockPercentile = () => {
    const acc = practice.answered() > 0 ? (practice.correct() / practice.answered()) : 0;
    const base = acc * 100;
    return Math.min(base + Math.floor(Math.random() * 15), 99);
  };

  return (
    <div class="glass-panel" onKeyDown={(e) => {
      if (e.key === "Enter" && page() === "practice" && !practice.inputDisabled()) practice.submitAnswer();
      else if (e.key === "Enter" && page() === "practice" && !practice.nextDisabled()) practice.nextQuestion();
    }}>
      <Header
        isDark={isDark()}
        onToggleTheme={toggleTheme}
        lang={lang()}
        onToggleLang={toggleLang}
      />

      {/* ── Achievement Toast ── */}
      <Show when={newAchvToast()}>
        <div class="achv-toast">
          <span class="achv-toast-text">{newAchvToast()}</span>
        </div>
      </Show>

      {/* ── Achievement Panel (enhanced with progress) ── */}
      <div class="section-card achv-panel">
        <div class="section-title">{t(lang(), "achvTitle")}</div>
        <div class="achv-grid">
          <For each={ACHIEVEMENT_DEFS}>
            {(achv) => {
              const unlocked = loadAchievements().find((a) => a.id === achv.id);
              // Calculate progress for each achievement
              const stats = loadStatsHistory();
              const lastStat = stats[stats.length - 1];
              const totalSessions = stats.length;
              let progress = 0, maxProgress = 1;
              if (achv.id === "streak-7") {
                const streakDays = loadStreakDays();
                progress = Math.min(streakDays.length || 0, 7);
                maxProgress = 7;
              } else if (achv.id === "speed-star") {
                const timedSessions = stats.filter(s => s.mode === "timed");
                const best = Math.max(...timedSessions.map(s => s.correct || 0), 0);
                progress = Math.min(best, 30);
                maxProgress = 30;
              } else if (achv.id === "perfectionist") {
                const perfectSessions = stats.filter(s => s.accuracy === 1 && s.total >= 10).length;
                progress = Math.min(perfectSessions, 1);
                maxProgress = 1;
              } else if (achv.id === "steady") {
                const bestStreak = Math.max(...stats.map(s => s.maxStreak || 0), 0);
                progress = Math.min(bestStreak, 20);
                maxProgress = 20;
              } else if (achv.id === "night-owl") {
                const nightSessions = stats.filter(s => {
                  const h = new Date(s.date).getHours();
                  return h >= 23 || h < 5;
                }).length;
                progress = Math.min(nightSessions, 1);
                maxProgress = 1;
              } else if (achv.id === "lightning") {
                const timedSessions = stats.filter(s => s.mode === "timed");
                const best = timedSessions.filter(s => s.avgTime < 3).length;
                progress = Math.min(best, 1);
                maxProgress = 1;
              } else if (achv.id === "perfect-daily") {
                const dailySessions = stats.filter(s => s.mode === "daily" && s.accuracy === 1);
                progress = Math.min(dailySessions.length, 1);
                maxProgress = 1;
              } else if (achv.id === "collector") {
                const allOtherIds = ["streak-7","speed-star","night-owl","perfectionist","steady","lightning","perfect-daily"];
                const allUnlocked = allOtherIds.every(id => loadAchievements().find(a => a.id === id));
                progress = allUnlocked ? 1 : 0;
                maxProgress = 1;
              }
              const pct = Math.min((progress / maxProgress) * 100, 100);
              return (
                <div class="achv-card" classList={{ unlocked: !!unlocked }}>
                  <span class="achv-emoji">{unlocked ? achv.emoji : "🔒"}</span>
                  <span class="achv-name">{t(lang(), achv.labelKey)}</span>
                  <span class="achv-desc">{t(lang(), achv.descKey)}</span>
                  <Show when={!unlocked && maxProgress > 1}>
                    <div class="achv-progress-bar">
                      <div class="achv-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span class="achv-progress-text">{progress}/{maxProgress}</span>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </div>

      {/* ── Progress Dashboard (on settings page, before settings) ── */}
      <Show when={page() === "settings" && loadStatsHistory().length > 0}>
        <div class="section-card">
          <div class="section-title">{t(lang(), "statsTitle")}</div>
          <ProgressDashboard lang={lang()} />
        </div>
      </Show>

      {/* ── Settings Page ── */}
      <Show when={page() === "settings"}>
        <Suspense fallback={<SkeletonPage />}>
        <SettingsPanel
          questionType={questionType()}
          onTypeChange={setQuestionType}
          count={questionCount()}
          onCountChange={setQuestionCount}
          currentTheme={currentTheme()}
          onThemeChange={setCurrentTheme}
          selectedMode={selectedMode()}
          onModeChange={setSelectedMode}
          lang={lang()}
        />
        <button class="btn-primary" onClick={handleStart}>
          🚀 {t(lang(), "startBtn")}
        </button>
        </Suspense>
      </Show>

      {/* ── Practice Page ── */}
      <Show when={page() === "practice"}>
        <Suspense fallback={<SkeletonPage />}>
        <PracticePanel
          question={practice.question()}
          index={practice.index()}
          total={practice.total()}
          streak={practice.streak()}
          streakFireLevel={practice.streakFireLevel()}
          feedbackText={practice.feedbackText()}
          feedbackType={practice.feedbackType()}
          inputDisabled={practice.inputDisabled()}
          submitDisabled={practice.submitDisabled()}
          nextDisabled={practice.nextDisabled()}
          answerValue={practice.answerValue()}
          onAnswerInput={practice.setAnswerValue}
          onSubmit={practice.submitAnswer}
          onNext={practice.nextQuestion}
          onEnd={handleEnd}
          mode={practice.mode()}
          timeLeft={practice.timeLeft()}
          explanation={practice.explanation()}
          lang={lang()}
        />
        </Suspense>
      </Show>

      {/* ── Results Page ── */}
      <Show when={page() === "results"}>
        <Suspense fallback={<SkeletonPage />}>
        <StatsPanel
          answered={practice.answered()}
          correct={practice.correct()}
          totalTime={practice.totalTime()}
          minTime={practice.minTime()}
          maxTime={practice.maxTime()}
          mode={practice.mode()}
          timeLeft={practice.timeLeft()}
          lang={lang()}
        />

        {/* Charts */}
        <div class="section-card">
          <div class="section-title">{t(lang(), "chartAccuracy")}</div>
          <ChartBar
            data={loadStatsHistory().slice(-10).map((s) => s.accuracy * 100)}
            label={t(lang(), "chartLastN", Math.min(loadStatsHistory().length, 10))}
            unit="%"
            color="var(--accent-solid)"
          />
        </div>

        <div class="section-card">
          <div class="section-title">{t(lang(), "chartTime")}</div>
          <ChartBar
            data={loadStatsHistory().slice(-10).map((s) => s.avgTime)}
            label={t(lang(), "chartLastN", Math.min(loadStatsHistory().length, 10))}
            unit={t(lang(), "timeUnit")}
            color="var(--accent-solid)"
          />
        </div>

        <HistoryPanel
          visible={true}
          history={practice.history()}
          lang={lang()}
        />

        {/* 本地统计面板 */}
        <LeaderboardPanel lang={lang()} />

        {/* Daily Challenge extras */}
        <Show when={practice.mode() === "daily"}>
          <div class="section-card daily-extras">
            <div class="section-title">{t(lang(), "dailyTitle")}</div>
            <div class="daily-stats-row">
              <div class="daily-stat">
                <span class="daily-stat-label">{t(lang(), "dailyGlobalAvg")}</span>
                <span class="daily-stat-value">{mockGlobalAvg()}%</span>
              </div>
              <div class="daily-stat">
                <span class="daily-stat-label">{t(lang(), "dailyYourRank")}</span>
                <span class="daily-stat-value">Top {mockPercentile()}%</span>
              </div>
            </div>
            <button class="btn-secondary" onClick={() => setShowShareCard(!showShareCard())}>
              {t(lang(), "dailyShareCard")}
            </button>
            <Show when={showShareCard()}>
              <div class="share-card" id="shareCard">
                <div class="share-card-header">🧮 {t(lang(), "dailyTitle")}</div>
                <div class="share-card-stats">
                  <div class="share-stat">
                    <span class="share-stat-label">{t(lang(), "accuracy")}</span>
                    <span class="share-stat-value">{practice.answered() > 0 ? Math.round((practice.correct() / practice.answered()) * 100) : 0}%</span>
                  </div>
                  <div class="share-stat">
                    <span class="share-stat-label">{t(lang(), "correctQ")}</span>
                    <span class="share-stat-value">{practice.correct()}/{practice.answered()}</span>
                  </div>
                  <div class="share-stat">
                    <span class="share-stat-label">{t(lang(), "dailyStars")}</span>
                    <span class="share-stat-value">{'⭐'.repeat(Math.min(Math.ceil((practice.answered() > 0 ? practice.correct() / practice.answered() : 0) * 5), 5))}</span>
                  </div>
                </div>
                <div class="share-card-date">{new Date().toLocaleDateString()}</div>
              </div>
            </Show>
          </div>
        </Show>

        <div class="btn-row" style="margin-top: 14px;">
          <button class="btn-primary" onClick={handleRetry}>🔄 {t(lang(), "retryBtn")}</button>
          <Show when={loadErrorBank().length > 0}>
            <button class="btn-secondary" onClick={handleRetryErrors}>
              🔁 {t(lang(), "retryErrorsBtn")}
            </button>
          </Show>
          <button class="btn-secondary" onClick={() => setPage("settings")}>
            ⚙️ {t(lang(), "settingsTitle")}
          </button>
        </div>
        </Suspense>
      </Show>

      {/* ── Confetti Overlay ── */}
      <Show when={practice.showConfetti()}>
        <ConfettiOverlay />
      </Show>

      {/* ── Floating Unlock Badge ── */}
      <Show when={newAchvToast()}>
        <div class="floating-badge">
          {newAchvToast()}
        </div>
      </Show>
    </div>
  );
}

/* ── Pure CSS Bar Chart ── */
function ChartBar(props) {
  const max = () => Math.max(...props.data, 1);
  return (
    <div class="chart-container">
      <div class="chart-bars">
        <For each={props.data}>
          {(val) => (
            <div class="chart-bar-wrapper" title={`${val.toFixed(1)}${props.unit}`}>
              <div class="chart-bar" style={{ height: `${(val / max()) * 100}%`, background: props.color }} />
            </div>
          )}
        </For>
      </div>
      <div class="chart-label">{props.label}</div>
    </div>
  );
}

/* ── Confetti ── */
function ConfettiOverlay() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6b9d"][Math.floor(Math.random() * 5)],
    size: 6 + Math.random() * 8,
  }));
  return (
    <div class="confetti-overlay">
      <For each={particles}>
        {(p) => (
          <div
            class="confetti-piece"
            style={{
              left: `${p.left}%`,
              "animation-delay": `${p.delay}s`,
              background: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
          />
        )}
      </For>
    </div>
  );
}
