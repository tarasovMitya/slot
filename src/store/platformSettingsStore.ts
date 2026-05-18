import { create } from "zustand";
import { loadPlatformSettings, savePlatformSettings, DEFAULT_SETTINGS } from "../lib/platformSettings";
import type { PlatformSettings } from "../lib/platformSettings";

interface PlatformSettingsState {
  settings: PlatformSettings;
  isLoaded: boolean;
  load: () => Promise<void>;
  save: (patch: Partial<PlatformSettings>) => Promise<void>;
}

export const usePlatformSettingsStore = create<PlatformSettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  load: async () => {
    try {
      const settings = await loadPlatformSettings();
      set({ settings, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  save: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    await savePlatformSettings(patch);
  },
}));
