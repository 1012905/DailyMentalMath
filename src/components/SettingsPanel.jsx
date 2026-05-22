import { For, Show } from "solid-js";
import { t } from "../lib/i18n.js";
import { QUESTION_TYPES, TYPE_GROUPS } from "../lib/math.js";

const THEMES = [
  { id: "pink", labelKey: "themePink", color: "#e880a8" },
  { id: "blue", labelKey: "themeBlue", color: "#6aaaeb" },
  { id: "green", labelKey: "themeGreen", color: "#5bbf7a" },
  { id: "purple", labelKey: "themePurple", color: "#b48ad9" },
];

const MODES = [
  { id: "free", labelKey: "modeFree", descKey: "modeDescFree" },
  { id: "timed", labelKey: "modeTimed", descKey: "modeDescTimed" },
  { id: "daily", labelKey: "modeDaily", descKey: "modeDescDaily" },
  { id: "error-review", labelKey: "modeError", descKey: "modeDescError" },
];

export default function SettingsPanel(props) {
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
    <div class="section-card" style={{
      animation: "cardFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
    }}>
      <div class="section-title">{t(props.lang, "settingsTitle")}</div>

      {/* Mode Selection */}
      <div style={{ "margin-bottom": "18px" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", width: "100%", display: "block", marginBottom: "8px" }}>
          {t(props.lang, "modeLabel")}
        </span>
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

      {/* Question Type Selection */}
      <div style={{ "margin-bottom": "16px" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", width: "100%", display: "block", marginBottom: "8px" }}>
          {t(props.lang, "typeLabel") || "练习题型"}
        </span>
        <For each={grouped()}>
          {(group) => (
            <div style={{ "margin-bottom": "10px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 500 }}>
                {t(props.lang, group.labelKey)}
              </div>
              <div class="type-grid">
                <For each={group.types}>
                  {(qt) => (
                    <button
                      class="type-chip"
                      classList={{ active: props.questionType === qt.id }}
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

      {/* Question count (only for free mode) */}
      <Show when={props.selectedMode === "free"}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{t(props.lang, "countLabel")}</span>
          <input type="number" value={props.count}
            onInput={(e) => { const val = parseInt(e.target.value, 10); if (!isNaN(val) && val > 0) props.onCountChange(val); }}
            min="1" max="10000" step="1"
            style={{ width: "90px", background: "rgba(255,255,255,0.2)", border: "1.5px solid var(--glass-border)", borderRadius: "60px", padding: "8px 14px", fontSize: "0.95rem", color: "var(--text-primary)", outline: "none", textAlign: "center", fontFamily: "inherit" }} />
          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{t(props.lang, "countHint")}</span>
        </div>
      </Show>

      <div style={{ height: "1px", background: "var(--glass-border)", margin: "0 0 16px", opacity: 0.5 }} />

      <div class="section-title" style={{ fontSize: "0.92rem", marginBottom: "12px" }}>
        🎨 {t(props.lang, "themeTitle")}
      </div>
      <div class="theme-picker">
        <For each={THEMES}>
          {(tItem) => (
            <button class="theme-swatch" classList={{ active: props.currentTheme === tItem.id }} style={{ "--swatch-color": tItem.color }}
              onClick={() => props.onThemeChange(tItem.id)} aria-label={t(props.lang, tItem.labelKey)}>
              <span class="theme-swatch-circle" />
              <span class="theme-swatch-label">{t(props.lang, tItem.labelKey)}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
