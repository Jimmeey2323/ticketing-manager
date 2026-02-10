export const UI_PREFERENCES_STORAGE_KEY = "app-ui-settings";

export interface UiPreferences {
  theme: "light" | "dark" | "system";
  compactMode: boolean;
  animationsEnabled: boolean;
}

export const defaultUiPreferences: UiPreferences = {
  theme: "system",
  compactMode: false,
  animationsEnabled: true,
};

export function loadUiPreferences(): UiPreferences {
  try {
    const raw = localStorage.getItem(UI_PREFERENCES_STORAGE_KEY);
    if (!raw) return defaultUiPreferences;
    const parsed = JSON.parse(raw);
    return {
      ...defaultUiPreferences,
      ...parsed,
    };
  } catch {
    return defaultUiPreferences;
  }
}

export function saveUiPreferences(preferences: UiPreferences): void {
  localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

export function applyUiPreferences(preferences: UiPreferences): void {
  const body = document.body;
  body.classList.toggle("compact-mode", preferences.compactMode);
  body.classList.toggle("reduce-motion", !preferences.animationsEnabled);
}

