import { For, Show, createSignal } from "solid-js";
import { t } from "../lib/i18n.js";
import { QUESTION_TYPES, TYPE_GROUPS } from "../lib/math.js";
import { isSoundOn, isSpeechOn, setSoundOn, setSpeechOn } from "../lib/prefs.js";
import { playCorrect, unlockAudio } from "../lib/feedback.js";

const THEMES = [
  { id: "pink", labelKey: "themePink", color: "#DC4C1F" },
  { id: "blue", labelKey: "themeBlue", color: "#3F5BA9" },
  { id: "green", labelKey: "themeGreen", color: "#2E7D5B" },
  { id: "purple", labelKey: "themePurple", color: "#7A4E9E" },
];

const MODES = [
  { id: "free", labelKey: "modeFree", descKey: "modeDescFree" },
  { id: "timed", labelKey: "modeTimed", descKey: "modeDescTimed" },
  { id: "daily", labelKey: "modeDaily", descKey: "modeDescDaily" },
  { id: "error-review", labelKey: "modeError", descKey: "modeDescError" },
];

export default function SettingsPanel(props) {
  const [soundOn, setSound] = createSignal(isSoundOn());
  const [speechOn, setSpeech] = createSignal(isSpeechOn());

  const toggleSound = () => {
    const next = setSoundOn(!soundOn());
    setSound(next);
    if (next) { unlockAudio(); playCorrect(); }   // 开启时立刻给个试听
  };
  const toggleSpeech = () => setSpeech(setSpeechOn(!speechOn()));

  // Group question types
  const grouped = () => {
    const groups = {};
    TYPE_GROUPS.forEach((g) => { groups[g.id] = []; });
    QUESTION_TYPES.forEach((t) => {
      if (groups[t.group]) groups[t.group].push(t);
    });
    return TYPE_GROUPS.filter((g) => groups[g.id].length > 0).map((g) => ({
      ...g,
      types: groups[g.id],
    }));
  };

  return (
    <div class="section-card">
      <div class="section-title">{t(props.lang, "typeLabel")}</div>

      {/* 模式选择：默认隐藏（模式选择器已上提到首页 Hero 下方，
          通过 hideModeGroup 避免同一页出现两个模式选择器） */}
      <Show when={!props.hideModeGroup}>
        <div class="settings-field">
          <span class="settings-field-label">{t(props.lang, "modeLabel")}</span>
          <div class="mode-group">
            <For each={MODES}>
              {(m) => (
                <button
                  class="mode-chip"
                  classList={{ active: props.selectedMode === m.id }}
                  onClick={() => props.onModeChange(m.id)}
                >
                  <span class="mode-chip-title">{t(props.lang, m.labelKey)}</span>
                  <span class="mode-chip-desc">{t(props.lang, m.descKey)}</span>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* 题型分组 */}
      <div class="settings-field">
        <For each={grouped()}>
          {(group) => (
            <div class="type-group">
              <div class="type-group-label">{t(props.lang, group.labelKey)}</div>
              <div class="type-grid">
                <For each={group.types}>
                  {(qt) => (
                    <button
                      class="type-chip"
                      classList={{ active: props.questionType === qt.id }}
                      aria-pressed={props.questionType === qt.id}
                      onClick={() => props.onTypeChange(qt.id)}
                    >
                      {t(props.lang, qt.labelKey)}
                    </button>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* 题目数量（仅自由练习） */}
      <Show when={props.selectedMode === "free"}>
        <div class="settings-inline">
          <label class="settings-field-label" for="dmm-count">{t(props.lang, "countLabel")}</label>
          <input
            id="dmm-count"
            type="number"
            value={props.count}
            onInput={(e) => { const val = parseInt(e.target.value, 10); if (!isNaN(val) && val > 0) props.onCountChange(val); }}
            min="1" max="10000" step="1"
          />
          <span class="settings-hint">{t(props.lang, "countHint")}</span>
        </div>
      </Show>

      <div class="settings-divider" />

      {/* 声音与播报 */}
      <div class="section-title" style={{ "margin-bottom": "12px" }}>{t(props.lang, "feedbackTitle")}</div>
      <div class="type-grid">
        <button
          class="type-chip"
          classList={{ active: soundOn() }}
          aria-pressed={soundOn()}
          onClick={toggleSound}
        >
          {soundOn() ? `🔊 ${t(props.lang, "soundOn")}` : `🔇 ${t(props.lang, "soundOff")}`}
        </button>
        <button
          class="type-chip"
          classList={{ active: speechOn() }}
          aria-pressed={speechOn()}
          onClick={toggleSpeech}
        >
          {speechOn() ? `🗣️ ${t(props.lang, "speechOn")}` : `🤐 ${t(props.lang, "speechOff")}`}
        </button>
      </div>

      <div class="settings-divider" />

      {/* 主题配色 */}
      <div class="section-title" style={{ "margin-bottom": "12px" }}>{t(props.lang, "themeTitle")}</div>
      <div class="theme-picker">
        <For each={THEMES}>
          {(tItem) => (
            <button
              class="theme-swatch"
              classList={{ active: props.currentTheme === tItem.id }}
              style={{ "--swatch-color": tItem.color }}
              onClick={() => props.onThemeChange(tItem.id)}
              aria-label={t(props.lang, tItem.labelKey)}
              aria-pressed={props.currentTheme === tItem.id}
            >
              <span class="theme-swatch-circle" />
              <span class="theme-swatch-label">{t(props.lang, tItem.labelKey)}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
