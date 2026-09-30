import { createSignal, createEffect, onMount, Show, For, lazy, Suspense } from "solid-js";
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

const MODES = [
  { id: "free", emoji: "🏃", labelKey: "modeFree", descKey: "modeDescFree" },
  { id: "timed", emoji: "⏱️", labelKey: "modeTimed", descKey: "modeDescTimed" },
  { id: "daily", emoji: "📅", labelKey: "modeDaily", descKey: "modeDescDaily" },
  { id: "error-review", emoji: "🔁", labelKey: "modeError", descKey: "modeDescError" },
];

const ACHV_COLLAPSE_KEY = "dmm-achv-collapsed";

export default function App() {
  const { currentTheme, setCurrentTheme, isDark, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLocale();

  const [page, setPage] = createSignal("settings"); // settings | practice | results
  const [questionType, setQuestionType] = createSignal("two-digit-addsub");
  const [questionCount, setQuestionCount] = createSignal(10);
  const [selectedMode, setSelectedMode] = createSignal("free");
  const [newAchvToast, setNewAchvToast] = createSignal("");
  const [achvOpen, setAchvOpen] = createSignal(
    (() => { try { return localStorage.getItem(ACHV_COLLAPSE_KEY) !== "1"; } catch { return true; } })()
  );

  const practice = usePractice();

  // 支持 manifest 快捷方式 / 分享链接带参进入：?mode=daily 直接开始练习。
  // 只消费白名单内的值，非法值忽略；读完即从地址栏移除，避免刷新后重复触发。
  onMount(() => {
    try {
      const wanted = new URLSearchParams(window.location.search).get("mode");
      const valid = ["free", "timed", "daily", "error-review"];
      if (wanted && valid.includes(wanted)) {
        setSelectedMode(wanted);
        const type = localStorage.getItem("dmm-type") || "two-digit-addsub";
        if (wanted !== "error-review" || loadErrorBank().length > 0) {
          practice.startPractice(wanted, { questionType: type, count: questionCount() });
          setPage("practice");
        }
      }
      if (wanted) {
        const url = new URL(window.location.href);
        url.searchParams.delete("mode");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    } catch { /* 参数解析失败不影响正常启动 */ }
  });

  const toggleAchv = () => {
    const next = !achvOpen();
    setAchvOpen(next);
    try { localStorage.setItem(ACHV_COLLAPSE_KEY, next ? "0" : "1"); } catch {}
  };

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
    // 错题本为空时进入「错题重练」会得到空状态，留在首页并提示
    if (mode === "error-review" && errorBankCount() === 0) return;
    const opts = { questionType: type, count: questionCount() };
    practice.startPractice(mode, opts);
    setPage("practice");
  };

  const handleStartMode = (mode) => {
    setSelectedMode(mode);
    // 错题本为空时进入「错题重练」会得到空状态，留在首页并提示
    if (mode === "error-review" && errorBankCount() === 0) return;
    const type = questionType();
    localStorage.setItem("dmm-type", type);
    practice.startPractice(mode, { questionType: type, count: questionCount() });
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

  /* ── 首页统计（只读 localStorage，不改变逻辑） ── */
  const stats = () => loadStatsHistory();
  const totalSessions = () => stats().length;
  const totalQuestions = () => stats().reduce((s, x) => s + (x.total || 0), 0);
  const overallAcc = () => {
    const list = stats();
    const total = list.reduce((s, x) => s + (x.total || 0), 0);
    const correct = list.reduce((s, x) => s + (x.correct || 0), 0);
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };
  const streakDays = () => loadStreakDays().length;
  const dailyDone = () => loadStreakDays().includes(new Date().toISOString().slice(0, 10));
  const errorBankCount = () => loadErrorBank().length;
  const unlockedCount = () => loadAchievements().length;

  /* 日期走 i18n：英文界面不能出现「月 / 日」 */
  const dateLabel = () => {
    const d = new Date();
    try {
      if (lang() === "en") {
        return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
      }
      return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
    } catch {
      return d.toLocaleDateString();
    }
  };

  return (
    <div
      class="glass-panel"
      onKeyDown={(e) => {
        if (e.key === "Enter" && page() === "practice" && !practice.inputDisabled()) practice.submitAnswer();
        else if (e.key === "Enter" && page() === "practice" && !practice.nextDisabled()) practice.nextQuestion();
      }}
    >
      <Header
        isDark={isDark()}
        onToggleTheme={toggleTheme}
        lang={lang()}
        onToggleLang={toggleLang}
        page={page()}
        onBack={() => setPage("settings")}
      />

      {/* ── Achievement Toast ── */}
      <Show when={newAchvToast()}>
        <div class="achv-toast" role="status" aria-live="polite">
          <span class="achv-toast-text">{newAchvToast()}</span>
        </div>
      </Show>

      {/* ══════════════ 设置 / 首页 ══════════════ */}
      <Show when={page() === "settings"}>
        {/* ── Hero ── */}
        <section class="hero" aria-label={t(lang(), "appTitle")}>
          <span class="hero-eyebrow">
            📅 {dateLabel()} · {t(lang(), "appSubtitle")}
          </span>
          <h1 class="hero-title">
            {t(lang(), "heroTitlePre")}<em>{t(lang(), "heroTitleEm")}</em>{t(lang(), "heroTitlePost")}
          </h1>
          <p class="hero-sub">{t(lang(), "heroSub")}</p>

          {/* 今日挑战 —— 一键直达 */}
          <Show
            when={!dailyDone()}
            fallback={
              <button class="btn-primary" onClick={() => handleStartMode("daily")}>
                {t(lang(), "dailyDoneBtn")}
              </button>
            }
          >
            <button class="btn-primary" onClick={() => handleStartMode("daily")}>
              {t(lang(), "heroDailyBtn")}
            </button>
          </Show>
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-value">{streakDays()}</span>
              <span class="hero-stat-label">{t(lang(), "heroStatStreak")}</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{overallAcc()}<small>%</small></span>
              <span class="hero-stat-label">{t(lang(), "heroStatAcc")}</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-value">{totalQuestions()}</span>
              <span class="hero-stat-label">{t(lang(), "heroStatQuestions")}</span>
            </div>
          </div>
        </section>

        {/* ── 模式选择 ── */}
        <section class="section-card">
          <div class="section-title">{t(lang(), "modeLabel")}</div>
          <div class="mode-group" role="radiogroup" aria-label={t(lang(), "modeLabel")}>
            <For each={MODES}>
              {(m) => (
                <button
                  class="mode-chip"
                  classList={{ active: selectedMode() === m.id }}
                  role="radio"
                  aria-checked={selectedMode() === m.id}
                  onClick={() => setSelectedMode(m.id)}
                >
                  <span class="mode-chip-title">{t(lang(), m.labelKey)}</span>
                  <span class="mode-chip-desc">{t(lang(), m.descKey)}</span>
                </button>
              )}
            </For>
          </div>
          <Show when={selectedMode() === "error-review" && errorBankCount() === 0}>
            <p class="hero-sub" style={{ "margin-top": "12px" }}>
              {t(lang(), "noErrorsHint")}
            </p>
          </Show>
        </section>

        {/* ── 题型 / 数量 / 主题 ── */}
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
            hideModeGroup
          />        </Suspense>

        <div class="cta-sticky">
          <button class="btn-primary" onClick={handleStart}>
            {t(lang(), "startBtn")}
          </button>
        </div>

        {/* ── 学习进度 ── */}
        <Show when={totalSessions() > 0}>
          <div class="section-card">
            <div class="section-title">{t(lang(), "statsTitle")}</div>
            <ProgressDashboard lang={lang()} />
          </div>
        </Show>
      </Show>

      {/* ── Achievement Panel ── */}
      <Show when={page() === "settings"}>
        <div class="section-card achv-panel">
          <button
            class="section-title achv-toggle"
            onClick={toggleAchv}
            aria-expanded={achvOpen()}
          >
            <span>{t(lang(), "achvTitle")} · {unlockedCount()}/{ACHIEVEMENT_DEFS.length}</span>
            <span class="achv-toggle-caret" aria-hidden="true">{achvOpen() ? "▾" : "▸"}</span>
          </button>
          <Show when={achvOpen()}>
            <div class="achv-grid">
              <For each={ACHIEVEMENT_DEFS}>
                {(achv) => {
                  const unlocked = loadAchievements().find((a) => a.id === achv.id);
                  // Calculate progress for each achievement
                  const achvStats = loadStatsHistory();
                  let progress = 0, maxProgress = 1;
                  if (achv.id === "streak-7") {
                    const days = loadStreakDays();
                    progress = Math.min(days.length || 0, 7);
                    maxProgress = 7;
                  } else if (achv.id === "speed-star") {
                    const timedSessions = achvStats.filter(s => s.mode === "timed");
                    const best = Math.max(...timedSessions.map(s => s.correct || 0), 0);
                    progress = Math.min(best, 30);
                    maxProgress = 30;
                  } else if (achv.id === "perfectionist") {
                    const perfectSessions = achvStats.filter(s => s.accuracy === 1 && s.total >= 10).length;
                    progress = Math.min(perfectSessions, 1);
                    maxProgress = 1;
                  } else if (achv.id === "steady") {
                    const bestStreak = Math.max(...achvStats.map(s => s.maxStreak || 0), 0);
                    progress = Math.min(bestStreak, 20);
                    maxProgress = 20;
                  } else if (achv.id === "night-owl") {
                    const nightSessions = achvStats.filter(s => {
                      const h = new Date(s.date).getHours();
                      return h >= 23 || h < 5;
                    }).length;
                    progress = Math.min(nightSessions, 1);
                    maxProgress = 1;
                  } else if (achv.id === "lightning") {
                    const timedSessions = achvStats.filter(s => s.mode === "timed");
                    const best = timedSessions.filter(s => s.avgTime < 3).length;
                    progress = Math.min(best, 1);
                    maxProgress = 1;
                  } else if (achv.id === "perfect-daily") {
                    const dailySessions = achvStats.filter(s => s.mode === "daily" && s.accuracy === 1);
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
          </Show>
        </div>
      </Show>

      {/* ══════════════ 练习 ══════════════ */}
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

      {/* ══════════════ 结果 ══════════════ */}
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

        <div class="btn-row" style="margin-top: 14px;">
          <button class="btn-primary" onClick={handleRetry}>{t(lang(), "retryBtn")}</button>
          <Show when={loadErrorBank().length > 0}>
            <button class="btn-secondary" onClick={handleRetryErrors}>
              {t(lang(), "retryErrorsBtn")}
            </button>
          </Show>
          <button class="btn-secondary" onClick={() => setPage("settings")}>
            {t(lang(), "settingsTitle")}
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
    color: ["#DC4C1F", "#E0A83C", "#2E7D5B", "#3F5BA9", "#7A4E9E"][Math.floor(Math.random() * 5)],
    size: 6 + Math.random() * 8,
  }));
  return (
    <div class="confetti-overlay" aria-hidden="true">
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
