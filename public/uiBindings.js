
// uiBindings.js
let initialized = false;
let openDropdown = null;

export function initUIBindings() {
  if (initialized) return;
  initialized = true;

  document.addEventListener("click", (e) => {
    if (e.target.closest("#btnStreamApply")) {
      document.dispatchEvent(new CustomEvent("ui:apply"));
    }

    if (e.target.closest("#btnStreamReset")) {
      document.dispatchEvent(new CustomEvent("ui:reset"));
    }

    const btn = e.target.closest(".pwSelectBtn");
    if (btn) {
      const dropdown = btn.closest(".pwSelect");

      if (openDropdown && openDropdown !== dropdown) {
        openDropdown.classList.remove("open");
      }

      dropdown.classList.toggle("open");
      openDropdown = dropdown.classList.contains("open")
        ? dropdown
        : null;

      return;
    }

    if (openDropdown && !e.target.closest(".pwSelect")) {
      openDropdown.classList.remove("open");
      openDropdown = null;
    }

    // === Universal UI → Action bridge (state-driven) ===
    const ACTION_MAP = {
      btnPlayPause: "VIDEO_TOGGLE",
      btnMute: "AUDIO_TOGGLE",
      btnFullscreen: "VIDEO_FULLSCREEN",
      btnPiP: "VIDEO_PIP",
      btnSync: "SYNC_REQUEST"
    };

    document.addEventListener("click", (e) => {
      const button = e.target.closest("button[id]");
      if (!button) return;

      const type = ACTION_MAP[button.id];
      if (!type) return;

      document.dispatchEvent(
        new CustomEvent("ui:action", { detail: { type } })
      );
    });

    // Video surface click toggles playback (local-only, state driven)
    document.addEventListener("click", (e) => {
      const video = e.target.closest("video");
      if (!video) return;

      document.dispatchEvent(
        new CustomEvent("ui:action", { detail: { type: "VIDEO_TOGGLE" } })
      );
    });

  });
}

