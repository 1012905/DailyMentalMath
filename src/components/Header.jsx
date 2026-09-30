import { Show } from "solid-js";
import { t } from "../lib/i18n.js";

export default function Header(props) {
  return (
    <header class="app-header">
      <Show when={props.page && props.page !== "settings"}>
        <button
          class="icon-btn header-back"
          onClick={props.onBack}
          aria-label={t(props.lang, "settingsTitle")}
          title={t(props.lang, "settingsTitle")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 4L6 9l5 5" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </Show>

      <div class="header-left">
        <h1>{t(props.lang, "appTitle")}</h1>
        <span class="header-sub">{t(props.lang, "appSubtitle")}</span>
      </div>

      <div class="header-actions">
        <button
          class="lang-switch-btn"
          onClick={props.onToggleLang}
          aria-label={t(props.lang, "langAria")}
        >
          {t(props.lang, "langSwitch")}
        </button>

        <button
          class="icon-btn"
          onClick={props.onToggleTheme}
          aria-label={props.isDark ? t(props.lang, "ariaToggleThemeLight") : t(props.lang, "ariaToggleTheme")}
          aria-pressed={props.isDark}
          title={props.isDark ? t(props.lang, "ariaThemeLight") : t(props.lang, "ariaThemeDark")}
        >
          <Show
            when={props.isDark}
            fallback={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.8" />
                <path d="M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20.5 14.6A8.6 8.6 0 1 1 9.4 3.5a7 7 0 0 0 11.1 11.1Z"
                stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            </svg>
          </Show>
        </button>
      </div>
    </header>
  );
}
