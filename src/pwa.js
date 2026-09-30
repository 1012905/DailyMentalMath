/* 口算天天练 (DailyMentalMath) — PWA service-worker registration.
 *
 * Deliberately a separate module (imported from index.html, not from
 * src/index.jsx) so the app entry point stays untouched.
 *
 * The sw.js URL is relative, so the registration is correct both on
 * https://<user>.github.io/<repo>/ and on a local preview server. Browsers only
 * allow service workers on secure origins, so plain-HTTP LAN testing silently
 * skips registration — the app itself keeps working without one.
 */

const SW_URL = "./sw.js";

/** True on https:// and on the localhost-family origins browsers treat as secure. */
function isSecureContextForSW() {
  if (window.isSecureContext) return true;
  const { hostname, protocol } = window.location;
  return protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function log(...args) {
  console.info("[pwa]", ...args);
}

async function register() {
  if (!("serviceWorker" in navigator)) {
    log("service workers unsupported — running as a plain web app");
    return null;
  }
  if (!isSecureContextForSW()) {
    log("insecure origin — service worker registration skipped");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, { scope: "./" });

    if (registration.waiting) log("update ready");
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          log("new version cached — takes effect on the next launch");
        }
      });
    });

    log("service worker registered, scope:", registration.scope);
    return registration;
  } catch (error) {
    // Never let an offline-capability failure break the app itself.
    console.warn("[pwa] service worker registration failed:", error);
    return null;
  }
}

if (import.meta.env.DEV) {
  // A dev-server service worker would cache unbundled modules and fight HMR.
  log("dev build — service worker registration skipped");
} else if (document.readyState === "complete") {
  register();
} else {
  window.addEventListener("load", register, { once: true });
}
