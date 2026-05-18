import { supabase } from "./supabase";

export interface PlatformSettings {
  commission_base: number;
  min_order: number;
  travel_base_cost: number;
  travel_price_per_km: number;
  travel_base_radius: number;
  travel_min_surcharge: number;
  travel_max_surcharge: number;
  payout_min: number;
  payout_hold_days: number;
  performer_search_timeout: number;
  client_confirm_timeout: number;
  auto_complete_hours: number;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  commission_base: 15,
  min_order: 500,
  travel_base_cost: 300,
  travel_price_per_km: 25,
  travel_base_radius: 5,
  travel_min_surcharge: 100,
  travel_max_surcharge: 2000,
  payout_min: 1000,
  payout_hold_days: 3,
  performer_search_timeout: 30,
  client_confirm_timeout: 60,
  auto_complete_hours: 24,
};

export async function loadPlatformSettings(): Promise<PlatformSettings> {
  const { data } = await supabase.from("platform_settings").select("key, value");
  if (!data || data.length === 0) return DEFAULT_SETTINGS;

  const result = { ...DEFAULT_SETTINGS };
  for (const row of data) {
    const key = row.key as keyof PlatformSettings;
    if (key in result) {
      (result as Record<string, number>)[key] = parseFloat(row.value) || 0;
    }
  }
  return result;
}

export async function savePlatformSettings(settings: Partial<PlatformSettings>): Promise<void> {
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }));
  await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
}
